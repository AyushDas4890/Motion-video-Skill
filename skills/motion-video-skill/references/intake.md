# Intake: ask once, up front, then work on your own

Read this before you touch the owner's video. Intake turns "make this wonderful" into a written brief (`docs/brief.md`). Every later phase and every agent works from that brief.

The rule is simple. **Look at the files first. Ask only what you cannot infer. Ask everything in 2 to 4 rounds at the start. Then work autonomously.** After intake, ask again only at the check-in gates the owner chose, or when one of the triggers in §9 fires.

## 0. Why intake exists (what Voice of the Rain v4 taught)

| What happened in v4 | What it cost | What intake now does |
|---|---|---|
| The owner's look references arrived after render #3: "the animated parts look quite blunt", followed by 14 reference images and "make the world colourful just like the images". | The whole visual world was redrawn: a world painter plus 5 subject artists, about a day of work and two session-limit deaths. | Asks for look references in round 2 (Q2.3), before the concept phase. |
| The speaker's name was corrected mid-project ("the teacher"). | Every caption and credit had to be re-checked. | Confirms name spellings in round 1 (Q1.4). |
| The owner overrode two defaults: a light grade on the speaker, and a voice-over-bed floor of 15 dB instead of 18.5. | Critics kept flagging both as faults until they were written down as owner decisions. | Asks about speaker treatment (Q3.4) and music (Q3.1). Answers go into **Owner decisions** in the brief, and critics are told about them. |
| "finish fast" was followed a day later by "remove all the compromise, make it better". | A full extra critique and rebuild cycle. | Quality versus speed is an explicit setting (Q4.1), and the brief records every change to it. |
| Away-mode requests arrived one at a time: "start again when tokens refresh", "message me when complete", "folder in Downloads". | Set up in a hurry near the usage limit. | Asks once (Q4.3, Q4.4), sets everything up at intake, and treats the answer as the owner's permission to create the scheduled task. |
| "Never put reference footage in the film" was confirmed by the owner. Drawings had to be originals inspired by the images (some were copyrighted, such as a Disney character and a stock poet). | None. It worked. | Makes this a standing rule (§7). Asks only when the owner may own the assets (C4). |
| The poem had to be verbatim, with curly apostrophes, all 11 lines, a 4-word glossary and a source credit. v3 had dropped 2 lines. | v3 was rejected on fidelity. | Q1.3 covers the exact text, Q3.2 covers glossary and credit, and QA checks them verbatim. |

## 1. The flow

1. **Look first** (§3). Spend about 3 minutes, without asking anything. Probe the video, run a quick transcription of the opening, read the attachments, and check memory for the owner's standing preferences.
2. **Report what you found** in 6 lines or fewer (template in §3.2).
3. **Ask the question bank** (§4) in order:
   - Skip every question that is already answered, either by the owner's message or by inference.
   - Pack the remaining questions 4 per `AskUserQuestion` call.
   - Make no more than 4 calls; usually 2 or 3 are enough.
   - Ask conditional questions (§5) only when their trigger fires.
   - **After round 1, start the scaffold in the background:** `scripts/new_project.py` with `--title`, `--speaker`, `--text` and `--aspect`, taken from the round-1 answers. Frame extraction, full transcription and face boxes then run while you ask rounds 2–4.
4. **Collect the files** for any "I'll share…" answer, using the follow-ups in §6.
5. **Write the brief and the resume file.**
   - Fill `docs/brief.md` from `<skill>/assets/brief_template.md`.
   - Fill `RESUME.md` from `<skill>/assets/RESUME_template.md`. This may already exist if `scripts/new_project.py` ran.
   - If the owner chose away mode, set it up now (§10).
6. **Read back a 5-line summary**, then start the study phase. Do not wait for approval of the summary. The summary ends with "say *change X* any time", and the gates handle approval.

## 2. How to ask (AskUserQuestion rules)

- **Size limits:**
  - 1 to 4 questions per call.
  - 2 to 4 options per question.
  - `header` is 12 characters or fewer.
  - Option `label` is 1 to 5 words.
  - The tool always adds an **Other** choice, so the owner can type a free answer, a file path or a spelling.
  - Never add your own "Other" option.
- **Recommended option first.** Its label ends with "(Recommended)". The recommended option is the default the skill uses when the owner says "you decide" or skips the question. Its `description` says what will happen in one sentence.
- **Use `multiSelect: true`** for checklists (references, must-haves, must-nots, away options, extras). Picking nothing means "use the default". Say so in the question text. Checklists have no "(Recommended)" label; state the default set in the question text or in your message.
- **Use `preview`** on single-select options when the choice is visual: frame layouts, caption styles, looks or the check-in timeline. A preview is a short monospace mockup of 15 lines or fewer, shown when the option is focused. Previews are given below for Q1.2, Q2.2, Q2.4, Q3.4 and Q4.2.
- **Put inferred facts in the question text** ("I heard 'the teacher' — is that the exact spelling?"). Put inferred values in the recommended option.
- **One topic per question.** No compound questions.
- **No AskUserQuestion tool** (for example inside a subagent, or in a headless run): post the remaining questions once, as a numbered plain-text list with the default in brackets, and end with "Reply with numbers to change, or 'defaults'". If there is no reply, or the owner said they won't be around, use the defaults and mark them `[DEFAULT]`.
- **Each call is labelled:**
  - "Round 1 of 3 — the essentials"
  - "Round 2 — look & feel"
  - "Round 3 — sound & rules"
  - "Round 4 — how we work"
