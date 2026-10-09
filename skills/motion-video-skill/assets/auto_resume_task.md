<!--
AUTO-RESUME TASK TEMPLATE (motion-video-skill)

Use this ONLY when the owner said yes to "Auto-resume after limits" (intake Q4.3), or asked for it in their own words
(for example "when the tokens refresh, start again from where you stopped"). That answer is their permission to create
this persistent scheduled task. Never create it without that permission.

How to install
1. Fill every {{PLACEHOLDER}} in the PROMPT section below:
   PROJECT_DIR, TITLE, SLUG, OWNER, OWNER_AWAY_QUOTE, FILM_LEN, ASPECT, SPEAKER, SKILL_DIR, DOWNLOADS, PACKAGE_LINE,
   MEMORY_FILE, TASK_ID, CHAT_STYLE, PROJECT_RULES, PREVIEW_LINE.
   The prompt must be self-contained: each run starts with no memory of this conversation.
2. Create the task (load the tool with ToolSearch "select:mcp__scheduled-tasks__create_scheduled_task"):
     taskId: "{{SLUG}}-auto-resume"
     title: "Resume {{TITLE}}"
     description: "Resume and finish the {{TITLE}} film from RESUME.md until out/FINISHED.txt exists"
     cronExpression: "17 */2 * * *"
       Every 2 h at :17, local time. Use an off-minute, not :00 or :30. A live session keeps LOCK.txt fresh, so a run
       never starts while a session is working. A dead session's LOCK goes stale after 90 min, and the next run takes over.
     prompt: <the filled PROMPT section>
3. Tell the owner, in one line:
   - the task id
   - that it runs only while the Claude app is open (a missed run fires at the next launch)
   - that it stops by itself when the film is finished
   - how to stop it early: "say 'stop auto-resume', or disable it in Scheduled tasks"
4. While YOU keep working interactively, keep {{PROJECT_DIR}}/out/LOCK.txt fresh: write the time at the start, then touch the
   file about every 20 min. The scheduled run then exits with "busy" instead of working on the same files as you.
