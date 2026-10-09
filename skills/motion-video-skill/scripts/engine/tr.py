"""Speech -> words with timestamps (faster-whisper, CPU int8) -> words_whisper.json, and a first transcript.txt draft.
Run from work/:
    python tr.py [--audio a16.wav] [--model auto] [--lang en] [--prompt "names, terms"] [--threads 8] [--force-text]
--model auto tries large-v3-turbo, medium, small, base in that order and uses the first one ALREADY in the Hugging Face
cache (local_files_only: this never downloads). --lang omitted = auto-detect. --prompt: spellings of names and terms the
speaker uses (title, speaker name, jargon) - whisper copies their spelling.
Whisper's word times stretch over pauses (VotR: 'rain' 1.6 s early). They are only a draft: timing.py refines them (CTC
forced alignment for English, else energy-envelope trimming). transcript.txt (one sentence per line) is the text you
correct (names!) before python build_caps.py; it is not overwritten unless --force-text.
words_whisper.json: [{"s","e","t","w":[[start,end,word,prob],..]},..] (segments)."""
import argparse, json, os, sys, time

ap = argparse.ArgumentParser()
ap.add_argument('--audio', default='a16.wav')
ap.add_argument('--model', default='auto')
ap.add_argument('--lang', default=None)
ap.add_argument('--prompt', default='')
ap.add_argument('--threads', type=int, default=max(2, min(8, (os.cpu_count() or 4))))
ap.add_argument('--out', default='words_whisper.json')
ap.add_argument('--force-text', action='store_true')
A = ap.parse_args()

from faster_whisper import WhisperModel

order = ['large-v3-turbo', 'medium', 'small', 'base'] if A.model == 'auto' else [A.model]
m, used = None, None
t0 = time.time()
for name in order:
    try:
        m = WhisperModel(name, device='cpu', compute_type='int8', cpu_threads=A.threads, local_files_only=True)
        used = name
        break
    except Exception as e:
        print(f'  model {name}: not usable offline ({type(e).__name__})')
if m is None:
    sys.exit('No faster-whisper model in the local cache. Ask the owner before downloading one, e.g. '
             'python -c "from faster_whisper import WhisperModel; WhisperModel(\'small\')"')
print('model', used, 'loaded', round(time.time() - t0, 1), 's', flush=True)
segs, info = m.transcribe(A.audio, word_timestamps=True, language=A.lang, initial_prompt=A.prompt or None, beam_size=5, vad_filter=False)
res = []
for s in segs:
    res.append({'s': round(s.start, 2), 'e': round(s.end, 2), 't': s.text.strip(),
                'w': [[round(w.start, 2), round(w.end, 2), w.word.strip(), round(w.probability, 3)] for w in (s.words or []) if w.word.strip()]})
    print(f'{s.start:7.2f} {s.text.strip()}', flush=True)
json.dump({'model': used, 'lang': info.language, 'segments': res}, open(A.out, 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
nw = sum(len(s['w']) for s in res)
print(f'{nw} words, language {info.language} ({info.language_probability:.2f}), {round(time.time() - t0, 1)} s -> {A.out}')

# first transcript draft: one sentence per line (split on . ? ! and on long pauses)
if A.force_text or not os.path.isfile('transcript.txt'):
    lines, cur, prev_e = [], [], None
    for s in res:
        for w0, w1, word, _ in s['w']:
            if cur and prev_e is not None and w0 - prev_e > 1.2:
                lines.append(' '.join(cur)); cur = []
            cur.append(word); prev_e = w1
            if word[-1:] in '.?!।' and len(cur) > 0:
                lines.append(' '.join(cur)); cur = []
    if cur:
        lines.append(' '.join(cur))
    hdr = ('# transcript.txt — the corrected spoken text, one sentence per line (lines starting with # are ignored).\n'
           '# Fix misheard words and NAMES here (keep every spoken word, in order), then: python build_caps.py\n'
           '# Uncertain reading? write {chosen|alternative} and run python ctc_score.py (English) to let the audio decide.\n')
    open('transcript.txt', 'w', encoding='utf-8').write(hdr + '\n'.join(lines) + '\n')
    print(len(lines), 'sentences -> transcript.txt (edit names/misheard words, then python build_caps.py)')
