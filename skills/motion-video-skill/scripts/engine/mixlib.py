"""Shared helpers for voice.py / mix.py / check_ratio.py / reel_audio.py: config, ffmpeg, decode, loudness (ffmpeg loudnorm
+ an in-process BS.1770 meter for short windows), two-pass loudnorm, word windows, word anchors, band ratio.

Every script runs from the project's work/ folder (or set WORK=<dir>). Project numbers live in work/audio_config.json;
anything missing there falls back to DEFAULTS below (keep the two in sync with scripts/engine/audio_config.json)."""
import json, os, re, shutil, subprocess, unicodedata
import numpy as np
from scipy import signal
from scipy.io import wavfile

SR = 48000
RATIO_BAND = (300, 6000)          # voice-vs-bed ratio is measured on 300 Hz-6 kHz band-limited RMS
W = os.path.abspath(os.environ.get('WORK') or os.getcwd()).replace('\\', '/') + '/'
TMP = W + '_audio_tmp/'

DEFAULTS = {
    'film_len': 'auto', 'voice_src': '', 'voice_offset': 0.0,
    'files': {'beats': 'beats.json', 'caps': 'caps.json', 'voice': 'voice_proc.wav', 'music': 'music.wav', 'sfx': 'sfx.wav',
              'out': 'final.wav', 'bed': 'bed_final.wav'},
    'voice': {'lufs': -16.0, 'tp': -1.5, 'hpf_hz': 80, 'denoise': 'auto', 'comp_ratio': 2.8, 'comp_gr_db': 2.5,
              'presence_db': 1.5, 'deess_trigger_db': 3.0},
    'mix': {
        'floor_db': 15.0, 'floor_margin_db': 0.2, 'target_lufs': -14.0, 'tp': -1.5, 'music_under_voice_lu': 14.0, 'sfx_trim_db': 4.0,
        'music': {'eq_hz': 2400, 'eq_w': 2, 'eq_db': -6, 'hs_hz': 5800, 'hs_w': 1, 'hs_db': -5, 'ratio': 6, 'duck_db': 5.5, 'attack_ms': 10, 'release_ms': 300},
        'sfx': {'eq_hz': 2400, 'eq_w': 2, 'eq_db': -4, 'hs_hz': 5800, 'hs_w': 1, 'hs_db': 0, 'ratio': 3, 'duck_db': 5.0, 'attack_ms': 10, 'release_ms': 250},
        'ramp_s': 0.030, 'bridge_s': 0.25, 'max_passes': 10,
        'hook_lift': {'db': 'auto', 'target_re_voice_lu': -2.5, 'max_db': 15, 'min_window_s': 0.6, 'fade_s': 0.12},
        'coda': {'at': 'auto', 'db': 'auto', 'fade_s': 1.0, 'target_re_voice_lu': -2.5, 'max_db': 14},
        'breaths': [],
        'auto_breaths': {'trigger_db': 8.0, 'max_db': 16.0, 'fade_s': 0.45, 'pad_s': 0.3, 'join_gap_s': 1.0},
    },
    'reel': {'seg': [], 'payoff': 'auto', 'music_from': 'auto', 'xf_before_payoff_s': 12.0, 'xf_s': 2.5, 'fade_in_s': 0.4,
             'fade_out_s': 2.5, 'join_fade_s': 0.012, 'out': 'reel_mix.wav'},
}


def _merge(a, b):
    o = dict(a)
    for k, v in (b or {}).items():
        o[k] = _merge(a[k], v) if isinstance(v, dict) and isinstance(a.get(k), dict) else v
    return o


def config():
    p = W + 'audio_config.json'
    user = json.load(open(p, encoding='utf-8')) if os.path.exists(p) else {}
    if not user:
        print(f'note: no {p}; using defaults')
    return _merge(DEFAULTS, user)


CFG = config()


def path(key):
    """Project file by its key in audio_config.json 'files' (relative paths resolve against the work folder)."""
    f = CFG['files'][key]
    return f if os.path.isabs(f) else W + f


