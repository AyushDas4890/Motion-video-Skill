# Engine (motion-video-skill v2)
Copied into `<project>/work/` by `scripts/new_project.py`. Run everything from `work/` with env
`GROOT` (Playwright node_modules), `FF` (ffmpeg exe), optional `CRF=16`, `PAGE` (default film.html).

## Files
- `project.js` all project constants (title, speaker, verbatim text, glossary, credit, key-word colours, sky clock, footage facts). Edit this, not the engine.
- `film.html` load order: project.js, kit.js, acts/shared.js, style.js, world.js, color.js, starter.js, your `acts/scenes_*.js`, beats.js, edl.js, layout.js.
- `kit.js` canvas helpers, text `T()`, captions (chest, word, boxed), speaker draw (rounded card below cover size, optional grade), GL helper (`GL.run` returns a SHARED canvas: draw it before the next call).
- `layout.js` shots S/X/C/F, seam, safe zones (no text y<14% or >80%), camera, gloss rail. `edl.js` beats -> shots. `beats_data.py` -> `python beats.py` -> beats.json/js.
- `acts/color.js` colourful world (CSKY clock, Wbg/Wsea/Wground, C_* primitives: cloud, sun, hills, tree, roots, flower, ripples...). `acts/world.js` W* devices (cards, page, step card, kinetic). `acts/style.js` ink kit.
- Tools: `render.mjs` (test / stills / qa / hash / meta / seg), `prender.mjs out.mp4 60 4 audio.wav` (parallel), `qa.py frames <dir>`, `gen_qa_ts.py`, `sheets.py mp4 prefix`, `scene_test.mjs "<js body>" out.jpg t`, `det_debug.mjs`, `reel.py`, `package_project.py`.
- Speech tools: `tr.py` (faster-whisper), `ctc_*.py` + `build_caps.py` (word timing -> caps.json), `faces.py` (face_boxes.json).
- Audio: see `references/audio_pipeline.md`.

## Add a scene
In `acts/scenes_main.js` (or a new file listed in film.html): `SCENES.my_scene=(t,c)=>{...}` where `c={t0,t1,k,u,lay}`; draw with `Wbg(t,1,{})`, `C_*` primitives and `T()`; cue with `WT('word',approxTime)`. Reference it from `beats_data.py` (scene name, layout, fy for X). X shots draw the top half only (content within +-300 px of fy); C shots keep y~0.63H calm for the boxed word. Test: `node scene_test.mjs "..." ../review/x.jpg 5.2`.

## Rules
Pure `renderFrame(t)`; `RNG(seed)`, `hash`, `vnoise`, `fbm` only; cache static art in canvases; <~120 ms/frame; scene files must always parse (`node --check`).
