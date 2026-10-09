---
name: motion-video-skill
description: Turn a talking-head video (lesson, explainer, talk, reel, interview, any language) into an art-directed, colourful motion-graphics film - illustrated world, word-timed kinetic captions, chapter cards, verbatim text cards, characters and cutaways cued to the spoken words, a ducked synthesized score + sound design, QA'd and rendered deterministically (headless Chromium WebGL + ffmpeg). Asks the user a short structured intake first (purpose, platform, text to quote, look, music, deliverables, autonomy), then builds, critiques, renders and delivers master, reel, preview, poster and subtitles. Use whenever the user gives a video of someone speaking and wants motion graphics, animated captions, an "insta reel" / "YouTube short" look, b-roll illustrations, or says "edit it like this reel", "make it look wonderful", "add animations", or names motion-video-skill, even if they never say "motion graphics".
---

# Motion video skill v2 (talking head -> art-directed motion film)

Proven on "The Voice of the Rain" (221 s, 9:16, 60 fps, 146 shots, QA 0 FAIL, three critic rounds, colourful illustrated world). One canvas page draws the speaker's frame plus every graphic for time `t` (`renderFrame(t)` is pure); Playwright captures frames on the GPU, ffmpeg encodes, a synthesized score + sfx is mixed under the voice.

## Workflow (follow in order; keep RESUME.md current from step 0)

0. **Check the machine, install nothing.** `python scripts/new_project.py --check-only` prints exact fixes. Ask before installing anything.
1. **Intake.** Read `references/intake.md` and ask with AskUserQuestion (max 4 questions per call, defaults recommended first, infer what files tell you). Cover: what the video is, audience/platform/aspect/length, verbatim text and exact name spellings, reference reel (editing grammar) and reference images (look), visual world, music mood, must-haves/must-nots, deliverables, autonomy (if the user won't be around: skip check-in gates, decide, finish). Write the answers to `docs/brief.md` (`assets/brief_template.md`). Later owner feedback goes to a top section "OWNER FEEDBACK (latest)" that every agent reads.
2. **Scaffold.** `python scripts/new_project.py --video <file> --out <dir> --title ... --speaker ... [--text verbatim.txt] [--aspect 9:16]` builds the project: frames, audio, face boxes, word-timed transcript, project.js, a starter beat sheet that already renders. Check the transcript against the user's text; fix misheard names.
3. **Study + concept.** If a reference reel is given, measure its grammar (shot lengths, device mix, caption devices) and copy grammar only, never footage. Pick ONE visual world from the content and the user's reference images (`references/art_direction.md`); draw originals, never trace references. For wide-open briefs run the concept judge panel (`references/workflows.md`).
4. **Beat sheet.** Edit `work/beats_data.py`: a new device every 2-4 s on word onsets, layouts S speaker / X split / C cutaway / F full graphic, targets in art_direction.md. `python beats.py`.
5. **Build scenes** in `work/acts/scenes_*.js` using the W*/C_* kits (`scripts/engine/README.md`, `docs/color_api.md` after scaffold). Cue every hit with `WT(word, after)`; never hand-type times. For many scenes use the world-painter -> subject-artists workflow (build -> fresh review -> fix); if quota is tight write scenes inline.
6. **Look + QA loop.** `node render.mjs test <times> strip.jpg` then read the image harshly; `python gen_qa_ts.py`, `node render.mjs qa ...`, `python qa.py frames <dir>` must give 0 FAIL (safe zones, text size, contrast, face overlap, verbatim text); `node render.mjs hash ...` for determinism (sub-visible GPU AA differences on dense strokes are acceptable).
7. **Sound.** `references/audio_pipeline.md`: score.mjs, sfx.mjs, voice.py, mix.py, check_ratio.py. Voice stays sacred: music EQ'd out of 2-3 kHz, ducked, per-word floor (default 15 dB), -14 LUFS, TP <= -1.5. You cannot listen: measure.
8. **Critique.** Three fresh critics (jury, short-form editor, domain expert) score 11 criteria; fix until all >= 9 or the user says stop (`references/critique.md`).
9. **Render + deliver.** `node prender.mjs out/film.mp4 60 4 final.wav` (parallel segments, ~7 min for 3.5 min), contact sheets, reel (`reel_audio.py` + `reel.py`), 540p preview, poster, srt/vtt; copy to Downloads; `package_project.py` makes one tidy folder; write `out/FINAL_REPORT.md` (`assets/final_report_template.md`); notify the user if they asked.

## Non-negotiables
- The speaker is sacred: face never covered, never keyed out; below cover size he sits in a rounded card (no blur border). A light grade is allowed only if the user agrees.
- Text the user supplied is quoted verbatim; names spelled exactly as given.
- Original illustration only; reference images guide style, are never copied or put in the film.
- Deterministic `renderFrame(t)`: seeded RNG only, no Math.random/Date, seeds independent of call order.
- Install nothing without asking. Report honestly: what was measured, what could not be checked.

## Survive session limits
Keep `RESUME.md` (STATUS, NEXT SESSION START HERE, DONE LOG appended after every step), a memory pointer, workflow script copies in `workflows/`, scene files that always parse. If the user will be away, create the auto-resume scheduled task (`assets/auto_resume_task.md`, LOCK/FINISHED files) and a completion notification.

## Files
- `scripts/new_project.py`, `scripts/engine/` (engine, kits, QA, render, audio tools) - `scripts/engine/README.md`
- `references/`: intake.md, art_direction.md, lessons.md (bugs + fixes), critique.md, workflows.md, audio_pipeline.md
- `assets/`: brief, RESUME, auto-resume, final-report templates
- `examples/voice-of-the-rain/`: the full worked scene set and beat sheet (code only)
