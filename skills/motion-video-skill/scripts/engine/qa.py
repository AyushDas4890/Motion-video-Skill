"""Automated QA. Reads the output of `node render.mjs qa <times> <qadir>` (frames, logs.json, project.json) and
`node render.mjs meta`. Frame size, safe band, the verbatim TEXT lines and the glossary come from <qadir>/project.json
(written by render.mjs from work/project.js), so nothing here is project-specific.

  python qa.py frames <qadir>                    face safety, speaker integrity, text audit, verbatim text + glossary
  python qa.py rhythm <meta.json> <ref_shots.json>  shot-length statistics vs the reference (+-20%)
  python qa.py poemmap <qadir> <poemmap.json>    each referenced line is lit while its words are spoken
  python qa.py encode <file.mp4>                 H.264 High, yuv420p TV range, BT.709, AAC 48 kHz
Exit code 1 on any failure. Writes <qadir>/report.json for `frames`.
"""
import json, sys, re, os, statistics, subprocess
import numpy as np, cv2

PW, PH = 1080, 1920
TOP, BOT = 0.14 * PH, 0.80 * PH
POEM, GLOSS = [], {}


def setup(qadir):
    """frame size, safe band, verbatim text and glossary of the project that was rendered into qadir"""
    global PW, PH, TOP, BOT, POEM, GLOSS
    pj = os.path.join(qadir, 'project.json')
    if os.path.isfile(pj):
        P = json.load(open(pj, encoding='utf-8'))
        PW, PH = round(P['PW']), round(P['PH'])
        TOP, BOT = P['safeTop'] * PH, P['safeBot'] * PH
        POEM, GLOSS = P.get('text') or [], P.get('gloss') or {}
    else:
        print('  warn: no project.json in', qadir, '(old render.mjs?) - assuming 1080x1920, 14%/80%, no text checks')


FF = None


def parse_col(c):
    c = c.strip()
    if c.startswith('#'):
        h = c[1:]
        if len(h) == 3:
            h = ''.join(x * 2 for x in h)
        return [int(h[i:i + 2], 16) for i in (0, 2, 4)], 1.0
    m = re.match(r'rgba?\(([^)]*)\)', c)
    if m:
        v = [float(x) for x in m.group(1).split(',')]
        return v[:3], (v[3] if len(v) > 3 else 1.0)
    return [255, 255, 255], 1.0


def lum(rgb):
    def ch(v):
        v = v / 255.0
        return v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4
    r, g, b = rgb
    return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b)


def contrast(a, b):
    la, lb = lum(a), lum(b)
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)


def inter(a, b):
    w = min(a[2], b[2]) - max(a[0], b[0])
    h = min(a[3], b[3]) - max(a[1], b[1])
    return max(0, w) * max(0, h)


def area(a):
    return max(0, a[2] - a[0]) * max(0, a[3] - a[1])


