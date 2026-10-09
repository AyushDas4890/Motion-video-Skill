"""Voice chain: python voice.py [--src <video or audio>] [--len <film s>] [--offset <s>]
extract (48k mono) -> highpass -> [afftdn only if it measurably helps] -> EQ (mud cut only if measured, small presence lift
only if the 2.5-3.15 kHz bands sit low) -> acompressor (2.8:1, threshold calibrated to ~2.5 dB median gain reduction on
speech) -> [deesser only if sibilance measures high] -> dual-mono -> two-pass loudnorm to voice.lufs (-16) -> pad to film length.
The voice is never EQ'd/compressed by taste: every step is measured and kept only if the measurement says it helps.
Source: --src, else audio_config.json "voice_src", else the first video/audio path found in work/project.js.
Film time = source time - offset (--offset or "voice_offset"; 0 when the film starts where the take starts).
Writes voice_proc.wav (48 kHz stereo f32) + voice_report.json; prints every measurement."""
import json, argparse, os, re
import numpy as np
from mixlib import W, SR, CFG, ff, load, save, fit, words, db, normalize, band, film_len, tmp, path

ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
ap.add_argument('--src', default=None, help='speaker video/audio (default: audio_config voice_src, else project.js footage)')
ap.add_argument('--len', type=float, default=None, help='film length in s (default: audio_config film_len / beats.json)')
ap.add_argument('--offset', type=float, default=None, help='skip this many seconds of the source (film t = source t - offset)')
ap.add_argument('--out', default=None)
A = ap.parse_args()
VC = CFG['voice']


def find_src():
    if A.src:
        return A.src
    if CFG.get('voice_src'):
        s = CFG['voice_src']
        return s if os.path.isabs(s) else W + s
    pj = W + 'project.js'
    if os.path.exists(pj):
        for m in re.finditer(r"""['"]([^'"\n]+\.(?:mp4|mov|mkv|webm|m4a|wav|mp3|aac))['"]""", open(pj, encoding='utf-8').read(), re.I):
            p = m[1] if os.path.isabs(m[1]) else W + m[1]
            if os.path.exists(p):
                return p
    raise SystemExit('voice.py: no source. Pass --src <video> or set "voice_src" in audio_config.json')


SRC = find_src()
OFF = A.offset if A.offset is not None else float(CFG.get('voice_offset') or 0)
WS = words()
FILM = film_len(WS, A.len)
N = round(FILM * SR)
OUT = A.out or path('voice')
FR = 2048                                   # analysis frame (42.7 ms, 23 Hz bins)
THIRDS = 1000 * 2.0 ** (np.arange(-14, 11) / 3)   # 1/3-octave centres ~40 Hz .. 10 kHz


def masks(nf):
    """Per-frame speech mask (centre inside a word) and pause mask (>=150 ms from any word, inside the take)."""
    c = (np.arange(nf) + 0.5) * FR / SR
    sp, near = np.zeros(nf, bool), np.zeros(nf, bool)
    for s, e, _ in WS:
        sp |= (c >= s) & (c <= e)
        near |= (c >= s - 0.15) & (c <= e + 0.15)
    pa = ~near & (c > 0.2) & (c < WS[-1][1] + 1.4)
    if pa.sum() < 5:                        # no real pauses (>=150 ms from words): fall back to all non-speech frames
        pa = ~sp & (c < WS[-1][1] + 1.4)
    return sp, pa


