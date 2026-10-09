"""python mix.py [music.wav] [sfx.wav] [out.wav] [--len s] [--voice voice_proc.wav] [--floor 15]
The voice is sacred: it is never touched here (voice.py made it). Only the bed (music + sfx) moves.
Per bus: EQ carve (broad dip centred 2.4 kHz + a 5.8 kHz cut so glass/air never sits on sibilance) -> base level
(music bus integrated = voice LUFS - music_under_voice_lu (14); sfx gets the same gain + sfx_trim_db, keeping the composer's
music:sfx balance) -> sidechain duck by the voice (ffmpeg sidechaincompress; its gain curve is captured with a DC probe and
the threshold is calibrated until the median duck over word windows hits duck_db) -> hook lift (bed before the first word
raised toward voice-2.5 LU, measured) -> coda lift (music after the last word raised toward voice-2.5 LU, measured) ->
BREATHS (config: music eases down under a line / a positive value lifts both buses) -> per-word bed automation (30 ms
ramps outside the word, short gaps bridged) until EVERY word has voice/bed >= floor_db (300-6k band RMS, see check_ratio.py)
-> auto-breaths (clusters of deep per-word cuts become one smooth breath on the guilty bus, then automation re-runs)
-> sum -> two-pass loudnorm to target_lufs (-14), TP <= tp (-1.5 dBTP).
Writes out.wav (48 kHz stereo 24-bit), bed_final.wav (ducked+automated bed at voice_proc scale), mix_report.json."""
import json, argparse, os
import numpy as np
from mixlib import W, SR, CFG, ff, load, save, fit as _fit, db, loudness, normalize, words, band, word_ratios, film_len, \
    tmp, path, lufs, anchor

ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
ap.add_argument('music', nargs='?', default=None); ap.add_argument('sfx', nargs='?', default=None); ap.add_argument('out', nargs='?', default=None)
ap.add_argument('--len', type=float, default=None, help='film length in seconds (default: audio_config film_len / beats.json)')
ap.add_argument('--voice', default=None)
ap.add_argument('--floor', type=float, default=None, help='minimum voice-over-bed dB per word (default mix.floor_db = 15)')
A = ap.parse_args()
MC = CFG['mix']
MUSIC, SFX, OUT, VOICE = A.music or path('music'), A.sfx or path('sfx'), A.out or path('out'), A.voice or path('voice')
WS = words()
FILM = film_len(WS, A.len)
N = round(FILM * SR)
fit = lambda x: _fit(x, N)
TARGET = A.floor if A.floor is not None else float(MC['floor_db'])
MARGIN = float(MC['floor_margin_db'])
RAMP, BRIDGE = float(MC['ramp_s']), float(MC['bridge_s'])
T = (np.arange(N, dtype=np.float64) / SR)

voice = fit(load(VOICE))
vI = loudness(VOICE)['i']
vb = band(voice)
v_word_db = float(np.median([db(np.mean(voice[int(s * SR):int(e * SR) + 1, 0] ** 2)) for s, e, _ in WS]))
rep = {'film_seconds': FILM, 'voice_lufs': vI, 'floor_db': TARGET, 'words': len(WS),
       'ratio_measure': 'RMS per word window, mono sum, 300-6000 Hz 4th-order Butterworth (zero phase)'}


def word_mean_db(g):
    gd = 20 * np.log10(np.maximum(g, 1e-6))
    return np.array([gd[int(s * SR):int(e * SR) + 1].mean() for s, e, _ in WS], np.float64)


def duck_gain(p, thr):
    """sidechaincompress output = input * gain(voice), so a DC probe returns the gain curve itself."""
    ff('-f', 'lavfi', '-i', f'aevalsrc=0.5|0.5:s={SR}:d={FILM}', '-i', VOICE, '-filter_complex',
       f"[0:a][1:a]sidechaincompress=threshold={thr:.2f}dB:ratio={p['ratio']}:attack={p['attack_ms']}"
       f":release={p['release_ms']}:knee=2.8:detection=rms[o]", '-map', '[o]', '-c:a', 'pcm_f32le', tmp('duck_probe.wav'))
    return (fit(load(tmp('duck_probe.wav')))[:, 0] / 0.5).astype(np.float32)