- **Never ask for secrets, passwords or payment details.** Never ask the owner to install anything as part of intake. Missing tools: ask first (C8).

### Example: one complete call (round 1 for a v4-like job)
```json
{"questions": [
 {"header": "Make", "multiSelect": false,
  "question": "Round 1 of 3 — the essentials. What should I make from this 3:29 video?",
  "options": [
   {"label": "Film + short reel (Recommended)", "description": "Full 3:29 film with motion graphics (+ ~1 s title, ≤12 s coda), plus a 45–60 s reel with its own music edit."},
   {"label": "Full film only", "description": "Just the full-length film."},
   {"label": "Short only", "description": "One 45–60 s piece cut from the strongest sentences."},
   {"label": "Several shorts", "description": "A series of shorts with a shared look; I'll ask how many and how long."}]},
 {"header": "Format", "multiSelect": false,
  "question": "Where will it be watched? (Your video is vertical 480×864.)",
  "options": [
   {"label": "9:16 vertical (Recommended)", "description": "1080×1920, 60 fps — Shorts, Reels, TikTok, WhatsApp.", "preview": "+---------+\n|  scene  |\n|---------|  <- word on the seam\n| speaker |\n+---------+\n9:16 1080x1920"},
   {"label": "16:9 widescreen", "description": "1920×1080 — YouTube, class projector, LMS. Speaker sits in a side card."},
   {"label": "1:1 square", "description": "1080×1080 — feed posts."},
   {"label": "9:16 + 16:9 both", "description": "Two masters from one edit (longer build)."}]},
 {"header": "Exact text", "multiSelect": false,
  "question": "He quotes Whitman's poem. Should the film show the exact text?",
  "options": [
   {"label": "Use the PDF verbatim (Recommended)", "description": "Every line character-for-character from VOICE OF THE RAIN…TEXT.pdf, with a source credit. I'll show you the extracted text."},
   {"label": "I'll paste the text", "description": "You send the exact text after this round."},
   {"label": "No quotes, captions only", "description": "Only his spoken words appear on screen."}]},
 {"header": "Names", "multiSelect": false,
  "question": "I heard the speaker say his name is 'the teacher'. Is that the exact spelling? (Type all names in Other if not: speaker, author, book, school.)",
  "options": [
   {"label": "the teacher, as heard (Recommended)", "description": "Used in the title card, captions and credits."},
   {"label": "Show no names", "description": "No name on screen at all."}]}
]}
```

## 3. Infer before asking

### 3.1 What can be inferred, and how

| Brief field | How to infer | Still ask? |
|---|---|---|
| Duration, resolution, fps, orientation, audio | `ffprobe` (ffmpeg comes from imageio-ffmpeg; see `scripts/engine/README.md`) | Never. |
| Language | faster-whisper (CPU int8) on the first 60 s, which gives the language, the self-introduction and the topic. Use a model already cached in `~/.cache/huggingface` (v4 used large-v3-turbo); downloading a new model counts as installing (C8). | Only if the speech is mixed-language or uses a non-Latin script (C7). |
| Speaker's name | The self-introduction in the opening transcript ("I am …"), the file name, attached documents | **Always confirm the spelling** (Q1.4), unless the owner typed it. Whisper mishears names. |
| Topic and thesis | A transcript skim (opening and closing 60 s) | No. State it in the report. The owner can correct it under Other in Q2.1. |
| Audience | Content cues: a curriculum ("Class 11", "Hornbill"), "friends", product names | Yes (Q2.1), with the inferred audience as the recommended option. |
| Verbatim source text | Attached PDF, DOCX, slides or text, read with the installed readers (`pdf` skill or Python). The speaker names a known work. | Confirm the source (Q1.3). Then show the extracted text for an exact check (§6). |
| Look references | An attached image folder. A link in the owner's message. | Ask what each set is for only if it is unclear (Q2.3). |
| Editing reference | An attached reel or video "like this" | No. Grammar only, never footage (rule R2). |
| Brand | Logo files, brand colours or a website in the message | It makes "My brand / references" the recommended option in Q2.2. |
| Quality and speed | The owner's words: "go all out" / "best" means Best; "quick" / "draft" means Fast | Skip Q4.1 if the words are explicit. |
| Away mode | "I won't be around", "overnight", "when tokens refresh", "message me" | Skip Q4.2 (gates off). Ask Q4.3 unless their own words already ask for it: "start again when tokens refresh" means auto-resume, and "message me when done" means notify. Their words count as permission for the scheduled task; vague hints such as "overnight" do not. |
| Chat style, notifications, package folder, install policy | Memory: the owner profile (§11), and the current session's style (for example caveman mode active) | No. State it with an easy override ("say 'normal mode' to change"). |
| Multiple videos | More than one video attached | Yes (C1). |

