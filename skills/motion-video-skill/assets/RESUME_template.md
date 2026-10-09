<!--
RESUME TEMPLATE (motion-video-skill). Copy to <project>/RESUME.md at intake. Keep it CURRENT: it is how the work survives
usage limits, context compaction and new sessions. Rules:
- The top STATUS block is the newest truth. Rewrite it whenever the plan changes, and quote the owner's latest instruction.
- Append one line to the DONE LOG after EVERY finished step (render, QA pass, mix, workflow result, delivery), BEFORE you start the next.
- "NEXT SESSION START HERE" holds exact, copy-pasteable commands with their working directory and env vars. Never write "continue as before".
- Point a memory entry at this file (e.g. memory/<slug>-resume.md: "read <project>/RESUME.md top block first").
- When a workflow is running, write its run id AND the path of its script copy (workflows/<name>-<runid>.js) here.
  If it dies, a new session re-runs that script; agents continue their partial files.
- Placeholders are written {{LIKE_THIS}}. Scripts (scripts/new_project.py) may pre-fill ONLY the machine-known keys:
  TITLE, SLUG, PROJECT_DIR, VIDEO, DURATION, SRC_W, SRC_H, SRC_FPS, OUT_W, OUT_H, OUT_FPS, FILM_END, SPEAKER,
  DATE, DATE_TIME, PLAYWRIGHT_NODE_MODULES, FFMPEG_EXE, PYTHON, NODE, DOWNLOADS, PACKAGE_DIR.
  Claude fills the rest. Delete these comment blocks when filled.
-->
# >>> STATUS {{DATE_TIME}} — owner's latest instruction: "{{OWNER_LATEST_QUOTE}}" <<<
- Now: {{WHAT_IS_RUNNING_OR_JUST_DONE}}
- NEXT (in order): {{STEP_1}} → {{STEP_2}} → {{STEP_3}} → … → deliver → notify. Mark each one in the DONE LOG as you finish it.
- AUTO-RESUME: {{none | scheduled task '{{SLUG}}-auto-resume' (cron 17 */2 * * *) restarts this job until out/FINISHED.txt exists; out/LOCK.txt modified < 90 min ago = a session is busy (refresh it about every 20 min while you work)}}
- NOTIFY: {{none | owner wants a PushNotification on completion (one line: what is done and where); also notify on a blocker}}
- DONE LOG (append only; newest last):
  - {{DATE}} intake done → docs/brief.md ({{N}} questions asked, {{M}} defaults)
  - {{DATE}} project scaffolded (new_project.py): frames, caps.json, face boxes, starter beats

# >>> NEXT SESSION START HERE <<<
1. Read `docs/brief.md`: "Brief at a glance" + **OWNER FEEDBACK (latest)** (it overrides everything).
2. Check the state: {{STATE_CHECK}} (e.g. `ls -la out/ work/acts/` sizes and times · `tail out/render.log` · open the newest `review/rN/sheet_*.jpg`).
3. Continue from the first step in the STATUS NEXT list that is not in the DONE LOG. Exact commands are under "Commands" below.
4. {{IF_WORKFLOW: If workflow {{RUN_ID}} died, re-run its script: Workflow({script: <contents of workflows/{{SCRIPT}}>}). Each agent reads its own partial file first and continues. In the same session you may use resumeFromRunId instead.}}
5. Refresh the package and deliverables after any render: {{PACKAGE_CMD}}.

Rules: chat style {{CHAT_STYLE}} · speaker = **{{SPEAKER}}** (exact spelling) · quoted text verbatim · never put reference footage or images in the film (draw originals) · never cover the face · deterministic render · install nothing without asking · owner decisions in brief.md are NOT faults.

# RESUME — {{TITLE}}
Project `{{PROJECT_DIR}}` · source `{{VIDEO}}` ({{DURATION}} s, {{SRC_W}}×{{SRC_H}}, {{SRC_FPS}} fps) · output {{OUT_W}}×{{OUT_H}} {{OUT_FPS}} fps, film length {{FILM_END}} s.
Brief: `docs/brief.md` · story: `docs/story.md` · beats: `docs/beat_sheet.md` · decisions and scores: `docs/style/decision.md` · fix list: `docs/round{{N}}_todo.md`.

