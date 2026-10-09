"""Where is a word spoken? Prints every occurrence (onset, end, context) so you can cut beats and cue scenes on it.
Run from work/:  python cues.py gratitude rain "mother earth"      (a phrase = consecutive words)
In scenes use WT('word', after) with an `after` a little before the occurrence you mean."""
import json, re, sys

ws = [w for c in json.load(open('caps.json', encoding='utf-8')) for w in c]
n = lambda x: re.sub(r"[^\w']", '', x.lower().replace('’', "'"))
for q in sys.argv[1:]:
    qs = [n(x) for x in q.split()]
    hits = [i for i in range(len(ws) - len(qs) + 1) if all(n(ws[i + k][2]) == qs[k] for k in range(len(qs)))]
    print(f'{q!r}: {len(hits)} hit(s)')
    for i in hits:
        ctx = ' '.join(w[2] for w in ws[max(0, i - 4):i + len(qs) + 4])
        print(f'  {ws[i][0]:7.2f} - {ws[i + len(qs) - 1][1]:7.2f}   ... {ctx} ...')
