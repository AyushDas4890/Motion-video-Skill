"""Gate: voice-to-bed ratio >= floor in EVERY word window.  You cannot listen, so this (and --audit) is how the mix is judged.
  python check_ratio.py [voice_proc.wav] [bed_final.wav] [caps.json] [min_db]      exit 1 if any word < min_db (default mix.floor_db = 15)
  python check_ratio.py --audit [--music music.wav] [--sfx sfx.wav] [--final final.wav]   measurements -> audio_audit.json
Ratio = RMS of the voice vs RMS of the bed over each word window, both mono-summed and band-limited to 300 Hz-6 kHz
(4th-order Butterworth, zero phase), measured on the pre-master stems (the master gain is common to both).
--audit adds: master R128 (I / TP / LRA) and length; music energy share <1k / 1-4k / >4k during words vs outside;
LUFS per score section (score_plan.json); swell rise (momentary loudness 0.3 s after each section start / payoff minus the
trough 2.5-0.3 s before); top pitch classes just after the payoff (chroma 60 Hz-2 kHz); digital silence in stops;
sfx stem LU under the music; a click scan (10 ms blocks whose 2nd difference spikes > 60x the local median)."""
import sys, os, json
import numpy as np
from mixlib import W, SR, CFG, load, band, words, word_ratios, path, loudness, lufs, band_share


def main(voice, bed, caps=None, min_db=None):
    min_db = float(CFG['mix']['floor_db'] if min_db is None else min_db)
    v, b = load(voice), load(bed)
    n = min(len(v), len(b))
    ws = words(caps)
    r = word_ratios(band(v[:n]), band(b[:n]), ws)
    order = np.argsort(r)
    print(f'{len(ws)} words  min {r.min():.2f} dB  median {np.median(r):.2f} dB  below {min_db:g}: {(r < min_db).sum()}')
    for i in order[:10]:
        s, e, w = ws[i]
        print(f'  {r[i]:7.2f} dB  {s:7.2f}-{e:7.2f}  {w}')
    print('PASS' if not (r < min_db).any() else 'FAIL')
    return int((r < min_db).any())


PC = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']


def chroma(x, t, d=0.55):
    m = x[int(t * SR):int((t + d) * SR)].mean(1)
    if len(m) < 1024:
        return []
    P = np.abs(np.fft.rfft(m * np.hanning(len(m)))) ** 2
    f = np.fft.rfftfreq(len(m), 1 / SR)
    k = (f >= 60) & (f <= 2000)
    pcs = np.round(12 * np.log2(f[k] / 440) + 69).astype(int) % 12
    c = np.bincount(pcs, weights=P[k], minlength=12)
    return [PC[i] for i in np.argsort(c)[::-1][:5] if c[i] > 0.08 * c.max()]


def clicks(x, thr=60):
    m = x.mean(1)
    d2 = np.abs(np.diff(m, 2))
    blk = 480
    nb = len(d2) // blk
    bm = d2[:nb * blk].reshape(nb, blk).max(1)
    from scipy.ndimage import median_filter
    med = median_filter(bm, size=101, mode='nearest')
    hit = np.nonzero((bm > thr * np.maximum(med, 1e-7)) & (bm > max(1e-4, 0.002 * bm.max())))[0]
    return [round(i * blk / SR, 2) for i in hit]