## Where we are
- {{ONE_PARAGRAPH_STATE}} (last render #, its QA result, the critic scores, what the owner saw last)

## Phase table
| # | Phase | State | Output / evidence |
|---|---|---|---|
| 0 | Intake | {{DONE}} | docs/brief.md |
| 1 | Study (transcript, story, reference grammar, footage notes) | {{}} | docs/story.md, docs/reference_grammar.md, docs/footage_notes.md |
| 2 | Concept (3 directions → style frames → critic panel) · gate 1 look | {{}} | docs/style/{A,B,C}.md, review/style/*_board.jpg, docs/style/decision.md |
| 3 | Beat sheet (+ storyboard critique) · gate 2 story & beats | {{}} | work/beats_data.py → docs/beat_sheet.md |
| 4 | Build (world kit + scenes) | {{}} | work/acts/*.js, review/build/*.jpg |
| 5 | Sound (score, SFX, voice, mix, ratio check) | {{}} | work/final.wav, mix report (LUFS, TP, min word gap) |
| 6 | QA (safe zones, size, contrast, face, verbatim, determinism) | {{}} | qa/rN report: 0 FAIL |
| 7 | Render + critique rounds (fresh critics, target ≥ 9) · gate 3 first render | {{}} | out/*.mp4, review/rN/sheet_*.jpg, scores |
| 8 | Finals (master, reel, preview, poster, subs, chapters, caption) | {{}} | out/ + Downloads |
| 9 | Deliver (package, review page, final report, notify, lessons → skill) | {{}} | out/FINAL_REPORT.md, out/FINISHED.txt |

## Owner feedback & decisions (summary; details in docs/brief.md)
- {{DATE}} "{{quote}}" → {{what was done}} ({{status}})

## Workflows (multi-agent runs)
| Run id | Script copy | Purpose | State |
|---|---|---|---|
| {{wf_…}} | workflows/{{name}}-{{runid}}.js | {{e.g. 5 subject artists build → review → fix}} | {{running / died at limit / done}} |
Quota note: parallel agents burn the session limit fast. When quota is tight, the lead writes scenes inline.

## Environment
- `GROOT={{PLAYWRIGHT_NODE_MODULES}}` (folder that contains playwright)
- `FF={{FFMPEG_EXE}}` (imageio-ffmpeg binary)
- `CRF=16`
- python = `{{PYTHON}}` · node = `{{NODE}}` · GPU WebGL required (render aborts on SwiftShader)
- Shell gotcha: Bash heredocs with complex quoting break. Write patch scripts with the Write tool instead (`patch(file, [(old, new)])`).

## Commands (run from `{{PROJECT_DIR}}/work`; the authoritative list is `work/README.md` / the skill's `scripts/engine/README.md`)
- look at a scene: `node render.mjs test t1,t2,… ../review/x.jpg 240`, then OPEN the jpg · one scene body: `node scene_test.mjs "<js using t>" ../review/x.jpg 0.5`
- beats: edit `beats_data.py` → `python beats.py` (writes beats.js/json + docs/beat_sheet.md) → `python gen_qa_ts.py` (QA times)
- QA: `node render.mjs qa $(cat _qa_ts.txt) ../qa/rN` → `python qa.py frames ../qa/rN` (must be 0 FAIL) · determinism: `node render.mjs hash t1,t2,t3,t4`
- sound: {{SCORE_CMD}} → {{SFX_CMD}} → {{VOICE_CMD}} → `python mix.py music.wav sfx.wav final.wav --len {{FILM_END}}` → `python check_ratio.py voice_proc.wav bed_final.wav` (floor {{FLOOR_DB}} dB)
- render: `node prender.mjs ../out/{{SLUG}}.mp4 {{OUT_FPS}} {{SEGMENTS}} final.wav` (env GROOT, FF, CRF) · contact sheets: `python sheets.py ../out/{{SLUG}}.mp4 ../review/rN/sheet`
- reel: `python reel_audio.py` → `python reel.py ../out/{{SLUG}}.mp4 ../out/{{SLUG}}_reel.mp4 reel_mix.wav`
- preview: `"$FF" -i ../out/{{SLUG}}.mp4 -vf scale=540:960,fps=30 -c:v libx264 -crf 27 -c:a aac -b:a 96k ../out/{{SLUG}}_preview.mp4`
- deliver: copy the finals to `{{DOWNLOADS}}` · `python package_project.py` (refreshes `{{PACKAGE_DIR}}`; copies only changed files)

## Engine map (work/)
- `film.html` load order: {{LOAD_ORDER}} (e.g. kit.js → project.js → acts/shared.js → acts/style.js → acts/world.js → acts/color.js → acts/scenes_*.js → beats.js → edl.js → layout.js)
- `kit.js`: core (canvas, fonts, springs, RNG, WT/WE word cues, captions, speaker card, QA logging, GL)
- `project.js`: everything specific to this film: title, speaker, TEXT lines, GLOSS, SOURCE, key-word colour clock, sky clock, FILM_END, footage
- `layout.js`: S/X/C/F grammar, safe zones, camera, renderFrame · `edl.js`: shot list from beats
- Scenes: {{SCENE_FILES}} (who owns which file; prefix rule for top-level names)
- Audio: {{AUDIO_FILES}} (score, sfx, voice, mix, check_ratio, reel_audio, audio_config.json)
- Key constants changed for this film: {{CONSTANTS}} (e.g. sZmax ≥ 0.82, split zoom × 0.8, TARGET 15 dB)

## Files & folders
- `work/` engine + data · `docs/` brief, story, beats, decisions · `review/` strips, sheets, `userref/` (owner references and feedback screenshots) · `qa/` QA frames and reports · `out/` finals, logs, FINAL_REPORT.md, LOCK/FINISHED · `workflows/` script copies
- Package (copy): `{{PACKAGE_DIR}}` · Downloads copies: `{{DOWNLOADS}}`

## Gotchas found in this project
- {{symptom → cause → fix}} (add as they happen; copy the general ones to the skill's references/lessons.md at delivery)
