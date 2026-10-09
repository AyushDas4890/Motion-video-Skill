"""STARTER beat sheet: cut the whole talk into shots on phrase boundaries and fill them with the template grammar and the
generic starter scenes (acts/starter.js), so a new project renders as a film before any art is made. It is a first
draft for the beat-sheet phase: re-cut it by hand (ideas -> scenes) in beats_data.py.
Run from work/ (needs caps.json, optional env_db.npy):  python starter_beats.py [--force] [--seed N]
  - shot lengths 1.6-3.4 s, cut on word onsets, preferring phrase starts (after punctuation or a >= 0.25 s pause)
  - first shot: S speaker (the hook is his face + chest caption); then the cycle X C S F C X S C F X C S
    (time share ~ S 20 / X 25 / C 35 / F 20 %, the reference reel's spirit with more speaker while art is missing)
  - S: zoom 1.16 settle or 1.32 punch-in on an emphasised word (loudness z-score); X/C: gen_word with the shot's key
    word (keyWords first, then emphasis + length) and a rotating motif; F: gen_kin (kinetic block of the shot's words);
    if the title is spoken, an F gen_title card lands on it.
Writes beats_data.py (refuses to overwrite a hand-edited one unless --force)."""
import argparse, json, os, re, time
import numpy as np
import projcfg

ap = argparse.ArgumentParser()
ap.add_argument('--force', action='store_true')
ap.add_argument('--seed', type=int, default=0)
ap.add_argument('--out', default='beats_data.py')
A = ap.parse_args()
P = projcfg.load()
END = float(P['filmEnd'])
import hashlib


def untouched(path):
    """True if path is exactly what starter_beats.py wrote (its last line holds the sha1 of everything above it)"""
    txt = open(path, encoding='utf-8').read().rstrip('\n').split('\n')
    return txt[-1].startswith('# sha1 ') and txt[-1][7:] == hashlib.sha1('\n'.join(txt[:-1]).encode('utf-8')).hexdigest()


if os.path.isfile(A.out) and not A.force and not untouched(A.out):
    raise SystemExit(f'{A.out} exists and was edited by hand; use --force to replace it')

words = [w for c in json.load(open('caps.json', encoding='utf-8')) for w in c]
STOP = projcfg.STOPWORDS | {w.lower() for w in (P.get('captions') or {}).get('funcWords', [])}
KEYS = {w.lower() for w in (P.get('captions') or {}).get('keyWords', [])}
clean = lambda s: re.sub(r'^[“"‘\'(\[]+|[”"’\')\].,;:!?…।]+$', '', s)
nrm = lambda s: re.sub(r"[^\w']", '', s.lower().replace('’', "'"))

# loudness z-score of each word vs its +-10 s neighbourhood
db = np.load('env_db.npy') if os.path.isfile('env_db.npy') else None
loud = np.zeros(len(words))
if db is not None and len(words):
    pk = np.array([db[int(w[0] * 100):max(int(w[0] * 100) + 1, int(w[1] * 100))].max() if int(w[0] * 100) < len(db) else -60 for w in words])
    for i, w in enumerate(words):
        nb = [k for k, v in enumerate(words) if abs(v[0] - w[0]) <= 10]
        m, s = np.median(pk[nb]), np.std(pk[nb]) + 1e-6
        loud[i] = (pk[i] - m) / s


def score(i):
    s = clean(words[i][2]); n = nrm(s)
    if not n: return -9
    sc = 0.6 * loud[i] + (0.35 if len(n) >= 6 else 0) + (1.5 if n in KEYS else 0) - (2.0 if n in STOP else 0) - (0.8 if len(n) <= 3 else 0)
    return sc


def key_in(t0, t1):
    """the shot's key word: emphasis + length + keyWords, and early in the shot (the art lands on it)"""
    ix = [i for i, w in enumerate(words) if t0 - 0.02 <= w[0] < t1 - 0.1]
    if not ix: return None
    return max(ix, key=lambda i: score(i) - 0.9 * (words[i][0] - t0) / max(0.5, t1 - t0))


starts = [i for i, w in enumerate(words) if i == 0 or words[i - 1][2][-1:] in ',.;:?!।' or w[0] - words[i - 1][1] >= 0.25]
onsets = [w[0] for w in words]
PS = [words[i][0] for i in starts]

# title card: where the title words are spoken (if they are)
title = (P.get('text') or {}).get('title') or P.get('title') or ''
tt = [nrm(x) for x in title.split() if nrm(x)]
title_at = None
if len(tt) >= 2:
    for i in range(len(words) - len(tt) + 1):
        if all(nrm(words[i + k][2]) == tt[k] for k in range(len(tt))):
            title_at = (words[i][0], words[i + len(tt) - 1][1]); break

