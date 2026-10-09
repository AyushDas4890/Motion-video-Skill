<!--
FINAL REPORT TEMPLATE (motion-video-skill). Write it to <project>/out/FINAL_REPORT.md at delivery.
It also goes into 01_Finals of the package and is linked from the review page.

Rules:
- Be honest and specific: give numbers, paths and times (m:ss).
- Say what you could NOT verify. You cannot listen, and you cannot see the film on the owner's phone.
- Keep the owner's chat style for the chat summary at the bottom. The report itself stays plain and clear.
- Placeholders are written {{LIKE_THIS}}. Drop any row that does not apply. Delete this comment block.
-->
# {{TITLE}} — {{RENDER_LABEL}} — FINAL
Finished {{DATE_TIME}}. Speaker: {{SPEAKER}}. Project: `{{PROJECT_DIR}}`.

## Files
Also copied to `{{DOWNLOADS}}`{{ and to "{{PACKAGE_DIR}}/01_Finals"}}.
| File | What | Specs |
|---|---|---|
| `{{SLUG}}.mp4` | master | {{m:ss}}, {{W}}×{{H}}, {{FPS}} fps, H.264 High CRF 16, yuv420p BT.709, AAC 48 kHz · {{LUFS}} LUFS, true peak {{TP}} dB · {{SIZE}} MB |
| `{{SLUG}}_reel.mp4` | reel | {{s}} s, own music edit, cold open on "{{OPENING_LINE}}"; voice ≥ {{REEL_MIN_GAP}} dB over the bed on every word |
| `{{SLUG}}_preview.mp4` | preview for the phone | 540p, {{SIZE}} MB |
| `{{SLUG}}_poster.jpg` | poster / thumbnail | {{W}}×{{H}}, frame at {{t}} ({{what it shows}}) |
| `.srt` / `.vtt` | subtitles | {{N}} cues, spoken language {{LANG}} |
| `youtube_chapters.txt` · `post_caption.txt` | chapters, two-line caption | |
| review page | {{ARTIFACT_URL or "not requested"}} | style frames, contact sheets, scores, decision log |

## What it is
{{ONE_PARAGRAPH}}: the world and its idea, the light/colour arc, how the speaker is treated, what appears verbatim, and the payoff moment.

## What the owner asked for, and how it was handled
| When | Owner's words | Done |
|---|---|---|
| intake | "{{quote}}" | {{how}} |
| {{date}} | "{{quote}}" | {{how}} (e.g. roots redrawn to match tree_root_1/2: thick brown, curled tips; water as a blue glow inside) |
Owner decisions applied (overriding defaults): {{e.g. light speaker grade; voice floor 15 dB}}.

## What changed since the last delivery
{{bullets, or "first delivery"}}

## Checks
- QA: {{N}} frames, {{FAILS}} FAIL. Checked: safe zones, text size, contrast, face overlap, verbatim text ({{lines}} lines), glossary ({{k}} words).
- Determinism: {{PASS / details}} (e.g. exact on every frame except sub-visible GPU anti-aliasing on root edges, at most 6/765).
- Sound:
  - master {{LUFS}} LUFS, true peak {{TP}} dB
  - the voice is at least {{MIN_GAP}} dB over the bed on every word (floor {{FLOOR}})
  - deepest music breath {{x}} dB at {{t}}
- Encode: {{PASS}} (yuv420p TV range, BT.709 tagged, plays in ffprobe; duration {{d}} s matches the film {{FILM_END}} s).
- Words checked by ear-proxy (a second transcription model): {{e.g. "bounds/shot/ride" confirmed by large-v3-turbo, p ≥ 0.84}}.

## Critique scores (fresh critics each round; target ≥ 9)
| Round (render) | Jury | Short-form editor | Domain teacher | Lowest criterion |
|---|---|---|---|---|
| 1 (#1) | {{x–y}} | | | {{criterion}} |
| {{N}} (#{{N}}) | | | | |
Criteria: hook · template/grammar · rhythm · beauty · ideas · text fidelity · legibility · speaker · arc · craft · sound.
{{If the stop was below 9: why it stopped (owner said finish, diminishing returns, quota), and what would raise the lowest score.}}

## What QA and the critics caught that mattered
- {{symptom → fix}} (e.g. the poem page title sat in the top unsafe zone → page auto-fits the safe zone)

## Weakest moments (be honest)
- {{m:ss}}: {{what is weak and why}} → {{what would fix it}}

## What I could not verify
- I cannot listen: the mix is checked by measurement only (LUFS, per-word ratio, spectra), not by ear.
- {{e.g. colour and legibility on a real phone screen; pronunciation of names; anything [ASSUMED]}}

## Please confirm (assumptions from the brief)
- [ ] {{e.g. speaker spelling "{{SPEAKER}}" (as heard)}}
- [ ] {{e.g. the extracted text matches your source exactly}}

## How to ask for changes
Say what and where, for example "at 1:23 make the roots bigger" or "the reel should open on 'Thank you'". Screenshots help.
The project is live at `{{PROJECT_DIR}}` (`RESUME.md` top block = state). Each change round:
1. update the brief
2. fix
3. QA
4. re-render
5. refresh the package

## Notification and chat summary
- Notification sent: "{{ONE_LINE_UNDER_200_CHARS}}" ({{sent / not sent}})
- Chat summary (5 lines or fewer, in the owner's chat style):
  ```
  {{TITLE}} done. Master {{m:ss}} + reel {{s}} s + preview in Downloads.
  QA 0 FAIL · {{LUFS}} LUFS · voice ≥ {{MIN_GAP}} dB over the music.
  Scores {{lowest}}–{{highest}}/10. Weakest: {{one line}}.
  Couldn't verify: {{one line}}. Please confirm: {{one line}}.
  ```