def measure(x):
    nf = len(x) // FR
    fr = x[:nf * FR].reshape(nf, FR)
    P = np.abs(np.fft.rfft(fr * np.hanning(FR), axis=1)) ** 2
    f = np.fft.rfftfreq(FR, 1 / SR)
    sp, pa = masks(nf)
    lvl = db(np.mean(fr ** 2, axis=1))
    lvb = db(np.mean(band(x)[:nf * FR].reshape(nf, FR) ** 2, axis=1))
    bp = lambda lo, hi: P[:, (f >= lo) & (f < hi)].sum(1)
    ltas = P[sp].mean(0)
    L = db(np.array([ltas[(f >= c / 2 ** (1 / 6)) & (f < c * 2 ** (1 / 6))].sum() for c in THIRDS]))
    lf2 = np.log2(THIRDS)
    use = (THIRDS >= 100) & (THIRDS <= 8000) & ((THIRDS < 200) | (THIRDS > 400))
    dev = L - np.polyval(np.polyfit(lf2[use], L[use], 2), lf2)      # deviation from a smooth LTAS fit
    pick = lambda c: dev[np.argmin(abs(THIRDS - c))]
    k = (f >= 300) & (f < 6000)
    flat = np.exp(np.mean(np.log(P[:, k] + 1e-20), 1)) / (P[:, k].mean(1) + 1e-20)
    hf, mid = db(bp(5000, 9000)), db(bp(300, 3000))
    med = lambda v, m: float(np.median(v[m])) if m.any() else float('nan')
    return {
        'speech_level_dbfs': round(med(lvl, sp), 2),
        'noise_floor_dbfs_median': round(med(lvl, pa), 2),
        'snr_db': round(med(lvl, sp) - med(lvl, pa), 2),
        'speech_band_300_6k_dbfs': round(med(lvb, sp), 2),
        'pause_band_300_6k_dbfs': round(med(lvb, pa), 2),
        'band_snr_db': round(med(lvb, sp) - med(lvb, pa), 2),
        'speech_band_flatness_median': round(med(flat, sp), 4),
        'lf_below_80hz_re_speech_db': round(float(db(ltas[f < 80].sum()) - db(ltas.sum())), 2),
        'mud_250_350_dev_db': round(float((pick(250) + pick(315)) / 2), 2),
        'presence_2k5_3k15_dev_db': round(float((pick(2500) + pick(3150)) / 2), 2),
        'sibilance_p99_hf_minus_median_mid_db': round(float(np.percentile(hf[sp], 99) - np.median(mid[sp])), 2),
        'speech_frame_spread_p95_p10_db': round(float(np.percentile(lvl[sp], 95) - np.percentile(lvl[sp], 10)), 2),
        'pause_frames': int(pa.sum()), 'speech_frames': int(sp.sum()),
    }


def run(src, dst, af):
    ff('-i', src, '-af', af, '-ar', str(SR), '-c:a', 'pcm_f32le', dst)
    return load(dst, 1)[:, 0]


rep = {'src': SRC, 'offset_s': OFF, 'film_seconds': FILM}
a = ['-ss', f'{OFF:.4f}'] if OFF else []
ff(*a, '-i', SRC, '-vn', '-ar', str(SR), '-c:a', 'pcm_f32le', tmp('v_raw2.wav'))
st = load(tmp('v_raw2.wav'), 2)
rep['lr_correlation'] = round(float(np.corrcoef(st[:, 0], st[:, 1])[0, 1]), 4) if st[:, 0].std() > 0 and st[:, 1].std() > 0 else None
save(tmp('v_raw.wav'), st.mean(1))          # speech: process as mono (phone captures are dual-mono anyway)
rep['raw'] = measure(st.mean(1))
print(f"raw: speech {rep['raw']['speech_level_dbfs']} dBFS, floor {rep['raw']['noise_floor_dbfs_median']} dBFS, band SNR {rep['raw']['band_snr_db']} dB")

hpf = VC['hpf_hz']
run(tmp('v_raw.wav'), tmp('v_hp.wav'), f'highpass=f={hpf}:p=2')
hp = load(tmp('v_hp.wav'), 1)[:, 0]
rep['hpf'] = measure(hp)

# --- denoise: afftdn vs none, keep only if the band floor drops >=3 dB, speech loses <1 dB, flatness does not rise ---
h = rep['hpf']
nf = float(np.clip(round(h['noise_floor_dbfs_median']) if np.isfinite(h['noise_floor_dbfs_median']) else -70, -80, -20))
keep = False
if VC.get('denoise', 'auto') != 'off':
    dn = run(tmp('v_hp.wav'), tmp('v_dn.wav'), f'afftdn=nr=10:nf={nf}:tn=1')
    rep['afftdn'] = m = measure(dn)
    d = {'band_floor_drop_db': round(h['pause_band_300_6k_dbfs'] - m['pause_band_300_6k_dbfs'], 2),
         'speech_band_change_db': round(m['speech_band_300_6k_dbfs'] - h['speech_band_300_6k_dbfs'], 2),
         'flatness_change': round(m['speech_band_flatness_median'] - h['speech_band_flatness_median'], 4)}
    keep = VC.get('denoise') == 'on' or bool(d['band_floor_drop_db'] >= 3 and d['speech_band_change_db'] > -1.0 and d['flatness_change'] <= 0.01)
    d['keep'] = keep
    rep['denoise_decision'] = d