5. On completion, the final session (yours or the task's) creates out/FINISHED.txt and disables the task with
   mcp__scheduled-tasks__update_scheduled_task {taskId, enabled:false}.

Fallback when the scheduled-tasks tool is missing
- Use CronCreate (same prompt, cron "17 */2 * * *", recurring true). It lives only in this session and expires after 7 days.
- Otherwise: keep RESUME.md current and tell the owner to say "continue" in a new session.

Proven on Voice of the Rain v4. The task 'votr-v4-auto-resume' finished render #4, reel, preview, package and report
overnight, then exited early on every later run because FINISHED.txt existed.
-->

## PROMPT (copy everything below this line into the task)

You are resuming an unfinished motion-graphics film for the owner ({{OWNER}}). The owner asked: "{{OWNER_AWAY_QUOTE}}"

Project: `{{PROJECT_DIR}}`. The film is "{{TITLE}}": {{FILM_LEN}} s, {{ASPECT}}, motion graphics over {{SPEAKER}}'s talking-head video.
The method lives in the motion-video-skill at `{{SKILL_DIR}}`. Read its SKILL.md only if RESUME.md is not enough.
All paths below are relative to the project unless they are absolute.

**STEP 0: already done?**
If `out/FINISHED.txt` exists, the job is complete. If the tool `mcp__scheduled-tasks__update_scheduled_task` is available, disable this task with `{taskId: "{{TASK_ID}}", enabled: false}`. Reply "already finished" and stop. Do nothing else.

**STEP 0a: blocked?**
If `out/BLOCKED.txt` exists, an earlier run hit a problem only the owner can solve. Reply "blocked: <its first line>" and stop. The owner deletes the file to resume.

**STEP 0b: is another session working?**
If `out/LOCK.txt` exists and was modified less than 90 minutes ago, reply "busy" and stop.
- Bash: `find "{{PROJECT_DIR}}/out/LOCK.txt" -mmin -90 2>/dev/null | grep -q . && echo busy`
- PowerShell: `(Test-Path $p) -and ((Get-Item $p).LastWriteTime -gt (Get-Date).AddMinutes(-90))`

Otherwise, write `<ISO time> auto-resume run` into `out/LOCK.txt`. While you work, refresh it about every 20 minutes by rewriting the time.

**STEP 0c: progress guard**
Count the lines in the DONE LOG of `RESUME.md` (call it N). Append `<ISO time> run start, done_log=N` to `out/RESUME_RUNS.txt`.

If the last 3 entries in that file (including this one) all show the same N, no step has finished in 3 runs. In that case:
1. Write `out/BLOCKED.txt`: the first line gives the reason, followed by the last error and the step it failed on.
2. Add the same text to the STATUS block of `RESUME.md`.
3. Notify the owner (see STEP 3).
4. Delete `out/LOCK.txt` and stop.

**STEP 1: read before acting**
1. Read `RESUME.md` fully, especially:
   - the top STATUS block and its DONE LOG
   - "NEXT SESSION START HERE"
   - Environment
   - Commands
2. Read `docs/brief.md`: "Brief at a glance" and **OWNER FEEDBACK (latest)**. The feedback overrides everything else.
3. Continue from the first step in the STATUS "NEXT" list that is not yet in the DONE LOG. Use the exact commands and environment variables written in `RESUME.md` (for example GROOT, FF, CRF, and running from `work/`).

**STEP 2: work**
- After EVERY finished step, append one line to the DONE LOG in `RESUME.md` before starting the next. A usage limit must never lose progress. If you run out of usage mid-step, that is fine: the next run continues from the log.
- Keep renders deterministic.
- Write big outputs to a temporary name, then rename them, so a cut-off run never leaves a broken file under a final name.
- Never overwrite a delivered final without keeping the previous one (`*_prev.mp4`) until the new one is verified.
- If `RESUME.md` names a multi-agent workflow that died, relaunch it by running its saved script from `workflows/` (Workflow tool with `{script: <file contents>}`). Its agents continue their own partial files. When usage is tight, prefer to finish small remaining pieces yourself instead of fanning out many agents.
- If the same step fails twice with the same error:
  1. Record it in the STATUS block.
  2. Try the fallback documented in `RESUME.md` or the skill's `references/lessons.md`.
  3. If there is no fallback, follow the BLOCKED path in STEP 0c.
- Before rendering, verify with QA: `python qa.py frames` must give 0 FAIL, and the determinism hash must pass. Look at the contact sheets after every render. Fix any obviously broken shot before delivering.

**STEP 3: finish (only when every NEXT step is done)**
1. Verify the files:
   - The master, the reel (if in the brief) and the preview exist and play. Check their durations with ffprobe.
   - The preview is under 30 MB.
   - The final QA shows 0 FAIL.
   - The mix meets the brief's voice floor (check_ratio).
2. Copy the finals (master, reel, preview, poster, srt, vtt, chapters, post caption) to `{{DOWNLOADS}}`. {{PACKAGE_LINE}} (for example: run `python package_project.py` from `work/` to refresh the project package folder).
3. Write `out/FINAL_REPORT.md` from `{{SKILL_DIR}}/assets/final_report_template.md`. Be honest about what you could not verify: you cannot listen.
4. Create `out/FINISHED.txt` containing the time. Delete `out/LOCK.txt`.
5. If `{{MEMORY_FILE}}` exists, update it to say the film is finished and where the finals are.
6. **Notify the owner.** They asked to be told.
   - Load the tool with ToolSearch `select:PushNotification`.
   - Send one line under 200 characters, leading with what they would act on. For example: "{{TITLE}} done: master, reel and preview in Downloads".
   - If you stopped because you were blocked, send that instead. For example: "{{TITLE}} blocked at <step>: <reason>. See RESUME.md".
   - A "not sent" result is acceptable. Do not retry it in a loop.
7. {{PREVIEW_LINE}} (for example: send `out/{{SLUG}}_preview.mp4` with SendUserFile, status "proactive", caption "{{TITLE}} preview").
8. Disable this task: `mcp__scheduled-tasks__update_scheduled_task {taskId: "{{TASK_ID}}", enabled: false}`, if the tool is available. FINISHED.txt makes any later run exit anyway.

**Rules (from the owner's brief; never break them)**
- Chat style: {{CHAT_STYLE}}.
- Speaker's name: **{{SPEAKER}}**, exactly. Other names are in brief §1.
- Quoted text stays verbatim, with its credit line.
- Never put reference footage or reference images into the film. Draw originals.
- Never cover the speaker's face.
- Install nothing new. If something is missing, follow the BLOCKED path.
- Owner decisions listed in `docs/brief.md` are not faults. Do not undo them.
- Only notify the owner. Never message anyone else, publish anything publicly, or delete the owner's files.
- {{PROJECT_RULES}} (project-specific musts from the OWNER FEEDBACK. v4 example: "Roots must look like the owner's reference: brown, thick, wide, curled tips; never thin white lines.")
