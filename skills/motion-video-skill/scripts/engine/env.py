"""Speech energy envelope: 10 ms RMS dB of a16.wav -> env_db.npy (timing.py snaps word edges to it; starter_beats.py
uses it for emphasis). Run from work/:  python env.py [a16.wav] [t0 t1]   (t0 t1: also print a bar graph of that span)"""
import sys, wave, numpy as np

src = sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].replace('.', '').isdigit() else 'a16.wav'
w = wave.open(src)
assert w.getsampwidth() == 2 and w.getnchannels() == 1, 'expects 16-bit mono (new_project.py writes a16.wav that way)'
sr = w.getframerate()
x = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768
hop = sr // 100  # 10 ms
n = len(x) // hop
rms = np.sqrt((x[:n * hop].reshape(n, hop) ** 2).mean(1) + 1e-12)
db = 20 * np.log10(rms)
np.save('env_db.npy', db)
print('frames', n, 'median dB %.1f p10 %.1f p90 %.1f' % (np.median(db), np.percentile(db, 10), np.percentile(db, 90)))
nums = [a for a in sys.argv[1:] if a.replace('.', '').isdigit()]
if len(nums) >= 2:
    a, b = float(nums[0]), float(nums[1])
    for t in np.arange(a, b, 0.05):
        i = int(t * 100); v = db[i:i + 5].max()
        print(f'{t:7.2f} {v:6.1f} ' + '#' * max(0, int((v + 60) / 1.5)))