### 3.2 The "what I found" message (before round 1)
Use the owner's chat style, in 6 lines or fewer.
```
Found: <file> — <m:ss>, <W×H> <vertical|horizontal>, <fps> fps, <language>.
Speaker introduces himself as "<name as heard>" (<role if said>). Topic: <one line>. Theme: <one word>.
Also found: <PDF/text: N lines> · <image folder: N images (look refs)> · <reel: editing style only>.
Standing prefs from last time: <chat style · notify on finish · package in Downloads> (say if changed).
<N> quick rounds of questions next. Answer "you decide" to anything and I'll use the recommended option.
```

### 3.3 Fast paths
- **"Just make it", "you decide", or "I won't be around":**
  - Ask only the round-1 questions that cannot be inferred, in one call. These are usually only name spelling and exact text.
  - If the owner has already left, ask nothing. Use the defaults (§7.1) and mark each one `[DEFAULT]`. Show names as heard, marked `[ASSUMED]`, and list them under "confirm later" in the final report.
- **A detailed written brief from the owner** (like the v4 prompt): map it onto `docs/brief.md` first, then ask only the gaps. Never re-ask what the brief already states.
- **A returning owner:** offer "Same as last project (Recommended)" for the look, sound and process questions when memory holds a previous brief.
- **A new round on a finished project** ("make changes"): no intake. Use the feedback protocol in §9.

## 4. The question bank (ordered by importance)

Notation: `Q` id · header · single or multi · question · options, recommended first · **default** · *infer from* · → brief section.
When an inferred answer removes a question, the freed slot goes to the next question in bank order. For example, if the names are known, Q2.1 moves into round 1.

### Round 1: the essentials (these block the study phase)

**Q1.1 · Make · single.** "What should I make from this <m:ss> video?"
1. **Film + short reel (Recommended).**
   - The full film runs the whole speech, plus about a 1 s title and a coda of 12 s or less. v4: 209.4 s of source became 221.6 s.
   - The reel runs 45–60 s, is cut on sentence boundaries and has its own music edit. It opens cold on the strongest line.
2. **Full film only.**
3. **Short only.** One piece of 60 s or less, built from the strongest sentences.
4. **Several shorts.** Follow up with how many and how long: 30 / 45–60 / 60–90 s.

**Default:** 1. · *Infer:* "reel" or "short" in the message. · → brief §3 Format & deliverables.

**Q1.2 · Format · single · previews.** "Where will it be watched? (Your video is <orientation> <W×H>.)"
1. **The source orientation (Recommended).**
   - 9:16 is 1080×1920 at 60 fps, for Shorts, Reels, TikTok and WhatsApp. It is the proven layout grammar.
   - Vertical frame preview:
     ```
     +---------+
     |  scene  |
     |---------|
     | speaker |
     +---------+
     ```
2. **16:9 widescreen.** 1920×1080, for YouTube, a projector or an LMS.
   - Preview:
     ```
     +---------------+
     | scene  | spk  |
     +---------------+
     ```
3. **1:1 square.** For feed posts.
4. **Both 9:16 and 16:9.** One edit, two layout passes.

The descriptions name the platform, because the platform sets the safe zones. Vertical: text stays out of the top 14 % and the bottom 20 %, clear of the platform UI.
**Default:** match the source orientation. · *Infer:* orientation, and any platform named in the message. · → brief §3.
Note: 9:16 is the proven engine layout. For other aspects, check `scripts/engine/README.md` for current support before you promise it.

**Q1.3 · Exact text · single.** "<Speaker> quotes <work>. Should the film show the exact text?"
1. **Use <file> verbatim (Recommended).**
   - Every quoted line, character for character: curly ’, line breaks and parentheses, all lines.
   - A source credit line.
   - I will show you the extracted text to check.
2. **I'll paste/attach it.**
3. **Find the public text.** Only for public-domain works. You confirm the text before it is used.
4. **No quotes, captions only.**

**Default:** the attachment if one exists, otherwise 4. · *Infer:* attached files, and quoted titles in the transcript. · → brief §4 Verbatim text.
For slides or a script rather than a poem, the same rules apply: verbatim lines, highlighter on the spoken words.

**Q1.4 · Names · single.** "I heard '<name>'. Is that the exact spelling? (Type every name in Other if not: speaker, author, book, school, brand.)"
1. **<name>, as heard (Recommended).**
2. **Show no names.**

If no name was heard, the options are "Show no names (Recommended)" and "I'll type it".
**Default:** as heard, marked `[ASSUMED]`. · *Infer:* self-introduction, documents. · → brief §1 Source & names (exact-spelling table).

### Round 2: look and feel (this shapes the concept)

**Q2.1 · Audience · single.** "Who is it for? I understood: <topic, one line>. (Correct me in Other if I got the topic wrong.)"
1. **<inferred audience> (Recommended).** Example: "Class XI students". Clarity first, with chapter cards, glossary and calm legibility.
2. **General social audience.** Hook in the first 1.5 s, faster cuts, bigger words.
3. **Professionals / clients.** A restrained palette, clean type, brand-safe.
4. **Children.** Brighter and rounder, slower, simpler words.

