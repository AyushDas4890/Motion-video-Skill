"""QA sample times -> _qa_ts.txt: mid-shot of every beat, t0+0.05 of every S/X beat (the entry zoom is largest there),
just after any in-shot camera cut (cam.cut), and PROJECT.qa.extraTimes (punch-ins, coda, anything you want checked).
Run from work/ after every beats.py:  python gen_qa_ts.py  ->  node render.mjs qa $(cat _qa_ts.txt) ../qa/rN"""
import json
import projcfg

P = projcfg.load()
b = json.load(open('beats.json', encoding='utf-8'))
b = b if isinstance(b, list) else b['beats']
end = max(x['t1'] for x in b)
ts = {0.05}
for x in b:
    ts.add(round((x['t0'] + x['t1']) / 2, 2))
    if x['lay'] in 'SX':
        ts.add(round(x['t0'] + 0.05, 2))
    cam = x.get('cam')
    if isinstance(cam, dict) and cam.get('cut'):
        ts.add(round(cam['cut'][0] + 0.05, 2))
ts |= {float(t) for t in P.get('qa', {}).get('extraTimes', [])}
ts = sorted(t for t in ts if 0 <= t < end)
open('_qa_ts.txt', 'w').write(','.join(str(t) for t in ts))
print(len(ts), 'times -> _qa_ts.txt')
