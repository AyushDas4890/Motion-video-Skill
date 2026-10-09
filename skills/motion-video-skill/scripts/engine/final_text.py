"""The corrected transcript, read from work/transcript.txt: one spoken sentence per line, lines starting with # ignored.
{A|B|...} marks an uncertain reading: A = chosen, the others = rejected alternatives (ctc_score.py scores each acoustically).
tr.py writes the first draft from whisper; you fix names and misheard words; timing.py / build_caps.py read it here."""
import re

SRC = 'transcript.txt'


def _text():
    return '\n'.join(l for l in open(SRC, encoding='utf-8').read().splitlines() if not l.lstrip().startswith('#'))


def options():
    return re.findall(r"\{([^}]*)\}", _text())


def render(choice=None):
    """choice: dict {option_index: alt_index}; default alt 0 everywhere. Returns the list of sentences."""
    choice = choice or {}
    k = [-1]

    def sub(m):
        k[0] += 1
        return m.group(1).split('|')[choice.get(k[0], 0)]
    txt = re.sub(r"\{([^}]*)\}", sub, _text())
    return [re.sub(r'\s+', ' ', s).strip() for s in txt.strip().split('\n') if s.strip()]