**Default:** inferred. · → brief §2 Purpose & audience. This also sets the default pace: social is about 1.3–1.6 s per shot on average (v4 had 145 shots in 221.6 s); classroom 16:9 is about 2–3 s.

**Q2.2 · Look · single · previews.** "Pick the visual world (one world for the whole film)."
1. **Colourful illustrated (Recommended).**
   - Bright, friendly 2D illustration with soft gradients and highlights.
   - Glossy, near-real water and light.
   - Friendly caricature characters with big heads.
   - One sky clock that runs from night to a golden payoff.
   - This is v4's final look.
   - Preview: `palette: indigo night → sky blue → gold afternoon → pink pre-dawn → golden sunrise · hills, roots, rain, characters · gold only for the key emotion`
2. **Ink & watercolour.**
   - Rice paper, sumi ink, water, a single gold accent.
   - Calm and literary. This is v4's direction B, which won the concept panel before the owner asked for colour.
   - Preview: `palette: paper cream, ink navy, silver rain, one gold · brush strokes, ensō, washes`
3. **Clean kinetic type.**
   - Minimal: bold type, flat colour fields, diagrams, highlighter.
   - Best for explainers and business.
   - Preview: `palette: 2 brand colours + neutrals · type-led, icons, charts`
4. **My brand / references.** Built from your logo, colours or images (originals only).

Under Other: "photo-real b-roll" works only with footage or photos the owner supplies. No stock footage without asking.
**Default:** 1. The concept phase still makes 3 directions as style frames, and the gate or the critics pick one. · → brief §5 Look.

**Q2.3 · References · multi.** "Any references? Pick all that apply. Picking none means I design it."
1. **Images for the look.**
   - These are drawn as **originals** inspired by them, never traced or copied.
   - Asking now avoids a redraw. v4's colour world came from 14 owner images that arrived late.
2. **A reel for editing style.** I take only its grammar (shot length, devices, captions), never its footage.
3. **A past video to match.** Its look and its grammar.
4. **My brand kit.** Logo, colours, fonts.

**Default:** none. Use the built-in grammar, measured from v4's reference reel: shots average about 1.35 s (86 % under 2 s), hard cuts, a mix of speaker, cutaway, split and card shots, word-timed captions. · → brief §5 Look and §6 Editing grammar. Follow-up: §6.

**Q2.4 · Captions · single · previews.** "How should his words appear on screen?"
1. **Kinetic story captions (Recommended).**
   - On speaker shots, 2–4 words are stacked over the chest: small serif words plus one big coloured key word. Each word pops in as it is spoken.
   - On cutaways, one bold white word sits in a dark rounded box at about 63 % of the frame height.
   - On splits, the word sits on the seam.
   - Chapter cards drop their letters in one per frame. A highlighter sweeps quoted text.
   - Preview:
     ```
     +---------+
     | speaker |
     |  the    |
     |RAIN  is |  (key word big, accent colour)
     +---------+
     ```
2. **Clean subtitles only.** One or two lines in the lower third, above the platform UI.
3. **Big bold word pops.** One or two huge words at a time, high energy.
4. **None burned in.** SRT/VTT files only.

**Default:** 1. Captions are always in the spoken language. A translation is offered in C7. · → brief §7 Captions.

### Round 3: sound and rules

**Q3.1 · Music · single.** "Music and sound under the voice?"
1. **Gentle score, ducked (Recommended).**
   - A synthesized score (felt piano, pads, strings, glass cells) with sound design on cuts and cards.
   - The voice stays at least **15 dB** above the bed on every word.
   - The music takes a breath under the key line and swells at the payoff.
   - Output is −14 LUFS, true peak −1.5 dB.
2. **Upbeat & energetic.** Pulse-driven, for social hooks. The same floor applies.
3. **Voice + light SFX only.** No music.
4. **My own licensed track.** You send the file and confirm you have the rights. It is ducked the same way.

For the floor, Other can say "18 dB, very quiet" or "12 dB, more music". v4's original rule was 18.5 dB; the owner relaxed it to 15.
**Default:** 1 with a 15 dB floor. · → brief §8 Sound.

**Q3.2 · Must-haves · multi.** "What must be in it? (Pick none for the defaults.)"
1. **Chapter cards.** Numbered step cards at each act turn.
2. **Glossary for hard words.**
   - Each hard word gets a superscript marker plus a short definition, docked in a glossary rail.
   - v4 glossed 4 words: impalpable, lave, atomies, latent.
   - I'll propose the words and you can edit them.
3. **Source credit card.** For example: "Walt Whitman, The Voice of the Rain. Hornbill, Class XI English (NCERT)".
4. **End card / CTA.** Follow, subscribe, a link or a handle. Type the wording in Other.

Logo and watermark go under Other. Give the file path; it is placed small, away from the face and the captions.
**Default:**
- Chapter cards: yes.
- Credit: yes, if any text is quoted.
- Glossary: yes, if the quoted text has archaic or technical words.
- CTA: no. Logo: no.

→ brief §10 Must-haves.