def _find_ff():
    e = os.environ.get('FF')
    if e and os.path.exists(e):
        return e
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        pass
    p = shutil.which('ffmpeg')
    if p:
        return p
    raise SystemExit('ffmpeg not found: set FF=<path to ffmpeg.exe> (or ask the owner before installing imageio-ffmpeg)')


FF = _find_ff()


def ff(*a):
    r = subprocess.run([FF, '-hide_banner', '-nostats', '-y', *a], capture_output=True, text=True, encoding='utf-8', errors='replace')
    if r.returncode:
        raise RuntimeError(r.stderr[-3000:])
    return r.stderr


def tmp(name):
    os.makedirs(TMP, exist_ok=True)
    return TMP + name


def load(p, ch=2, start=0.0, dur=None):
    """Decode any audio/video file to float32 array (n, ch) at 48 kHz (optionally from `start` s for `dur` s)."""
    a = [FF, '-v', 'error']
    if start:
        a += ['-ss', f'{start:.4f}']
    a += ['-i', p]
    if dur:
        a += ['-t', f'{dur:.4f}']
    r = subprocess.run(a + ['-vn', '-f', 'f32le', '-ac', str(ch), '-ar', str(SR), '-'], capture_output=True, check=True)
    return np.frombuffer(r.stdout, np.float32).reshape(-1, ch).copy()


def save(p, x):
    wavfile.write(p, SR, np.asarray(x, np.float32))


def fit(x, n):
    """Pad with silence / trim to n samples."""
    return np.pad(x, ((0, max(0, n - len(x))),) + ((0, 0),) * (x.ndim - 1))[:n]


def db(p):
    """Power -> dB."""
    return 10 * np.log10(np.maximum(p, 1e-20))


def loudness(p, af=''):
    """EBU R128 via loudnorm pass 1: dict(i, tp, lra, thresh)."""
    err = ff('-i', p, '-af', (af + ',' if af else '') + 'loudnorm=print_format=json', '-f', 'null', '-')
    j = json.loads(err[err.rindex('{'):err.rindex('}') + 1])
    return {k: float(j['input_' + k]) for k in ('i', 'tp', 'lra', 'thresh')}


# --- in-process BS.1770 meter (for short windows where ffmpeg's integrated value is unreliable) ---
_K1 = ([1.53512485958697, -2.69169618940638, 1.19839281085285], [1.0, -1.69065929318241, 0.73248077421585])
_K2 = ([1.0, -2.0, 1.0], [1.0, -1.99004745483398, 0.99007225036621])


def kweight(x):
    x = x if x.ndim > 1 else x[:, None]
    return signal.lfilter(*_K2, signal.lfilter(*_K1, x, axis=0), axis=0)


