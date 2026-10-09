# Art direction: the quality bar, the world, the grammar

This file describes how a finished film should look and why. It is distilled from "The Voice of the Rain" v4, which took four renders, three rounds of critics and two owner-feedback rounds. The project files are in `C:/Motion-graphics/voice-of-the-rain-v4`, and the final contact sheets are `review/r4/sheet_1..5.jpg`. It also records what the owner rejected. Read this file before writing a concept and again before building scenes.

Companion files:
- `lessons.md`: bugs and process.
- `critique.md`: scoring and critic prompts.
- `workflows.md`: agent orchestration.
- `audio_pipeline.md`: sound.
- `intake.md`: what to ask the owner.

---

## 1. The quality bar (what "as good as v4" means)

A frame from the film should hold up as a still print. Across 3.5 minutes, the film should play like a short-form reel, not a slideshow.

| Dimension | Bar (measured on v4 render #4) |
|---|---|
| Rhythm | A hard cut about every 1.3–1.5 s (v4 body: 145 shots, mean 1.455 s, median 1.28 s, std 0.576). Every cut lands on a spoken-word onset. Something new appears every 1–3 s. |
| One world | Every background comes from **one sky/light clock function** of `t`. The palette, line weight and texture are the same in every shot, so no shot looks like it came from another film. |
| Every idea illustrated | Each cutaway shows the noun or verb being said, and it lands on that word (`WT('word', after)`). The visual stays up at least 0.6 s after the word ends. |
| Speaker respected | The face is never covered. The speaker is never keyed out or recoloured beyond an owner-approved light grade. When the frame is smaller than cover, it sits in a clean rounded card. |
| Text | Verbatim source text, with curly quotes and the exact punctuation. Must-read text is at least 19 px logical (28 px at 1080), inside y 14–80 %, with contrast of at least 4.5:1 or a dark stroke. Captions are on screen for at least 0.27 s. |
| Payoff | One emotional arc that the light carries. In v4, night turns to a golden sunrise exactly on "Thank you" (207.68 s). |
| Sound | Every word is at least 15 dB over the bed (an owner decision; the default is 18.5). The master is −14 LUFS with true peak ≤ −1.5. There is a payoff swell on the key word. |
| Craft | QA shows 0 FAIL on about 200 sampled frames, and determinism passes. The encode is 60 fps, 1080×1920 and CRF 16. |

Score history, to calibrate expectations. Critic means went from 4–7.5 (round 1), to 5–9 (round 2), to 7–8.5 (round 3). Then the owner asked for a new world. **The critics' approval does not settle the look. The owner's eye does.** Show style frames to the owner early (see `intake.md`, check-in gates).

---

## 2. Picking ONE visual world

### 2.1 How to choose
1. **Read the content first.** Write the thesis in one sentence and the motif bible (`docs/story.md`). In v4 the motifs were the drop, the circle (ensō → sun), gold light, roots, and stars that become a constellation and then a tree. The world must be able to draw every motif and about 60 cutaways in one consistent hand.
2. **Take the owner's references seriously.** Ask for them at intake. Reference reels give you the **editing grammar**. Reference images give you the **look**. They are different inputs.
3. **Run a judge panel** (`workflows.md` §2): three directions, each built as five real style frames (speaker + chest caption, split, cutaway, poem/text card, step card), scored by three independent critics. In v4 all three critics picked B, "Ink and Water".
4. **Then show the owner.** In v4 the owner saw render #3 of the critics' pick and called it "quite blunt". The whole film was then redrawn in the colourful world. This would have been caught at the style-frame gate if the owner had seen the frames.
5. Graft the best ideas from the losing directions. Write the winner, the grafts and the must-fix list into `docs/style/decision.md`.

### 2.2 Originals only
- **Never put reference footage or reference images into the film.** The reference reel is a style guide only. QA once confirmed that no film source file references the template video.
- **Draw ORIGINALS inspired by references. Never trace or copy them.** Some of the v4 references were copyrighted: a Disney-style Mother Nature figure, and a stock-agency poet caricature with a watermark. Brief each artist on the *qualities* to borrow, for example "friendly caricature, big head, warm brown coat, holding a book". Never brief them on "this picture".
- Draw the actual subject. The poet reference was a generic Elizabethan caricature, and v4 drew **Walt Whitman**: white beard, tilted wide-brim hat, open collar.

### 2.3 Concept directions that were built for v4 (for calibration)
| Dir | Name | Idea | Verdict |
|---|---|---|---|
| A | Night into Dawn | Indigo night, silver rain, rain on glass (WebGL refraction), volumetric fog, moon | Strong on the board. The lead started building it before the critics finished and had to stop. Never pre-empt the panel. |
| **B** | **Ink and Water** | Sumi-e on rice paper. Night is paper soaked in indigo ink; dawn is the paper showing through. Ensō master motif, one vermilion seal, gold leaf only for gratitude | **Unanimous pick** (jury, editor, teacher). It carried renders #1–#3. The owner later found it "blunt". |
| C | The Living Manuscript | Whitman's 1855 notebook: letterpress, iron-gall handwriting, copperplate engraving, foxing | Best poem fidelity (8–8.5), but moiré and a "busy page" risk. Its slip/footnote ideas were grafted into B. |

Note on naming: the **colourful world kit** below is called "C" (prefix `C_`, file `acts/color.js`). That is the colour kit, not concept direction C.

---

## 3. The two proven world kits

Both kits are in `scripts/engine/acts/` (`style.js` for B, `color.js` for the colour kit), with the shared `W*` components in `world.js`. Both are driven by one clock, so brightness and colour only move forward through the film.

### 3.1 Kit B: "Ink and Water" (sumi-e on rice paper)
- **Look.** Every background is `paper * exp(-ABS * inkDensity)` with ABS = (2.5, 2.1, 1.4), which is Beer-Lambert absorption biased toward indigo. The whole sky clock is one number, `B_ink(t)`, the ink density. It runs 1.30 (night, `#090F23`) → 0.72 → 0.45 → 0.28 → 0.02 (sunlit paper `#F3E6CC`, horizon `#FFD27A`).
- **Materials.** These are all used in v4 render #3 (see `review/r3/sheet_*.jpg`):
  - rice paper with fibre and tooth;
  - wet-on-wet washes with tide lines and back-runs;
  - a dry-brush ensō of 30 bristles;
  - mountains with *cun* strokes;
  - reserved-paper stars;
  - clouds shaded as one height field lit from above (never radial-gradient balloons);
  - gold leaf with seams and crackle, used only for gratitude;
  - a single vermilion seal rationed to the title, the chapter cards and the colophon.
- **Type.** Sitka Banner for the poem and chest captions, Bodoni/Didone for the key word and step word, Segoe UI Variable 800 for the boxed caption word.
- **When to use.** Literary, contemplative or adult content, when the owner likes restraint, and for night-to-dawn arcs.
- **Risks seen.**
  - It reads **dark and "blunt" on a phone**. Dark silhouettes (roots, people, the engraved poet) can turn murky.
  - The step numeral can disappear dark-on-dark.
  - Monotony: 209 s of indigo.
  - Pareidolia: faces appear in domain-warped ink.
  - Gold on a mustard shirt gives low hue contrast.

### 3.2 Kit C: colourful illustrated world (the final v4 look)
The owner asked to "make the world colourful just like the images". It is a bright, saturated, friendly **2D illustration** with soft gradients and highlights.
- **Shapes.** Rounded, chunky shapes. Optional thin darker same-hue outlines.
- **Depth.** Soft cast shadows. Layered depth: back hills lighter and bluer, front hills darker and more saturated.
- **Water** is glossy and **near-realistic**: refraction band, caustic crescent, hard specular, cast shadow, crown splashes, ripple rings with a dark trough and a light crest.
- **Clouds** are cartoon clouds with flat bottoms, lit top-left and shaded bottom-right, optionally dropping teardrop rain.
- **Land.** Rolling hills with mini trees and flower dots. A rich brown soil cross-section with strata and pebbles. Grass tufts in three greens.
- **Gold** stays rare and special, used only for gratitude moments.

What the final film shows (render #4, `review/r4/sheet_1..5.jpg`):
- **Hook (0–1.76 s).** A deep-blue water surface covered in concentric ripple rings with a crown splash. White serif "And who / art **thou?**" pops in, with "thou?" about twice the size.
- **Speaker shots.** The speaker sits in a rounded card over the act's sky and green hills. Chest captions are small white serif words with a large serif key word (white with a dark edge; gold `#FFD36E` for gratitude words).
- **Cutaways.** The one- to three-word caption is white bold sans in a dark rounded box at y ≈ 806 (63 % of H). Gratitude words are set in gold text ("its gratitude", "of gratitude").
- **Step cards** ("the poem", "the cycle", "gratitude", "give back"):
  - a pastel gradient tinted to the act's sky;
  - a raining cartoon cloud, pastel hills with flowers, and soft rays;
  - a giant faded numeral behind the word;
  - a dark serif word whose letters drop in one per frame;
  - "gratitude" set in gold with a brown edge.
- **Poem cards.** A cream paper card on the colourful sky. It has a "THE VOICE OF THE RAIN" running head, the line number in the margin, and a sky-blue highlighter (gold after 106.37 s) that sweeps the spoken words. The footer reads "Hornbill · Class XI English (NCERT)". Gloss tags sit under the card: the word with its superscript, then "= definition".
- **Full poem page.** A tall cream sheet with all 11 lines, the credit and the glossary key, shown twice (10.4 s and the 210.95 s coda, held ≥ 7 s with a line cascade).
- **The light/colour clock** (section 4) is visible in every shot, as a sky that changes from shot to shot.

Character set in the final film, all original drawings:
- **Walt Whitman.** A friendly caricature with a big head, a full white beard, a tilted brown wide-brim hat with a feather, a warm brown coat, an open book and a pointing hand. The label "Walt Whitman (1819–1892)" is at least 40 px. It replaced the dark engraving the owner called "a black man with hat".
- **The teacher (guide).** A cartoon teacher with glasses and a mustard vest at a green chalkboard in a sunny classroom, with kids' heads in the foreground, and the words "friend · philosopher" chalked on the board. Chalk text needs a dark stroke: white, 5 px `#0E2A1A` edge.
- **Hornbill.** Black body, a huge yellow-orange casque bill, a red eye and a banded white tail. It flies in and lands on a green "Hornbill · Class XI · English" textbook cover with hills on it.
- **Mother Earth.** A giant gentle profile woman made of leaves and vines, with a flower crown and an open leafy hand that receives the drop. She is original, **not Te Fiti/Moana**.
- **Gratitude girl.** Eyes closed, hugging herself in a yellow top among big teal leaves and purple flowers, with the script "Be thankful".
- **THANK YOU penguin.** A cute penguin in a blue hat holding an orange "THANK YOU!" sign under the rising golden sun at sunrise. It doubles as the poster.
- **Portrait mosaic.** A panning grid of pastel-tile faces: a mother in a sari, a father in glasses, a teacher, a friend in a cricket cap, a grandfather, children. They light up with a gold catch-light on "those faces".
- **Roll call.** One framed vignette per spoken noun (parents holding a child's hands, friends under umbrellas, teacher at a chalkboard, a cricket club, a village street) over the purple pre-dawn sky. Each becomes a star.
- **Others:**
  - a red-and-white roller coaster with a trestle and happy riders;
  - a rainy village of coloured houses;
  - a ladder over brown roots;
  - a mosaic-pixel head for "sensibility";
  - warm hands in two skin tones passing a gold spark;
  - people receiving rain: a farmer in a dhoti, a child in a raincoat, a woman with a clay pot.

Character design rules:
- Friendly caricatures with **big heads**, expressive eyes, soft shading, knuckle and fold lines, and skin tones that fit the audience (Indian classroom in v4).
- **Animate them a little:** blink, a page turn, a gesture, wing beats. A static clip-art figure reads cheap.
- Labels are at least 40–50 px logical and sit in the safe zone.
- Pride or anti-motifs (fame, crown) are drawn in a cold silver-grey family (`#8A93A6`) with no warm fill. Gold stays reserved for gratitude.

**When to use Kit C.** Students, families, social reels, and owners who send colourful references. It is the default for "make it wonderful" unless the owner's references say otherwise.

**Kit C API** (`color_api.md` in the example): `CSKY(t)`, `Wbg`, `Wsea`, `Wground`, `C_cloud`, `C_sun`, `C_rays`, `C_hills`, `C_grass`, `C_leaf`, `C_bush`, `C_flower`, `C_tree`, `C_roots`, `C_ripples`, `C_splash`, `C_drop`, `C_puddle`, `C_rainbow`, `C_vapour`, `C_sparkle`, `C_T` (QA-logged gradient text with an edge), `C_dropIn`, `C_kin`, `C_cardBg`. Static art is cached in canvases. Measured cost is 30–75 ms/frame.

### 3.3 Other worlds
Clean minimal, photo-real b-roll and brand-driven worlds have not been proven yet. Build them the same way:
1. Define a clock function.
2. Restyle the shared `W*` backgrounds and cards.
3. Write a primitives API document.
4. Let subject artists draw on top (`workflows.md` §4).

---

## 4. The light/colour clock over the arc

One function of `t` drives every background, card tint, key-word colour and text-ink choice. **Brightness and warmth only move forward.** No step card or graphic may flash daylight into a night act. The storyboard critic caught exactly that: a beige template card at 7.3 s in a night act.

The final v4 clock (`CSKY(t)`) is keyed to the five acts. The film is 221.6 s, with speech running 0–209.45 s:

| t (s) | key | look | story beat |
|---|---|---|---|
| 0–21.5 | N | rainy blue night: indigo → royal blue, moon, stars, rain | hook, intimate |
| 25–53 | B | blue hour: blue → teal horizon, fading moon | creation, wonder |
| 56.5–102.5 | D | rainy day: sky blue, grey-white rain clouds, green land | the cycle, kinetic |
| 106.4–141 | G | warm gratitude afternoon: gold sun, lush green | gratitude, where gold arrives at 106.37 |
| 144.6–185.5 | O | cool overcast: grey-blue, desaturated, no sun | pride beats (fame, ladder, king) |
| 188–207.1 | P | pre-dawn: purple-blue → pink horizon, a few stars | roll call of people |
| **207.68–209.55** | **R** | **golden sunrise on "Thank you"** | payoff |
| 209.6– | M | bright golden morning | coda: full poem page |

The clock returns:
- three sky stops;
- the light colour;
- sun and moon visibility and position;
- rain, cloud and star amounts;
- a land `tint`;
- step-card pastels `pa/pb/pc`;
- a `light` flag that switches type colours: dark type with a white edge on a light sky, cream type with a navy edge on a dark sky.

Rules learned:
- **Gold is rationed.** Before the turn (106.37 s) it appears only as a speck (one mote on "gratitude" 22.5, one catch-light at 30.7). After the turn it carries meaning, and only on gratitude words. Pride beats get brass, pewter or grey, never gold. The key-word colour follows `KEYCLOCK`: silver/ivory, then paper-white, then grey for pride, then paper-white. Gratitude words (`gratitude|grateful|thank|thankful|give|returns`) are gold `#FFD36E`.
- **Only one sun.** Keep it below the horizon until the payoff word. Critics flagged a half-sun on "successful in life", because it tied the dawn to the worldly success the speaker warns against.
- **Hold night until just before the payoff**, then ramp. If the clock lifts early, light-coloured art (stars, silver lines, white glows) vanishes on pale skies.
- Make the arc provable: render an arc strip at about 10 times and print the mean luma or warmth per frame.

---

## 5. The template grammar (measured from the reference reel)

The reference was a 20.67 s screen-recorded Short, with the usable edit 0–18.467 s; it is analysed in `docs/reference_grammar.md`. **Measure every new reference reel the same way.** That is the study workflow's reference analyst. Copy its grammar, never its content.

### 5.1 Shot rhythm
- Reference: 14 shots in 18.467 s, which is **42 cuts/min**. Mean 1.319 s, median 1.167, std 0.723, min 0.633, max 3.400. Histogram: <1 s 6 shots, 1–2 s 6, 2–3 s 1, 3–4 s 1. **86 % of shots are under 2 s.**
- **Targets:**
  - mean 1.35 s ±20 % (1.08–1.62), median about 1.2;
  - at least 85 % of shots under 2 s;
  - no shot over 3.4 s, except a closing text page, which needs reading time;
  - **std ≥ 0.55.**

  The first v4 board had std 0.30. An `autosplit` that capped every shot at 2 s made a metronome and produced 36 "same picture twice" pairs.
- Vary the rhythm. Hold 4–6 key beats at 2.5–3.4 s with a **second move** (push, pan, highlighter, footnote). Spend the saved cuts on 0.5–0.7 s stabs: chapter cards, "Why?", "No.", each roll-call name.
- **Never auto-split a text card** into a reframe of itself. A hard punch-in mid-read resets the eye and crops line ends.
- Cut on **content words**, not function words. A list cut lives on its nouns, so in the roll call cut on "our parents", not on "it could be".

### 5.2 Device mix (by screen time)
| Device | Reference | Target | v4 body |
|---|---|---|---|
| C full cutaway (speaker hidden, word caption low) | 43.0 % | 40–45 % | 44.1 % |
| F card/graphic (step cards, title, kinetic, poem cards) | 29.6 % | 25–30 % | 24.7 % (+ the 10.65 s coda page) |
| X 50/50 split (art top, speaker bottom, seam word) | 17.1 % | 15–20 % | 16.1 % |
| S speaker full (chest captions) | 10.3 % | 10–15 % | 15.1 % |

- The speaker should be visible (S + X) about 25–30 % of the time, and **spread evenly**. The first v4 board had 38 % speaker in Act I and none for 46 s in Act III. The teacher vanished exactly where his asides were most personal.
- Use every template device at least once:
  - kinetic chest captions
  - step chapter cards
  - title reveal
  - full cutaways with the boxed word
  - 50/50 splits with the seam word
  - floating cards with a highlighter sweep
  - a panning mosaic

### 5.3 Layouts in the engine (S / X / C / F)
The logical canvas is 720×1280, drawn ×1.5 into 1080×1920.

- **S (speaker full).**
  - The speaker is punched in 1.15–1.35 and anchored by the head-top (`{top:320, chinMax:930}`).
  - Kinetic chest captions sit in the chest zone (top = max(face bottom + 12, 0.60 H), capped at SAFE_BOT − 18).
  - The speaker zoom is capped (`sZmax ≥ 0.82`) so the chest zone keeps at least 120 px.
  - When the speaker drops below cover, he sits in a **rounded card** (radius 34, soft shadow, 2 px light rim) over `SPKBG` (the world backdrop, soft).
- **X (split).**
  - The scene draws the top half (0–640). The speaker fills the bottom half (`{top:60, chinMax:470}`, zoom ×0.8), with the face about 68 % H, the mouth above 82 %, centred.
  - The seam caption sits at y = min(seam − 6, faceTop − 34) and never covers the face.
  - The scene point `(W/2, fy)` lands at the centre of the top half, so **keep important content within ±300 px of `fy`**.
  - Consecutive X shots keep the speaker continuous, with no re-entry zoom. Only the top panel swaps.
- **C (cutaway).**
  - Full-frame art. The boxed word caption is centred at y = 0.63 H ≈ 806. **Keep the band behind it calm.**
  - The glossary rail docks lower-left on non-card C/F shots.
- **F (full graphic).** Title, step cards, kinetic type, poem cards and pages. There is no layout caption; the scene draws its own text. **Do caption the speaker's non-quoted words**: in an early v4 board, 32.9 s of speech went uncaptioned under F shots.

### 5.4 Shot entries and camera
- **Every shot starts with a scale move.** Never a static entry, never a dissolve.
  - Speaker: 1.22–1.25 → 1.0 over 15–18 f.
  - Split speaker: 1.32–1.55 → 1.0 over 24–25 f.
  - Graphics: 1.3–1.45 → 1.0 over 10–12 f.
  - Cutaways: land +4.5 % over 12 f, or punch in +27 % in 6 f (settling at +41–45 %).
  - Mosaic: pulls back 1.69 → 1.0 over 25 f.
  - Strong ease-out: 60–70 % of the change happens in the first third.
- v4 defaults (`CAMDEF`):

  | layout | z0 | d (s) | speaker entry |
  |---|---|---|---|
  | S | 1.1 | 0.5 | — |
  | X | 1.25 | 0.4 | sz0 1.3 / 0.8 s |
  | C | 1.3 | 0.38 | — |
  | F | 1.35 | 0.35 | — |

  Shots longer than 2.05 s get a +10 % second push at 55 %. `cam:{z0:1, second:false, push:0}` lets a scene own its camera. `cam.cut:[t, ×1.14]` makes a hard punch-in inside a shot (used on "life" in the L8 card).
- **Vary the C entries** (land, punch, spotlight). The same 1.3 zoom-out on 160 cuts becomes a 3.5-minute "breathing" pattern.
- Transitions are **hard cuts**. Motivated exceptions, at most about 4 per film:
  - `drop`: a drop falls and its ripple reveals the next shot;
  - `bloom`: an ink bloom at an act turn;
  - `whip`: a 2 f panel swap inside a split.

  Never a crossfade. Never open a transition over the face.
- Match cuts must keep the matched shape **at the same screen position** on both sides. An X top-half ring centred at about 25 % H cannot match a full-frame ring at 45 % H.

### 5.5 Caption devices
- **Chest stacked serif captions (S shots).**
  - Small words: white serif (Sitka Banner 600, about 46 px logical, thin 2.5 px dark stroke plus a soft shadow of blur 8 at 40 %).
  - The key word is about 1.55–1.7× larger (about 108 px; Bodoni/Didone or Sitka Banner 700).
  - Lines are stair-stepped. One word every 6 f. Each word blur-rises about 12 px over 3 f.
  - Words accumulate until the cut.
  - One-line mode when the zone is tight.
  - The key word should appear within 12 frames of the cut.
  - Don't repeat the same key word within 20 s.
  - Key words are the nouns and verbs that carry the idea.
- **Boxed cutaway/seam word (C and X).**
  - White bold sans (Segoe UI Variable Display 800, 52 px; 50 px on the seam) in a dark rounded box (`rgba(21,24,38,0.8)`).
  - Groups average 1.54 words, never more than 3, on one line. A function word groups with the next content word ("of gratitude", "our parents").
  - **Minimum hold 8 f (0.27 s)**, median 13 f.
  - Hard swap; v4 adds only a 0.94 → 1.0 micro-spring.
  - The caption never straddles a cut. Every cut lands on a group onset.
  - Gold text for gratitude words.
- **Step / chapter cards.**
  - 19–20 frames (0.63–0.67 s), placed at act boundaries and preferably in speech gaps (v4: 7.34, 54.88, 106.37, 144.10).
  - The card is empty for 1–2 f, then the letters drop or rise one per frame, about 15 px, with blur, settling in 3 f.
  - A giant faded numeral (24–30 % of H) fades toward the top behind the word.
  - From about +8 f, a push of +14–16 % over 11 f. Hard cut out.
  - **Tint the gradient to the act's sky.**
  - "the" sits small and tight above the main word.
- **Highlighter on verbatim text.** On a floating card, a marker band about 1.2× cap height sweeps left to right **word by word as the speaker says the words** (`lineCues(li, a, b)` aligns the poem words to the spoken words). It snaps to word ends. Text under it keeps at least 7:1 contrast. Light only what he is saying. In v4 the band was sky-blue, then gold after the gratitude turn.
- **Glossary footnotes and rail.**
  - The superscript ¹²³⁴ is attached to its word.
  - The definition chip (word, then "= definition") lands on the cue word, is at least 34 px logical on cards, and holds **at least 2 s**.
  - The first time a glossed word appears on screen, the gloss must be there too. In v4 that meant a glossary key at the foot of poem page #1.
  - Chips dock lower-left (y ≈ 930–1000) as a **rail** on following non-card shots, until the next card.
  - `logGloss()` lets QA verify them.
- **Text cards and full page.**
  - Floating card: a cream card, running head over a rule, line number in the margin, the footer credit, a tight height, and an entry zoom of 1.45 → 1.0.
  - Full page: all lines verbatim, wrapped with a hanging indent at ≥ 34 px @1080, line numbers, the credit and the glossary key.
  - The opening page needs at least 2 s unpushed. The coda page holds at least 7 s, with a line-by-line highlighter cascade (about 0.45–1.2 s per line) and a slow +6–8 % push.
  - Reading floor: about 1.5 s per card line.
- **Title reveal.** The title letters fall into place on the spoken title words. A source card ("Hornbill · Class XI · English · NCERT") comes on the spoken source.
- **Mosaic.** A panning grid pulled back 1.69 → 1.0 with motion blur, for "so many people / those faces".

### 5.6 The hook (first 2 s)
- Frame 0 is already lit and moving. Never open on black, closed eyes or silence. The v4 hook went from −27.3 LUFS and a black first frame to −16.5 LUFS with an impact on frame 12.
- A big kinetic serif question or key word is complete by 0.9 s, and the first cut comes by about 1.1 s.
- Make the hook **the most beautiful frame of the film**. In v4 it is a glossy drop falling into calm blue water with ripple rings.
- Pay off any question the hook asks. In v4, "And who art thou?" is answered by the title reveal.

---

## 6. Speaker rules
- **Never cover the face.** QA renders a graphics-only pass and requires black inside every face box. Transitions and blooms open away from the face.
- **Never recolour, key or replace him** unless the owner approves. The v4 owner approved a **light grade**:
  - highlights about −20 %;
  - the wall pushed toward blue-grey;
  - skin protected (the first try greyed the skin, so the protection was strengthened);
  - a 25 % vignette.

  QA's speaker-integrity check compares against a speaker-only render.
- **Rounded card, not a blur border.** The chest-caption zoom cap shrinks him below cover. The first fix was a feathered, blurred backdrop, which the owner rejected as an "unusual blur border". The final treatment is a clean rounded card over the world backdrop `SPKBG`, rendered at 270×480 and scaled up so it reads slightly soft.
- **Split framing** shows the full head plus chin and collar. Never crop the hair. Pad face boxes 30 % up.
- Name and spell the speaker exactly as the owner does: "the teacher", not the transcript's "Jayanth".
- His own words on screen must be **what he said**, checked by a second ASR model, even when they are ungrammatical. Never show a mis-hearing. If the poet's name could be a mis-hearing ("This is how Walt Whitman wants us…"), check by ear before you credit the poet with the speaker's moral.
- Give his human payoff to him. "Thank you" is a speaker-full shot of his smile (gold key word), and only then the sunrise cutaway.

---

## 7. What the owner rejected (and why)

| Rejected | Where | Why it failed | What replaced it |
|---|---|---|---|
| **"The animated parts look quite blunt"**: the dark ink world (kit B) | the whole of render #3 | Murky indigo on a phone, dark silhouettes, low colour. The critics liked the restraint; the owner wanted joy | Kit C colourful illustrated world, an original redraw from the owner's reference images |
| **"The poet's animated image instead of a black man with hat"** | Whitman engraving/silhouette (a1_poet, a5_whitman) | A dark ink figure under a hat read as an anonymous dark man, not Whitman, and was not friendly | A friendly caricature: big head, white beard, brown hat with feather, coat, book, label with dates |
| **"Unusual blur border around the speaker"** | every S shot where the zoom cap shrank him | A feathered blurred copy of the footage around the frame looked like an error | Rounded card, radius 34, soft shadow, thin light rim, over the world backdrop |
| **"I do not like the roots… use the reference images for roots"** | a4_card_l8 and other root shots: one thin white root with hairline branches | Spindly, cold, unlike the warm cartoon roots in the references | `C_roots`: thick warm caramel brown (`#B5733F`), a flared base, 5–7 main roots spreading WIDE with up-curled tips, drooping branches, a dark outline, a top highlight and bark lines. Water is a **narrow** blue glow *inside* the brown root. Never a thin white or silver line |
| Clip-art flatness (critics r1–r3; v2 scored 3/10) | mosaic faces, hands, people, crown | Hard outlines, flat fills and no light read as cheap | Soft shading, highlights, cast shadows, layered depth and small animation. In Kit C, "cartoon" still means lit and shaded |
| Generic particle bursts and white glow motes | gather/mote scenes | White glow sprites vanish on light skies and say nothing | Coloured sparkles with an edge (`C_sparkle` `edge`), or a concrete subject |
| Gold everywhere | early chest captions (JAYANTA, PHILOSOPHER in gold) | Kills the payoff of the gold-for-gratitude motif and has low contrast on the mustard shirt | Key-word colour clock; gold only for gratitude words |
| Leftovers from an old kit | the black city silhouette at 139 s after the colour redraw | One dark-ink element in a bright world | After any world swap, list every scene and check each one in the new style |

Owner decisions that override defaults, and so must not be "fixed" by critics:
- the light speaker grade;
- a voice-over-bed floor of 15 dB per word (default 18.5);
- speaker shots may sit slightly below full-frame (now in a rounded card);
- chat style: caveman / brief.

Record such decisions in the brief and pass them to every critic as "do NOT ask to undo".