**Q3.3 · Must-nots · multi.** "Anything I must NOT show or do? (Pick none for only the standard rules below.)"
1. **Caricatures of real people.** v4 drew a friendly Whitman caricature, which the owner asked for. Tick this to avoid real-person likenesses.
2. **Jokey / cartoon tone.**
3. **Religious or political symbols.**
4. **Other brands' logos.**

Free text under Other: colours, words or topics to avoid.
**Default:** only the standard rules (§7.2). · → brief §10 Must-nots.

**Q3.4 · Speaker · single · previews.** "How may I treat the speaker's footage? (His face is never covered, keyed or replaced, whatever you pick.)"
1. **Untouched, rounded card (Recommended).**
   - His colours are never changed.
   - In art shots he sits in a clean rounded card (radius about 34 px, soft shadow, thin light rim) over the world. This replaced v4's blurred border, which the owner rejected.
   - Preview:
     ```
     +---------+
     |  art    |
     | .-----. |
     | | spk | |
     | '-----' |
     +---------+
     ```
2. **Light grade allowed.**
   - Highlights about −20 %, the wall pushed toward blue-grey, skin protected, a 25 % vignette.
   - v4's owner chose this.
3. **Trim pauses & retakes.** Long silences and false starts are cut before building. All timings follow the trimmed cut.
4. **Light grade + trim.**

**Default:** 1. · → brief §9 Speaker treatment. Options 2–4 are recorded as **Owner decisions**.

### Round 4: how we work

**Q4.1 · Quality · single.** "Quality versus speed?"
1. **Best: critique to 9/10 (Recommended).**
   - At least 3 rounds of fresh critics (jury, short-form editor, domain teacher).
   - 11 criteria, target ≥ 9.
   - Expect several sessions. v4 took about 3 days and 4 renders.
2. **Balanced: 1–2 rounds.** About one to two sessions.
3. **Fast draft: one render.** QA-clean, no critique rounds.

**Default:** 1, run lean: the lead writes scenes inline when quota is tight, because parallel agents burn the session limit. · → brief §11 Quality & process.
Record later changes ("finish fast", "remove all compromise") here with their date.

**Q4.2 · Check-ins · single · preview.** "Should I check with you along the way?"
1. **3 check-ins (Recommended).** The look (style frames), the story and beat sheet, and the first render (§8). I wait for your answer at each one.
   - Preview:
     ```
     intake → study → concept → [1 look: style frames]
            → beat sheet → [2 story + beats] → build → sound → QA
            → [3 first render] → critique → final
     ```
2. **Show me, don't wait.** I send the files at each gate and keep going. Your notes fold into the next round.
3. **First render only.** Gate 3 only.
4. **Fully autonomous.** I won't be around. Critics decide at every gate, and you get the finished film.

**Default:** 1 if the owner is present, 4 if they said they will be away. · → brief §11 Gates.

**Q4.3 · While away · multi.** "If I hit a usage limit or you're away, what should I do? (Picking these is your OK to set them up.)"
1. **Auto-resume after limits.**
   - A scheduled task runs every 2 h and continues from `RESUME.md` until the film is finished.
   - It runs only while the Claude app is open.
2. **Notify me when done.** A one-line push notification to desktop and phone (Remote Control). It is also sent if I get blocked.
3. **Send preview to my phone.** A 540p preview under 30 MB, sent in chat at gate 3 and at the end.

**Default:**
- Always: `RESUME.md` with a DONE LOG, saved after every step.
- Ticked options only, otherwise none.
- If the owner said they will be away but did not answer: notify only.
- Never create the scheduled task without this answer.

→ brief §12 Away mode.

**Q4.4 · Extras · multi.** "Which extras besides the master (and reel)? (Pick none for the defaults.)"
1. **Poster / thumbnail.** 1080×1920, a frame from the payoff.
2. **Subtitles, chapters, post text.** SRT/VTT, YouTube chapters, and a two-line post caption.
3. **Project folder in Downloads.**
   - A copy of everything in 8 numbered folders, with a README.
   - Refreshed after every render, by `package_project.py`.
4. **Private review web page.** Style frames, contact sheets, scores and a decision log.

**Default:** 1 and 2 are cheap, so make them. 3 and 4 only if ticked. Finals are always copied to Downloads, and a preview under 30 MB is always made. · → brief §3 Format & deliverables.

**Q4.5 · Chat style · single** (ask only if it cannot be inferred, or if a slot is free).
1. **Normal (Recommended).**
2. **Brief / caveman.**
3. **Detailed with reasons.**

**Default:** match how the owner writes, or the owner profile. · → brief §13.

## 5. Conditional questions (only when the trigger fires)

