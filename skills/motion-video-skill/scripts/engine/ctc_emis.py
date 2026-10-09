"""wav2vec2 CTC log-probs of the whole speech track (20 ms frames, 20 s chunks with 2 s overlap) -> ctc_lp.npy +
ctc_vocab.json, for forced alignment (ctc_align.py / timing.py). ENGLISH ONLY (facebook/wav2vec2-base-960h).
Run from work/:  python ctc_emis.py [a16.wav]
Needs torch + transformers and the model already in the Hugging Face cache (never downloads). If anything is missing it
prints 'CTC skipped: <why>' and exits 0: timing.py then falls back to whisper times trimmed to the energy envelope."""
import glob, os, sys, wave, json
import numpy as np

src = sys.argv[1] if len(sys.argv) > 1 else 'a16.wav'
try:
    import torch
    from transformers import Wav2Vec2ForCTC, Wav2Vec2Processor
except Exception as e:
    print('CTC skipped: torch/transformers not importable:', type(e).__name__); sys.exit(0)
hub = os.environ.get('HF_HUB_CACHE') or os.path.join(os.environ.get('HF_HOME') or os.path.join(os.path.expanduser('~'), '.cache', 'huggingface'), 'hub')
snaps = glob.glob(os.path.join(hub, 'models--facebook--wav2vec2-base-960h', 'snapshots', '*', ''))
if not snaps:
    print('CTC skipped: facebook/wav2vec2-base-960h not in', hub); sys.exit(0)
proc = Wav2Vec2Processor.from_pretrained(snaps[0], local_files_only=True)
model = Wav2Vec2ForCTC.from_pretrained(snaps[0], local_files_only=True).eval()
w = wave.open(src)
assert w.getframerate() == 16000 and w.getnchannels() == 1, 'expects 16 kHz mono'
x = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768
SR, HOP = 16000, 320
T = len(x) // HOP
out = np.zeros((T, model.config.vocab_size), np.float32); filled = np.zeros(T, bool)
CH, OV = 20 * SR, 2 * SR
st = 0
while st < len(x):
    seg = x[st:st + CH]
    if len(seg) < 400:
        break
    inp = proc(seg, sampling_rate=SR, return_tensors='pt').input_values
    with torch.no_grad():
        lp = torch.log_softmax(model(inp).logits[0], -1).numpy()
    f0 = st // HOP
    keep0 = 0 if st == 0 else OV // HOP // 2  # drop the first 1 s of the overlap
    for i in range(keep0, len(lp)):
        if f0 + i < T: out[f0 + i] = lp[i]; filled[f0 + i] = True
    if st + CH >= len(x): break
    st += CH - OV
if not filled.all():  # a tail shorter than one model frame: copy the last row
    last = np.where(filled)[0].max()
    out[last + 1:] = out[last]
np.save('ctc_lp.npy', out)
json.dump(proc.tokenizer.get_vocab(), open('ctc_vocab.json', 'w'))
print('ctc_lp.npy', out.shape)
