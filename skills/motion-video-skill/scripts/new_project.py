#!/usr/bin/env python
"""new_project.py — scaffold a motion-video project from ONE talking-head video, in one command.

  python new_project.py --video <path> --out <dir> [--title "..."] [--speaker "..."] [--author "..."]
                        [--text <verbatim text file>] [--aspect 9:16|16:9|1:1] [--fps 60] [--lang en]
                        [--model auto] [--src-fps 30] [--src-max 1280] [--no-ctc] [--force]
  python new_project.py --check-only                     environment check only (prints exact fixes, installs nothing)
  python new_project.py --out <dir> --update-engine      refresh the engine code in an existing project (keeps
                                                         project.js, beats_data.py, film.html, audio_config.json,
                                                         acts/scenes_*.js and every generated file)

What it does (all steps print what they measured):
  1. environment check: python modules, ffmpeg, node, Playwright (GROOT), Chromium WebGL on the GPU, fonts,
     faster-whisper + a cached model, optional torch/transformers + wav2vec2 (English timing). Prints fixes; installs nothing.
  2. <out>/{work,docs,review,qa,out,workflows}; copies scripts/engine/* into work/.
  3. probes the video; extracts the speaker frames work/vf/00001.jpg.. at --src-fps (frame i = time (i-1)/fps; long
     side capped at --src-max px) and the audio (work/a16.wav 16 kHz mono for speech tools, work/source_audio.wav 48 kHz).
  4. face boxes for every frame (faces.py -> face_boxes.json, review/face_check.jpg).
  5. transcribes with word timestamps (tr.py, faster-whisper; transcript.txt draft), energy envelope (env.py), English:
     wav2vec2 CTC forced alignment (ctc_emis.py) -> build_caps.py -> caps.json, words_flat.json, out/<slug>.srt/.vtt,
     docs/transcript.md, docs/caps_listing.txt, docs/word_onsets.txt.
  6. writes work/project.js (title, speaker, text, footage facts, film end, key words, sky clock...).
  7. a STARTER beat sheet (starter_beats.py: shots cut on phrase boundaries, S/X/C/F with the generic colourful
     starter scenes) -> python beats.py -> gen_qa_ts.py.
  8. docs/brief.md and RESUME.md from assets/ templates (machine-known keys pre-filled).
Then it prints the next commands (look at a test strip, QA, hash, render).
"""
import argparse, datetime, json, os, re, shutil, subprocess, sys, time

SKILL = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENGINE = os.path.join(SKILL, 'scripts', 'engine')
ASSETS = os.path.join(SKILL, 'assets')
sys.path.insert(0, ENGINE)
import projcfg  # noqa: E402

PROJECT_OWNED = {'project.js', 'beats_data.py', 'film.html', 'audio_config.json'}
ASPECT_OUT = {'9:16': (1080, 1920), '16:9': (1920, 1080), '1:1': (1080, 1080)}


def say(*a):
    print(*a, flush=True)


def run(cmd, cwd, check=True, env=None):
    say('  $', ' '.join(f'"{c}"' if ' ' in str(c) else str(c) for c in cmd))
    t0 = time.time()
    r = subprocess.run([str(c) for c in cmd], cwd=cwd, env=env)
    if check and r.returncode != 0:
        raise SystemExit(f'FAILED ({r.returncode}): {" ".join(map(str, cmd))}')
    say(f'    ({time.time() - t0:.1f} s)')
    return r.returncode