| id | Trigger | Question and options (recommended first) |
|---|---|---|
| C1 | More than one video | "How should I treat these videos?" Options: "A series, shared look (Recommended)", "One combined film", "Separate, different looks". |
| C2 | Spoken words differ from the source text (misquote, paraphrase) | "He says X where the text says Y." Options: "Show the text verbatim, caption his words (Recommended)", "Caption only what he says". Never edit his words in captions. v4 kept "boisterous". |
| C3 | Reference reel or video given, and the intent is unclear | "Use the reel for editing style only (Recommended)" or "Its footage is mine, I may reuse it". The default is never in the film. |
| C4 | Reference images show copyrighted characters, stock art or real people | "Draw originals inspired by them (Recommended)" or "Use the images themselves (I own the rights)". v4: originals (Te Fiti, a stock poet). |
| C5 | A real person would be drawn (author, leader) | "Respectful caricature (Recommended)", "Symbolic only (no face)", "Use a photo I supply". v4: the owner rejected an engraving read as "a black man with hat" and wanted a friendly Whitman caricature (white beard, slouch hat, book). |
| C6 | Source longer than about 6 min | "Graphics through the whole film (long build) (Recommended if Best)", "Graphics in key parts, clean speaker elsewhere", "Split into chapters/episodes". |
| C7 | Non-English or mixed speech, or a non-Latin script | "Captions in the spoken language (Recommended)", "+ English subtitles (SRT)", "+ burned English". Check fonts for the script exist before promising (`fontcheck.mjs`). |
| C8 | A required tool, model or font is missing | Ask before installing. Name the package, its size, and why it is needed. Offer a no-install fallback. Never install silently. |
| C9 | Poor source (heavy noise, under 720p, shaky, cropped face) | "Clean the voice + upscale into a card (Recommended)" or "Keep the raw sound". Report what cannot be fixed. |
| C10 | "Several shorts" was picked | "How many, and how long?" Options: "3 × 45–60 s (Recommended)", "5 × 30 s", "Let me choose the moments". |

## 6. Follow-ups and file handling

- **"I'll share / paste…" answers.** Reply with one line: "Send the path(s), or drag the files in. I'll start the study meanwhile." Do not block the study phase on references. Concept does need them, so wait for them before the concept phase.
- **Reference images:**
  1. Copy them into `<project>/review/userref/`, as PNG (also convert webp and gif). Keep the originals untouched.
  2. Make `sheet.jpg`, a contact sheet of all of them. For gifs, make a frame strip.
  3. Describe each image in one line in the brief (§5): what it shows and what to take from it. Example: `tree_root_1.png`: thick brown roots spreading wide, rounded tips → take: root silhouette and colour.
  4. The art agents read this list.
- **Reference reel:**
  - Measure its grammar into `docs/reference_grammar.md`: cuts, shot lengths, device mix by time, caption grouping, camera moves.
  - Reference footage never enters the film. Its frames may appear only in review boards labelled "reference only".
- **Verbatim text:**
  1. Extract the text (PDF, DOCX or slides).
  2. Show it back once in a code block, with line numbers.
  3. Ask "Exact? (yes / corrections)". If the owner is away, mark it `[ASSUMED]`.
  4. Store it in `work/project.js` (the TEXT lines), the credit line, and the glossary words with their definitions. Never retype it afterwards; scenes read it from there.
- **Names:** keep an exact-spelling table in brief §1 for the speaker, author, work, book, school and brand. Captions use the **spoken** words. Cards and credits use the **table**.
- **Brand assets:** copy them into `review/userref/brand/`. Record hex colours and fonts. Check the fonts are installed; if not, ask (C8).

## 7. Defaults and standing rules

### 7.1 The "you decide" brief (all defaults)
| Item | Default |
|---|---|
| Make | Full film (speech + ~1 s title + ≤12 s coda) + 45–60 s reel with its own music edit and a cold open |
| Format | Source orientation. 9:16: 1080×1920, 60 fps, H.264 High CRF 16, yuv420p TV range, BT.709, AAC 48 kHz |
| Exact text | The attached file, verbatim, with a credit line. Otherwise none |
| Names | As heard, `[ASSUMED]` until confirmed |
| Audience | Inferred from the content |
| Look | Colourful illustrated world, one sky clock across the arc. Concept still makes 3 directions and critics pick |
| References | None. Built-in grammar (v4 measured reel) |
| Pace | Social: about 1.3–1.6 s average shot, something new every 2–4 s. Classroom 16:9: about 2–3 s |
| Captions | Kinetic story captions (chest stack + boxed cutaway word + seam word + chapter cards + highlighter) |
| Music | Gentle synthesized score + sound design. Voice ≥ 15 dB over the bed per word. −14 LUFS, TP −1.5 |
| Must-haves | Chapter cards. Credit and glossary when text is quoted |
| Must-nots | Only the standard rules (7.2) |
| Speaker | Untouched, rounded card in art shots, no grade, no trims |
| Quality | Best, run lean: ≥ 3 critique rounds, target ≥ 9 on 11 criteria |
| Check-ins | 3 gates if present, none if away |
| Away | `RESUME.md` + DONE LOG always. Auto-resume and notify only when the owner agreed |
| Extras | Poster, SRT/VTT, chapters, post caption, preview under 30 MB, finals copied to Downloads |
| Chat | Match the owner |

### 7.2 Standing rules (true for every project)
Write these into brief §0. Rules marked * can be changed only by an explicit owner decision, which is recorded in the brief.