def lufs(x, t0=0.0, t1=None, gated=True):
    """Integrated loudness (LUFS) of x[t0:t1] (48 kHz, (n, ch)); 400 ms blocks, 75 % overlap, -70 abs / -10 rel gates.
    Windows shorter than 400 ms are measured ungated as one block. Returns -inf for digital silence."""
    a, b = int(t0 * SR), int((t1 if t1 is not None else len(x) / SR) * SR)
    y = kweight(x[max(0, a - SR // 2):b])[min(a, SR // 2):]          # 0.5 s filter pre-roll
    ms = (y ** 2).mean(1)
    blk, hop = int(0.4 * SR), int(0.1 * SR)
    if len(ms) < blk:
        z = ms.mean() * y.shape[1] if len(ms) else 0
        return -0.691 + 10 * np.log10(z) if z > 0 else -np.inf
    c = np.cumsum(np.concatenate([[0], ms]))
    z = (c[blk::hop][:(len(ms) - blk) // hop + 1] - c[:-blk:hop][:(len(ms) - blk) // hop + 1]) / blk * y.shape[1]
    L = -0.691 + 10 * np.log10(np.maximum(z, 1e-20))
    if not gated:
        return float(-0.691 + 10 * np.log10(max(z.mean(), 1e-20)))
    z1 = z[L > -70]
    if not len(z1):
        return -np.inf
    rel = -0.691 + 10 * np.log10(z1.mean()) - 10
    z2 = z[L > rel]
    return float(-0.691 + 10 * np.log10(z2.mean()))


def normalize(src, dst, target_i, target_tp, codec='pcm_f32le', margin=0.4):
    """Two-pass loudnorm (linear). If the needed gain would push TP over target, first apply a
    gain + 4x-oversampled alimiter so loudnorm can stay in linear (pure-gain) mode."""
    m0 = m = loudness(src)
    gain = target_i - m['i']
    pre, ceil = '', None
    if m['tp'] + gain > target_tp - 0.2:
        ceil = target_tp - margin          # gain up first, then limit at this ceiling (dBFS, 4x oversampled)
        pre = f'volume={gain:.2f}dB,aresample=192000,alimiter=limit={ceil:.2f}dB:level=0:latency=1,aresample={SR},'
        m = loudness(src, pre[:-1])
    ln = (f"loudnorm=I={target_i}:TP={target_tp}:LRA=20:measured_I={m['i']}:measured_TP={m['tp']}"
          f":measured_LRA={m['lra']}:measured_thresh={m['thresh']}:linear=true:print_format=json")
    err = ff('-i', src, '-af', pre + ln + f',aresample={SR}', '-ar', str(SR), '-c:a', codec, dst)
    j = json.loads(err[err.rindex('{'):err.rindex('}') + 1])
    return {'input': m0, 'gain_db': round(gain, 2), 'tp_if_unlimited': round(m0['tp'] + gain, 2),
            'pass1': m, 'prelimit_ceiling_dbfs': round(ceil, 2) if pre else None,
            'normalization_type': j['normalization_type'], 'out': loudness(dst)}


def words(p=None):
    """Transcript -> flat sorted list of (start, end, word). Accepts caps.json chunks [[s,e,w]...], a flat list,
    [{start,end,word}] or {words:[...]}."""
    p = p or path('caps')
    if not os.path.exists(p):
        raise SystemExit(f'no transcript at {p} (caps.json with word timestamps is required for the ratio floor)')
    j = json.load(open(p, encoding='utf-8'))
    if isinstance(j, dict):
        j = j.get('words') or j.get('segments') or []
    out = []

    def walk(x):
        if isinstance(x, list) and len(x) >= 3 and isinstance(x[0], (int, float)) and isinstance(x[2], str):
            out.append((float(x[0]), float(x[1]), x[2]))
        elif isinstance(x, list):
            for y in x:
                walk(y)
        elif isinstance(x, dict) and 'start' in x:
            out.append((float(x['start']), float(x['end']), str(x.get('word', x.get('text', ''))).strip()))
    walk(j)
    return sorted([w for w in out if w[2]], key=lambda w: w[0])


def beats():
    p = path('beats')
    return sorted([b for b in json.load(open(p, encoding='utf-8')) if isinstance(b.get('t0'), (int, float))], key=lambda b: b['t0']) \
        if os.path.exists(p) else []


def film_len(ws=None, override=None):
    """Film length (s): --len, else audio_config film_len, else last beat t1 (beats.json), else last word end + 2 s."""
    if override:
        return float(override)
    if isinstance(CFG['film_len'], (int, float)):
        return float(CFG['film_len'])
    bs = beats()
    if bs:
        return round(max(b.get('t1', b['t0']) for b in bs), 3)
    ws = ws if ws is not None else words()
    return round(ws[-1][1] + 2.0, 3)


def _norm(w):
    w = unicodedata.normalize('NFKC', str(w)).lower()
    return re.sub(r"^'+|'+$", '', ''.join(c for c in w if c.isalnum() or c == "'"))


def anchor(ws, spec):
    """Time anchor (same syntax as score.mjs): number, "word", "two words", "word#2", "word@100", "word~end", "word+0.3",
    or {word, n, after, edge, off}. Returns seconds (None for None/'auto')."""
    if spec is None or spec == 'auto' or spec == '':
        return None
    if isinstance(spec, (int, float)):
        return float(spec)
    o = spec
    if isinstance(spec, str):
        if re.fullmatch(r'-?\d+(\.\d+)?', spec.strip()):
            return float(spec)
        m = re.fullmatch(r'(.+?)(?:#(\d+))?(?:@(\d+(?:\.\d+)?))?(~end|~start)?([+-]\d*\.?\d+)?', spec.strip())
        o = {'word': m[1], 'n': int(m[2] or 1), 'after': float(m[3] or 0), 'edge': 'end' if m[4] == '~end' else 'start', 'off': float(m[5] or 0)}
    toks = [t for t in (_norm(x) for x in str(o['word']).split()) if t]
    c = 0
    for i in range(len(ws) - len(toks) + 1):
        if ws[i][0] < o.get('after', 0) - 1e-6:
            continue
        if all(_norm(ws[i + j][2]) == t for j, t in enumerate(toks)):
            c += 1
            if c == o.get('n', 1):
                return round((ws[i + len(toks) - 1][1] if o.get('edge') == 'end' else ws[i][0]) + o.get('off', 0), 3)
    raise SystemExit(f'anchor {spec!r} not found in the transcript')


def payoff_time(ws, spec='auto'):
    """Same rule as score.mjs findPayoff (score_plan.json is preferred when it exists)."""
    sp = W + 'score_plan.json'
    if spec in (None, 'auto') and os.path.exists(sp):
        p = json.load(open(sp, encoding='utf-8')).get('payoff')
        if p is not None:
            return float(p)
    if spec not in (None, 'auto'):
        return anchor(ws, spec)
    if not ws:
        return None
    s0, s1 = ws[0][0], ws[-1][1]
    for b in reversed(beats()):
        if b.get('key') and b['t0'] >= s0 + 0.7 * (s1 - s0):
            k = _norm(str(b['key']).split()[0])
            w = next((w for w in ws if w[0] >= b['t0'] - 0.35 and _norm(w[2]) == k), None)
            return w[0] if w else b['t0']
    st = [w[0] for i, w in enumerate(ws) if i == 0 or w[0] - ws[i - 1][1] >= 0.45 or re.search(r'[.!?;:]["\')\]]*$', ws[i - 1][2])]
    st = [t for t in st if t >= s0 + 0.5 * (s1 - s0)]
    return st[-1] if st else max(s0, s1 - 2)


_SOS = signal.butter(4, RATIO_BAND, 'bandpass', fs=SR, output='sos')


def band(x):
    """Mono-sum then 4th-order Butterworth 300-6000 Hz, zero phase."""
    return signal.sosfiltfilt(_SOS, x.mean(1) if x.ndim > 1 else x)


def word_ratios(vb, bb, ws):
    """Per-word voice/bed ratio in dB from band-limited mono signals (RMS over each word window)."""
    out = []
    for s, e, _ in ws:
        a, b = int(s * SR), max(int(e * SR), int(s * SR) + 1)
        out.append(db(np.mean(vb[a:b] ** 2)) - db(np.mean(bb[a:b] ** 2)))
    return np.array(out)


def band_share(x, ws, bands=((0, 1000), (1000, 4000), (4000, 24000)), frame=2400):
    """Energy share per band inside word windows vs outside (50 ms frames) -> {'during': [...%], 'outside': [...%]}."""
    m = x.mean(1) if x.ndim > 1 else x
    nf = len(m) // frame
    fr = m[:nf * frame].reshape(nf, frame) * np.hanning(frame)
    P = np.abs(np.fft.rfft(fr, axis=1)) ** 2
    f = np.fft.rfftfreq(frame, 1 / SR)
    c = (np.arange(nf) + 0.5) * frame / SR
    sp = np.zeros(nf, bool)
    for s, e, _ in ws:
        sp |= (c >= s) & (c <= e)
    res = {}
    for name, mask in (('during', sp), ('outside', ~sp)):
        e = np.array([P[mask][:, (f >= lo) & (f < hi)].sum() for lo, hi in bands])
        res[name] = [round(float(v), 2) for v in 100 * e / max(e.sum(), 1e-20)]
    return res
