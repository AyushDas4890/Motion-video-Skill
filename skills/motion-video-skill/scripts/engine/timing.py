"""Final word timings for the corrected transcript (final_text.render() = transcript.txt).
  1. rough times: the whisper words (words_whisper.json) matched to the transcript words in order (difflib); words whisper
     missed are interpolated by length between their neighbours.
  2. if ctc_lp.npy exists (English, ctc_emis.py): wav2vec2 CTC forced alignment of the whole text (or of ~40 s windows
     around the rough times for long films) replaces them — VotR v4: whisper put 'rain' at 26.90 s, it starts at 28.48.
     else: whisper edges are trimmed to the energy envelope (no word starts/ends in silence).
  3. edges snapped to the 10 ms RMS envelope (env_db.npy, -45 dB): start walks back over voiced frames (<= 0.12 s),
     end walks forward while voiced (<= 0.35 s); never into a neighbour.
timed_words() -> [[start, end, word, sentence_index], ...]. Run directly for a report vs whisper."""
import difflib, json, os, re
import numpy as np
from final_text import render

TH = -45.0
_db = None


def db():
    global _db
    if _db is None:
        _db = np.load('env_db.npy') if os.path.isfile('env_db.npy') else np.zeros(0)
    return _db


def speech(t):
    d = db(); i = int(round(t * 100))
    return i < len(d) and i >= 0 and d[max(0, i - 1):i + 2].max() > TH


def nrm(w):
    return re.sub(r"[^\w']", '', w.lower().replace('’', "'"))


def whisper_words():
    if not os.path.isfile('words_whisper.json'):
        return []
    j = json.load(open('words_whisper.json', encoding='utf-8'))
    segs = j['segments'] if isinstance(j, dict) else j
    return [w for s in segs for w in s['w']]


def rough(words):
    """rough (start, end) per transcript word from the whisper words; None-free (interpolated)."""
    ww = whisper_words()
    out = [None] * len(words)
    if ww:
        A = [nrm(w) for w in words]; Bn = [nrm(w[2]) for w in ww]
        for op, i1, i2, j1, j2 in difflib.SequenceMatcher(None, A, Bn, autojunk=False).get_opcodes():
            if op == 'equal' or (op == 'replace' and i2 - i1 == j2 - j1):
                for k in range(i2 - i1):
                    out[i1 + k] = (ww[j1 + k][0], ww[j1 + k][1])
            elif op == 'replace' and j2 > j1:  # different word counts: spread the whisper span over the words
                a, b = ww[j1][0], ww[j2 - 1][1]; n = i2 - i1
                L = [max(1, len(words[i])) for i in range(i1, i2)]; tot = sum(L); acc = 0
                for k in range(n):
                    s = a + (b - a) * acc / tot; acc += L[k]; out[i1 + k] = (s, a + (b - a) * acc / tot)
    # interpolate the gaps by word length
    known = [i for i, v in enumerate(out) if v is not None]
    if not known:
        end = len(db()) / 100 or len(words) * 0.4
        return [(end * i / len(words), end * (i + 1) / len(words)) for i in range(len(words))]
    i = 0
    while i < len(words):
        if out[i] is not None: i += 1; continue
        j = i
        while j < len(words) and out[j] is None: j += 1
        a = out[i - 1][1] if i > 0 else max(0.0, out[j][0] - 0.4 * (j - i)) if j < len(words) else 0.0
        b = out[j][0] if j < len(words) else a + 0.4 * (j - i)
        L = [max(1, len(words[k])) for k in range(i, j)]; tot = sum(L); acc = 0
        for k in range(i, j):
            s = a + (b - a) * acc / tot; acc += L[k - i]; out[k] = (s, a + (b - a) * acc / tot)
        i = j
    return out


def ctc_spans(words, rgh):
    from ctc_align import align, _load
    lp, voc = _load()
    T = lp.shape[0]
    nch = sum(len(w) + 1 for w in words)
    if T * (2 * nch + 1) <= 2.5e8:     # whole file at once (what VotR did)
        _, spans = align(words, lp)
        return spans
    spans = [None] * len(words)        # long film: ~40 s windows around the rough times, cut where whisper heard a pause
    i = 0
    while i < len(words):
        j = i + 1
        while j < len(words) and rgh[j][1] - rgh[i][0] < 40: j += 1
        while j < len(words) and j - i > 8 and rgh[j][0] - rgh[j - 1][1] < 0.25: j -= 1
        a = max(0.0, rgh[i][0] - 1.0); b = min(T * 0.02, rgh[j - 1][1] + 1.0)
        f0, f1 = int(a / 0.02), int(b / 0.02) + 1
        _, sp = align(words[i:j], lp[f0:f1])
        for k, s in enumerate(sp):
            spans[i + k] = (s[0] + f0 * 0.02, s[1] + f0 * 0.02) if s else None
        i = j
    return spans


def timed_words(use_ctc=None):
    sents = render()
    words = [(si, w) for si, s in enumerate(sents) for w in s.split()]
    ws = [w for _, w in words]
    rgh = rough(ws)
    if use_ctc is None:
        use_ctc = os.path.isfile('ctc_lp.npy') and os.path.isfile('ctc_vocab.json')
    spans = ctc_spans(ws, rgh) if use_ctc else list(rgh)
    # words CTC could not place (no letters) take the rough time, clipped between neighbours
    for k, s in enumerate(spans):
        if s is None:
            spans[k] = rgh[k]
    if not use_ctc and len(db()):        # whisper edges: trim silence inside the word span
        for k, (s, e) in enumerate(spans):
            s0, e0 = s, e
            while s < e - 0.08 and s - s0 < 0.6 and not speech(s): s += 0.01
            while e > s + 0.08 and e0 - e < 0.8 and not speech(e - 0.01): e -= 0.01
            spans[k] = (s, e)
    out = []
    for k, ((si, w), (s, e)) in enumerate(zip(words, spans)):
        prev_e = out[-1][1] if out else 0.0
        s = max(s, prev_e)
        ns = s
        if len(db()):
            while ns - 0.01 > prev_e + 0.01 and s - ns < 0.12 and speech(ns - 0.01): ns -= 0.01
        nxt = spans[k + 1][0] if k + 1 < len(spans) else 1e9
        ne = max(e, s)
        if len(db()):
            while ne + 0.01 < nxt - 0.01 and ne - e < 0.35 and speech(ne): ne += 0.01
        out.append([round(ns, 2), round(max(ne, ns + 0.06), 2), w, si])
    for a, b in zip(out, out[1:]):  # min-duration padding must not overlap the next word
        a[1] = min(a[1], b[0])
        if b[0] < a[0]: b[0] = a[0]
    return out


if __name__ == '__main__':
    ws = timed_words()
    ww = whisper_words()
    j = 0; diffs = []
    for s, e, w, _ in ws:
        for k in range(j, min(j + 4, len(ww))):
            if nrm(ww[k][2]) == nrm(w):
                diffs.append((s - ww[k][0], w, s, ww[k][0])); j = k + 1; break
    d = np.array([x[0] for x in diffs]) if diffs else np.zeros(1)
    print('words', len(ws), 'matched', len(diffs), 'median start diff vs whisper %.3f' % np.median(d), 'abs>0.3:', int((abs(d) > 0.3).sum()))
    for x in diffs:
        if abs(x[0]) > 0.3: print(f'  {x[1]:14s} final={x[2]:.2f} whisper={x[3]:.2f}')