base = tmp('v_dn.wav') if keep else tmp('v_hp.wav')
cur = rep['afftdn'] if keep else rep['hpf']

# --- EQ from measurement ---
eq = []
mud = cur['mud_250_350_dev_db']
if mud > 1.5:
    eq.append(f'equalizer=f=300:t=o:w=0.8:g={-min(mud, 4):.1f}')
if VC['presence_db'] and cur['presence_2k5_3k15_dev_db'] < 2:
    eq.append(f"equalizer=f=3000:t=o:w=1.2:g={VC['presence_db']}")
rep['eq'] = eq
x = run(base, tmp('v_eq.wav'), ','.join(eq) or 'anull')
rep['eq_out'] = measure(x)

# --- gentle compression, threshold calibrated to the target median gain reduction on speech frames ---
R, GR = VC['comp_ratio'], VC['comp_gr_db']
thr = rep['eq_out']['speech_level_dbfs'] + 2
for _ in range(4):
    comp = f'acompressor=threshold={thr:.1f}dB:ratio={R}:attack=20:release=250:knee=2.8:detection=rms'
    x = run(tmp('v_eq.wav'), tmp('v_comp.wav'), comp)
    rep['comp_out'] = measure(x)
    gr = rep['eq_out']['speech_level_dbfs'] - rep['comp_out']['speech_level_dbfs']
    print(f'comp thr {thr:.1f} dBFS -> median GR {gr:.2f} dB')
    if abs(gr - GR) < 0.4:
        break
    thr += (gr - GR) / (1 - 1 / R)
rep['comp_gr_median_db'] = round(gr, 2)

# --- de-ess only if sibilant bursts exceed the median vowel band by the trigger ---
sib = rep['comp_out']['sibilance_p99_hf_minus_median_mid_db']
rep['deess'] = bool(sib >= VC['deess_trigger_db'])
if rep['deess']:
    x = run(tmp('v_comp.wav'), tmp('v_dess.wav'), 'deesser=i=0.4:m=0.5:f=0.5:s=o')
    rep['deess_out'] = measure(x)

# --- fit to the film, dual mono, two-pass loudnorm ---
if len(x) > N:
    late = [w for w in WS if w[1] > FILM]
    if late:
        raise SystemExit(f'voice.py: {len(late)} words end after the film length {FILM} s (first: {late[0]}); fix --len / film_len')
    f, n0 = int(0.05 * SR), len(x)
    x = x[:N].copy()
    x[-f:] *= np.linspace(1, 0, f)
    print(f'note: source is {n0 / SR:.2f} s, trimmed to the film length {FILM} s (no words lost)')
save(tmp('v_pre.wav'), np.repeat(fit(x, N)[:, None], 2, 1))
rep['loudnorm'] = normalize(tmp('v_pre.wav'), OUT, VC['lufs'], VC['tp'])
v = load(OUT)
rep['final'] = measure(v.mean(1))
rep['final_samples'], rep['final_seconds'] = len(v), round(len(v) / SR, 3)
rep['chain'] = [f'highpass=f={hpf}:p=2'] + ([f'afftdn=nr=10:nf={nf}:tn=1'] if keep else []) + eq + [comp] + \
               (['deesser=i=0.4:m=0.5:f=0.5:s=o'] if rep['deess'] else []) + ['dual-mono', 'pad', f"loudnorm I={VC['lufs']} TP={VC['tp']} linear"]
json.dump(rep, open(W + 'voice_report.json', 'w'), indent=1)
o = rep['loudnorm']['out']
print(json.dumps({k: rep[k] for k in ('chain', 'denoise_decision', 'comp_gr_median_db', 'deess') if k in rep}, indent=1))
print(f"voice_proc: {rep['final_seconds']} s, {o['i']} LUFS, TP {o['tp']} dBTP, LRA {o['lra']} LU, band SNR {rep['final']['band_snr_db']} dB -> {OUT}")
