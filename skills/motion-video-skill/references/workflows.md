# Workflows: multi-agent templates (generalized from Voice of the Rain v4)

These are ready-to-adapt scripts for the Workflow tool. The prompts inside them are the ones that worked on v4 (the originals are in `C:/Motion-graphics/voice-of-the-rain-v4/workflows/*.js`). Load the `workflow-authoring` skill before editing a script. Only run a workflow when the user has opted into multi-agent work, or the skill's phase calls for it.

**Budget first.** Eight parallel agents used about 1.1 M tokens in 3 minutes and all died at the session limit. Rules for v4-scale films:
- Run **at most 5 heavy agents at once**.
- Give every agent an image-view cap and a round cap.
- When the quota is tight, skip workflows and use the lean fallback (§7).

## 0. Conventions used by every template

- **Pass the script inline** (`Workflow({script: "<contents>", args: {...}})`). Then save a copy to `<project>/workflows/<name>-<runId>.js`, and write the relaunch line into RESUME.md.
  - In v4, a `scriptPath` that pointed into another session's folder was refused by the permission check. Inline always works.
- **Project values come in through `args`**, because `meta` must be a pure literal. Pass them again on every relaunch.
- **Each agent owns explicit files** and is told "Do not edit any other file". Top-level names in scene files carry the file's prefix.
- **Every builder prompt carries the survival rules** ("file must ALWAYS parse… save often") and a **resume clause** ("if your file already has partial work, READ IT FIRST and continue").
- **Return schemas** keep results small. Ask for `summary`, `files`/`scenes`, `strips`, and `weak` or `engine_requests`.
- Placeholders in the prompts are filled from `args`:
  - `P`: project root
  - `GROOT`, `FF`: environment paths
  - `title`, `speaker`, `topic`
  - `dur`: film length in seconds
  - `text`: the verbatim source text, if any
  - `refReel`, `refImages`, `video`, `prev` (previous version)
  - `owner`: owner decisions
  - `world`: the chosen world

