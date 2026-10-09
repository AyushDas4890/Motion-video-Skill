"""projcfg.py — the Python side of the ONE project config.

work/project.js is the single source of truth for project-specific constants (the browser engine loads it as a script;
Python reads it here). Format: `const PROJECT = { ...strict JSON... };` — full-line // comments are allowed inside the
object, nothing else (no trailing commas, no JS expressions). Everything else in Python (beats.py, qa.py, reel.py,
gen_qa_ts.py, sheets.py, build_caps.py, package_project.py, starter_beats.py) reads it through load().

    import projcfg; P = projcfg.load()          # dict
    projcfg.save(P)                               # rewrite project.js (header comment kept)
    projcfg.ffmpeg()                              # ffmpeg exe: $FF, imageio_ffmpeg, then PATH
"""
import json, os, re, shutil, subprocess

HEADER = """// project.js — EVERY project-specific constant lives here (the engine reads PROJECT; python reads it via projcfg.py).
// Keep the object strict JSON: double quotes, no trailing commas; full-line // comments are fine.
// Keys:
//   title, speaker, lang, aspect ('9:16'|'16:9'|'1:1'), fps (render fps), filmEnd (s; beats.py writes FILM_END from it)
//   footage   {src, dir, fps, w, h, n, dur, digits}: the speaker frames <dir>/00001.jpg.. (frame i = time (i-1)/fps)
//   text      {title, author, lines[] (verbatim quoted text; QA checks it), source (one-line credit), credit[] (page
//              credit lines), cardHead (poem-card header), cardHeadFloat, cardFoot (card footer)}
//   gloss     {word: {n, line, def}} glossary footnotes (QA checks every logged definition)
//   glossRail [[word, t0, t1]..] gloss chip docked lower-left on C/F shots
//   captions  {keyWords[], funcWords[], keepPairs[[a,b]..], goldWords[], goldCapWords[], goldFrom, goldCol, keyClock[[t,col]..]}
//   speakerLook {grade (owner must allow), radius, rim}
//   world     {skyArc [[t,key]..] (colour clock: N B D G O P R M), inkArc [[t,density]..], hlGoldFrom, dawn [t0,ramp],
//              dawnInk [t0,ramp], moonSet, inkGoldWords[]}
//   layout    overrides of the aspect preset (safeTop, safeBot, seam, capY, sAnchor, xAnchor, sCap, fit)
//   qa        {extraTimes[]}: QA sample times beyond the automatic ones (punch-ins, coda...)
//   reel      {seg [[a,b]..]}: highlight-reel cut list (master time)
//   fonts     extra font families the page must have (checked at init)
"""


def find(path=None):
    """project.js next to the caller's cwd (work/), or the given path."""
    for p in ([path] if path else []) + ['project.js', 'work/project.js']:
        if p and os.path.isfile(p):
            return p
    raise FileNotFoundError('project.js not found (run from the project work/ folder)')


def parse(src):
    i = src.index('const PROJECT')
    i = src.index('{', i)
    j = src.index('\n};', i)
    body = '\n'.join(l for l in src[i:j + 2].splitlines() if not l.lstrip().startswith('//'))
    return json.loads(body)


def load(path=None):
    return parse(open(find(path), encoding='utf-8').read())


def _dump(P):
    s = json.dumps(P, indent=1, ensure_ascii=False)
    # keep short lists of scalars (times, colours, pairs) on one line
    def flat(m):
        inner = m.group(0)
        one = re.sub(r'\s*\n\s*', ' ', inner)
        return one if len(one) <= 140 else inner
    for _ in range(3):
        s = re.sub(r'\[[^\[\]{}]*\]', flat, s)
    return s


def save(P, path='project.js'):
    open(path, 'w', encoding='utf-8', newline='\n').write(HEADER + 'const PROJECT = ' + _dump(P) + ';\n')


def ffmpeg():
    exe = os.environ.get('FF')
    if exe and os.path.isfile(exe):
        return exe
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        pass
    exe = shutil.which('ffmpeg')
    if exe:
        return exe
    raise RuntimeError('ffmpeg not found: set FF=<path to ffmpeg.exe> (or pip-installed imageio_ffmpeg provides one)')


def slug(s):
    s = re.sub(r'[^\w\s-]', '', str(s), flags=re.U).strip().lower()
    return re.sub(r'[\s_]+', '-', s) or 'film'


def probe(path):
    """(duration_s, w, h, fps, has_audio) via `ffmpeg -i` (no ffprobe needed). w/h are the displayed size (rotation applied)."""
    r = subprocess.run([ffmpeg(), '-hide_banner', '-i', path], capture_output=True, text=True, encoding='utf-8', errors='replace').stderr
    m = re.search(r'Duration: (\d+):(\d+):([\d.]+)', r)
    dur = int(m.group(1)) * 3600 + int(m.group(2)) * 60 + float(m.group(3)) if m else 0.0
    v = re.search(r'Video: .*?, (\d{2,5})x(\d{2,5})[, \[]', r)
    w, h = (int(v.group(1)), int(v.group(2))) if v else (0, 0)
    f = re.search(r'([\d.]+) fps', r) or re.search(r'([\d.]+) tbr', r)
    fps = float(f.group(1)) if f else 30.0
    rot = re.search(r'rotation of (-?[\d.]+) degrees', r) or re.search(r'rotate\s*:\s*(-?\d+)', r)
    if rot and abs(abs(float(rot.group(1))) % 180 - 90) < 1:
        w, h = h, w
    return dur, w, h, fps, 'Audio:' in r


# English function words (caption grouping, key-word choice, starter beats). Add your language's in captions.funcWords.
STOPWORDS = set('''a an the of to in on at by for from with and or but so as if than then that this these those it its it's is
are was were be been being am i me my we us our you your he him his she her they them their there here what which who whom
whose when where why how not no yes do does did have has had will would can could should shall may might must just very
also too about into over under up down out off again once all any both each few more most other some such only own same now
even ever because while until one two like get got go goes going gone thing things really actually right okay ok well say
said let make made i'm it's that's there's we're you're don't can't'''.split())
