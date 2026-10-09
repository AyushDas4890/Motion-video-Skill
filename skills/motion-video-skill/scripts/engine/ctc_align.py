"""Numpy CTC Viterbi forced alignment over wav2vec2 log-probs (20 ms frames; ctc_emis.py makes ctc_lp.npy).
align(words, lp) -> (score, [(start_s, end_s) | None per word]). A word with no alignable letters (e.g. a symbol)
gets None (timing.py interpolates it). Numbers are spelled out (English). Accents are stripped to ASCII."""
import json, re, unicodedata
import numpy as np

LP = None
VOC = None


def _load():
    global LP, VOC
    if LP is None:
        LP = np.load('ctc_lp.npy')
        VOC = json.load(open('ctc_vocab.json'))
    return LP, VOC


ONES = 'ZERO ONE TWO THREE FOUR FIVE SIX SEVEN EIGHT NINE TEN ELEVEN TWELVE THIRTEEN FOURTEEN FIFTEEN SIXTEEN SEVENTEEN EIGHTEEN NINETEEN'.split()
TENS = 'TWENTY THIRTY FORTY FIFTY SIXTY SEVENTY EIGHTY NINETY'.split()


def spell(n):
    n = int(n)
    if n < 20: return ONES[n]
    if n < 100: return TENS[n // 10 - 2] + ('' if n % 10 == 0 else ' ' + ONES[n % 10])
    if n < 1000: return ONES[n // 100] + ' HUNDRED' + ('' if n % 100 == 0 else ' ' + spell(n % 100))
    if n < 1000000: return spell(n // 1000) + ' THOUSAND' + ('' if n % 1000 == 0 else ' ' + spell(n % 1000))
    return ' '.join(ONES[int(d)] for d in str(n))


def norm(word):
    w = unicodedata.normalize('NFKD', word).encode('ascii', 'ignore').decode()
    w = w.replace('’', "'")
    w = re.sub(r'(\d+)', lambda m: ' ' + (spell(m.group(1)) if len(m.group(1)) <= 7 else ' '.join(ONES[int(d)] for d in m.group(1))) + ' ', w)
    return re.sub(r"[^A-Za-z' ]", '', w).upper().strip()


def align(words, lp=None):
    """words: list of display words. Returns (score, [(start_s, end_s) or None] per word)."""
    if lp is None:
        lp, _ = _load()
    _, voc = _load()
    blank, sep = voc['<pad>'], voc['|']
    toks, owner = [], []
    for i, w in enumerate(words):
        for part in norm(w).split():
            cs = [voc[c] for c in part if c in voc]
            if not cs: continue
            if toks: toks.append(sep); owner.append(-1)
            for c in cs: toks.append(c); owner.append(i)
    if not toks:
        return 0.0, [None] * len(words)
    L = len(toks); S = 2 * L + 1
    lab = np.full(S, blank); lab[1::2] = toks
    skip = np.zeros(S, bool); skip[3::2] = lab[3::2] != lab[1:-2:2]
    T = lp.shape[0]; NEG = -1e30
    if T < L:
        return -1e30, [None] * len(words)
    a = np.full(S, NEG); a[0] = lp[0, lab[0]]; a[1] = lp[0, lab[1]]
    bp = np.zeros((T, S), np.int8)
    for t in range(1, T):
        s1 = np.concatenate(([NEG], a[:-1]))
        s2 = np.where(skip, np.concatenate(([NEG, NEG], a[:-2])), NEG)
        st = np.stack([a, s1, s2]); arg = st.argmax(0)
        bp[t] = arg; a = st[arg, np.arange(S)] + lp[t, lab]
    s = S - 1 if a[S - 1] >= a[S - 2] else S - 2
    score = a[s]
    path = np.empty(T, int)
    for t in range(T - 1, -1, -1):
        path[t] = s; s -= int(bp[t, s])
    spans = [[None, None] for _ in words]
    for t, s in enumerate(path):
        if s % 2 == 1:
            o = owner[(s - 1) // 2]
            if o >= 0:
                if spans[o][0] is None: spans[o][0] = t
                spans[o][1] = t + 1
    return float(score), [(a_ * 0.02, b_ * 0.02) if a_ is not None else None for a_, b_ in spans]