def fade_env(t0, t1, depth, fd):
    """dB-linear plateau envelope (0 outside [t0, t1], `depth` dB inside, `fd` s ramps inside the window) -> gain array."""
    e = np.minimum(np.clip((T - t0) / fd, 0, 1), np.clip((t1 - T) / fd, 0, 1)) * depth
    return (10 ** (e / 20)).astype(np.float32)


buses, gain_db = {}, None
for name, src in (('music', MUSIC), ('sfx', SFX)):
    p = MC[name]
    if not os.path.exists(src):
        print(f'note: {src} missing -> silent {name} bus')
        buses[name] = [np.zeros((N, 2), np.float32), np.ones(N, np.float32)]
        rep[name] = {'missing': src}
        continue
    ff('-i', src, '-af', f"equalizer=f={p['eq_hz']}:t=o:w={p['eq_w']}:g={p['eq_db']},equalizer=f={p['hs_hz']}:t=o:w={p['hs_w']}:g={p['hs_db']}",
       '-ar', str(SR), '-c:a', 'pcm_f32le', tmp(f'{name}_eq.wav'))
    x = fit(load(tmp(f'{name}_eq.wav')))
    if gain_db is None:                                  # set from the music bus (or the sfx bus if there is no music), reused for sfx
        li = loudness(tmp(f'{name}_eq.wav'))['i']
        gain_db = float(vI - MC['music_under_voice_lu'] - li) if li > -60 else 0.0
    gdb = gain_db + (MC['sfx_trim_db'] if name == 'sfx' else 0)
    x *= np.float32(10 ** (gdb / 20))
    thr = v_word_db - p['duck_db'] / (1 - 1 / p['ratio'])
    for _ in range(8):                                   # calibrate threshold -> median duck over words
        g = duck_gain(p, thr)
        duck = -np.median(word_mean_db(g))
        if abs(duck - p['duck_db']) < 0.3:
            break
        thr += (duck - p['duck_db']) / (1 - 1 / p['ratio'])
    wd = -word_mean_db(g)
    buses[name] = [x, g]
    rep[name] = {**p, 'base_gain_db': round(gdb, 2), 'bus_lufs_base': round(lufs(x), 2), 'threshold_dbfs': round(float(thr), 2),
                 'duck_db_median': round(float(np.median(wd)), 2),
                 'duck_db_p10_p90': [round(float(np.percentile(wd, 10)), 2), round(float(np.percentile(wd, 90)), 2)]}

# --- hook lift: the bed before the first word plays near dialogue level (measured, both buses) ---
hl, w0 = MC.get('hook_lift') or {}, WS[0][0] if WS else FILM
h1 = w0 - 0.04
if hl and hl.get('db') not in (None, 0) and h1 >= hl.get('min_window_s', 0.6):
    if hl['db'] == 'auto':
        bed_h = buses['music'][0][:int(h1 * SR)] + buses['sfx'][0][:int(h1 * SR)]
        meas = lufs(bed_h, 0, h1)
        lift = float(np.clip(vI + hl['target_re_voice_lu'] - meas, 0, hl['max_db'])) if np.isfinite(meas) else 0.0
    else:
        meas, lift = None, float(hl['db'])
    if lift > 0.05:
        e = fade_env(-1.0, h1, lift, hl.get('fade_s', 0.12))
        for k in ('music', 'sfx'):
            buses[k][0] *= e[:, None]
    rep['hook_lift'] = {'window_s': [0, round(h1, 3)], 'bed_lufs_before': None if meas is None else round(meas, 2), 'lift_db': round(lift, 2)}

