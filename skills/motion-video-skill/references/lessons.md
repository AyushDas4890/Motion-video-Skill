# Lessons: gotchas, bugs and fixes (from Voice of the Rain v4)

Each entry gives the **symptom**, its **cause** and the **fix**. They are grouped by area. All of them actually happened on v4 (2026-10-06 → 10-09), across four renders and five sessions, most of which ended at the usage limit. Read the engine and determinism section before writing scene code, and the process section before starting any long job.

---

## 1. Engine, determinism and scene files

**1.1 `GL.run` returns ONE shared WebGL canvas**
- Symptom: the speaker card showed the sky backdrop, or a shader result was silently replaced by another one.
- Cause: `GL` in kit.js owns a single WebGL2 canvas. `run(name, fs, U, TX, w, h)` resizes that canvas, draws, and returns **the same canvas** every time. The speaker grade (`gradeFrame` → `GL.run('spkgrade', …)`) ran, then `SPKBG` (a GL sky) ran before the graded frame was drawn, and overwrote it.
- Fix:
  - Draw a `GL.run` result with `g.drawImage(cv, …)` **immediately**, before any other GL call.
  - To keep a result, copy it into your own canvas first.
  - In kit.js `speaker()`, the backdrop is drawn first, then the grade runs, then the frame is drawn.

**1.2 `Object.assign` copies getter VALUES, not getters**
- Symptom: the poem highlighter stayed sky-blue for the whole film. The switch to gold at 106.37 s never fired. Critic round 2 caught it.
- Cause: `Object.assign(THEME, {get hl(){…}})` calls the getter once at load time and stores the result, so the colour was frozen.
- Fix: define live properties with `Object.defineProperty(THEME, 'hl', {get(){ return CUR_T >= 106.37 ? GOLD : BLUE }, configurable: true})`, **after** any `Object.assign` on the same object. Do the same for any colour that depends on the clock.

**1.3 Seeds must never depend on call order**
- Symptom: `node render.mjs hash` reported `DETERMINISM FAIL` at 111.5, 120.77 and 188.71 s. The same frame rendered differently depending on which frames had been rendered before it. In a parallel segment render, that means flicker at segment joins.
- Cause: a root helper gave each geometry a seed from a counter (`CE_SN++` in a WeakMap). The first frame to reach a root claimed seed 1.
- Fix:
  - Derive the seed from the thing itself, e.g. `hash(endpoint.x*7919 + endpoint.y*104729 + n*31)`, or from scene name + index.
  - Allowed: memo caches keyed by arguments, `RNG(seed)`, `hash`, `vnoise`, `fbm`.
  - Forbidden: `Math.random`, `Date`, any counter, any state carried between frames.
- Tools:
  - `node render.mjs hash t1,t2,…` renders each time twice, in different orders.
  - `node det_debug.mjs T other1,other2 out` renders T, then the other frames, then T again, and diffs the two PNGs (prints the bbox and max difference).
- Residual: root edges still differed by at most 6/765 per channel. This is GPU anti-aliasing, invisible, and was accepted. Note it in the final report.

**1.4 Scene files share one global lexical scope; wrap them in a block**
- Symptom: `node --check acts/c_earth.js` → `SyntaxError: Identifier 'CE_SEEDS' has already been declared`. One such error kills the **whole file**, and all its scenes silently fall back to older versions or grey placeholders.
- Cause: classic `<script>` files share one global lexical scope for top-level `const`/`let`. The artist files wrap their body in a block, `{ const S = SCENES; … }`. A lead override appended after the block could not see the block-scoped helpers. Moving it inside the block re-declared names that already existed there.
- Fix:
  1. Prefix every top-level name with the file's prefix (`CE_`, `CR_`, `a3_` …).
  2. Wrap each scene file in a block.
  3. Put overrides **inside** the block, with fresh names (`CE_RSEED`, not `CE_SEEDS`).
  4. Run `node --check <file>` after every edit.
- Loading rules:
  - Later files override earlier ones: redeclared `function` declarations win, and `SCENES.x = …` reassigns.
  - The colour kit registers its scenes with `C_scene(name, fn)`. A later assignment from an `acts/actN.js` file is then ignored, but `c_*.js` files override normally.
  - Load order: kit.js → shared.js → style.js → world.js → color.js → act files → c_*.js → lead file (`c_lead.js`, last) → beats.js → edl.js → layout.js.

