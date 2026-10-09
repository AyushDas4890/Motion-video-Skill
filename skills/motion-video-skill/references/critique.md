# Critique: rubric, critic personas, merging fixes

Each round, v4 was judged by **fresh, independent agents** that had not built anything and had not seen earlier reviews. This file gives the rubric, the prompts that worked (generalized), and how to turn their notes into a fix list. The target is **every criterion ≥ 9 from every critic**. v4 reached 7–8.5 after three rounds on the ink world. The owner then asked for the colour redraw, and a fourth round was optional and not run. Plan for at least three rounds, and budget the fixes.

There are four kinds of critique:
1. **Concept panel**: style frames, before the build (`workflows.md` §2).
2. **Storyboard critics**: the beat sheet and animatic, before the build.
3. **Art-director review**: one per subject artist, during the build.
4. **Film critics**: each full render, 3 personas.

---

## 1. The rubric (11 criteria, 1–10)

| # | Criterion | What 9/10 looks like | Typical failures seen (and the score they got) |
|---|---|---|---|
| 1 | **Hook** (first 2 s) | Frame 0 is lit and moving, with the most beautiful image of the film. A big kinetic key word or question is complete by about 0.9 s, the first cut comes by about 1.1 s, and there is a real audio transient (hook ≥ −17 LUFS short-term). | v3: a static speaker with eyes closed and the first cut at 7 s (3). A black, silent first frame (storyboard). The hook at −27.3 LUFS (editor 4–5). Hook type too small: the "And who / art" lines need ≥ 6.5 % H. |
| 2 | **Template grammar match** | Every reference device is used, in its measured form: chest captions, step cards (19–20 f, letters 1/frame, numeral, push), title reveal, boxed cutaway word at 63 % H, 50/50 split with seam word, floating card with highlighter, mosaic. Hard cuts, scale-move entries. | Soft blooms instead of cuts. A plated key word. Off-template chapter cards. Pills over poem cards while he reads. |
| 3 | **Rhythm / pacing** | Mean shot length within ±20 % of the reference (about 1.35 s), std ≥ 0.55, at least 85 % of shots under 2 s. Shots over 2 s have a second move. Key beats breathe (2.5–3.4 s), stabs are 0.5–0.7 s. Cuts land on content-word onsets. No "same picture twice". | A metronome (std 0.30). Reframes on function words. 46 s with no speaker. Outliers (a 3.73 s card without a punch, a 0.53 s chapter card). |
| 4 | **Visual beauty & cohesion** | Every frame could be printed as a still. One world, one clock, one hand. Lit, shaded and layered. Nothing reads as clip-art. Colour carries the arc. | Clip-art faces and hands (4–5 in r1). A blunt dark ink look (owner). Leftover old-kit pieces. Cheap particle bursts. |
| 5 | **Illustration of each spoken idea** ("ideas") | Each cutaway shows exactly what is said, on the word, and stays up ≥ 0.6 s past it. Motifs recur and match-cut (drop → ripple → ensō → sun). Nothing shown that he didn't say (e.g. a seed while he says "serve humanity"). | Earth shown 7 s early. A weak top panel. "Its creator" with a tiny subject. Seeds without the word. |
| 6 | **Text / poem fidelity & glossary** | Verbatim source text from one canonical string (curly ’, parentheses). The full text is shown readably twice. Highlighter only on spoken words. Glossary on first appearance, held ≥ 2 s. Credit complete on screen. | Missing lines and a straight apostrophe (v3: 2). Coda too fast. Gloss chips leaving too fast. The credit cut off mid-write. |
| 7 | **Phone legibility** | All must-read text ≥ 28 px at 1080, inside y 14–80 %, contrast ≥ 4.5:1 or stroked. Labels ≥ 40 px logical. Captions ≥ 0.27 s on screen, one line, max 3 words. | Labels 12–18 px. Dim poem rows at 0.62 alpha over bokeh. Chalk text on a green board. A strobing one-word swap. |
| 8 | **Respect for the speaker** | Face never covered. Footage untouched, or the owner-approved grade only. Full head, chin and collar in splits. A clean rounded card. Cards don't cut his key words. His payoff ("Thank you") is on his face. | A 25 % darkening (v3). Landscape crop of portrait footage. A blur border. Cards firing mid-sentence. |
| 9 | **Emotional arc & payoff** | One light/colour clock that only moves forward. Gold (or the payoff colour) rationed until the turn. The payoff lands on the exact word (sunrise on "Thank" at 207.68). The coda gives the text and the music room to breathe. | Dawn arriving 2 s early. Two suns. Gold everywhere. The arc regressing at step cards. |
| 10 | **Craft / polish** | QA 0 FAIL, determinism PASS, no flicker, no placeholder, no clipped text, no blank frame, no stray debug. Transitions are clean. The encode is correctly colour-tagged. | A clipped text frame. A blank paper frame. A footnote gap. Order-dependent seeds. |
| 11 | **Sound** | Voice always intelligible (every word ≥ floor). The score is written to the cut (phrase changes on act/chapter cards, swells resolving on key words, a breath before the payoff). Cut sounds by layout. Master −14 LUFS, TP ≤ −1.5. The reel has its own music edit. | Music masking the voice (v2). A 25.8 dB automation hole before the climax. Cut hits ducked away. Glass on sibilance. |