# --- coda lift: music-only tail after the last word (measured, music bus only, after the last word so no ratio changes) ---
cl = MC.get('coda') or {}
last_end = WS[-1][1] if WS else 0
c_at = anchor(WS, cl.get('at')) if cl.get('at') not in (None, 'auto') else last_end + 0.3
if cl and cl.get('db') not in (None, 0) and FILM - c_at >= 2.0:
    assert c_at >= last_end - 1e-3, 'coda lift must start after the last word'
    if cl['db'] == 'auto':
        meas = lufs(buses['music'][0], c_at, FILM - 0.5)
        lift = float(np.clip(vI + cl['target_re_voice_lu'] - meas, 0, cl['max_db'])) if np.isfinite(meas) else 0.0
    else:
        meas, lift = None, float(cl['db'])
    if lift > 0.05:
        e = (10 ** (lift * np.clip((T - c_at) / cl['fade_s'], 0, 1) / 20)).astype(np.float32)
        buses['music'][0] *= e[:, None]
    rep['coda_lift'] = {'from_s': round(c_at, 3), 'fade_s': cl['fade_s'], 'music_lufs_before': None if meas is None else round(meas, 2),
                        'lift_db': round(lift, 2), 'last_word_end_s': last_end}

# --- configured breaths: (t0, t1, dB, fade s); negative = music eases down under a line, positive = lift both buses ---
BREATHS = []
for b in MC.get('breaths') or []:
    t0, t1, d, fd = (b['t0'], b['t1'], b['db'], b.get('fade', 0.45)) if isinstance(b, dict) else (list(b) + [0.45])[:4]
    BREATHS.append((anchor(WS, t0), anchor(WS, t1), float(d), float(fd)))


def apply_breath(t0, t1, d, fd, which=('music',)):
    e = fade_env(t0, t1, d, fd)
    for k in which:
        buses[k][0] *= e[:, None]


for t0, t1, d, fd in BREATHS:
    apply_breath(t0, t1, d, fd, ('music', 'sfx') if d > 0 else ('music',))
rep['breaths'] = BREATHS


def stats(r):
    return {'min': round(float(r.min()), 2), 'median': round(float(np.median(r)), 2), f'below_{TARGET:g}': int((r < TARGET).sum())}


rep['ratio_no_duck'] = stats(word_ratios(vb, band(buses['music'][0] + buses['sfx'][0]), WS))


def envelope(att):
    """Per-word attenuation (dB) -> per-sample gain; trapezoids with RAMP outside each word, short gaps bridged."""
    t = np.arange(0, FILM + 0.002, 0.001)
    e = np.zeros_like(t)
    spans = [(s, en, a) for (s, en, _), a in zip(WS, att) if a > 0]
    spans += [(WS[i][1], WS[i + 1][0], min(att[i], att[i + 1])) for i in range(len(WS) - 1)
              if att[i] > 0 and att[i + 1] > 0 and 0 < WS[i + 1][0] - WS[i][1] < BRIDGE]
    for s, en, a in spans:
        i0, i1 = max(0, int((s - RAMP) * 1000)), int((en + RAMP) * 1000) + 2
        tt = t[i0:i1]
        e[i0:i1] = np.maximum(e[i0:i1], a * np.clip(np.minimum(tt - (s - RAMP), en + RAMP - tt) / RAMP, 0, 1))
    return (10 ** (-np.interp(T, t, e) / 20)).astype(np.float32)


def automate(bed0, label):
    att, env = np.zeros(len(WS)), np.ones(N, np.float32)
    for it in range(int(MC['max_passes'])):
        r = word_ratios(vb, band(bed0 * env[:, None]), WS)
        if it == 0:
            rep[f'ratio_ducked_before_automation{label}'] = stats(r)
        short = TARGET - r
        print(f'automation{label} pass {it}: min {r.min():.2f} dB, words below {TARGET}: {(short > 0).sum()}')
        if (short <= 0).all():
            break
        att += np.where(short > 0, short + MARGIN, 0)
        env = envelope(att)
    return att, env, r, it


ducked = lambda k: buses[k][0] * buses[k][1][:, None]
bed0 = ducked('music') + ducked('sfx')
att, env, r, it = automate(bed0, '')