**1.5 Wrong cue words fail silently (`WT()` and its window)**
- Symptom: a hit lands on the wrong occurrence of a word, or at the start of the window.
- Cause:
  - `WT('word', after)` returns the first spoken occurrence **at or after** `after`, and common words repeat ("rain" occurs about 10 times).
  - On a miss it logs `WTMISS word after` and returns `after`, so a typo quietly fires at the window start.
- Fix:
  - Set `after` just before the intended occurrence (the shot's `t0` minus a little).
  - Grep the render output for `WTMISS` and `PAGEERR` after every test render; both must be zero.
  - Never hand-type cue times. Generate cue tables in code from `caps.json`. The story bible's hand-typed times were 0.3–0.6 s stale (e.g. Hornbill 16.0 vs the real 16.34).

**1.6 Whisper stretches word starts backwards into silences**
- Symptom: a cut or highlight fires during a held breath, before the word. Examples:
  - "rain": caps 26.90 vs voiced 28.45 (1.6 s early);
  - "I": 109.56 vs 110.55;
  - "Hi": 1.34 vs 1.76.
- Fix:
  - Forced-align with wav2vec2 CTC plus a numpy Viterbi (torchaudio has no wheel for Python 3.14). This gets alignment to within about 20 ms.
  - Cross-check phrase onsets against the voice energy envelope.
  - For the important cue words, use the voiced onset.

**1.7 Mis-hearings must never reach the screen**
- Symptom: a critic flagged "some bounds" (probably "downs") at the payoff of "ups and downs". "write the ladder" may have been "climb". The name came out as "Jayanth" instead of "the teacher".
- Fix:
  - Re-transcribe doubtful snippets with a second model (faster-whisper large-v3-turbo, CPU int8) **without** the domain prompt. In v4 it confirmed "bounds" p 0.84, "shot" 0.85, "ride" 0.89, so those stayed, because they are what he said.
  - Spell names exactly as the owner does, and save the spelling to memory.
  - Check any attribution by ear before it goes on screen (e.g. "This is how Walt Whitman wants us…").

**1.8 Broken font strings shrink text to 10 px**
- Symptom: tiny text, or particle text missing.
- Cause: a hand-written `ctx.font` string with a typo falls back to the 10 px default.
- Fix:
  - Always build fonts with `F(size, fam, wt, st)`.
  - Run `fontcheck.mjs`. render.mjs prints missing fonts.
  - Sitka, Segoe UI Variable, Bodoni MT and Edwardian Script are Windows fonts, so render on a machine that has them.

**1.9 Negative radii throw**
- `arc`, `ellipse` and `roundRect` throw on negative radii during springs. The kit already clamps them. Keep it that way when porting.

**1.10 Pareidolia in noise**
- Domain-warped ink and noise sometimes forms faces. Check each shot's noise seed by eye on a full-resolution still.

**1.11 Performance**
- Budget: under about 120 ms per frame at 1080p.
- Cache static illustrations in canvases or `Path2D` (`B_canvas(key, w, h, fn)`, or a `Map` keyed by arguments). Animate them with transforms.
- A 50-lobe cloud shader at 1080×1920 is the expensive kind of shader; run it at half resolution if needed.
- Render #4: 4 segments × 3324 frames took 7.2 min. Each segment starts slowly (450–1000 ms/frame while it warms up), then settles at about 100–160 ms/frame.
- `render.mjs` aborts if WebGL is not on the GPU (Chromium flags `--use-angle=d3d11 --enable-gpu --ignore-gpu-blocklist`).

---

## 2. Layout, text and legibility

**2.1 Safe zones (14 % top, 20 % bottom)**
- Must-read text belongs in y 179–1024 logical. QA fails anything outside. Fails seen in v4:
  - the poem page title was in the top zone;
  - one-line chest captions dipped about 10 px into the bottom zone (12 fails from one cause; fixed by tightening the height bound);
  - a 1.27× punch-in on poem page lines 1–2 would have pushed the title off the top, so it was declined.
- After any camera punch (`cam.cut`), check that the card text is still inside the zone.
- Platform UI covers roughly the bottom 300 px of 1920.

**2.2 Contrast**
- QA needs at least 4.5:1, or a dark stroke of at least 2 px.
- Failures and fixes:
  - **Chalk text on a green chalkboard:** fixed with white text plus a 5 px `#0E2A1A` stroke and a shadow.
  - **Gold key word on the speaker's mustard shirt (`#CEA851`):** low hue contrast. Use a 6–8 px ink stroke, or keep gold for gratitude words only.
  - **`dropIn` letters have no stroke:** they depend on the ground staying dark. Never lift the numeral pale under them.
  - **Dark-on-dark step numerals:** they vanish. Keep a pale halo.
- Always pass a **string** `col` to `C_T`/`T`, because that is the colour QA logs. Mark purely decorative text `kind:'deco'` (giant faded numerals, background type).

**2.3 Keep the C-caption band calm**
- The boxed cutaway word is centred at y = 0.63 H ≈ 806.
- Keep detail out from behind it: keep clouds high and hills below about 1040.
- A busy background under the box costs legibility, and critics notice.

**2.4 X-panel framing**
- In splits the scene is transformed so `(W/2, fy)` lands at the centre of the top half. Content more than 300 px from `fy` gets cropped.
- v4 known flaw: the "pour" split at 126 s crops the tops of its rain clouds.
- The seam word sits at `min(SPLIT_Y − 6, faceTop − 34)`. If you put it on the seam unconditionally, it clips the face box (a QA fail).

**2.5 Chest caption size versus speaker zoom**
- Symptom: chest captions didn't fit, or they overlapped the chin.
- Cause: the face fills 30–77 % of the source height, so at full cover there is almost no chest.
- Fix:
  - S shots anchor on the head-top (`{top:320, chinMax:930}`). The chin limit decides the scale, not the head-top anchor.
  - `sZmax` caps the speaker zoom (≥ 0.82) so the chest zone keeps at least 120 px.
  - Use one-line caption mode when the zone is tight.
- Side effect: below cover he no longer fills the frame. The blurred-backdrop fill was rejected ("blur border"), and the final answer is the **rounded card** over the world backdrop (art_direction.md §6).

**2.6 Split re-entry bounce**
- Symptom: a split reframe made the continuous talking head zoom-settle again mid-sentence.
- Fix: `speakerEntry()` returns 1 (no re-entry) when the previous shot is also an X shot that ends at this shot's `t0`. Swap only the top panel.

**2.7 One text layer per moment**
- v3 showed the scene label and the seam caption saying the same words at the same time, and they collided.
- In splits, the seam caption carries the words. The art carries no text, or at most one 1–2 word label that is NOT the spoken phrase.

**2.8 Caption strobing**
- Single-word swaps flashed for 2–4 frames, and "I" never rendered.
- Fix:
  - Group each function word with the next content word, up to 3 words.
  - Enforce a minimum hold of 8 frames (0.27 s). `groupAt()` in kit.js keeps a group until the next group starts (if the gap is under 0.6 s) or until 0.35 s after it ends, and never less than 0.27 s.

**2.9 Footnote markers**
- A spacing fix put a gap between a word and its superscript, and a critic caught it. The marker is drawn attached, at `ww − size·0.5 + 1`.

**2.10 Readability timing**
- Allow about 1.5 s per card line.
- Footnotes need at least 2 s on screen, starting on the cue word and **before** the card cuts away. In v4, "lave" and "latent" were first cued after their cards had already ended.
- Hold the opening full page at least 2 s with no push. Hold the coda page at least 7 s with a cascade.

---

## 3. Art pitfalls

**3.1 White glow particles vanish on light skies**
- White motes, silver lines and glows read on night skies and disappear on day or pastel skies.
- Give them colour and an edge (`C_sparkle(…, {edge})`, blue edges on rain over a light sky), or replace them with a concrete subject.

**3.2 The lit-root trap**
- At full `lit`, a glowing water core can swamp the brown root, and the roots read pale silver: the look the owner rejected.
- In the final v4 render this is visible in the full-glow root shots at 188–189 s (a5_rootsglow, a5_rootsx).
- Keep the core narrow (≤ ~40 % of the root's width), keep brown dominant, and check every root shot at full lit.

**3.3 Leftovers after a world swap**
- After the colour redraw, a black ink city silhouette survived at 139 s, and several "thin white roots" survived in other root shots.
- After swapping kits, list every scene name, render one frame per shot, and check each frame against the new style.

**3.4 Clouds**
- Ink clouds that were radial-gradient balloons read cheap.
- A billow model reads as a "ball pile" if billow sizes vary too little.
- A hard horizontal cloud base at about 62 % H looks wrong.
- In the colour kit, use cartoon clouds with flat bottoms, lit top-left.

**3.5 Same picture twice**
- A cut from an image into a reframe of the same image is not "something new".
- Change the subject, the angle or the stage of the action, or merge the two shots and let an in-shot push do the work.

**3.6 Match cuts that don't match**
- A ring centred at 25 % H in an X top panel cannot match a full-frame ring at 45 % H.
- Keep the matched shape at the same screen position on both sides of the cut.

**3.7 Pre-empting the panel**
- The lead started building direction A "to save time" before the critics reported. All three critics picked B, and the build had to be stopped and switched.
- Wait for the judge panel, or don't run one.

---

## 4. Sound

The full details are in `audio_pipeline.md`; these are the lessons only.

**4.1 The per-word floor**
- The default is at least 18.5 dB voice over bed in every word window (band 300 Hz–6 kHz).
- That buried the music, so the owner relaxed it to **15 dB**, with the music duck at 5.5 dB instead of 9. Ask about the floor at intake.

**4.2 Automation holes become "breaths"**
- Symptom: word automation cut the music 25.8 dB on "things", just before "Thank you", leaving a hole before the climax.
- Fix: a shaped musical breath (`BREATHS`: −16 dB from 206.35 to 208.15 s, 0.45 s fades). The deepest cut became 10.3 dB.

**4.3 Hook too quiet**
- Symptom: the hook measured −27.3 LUFS (there is no voice yet, so the bed sits at its ducked level).
- Fix: a hook lift of +13 dB on music and sfx from 0 to 1.72 s, giving −16.5 LUFS with a real impact transient.

**4.4 Coda too thin**
- Symptom: the music-only coda sat at about −27 LUFS.
- Fix: `CODA_LIFT` +8 dB from 208.3 s (1 s fade), giving −16.9 LUFS.

**4.5 Cut sounds disappeared**
- Symptom: the cut hits were ducked away under the voice.
- Fix: SFX bus +4 dB. Word automation still guarantees the floor.

**4.6 Glass cells on sibilance**
- Symptom: high celesta and glass notes sat on the "s" sounds.
- Fix: an extra −5 dB, one octave wide, at 5.8 kHz on the music bus, on top of the 2.4 kHz carve.

**4.7 Sound leads picture**
- Write every transient `LEAD = 0.05 s` early (3 frames at 60 fps).
- A hero sound (card, drop, bell, glint) within 80 ms of a cut "owns" the cut, and the cut sound is dropped.

**4.8 The reel needs its own music edit**
- Cutting the master's music for the reel breaks phrases.
- `reel_audio.py` builds a new bed so the payoff chord lands on the key word (C major on "Thank" at 47.04 s in the reel).
- The reel cold-opens on the strongest speaker line ("It's so GRATEFUL", 113.31–114.6), then about 0.8 s of the hook, then the intro.

**4.9 You cannot listen**
- Verify by measurement: LUFS, true peak and LRA from ffmpeg `ebur128`; per-word ratio from `check_ratio.py`; per-act loudness; chroma at the key words.
- Say so in the report.

---

## 5. Toolchain (Windows 11, Git Bash plus PowerShell)

**ffmpeg**
- Use the imageio build at `…/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe` (export it as `FF`). There is no ffprobe there, so probe with `ffmpeg -i`.
- A gyan ffmpeg 9 exists at `<your ffmpeg 9 folder>`, but it is not on PATH, and it removed `-vsync`: use `-fps_mode passthrough`.

**Python**
- Use `python`, not `python3`. Python is 3.14, with numpy, scipy, opencv 4.13, faster-whisper 1.2.1, transformers and CPU torch.
- There is **no torchaudio**: forced alignment uses wav2vec2 plus a hand-written CTC Viterbi.

**Playwright**
- Use the npx cache: `GROOT=$LOCALAPPDATA/npm-cache/_npx/<hash>/node_modules` (glob for `playwright`).
- A single render process manages only about 2 frames/s at 1080×1920. Use the parallel segment renderer (`prender.mjs out.mp4 60 4 mix.wav`, about 10× faster).
- `TaskStop` on the shell leaves the node workers running. Kill the `node.exe` processes whose command line matches render.

**Colour tags**
- Swscale converts RGB→YUV with bt601 under a bt709 tag, which shifts the hue.
- Encode with `-vf scale=out_color_matrix=bt709:out_range=tv`, then tag with `-bsf:v h264_metadata=colour_primaries=1:transfer_characteristics=1:matrix_coefficients=1`.
- Read untagged phone or Clipchamp sources as bt709.

**`cv2.imread` never raises**
- On a bad path it prints `[WARN] … can't open/read file` and returns `None`. The crash comes later (`need at least one array to concatenate`).
- In v4 the QA frames are named with three decimals (`113.950_n.jpg`), and a script asked for `113.95_n.jpg`.
- Build names from the directory listing and assert `img is not None`.
- Inside Python strings use `C:/…` paths, never Git Bash `/c/…`.

**Shell quoting breaks multi-line patches**
- Bash heredocs with nested quotes and JavaScript broke several times.
- Write patch scripts as files with the Write tool, using `patch(file, [(old, new)])` with `assert s.count(old) == 1`, and `swap(file, start, end, new)` (pattern: `patch_r2a.py`).
- Then run `node --check`.

**Thumbnails lie**
- A 200 px contact-sheet tile showed a "stray caption box" that wasn't there at full resolution.
- Confirm suspected defects on a full-resolution still (`render.mjs stills`) before you fix them.

**Full masters are too big for phones**
- The full master was 293 MB, and the phone and web viewer limit is about 30 MB.
- Always make a preview: 540×960, 30 fps, CRF 27, AAC 96k, about 18 MB.

---

## 6. Agents and workflows

The workflow templates are in `workflows.md`.

**6.1 Parallel agents burn the session limit fast**
- Eight agents used about 1.1 M tokens in 3 minutes and all died at the limit.
- Other workflows that died mid-run: the concept phase, the mix chain, the 7-agent act build (twice), and the 5 colour subject artists (twice; the second time the lead finished their files inline).
- Rules:
  - Keep it to **5 or fewer heavy agents** at once.
  - Cap each agent's image views ("view at most ~12–16 images").
  - Cap look-and-fix rounds ("two rounds max, then stop").
  - When quota is tight, use the **lean fallback**: the lead writes scenes inline as one data-driven world kit plus short per-act scene maps. That took about 1 h for 145 shots.

**6.2 Agents must survive being cut off**
- Every artist prompt says:
  - "**Your file must ALWAYS parse**: run `node --check` after every edit."
  - "**Save often.** A session limit may cut you off at any moment."
- The relaunch prompt says: "a previous run of you was cut off… **READ your file first**, keep what is good, finish."
- When the colour artists died, all five `c_*.js` files were 55–72 KB and parsed. The lead only had to finish three scenes the artists never reached (in a new `c_lead.js`, loaded last) and apply one root override.

**6.3 File ownership**
- Each agent owns exactly one file, or an explicit list of files. "Do not edit any other file."
- Engine needs go into an `engine_requests` field of the return schema, never into shared files.
- Prefix every top-level name with the file's prefix.

**6.4 Relaunching a dead workflow**
- **Same session:** `Workflow({scriptPath, resumeFromRunId})`. Cached `agent()` results replay and the rest runs live.
- **New session:** journals don't carry over, so rerun the script. Keep a copy of every script in the project's `workflows/` folder, named `<name>-<runId>.js`, and drop agents whose work is clearly done.
- In v4, a `scriptPath` pointing at another session's saved script was refused by the permission check. Pass the script **inline** (`script:` with the file's contents).

**6.5 Critics need the owner's decisions**
- Tell critics what they must NOT ask to undo (the grade, the 15 dB floor, the card).
- Otherwise they spend fixes on settled questions.

**6.6 Review agents don't edit**
- The fresh art-director reviewer only scores and lists fixes ("Do not edit any files"). The builder applies them in a fix pass. That keeps ownership clean, and the review stays independent.

---

## 7. Process lessons (long jobs, limits, an absent owner)

**7.1 RESUME.md is the project's memory**
- Keep `RESUME.md` in the project root, with a top block "**>>> NEXT SESSION START HERE <<<**". It holds:
  - the state;
  - how to relaunch any running workflow;
  - the owner feedback still to verify;
  - the exact remaining commands with environment variables;
  - a **STATUS** block with a **DONE LOG**: append one line after every finished step, so a limit never loses progress.
- Below that: the engine map, the commands and a phase table. Template: `assets/RESUME_template.md`.

**7.2 Memory pointer**
- Save one memory file that points to `RESUME.md` and says how to resume. Update it at milestones, and when the work is finished ("FINISHED; any new feedback is a new round").
- Also save owner facts: the speaker's name spelling, the chat style, "install nothing without asking".

**7.3 Auto-resume when the owner is away**
- The owner said: "Finish the video… when the tokens refresh, start again from where you stopped. I won't be around."
- Create a scheduled task (cron `17 */2 * * *`) whose self-contained prompt does this:
  - **STEP 0:** exit if `out/FINISHED.txt` exists.
  - **STEP 0b:** exit "busy" if `out/LOCK.txt` is less than 90 minutes old. Otherwise write the lock and refresh it every ~20 minutes.
  - **STEP 1:** read RESUME.md, then continue from the first step not in the DONE LOG.
  - The prompt also lists the remaining pipeline, the owner's hard rules (speaker name, never use reference footage, install nothing, keep renders deterministic, never cover the face, verbatim text, the root look), and the instruction to append to the DONE LOG after every step.
  - Finish with: write `FINAL_REPORT.md` and `FINISHED.txt`, delete `LOCK.txt`, update memory, notify.
- Write `out/LOCK.txt` yourself while you are working in the foreground.
- **Disable the task once it is finished** (`update_scheduled_task enabled:false`).
- Template: `assets/auto_resume_task.md`.

**7.4 Notify on completion**
- The owner asked for "a notification via Claude remote control". Use `PushNotification` with one line saying what is done and where.
- Send the preview and the poster with `SendUserFile`.

**7.5 A package folder in Downloads**
- On request, build `Downloads/<Title> - Project/`: `00_README.md` plus 01_Finals, 02_Source_Footage, 03_References (marked reference-only), 04_Project_Source, 05_Audio, 06_Docs_and_Logs, 07_Review_and_QA, 08_Older_versions.
- It is a COPY. Keep editing in the project folder.
- Refresh it after every render with `python package_project.py`, which copies only changed files.

**7.6 Owner feedback mid-project**
- Put it at the TOP of the brief, in an "**OWNER FEEDBACK (latest)**" section, quoting the owner's words. Every builder, reviewer and fixer agent reads that brief first.
- Save the owner's screenshots and reference images into `review/userref/` and make a `sheet.jpg` of them all.
- Copy the references, never the footage.

**7.7 Show work while it runs**
- When asked "give me a few things to see", send a world strip and a primitives sheet with `SendUserFile`, and explain in plain words.
- Report what is done, what is running and what comes next.

**7.8 Chat style**
- If the owner asks for caveman or brief style, keep it for the whole project, and write it into RESUME.md and the auto-resume prompt.

**7.9 Install nothing without asking**
- Use what is on the machine: faster-whisper, opencv, transformers, Playwright from the npx cache, imageio ffmpeg.
- Downloading fonts or models needs a yes from the owner. v4 used only Windows system fonts.

**7.10 Storyboard before building**
- An animatic (one panel per beat, real speaker/split/caption layout, placeholder art described in words, a reference inset) plus two critics (editor and domain teacher) caught structural problems before any art was drawn:
  - the metronome rhythm;
  - 32.9 s of uncaptioned speech;
  - glossary placement;
  - mis-hearings;
  - the early sun;
  - gold rationing.
- Fixing a beat sheet is cheap. Rebuilding scenes is not.

**7.11 Decline with reasons and log them**
- Not every critic note is right. Record each decline in the round's todo file. Examples:
  - "merge L9 into L8": declined, because it is its own line in the source text;
  - "extra glosses": declined, because the spec names exactly four words;
  - "1.27× punch on the page": declined, because it breaks the safe zone;
  - "trim the source lead-in": declined, because it would shift every word time.
