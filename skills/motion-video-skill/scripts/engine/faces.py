"""Speaker head boxes for EVERY extracted frame -> face_boxes.json (+ ../review/face_check.jpg to LOOK at).
The engine uses them to keep graphics off the face, place captions under the chin, anchor punch-ins on the head top, and
QA checks every frame against them. Method (VotR v4, checked by eye on 24 tiles):
  Haar frontalface_default on a 0.5x histogram-equalised gray frame (alt2, then profile and mirrored profile as
  fallbacks); the box nearest the previous one wins when several are found; outliers (> 12% of the face size off a
  31-frame rolling median) are dropped and re-interpolated; median-5 then centred mean-7 smoothing (zero lag, ~0.23 s);
  padded 15% each side, 30% up (hair), 20% down (chin/neck); look-down guard: the head top never drops below its 10 s
  rolling median. kit.js faceBox() un-pads this to the face itself (12% sides, 26% up, 7% down).
Run from work/:  python faces.py [vf] [fps]
face_boxes.json: {fps, w, h, pad, boxes[[x,y,w,h] per frame, source px], detected[], scenes[{t0,t1,head_union,
head_shoulders_union}], windows10s[...]}"""
import json, os, sys
import numpy as np, cv2

D = sys.argv[1] if len(sys.argv) > 1 else 'vf'
FPS = float(sys.argv[2]) if len(sys.argv) > 2 else 30.0
files = sorted(f for f in os.listdir(D) if f.lower().endswith('.jpg'))
assert files, 'no frames in ' + D
h0, w0 = cv2.imread(os.path.join(D, files[0])).shape[:2]
H = cv2.data.haarcascades
cc = [cv2.CascadeClassifier(H + n) for n in ('haarcascade_frontalface_default.xml', 'haarcascade_frontalface_alt2.xml')]
cp = cv2.CascadeClassifier(H + 'haarcascade_profileface.xml')
SC = 0.5 if max(w0, h0) >= 600 else 1.0
mins = max(24, int(min(w0, h0) * SC * 0.12))
raw = np.full((len(files), 4), np.nan)
prev = None
for i, f in enumerate(files):
    g = cv2.cvtColor(cv2.imread(os.path.join(D, f)), cv2.COLOR_BGR2GRAY)
    g = cv2.equalizeHist(cv2.resize(g, None, fx=SC, fy=SC, interpolation=cv2.INTER_AREA))
    found = []
    for c in cc:
        found = c.detectMultiScale(g, 1.1, 5, minSize=(mins, mins))
        if len(found): break
    if not len(found):
        found = cp.detectMultiScale(g, 1.1, 4, minSize=(mins, mins))
        if not len(found):
            fl = cp.detectMultiScale(cv2.flip(g, 1), 1.1, 4, minSize=(mins, mins))
            found = [(g.shape[1] - x - w, y, w, h) for x, y, w, h in fl]
    if len(found):
        if prev is None:
            b = max(found, key=lambda r: r[2] * r[3])
        else:
            b = min(found, key=lambda r: abs(r[0] + r[2] / 2 - prev[0] - prev[2] / 2) + abs(r[1] + r[3] / 2 - prev[1] - prev[3] / 2) - 0.5 * r[2])
        raw[i] = np.array(b, float) / SC; prev = raw[i]
    if i % 600 == 0:
        print(f'  {i}/{len(files)}', flush=True)
det = ~np.isnan(raw[:, 0])
print(f'detected {det.sum()}/{len(files)} frames')
if det.sum() == 0:
    print('WARNING: no face found in any frame - using a centred default box. Check review/face_check.jpg and fix by hand.')
    raw[:] = [w0 * 0.25, h0 * 0.22, w0 * 0.5, w0 * 0.5]; det[:] = True


def interp(a, ok):
    x = np.arange(len(a)); out = a.copy()
    for k in range(a.shape[1]):
        out[:, k] = np.interp(x, x[ok], a[ok, k])
    return out


b = interp(raw, det)
# outliers vs a 31-frame rolling median of centre and size
cx, cy, sz = b[:, 0] + b[:, 2] / 2, b[:, 1] + b[:, 3] / 2, b[:, 2]
def rmed(v, n):
    p = n // 2; vv = np.pad(v, p, mode='edge')
    return np.array([np.median(vv[i:i + n]) for i in range(len(v))])