def frames(qadir):
    setup(qadir)
    logs = json.load(open(os.path.join(qadir, 'logs.json'), encoding='utf-8'))
    fails, warns = [], []
    seen_lines, seen_gloss = {}, set()
    for k, L in sorted(logs.items(), key=lambda kv: float(kv[0])):
        t = float(k)
        n = cv2.imread(os.path.join(qadir, f'{k}_n.jpg'))
        m = cv2.imread(os.path.join(qadir, f'{k}_m.jpg'))
        bimg = cv2.imread(os.path.join(qadir, f'{k}_b.jpg'))
        faces = [f['b'] for f in L.get('faces', []) if not f.get('exiting')]
        # 1. face safety: the graphics-only pass must be black inside every face box
        for fb in faces:
            x0, y0, x1, y1 = [int(v) for v in fb]
            x0, y0, x1, y1 = max(0, x0), max(0, y0), min(PW, x1), min(PH, y1)
            if x1 <= x0 or y1 <= y0:
                continue
            roi = m[y0:y1, x0:x1]
            frac = float((roi.max(axis=2) > 48).mean())
            if frac > 0.005:
                fails.append(f'{t:.2f} FACE graphics cover {frac*100:.1f}% of face box {fb}')
        for bl in L.get('blooms', []):
            if bl['k'] < 0.12:
                ox, oy = bl['origin']
                for fb in faces + [f['b'] for f in L.get('faces', [])]:
                    if fb[0] - 40 <= ox <= fb[2] + 40 and fb[1] - 40 <= oy <= fb[3] + 40:
                        fails.append(f'{t:.2f} TRANSITION opens over the face at {ox},{oy}')
        # 1b. speaker integrity: outside caption boxes the speaker's pixels equal a speaker-only render (no grade, no overlay)
        sp = cv2.imread(os.path.join(qadir, f'{k}_s.jpg'))
        if sp is not None and not L.get('trans'):
            for rect in [r['b'] for r in L.get('spk', []) if not r.get('exiting')]:
                x0, y0, x1, y1 = [int(v) for v in rect]
                x0, y0, x1, y1 = max(0, x0), max(0, y0), min(PW, x1), min(PH, y1)
                if x1 <= x0 or y1 <= y0:
                    continue
                msk = np.ones((y1 - y0, x1 - x0), bool)
                for tx in L.get('texts', []):
                    b = tx['b']
                    pad = 30
                    msk[max(0, b[1] - pad - y0):max(0, b[3] + pad - y0), max(0, b[0] - pad - x0):max(0, b[2] + pad - x0)] = False
                if msk.sum() < 1000:
                    continue
                d = np.abs(n[y0:y1, x0:x1].astype(int) - sp[y0:y1, x0:x1].astype(int)).max(axis=2)[msk]
                if d.mean() > 2.5 or (d > 40).mean() > 0.002:
                    fails.append(f'{t:.2f} SPEAKER ALTERED outside captions: mean diff {d.mean():.2f}, {100*(d>40).mean():.2f}% px > 40')
        # 2. text audit
        texts = [x for x in L.get('texts', []) if x['kind'] == 'must' and x['alpha'] > 0.5]
        for x in texts:
            b = x['b']
            tag = f'{t:.2f} "{x["s"][:40]}"'
            if b[0] < -2 or b[1] < -2 or b[2] > PW + 2 or b[3] > PH + 2:
                fails.append(f'{tag} OFFSCREEN {b}')
            if x.get('clipped'):
                fails.append(f'{tag} CLIPPED by a layout edge {b}')
            if b[1] < TOP - 2 or b[3] > BOT + 2:
                fails.append(f'{tag} in forbidden zone (outside the safe band {TOP:.0f}-{BOT:.0f}px) {b}')
            if x['px'] < 28:
                fails.append(f'{tag} too small {x["px"]}px')
            for fb in faces:
                if inter(b, fb) > 0.02 * area(b):
                    fails.append(f'{tag} OVER FACE {b} vs {fb}')
            # contrast
            fg, fa = parse_col(x['col'])
            edge = x.get('edge') or {}
            if edge.get('stroke') and edge.get('w', 0) >= 3:
                bgc, _ = parse_col(edge['stroke'])
                cr = contrast(fg, bgc)
            else:
                xb0, yb0, xb1, yb1 = [int(v) for v in b]
                xb0, yb0, xb1, yb1 = max(0, xb0), max(0, yb0), min(PW, xb1), min(PH, yb1)
                roi = bimg[yb0:yb1, xb0:xb1].reshape(-1, 3)[:, ::-1].astype(float) if xb1 > xb0 and yb1 > yb0 else np.zeros((1, 3))
                mean = roi.mean(axis=0)
                if fa < 1:
                    fg = [fg[i] * fa + mean[i] * (1 - fa) for i in range(3)]
                cr = contrast(fg, mean)
                l = np.array([lum(p) for p in roi[::max(1, len(roi) // 400)]])
                worst = max(l.max(), 0) if lum(fg) < 0.5 else min(l.min(), 1)
                if lum(fg) >= 0.5:
                    wcr = (lum(fg) + 0.05) / (np.percentile(l, 90) + 0.05)
                else:
                    wcr = (np.percentile(l, 10) + 0.05) / (lum(fg) + 0.05)
                if wcr < 3.0:
                    warns.append(f'{tag} worst-case contrast {wcr:.2f}')
            if cr < 4.5:
                fails.append(f'{tag} contrast {cr:.2f} < 4.5')
        for i in range(len(texts)):
            for j in range(i + 1, len(texts)):
                a, b2 = texts[i], texts[j]
                if a.get('grp') and a.get('grp') == b2.get('grp'):
                    continue
                ov = inter(a['b'], b2['b'])
                if ov > 0.12 * min(area(a['b']), area(b2['b'])):
                    fails.append(f'{t:.2f} OVERLAP "{a["s"][:24]}" x "{b2["s"][:24]}"')
        # 3. verbatim
        for pe in L.get('poem', []):
            li, s = pe['li'], pe['s']
            if li >= len(POEM) or s != POEM[li]:
                fails.append(f'{t:.2f} TEXT line {li+1} not verbatim: {s!r}')
            seen_lines.setdefault(li, []).append(t)
        for gl in L.get('gloss', []):
            if GLOSS.get(gl['word']) != gl['def']:
                fails.append(f'{t:.2f} GLOSS {gl["word"]!r} wrong definition {gl["def"]!r}')
            seen_gloss.add(gl['word'])
    rep = {'frames': len(logs), 'fails': fails, 'warns': warns, 'poem_lines_seen': {str(k + 1): len(v) for k, v in sorted(seen_lines.items())}, 'gloss_seen': sorted(seen_gloss)}
    json.dump(rep, open(os.path.join(qadir, 'report.json'), 'w'), indent=1)
    print(f'QA frames: {len(logs)} sampled, {len(fails)} FAIL, {len(warns)} warn')
    for f in fails[:80]:
        print('  FAIL', f)
    for w in warns[:30]:
        print('  warn', w)
    print('  text lines seen (frames):', rep['poem_lines_seen'])
    print('  glossary seen:', rep['gloss_seen'])
    return not fails


def rhythm(meta, ref):
    shots = json.load(open(meta, encoding='utf-8'))['shots']
    d = [s['t1'] - s['t0'] for s in shots if s['t1'] - s['t0'] > 0.05]
    d[-1] = min(d[-1], 6)
    R = json.load(open(ref, encoding='utf-8'))
    rd = [s['t1'] - s['t0'] for s in R]
    out = {}
    ok = True
    for name, f in [('mean', statistics.mean), ('median', statistics.median)]:
        a, b = f(d), f(rd)
        within = abs(a - b) <= 0.2 * b
        ok &= within
        out[name] = (round(a, 2), round(b, 2), within)
        print(f'RHYTHM {name}: film {a:.2f}s ref {b:.2f}s  {"PASS" if within else "FAIL"} (+-20%)')
    long = [(round(s['t0'], 2), round(s['t1'] - s['t0'], 2), s['lay']) for s in shots if s['t1'] - s['t0'] > 4.0]
    print(f'  shots {len(d)}; longer than 4 s: {long[:20]}')
    by = {}
    for s in shots:
        by[s['lay']] = by.get(s['lay'], 0) + (s['t1'] - s['t0'])
    print('  screen time by layout:', {k: round(v, 1) for k, v in by.items()})
    return ok


def poemmap(qadir, pm):
    logs = json.load(open(os.path.join(qadir, 'logs.json'), encoding='utf-8'))
    M = json.load(open(pm, encoding='utf-8'))
    ok = True
    for e in M:
        hits = [k for k, L in logs.items() if e['t0'] <= float(k) <= e['t1']]
        lit = [k for k in hits if any(p['li'] == e['li'] and p.get('lit') for p in logs[k].get('poem', []))]
        good = len(hits) > 0 and len(lit) >= max(1, len(hits) // 2)
        ok &= good
        print(f'POEMMAP line {e["li"]+1} {e["t0"]:.1f}-{e["t1"]:.1f}: {len(lit)}/{len(hits)} sampled frames lit  {"PASS" if good else "FAIL"}')
    return ok


def encode(f):
    exe = os.environ.get('FF') or __import__('imageio_ffmpeg').get_ffmpeg_exe()
    r = subprocess.run([exe, '-hide_banner', '-i', f], capture_output=True, text=True).stderr
    v = [l for l in r.splitlines() if 'Video:' in l]
    a = [l for l in r.splitlines() if 'Audio:' in l]
    checks = {'h264 High': bool(v) and 'h264 (High)' in v[0], 'yuv420p TV range': bool(v) and 'yuv420p(tv' in v[0] and 'yuvj' not in v[0],
              'BT.709': bool(v) and 'bt709' in v[0], 'AAC 48 kHz': bool(a) and 'aac' in a[0] and '48000 Hz' in a[0]}
    for k, okk in checks.items():
        print(f'ENCODE {k}: {"PASS" if okk else "FAIL"}')
    print('  ', v[0].strip() if v else 'no video', '|', a[0].strip() if a else 'no audio')
    return all(checks.values())


if __name__ == '__main__':
    cmd = sys.argv[1]
    ok = {'frames': lambda: frames(sys.argv[2]), 'rhythm': lambda: rhythm(sys.argv[2], sys.argv[3]),
          'poemmap': lambda: poemmap(sys.argv[2], sys.argv[3]), 'encode': lambda: encode(sys.argv[2])}[cmd]()
    sys.exit(0 if ok else 1)
