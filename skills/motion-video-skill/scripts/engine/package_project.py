"""Build / refresh the project PACKAGE: one folder with every file and material of the film, for the owner to keep.
Copies (never moves): the working project keeps running. Re-run any time; only changed files are copied.
Run from work/:  python package_project.py [--dest "<folder>"] [--extra "<file or folder>" ...]
Default dest: ~/Downloads/<title> - Project.  --extra adds owner material (reference images, source text PDF, older
versions...) under 03_References/extra. Regenerable folders (parts, vf, tt, node_modules, __pycache__) are skipped."""
import argparse, os, shutil, json, time
import projcfg

P = projcfg.load()
ROOT = os.path.abspath('..')
ap = argparse.ArgumentParser()
ap.add_argument('--dest', default=os.path.join(os.path.expanduser('~'), 'Downloads', f"{P.get('title') or 'Film'} - Project"))
ap.add_argument('--extra', nargs='*', default=[])
A = ap.parse_args()
OUT = A.dest
SKIP_DIRS = {'parts', 'vf', 'tt', 'node_modules', '__pycache__'}
n = {'copied': 0, 'same': 0}


def cp(src, dst):
    if not os.path.isfile(src): return
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    if os.path.isfile(dst) and os.path.getsize(dst) == os.path.getsize(src) and os.path.getmtime(dst) >= os.path.getmtime(src):
        n['same'] += 1; return
    shutil.copy2(src, dst); n['copied'] += 1


def tree(src, dst, skip=SKIP_DIRS, only=None):
    if os.path.isfile(src):
        cp(src, os.path.join(dst, os.path.basename(src))); return
    for root, dirs, files in os.walk(src):
        dirs[:] = [d for d in dirs if d not in skip]
        for f in files:
            if only and not f.lower().endswith(only): continue
            s = os.path.join(root, f); cp(s, os.path.join(dst, os.path.relpath(s, src)))


tree(ROOT + '/out', OUT + '/01_Finals')
src = (P.get('footage') or {}).get('src')
if src and os.path.isfile(src):
    cp(src, OUT + '/02_Source_Footage/' + os.path.basename(src))
for e in A.extra:
    tree(e, OUT + '/03_References/extra')
tree(ROOT + '/review/userref', OUT + '/03_References/owner_references')
tree(ROOT + '/work', OUT + '/04_Project_Source/work')
cp(ROOT + '/RESUME.md', OUT + '/04_Project_Source/RESUME.md')
for f in os.listdir(ROOT + '/work'):
    if f.lower().endswith('.wav') and any(k in f for k in ('final', 'music', 'sfx', 'voice_proc', 'bed', 'reel_mix')):
        cp(ROOT + '/work/' + f, OUT + '/05_Audio/' + f)
tree(ROOT + '/docs', OUT + '/06_Docs_and_Logs/docs')
tree(ROOT + '/workflows', OUT + '/06_Docs_and_Logs/workflow_scripts')
cp(ROOT + '/RESUME.md', OUT + '/06_Docs_and_Logs/RESUME.md')
tree(ROOT + '/review', OUT + '/07_Review_and_QA/review')
tree(ROOT + '/qa', OUT + '/07_Review_and_QA/qa_reports', only=('.json', '.txt', '.md'))

readme = f"""# {P.get('title', 'Film')} — project package
Updated {time.strftime('%Y-%m-%d %H:%M')}. A COPY of everything for this film. The live working project is
`{ROOT}` (edit there; re-run `python work/package_project.py` to refresh this folder).

| Folder | What is inside |
|---|---|
| 01_Finals | delivered renders (master, reel, preview, poster, SRT/VTT, chapters, caption text, render logs) |
| 02_Source_Footage | {P.get('speaker') or 'the speaker'}'s original video |
| 03_References | owner reference material (look only; never used in the film) |
| 04_Project_Source | the whole render engine + this film's scenes, beats, captions, audio scripts and stems, RESUME.md (temp folders parts/vf/tt left out: they regenerate) |
| 05_Audio | final mix, music, sfx, processed voice, reel mix |
| 06_Docs_and_Logs | brief, story, beat sheet, decisions, critique rounds, RESUME, workflow scripts |
| 07_Review_and_QA | contact sheets per render, strips, critic boards, QA reports |

Status: see `06_Docs_and_Logs/RESUME.md` (top block = next steps).
"""
os.makedirs(OUT, exist_ok=True)
open(OUT + '/00_README.md', 'w', encoding='utf-8').write(readme)
print(json.dumps(n), OUT)
