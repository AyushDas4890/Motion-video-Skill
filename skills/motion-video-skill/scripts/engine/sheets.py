"""Contact sheets from a rendered film: one frame per shot (mid-shot), labelled, 10 x 3 tiles per sheet.
Run from work/:  python sheets.py <film.mp4> <outprefix>   ->  <outprefix>_1.jpg, _2.jpg ...  (then LOOK at them)"""
import json, sys, cv2, numpy as np

src, pre = sys.argv[1:3]
B = json.load(open('beats.json', encoding='utf-8'))
end = max(b['t1'] for b in B)
cap = cv2.VideoCapture(src)
vw, vh = cap.get(cv2.CAP_PROP_FRAME_WIDTH) or 1080, cap.get(cv2.CAP_PROP_FRAME_HEIGHT) or 1920
TW = 216 if vh >= vw else 320
TH = int(round(TW * vh / vw / 2) * 2)
tiles = []
for b in B:
    t = (b['t0'] + min(b['t1'], end - 0.1)) / 2
    cap.set(cv2.CAP_PROP_POS_MSEC, t * 1000); ok, f = cap.read()
    if not ok: continue
    f = cv2.resize(f, (TW, TH), interpolation=cv2.INTER_AREA)
    lab = f"{b['id']} {t:.1f} {b['lay']} {(b['scene'] or 'spk')[:16]}"
    cv2.rectangle(f, (0, 0), (TW, 18), (0, 0, 0), -1); cv2.putText(f, lab, (3, 13), cv2.FONT_HERSHEY_SIMPLEX, 0.36, (255, 255, 255), 1, cv2.LINE_AA)
    tiles.append(f)
if not tiles:
    sys.exit('no frames read from ' + src)
for s in range(0, len(tiles), 30):
    chunk = tiles[s:s + 30]; chunk += [np.zeros_like(tiles[0])] * (30 - len(chunk))
    rows = [np.hstack(chunk[r * 10:(r + 1) * 10]) for r in range(3)]
    cv2.imwrite(f'{pre}_{s // 30 + 1}.jpg', np.vstack(rows), [cv2.IMWRITE_JPEG_QUALITY, 86])
print(len(tiles), 'frames', (len(tiles) + 29) // 30, 'sheet(s)')