Scores across v4 rounds (jury / editor / teacher):

| criterion | round 1 (render #1) | round 2 (#2) | round 3 (#3) |
|---|---|---|---|
| hook | 6 / 4 / 6 | 7 / 5 / 7 | 8 / 7 / 7 |
| template | 7.5 / 7 / 7 | 8 / 7 / 7 | 8 / 8.5 / 8 |
| rhythm | 7 / 7 / 7 | 7 / 7 / 7 | 8.5 / 8 / 7 |
| beauty | 5.5 / 5 / 5 | 7 / 7 / 6 | 7.5 / 8.5 / 7 |
| ideas | 6.5 / 6 / 6 | 8 / 7 / 7 | 8.5 / 8 / 8 |
| poem | 8 / 6 / 7 | 9 / 8 / 8 | 8 / 8.5 / 7 |
| legibility | 6.5 / 5 / 6 | 6 / 6 / 7 | 8.5 / 7.5 / 7 |
| speaker | 7 / 5 / 7 | 8 / 6 / 7 | 8.5 / 8.5 / 8 |
| arc | 6 / 5 / 5 | 6 / 7 / 6 | 8.5 / 7.5 / 7 |
| craft | 5 / 4 / 4 | 7 / 6 / 6 | 7.5 / 8 / 7 |
| sound | 7.5 / 5 / 7 | 8 / 7 / 8 | 8.5 / 8 / 8 |

The teacher persona is consistently the hardest grader on the arc and on legibility. The editor is hardest on the hook. Expect that.

---

## 2. Self-check before calling critics

Critics are expensive. Don't spend them on things QA catches. Before each round:
- QA on every shot: mid-shot, plus `t0 + 0.05` on S/X shots, plus the coda times. Generate the times with `gen_qa_ts.py`, then `python qa.py frames` → **0 FAIL**.
- `render.mjs hash` → PASS (or document the residue).
- `qa.py rhythm` and `qa.py poemmap` → PASS. `qa.py encode` → PASS.
- Contact sheets: `sheets.py <mp4> review/rN/sheet`, one mid-shot frame per shot, labelled `id time layout scene`. **Look at all of them yourself** and fix anything obviously broken first.
- Mix numbers: integrated LUFS, true peak, minimum word ratio, hook and coda short-term LUFS.

---

## 3. Film critics (each render): three personas

Run all three in parallel, each a **fresh** agent every round. Never reuse a critic, because it anchors on its earlier notes. Give each one:
- the owner's decisions it must not undo;
- the contact sheets;
- a way to extract full-resolution frames;
- an image budget.

Placeholders used below:

| placeholder | meaning |
|---|---|
| `{P}` | project root |
| `{FF}` | ffmpeg path |
| `{N}` | render number |
| `{PREV}` | previous review dir |
| `{TITLE}`, `{DUR}`, `{SPEAKER}`, `{TOPIC}` | the film |
| `{WORLD}` | the art direction, one sentence |
| `{PAYOFF}` | e.g. "night→dawn on 'Thank you' 207.68, gold only for gratitude" |
| `{OWNER}` | the owner decisions list |
| `{MIX}` | the measured sound numbers |
| `{TEXT_SPEC}` | verbatim-text requirements, e.g. the poem twice, glossary words, credit string |
| `{CHECK_TIMES}` | times worth extracting |
| `{DOMAIN}` | the domain teacher lens, e.g. "Class XI NCERT English teacher who loves Whitman's poem" |

### 3.1 Jury (beauty, cohesion, craft)
```text
You are a fresh, independent critic (lens: festival jury for motion design — beauty, cohesion, craft, polish). You did not make this and have not seen earlier reviews. Judge "{TITLE}", render #{N}: a {DUR} s 9:16 motion-graphics film over a talking-head {SPEAKER} explaining {TOPIC}, edited in the grammar of a reference reel (style guide only). Art direction: {WORLD}; {PAYOFF}. Owner decisions you must NOT ask to undo: {OWNER}.
Look at: contact sheets {P}/review/r{N}/sheet_1.jpg … sheet_K.jpg (one mid-shot frame per shot, labelled id/time/layout/scene); previous render {PREV}/sheet_*.jpg (open 2); the master {P}/out/<film>.mp4 — extract up to 8 full-res frames with {FF} -v error -y -ss <t> -i <master> -frames:v 1 {P}/review/r{N}/j_<t>.jpg . Be efficient (view at most ~14 images).
Score 1-10 on 11 criteria: hook, template grammar match, rhythm/pacing, visual beauty & cohesion, illustration of each spoken idea, text fidelity & glossary, phone legibility, respect for the speaker, emotional arc & payoff, craft/polish, sound (from {P}/docs/score.md + mix: {MIX}). Say for each whether it beats the previous render. Then list the remaining fixes (max 8) that would raise any score below 9, each with shot id/time and exactly what to do. No politeness. Under 700 words.
```

### 3.2 Short-form editor (template match, pace, hook, legibility, retention)
```text
You are a fresh, independent critic (lens: short-form video editor who cut the reference reel — template match, pace, hook, phone legibility, retention). You did not make this and have not seen earlier reviews. Judge "{TITLE}", render #{N}: a {DUR} s 9:16 motion-graphics film over a talking-head {SPEAKER} explaining {TOPIC}, edited in the grammar of a reference reel (style guide only: kinetic chest captions, step chapter cards, title reveal, full cutaways with one bold boxed word low, 50/50 splits with seam word, floating cards with highlighter, panning mosaic). Owner decisions you must NOT ask to undo: {OWNER}.
Look at: {P}/docs/reference_grammar.md and {P}/review/style/ref_*.jpg; contact sheets {P}/review/r{N}/sheet_*.jpg; previous render {PREV}/sheet_*.jpg (open 2); the master {P}/out/<film>.mp4 and the reel {P}/out/<film>_reel.mp4 ({REEL_DUR} s, own music edit) — extract up to 10 full-res frames with {FF} -v error -y -ss <t> -i <file> -frames:v 1 {P}/review/r{N}/e_<t>.jpg (check the hook 0.0, 0.3, 0.6, 1.2 and a few speaker shots). You may measure loudness with ffmpeg ebur128. Be efficient (view at most ~16 images).
Score 1-10 on the same 11 criteria (hook, template grammar match, rhythm/pacing, visual beauty & cohesion, illustration of each spoken idea, text fidelity & glossary, phone legibility, respect for the speaker, emotional arc & payoff, craft/polish, sound). Say for each whether it beats the previous render. Then list the remaining fixes (max 8) that would raise any score below 9, each with shot id/time and exactly what to do. No politeness. Under 700 words.
```

### 3.3 Domain teacher (fidelity, clarity, emotional truth)
Swap `{DOMAIN}` for the film's subject. For a product explainer, use "a product manager who knows this product and its users". For a science talk, use "a high-school physics teacher".
```text
You are a fresh, independent critic (lens: {DOMAIN} — fidelity to the source and its images, glossary, clarity for the audience, respect for the speaker {SPEAKER}, emotional truth of the theme). You did not make this and have not seen earlier reviews. Judge "{TITLE}" render #{N}: a {DUR} s 9:16 motion-graphics film over {SPEAKER}'s explanation, art direction {WORLD}; {PAYOFF}. Owner decisions you must NOT ask to undo: {OWNER}.
{TEXT_SPEC}
Look at: {P}/docs/transcript.md, {P}/docs/story.md; contact sheets {P}/review/r{N}/sheet_*.jpg; previous render {PREV}/sheet_*.jpg (open 2); the master — extract up to 12 full-res frames with {FF} -v error -y -ss <t> -i <master> -frames:v 1 {P}/review/r{N}/l_<t>.jpg (check {CHECK_TIMES}). Be efficient (view at most ~16 images).
Score 1-10 on 11 criteria: hook, template grammar match, rhythm/pacing, visual beauty & cohesion, illustration of each spoken idea, text fidelity & glossary, phone legibility, respect for the speaker, emotional arc & payoff, craft/polish, sound (from docs/score.md; hook and coda LUFS: {MIX}). Say for each whether it beats the previous render. Then list the remaining fixes (max 8) that would raise any score below 9, each with shot id/time and exactly what to draw instead. No politeness. Under 700 words.
```

For v4, `{TEXT_SPEC}` was:

> The poem must appear verbatim twice (page at 10.4–15.2 s; coda = cards then the full page) with glossary (impalpable, lave, atomies, latent) and the credit "Walt Whitman, The Voice of the Rain. Hornbill, Class XI English (NCERT)".

`{CHECK_TIMES}` was each card's mid-time plus the coda: 11.5, 14.5, 43.3, 61, 71.5, 110.5, 122, 142.3, 208.9, 213, 219.5.

Optional structured return (use it when a workflow runs the critics):
```js
const CRIT = { type: 'object', properties: {
  scores: { type: 'object', properties: Object.fromEntries(['hook','template','rhythm','beauty','ideas','text','legibility','speaker','arc','craft','sound'].map(k => [k, { type: 'number' }])) },
  beats_previous: { type: 'array', items: { type: 'string' } },
  fixes: { type: 'array', items: { type: 'object', properties: { where: { type: 'string' }, problem: { type: 'string' }, fix: { type: 'string' }, criterion: { type: 'string' } }, required: ['where', 'problem', 'fix'] } },
}, required: ['scores', 'fixes'] }
```

---

## 4. Storyboard critics (before the build)

Two lenses review `docs/beat_sheet.md`, `beats.py`, `reference_grammar.md`, `story.md`, the word listing and the animatic sheets. They return a verdict plus problems as `{beats, problem, fix, severity 1–5}`, with at most 25, most severe first.

Shared base, generalized from the v4 script:
```text
You review the STORYBOARD of "{TITLE}" BEFORE it is built: a 9:16 motion-graphics film ({DUR} s) over a talking-head {SPEAKER} explaining {TOPIC}, edited in the grammar of a reference reel. You did not write it; be blunt and specific.
Read: {P}/docs/beat_sheet.md (shots: id, times, layout S/X/C/F, scene, spoken words, visual, motif, sound), {P}/work/beats_data.py, {P}/docs/reference_grammar.md (measured template), {P}/docs/story.md (thesis, acts, motif bible, light arc, text cue map), {P}/docs/caps_listing.txt (exact transcript chunks with times), and any critique of a previous version.
Look at the animatic contact sheets {P}/review/storyboard_*.jpg (one panel per beat; art scenes are placeholder panels describing the visual; speaker/split/caption layout is real; the small inset is the reference frame whose device it borrows).
Rules the film must meet: the speaker is never covered; every visual lands on the word that names it; quoted text is verbatim, in floating cards with a highlighter as it is referenced; {TEXT_SPEC}; every template device used at least once; rhythm within ±20% of the reference; something new every 1-3 s; recurring motifs and match cuts; one global light arc with the payoff on {PAYOFF_WORD}.
```
- **Editor lens.** Rhythm and pacing:
  - runs of too-similar shots;
  - cuts that are not on word onsets;
  - shots too short to read;
  - speaker over- or under-use;
  - same-picture punch-in pairs;
  - device usage and placement;
  - the hook;
  - caption load, merges and splits;
  - match cuts.

  Verify a sample of 25 cut times against the word onsets.
- **Domain/story lens.**
  - Does each visual illustrate exactly what is said at that moment?
  - Is quoted text readable for long enough (about 1.5 s per line)?
  - Is the full text shown legibly twice?
  - Is each gloss on the word's first appearance? Is the credit placement right?
  - Do the motifs and the arc carry the thesis?
  - Is anything misleading (words attributed to the speaker that he did not say)?
  - What is missing that would move the audience?

In v4 this pass caught:
- the metronome rhythm (std 0.30) and 36 same-picture pairs;
- 32.9 s of uncaptioned speech;
- unreadable full-poem showings;
- footnotes cued after their cards ended;
- a mis-hearing planned for the screen;
- an early sun;
- gold rationing broken by the caption system;
- stale hand-typed cue times.

---

## 5. Concept panel critics (style frames)

Three lenses: the jury, the editor, and the domain teacher. Each looks at three boards. The top row of a board is that direction's 5 frames; the bottom row is the matching reference frames, labelled "REFERENCE (style only)". Each critic opens up to 6 full-resolution stills and reads each direction's doc. It scores each direction on 5 axes, picks one, lists grafts and lists must-fixes:
```js
const SCORE = { type: 'object', properties: {
  scores: { type: 'array', items: { type: 'object', properties: { dir: { type: 'string' }, template: { type: 'number' }, cohesion_beauty: { type: 'number' }, poem_fidelity: { type: 'number' }, phone_legibility: { type: 'number' }, speaker_respect: { type: 'number' }, notes: { type: 'string' } }, required: ['dir', 'template', 'cohesion_beauty', 'poem_fidelity', 'phone_legibility', 'speaker_respect', 'notes'] } },
  pick: { type: 'string' }, why: { type: 'string' }, graft: { type: 'array', items: { type: 'string' } }, must_fix: { type: 'array', items: { type: 'string' } } },
  required: ['scores', 'pick', 'why', 'graft', 'must_fix'] }
```
**Then show the winning board to the owner before building.** Critics picked the ink world unanimously, and the owner later rejected it as "blunt".

---

## 6. Art-director review (one per subject artist, in the build pipeline)

This runs between each artist's build pass and its fix pass. It is a fresh agent and it **does not edit files**. Generalized from the v4 colour-subjects workflow:
```text
You are a fresh, strict art director. You did not make this. The owner asked for the film's world to be "{OWNER_LOOK_QUOTE}" (reference pictures: {P}/review/userref/sheet.jpg and {REFS} in {P}/review/userref/; the owner also said {OWNER_DISLIKES}). Judge the {ARTIST_NAME}'s new scenes: look at {STRIPS} and render your own full-size frames where needed (from {P}/work: env GROOT=… FF=… node render.mjs stills t1,t2 {P}/review/color/rev_{FILE}). Also check motion: render 3-4 consecutive frames (1/60 s apart) of 2 shots to catch flicker/popping. Scenes and their times are in {P}/work/beats.json: {SCENES}. Brief: {P}/docs/color_brief.md. Builder's own weak list: {WEAK}.
Score 1-10: likeness to the references' illustrated quality, colour, craft (detail, shading, nothing flat/blunt/clip-art/broken), legibility. Then list up to 10 concrete fixes (scene, what is wrong, exactly what to draw instead). View at most ~14 images. Be harsh. Do not edit any files.
```
Schema: `{likeness, colour, craft, legibility, fixes[]}`. The fix pass gets the scores plus every fix verbatim:

> Apply every fix below, re-render strip2, do one more look-and-fix round if anything is still blunt, QA to 0 FAIL.

---

## 7. Merging critic findings into one fix list

1. **Collect** all three critiques. Write the score table into `docs/style/decision.md` (or the round's log) with the date and render number.
2. **Dedupe by shot/time and by problem.** Rank:
   - (a) problems all three critics raise;
   - (b) problems two raise;
   - (c) single-critic items with high severity or a cheap fix.
3. **Filter:**
   - Drop anything that contradicts an **owner decision**, and say so.
   - Drop anything that breaks a hard rule: the safe zone, verbatim text, the speaker's face, determinism.
   - Drop anything whose cost is out of proportion to its gain, e.g. trimming the source lead-in would shift every word time.
4. **Write `docs/roundN_todo.md`.** It is a numbered checklist in the order you will apply it. Each item has:
   - who raised it (jury / editor / teacher, or "all 3");
   - the exact change, with numbers (times, px, dB);
   - **file hints** (`[beats_data.py]`, `[acts/act5.js CODA]`, `[mix.py BREATHS]`).

   Mark items `[x]` / `[~]` / `[ ]` as you go, with a DONE note. End with a **"Declined (with reason)"** section, then the exact "After fixes" pipeline: beats → QA → hash → mix → render → sheets → reel → preview → deliver.
5. **Route the work.**
   - Engine, timing, caption and mix items are done inline by the lead.
   - Art items go to the subject artists' briefs, or into a top "OWNER FEEDBACK (latest)" section when the owner raised them.
6. **Re-render and run a new round with fresh critics.** Tell them the owner decisions again. Compare scores per criterion against the previous round.
7. **Stop rule.**
   - Stop when every critic gives ≥ 9 on every criterion, or the owner accepts.
   - If two consecutive rounds move less than 0.5 on average, the remaining gap is usually the **world** (beauty, craft). Escalate to an art pass (world painter, then subject artists), not more timing tweaks.

Example of a merged item, with its decline log (v4 round 3):
```text
1. [x] Coda (all 3): sunrise cutaway b145 -> 2.5 s (208.45-210.95); full page holds >= 7 s; cards only L8-L11 at 0.5 s/line; +6 % push on coda/page shots (cam.push) [beats_data.py, acts/act5.js CODA, Wpage]. Keep FILM_END 221.6 (music is 221.6 s).
Declined: teacher's "merge L9 into L8" — "And make pure and beautify it;" is its own line in Whitman/Hornbill. Extra glosses — spec glossary is the four words. Speaker grade / 15 dB floor — owner decisions. b010 page punch-in (+27 %) — pushes the page title into the top unsafe zone (QA fail).
```