Shared snippet, pasted at the top of each script:
```js
const A = args || {}
const P = A.P                                      // e.g. 'C:/Motion-graphics/my-film'
const ENVV = `env GROOT=${A.GROOT} FF=${A.FF}`
const ENV = `Environment: Windows 11, Bash tool with POSIX syntax. Project ${P} (docs/ markdown, work/ engine+data, review/ images, qa/). ffmpeg: ${A.FF} (no ffprobe; probe with "ffmpeg -i"). Python is \`python\` 3.14 (numpy, opencv, faster_whisper, transformers). Node 24; Playwright via GROOT=${A.GROOT}. Install nothing. Write scripts to files (no heredocs with tricky quoting); forward slashes in paths. Look at every image you make with the Read tool; do not guess.`
const RULES = `Hard rules: renderFrame(t) is pure (RNG/hash/vnoise/fbm only; no Math.random/Date/counters/state between frames); cue every hit from WT('word',after)/lineCues, never guessed times; verbatim text only from the TEXT array; must-read text inside y 179..1024 logical, >= 19 px, contrast >= 4.5:1 or a dark stroke >= 2 px; keep the C-shot caption band (y≈806) calm; never draw over the speaker; X shots: content within ±300 px of the shot fy; ORIGINAL drawings only (inspired by references, never traced/copied; never put reference footage in the film); < ~120 ms/frame at 1080p (cache static art in canvases, animate with transforms); prefix every top-level name with your file prefix. Your file must ALWAYS parse: run node --check on it after every edit; save often (a session limit may cut you off at any moment).`
const SUM = { type: 'object', properties: { summary: { type: 'string' }, files: { type: 'array', items: { type: 'string' } } }, required: ['summary', 'files'] }
const BUILD = { type: 'object', properties: { summary: { type: 'string' }, scenes: { type: 'array', items: { type: 'string' } }, strips: { type: 'array', items: { type: 'string' } }, weak: { type: 'array', items: { type: 'string' } } }, required: ['summary', 'scenes', 'strips', 'weak'] }
```

---

## 1. Study: parallel readers

Five independent analysts write the docs every later phase reads. Drop `critic` if there is no previous version. Drop `reference` if the owner gave no reference reel; in that case use the reference grammar shipped in the example.
```js
export const meta = {
  name: 'film-study',
  description: 'Phase 0 study: reference grammar, transcript, story/arc, footage + face boxes, previous-version critique',
  phases: [{ title: 'Study', detail: 'parallel analysts write docs/ and data files' }],
}
// [shared snippet here]
const tasks = [
  { key: 'reference', prompt: `You are the REFERENCE ANALYST for a motion-graphics edit. ${ENV}
Reference reel: ${A.refReel}. Goal: measure its editing grammar so we can copy its rhythm and devices (not its content).
1. Scene cuts: ffmpeg -vf "select='gt(scene,T)',showinfo" at T=0.2/0.3/0.4; check frames around each detection; add cuts you SEE that the detector misses (punch-ins of the same shot, panel swaps) and remove false ones (slide-ups, motion blur), with justification. Ignore player UI / screen-recording artefacts and frozen tails.
2. Shot list; mean, median, min, max, std; histogram (<1,1-2,2-3,3-4,>4 s); cuts per minute.
3. Contact sheets at 2 fps with timestamps stamped by OpenCV (drawtext may lack fonts) -> ${P}/review/ref_sheet_2fps_*.jpg; 10 fps frames around caption pops.
4. Classify each shot: speaker-full (kinetic chest captions), cutaway-full (speaker hidden, one-word caption low), split (visual top / speaker bottom, caption on seam), chapter card, title reveal, floating card + highlighter, mosaic. Device ratio by screen time and by shot count.
5. Caption typography: words per group, stacking, small:key size ratio, colours, outline/shadow/box, position as % of H, entry animation in frames, hold min/median/max, behaviour at cuts.
6. Camera: entry scale moves (from->to over N frames), punch-ins, slow pushes, transition types, motion blur, easing.
Write ${P}/docs/reference_grammar.md (numbers table, per-shot table, device catalogue with timestamps, caption spec precise enough to re-implement in % of H and frames, and a "targets for this film" section: mean shot ±20% band, device mix, caption timing) and ${P}/work/ref_shots.json. Return a dense summary with the key numbers.` },
  { key: 'transcript', prompt: `You are the TRANSCRIBER. ${ENV}
Video: ${A.video}. Speaker name spelled exactly: ${A.speaker}. ${A.text ? 'Verbatim source text the speaker quotes:\n' + A.text : ''}
1. Extract 16 kHz mono wav. Run faster-whisper on CPU (large-v3-turbo or medium, int8, word_timestamps=True, language ${A.lang || 'en'}, initial_prompt with names and domain words). Save raw words.
2. Refine word starts with forced alignment (wav2vec2 CTC + numpy Viterbi via transformers; torchaudio is NOT available) and check phrase onsets against the energy envelope — Whisper stretches words backwards over pauses.
3. Fix mis-hearings only when context/source text proves them; re-transcribe doubtful snippets WITHOUT the prompt and keep what he actually said. Never invent words.
4. Write ${P}/work/caps.json (chunks of 2-4 words [[start,end,word],...], never across a sentence end; keep a backup of any previous file), words_flat.json, ${P}/out/<film>.srt/.vtt, ${P}/docs/transcript.md (timestamped sentences + every correction with reason) and ${P}/docs/caps_listing.txt.
Return a summary with doubtful words (time, candidates, confidence) and corrections.` },
  { key: 'story', prompt: `You are the STORY EDITOR / domain analyst. ${ENV}
Transcript: ${P}/work/caps.json. Topic: ${A.topic}. ${A.text ? 'Source text (verbatim):\n' + A.text : ''}
Write ${P}/docs/story.md: (0) caption timing corrections (voiced onsets vs caps.json) and possible mis-hearings to verify by ear; breath beats >= 0.8 s for cuts; (1) the thesis in ONE sentence; (2) the arc in 3-5 acts with exact start/end (cut in sentence gaps), key lines with timestamps, emotional temperature 0-10, which source lines each touches; (3) a sentence index (time, sentence, the concrete image it names @ word time); (4) a motif bible: 4-6 motifs, meaning, visual form, every recurrence with timestamps, and a match-cut table (out of -> into); (5) a light/colour arc keyed to the acts with the payoff on one exact word, plus rationing rules (e.g. gold only for the theme word); (6) if there is source text: a cue table mapping each quoted line to the spoken driver words (time) for word-by-word highlighting, with glossary footnote cue times. Return thesis, act times, payoff word/time, cue table summary.` },
  { key: 'footage', prompt: `You are the FOOTAGE ANALYST. ${ENV}
Frames: ${P}/work/vf/*.jpg (frame i = time (i-1)/fps). 1. Face boxes for EVERY frame with OpenCV Haar (frontal, profile fallback; no downloads); reject outliers vs a rolling median, interpolate, smooth (median-5 + centred mean-7), pad 15% sides, 30% up (hair), 20% down; save ${P}/work/face_boxes.json {fps,w,h,boxes,detected}. 2. Validate on a 24-frame sheet ${P}/review/face_check.jpg (look at it; extremes included). 3. Framing over time, free space (above head / chest / sides), any cuts or zooms; tile sheet ${P}/review/footage_sheet.jpg. 4. Emphasis moments for punch-ins from per-word loudness, pitch and gesture z-scores -> ${P}/work/emphasis.json (one every <= 4.5 s). 5. Safe zones for the output frame at cover scale: title zone, chest caption zone, and the 50/50 split crop (scale + offset) keeping full head + chin + collar. Write ${P}/docs/footage_notes.md. Return a summary.` },
  { key: 'critic', prompt: `You are the CRITIC of the previous version. ${ENV}
Previous version: ${A.prev}. Make 0.5 s contact sheets with OpenCV timestamps -> ${P}/review/prev_sheet_*.jpg and LOOK at every sheet; compare with the reference grammar (${P}/review/ref_sheet_2fps_*.jpg once available, else describe from the reel). Measure its cut rhythm. Check the brief's requirements (${A.requirements || 'verbatim text, glossary, credit, visuals on the word, speaker never covered/recoloured, safe zones, legibility >= 28 px at 1080'}). List the 15 biggest weaknesses ranked (timestamps, what, why, concrete fix) and the 10 best moments to keep; score it 1-10 on hook, template match, cohesion, visual-to-word fidelity, motion, typography, legibility, speaker respect, pace, sound (say you cannot listen), polish. Write ${P}/docs/prev_critique.md. Return scores + ranked list.` },
]
phase('Study')
const res = await parallel(tasks.map(t => () => agent(t.prompt, { label: t.key, phase: 'Study', schema: SUM })))
return tasks.map((t, i) => ({ key: t.key, ...(res[i] || { summary: 'FAILED', files: [] }) }))
```
While it runs, the lead writes the engine config, removes any speaker darkening, and prepares `docs/engine_api.md` for the next phase.

---

## 2. Concept judge panel: 3 directions → style frames → critics pick

A barrier is correct here, because each critic needs all three boards. Choose the directions from the content plus the owner's references. If the owner sent look references, at least one direction must follow them. **Show the winning board to the owner before building.**
```js
export const meta = {
  name: 'film-concept',
  description: 'Phase 1: three art directions build real-footage style frames; three independent critics score and pick one',
  phases: [{ title: 'Directions', detail: '3 agents build style frames + boards' }, { title: 'Critique', detail: '3 independent critics score and pick' }],
}
// [shared snippet here]
// ARGS: args.dirs = [{key:'A',name:'…',brief:'…'},…], args.sf = [{lay:'S',t0:..,t1:..,render:..,what:'…'},…5]
const FRAMES = A.sf.map((f, i) => `SF${i + 1} ${f.lay} t0=${f.t0}..${f.t1} ${f.what} render ${f.render}`).join('\n   ')
const TIMES = A.sf.map(f => f.render).join(',')
const COMMON = `RESUME NOTE: if ${P}/work/style_KEY.js already exists, a previous run of you was cut off: read your files and strip, continue from them; do not start over.
You are an art director + creative coder building STYLE FRAMES for "${A.title}": a 9:16 (1080x1920) motion-graphics film over a talking-head ${A.speaker} explaining ${A.topic}. The edit copies a reference reel's grammar (hard cuts ~1.35 s, kinetic chest captions, step chapter cards with a giant faded numeral and letters dropping 1/frame, full cutaways with ONE bold white sans word in a dark box low, 50/50 splits with the caption on the seam, floating cards with a highlighter sweep, a panning mosaic). Your direction changes only the ART on top of that grammar. The reference video is ONLY a style guide: never put its footage or frames into the film.
READ FIRST: ${P}/docs/engine_api.md, ${P}/docs/story.md (thesis, motif bible, light arc, cue map), ${P}/docs/reference_grammar.md, ${P}/docs/storyboard_critique.md if present. Look at ${P}/review/style/ref_*.jpg and the owner's look references ${A.refImages || '(none)'} (inspiration only: draw originals).
The speaker is sacred: layout.js draws him; never recolour, key, or cover his face. Text from the TEXT array only. Must-read text >= 19 px logical, y 179..1024, contrast >= 4.5:1. No crossfades, no generic particle bursts, never clip-art: layered, lit, textured.
FILES YOU OWN (never edit kit.js, layout.js, film.html, edl.js, beats*, acts/*): ${P}/work/style_KEY.js (SCENES prefixed KEY_, STYLE/THEME/CAPOPT/WORDOPT overrides, buildEDL(){ SHOTS.push(...) } with:
   ${FRAMES})
 ${P}/work/style_KEY.html (loads kit.js, acts/shared.js, style_KEY.js, layout.js); ${P}/review/style/KEY_*.jpg stills; ${P}/review/style/KEY_board.jpg (top row your 5 frames at 360 px wide; bottom row the matching reference frames labelled "REFERENCE (style only)"); ${P}/docs/style/KEY.md: name + idea; palette (hex) and the light arc across the acts; type system; texture; camera; transitions; sound palette; each motif in this world; glossary/credit look; risks.
WORKFLOW (from ${P}/work, ${ENVV}): PAGE=style_KEY.html node render.mjs test ${TIMES} ../review/style/KEY_strip.jpg 300 — READ the strip, critique harshly as a festival juror, iterate (2 more rounds). Then stills, board, and QA: PAGE=style_KEY.html node render.mjs qa ${TIMES} ../qa/style_KEY && python qa.py frames ../qa/style_KEY -> 0 FAIL.
Return a short summary (the direction, proudest of, known weaknesses).`
const BOARD = { type: 'object', properties: { summary: { type: 'string' }, board: { type: 'string' }, doc: { type: 'string' } }, required: ['summary', 'board', 'doc'] }
const SCORE = { type: 'object', properties: {
  scores: { type: 'array', items: { type: 'object', properties: { dir: { type: 'string' }, template: { type: 'number' }, cohesion_beauty: { type: 'number' }, text_fidelity: { type: 'number' }, phone_legibility: { type: 'number' }, speaker_respect: { type: 'number' }, notes: { type: 'string' } }, required: ['dir', 'template', 'cohesion_beauty', 'text_fidelity', 'phone_legibility', 'speaker_respect', 'notes'] } },
  pick: { type: 'string' }, why: { type: 'string' }, graft: { type: 'array', items: { type: 'string' } }, must_fix: { type: 'array', items: { type: 'string' } } }, required: ['scores', 'pick', 'why', 'graft', 'must_fix'] }
