"""Let the audio decide uncertain readings (English, needs ctc_lp.npy from ctc_emis.py).
In transcript.txt write {chosen|alternative|...}; this force-aligns the whole text once per alternative and prints the
log-probability difference vs the chosen reading. A difference above ~+5 nats = the audio prefers that alternative
(VotR: 'course syllabus, class 11,' +6.4 over 'course 11,'). Run from work/:  python ctc_score.py"""
import time
from final_text import options, render
from ctc_align import align


def words(sents): return " ".join(sents).split()


t0 = time.time()
base, _ = align(words(render()))
print(f"base score {base:.1f} ({time.time()-t0:.1f}s)")
for k, opt in enumerate(options()):
    alts = opt.split("|")
    res = [(alts[0], 0.0)]
    for j in range(1, len(alts)):
        sc, _ = align(words(render({k: j})))
        res.append((alts[j], sc - base))
    print(k, " | ".join(f"{a!r}: {d:+.1f}" for a, d in res))