# --- auto-breaths: a cluster of deep per-word cuts reads as pumping; replace it with one smooth breath and re-automate ---
ab = MC.get('auto_breaths')
rep['auto_breaths'] = []
if ab and att.max() > ab['trigger_db']:
    deep = [i for i in range(len(WS)) if att[i] > ab['trigger_db']]
    groups, cur = [], [deep[0]]
    for i in deep[1:]:
        if WS[i][0] - WS[cur[-1]][1] < ab['join_gap_s']:
            cur.append(i)
        else:
            groups.append(cur); cur = [i]
    groups.append(cur)
    mus, sfx = ducked('music'), ducked('sfx')
    for gidx in groups:
        t0, t1 = WS[gidx[0]][0] - ab['pad_s'], WS[gidx[-1]][1] + ab['pad_s']
        a_, b_ = int(t0 * SR), int(t1 * SR)
        em, es = float(np.mean(band(mus[a_:b_]) ** 2)), float(np.mean(band(sfx[a_:b_]) ** 2))
        which = ('music',) if em >= es else ('music', 'sfx')
        depth = -float(min(ab['max_db'], att[gidx].max()))
        apply_breath(t0, t1, depth, ab['fade_s'], which)
        rep['auto_breaths'].append({'t0': round(t0, 2), 't1': round(t1, 2), 'db': round(depth, 1), 'buses': list(which),
                                    'words': ' '.join(WS[i][2] for i in gidx), 'max_cut_before_db': round(float(att[gidx].max()), 2)})
    del mus, sfx
    print('auto-breaths:', [(b['t0'], b['t1'], b['db'], b['buses']) for b in rep['auto_breaths']])
    bed0 = ducked('music') + ducked('sfx')
    att, env, r, it = automate(bed0, '_after_breaths')

rep['ratio_final'] = stats(r)
rep['automation'] = {'words_automated': int((att > 0).sum()), 'words_total': len(WS), 'passes': it,
                     'max_cut_db': round(float(att.max()), 2), 'ramp_ms': RAMP * 1000, 'bridge_gap_s': BRIDGE,
                     'automated_words': [[WS[i][0], WS[i][2], round(float(att[i]), 2)] for i in np.nonzero(att)[0]]}
rep['worst_words'] = [[WS[i][0], WS[i][2], round(float(r[i]), 2)] for i in np.argsort(r)[:8]]
bed = bed0 * env[:, None]
save(path('bed'), bed)
save(tmp('mix_sum.wav'), voice + bed)
rep['master'] = normalize(tmp('mix_sum.wav'), OUT, MC['target_lufs'], MC['tp'], codec='pcm_s24le')
o = rep['master']['out']
if o['tp'] > MC['tp']:                                   # final safety trim
    ff('-i', OUT, '-af', f"volume={MC['tp'] - 0.05 - o['tp']:.2f}dB", '-c:a', 'pcm_s24le', tmp('trim_tmp.wav'))
    ff('-i', tmp('trim_tmp.wav'), '-c:a', 'pcm_s24le', OUT)
    rep['master']['trim'] = True
    rep['master']['out'] = o = loudness(OUT)
rep['final'] = {'lufs': o['i'], 'tp_dbtp': o['tp'], 'lra': o['lra'], 'min_word_ratio_db': rep['ratio_final']['min'],
                'median_word_ratio_db': rep['ratio_final']['median']}
json.dump(rep, open(W + 'mix_report.json', 'w'), indent=1)
print(json.dumps({k: v for k, v in rep.items() if k not in ('automation', 'master')}, indent=1))
print(f"automated words: {rep['automation']['words_automated']}/{len(WS)}, max cut {rep['automation']['max_cut_db']} dB")
print(f"FINAL {OUT}: {o['i']} LUFS, TP {o['tp']} dBTP, LRA {o['lra']} LU, min word gap {rep['ratio_final']['min']} dB (floor {TARGET})")
