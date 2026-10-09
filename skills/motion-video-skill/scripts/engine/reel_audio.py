"""Reel / short cut-down audio with its OWN music edit (never a cut of the film mix: chopped music jumps at every join).
  python reel_audio.py [--seg "113.31-114.59,0-0.8,17.56-22.98"] [--out reel_mix.wav]
Segments (film times): --seg, else audio_config.json reel.seg ([[a, b], ...], seconds or word anchors), else SEG in reel.py.
Voice + SFX follow the picture cuts (short join fades). The music is ONE continuous edit:
  A = the score from the start of the section the reel opens in (reel.music_from, 'auto'), from reel t = 0;
  B = the score aligned so the PAYOFF lands exactly where the payoff word lands in the reel (reel.payoff, 'auto' = the
      film's payoff from score_plan.json); A crossfades (equal power, xf_s) into B xf_before_payoff_s before the payoff.
  If the payoff is not in the reel, A plays throughout. Fade in / out at the ends.
Bus gains come from mix_report.json (same balance as the film), the music is ducked under the voice (duck_db) and the
bed is automated per word to >= floor_db, then two-pass loudnorm to target_lufs / tp.
Writes reel_mix.wav (+ reel_voice.wav, reel_bed.wav, reel_caps.json, reel_report.json). Check it with:
  python check_ratio.py reel_voice.wav reel_bed.wav reel_caps.json"""
import json, argparse, os, sys
import numpy as np
from mixlib import W, SR, CFG, load, save, band, words, word_ratios, normalize, loudness, path, anchor, payoff_time, lufs

ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
ap.add_argument('--seg', default=None, help='comma list of a-b film-time segments')
ap.add_argument('--out', default=None)
A = ap.parse_args()
RC, MC = CFG['reel'], CFG['mix']
WS = words()

if A.seg:
    SEG = [tuple(float(v) for v in s.split('-')) for s in A.seg.split(',')]
elif RC.get('seg'):
    SEG = [(anchor(WS, a), anchor(WS, b)) for a, b in RC['seg']]
else:
    sys.path.insert(0, W)
    try:
        from reel import SEG
    except Exception:
        raise SystemExit('reel_audio.py: no segments. Set audio_config.json reel.seg or pass --seg "a-b,c-d"')
SEG = [(float(a), float(b)) for a, b in SEG]
OUT = A.out or (RC['out'] if os.path.isabs(RC['out']) else W + RC['out'])

mr = json.load(open(W + 'mix_report.json', encoding='utf-8')) if os.path.exists(W + 'mix_report.json') else None
voice, sfx, music = load(path('voice')), load(path('sfx')) if os.path.exists(path('sfx')) else None, load(path('music'))
if mr and 'base_gain_db' in mr.get('music', {}):
    g_mus, g_sfx = mr['music']['base_gain_db'], mr.get('sfx', {}).get('base_gain_db', mr['music']['base_gain_db'] + MC['sfx_trim_db'])
else:                                                # no film mix yet: same rule as mix.py (music bus = voice - 14 LU)
    g_mus = loudness(path('voice'))['i'] - MC['music_under_voice_lu'] - lufs(music)
    g_sfx = g_mus + MC['sfx_trim_db']
G_MUS, G_SFX = 10 ** (g_mus / 20), 10 ** (g_sfx / 20)


def cut(x, a, b, fade=RC['join_fade_s']):
    y = np.zeros((int(round((b - a) * SR)), 2), np.float32)
    seg = x[int(a * SR):int(a * SR) + len(y)]
    y[:len(seg)] = seg
    f = max(1, int(fade * SR))
    r = np.linspace(0, 1, f)[:, None]
    y[:f] *= r
    y[-f:] *= r[::-1]
    return y


v = np.concatenate([cut(voice, a, b) for a, b in SEG])
s = np.concatenate([cut(sfx, a, b) for a, b in SEG]) if sfx is not None else np.zeros_like(v)
N = len(v)
starts = np.cumsum([0] + [b - a for a, b in SEG])[:-1]
to_reel = lambda t: next((st + (t - a) for (a, b), st in zip(SEG, starts) if a <= t <= b), None)
ws = [(st + (w0 - a), st + (w1 - a), w) for (a, b), st in zip(SEG, starts) for (w0, w1, w) in WS if a <= w0 and w1 <= b]
json.dump([[[round(a, 3), round(b, 3), w] for a, b, w in ws]], open(W + 'reel_caps.json', 'w', encoding='utf-8'))


def mus(off, i0, i1):
    """Score samples for reel samples [i0, i1) with music time = reel time + off (silence outside the score)."""
    n = i1 - i0
    y = np.zeros((n, 2), np.float32)
    m0 = i0 + int(round(off * SR))
    a, b = max(0, m0), min(len(music), m0 + n)
    if b > a:
        y[a - m0:b - m0] = music[a:b]
    return y