mcx, mcy, msz = rmed(cx, 31), rmed(cy, 31), rmed(sz, 31)
out = det & ((np.abs(cx - mcx) > 0.12 * msz) | (np.abs(cy - mcy) > 0.12 * msz) | (np.abs(sz - msz) > 0.12 * msz))
ok = det & ~out
print(f'outliers dropped: {int(out.sum())}')
if ok.sum() == 0: ok = det
b = interp(raw, ok)
# smooth: median-5 then centred mean-7
b = np.stack([rmed(b[:, k], 5) for k in range(4)], 1)
ker = np.ones(7) / 7
b = np.stack([np.convolve(np.pad(b[:, k], 3, mode='edge'), ker, mode='valid') for k in range(4)], 1)
# pad: 15% each side, 30% up, 20% down
x, y, w, h = b[:, 0] - 0.15 * b[:, 2], b[:, 1] - 0.30 * b[:, 3], b[:, 2] * 1.3, b[:, 3] * 1.5
# look-down guard: the head top never drops below its 10 s rolling median (hair stays up when the face dips)
win = max(3, int(FPS * 10) | 1)
top_med = rmed(y, win)
ny = np.minimum(y, top_med); h = h + (y - ny); y = ny
boxes = [[round(float(a), 1), round(float(c), 1), round(float(d), 1), round(float(e), 1)] for a, c, d, e in zip(x, y, w, h)]


def union(i0, i1, shoulders=False):
    X0 = max(0.0, float(x[i0:i1].min())); Y0 = max(0.0, float(y[i0:i1].min()))
    X1 = min(w0, float((x + w)[i0:i1].max())); Y1 = min(h0, float((y + h)[i0:i1].max() + (h[i0:i1].mean() * 0.15 if shoulders else 0)))
    return [round(X0), round(Y0), round(X1 - X0), round(Y1 - Y0)]


n = len(boxes); dur = n / FPS
wins = [{'t0': round(a, 2), 't1': round(min(dur, a + 10), 2), 'head_union': union(int(a * FPS), max(int(a * FPS) + 1, int(min(dur, a + 10) * FPS))),
         'head_shoulders_union': union(int(a * FPS), max(int(a * FPS) + 1, int(min(dur, a + 10) * FPS)), True)} for a in np.arange(0, dur, 10.0)]
J = {'fps': FPS, 'w': w0, 'h': h0,
     'pad': 'haar frontal_default on %.1fx equalized gray (alt2/profile fallback); outliers >12%% vs 31f rolling median interpolated; median5 + centred mean7; pad 15%% each side, 30%% up, 20%% down; head top never below its 10 s rolling median; [x,y,w,h] source px' % SC,
     'boxes': boxes, 'detected': [bool(v) for v in det], 'scenes': [{'t0': 0.0, 't1': round(dur, 2), 'head_union': union(0, n), 'head_shoulders_union': union(0, n, True)}], 'windows10s': wins}
json.dump(J, open('face_boxes.json', 'w'))
fw = np.array([bb[2] for bb in boxes]) / 1.3
print(f'face_boxes.json: {n} boxes, raw face width median {np.median(fw):.0f}px ({100*np.median(fw)/w0:.0f}% W), head top median {100*np.median(y)/h0:.0f}% H')
# check sheet: 12 evenly spaced frames, raw (orange) + final padded (green)
try:
    os.makedirs('../review', exist_ok=True)
    idx = np.linspace(0, n - 1, 12).astype(int); tiles = []
    for i in idx:
        im = cv2.imread(os.path.join(D, files[i]))
        if det[i] and not np.isnan(raw[i, 0]):
            r = raw[i].astype(int); cv2.rectangle(im, (r[0], r[1]), (r[0] + r[2], r[1] + r[3]), (0, 140, 255), 2)
        bb = [int(v) for v in boxes[i]]; cv2.rectangle(im, (bb[0], bb[1]), (bb[0] + bb[2], bb[1] + bb[3]), (60, 220, 60), 3)
        cv2.putText(im, f'{i / FPS:.1f}s', (8, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (255, 255, 255), 2)
        tiles.append(cv2.resize(im, (240, int(240 * h0 / w0))))
    rows = [np.hstack(tiles[k:k + 6]) for k in (0, 6)]
    cv2.imwrite('../review/face_check.jpg', np.vstack(rows), [cv2.IMWRITE_JPEG_QUALITY, 85])
    print('check sheet: ../review/face_check.jpg (orange = raw detection, green = final padded head box)')
except Exception as e:
    print('face_check sheet skipped:', e)