RANGE = {'S': (1.6, 2.8, 2.1), 'X': (2.0, 3.4, 2.6), 'C': (1.8, 3.2, 2.4), 'F': (1.6, 2.8, 2.0)}
CYCLE = ['X', 'C', 'S', 'F', 'C', 'X', 'S', 'C', 'F', 'X', 'C', 'S']
MOTIFS = ['sky', 'cloud', 'garden', 'tree', 'sea']


def next_cut(t, lay, first=False):
    lo, hi, tg = RANGE[lay]
    if first and words:   # the opening speaker shot holds through his first phrase
        f0 = words[0][0]; lo, hi, tg = max(lo, f0 + 0.9), max(hi, f0 + 2.6), max(tg, f0 + 1.6)
    if title_at and t + lo <= title_at[0] - 0.02 < t + hi + 0.6 and t < title_at[0] - 1.2:
        return title_at[0]          # land the title card on its words
    for pool in (PS, onsets):
        c = [x for x in pool if t + lo <= x <= t + hi]
        if c: return min(c, key=lambda x: abs(x - t - tg))
    return t + tg


beats, t, ci, mi, zi = [], 0.0, A.seed % len(CYCLE), A.seed % len(MOTIFS), 0
first = True
while t < END - 0.05:
    if title_at and abs(t - title_at[0]) < 0.03:
        lay, scene = 'F', 'gen_title'
        lo = max(t + 1.6, title_at[1] + 0.3)
        c = [x for x in PS if lo <= x <= t + 3.4] or [x for x in onsets if lo <= x <= t + 3.4]
        t1 = min(c) if c else lo
    else:
        lay = 'S' if first else CYCLE[ci % len(CYCLE)]
        t1 = next_cut(t, lay, first)
        scene = None
    if END - t1 < 1.2: t1 = END
    if not first and scene is None: ci += 1
    first = False
    ws = [w for w in words if t - 0.02 <= w[0] < t1 - 0.02]
    said = ' '.join(w[2] for w in ws)
    ex = {}
    if lay == 'F' and scene is None and len(ws) < 3: lay = 'C'
    if lay == 'S':
        ki = key_in(t, t1); punch = ki is not None and loud[ki] > 0.8 and zi % 2 == 0
        ex['zoom'] = 1.32 if punch else 1.16; zi += 1
        vis = f"Speaker{' punch-in' if punch else ''}: '{said}'"; snd = 'cut tick' if punch else ''
    elif lay in 'XC':
        ki = key_in(t, t1)
        scene = 'gen_word'; motif = MOTIFS[mi % len(MOTIFS)]; mi += 1
        if ki is None:
            ex['args'] = {'motif': motif}; kw = ''
        else:
            kw = clean(words[ki][2]); ex['args'] = {'word': kw, 'wt': words[ki][0], 'motif': motif}
        vis = f"{'Split' if lay == 'X' else 'Cutaway'} (starter): key word '{kw}' over the colour world, motif {motif} — REPLACE with a scene that shows the idea ('{said}')"
        snd = 'whoosh' if lay == 'C' else 'cut tick'
    else:
        if scene == 'gen_title':
            ex['cap'] = 'none'; ex['args'] = {'title': title}
            vis = f"Title card on its spoken words: '{title}'"; snd = 'card hit'
        else:
            scene = 'gen_kin'; ex['cap'] = 'none'
            vis = f"Kinetic serif block (starter): '{said}'"; snd = 'soft tick per word'
    beats.append((round(t, 2), lay, scene, vis, '', snd, ex))
    t = t1

# device mix report
dur = {}
for i, b in enumerate(beats):
    t1 = beats[i + 1][0] if i + 1 < len(beats) else END
    dur[b[1]] = dur.get(b[1], 0) + t1 - b[0]
tot = sum(dur.values())
lines = [f"# AUTO-GENERATED by starter_beats.py on {time.strftime('%Y-%m-%d %H:%M')} — a STARTER beat sheet. Edit freely (then",
         "# python beats.py); once edited, starter_beats.py will not overwrite it without --force.",
         "# Each beat: (t0, layout, scene, visual, motif, sound, extra). t1 = next beat's t0. Times = spoken-word onsets",
         "# (docs/caps_listing.txt). Layouts: S speaker | X split | C cutaway | F full graphic. Starter scenes (acts/starter.js):",
         "# gen_word {word, wt, motif} · gen_kin · gen_title · gen_chap. Replace them with real scenes as you build the film.",
         "import projcfg",
         f"END = projcfg.load()['filmEnd']   # film length ({END} s); a coda after the footage = raise filmEnd in project.js",
         "B = ["]
for b in beats:
    lines.append(' ' + repr(b) + ',')
lines.append(']')
body = '\n'.join(lines)
open(A.out, 'w', encoding='utf-8').write(body + '\n# sha1 ' + hashlib.sha1(body.encode('utf-8')).hexdigest() + '\n')
print(f"{len(beats)} beats -> {A.out}; time share", {k: f'{100 * v / tot:.0f}%' for k, v in sorted(dur.items())}, '; title card at', title_at)