- **R1.** The speaker's face is never covered: not by graphics, captions or transitions. No transition opens over the face. The speaker is never keyed out, and the background is never replaced.
- **R1b.** \* The speaker's colours are untouched. A grade is allowed only as an owner decision.
- **R2.** No reference footage or reference images appear in the film. Everything is drawn as an original inspired by them. The only exception is an owner who states they own the assets (C3/C4).
- **R3.** Quoted text is verbatim, character for character. Spoken words are captioned as spoken.
- **R4.** Names are spelled exactly as in the brief's name table.
- **R5.** \* The voice is intelligible on every word. The default floor is 15 dB over the bed.
- **R6.** The render is deterministic: `renderFrame(t)` is pure, with seeded randomness and no clock.
- **R7.** Every visual lands on the word that names it, cued from word timestamps, never from guessed times.
- **R8.** Phone legibility. Must-read text sits within the 14 %–80 % height band on 9:16. It is at least 28 px at 1080. Contrast is at least 4.5:1. Nothing is clipped, and nothing collides.
- **R9.** Install nothing without asking (C8).
- **R10.** Save progress after every step (the `RESUME.md` DONE LOG). The work must survive a usage limit.

## 8. The three check-in gates

The gates are the only planned interruptions. Each gate is one message: the files go out with `SendUserFile`, then one `AskUserQuestion` call. The gates follow the default phase order: study → concept → beat sheet → build. The look is chosen before the beats, because each beat's visual is drawn in the chosen world.

If concept and beat sheet finish close together, show gates 1 and 2 in one message and ask both in the same call. That makes one interruption instead of two.

| Gate | When | What to show | Question and options (recommended first) |
|---|---|---|---|
| **1 · Look (style frames)** | End of the concept phase | 3 directions × 5 style frames each (speaker + caption, split, cutaway, text card, chapter card), shown as boards. Each direction's one-paragraph pitch, with the critics' scores and pick. Add the one-sentence thesis and the act table as context, so the owner can object to the story early. | "Which look?" One option per direction, the critics' pick first with "(Recommended)". A 4th option: "Mix: tell me". |
| **2 · Story & beat sheet** | End of the beat-sheet phase, before the build | The one-sentence thesis. The act table: windows, temperature, key lines. 10–15 key beats as time · words · visual. The device mix against the grammar target. The film length. Send `docs/story.md` and `docs/beat_sheet.md`. | "Story & beats OK?" Options: "Go ahead (Recommended)", "Change some beats" (type them), "Different angle", "Shorter / longer". |
| **3 · First render** | After the first full render passes QA | The 540p preview (under 30 MB), 2–3 contact sheets, and the 3 things you plan to improve next. | "First cut?" Options: "Good — polish it (Recommended)", "Changes (I'll list them)", "Ship as is". |

**Rules:**
- An answer at a gate is owner feedback. Record it with the protocol in §9.
- With **"Show me, don't wait"**: send the same files, say "continuing; reply any time", and do not call AskUserQuestion. Fold in whatever arrives at the next safe point.
- When the owner is **away** (option 4, or "I won't be around"), every gate is passed **by delegation**:
  - Gate 1 goes to the 3-critic panel (jury, short-form editor, domain teacher), which picks and grafts. v4 picked direction B unanimously this way.
  - Gate 2 goes to a fresh storyboard critic.
  - Gate 3 goes to the critique rounds.
  - Write "Gate N passed by delegation: <who decided, scores>" in brief §11 and in `docs/style/decision.md`.
  - Do not notify the owner for gates. Notify only at the finish, or on a blocker.

## 9. Mid-project feedback and when to ask again

### 9.1 Recording owner feedback (every time, before any work)
1. Put it at the **top of `docs/brief.md`**, under `## OWNER FEEDBACK (latest) — <date time>`:
   - the owner's words, verbatim, in quotes
   - copies of any screenshots, at `review/userref/feedback_<date>_<n>.png`, plus their paths
   - your interpretation as numbered, checkable items, each with its scope (shots, times, files)
   - a status per item: `[ ]` / `[x]` / `[declined: reason]`
2. Move the previous "latest" block down to `## Feedback history`. Never delete it.
3. Quote the owner's latest instruction in the top STATUS block of `RESUME.md`.
4. **Every agent prompt starts with:** "Read `<project>/docs/brief.md` first. The OWNER FEEDBACK (latest) section overrides everything else." Reviewers and critics judge against it too. In v4, every colour artist and its art-director reviewer read the root feedback first.
5. If the feedback changes a default or standing rule (grade, floor, pace, look), add a row to **Owner decisions** with the date and the owner's words. Tell the critics: "These are owner decisions; do not score against them." In v4 the critics stopped flagging the grade and the 15 dB floor only after this.
6. If the feedback affects a sub-brief (for example `docs/color_brief.md`), copy the block to its top as well.

### 9.2 Ask again only when one of these triggers fires
- **Ambiguous feedback that changes a lot of work.**
  - Offer 2–3 concrete readings, recommended first.
  - v4 example: "make similar animation like them" was asked as "Original drawings inspired by them (Recommended)" or "Use the pictures themselves". The owner picked originals, then widened it to "make the world colourful just like the images", meaning the whole film.
