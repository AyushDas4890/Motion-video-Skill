"""Check word timing by eye: an energy strip (one char per 20 ms: '#' > -35 dB, '+' > -45 dB, '.' quieter) with the
word spans of the final captions (C) and of whisper (Wh) under it. A word that starts in '.' is mistimed.
Run from work/:  python envcheck.py 12.0:15.0 28:30"""
import json, os, sys
import numpy as np

db = np.load('env_db.npy')


def strip(a, b):
    out = ''
    for t in np.arange(a, b, 0.02):
        v = db[int(t * 100):int(t * 100) + 2].max() if int(t * 100) < len(db) else -99
        out += '#' if v > -35 else '+' if v > -45 else '.'
    return out


def marks(ws, a, b):
    row = [' '] * int(round((b - a) / 0.02)); labels = []
    for s, e, w in ws:
        if e < a or s > b: continue
        i = int((max(s, a) - a) / 0.02); j = int((min(e, b) - a) / 0.02)
        for k in range(i, min(j, len(row))): row[k] = '-'
        if 0 <= i < len(row): row[i] = '|'
        labels.append(f'{w}@{s:.2f}-{e:.2f}')
    return ''.join(row), ' '.join(labels)


caps = [w for ch in json.load(open('caps.json', encoding='utf-8')) for w in ch]
sets = [('C ', caps)]
if os.path.isfile('words_whisper.json'):
    j = json.load(open('words_whisper.json', encoding='utf-8'))
    sets.append(('Wh', [w[:3] for s in (j['segments'] if isinstance(j, dict) else j) for w in s['w']]))
for arg in sys.argv[1:]:
    a, b = map(float, arg.split(':'))
    print(f'== {a}-{b}')
    print('E   ' + strip(a, b))
    for name, ws in sets:
        r, l = marks(ws, a, b); print(name + '  ' + r); print('    ' + l)
