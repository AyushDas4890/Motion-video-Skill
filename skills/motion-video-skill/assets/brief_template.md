<!--
BRIEF TEMPLATE (motion-video-skill). Copy to <project>/docs/brief.md at the end of intake (references/intake.md) and fill it.
- Placeholders are written {{LIKE_THIS}}. Scripts (scripts/new_project.py) may pre-fill ONLY these machine-known keys:
  TITLE, PROJECT_DIR, VIDEO, DURATION, SRC_W, SRC_H, SRC_FPS, ORIENTATION, LANG, SPEAKER, SPEAKER_HEARD,
  ASPECT, OUT_W, OUT_H, OUT_FPS, TEXT_FILE, DATE, UPDATED, SLUG, DOWNLOADS.
  A script must leave every other {{…}} (including the {{e.g. …}} hints) for Claude to fill from the intake answers.
- Tag every answer: [OWNER] (asked and answered) · [INFERRED] (from the files; add "confirmed" once the owner agrees) ·
  [DEFAULT] (the owner said "you decide" or skipped it) · [ASSUMED] (unconfirmed and could be wrong; also list it in §14).
- Quote the owner's own words when they gave free text.
- Delete these comment blocks once the brief is filled. Keep the section numbers: other docs and agents refer to them.
- This file is the single source of truth. story.md, beat_sheet.md, colour or style briefs and agent prompts all derive from it.
  Every agent reads the first two sections ("Brief at a glance" and "OWNER FEEDBACK (latest)") before it starts.
-->
# Brief: {{TITLE}}

Project: `{{PROJECT_DIR}}` · created {{DATE}} · owner: {{OWNER_NAME_OR_HANDLE}} · last updated {{UPDATED}}

## Brief at a glance (10 lines or fewer; agents read this first)
- **Make:** {{MAKE}} (e.g. "full film 3:42 + 54 s reel")
- **Format:** {{ASPECT}} {{OUT_W}}×{{OUT_H}} {{OUT_FPS}} fps, for {{PLATFORM}}
- **Speaker:** {{SPEAKER}} (exact spelling). Topic: {{TOPIC_ONE_LINE}}. Theme: {{THEME_WORD}}
- **Audience:** {{AUDIENCE}}. Pace: {{PACE}}
- **Look:** {{WORLD}} · references: {{REFS_SHORT}}
- **Text on screen:** {{TEXT_SHORT}} (verbatim) · credit: {{CREDIT_SHORT}} · glossary: {{GLOSS_SHORT}}
- **Captions:** {{CAPTION_STYLE}} · **Sound:** {{MUSIC}}; voice ≥ {{FLOOR_DB}} dB over the bed on every word
- **Quality:** {{QUALITY}} · gates: {{GATES}} · away: {{AWAY}}
- **Chat style:** {{CHAT_STYLE}} · install nothing without asking

## OWNER FEEDBACK (latest) — READ THIS FIRST
<!-- Empty at intake. On every piece of owner feedback (references/intake.md §9):
- quote the owner's words verbatim
- link any screenshot, saved as review/userref/feedback_<date>_<n>.png
- list your reading of it as numbered, checkable items, each with its scope (shots / times / files) and status
Before writing a new block, move the old one down to "Feedback history" at the end. This section overrides everything below it. -->
_No feedback yet._

<!-- Example (v4, 2026-10-08 evening):
### 2026-10-08 19:10 — "i do not like the roots in the picture, use the reference images for roots"
Screenshot: review/userref/owner_dislike_roots.png (a4_card_l8 at 111.4 s: one thin white root with hairline branches)
1. [x] Roots look like tree_root_1/2.png: thick, rich brown, flared base, 5–7 main roots spreading WIDE with curled tips, a darker outline and a highlight on top. Never thin white or blue lines. (C_roots in acts/color.js)
2. [x] Water moving along a root = a soft blue glow INSIDE the brown root.
3. [x] Check every root shot: a4_card_l8, a4_drink, a4_pour, a5_roots*, a5_tree…
-->

## Owner decisions (overrides of defaults and standing rules)
<!-- Owner choices that change a default or a * standing rule. Critics are told: "owner decisions; do not score against them". -->
| Date | Decision | Owner's words | Replaces |
|---|---|---|---|
| {{DATE}} | {{e.g. Light speaker grade allowed: highlights −20 %, wall toward blue-grey, skin protected, 25 % vignette}} | "{{quote}}" | R1b (speaker untouched) |
| {{DATE}} | {{e.g. Voice floor 15 dB (was 18.5); music duck 5.5 dB}} | "{{quote}}" | R5 default |

