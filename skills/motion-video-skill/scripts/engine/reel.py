"""Highlight reel cut from the master at sentence boundaries (picture only; the audio is the reel's own mix).
   python reel.py <master.mp4> <out.mp4> <reel_mix.wav>
SEG = [[a, b], ...] master-time segments, in reel order. Read from audio_config.json "reel"."seg" if present (the audio
side builds reel_mix.wav from the same list), else PROJECT.reel.seg (work/project.js). Cut on sentence starts/ends
(docs/caps_listing.txt); open cold on the thesis line; end on the payoff word. VotR: 7 segments, 53.8 s."""
import json, os, subprocess, sys
import projcfg


def load_seg():
    if os.path.isfile('audio_config.json'):
        try:
            a = json.load(open('audio_config.json', encoding='utf-8'))
            seg = (a.get('reel') or {}).get('seg')
            if seg:
                return [tuple(map(float, s)) for s in seg]
        except Exception as e:
            print('warn: audio_config.json unreadable:', e)
    try:
        seg = (projcfg.load().get('reel') or {}).get('seg') or []
    except FileNotFoundError:
        seg = []
    return [tuple(map(float, s)) for s in seg]


SEG = load_seg()


def main(src, out, audio):
    if not SEG:
        sys.exit('no reel segments: set PROJECT.reel.seg in project.js (or "reel": {"seg": [...]} in audio_config.json)')
    fc, cat = [], ''
    for i, (a, b) in enumerate(SEG):
        fc.append(f'[0:v]trim={a}:{b},setpts=PTS-STARTPTS[v{i}]')
        cat += f'[v{i}]'
    fc.append(f'{cat}concat=n={len(SEG)}:v=1:a=0[v]')
    subprocess.run([projcfg.ffmpeg(), '-v', 'error', '-y', '-i', src, '-i', audio, '-filter_complex', ';'.join(fc), '-map', '[v]', '-map', '1:a', '-c:v', 'libx264', '-profile:v', 'high', '-crf', '18',
                    '-pix_fmt', 'yuv420p', '-color_range', 'tv', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-c:a', 'aac', '-b:a', '256k', '-ar', '48000',
                    '-movflags', '+faststart', '-shortest', out], check=True)
    print('reel', round(sum(b - a for a, b in SEG), 2), 's ->', out)


if __name__ == '__main__':
    main(*sys.argv[1:4])
