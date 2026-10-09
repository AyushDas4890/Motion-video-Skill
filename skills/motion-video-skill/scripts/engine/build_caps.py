"""Corrected text (transcript.txt) + final timings (timing.py) -> the caption data the engine and the audio use:
  words_flat.json  [[start, end, word], ...]
  caps.json        [[[start, end, word], ...2-4 words], ...]   chunks for chest captions / capAt() / WT()
  ../out/<slug>.srt + .vtt                                      3-7 word subtitle cues, 2-line wrapped
  ../docs/transcript.md, ../docs/caps_listing.txt, ../docs/word_onsets.txt   (via gen_md.py)
Run from work/ after editing transcript.txt:  python build_caps.py   (then python beats.py if beats exist)
Chunking is a DP per sentence: prefers breaks at punctuation and pauses, never after a function word, never splits
PROJECT.captions.keepPairs (e.g. ["mother","earth"]), never spans a pause >= 0.7 s."""
import json, os
import projcfg
from timing import timed_words

P = projcfg.load()
FUNC = set("the a an of to its my our your in into from by as at for and but or that this".split())
AUX = set("is are was were it we you i could can has have will must wants want make".split())
PUNCT = ",;:.?!।"
KEEP = {tuple(p) for p in (P.get('captions') or {}).get('keepPairs', [])}


def segment(ws, lo, hi, target, comma_pen=4):
    """DP split of one sentence's words into chunks of lo..hi words (1 only if sentence has 1 word)."""
    n = len(ws)
    if n <= hi and all(ws[k + 1][0] - ws[k][1] < 0.7 for k in range(n - 1)): return [ws]
    def bcost(i):  # cost of a break after word i
        gap = ws[i + 1][0] - ws[i][1]
        c = -min(gap, 1.0) * 3
        if ws[i][2][-1] in PUNCT: c -= 3
        lw = ws[i][2].lower().strip(PUNCT)
        if ws[i][2][-1] not in PUNCT: c += 5 if lw in FUNC else 3 if lw in AUX else 0
        if (lw, ws[i + 1][2].lower().strip(PUNCT)) in KEEP: c += 8
        return c
    def scost(i, j):  # chunk ws[i:j]
        k = j - i
        inner = any(ws[m + 1][0] - ws[m][1] >= 0.7 for m in range(i, j - 1))
        inner_comma = sum(ws[m][2][-1] in PUNCT for m in range(i, j - 1))
        return (k - target) ** 2 * 0.4 + (6 if k == 1 else 0) + (50 if inner else 0) + comma_pen * inner_comma
    best = [0.0] + [1e9] * n; back = [0] * (n + 1)
    for j in range(1, n + 1):
        for k in range(1, hi + 1):
            i = j - k
            if i < 0: break
            c = best[i] + scost(i, j) + (bcost(j - 1) if j < n else 0)
            if c < best[j]: best[j], back[j] = c, i
    out, j = [], n
    while j > 0: out.append(ws[back[j]:j]); j = back[j]
    return out[::-1]


def sentences(tw):
    out = {}
    for s, e, w, si in tw: out.setdefault(si, []).append([s, e, w])
    return [out[k] for k in sorted(out)]


def ts(t, sep):
    ms = int(round(t * 1000)); h, ms = divmod(ms, 3600000); m, ms = divmod(ms, 60000); s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d}{sep}{ms:03d}"


def wrap(text, width=24):
    if len(text) <= width: return text
    words = text.split(); best = None
    for k in range(1, len(words)):
        a, b = " ".join(words[:k]), " ".join(words[k:])
        la, lb = words[k - 1].lower().strip(PUNCT), words[k].lower().strip(PUNCT)
        sc = max(len(a), len(b)) + (8 if (la, lb) in KEEP else 0) + (0 if words[k - 1][-1] in PUNCT else 4 if la in FUNC else 3 if la in AUX else 0) - (5 if words[k - 1][-1] in PUNCT else 0)
        if best is None or sc < best[0]: best = (sc, a + "\n" + b)
    return best[1]


if __name__ == "__main__":
    tw = timed_words()
    flat = [[s, e, w] for s, e, w, _ in tw]
    json.dump(flat, open("words_flat.json", "w", encoding="utf-8"), ensure_ascii=False)
    sents = sentences(tw)
    caps = [c for snt in sents for c in segment(snt, 2, 4, 3)]
    json.dump(caps, open("caps.json", "w", encoding="utf-8"), ensure_ascii=False)
    cues = [c for snt in sents for c in segment(snt, 3, 7, 6, comma_pen=0.7)]
    srt, vtt = [], ["WEBVTT", ""]
    for i, c in enumerate(cues):
        st = c[0][0]; en = c[-1][1] + 0.25
        nxt = cues[i + 1][0][0] if i + 1 < len(cues) else 1e9
        en = max(min(en, nxt - 0.04), min(st + 0.9, nxt - 0.04))
        txt = wrap(" ".join(w[2] for w in c))
        srt += [str(i + 1), f"{ts(st, ',')} --> {ts(en, ',')}", txt, ""]
        vtt += [f"{ts(st, '.')} --> {ts(en, '.')}", txt, ""]
    os.makedirs("../out", exist_ok=True)
    name = projcfg.slug(P.get("title") or "film")
    open(f"../out/{name}.srt", "w", encoding="utf-8").write("\n".join(srt))
    open(f"../out/{name}.vtt", "w", encoding="utf-8").write("\n".join(vtt))
    assert sum(len(c) for c in caps) == len(flat) == sum(len(c) for c in cues)
    assert all(a[1] <= b[0] + 1e-6 for a, b in zip(flat, flat[1:])), "overlap"
    sizes = [len(c) for c in caps]
    print("words", len(flat), "chunks", len(caps), "sizes", {k: sizes.count(k) for k in sorted(set(sizes))}, "cues", len(cues), f"-> caps.json, ../out/{name}.srt/.vtt")
    for c in caps:
        if len(c) == 1: print("  1-word chunk:", c)
    import gen_md  # docs/transcript.md, caps_listing.txt, word_onsets.txt
    gen_md.main(tw)