# ---------------------------------------------------------------- 1. environment
def env_check(verbose=True):
    rows, fatal = [], False

    def row(name, ok, detail, fix='', required=True):
        nonlocal fatal
        rows.append((name, ok, detail, fix))
        if not ok and required:
            fatal = True
    # python modules
    for mod, req in [('numpy', True), ('cv2', True), ('scipy', True), ('soundfile', False), ('PIL', False)]:
        try:
            __import__(mod); row(f'python: {mod}', True, 'ok')
        except Exception:
            row(f'python: {mod}', False, 'missing', f'ask the owner, then: python -m pip install {"opencv-python" if mod == "cv2" else "pillow" if mod == "PIL" else mod}', req)
    # ffmpeg
    try:
        ff = projcfg.ffmpeg()
        v = subprocess.run([ff, '-version'], capture_output=True, text=True).stdout.split('\n')[0]
        row('ffmpeg', True, f'{ff} ({v[:40]})')
    except Exception as e:
        ff = None; row('ffmpeg', False, str(e), 'set FF=<path to ffmpeg.exe>, or (ask first) python -m pip install imageio-ffmpeg')
    # node
    node = shutil.which('node')
    if node:
        row('node', True, subprocess.run(['node', '--version'], capture_output=True, text=True).stdout.strip())
    else:
        row('node', False, 'not on PATH', 'install Node.js 18+ (ask the owner first)')
    # playwright + GPU + fonts (one headless launch)
    groot = None
    if node:
        r = subprocess.run(['node', '--input-type=module', '-e', "import {findGroot} from './pw.mjs';try{console.log(findGroot())}catch(e){console.log('ERR '+e.message)}"],
                           cwd=ENGINE, capture_output=True, text=True)
        out = (r.stdout or r.stderr).strip().splitlines()[-1] if (r.stdout or r.stderr).strip() else 'ERR no output'
        if out.startswith('ERR'):
            row('playwright (GROOT)', False, out[4:], 'ask the owner, then: npx -y playwright@1 install chromium ; set GROOT=<that npx cache>/node_modules')
        else:
            groot = out; row('playwright (GROOT)', True, groot)
            r = subprocess.run(['node', 'gpucheck.mjs'], cwd=ENGINE, capture_output=True, text=True, env={**os.environ, 'GROOT': groot})
            try:
                g = json.loads(r.stdout.strip().splitlines()[-1])
            except Exception:
                g = {'ok': False, 'error': (r.stderr or r.stdout)[-300:]}
            if g.get('error'):
                row('chromium', False, g['error'], 'ask the owner, then: npx -y playwright@1 install chromium')
            else:
                row('chromium WebGL on GPU', g['gpu'], g['webgl'], 'the film needs hardware WebGL2: update the GPU driver; on a laptop pick the discrete GPU for node.exe; never render on SwiftShader')
                fm = g.get('fontsMissing') or []
                row('fonts', not fm, 'all engine families present' if not fm else 'missing: ' + ', '.join(fm),
                    'Windows ships Sitka/Segoe UI/Bodoni MT/Edwardian Script; elsewhere change FAM in kit.js to installed families (node fontcheck.mjs lists them)', required=False)
    # faster-whisper + cached models
    try:
        import faster_whisper  # noqa
        hub = os.path.join(os.path.expanduser('~'), '.cache', 'huggingface', 'hub')
        models = sorted(d.replace('models--', '') for d in (os.listdir(hub) if os.path.isdir(hub) else []) if 'whisper' in d.lower())
        row('faster-whisper', bool(models), f'{faster_whisper.__version__}; cached: {", ".join(models) or "none"}',
            'no model cached: ask the owner, then python -c "from faster_whisper import WhisperModel; WhisperModel(\'large-v3-turbo\')"')
    except Exception:
        row('faster-whisper', False, 'not importable', 'ask the owner, then: python -m pip install faster-whisper')
    # optional English CTC alignment
    try:
        import torch, transformers  # noqa
        hub = os.path.join(os.path.expanduser('~'), '.cache', 'huggingface', 'hub')
        ok = os.path.isdir(os.path.join(hub, 'models--facebook--wav2vec2-base-960h'))
        row('CTC timing (English, optional)', ok, f'torch {torch.__version__}, transformers {transformers.__version__}, wav2vec2-base-960h {"cached" if ok else "NOT cached"}',
            'optional: without it word timing = whisper trimmed to the energy envelope (less exact)', required=False)
    except Exception:
        row('CTC timing (English, optional)', False, 'torch/transformers not importable', 'optional (English word timing): python -m pip install torch transformers (ask first)', required=False)
    if verbose:
        say('Environment:')
        for name, ok, detail, fix in rows:
            say(f'  {"OK  " if ok else "FAIL"} {name}: {detail}')
            if not ok and fix:
                say(f'       fix: {fix}')
    return not fatal, groot, ff


# ---------------------------------------------------------------- helpers
def copy_engine(work, update=False):
    n = 0
    for root, dirs, files in os.walk(ENGINE):
        dirs[:] = [d for d in dirs if d not in ('__pycache__', 'node_modules')]
        rel = os.path.relpath(root, ENGINE)
        for f in files:
            r = os.path.normpath(os.path.join(rel, f)).replace('\\', '/')
            if update and (r in PROJECT_OWNED or re.match(r'acts/scenes_.*\.js$', r)) and os.path.exists(os.path.join(work, r)):
                continue
            dst = os.path.join(work, r)
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            shutil.copy2(os.path.join(root, f), dst); n += 1
    return n