def audit(music, sfx, final):
    ws = words()
    out = {}
    if os.path.exists(final):
        L = loudness(final)
        x = load(final)
        out['final'] = {'file': final, 'seconds': round(len(x) / SR, 3), 'lufs': L['i'], 'tp_dbtp': L['tp'], 'lra': L['lra']}
        vp, bp = path('voice'), path('bed')
        if os.path.exists(vp) and os.path.exists(bp):
            v, b = load(vp), load(bp)
            n = min(len(v), len(b))
            r = word_ratios(band(v[:n]), band(b[:n]), ws)
            out['final']['word_ratio_min_db'] = round(float(r.min()), 2)
            out['final']['word_ratio_median_db'] = round(float(np.median(r)), 2)
            out['final']['words_below_floor'] = int((r < CFG['mix']['floor_db']).sum())
    if os.path.exists(music):
        x = load(music)
        mu = {'file': music, 'seconds': round(len(x) / SR, 3), 'lufs': round(lufs(x), 2), 'peak_dbfs': round(float(20 * np.log10(np.abs(x).max() + 1e-12)), 2),
              'band_share_pct_<1k_1-4k_>4k': band_share(x, ws)}
        nz = np.nonzero(np.abs(x).max(1) > 0)[0]
        mu['last_nonzero_s'] = round(float(nz[-1]) / SR, 3) if len(nz) else None
        sp = W + 'score_plan.json'
        if os.path.exists(sp):
            plan = json.load(open(sp, encoding='utf-8'))
            mu['sections'] = []
            for s in plan['sections']:
                row = {'t0': s['t0'], 't1': s['t1'], 'mood': s['mood'], 'lufs': round(float(lufs(x, s['t0'], s['t1'])), 1)}
                t = s['t0']
                if t > 2.6:
                    mom = lambda u: lufs(x, u - 0.2, u + 0.2, gated=False)
                    trough = min(mom(u) for u in np.arange(t - 2.5, t - 0.29, 0.1))
                    row['swell_rise_db'] = round(float(mom(t + 0.3) - trough), 1)
                mu['sections'].append(row)
            if plan.get('payoff') is not None:
                mu['payoff'] = {'t': plan['payoff'], 'chroma_top': chroma(x, plan['payoff'] + 0.05), 'expected_major_tonic': plan.get('payoff_major')}
            mu['stops_digital_silence'] = [[a, b_, bool(np.all(x[int((a + 0.05) * SR):int((b_ - 0.05) * SR)] == 0))] for a, b_ in plan.get('stops', [])]
        mu['click_suspects_s'] = clicks(x)[:20]
        out['music'] = mu
    if os.path.exists(sfx):
        y = load(sfx)
        sx = {'file': sfx, 'seconds': round(len(y) / SR, 3), 'lufs': round(lufs(y), 2), 'peak_dbfs': round(float(20 * np.log10(np.abs(y).max() + 1e-12)), 2)}
        if 'music' in out:
            sx['lu_under_music'] = round(out['music']['lufs'] - sx['lufs'], 1)
        cs, cp = clicks(y), W + 'sfx_cues.json'
        if os.path.exists(cp):                       # impulsive cues (hits, ticks, nib clicks, grains) are meant to spike: keep the unexplained ones
            cq = json.load(open(cp, encoding='utf-8'))
            ok = lambda u: any(c['t'] - max(0.5, c.get('dur', 0) + 0.2) <= u <= max(c.get('end', c['t']), c['t'] + c.get('dur', 0)) + 0.35 for c in cq)
            sx['click_suspects_explained'] = sum(ok(u) for u in cs)
            cs = [u for u in cs if not ok(u)]
        sx['click_suspects_s'] = cs[:20]
        out['sfx'] = sx
    json.dump(out, open(W + 'audio_audit.json', 'w'), indent=1, default=float)
    print(json.dumps(out, indent=1))
    return 0


if __name__ == '__main__':
    a = sys.argv[1:]
    if '--audit' in a:
        g = lambda k, d: a[a.index(k) + 1] if k in a else d
        sys.exit(audit(g('--music', path('music')), g('--sfx', path('sfx')), g('--final', path('out'))))
    if a and a[0] in ('-h', '--help'):
        sys.exit(__doc__)
    sys.exit(main(a[0] if len(a) > 0 else path('voice'), a[1] if len(a) > 1 else path('bed'),
                  a[2] if len(a) > 2 else None, float(a[3]) if len(a) > 3 else None))