## §0 Standing rules (every project; * = changeable only by an owner decision above)
- R1 The speaker's face is never covered (graphics, captions, transitions); no transition opens over it; the speaker is never keyed out and the background is never replaced. R1b* Colours untouched.
- R2 No reference footage or reference images in the film. Draw ORIGINALS inspired by them. Reference frames may appear only on review boards labelled "reference only".
- R3 Quoted text is verbatim, character for character; spoken words are captioned as spoken.
- R4 Names are spelled exactly as in the §1 name table.
- R5* The voice is intelligible on every word: at least {{FLOOR_DB}} dB over the bed (default 15).
- R6 Deterministic render: `renderFrame(t)` is pure, randomness is seeded, nothing reads the clock.
- R7 Every visual lands on the word that names it, cued from word timestamps.
- R8 Phone legibility: must-read text sits within the {{SAFE_TOP_PCT}}–{{SAFE_BOT_PCT}} % height band, is at least 28 px at 1080, has contrast of 4.5:1 or more, and is never clipped or overlapping.
- R9 Install nothing without asking.
- R10 Save progress after every step (RESUME.md DONE LOG).
- Project-specific must-nots: see §10.

## §1 Source & names
| Item | Value | Tag |
|---|---|---|
| Video | `{{VIDEO}}` | [INFERRED] |
| Duration · size · fps | {{DURATION}} s · {{SRC_W}}×{{SRC_H}} · {{SRC_FPS}} fps | [INFERRED] |
| Orientation · language | {{ORIENTATION}} · {{LANG}} | [INFERRED] |
| Audio quality | {{AUDIO_NOTES}} (noise, level, clipping) | [INFERRED] |
| Face position / free space | {{FACE_NOTES}} (from the footage tile sheet) | [INFERRED] |
| Other source files | {{OTHER_SOURCES}} (PDF, slides, script) | |

**Exact-spelling name table.** Cards and credits use this table. Captions use the spoken words.
| Role | Exact spelling | Heard as (transcript) | Tag |
|---|---|---|---|
| Speaker | {{SPEAKER}} | {{SPEAKER_HEARD}} | |
| Author / work | {{AUTHOR}} · {{WORK_TITLE}} | | |
| Book / course / institution | {{BOOK}} | | |
| Brand / channel | {{BRAND}} | | |

Known mishearings, to check by ear before anything goes on screen: {{MISHEARINGS}} (v4 had "write → climb?", "bounds → downs?", "its → it's").

## §2 Purpose & audience
- What it is: {{WHAT_IT_IS}} (lesson, explainer, talk, product, reel)
- Topic (one line): {{TOPIC_ONE_LINE}}
- Thesis (one sentence, filled in the study phase): {{THESIS}}
- Audience: {{AUDIENCE}} · Tone: {{TONE}}
- What the viewer should feel or do at the end: {{GOAL}}
- Pace target: {{PACE}} (social ≈ 1.3–1.6 s average shot; classroom 16:9 ≈ 2–3 s)

## §3 Format & deliverables
| Deliverable | Spec | Wanted |
|---|---|---|
| Master | {{ASPECT}} {{OUT_W}}×{{OUT_H}}, {{OUT_FPS}} fps, H.264 High CRF 16, yuv420p TV range, BT.709, AAC 48 kHz | yes |
| Film length | {{FILM_LEN}} (speech + about 1 s title + coda of 12 s or less) | yes |
| Reel / shorts | {{REEL_SPEC}} (45–60 s, sentence-boundary cuts, own music edit, cold open on the strongest line) | {{Y/N}} |
| Preview | 540p, 30 fps, CRF 27, under 30 MB | yes |
| Poster / thumbnail | {{OUT_W}}×{{OUT_H}} frame from the payoff | {{Y/N}} |
| Subtitles | SRT + VTT (burned-in captions per §7) | {{Y/N}} |
| Chapters + post caption | YouTube chapter timestamps; two-line post caption | {{Y/N}} |
| Project package | `{{DOWNLOADS}}/{{TITLE}} - Project/` (00_README + folders 01–08) | {{Y/N}} |
| Review page | private artifact: style frames, sheets, scores, decision log | {{Y/N}} |
| Copy finals to | `{{DOWNLOADS}}` | yes |

## §4 Verbatim text, credit, glossary
- Source of the text: `{{TEXT_FILE}}` · confirmed by the owner: {{yes/[ASSUMED]}}
- Stored in `work/project.js` (TEXT lines, TITLE, AUTHOR, SOURCE, GLOSS). Scenes never retype it.
- Typography details to preserve: {{e.g. curly ’ in form’d / Reck’d, parentheses, line breaks, 11 lines}}
- Where the full text appears: {{e.g. full page at ~10 s and again in the coda}}
- Line map (spoken time → line), filled in the study phase: see `docs/story.md`
- Credit line (exact): "{{CREDIT_LINE}}"
- Glossary (word → definition, first appearance):
  | Word | Definition | Line |
  |---|---|---|
  | {{word}} | {{definition}} | {{n}} |
- Spoken text that differs from the source (C2): {{DIFFS}} → rule: show the text verbatim, caption the speaker's own words

