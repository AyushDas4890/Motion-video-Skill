"""Readable transcript docs from the final timings (build_caps.py calls main() at the end):
  ../docs/transcript.md     sentences with mm:ss.ss start-end
  ../docs/caps_listing.txt  one caption chunk per line "t0-t1 | words"   (cut beats on these onsets)
  ../docs/word_onsets.txt   every word "onset word | ..."                 (cue scenes with WT('word', after))
Run alone from work/:  python gen_md.py"""
import json, os
import projcfg


def mmss(t): return f"{int(t // 60):02d}:{t % 60:05.2f}"


def main(tw=None):
    if tw is None:
        from timing import timed_words
        tw = timed_words()
    P = projcfg.load()
    os.makedirs('../docs', exist_ok=True)
    sents = {}
    for s, e, w, si in tw: sents.setdefault(si, []).append((s, e, w))
    lines = [f"- `{mmss(v[0][0])}–{mmss(v[-1][1])}` {' '.join(x[2] for x in v)}" for k, v in sorted(sents.items())]
    src = (P.get('footage') or {}).get('src', '')
    md = f"""# {P.get('title', '')} — speaker transcript

Speaker: {P.get('speaker', '')}. Source: `{os.path.basename(src)}` ({(P.get('footage') or {}).get('dur', 0):.1f} s).
{len(tw)} words, {len(sents)} sentences. Timestamps are `mm:ss.ss` (start–end of each sentence).
Text: `work/transcript.txt` (corrected by hand). Timing: `work/timing.py` (CTC forced alignment when available, else
whisper times trimmed to the speech envelope), edges snapped to the RMS envelope.

## Transcript

{chr(10).join(lines)}
"""
    open('../docs/transcript.md', 'w', encoding='utf-8').write(md)
    caps = json.load(open('caps.json', encoding='utf-8'))
    open('../docs/caps_listing.txt', 'w', encoding='utf-8').write('\n'.join(f"{c[0][0]:6.2f}-{c[-1][1]:6.2f} | {' '.join(w[2] for w in c)}" for c in caps) + '\n')
    ws = [w for c in caps for w in c]
    rows = [' | '.join(f"{w[0]:.2f} {w[2]}" for w in ws[i:i + 12]) for i in range(0, len(ws), 12)]
    open('../docs/word_onsets.txt', 'w', encoding='utf-8').write('\n'.join(rows) + '\n')
    print('docs: transcript.md, caps_listing.txt, word_onsets.txt')


if __name__ == '__main__':
    main()