def text_lines(path):
    if not path:
        return []
    raw = open(path, encoding='utf-8-sig').read()
    return [l.rstrip() for l in raw.splitlines() if l.strip()]


def fill(tpl, keys):
    for k, v in keys.items():
        if v is None or v == '':
            continue
        tpl = tpl.replace('{{' + k + '}}', str(v))
    return tpl


def key_words(caps, text, n=40):
    nrm = lambda s: re.sub(r"[^\w']", '', s.lower().replace('’', "'"))
    ws = [nrm(w[2]) for c in caps for w in c]
    cnt = {}
    for w in ws:
        if len(w) >= 4 and w not in projcfg.STOPWORDS:
            cnt[w] = cnt.get(w, 0) + 1
    spoken = set(ws)
    out = [w for w, c in sorted(cnt.items(), key=lambda kv: (-kv[1], -len(kv[0]))) if c >= 2]
    for line in text:
        for w in line.split():
            w = nrm(w)
            if w in spoken and len(w) >= 4 and w not in projcfg.STOPWORDS and w not in out:
                out.append(w)
    return out[:n]


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--video'); ap.add_argument('--out')
    ap.add_argument('--title', default=''); ap.add_argument('--speaker', default=''); ap.add_argument('--author', default='')
    ap.add_argument('--text', default='', help='verbatim text file the film quotes (poem, definition...), one line per line')
    ap.add_argument('--aspect', default='9:16', choices=list(ASPECT_OUT)); ap.add_argument('--fps', type=int, default=60)
    ap.add_argument('--lang', default='', help='speech language code (en, hi, es...); empty = auto-detect')
    ap.add_argument('--model', default='auto', help='faster-whisper model (auto = best cached)')
    ap.add_argument('--src-fps', type=float, default=30.0, help='speaker frame rate to extract (30 like v4)')
    ap.add_argument('--src-max', type=int, default=1280, help='cap the long side of the extracted frames (px)')
    ap.add_argument('--no-ctc', action='store_true', help='skip wav2vec2 forced alignment even for English')
    ap.add_argument('--force', action='store_true', help='delete --out first if it exists')
    ap.add_argument('--check-only', action='store_true'); ap.add_argument('--update-engine', action='store_true')
    A = ap.parse_args()
    T0 = time.time()
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

    ok, groot, ff = env_check()
    if A.check_only:
        sys.exit(0 if ok else 1)
    if A.update_engine:
        if not A.out: ap.error('--update-engine needs --out <existing project dir>')
        work = os.path.join(os.path.abspath(A.out), 'work')
        if not os.path.isfile(os.path.join(work, 'project.js')): sys.exit(f'{work}/project.js not found: not a project')
        say(f'updated {copy_engine(work, update=True)} engine files in {work} (project-owned files kept)'); return
    if not ok:
        sys.exit('Environment check FAILED (see fixes above). Nothing was created.')
    if not A.video or not A.out:
        ap.error('--video and --out are required')
    video = os.path.abspath(A.video)
    if not os.path.isfile(video): sys.exit(f'video not found: {video}')
    out = os.path.abspath(A.out)
    if os.path.exists(out) and os.listdir(out):
        if not A.force: sys.exit(f'{out} exists and is not empty (use --force to recreate it, or --update-engine)')
        shutil.rmtree(out)
    for d in ('work', 'docs', 'review', 'qa', 'out', 'workflows'):
        os.makedirs(os.path.join(out, d), exist_ok=True)
    work = os.path.join(out, 'work')
    say(f'\n[2] project {out}: copied {copy_engine(work)} engine files')
    py = sys.executable

    # 3. probe + extract
    dur, sw, sh, sfps, has_audio = projcfg.probe(video)
    say(f'\n[3] video {os.path.basename(video)}: {dur:.2f} s, {sw}x{sh}, {sfps:.2f} fps, audio {"yes" if has_audio else "NO"}')
    if not has_audio: sys.exit('the video has no audio track: this pipeline is driven by speech')
    k = min(1.0, A.src_max / max(sw, sh))
    fw, fh = int(round(sw * k / 2) * 2), int(round(sh * k / 2) * 2)
    vf = f'fps={A.src_fps:g}' + (f',scale={fw}:{fh}:flags=lanczos' if k < 1 else '')
    os.makedirs(os.path.join(work, 'vf'), exist_ok=True)
    run([ff, '-v', 'error', '-y', '-i', video, '-vf', vf, '-q:v', '2', os.path.join(work, 'vf', '%05d.jpg')], cwd=work)
    nfr = len([f for f in os.listdir(os.path.join(work, 'vf')) if f.endswith('.jpg')])
    import cv2
    fh, fw = cv2.imread(os.path.join(work, 'vf', '00001.jpg')).shape[:2]
    fdur = round(min(dur, nfr / A.src_fps), 2)
    say(f'    frames: {nfr} x {fw}x{fh} at {A.src_fps:g} fps ({fdur} s)')
    run([ff, '-v', 'error', '-y', '-i', video, '-vn', '-ac', '1', '-ar', '16000', '-c:a', 'pcm_s16le', 'a16.wav'], cwd=work)
    run([ff, '-v', 'error', '-y', '-i', video, '-vn', '-ac', '2', '-ar', '48000', '-c:a', 'pcm_s16le', 'source_audio.wav'], cwd=work)

    # 6a. project.js (first version: the pipeline scripts read it)
    title = A.title or os.path.splitext(os.path.basename(video))[0]
    text = text_lines(A.text)
    if A.text:
        shutil.copy2(A.text, os.path.join(out, 'docs', 'source_text' + os.path.splitext(A.text)[1]))
    film_end = int(fdur * 100) / 100
    d = film_end
    P = {
        'title': title, 'speaker': A.speaker, 'lang': A.lang or 'auto', 'aspect': A.aspect, 'fps': A.fps, 'filmEnd': film_end,
        'footage': {'src': video.replace('\\', '/'), 'dir': 'vf', 'fps': A.src_fps, 'w': fw, 'h': fh, 'n': nfr, 'dur': fdur, 'digits': 5},
        'text': {'title': title, 'author': A.author, 'lines': text, 'source': ', '.join(x for x in [A.author, title] if x) if text else '',
                 'credit': [], 'cardHead': title.upper(), 'cardHeadFloat': ' · '.join(x for x in [A.author.upper(), title.upper()] if x), 'cardFoot': ''},
        'gloss': {}, 'glossRail': [],
        'captions': {'keyWords': [], 'funcWords': [], 'keepPairs': [], 'goldWords': [], 'goldCapWords': [], 'goldFrom': 0, 'goldCol': '#FFD36E',
                     'keyClock': [[0, '#C9DBFF']]},
        'speakerLook': {'grade': False, 'radius': 34, 'rim': 'rgba(255,255,255,0.55)'},
        'world': {'skyArc': [[0, 'B'], [round(d * 0.12, 2), 'D'], [round(d * 0.55, 2), 'D'], [round(d * 0.66, 2), 'G'], [round(d * 0.93, 2), 'G'], [round(d, 2), 'M']],
                  'inkArc': None, 'hlGoldFrom': 1000000000, 'dawn': [1000000000, 4], 'dawnInk': [1000000000, 6], 'moonSet': round(d * 0.4, 2), 'inkGoldWords': []},
        'layout': {}, 'qa': {'extraTimes': []}, 'reel': {'seg': []}, 'fonts': []}
    os.chdir(work)
    projcfg.save(P, 'project.js')
    say(f'\n[6] project.js written (aspect {A.aspect}, film end {film_end} s)')

    # 4. faces
    say('\n[4] face boxes'); run([py, 'faces.py', 'vf', A.src_fps], cwd=work)

    # 5. speech
    say('\n[5] transcript + word timing')
    prompt = ', '.join(x for x in [title, A.speaker, A.author] if x)
    if text:
        prop = []
        for w in ' '.join(text).split():
            w2 = re.sub(r'[^\w’\'-]', '', w)
            if len(w2) >= 5 and w2 not in prop: prop.append(w2)
        prompt = (prompt + ', ' + ', '.join(prop))[:600]
    cmd = [py, 'tr.py', '--audio', 'a16.wav', '--model', A.model, '--force-text'] + (['--lang', A.lang] if A.lang else []) + (['--prompt', prompt] if prompt else [])
    run(cmd, cwd=work)
    lang = json.load(open('words_whisper.json', encoding='utf-8')).get('lang') or A.lang or 'en'
    run([py, 'env.py', 'a16.wav'], cwd=work)
    if lang.startswith('en') and not A.no_ctc:
        run([py, 'ctc_emis.py', 'a16.wav'], cwd=work, check=False)
    run([py, 'build_caps.py'], cwd=work)
    caps = json.load(open('caps.json', encoding='utf-8'))
    heard = ''
    m = re.search(r"\b(?:i am|i'm|i’m|my name is|this is)\s+([\w’'-]+)", ' '.join(w[2] for c in caps for w in c), re.I)
    if m and m.group(1)[:1].isupper(): heard = m.group(1).strip(',.')

    # 6b. project.js: language + caption key words
    P = projcfg.load('project.js')
    P['lang'] = lang
    P['captions']['keyWords'] = key_words(caps, text)
    projcfg.save(P, 'project.js')
    say(f'    language {lang}; {sum(len(c) for c in caps)} words; key words: {", ".join(P["captions"]["keyWords"][:12])}...' + (f'; speaker heard as "{heard}"' if heard else ''))

    # 7. starter beats
    say('\n[7] starter beat sheet')
    run([py, 'starter_beats.py', '--force'], cwd=work)
    run([py, 'beats.py'], cwd=work)
    run([py, 'gen_qa_ts.py'], cwd=work)

    # 8. brief + RESUME
    W_, H_ = ASPECT_OUT[A.aspect]
    now = datetime.datetime.now()
    keys = {'TITLE': title, 'SLUG': projcfg.slug(title), 'PROJECT_DIR': out.replace('\\', '/'), 'VIDEO': video.replace('\\', '/'), 'DURATION': f'{dur:.2f}',
            'SRC_W': sw, 'SRC_H': sh, 'SRC_FPS': f'{sfps:g}', 'ORIENTATION': 'portrait' if sh > sw else 'landscape' if sw > sh else 'square',
            'LANG': lang, 'SPEAKER': A.speaker, 'SPEAKER_HEARD': heard, 'ASPECT': A.aspect, 'OUT_W': W_, 'OUT_H': H_, 'OUT_FPS': A.fps,
            'TEXT_FILE': A.text.replace('\\', '/') if A.text else '', 'DATE': now.strftime('%Y-%m-%d'), 'UPDATED': now.strftime('%Y-%m-%d %H:%M'),
            'DATE_TIME': now.strftime('%Y-%m-%d %H:%M'), 'FILM_END': film_end, 'PLAYWRIGHT_NODE_MODULES': (groot or '').replace('\\', '/'),
            'FFMPEG_EXE': (ff or '').replace('\\', '/'), 'PYTHON': py.replace('\\', '/'), 'NODE': (shutil.which('node') or 'node').replace('\\', '/'),
            'DOWNLOADS': os.path.join(os.path.expanduser('~'), 'Downloads').replace('\\', '/'),
            'PACKAGE_DIR': os.path.join(os.path.expanduser('~'), 'Downloads', f'{title} - Project').replace('\\', '/')}
    for tpl, dst, inline in [('brief_template.md', os.path.join(out, 'docs', 'brief.md'), f'# Brief: {title}\n\n(fill from intake: references/intake.md)\n'),
                             ('RESUME_template.md', os.path.join(out, 'RESUME.md'), f'# RESUME — {title}\n\nProject {out}. Next: intake -> brief -> study -> concept -> beats -> build -> sound -> QA -> render.\n')]:
        src = os.path.join(ASSETS, tpl)
        open(dst, 'w', encoding='utf-8').write(fill(open(src, encoding='utf-8').read(), keys) if os.path.isfile(src) else inline)
    say(f'\n[8] docs/brief.md, RESUME.md written ({"from assets/ templates" if os.path.isdir(ASSETS) else "minimal"})')

    nb = len(json.load(open('beats.json', encoding='utf-8')))
    say(f"""
DONE in {(time.time() - T0) / 60:.1f} min: {out}
  footage {nfr} frames {fw}x{fh} · {sum(len(c) for c in caps)} words · {nb} starter shots · film {film_end} s · {A.aspect} {W_}x{H_} @ {A.fps} fps
NEXT (run from {work}; env GROOT={groot or '<node_modules with playwright>'}):
  1. fix names / misheard words in work/transcript.txt -> python build_caps.py -> python starter_beats.py (or edit beats_data.py) -> python beats.py
  2. LOOK:   node render.mjs test 1,{round(d*0.25,1)},{round(d*0.5,1)},{round(d*0.75,1)},{round(d-0.5,1)} ../review/start.jpg 216
  3. QA:     python gen_qa_ts.py && node render.mjs qa <times from _qa_ts.txt> ../qa/r0 && python qa.py frames ../qa/r0
  4. hash:   node render.mjs hash 1,{round(d*0.5,1)},{round(d-0.5,1)}
  5. render: node prender.mjs ../out/{projcfg.slug(title)}_draft.mp4 {A.fps} 4 source_audio.wav
  then the real work: intake -> brief -> concept -> beat sheet -> scenes in work/acts/scenes_main.js (see work/README.md).""")


if __name__ == '__main__':
    main()