## §5 Look
- World: {{WORLD}} (colourful illustrated / ink & watercolour / clean kinetic type / brand / other)
- One-line idea of the world: {{WORLD_IDEA}} (e.g. "one night of rain → golden sunrise"), and the light/colour clock across the arc: {{CLOCK}}
- Palette notes: {{PALETTE}} · the accent is reserved for: {{ACCENT_RULE}} (v4: gold only for gratitude words)
- Type: {{FONTS}} (installed fonts only; checked with fontcheck)
- References (look only; draw ORIGINALS, never copy them). Folder `review/userref/`, contact sheet `review/userref/sheet.jpg`
  | File | What it shows | Take from it |
  |---|---|---|
  | {{file}} | {{shows}} | {{take}} |
- Characters, and how to draw them: {{CHARACTERS}} (e.g. a friendly caricature of the author: white beard, slouch hat, book)
- Owner's likes and dislikes about the look: {{LIKES_DISLIKES}} (v4: "blunt" ink look rejected → colourful world; thin white roots → reference-style brown roots)

## §6 Editing grammar
- Reference reel: `{{REF_REEL}}` (grammar only; never in the film) → measured in `docs/reference_grammar.md`. Or: built-in grammar.
- Targets: average shot {{MEAN_SHOT}} s; device mix by time: speaker {{S%}} / cutaway {{C%}} / split {{X%}} / card {{F%}}; hard cuts by default; something new every 2–4 s
- Camera: punch-in settle on every shot, a second push on shots longer than 2 s, motion blur on entry

## §7 Captions
- Style: {{CAPTION_STYLE}} (kinetic story captions / clean subtitles / big word pops / none burned)
- Language: {{CAPTION_LANG}} · translation: {{TRANSLATION}}
- Key-word rule: {{KEYWORD_RULE}} (v4: big Bodoni key word, a colour clock for key words, gold only for gratitude words)

## §8 Sound
- Music: {{MUSIC}} (gentle score / upbeat / voice + SFX only / owner track `{{TRACK}}`, rights confirmed: {{Y/N}})
- Voice floor: {{FLOOR_DB}} dB over the bed on every word · final mix −14 LUFS, true peak −1.5 dB
- Moments: hook lift {{HOOK}}, a breath under the key line at {{BREATH}}, a swell or bloom at the payoff {{PAYOFF}}
- SFX: on cuts and cards, scene hits; never on top of a key word

## §9 Speaker treatment
- {{SPEAKER_TREATMENT}} (untouched + rounded card in art shots / light grade / trims). Non-default choices are also recorded in Owner decisions.
- Trims: {{TRIMS}} (if any, cut the source BEFORE transcription; all timings follow the cut)

## §10 Must-haves / must-nots
- Must-haves: {{MUST_HAVES}} (chapter cards: titles {{CHAPTERS}} · credit card · glossary · end card / CTA "{{CTA}}" · logo `{{LOGO}}`, position and size)
- Must-nots: {{MUST_NOTS}} (beyond §0)

## §11 Quality, process & gates
- Quality: {{QUALITY}} (Best: 3 or more critique rounds, target ≥ 9 on 11 criteria / Balanced / Fast draft) · run lean when the session quota is tight
- Changes over time: {{DATE}} "{{quote}}" → {{setting}} (e.g. "finish fast" → Fast; "remove all the compromise" → Best)
- Gates: {{GATES}} (3 gates / show, don't wait / first render only / autonomous)
  | Gate | Status | Decided by | Notes |
  |---|---|---|---|
  | 1 · Look (style frames) | {{open/passed}} | {{owner / critic panel (delegated)}} | {{pick + grafts}} |
  | 2 · Story & beat sheet | | | |
  | 3 · First render | | | |

## §12 Away mode
- RESUME.md + DONE LOG: always
- Auto-resume task: {{Y/N}} · task id `{{SLUG}}-auto-resume` · cron `17 */2 * * *` · LOCK `out/LOCK.txt` · done marker `out/FINISHED.txt`
- Notify when done: {{Y/N}} (PushNotification, one line) · preview to phone: {{Y/N}} (SendUserFile)
- Owner's words: "{{AWAY_QUOTE}}" (e.g. "I won't be around so complete it", "message me when completed")

## §13 Chat style
{{CHAT_STYLE}} (normal / brief-caveman / detailed). The owner's words: "{{CHAT_QUOTE}}"

## §14 Open questions & assumptions (confirm later; repeated in the final report)
- [ ] {{e.g. [ASSUMED] speaker spelling "the teacher" as heard}}
- [ ] {{e.g. [ASSUMED] the text extracted from the PDF is exact}}

## §15 Intake log
| Time | Question (header) | Answer (verbatim) | Tag |
|---|---|---|---|
| {{time}} | {{Q1.1 Make}} | {{answer}} | [OWNER] |

## Feedback history
<!-- Older OWNER FEEDBACK blocks, newest first. Never delete them. -->
