"""Highlight reel (~51 s, 9:16) cut from the master at sentence boundaries; 0.12 s audio fades at every join.
   python reel.py <master.mp4> <out.mp4> <reel_mix.wav>"""
import subprocess, sys
FF = r'<ffmpeg exe: python -c "import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())">'
# cold open on the thesis line (critic r3): speaker-full "It's so GRATEFUL", then 0.8 s of the hook sea, then the story
SEG = [(113.31, 114.59), (0.0, 0.8), (17.56, 22.98), (55.75, 74.71), (108.36, 118.40), (166.08, 176.94), (207.68, 214.4)]
def main(src, out, audio):
    fc, cat = [], ''
    for i, (a, b) in enumerate(SEG):
        d = b - a
        fc.append(f'[0:v]trim={a}:{b},setpts=PTS-STARTPTS[v{i}]')
        cat += f'[v{i}]'
    fc.append(f'{cat}concat=n={len(SEG)}:v=1:a=0[v]')
    subprocess.run([FF, '-v', 'error', '-y', '-i', src, '-i', audio, '-filter_complex', ';'.join(fc), '-map', '[v]', '-map', '1:a', '-c:v', 'libx264', '-profile:v', 'high', '-crf', '18',
                    '-pix_fmt', 'yuv420p', '-color_range', 'tv', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-c:a', 'aac', '-b:a', '256k', '-ar', '48000',
                    '-movflags', '+faststart', out], check=True)
    print('reel', sum(b - a for a, b in SEG), 's ->', out)

if __name__ == '__main__':
    main(*sys.argv[1:4])
