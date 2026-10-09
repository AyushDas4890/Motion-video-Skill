# Audio pipeline (run from `work/`; config in `audio_config.json`, every key optional)

Order: `python voice.py` -> `voice_proc.wav` (cleaned, normalized -16 LUFS) -> `node score.mjs` -> `music.wav` (auto mode derives sections from beats.json: chapter cards = section changes, gentle bed under speech, breaths on key lines, swell + bloom at the payoff) -> `node sfx.mjs` -> `sfx.wav` (one transition sound per cut chosen by incoming layout S/X/C/F, chapter hit + letter ticks, scene hits via `sfx_cues_extra.json`: drop, swipe, glint, bell...) -> `python mix.py music.wav sfx.wav final.wav --len <film s> [--floor 15]` -> `python check_ratio.py voice_proc.wav bed_final.wav`.

## Principles
- The voice is sacred: only the bed moves. Music EQ'd out of 2-3 kHz (dip at 2.4 kHz) plus a 5.8 kHz cut so glass/air never sits on sibilance; sidechain-ducked by the voice; sfx get the music gain plus a trim.
- Per-word floor: every spoken word must sit >= 15 dB over the bed (configurable `--floor`); mix.py automates cuts word by word, then smooths clusters of deep cuts into one "breath" (pumping sounds bad).
- Hook lift: before the first word the bed plays near dialogue level (+13 dB lift), then falls under the voice. Coda lift on the music-only tail after the last word.
- Payoff: hold the music under the key line, then swell and bloom on the key word (v4: "Thank you" C-major at the sunrise).
- Master: two-pass loudnorm to -14 LUFS, true peak <= -1.5 dBTP.
- Reel: `reel_audio.py` makes the reel's own music edit from the reel SEG list so the payoff still lands on the key word.
- You cannot listen: verify with LUFS/TP, `check_ratio.py` (min and median gap), and spectra. Report the numbers.

## audio_config.json keys
`film_len`, `voice_src`, `voice_offset`, `files{}`, `voice{lufs,tp,hpf_hz,denoise,comp_*,presence_db}`, `score{mode,seed,key,payoff,moods,sections,chapter_regex,breaths,motif_words,gain{}}`, `sfx{master_db,opener,...}`, mix `{floor, music_under_voice_lu, breaths, hook/coda lift}`. Times may be seconds or word anchors resolved against caps.json ("thank", "thank#2", "rain@100", "you~end", "word+0.3"). See the `_help` field at the top of the file.

## Verified
v4 full film (221.6 s): -14.0 LUFS, TP -1.77, min per-word gap 15.2 dB, median ~19 dB.