phase('Directions')
const built = await parallel(A.dirs.map(d => () => agent(COMMON.replaceAll('KEY', d.key) + '\n\n' + d.brief, { label: `dir ${d.key}: ${d.name}`, phase: 'Directions', schema: BOARD })))
const ok = A.dirs.map((d, i) => ({ ...d, res: built[i] })).filter(x => x.res)
log(`${ok.length}/${A.dirs.length} directions built`)
phase('Critique')
const lenses = ['a festival jury member for motion design (beauty, cohesion, craft)', 'a short-form video editor who cut the reference reel (template match, pace, phone legibility, hook)', A.domainLens || 'a teacher/expert of this subject who loves the source (fidelity to the text and its images, respect for the speaker, clarity for the audience)']
const crit = await parallel(lenses.map((lens, i) => () => agent(`You are an independent critic: ${lens}. You did not build any of this. Judge ${ok.length} art directions for "${A.title}" (a 9:16 motion-graphics film over a talking-head speaker, edited in the grammar of a reference reel used ONLY as a style guide). The owner's look references: ${A.refImages || 'none'}.
Look at each board (top row: the direction's 5 style frames; bottom row: matching reference frames), open at most 6 full-res stills ${P}/review/style/<KEY>_*.jpg at real size to judge phone legibility, and read each doc:
${ok.map(x => `- Direction ${x.key} "${x.name}": board ${P}/review/style/${x.key}_board.jpg, doc ${P}/docs/style/${x.key}.md`).join('\n')}
Skim ${P}/docs/reference_grammar.md and ${P}/docs/story.md (motifs, arc).
Score each direction 1-10 on: template match, cohesion and beauty, fidelity to the text, phone legibility, respect for the speaker — with frame-specific evidence, no politeness. Pick ONE, say why, list the best ideas from the others to graft in, and what must be fixed before building.`, { label: `critic ${i + 1}`, phase: 'Critique', schema: SCORE })))
return { built: ok.map(x => ({ key: x.key, ...x.res })), critiques: crit.filter(Boolean) }
```
v4 used five style frames: S speaker + chest caption on the theme word, X split with vapour, C cutaway clouds, F floating text card with highlighter, F step card. Record the pick, the grafts and the must-fix list in `docs/style/decision.md`. **Never start building before the panel reports.**

---

## 3. Storyboard critique (before building)

Two lenses run in parallel on `beat_sheet.md` plus the animatic sheets. The prompts are in `critique.md` §4. Schema: `{verdict, problems:[{beats, problem, fix, severity}]}`, at most 25 problems. This is cheap and catches structural problems. Apply the fixes to `beats_data.py` (on v4 that was "beat sheet v3.1"), then re-run `python beats.py` and check the stats against the targets.

---

## 4. World painter → subject artists (build → fresh review → fix)

Use this for a new world, or for redrawing a finished film in a new look; the v4 colour redraw used it. Phase 1 is one **world painter**, which owns the kit file. Phase 2 is up to **5 subject artists**, each owning one scene file, run through a `pipeline` (no barrier): build → strict fresh art-director review (no edits) → fix pass.
```js
export const meta = {
  name: 'film-world-and-subjects',
  description: 'World painter writes the shared kit (clock, backgrounds, primitives, cards); subject artists redraw their scenes: build -> fresh review -> fix',
  phases: [{ title: 'World', detail: 'clock, backgrounds, shared primitives, cards/title' }, { title: 'Subjects', detail: 'artists in parallel: build -> review -> fix' }],
}
// [shared snippet here]
// ARGS: args.brief = docs/<look>_brief.md path; args.subjects = [{f:'c_rain', name:'RAIN & WATER artist', refs:'raindrop1.png, …', scenes:'a1_hookdrop …', note:'…'}, …]
const COMMON = `Project "${A.title}": a ${A.dur} s 9:16 motion-graphics film over a talking-head ${A.speaker} explaining ${A.topic}. READ FIRST: ${A.brief} (the owner's request in their words, an "OWNER FEEDBACK (latest)" section at the top if present, the reference pictures and what each shows, the look, the light arc, engine rules, commands) and LOOK at ${P}/review/userref/sheet.jpg plus the reference images for your part. Then read ${P}/docs/engine_api.md and skim the current kit files. Current film frames: ${P}/review/${A.lastSheets || 'rN'}/sheet_*.jpg.`
let world = null
if (!A.skipWorld) {
  phase('World')
  world = await agent(`You are the WORLD PAINTER. ${COMMON}
YOU OWN ONLY: ${P}/work/acts/${A.kit || 'color.js'} (loaded after world.js, before the act files) and ${P}/docs/${A.kitDoc || 'color_api.md'}. Do not edit any other file. Override by redeclaring functions (later declarations win) and reassigning SCENES.x; keep every existing signature working.
Deliver: 1) the clock: a function of t returning the palette (sky stops, light colour, sun/moon, weather amounts, land tint, card pastels, a light/dark flag for type colours) following the brief's arc, payoff on the exact word; 2) restyled backgrounds used everywhere (Wbg, Wsea, Wground, Wmist, Wdawn, SPKBG = backdrop behind the rounded speaker card) and the drop/rain helpers; 3) shared primitives for the artists, prefixed C_ (cloud, sun, rays, hills, grass, leaf, bush, flower, tree, roots, ripples, splash, drop, rainbow, sparkle, QA-logged text C_T with gradient/edge, letter drop-in, kinetic block) — document every signature in the API doc; 4) restyle the generic scenes yourself: step chapter cards (pastel gradient tinted to the act's sky, giant faded numeral, dark serif word with letters dropping 1/frame, push; theme word in the payoff colour), title, text pages/cards backgrounds, kinetic type scenes, THEME colours (highlighter changing at the turn — use Object.defineProperty getters, not Object.assign); 5) look: render a strip at ~20 times across the film to ${P}/review/color/world_strip.jpg, compare with the references, two look-and-fix rounds; QA those times: 0 FAIL.
${RULES}
Return: summary, scenes you restyled, strip paths, weak points.`, { label: 'world painter', phase: 'World', schema: BUILD })
  log(`world: ${world ? world.summary.slice(0, 200) : 'FAILED'}`)
}
const REVIEW = { type: 'object', properties: { likeness: { type: 'number' }, colour: { type: 'number' }, craft: { type: 'number' }, legibility: { type: 'number' }, fixes: { type: 'array', items: { type: 'string' } } }, required: ['likeness', 'colour', 'craft', 'legibility', 'fixes'] }
phase('Subjects')
const results = await pipeline(A.subjects,
  s => agent(`You are the ${s.name}. ${COMMON}
Read ${P}/docs/${A.kitDoc || 'color_api.md'} and USE the shared primitives (one consistent world). ${world ? 'World painter summary: ' + world.summary : ''}
If ${P}/work/acts/${s.f}.js already holds partial work (a previous run was cut off by a session limit): READ IT FIRST, keep what is good, finish the job.
YOU OWN ONLY: ${P}/work/acts/${s.f}.js (loaded after all act files and the kit). Wrap the file body in a block { … } and override each of YOUR scenes by reassigning SCENES.<name>. Do not edit any other file. Your scenes (times, layout, visual, fy in ${P}/work/beats.json): ${s.scenes}
Most relevant references: ${s.refs}. ${s.note}
Process: write the art; render a strip with one frame inside each of your shots (node render.mjs test t1,t2,... ${P}/review/color/${s.f}_strip.jpg 240) and look at it next to the references; two look-and-fix rounds; then QA one mid-shot time per scene (+ shot start +0.05 for X shots): node render.mjs qa <times> ../qa/${s.f} && python qa.py frames ../qa/${s.f} -> 0 FAIL. Measure ms/frame.
${RULES}
Return: summary, scenes you overrode, strip paths, weakest shots.`, { label: `${s.f} build`, phase: 'Subjects', schema: BUILD }),
  (b, s) => b && agent(`You are a fresh, strict art director. You did not make this. The owner asked for: "${A.ownerLook}" (reference pictures: ${P}/review/userref/sheet.jpg and ${s.refs}; the owner also disliked: ${A.ownerDislikes || 'n/a'}). Judge the ${s.name}'s scenes: look at ${b.strips.join(', ')} and render your own full-size frames where needed (from ${P}/work: ${ENVV} node render.mjs stills t1,t2 ${P}/review/color/rev_${s.f}). Check motion: render 3-4 consecutive frames (1/60 s apart) of 2 shots to catch flicker/popping. Scenes and times: ${P}/work/beats.json: ${s.scenes}. Brief: ${A.brief}. Builder's weak list: ${(b.weak || []).join(' | ')}.
Score 1-10: likeness to the references' illustrated quality, colour, craft (detail, shading, nothing flat/blunt/clip-art/broken), legibility. List up to 10 concrete fixes (scene, what is wrong, exactly what to draw instead). View at most ~14 images. Be harsh. Do not edit any files.`, { label: `${s.f} review`, phase: 'Subjects', schema: REVIEW }),
  (rv, s) => rv && agent(`You are the ${s.name} (second pass). ${COMMON}
YOU OWN ONLY ${P}/work/acts/${s.f}.js. A strict art director scored your scenes (${s.scenes}): likeness ${rv.likeness}, colour ${rv.colour}, craft ${rv.craft}, legibility ${rv.legibility}. Apply every fix below, re-render ${P}/review/color/${s.f}_strip2.jpg and look; one more look-and-fix round if anything is still blunt; QA to 0 FAIL (../qa/${s.f}2).
FIXES:\n- ${rv.fixes.join('\n- ')}
${RULES}
Return: summary, scenes, strip paths, remaining weak points.`, { label: `${s.f} fix`, phase: 'Subjects', schema: BUILD }),
)
return { world, subjects: A.subjects.map((s, i) => ({ file: s.f, final: results[i] })) }
```
How to split the subjects: by **subject matter**, not by time, so one artist draws every water shot and the characters stay consistent. v4 used these five:

| file | artist | scenes |
|---|---|---|
| `c_rain` | rain & water | 23 scenes: macro drops, ripples, the hook |
| `c_sky` | sky, weather & cycle | 26 scenes: clouds, vapour, coaster, village, text cards' backgrounds |
| `c_earth` | Mother Earth, roots & tree | 23 scenes |
| `c_chars` | characters | 15 scenes: poet, teacher, hornbill, roll call, pride beats |
| `c_grat` | gratitude & people | 15 scenes: girl, penguin, mosaic, hands, sunrise |

Each `note` names the specific owner asks, sizes (labels ≥ 40–50 px, hook type ≥ 84 / 160 px) and known problems from earlier renders.

After the workflow, the lead does the following:
1. Check `ls -la work/acts/c_*.js` and run `node --check` on each.
2. Look at every strip.
3. List the scenes nobody reached and draw them in `acts/c_lead.js`, loaded last.
4. Verify any owner-feedback item on **every** affected shot.
5. Run the full QA.

---

## 5. Critics round (each render)

Three personas run in parallel, each a fresh agent. The prompts are in `critique.md` §3. The lead merges the results (critique.md §7). There is a barrier because the merge needs all three.
```js
export const meta = {
  name: 'film-critics-round',
  description: 'Three fresh independent critics (jury, short-form editor, domain teacher) score render N on 11 criteria and list fixes',
  phases: [{ title: 'Critique', detail: '3 personas in parallel' }],
}
// [shared snippet here]
// ARGS: args: N, prev, world, payoff, owner, mix, textSpec, checkTimes, domain, reelDur
const CRIT = { type: 'object', properties: {
  scores: { type: 'object', properties: Object.fromEntries(['hook','template','rhythm','beauty','ideas','text','legibility','speaker','arc','craft','sound'].map(k => [k, { type: 'number' }])) },
  beats_previous: { type: 'array', items: { type: 'string' } },
  fixes: { type: 'array', items: { type: 'object', properties: { where: { type: 'string' }, problem: { type: 'string' }, fix: { type: 'string' } }, required: ['where', 'problem', 'fix'] } } },
  required: ['scores', 'fixes'] }