# --- the music edit ---
plan = json.load(open(W + 'score_plan.json', encoding='utf-8')) if os.path.exists(W + 'score_plan.json') else {}
p_film = anchor(WS, RC['payoff']) if RC.get('payoff') not in (None, 'auto') else payoff_time(WS)
p_reel = to_reel(p_film) if p_film is not None else None
if RC.get('music_from') not in (None, 'auto'):
    m_from = anchor(WS, RC['music_from'])
else:                                                # the downbeat of the score section the reel opens in
    secs = [x for x in plan.get('sections', []) if x['t0'] <= SEG[0][0] < x['t1']]
    m_from = secs[0]['t0'] if secs else SEG[0][0]
offA = m_from
edit = {'music_from_s': m_from, 'payoff_film_s': p_film, 'payoff_reel_s': None if p_reel is None else round(p_reel, 3)}
if p_reel is None:
    m = mus(offA, 0, N)
    edit['mode'] = 'A only (payoff not in the reel)'
else:
    offB = p_film - p_reel
    xf_at, xf = p_reel - RC['xf_before_payoff_s'], RC['xf_s']
    if xf_at <= 0.5:
        m = mus(offB, 0, N)
        edit['mode'] = 'B only (payoff aligned; reel too short for an A section)'
    else:
        i0, k = int(xf_at * SR), min(int(xf * SR), N - int(xf_at * SR))
        a_ = mus(offA, 0, i0 + k)
        b_ = mus(offB, i0, N)
        th = np.linspace(0, np.pi / 2, k)[:, None]
        m = np.zeros_like(v)
        m[:i0] = a_[:i0]
        m[i0:i0 + k] = a_[i0:i0 + k] * np.cos(th) + b_[:k] * np.sin(th)
        m[i0 + k:] = b_[k:]
        edit['mode'] = f'A (score {offA:.2f} s ->) crossfades {xf} s at reel {xf_at:.2f} s into B (score aligned so {p_film:.2f} lands at reel {p_reel:.2f})'
fi, fo = int(RC['fade_in_s'] * SR), int(RC['fade_out_s'] * SR)
m[:fi] *= np.linspace(0, 1, fi)[:, None]
m[-fo:] *= (np.linspace(1, 0, fo) ** 1.5)[:, None]
m *= G_MUS
s *= G_SFX

# --- duck the music under the voice: 50 ms RMS detector, -duck_db, attack 10 ms / release 300 ms ---
env = np.sqrt(np.convolve((v ** 2).mean(1), np.ones(2400) / 2400, 'same'))
on = env > 10 ** (-38 / 20)
gd = np.where(on, 10 ** (-MC['music']['duck_db'] / 20), 1.0)
out, cur = np.empty_like(gd), 1.0
for i in range(0, N, 48):
    tgt = gd[i]
    cur += (tgt - cur) * (0.2 if tgt < cur else 0.0032)
    out[i:i + 48] = cur
bed = m * out[:, None] + s

# --- per-word automation to >= floor (30 ms ramps, 30 ms smoothing) ---
floor = float(MC['floor_db'])
for _ in range(6):
    r = word_ratios(band(v), band(bed), ws)
    short = floor + MC['floor_margin_db'] - r
    if (short <= 0).all():
        break
    auto = np.ones(N)
    for (a, b, w), d in zip(ws, short):
        if d > 0:
            i0, i1 = int((a - 0.03) * SR), int((b + 0.03) * SR)
            auto[max(0, i0):i1] = np.minimum(auto[max(0, i0):i1], 10 ** (-d / 20))
    auto = np.convolve(auto, np.ones(1440) / 1440, 'same')
    bed *= auto[:, None]
save(W + 'reel_voice.wav', v)
save(W + 'reel_bed.wav', bed)
save(W + '_audio_tmp_reel_sum.wav', v + bed)
mst = normalize(W + '_audio_tmp_reel_sum.wav', OUT, MC['target_lufs'], MC['tp'])
os.remove(W + '_audio_tmp_reel_sum.wav')
r = word_ratios(band(v), band(bed), ws)
rep = {'seconds': round(N / SR, 3), 'segments': SEG, 'words': len(ws), 'edit': edit, 'ratio_min_db': round(float(r.min()), 2) if len(r) else None,
       'ratio_median_db': round(float(np.median(r)), 2) if len(r) else None, 'master': mst['out']}
json.dump(rep, open(W + 'reel_report.json', 'w'), indent=1)
print(json.dumps(rep, indent=1))
print(f"reel audio {N / SR:.2f} s  words {len(ws)}  worst {rep['ratio_min_db']} dB  {mst['out']['i']} LUFS TP {mst['out']['tp']}  -> {OUT}")