- **Evidence that conflicts with the brief:** a name heard differently, text that does not match the speech (C2), or a reference the owner may not own (C4).
- **A scope change:** length or deliverables double, a new aspect is wanted, or several videos arrive.
- **Legal or ethical risk:** copyrighted characters, a real person's likeness, other brands' logos, a music licence.
- **Installing anything** (C8).
- **An action that cannot be undone:** deleting finals or overwriting a delivered master. Prefer versioned names.
- **A budget warning:** the plan will clearly exceed the owner's quality setting, for example many parallel agents near the limit. Propose the lean path.

Do **not** ask about craft choices (a colour, a shot, a transition, a font size). Decide them, log them in `docs/style/decision.md`, and let the critics check.
Do **not** re-ask anything already answered unless new evidence conflicts with it.
One-word steering such as "finish fast", "make it better" or "continue" updates brief §11 Quality. Act on it; do not open a new intake.

## 10. Setting up away mode (only with the Q4.3 answer)

- **Always**, whatever the answer:
  - `RESUME.md` follows `assets/RESUME_template.md`.
  - Append to the DONE LOG after every finished step.
  - Keep the "NEXT SESSION START HERE" block current, with exact commands.
  - Point a memory entry at `RESUME.md`, if memory is available.
- **Auto-resume:**
  1. Fill `assets/auto_resume_task.md` and create the task with `mcp__scheduled-tasks__create_scheduled_task`: `taskId: "<slug>-auto-resume"`, `cronExpression: "17 */2 * * *"`. Use an off-minute (not :00 or :30).
  2. Tell the owner the task id, that it runs only while the Claude app is open, and that it stops by itself once `out/FINISHED.txt` exists.
  3. While **you** work interactively, keep `out/LOCK.txt` fresh: write the time at the start, and again about every 20 min. The scheduled run then will not collide with you.
  4. When finished, disable the task with `update_scheduled_task` and `enabled:false`.
  5. If the scheduled-tasks tool is missing, fall back to `CronCreate`, which lives only for this session and expires after 7 days. Otherwise just tell the owner to say "continue" in a new session.
- **Notify:** use `PushNotification` (load it with ToolSearch `select:PushNotification`).
  - Send one line under 200 characters: what is done and where it is. Example: "Voice of the Rain v4 done: master, reel, preview in Downloads".
  - Also notify if you are blocked and cannot continue.
  - Never notify for routine progress.
- **Preview to phone:** `SendUserFile` the 540p preview (under 30 MB) at gate 3 and at the finish.
- **Package folder:**
  - Location: `<Downloads>/<Title> - Project/`, with `00_README.md` and these folders:
    - `01_Finals`
    - `02_Source_Footage`
    - `03_References` (reference only)
    - `04_Project_Source`
    - `05_Audio`
    - `06_Docs_and_Logs`
    - `07_Review_and_QA`
    - `08_Older_Versions`
  - It is a copy. Keep editing in the project.
  - Refresh it after every render with `python package_project.py`, which copies only changed files.

## 11. Owner profile (carry preferences between projects)

After intake, save only **stable, cross-project** preferences to memory, if memory is available. Never save project details there. Examples:
- chat style
- "notify me when done"
- "package folder in Downloads"
- "install nothing without asking"
- a preferred look
- a preferred voice floor

Next time, state these in the "what I found" message instead of asking. Ask only if the owner says something changed.

## 12. Where each answer goes in `docs/brief.md`

| Question | Brief section | Tag |
|---|---|---|
| Inferred facts (§3) | §1 Source, §2 Purpose | `[INFERRED]` (+ `confirmed` when the owner agreed) |
| Q1.1, Q1.2, Q4.4, C10 | §3 Format & deliverables | `[OWNER]` / `[DEFAULT]` |
| Q1.3 + extracted text, C2 | §4 Verbatim text (+ `work/project.js`) | `[OWNER]` / `[ASSUMED]` |
| Q1.4 | §1 Name table | `[OWNER]` / `[ASSUMED]` |
| Q2.1 | §2 Purpose & audience (+ pace default) | |
| Q2.2, Q2.3, C4, C5 | §5 Look (+ the reference list with one-line notes) | |
| Q2.3 reel | §6 Editing grammar | |
| Q2.4, C7 | §7 Captions | |
| Q3.1 | §8 Sound (floor value) | |
| Q3.4 | §9 Speaker treatment (+ Owner decisions if not the default) | |
| Q3.2, Q3.3 | §10 Must-haves / must-nots | |
| Q4.1, Q4.2 | §11 Quality, process & gates | |
| Q4.3 | §12 Away mode | |
| Q4.5 | §13 Chat style | |
| Every question asked | §15 Intake log (question → answer, verbatim, with time) | |

Tags:
- `[OWNER]`: the owner answered.
- `[INFERRED]`: taken from the files.
- `[DEFAULT]`: "you decide", or the question was skipped.
- `[ASSUMED]`: unconfirmed and could be wrong. These are listed again in §14 Open questions and in the final report under "please confirm".

Fill the "Brief at a glance" block at the top. Agents read it first, so it is 10 lines or fewer.