const head = (lens) => `You are a fresh, independent critic (lens: ${lens}). You did not make this and have not seen earlier reviews. Judge "${A.title}", render #${A.N}: a ${A.dur} s 9:16 motion-graphics film over a talking-head ${A.speaker} explaining ${A.topic}, edited in the grammar of a reference reel (style guide only). Art direction: ${A.world}; ${A.payoff}. Owner decisions you must NOT ask to undo: ${A.owner}.`
const tail = `Score 1-10 on 11 criteria: hook, template grammar match, rhythm/pacing, visual beauty & cohesion, illustration of each spoken idea, text fidelity & glossary, phone legibility, respect for the speaker, emotional arc & payoff, craft/polish, sound (mix: ${A.mix}). Say for each whether it beats the previous render. Then list the remaining fixes (max 8) that would raise any score below 9, each with shot id/time and exactly what to do. No politeness.`
const grab = (pfx, n) => `extract up to ${n} full-res frames with ${A.FF} -v error -y -ss <t> -i ${P}/out/${A.film}.mp4 -frames:v 1 ${P}/review/r${A.N}/${pfx}_<t>.jpg`
const jobs = [
  () => agent(`${head('festival jury for motion design — beauty, cohesion, craft, polish')}
Look at contact sheets ${P}/review/r${A.N}/sheet_*.jpg (one mid-shot frame per shot, labelled id/time/layout/scene); previous ${A.prev}/sheet_*.jpg (open 2); ${grab('j', 8)}. View at most ~14 images.
${tail}`, { label: 'jury', phase: 'Critique', schema: CRIT }),
  () => agent(`${head('short-form video editor who cut the reference reel — template match, pace, hook, phone legibility, retention')}
Look at ${P}/docs/reference_grammar.md and ${P}/review/style/ref_*.jpg; sheets ${P}/review/r${A.N}/sheet_*.jpg; previous ${A.prev}/sheet_*.jpg (open 2); the reel ${P}/out/${A.film}_reel.mp4 (${A.reelDur} s); ${grab('e', 10)} (check the hook 0.0, 0.3, 0.6, 1.2 and a few speaker shots). You may measure loudness with ffmpeg ebur128. View at most ~16 images.
${tail}`, { label: 'editor', phase: 'Critique', schema: CRIT }),
  () => agent(`${head(A.domain)}
${A.textSpec}
Look at ${P}/docs/transcript.md, ${P}/docs/story.md; sheets ${P}/review/r${A.N}/sheet_*.jpg; previous ${A.prev}/sheet_*.jpg (open 2); ${grab('l', 12)} (check ${A.checkTimes}). View at most ~16 images.
${tail} For art problems say exactly what to draw instead.`, { label: 'domain teacher', phase: 'Critique', schema: CRIT }),
]
const res = await parallel(jobs)
return res.filter(Boolean)
```
The lead then writes the score table into the decision log, merges the fixes into `docs/roundN_todo.md` with a "Declined (with reason)" section, applies the fixes, runs QA, renders, and goes to round N+1.

---

## 6. Sound: composer + sound designer → mixer

The full chain and its config are in `audio_pipeline.md`. The orchestration shape that worked was:
1. The **composer** and the **sound designer** run in parallel. Each writes one generator script plus a doc, renders, and measures per-act loudness.
2. Then **one mixer agent** runs the chain: voice → mix → check_ratio. It reports integrated LUFS, true peak, LRA, the worst and median word ratio, the number of words automated, and the hook and coda LUFS.

Shared context for both: you cannot listen; work by construction and measurement; deterministic synthesis only. The key requirements:
- Phrases land on act and chapter-card boundaries, and swells resolve on the key-word times.
- The theme leitmotif is first heard softly at the theme word and is fully harmonised at the turn.
- The payoff chord lands exactly on the payoff word, followed by a music-only coda.
- Under speech, stay out of 1–4 kHz. No drums under speech.
- SFX: one ≤ 400 ms transition per cut, chosen by incoming layout. Chapter card hit plus letter ticks. Motif events. Lead the picture by 2–4 frames. A hero sound owns its cut.

Run the sound phase **after the beat sheet is final**. Re-run sfx and the mix whenever cut times move.

---

## 7. Lean fallback: the lead writes scenes inline

Use this when the quota is tight, when parallel agents keep dying, or when the user says "finish fast". On v4 it produced 145 shots in about 1 hour.
1. **One data-driven world kit** (`acts/world.js`, `W*` components): backgrounds keyed to the one clock, card, page, step card, kinetic type, figure and face helpers, all parameterised.
2. **Short per-act scene maps** (`acts/act1.js` …): each scene is 1–5 lines that call the kit with the shot's arguments and `WT()` cues.
3. Test each scene quickly with `node scene_test.mjs "<js body using t>" ../review/x.jpg 0.5`, which temporarily replaces one scene.
4. QA a sample (about 24 frames), render, then improve weak scenes per critic round.
5. Hand only bounded art jobs to agents later (§4), one file each, when quota allows.

The v4 colour artists died before reaching three scenes. The lead drew them inline in `acts/c_lead.js`, loaded last, and applied one cross-cutting fix (all roots through `C_roots`) inside the owning file's block.

---

## 8. Relaunch and resume after a session limit

What happens: background agents die at the limit and the workflow returns `null` for them, or the whole session ends. Files on disk survive. Agents that followed the survival rules leave **parseable, partial** files.

Steps:
1. **Look before relaunching.**
   - `ls -la --time-style=+%H:%M work/acts/<owned files>` for sizes and times.
   - `node --check` each file.
   - Look at the newest strips in `review/…`.
   - Read the run's `journal.jsonl` (same session) to see which agents returned.
2. **Same session:** `Workflow({scriptPath: <saved script path from the tool result>, resumeFromRunId: '<runId>'})`. The unchanged prefix of `agent()` calls returns cached results instantly; the first new or edited call runs live.
3. **New session:** journals don't carry over. Rerun the script from the project copy, `Workflow({script: <contents of workflows/<name>-<runId>.js>, args: {...same args...}})`. Prepend a RESUME NOTE to builder prompts, or rely on the resume clause already in them:

   > A previous run of you was cut off by a session limit. Your file may already hold partial work: READ IT FIRST, keep what is good, finish the job.

   Drop agents whose output is clearly done (smaller `subjects` list, `skipWorld: true`).
4. **If it dies again, or the quota is nearly gone,** stop relaunching and finish inline (§7). Partial artist files are usually 70–90 % done.
5. **Record each relaunch in RESUME.md:** the script copy, the run id, what to check afterwards, and "if it died: rerun this script". Record each finished step in the DONE LOG.
6. **When the owner is away,** set up the auto-resume scheduled task (`assets/auto_resume_task.md`, lessons.md §7.3) with LOCK and FINISHED files. Disable it once the job is finished.
