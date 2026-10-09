// score.mjs - data-driven film score -> music.wav (48 kHz stereo 16-bit, exactly film_len s). Deterministic (seeded RNG).
//
//   node score.mjs                 # run from the project's work/ folder (reads audio_config.json, beats.json, caps.json)
//   node score.mjs --plan          # print the resolved plan (sections, chords, tempo, payoff, breaths, motifs); no render
//   node score.mjs --dir <work> --out music.wav
//
// Writes music.wav + score_plan.json (the resolved plan: use its section starts, payoff and coda grid to sync picture cues).
// Two modes (audio_config.json "score"):
//   AUTO (default, "sections": [])  sections are derived from beats.json: chapter cards (lay F, scene ~ /chap/) start new
//        sections, long sections split at sentence gaps, a build (~10 s) leads to the PAYOFF (last key-word beat in the final
//        30 % of speech, or the last sentence), a root-position major chord + motif + glass sparkle blooms on the payoff word,
//        and a coda (one glass note per beat, minor-plagal amen, ringing chord, digital silence) plays after the last word.
//   PLAN  ("sections": [{t0,t1,mood,key,chords,bpm,density,fig,vel,cue}...]) you write the harmony and the cues yourself.
// Palette (from Voice of the Rain v4): felt piano (stretched partials, hammer felt, soft damper, sympathetic resonance),
// warm pads, soft strings (polyBLEP saw ensemble), muted brass (cold moods only), glass/celesta cells, Freeverb hall.
// Speech rules: sustained parts sit below ~1.7 kHz (pad LP 950 Hz, strings LP <= 1.7 kHz); a glass cell that touches a word
// moves to octave 8 (4.2-7 kHz, above the speech band) and plays in octave 7 only inside a breath; piano figures rest in
// breaths, before the payoff word and at hard stops. mix.py then carves 2.4 kHz / 5.8 kHz and ducks under the voice.
// This module also EXPORTS loadProject / anchor / resolvePlan for sfx.mjs (same payoff, sections and pitch set).
import fs from 'fs'; import path from 'path'; import { pathToFileURL } from 'url';

export const SR = 48000;
export const DEFAULTS = {
  film_len: 'auto', files: { beats: 'beats.json', caps: 'caps.json' },
  score: {
    mode: 'auto', seed: 20261007, key: 'A minor', payoff: 'auto', moods: [], sections: [], chapter_regex: 'chap|chapter|step',
    max_section_s: 40, build_s: 10, breaths: 'auto', breath_min_gap_s: 0.9, breath_spacing_s: 20, motif_words: [], motif_max: 6,
    motif_min_gap_s: 12, stops: [], events: [], coda_min_s: 3.0, reverb_db: -6, sympathetic_db: -16, peak_dbfs: -1,
    gain: { piano: 0.12, pad: 0.05, strings: 0.05, brass: 0.06, glass: 0.05 },
  },
  sfx: { opener: { t: 0.2, type: 'drop', gain: 0, sub: 1, ripple: 1 } },
};

// ---------------------------------------------------------------- project loading (shared with sfx.mjs)
const isObj = x => x && typeof x === 'object' && !Array.isArray(x);
export function deepMerge(a, b) { const o = { ...a }; for (const [k, v] of Object.entries(b || {})) o[k] = isObj(v) && isObj(a[k]) ? deepMerge(a[k], v) : v; return o; }
export const norm = w => String(w).toLowerCase().normalize('NFKC').replace(/[^\p{L}\p{N}']/gu, '').replace(/^'+|'+$/g, '');
export function readWords(file) {           // caps.json chunks [[s,e,w]...] | flat [[s,e,w]] | [{start,end,word}] | {words:[...]}
  if (!fs.existsSync(file)) return [];
  let j = JSON.parse(fs.readFileSync(file, 'utf8')); if (isObj(j)) j = j.words || j.segments || [];
  const out = [], walk = x => { if (Array.isArray(x) && x.length >= 3 && typeof x[0] === 'number' && typeof x[2] === 'string') out.push([+x[0], +x[1], x[2]]);
    else if (Array.isArray(x)) x.forEach(walk); else if (isObj(x) && 'start' in x) out.push([+x.start, +x.end, String(x.word ?? x.text ?? '').trim()]); };
  walk(j); return out.filter(w => w[2]).sort((a, b) => a[0] - b[0]);
}
export function loadProject(dir = process.cwd()) {
  const cp = path.join(dir, 'audio_config.json');
  const user = fs.existsSync(cp) ? JSON.parse(fs.readFileSync(cp, 'utf8')) : {};
  const cfg = deepMerge(DEFAULTS, user);
  const bp = path.join(dir, cfg.files.beats);
  const beats = fs.existsSync(bp) ? JSON.parse(fs.readFileSync(bp, 'utf8')).filter(b => typeof b.t0 === 'number').sort((a, b) => a.t0 - b.t0) : [];
  const words = readWords(path.join(dir, cfg.files.caps));
  let film = cfg.film_len;
  if (typeof film !== 'number') {
    const bt = beats.length ? Math.max(...beats.map(b => b.t1 ?? b.t0)) : 0, wt = words.length ? words.at(-1)[1] + 2 : 0;
    film = Math.max(bt, wt); if (!(film > 0)) throw new Error('film_len: set it in audio_config.json (no beats.json / caps.json to derive it from)');
  }
  return { dir, cfg, beats, words, film: Math.round(film * 1000) / 1000, configFound: fs.existsSync(cp) };
}
// Time anchors: a number (s), or "word", "two words", "word#2" (2nd occurrence), "word@100" (first at/after 100 s),
// "word~end" (its end time), "word+0.3" / "word-0.5" (offset); or {word, n, after, edge:'end', off}.
export function anchor(words, spec) {
  if (typeof spec === 'number') return spec;
  if (spec == null || spec === 'auto' || spec === '') return null;
  let o = spec;
  if (typeof spec === 'string') {
    if (/^-?\d+(\.\d+)?$/.test(spec.trim())) return +spec;
    const m = /^(.+?)(?:#(\d+))?(?:@(\d+(?:\.\d+)?))?(~end|~start)?([+-]\d*\.?\d+)?$/.exec(spec.trim());
    o = { word: m[1], n: m[2] ? +m[2] : 1, after: m[3] ? +m[3] : 0, edge: m[4] === '~end' ? 'end' : 'start', off: m[5] ? +m[5] : 0 };
  }
  const toks = String(o.word).split(/\s+/).map(norm).filter(Boolean); let c = 0;
  for (let i = 0; i + toks.length <= words.length; i++) {
    if (words[i][0] < (o.after ?? 0) - 1e-6) continue;
    if (toks.every((t, j) => norm(words[i + j][2]) === t) && ++c === (o.n ?? 1))
      return +((o.edge === 'end' ? words[i + toks.length - 1][1] : words[i][0]) + (o.off ?? 0)).toFixed(3);
  }
  throw new Error(`anchor ${JSON.stringify(spec)} not found in the transcript`);
}
export const inSpeech = (words, a, b) => words.some(w => w[0] < b && w[1] > a);
export function chapters(P, re = P.cfg.score.chapter_regex) {
  const rx = new RegExp(re, 'i');
  return P.beats.filter(b => b.lay === 'F' && (b.chapter || rx.test(b.scene || ''))).map(b => {
    const q = /'([^']{2,40})'/.exec(b.visual || '') || /"([^"]{2,40})"/.exec(b.visual || '');
    return { t: b.t0, id: b.id, word: String(b.chapter && b.chapter !== true ? b.chapter : b.args?.word ?? (q ? q[1] : 'chapter')) };
  });
}
// sentence starts: first word, and every word after a gap >= gap s or after . ! ? ;
export function sentenceStarts(words, gap = 0.45) {
  return words.filter((w, i) => i === 0 || w[0] - words[i - 1][1] >= gap || /[.!?;:]["')\]]*$/.test(words[i - 1][2])).map(w => w[0]);
}
export function findPayoff(P) {
  const { cfg, beats, words, film } = P, sp = cfg.score.payoff;
  if (sp === null || sp === false || sp === 'none') return null;
  if (sp != null && sp !== 'auto') return anchor(words, sp);
  if (!words.length) return null;
  const s0 = words[0][0], s1 = words.at(-1)[1];
  for (let i = beats.length - 1; i >= 0; i--) {             // 1. last key-word beat in the final 30 % of speech
    const b = beats[i]; if (!b.key || b.t0 < s0 + 0.7 * (s1 - s0)) continue;
    const k = norm(String(b.key).split(/\s+/)[0]), w = words.find(w => w[0] >= b.t0 - 0.35 && norm(w[2]) === k);
    return w ? w[0] : b.t0;
  }
  const ss = sentenceStarts(words), last = ss.filter(t => t >= s0 + 0.5 * (s1 - s0));   // 2. last sentence start in the 2nd half
  return last.length ? last.at(-1) : Math.max(s0, s1 - 2);
}

// ---------------------------------------------------------------- harmony helpers
const PCN = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }, NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
const pcOf = s => { const m = /^([A-G])([#b]?)/.exec(s); return (PCN[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + 12) % 12; };
export const noteNum = s => { const k = /^([A-G])([#b]?)(-?\d)$/.exec(s); return 12 * (+k[3] + 1) + pcOf(k[1] + k[2]); };
export function parseKey(s) {
  const m = /^\s*([A-G][#b]?)\s*(m(?!aj)|min|minor|aeolian|dorian|phrygian|maj|major|ionian|lydian|mixolydian)?\s*$/i.exec(String(s || 'A minor'));
  if (!m) throw new Error('score.key: use e.g. "A minor", "C major", "D dorian"');
  const t = pcOf(m[1].charAt(0).toUpperCase() + m[1].slice(1)), minor = !!m[2] && /^(m|min|minor|aeolian|dorian|phrygian)$/i.test(m[2]);
  const m0 = minor ? t : (t + 9) % 12;            // the night/story tonic is minor; the payoff/dawn is its relative major
  return { name: String(s), m0, M0: (m0 + 3) % 12, minor };
}
// chord symbol -> {root, ivs, bass, sym}.  Am, Am7, Am9, Am(add9), Fmaj7, Fmaj9, Fmaj7#11, G7sus4, Gsus2, C6, Fm6, Gm(maj7), Bdim, Caug, A5, C/E
export function parseChord(sym) {
  const m = /^([A-G][#b]?)([^/]*)(?:\/([A-G][#b]?))?$/.exec(String(sym).trim()); if (!m) throw new Error('bad chord ' + sym);
  const root = pcOf(m[1]), q = m[2].replace(/[()]/g, ''), bass = m[3] ? pcOf(m[3]) : root;
  const minor = /^(m(?!aj)|min|-)/.test(q), dim = /dim|°/.test(q), aug = /aug|\+$/.test(q), sus4 = /sus4|sus(?!2)/.test(q), sus2 = /sus2/.test(q);
  let ivs = /^5$/.test(q) ? [0, 7] : [0, sus4 ? 5 : sus2 ? 2 : minor || dim ? 3 : 4, dim ? 6 : aug ? 8 : 7];
  const ext = q.replace(/^(m(?!aj)|min|-)/, '');
  if (/maj7|maj9|M7|Δ|mmaj7|m\(?maj7/.test(q)) ivs.push(11); else if (/(^|[^d])(7|9|11|13)/.test(ext.replace(/add9|#11|b9/g, '')) || /^7/.test(ext)) ivs.push(10);
  if (/(^|[^0-9])6/.test(ext)) ivs.push(9);
  if (/add9|(^|[^0-9#b])9/.test(ext) || /maj9/.test(q)) ivs.push(14);
  if (/#11/.test(q) || /lyd/.test(q)) ivs.push(18);
  ivs = [...new Set(ivs)];
  return { root, ivs, bass, sym };
}
const relChord = (K, [off, q, bassOff]) => { const r = (K.m0 + off) % 12, s = NAMES[r] + q + (bassOff != null ? '/' + NAMES[(K.m0 + bassOff) % 12] : ''); return parseChord(s); };
// voicing: bass in 34..45, upper chord tones in 52..72 (root omitted when 3+ other tones), at most 4 uppers
export function voicing(ch) {
  let B = 36 + ((ch.bass - 36) % 12 + 12) % 12; if (B > 45) B -= 12;
  let tones = ch.ivs.map(iv => (ch.root + iv) % 12); const others = tones.filter(p => p !== ch.root);
  if (others.length >= 3) tones = others;
  let U = [...new Set(tones)].map(pc => 52 + ((pc - 52) % 12 + 12) % 12).sort((a, b) => a - b);
  if (U.length > 4) U = U.filter(m => (m - ch.root - 7) % 12 !== 0).slice(0, 4);
  return { B, U };
}
// mood presets. prog entries are [semitones above the minor tonic m0, quality, optional slash-bass semitones above m0].
export const MOODS = {
  intro:   { bpm: 64, fig: 'sparse', density: 0.5, vel: 0.24, bass: 0.28, pad: 0.30, str: [0.0, 0.12], cb: 4, energy: 0.35, prog: [[0, 'm(add9)'], [8, 'maj7'], [5, 'm9'], [7, 'm7']] },
  wonder:  { bpm: 72, fig: 'sparse', density: 0.65, vel: 0.28, bass: 0.32, pad: 0.40, str: [0.12, 0.25], cb: 4, energy: 0.45, prog: [[0, 'm(add9)'], [0, 'm', 10], [8, 'maj7'], [5, '', 9], [8, 'maj7'], [10, '6'], [7, 'sus4'], [7, '']] },
  kinetic: { bpm: 72, fig: 'arp', step: 0.5, vel: 0.22, velEnd: 0.32, bass: 0.34, pad: 0.38, str: [0.2, 0.35], cb: 4, energy: 0.55, prog: [[0, 'm(add9)'], [8, 'add9'], [5, 'm7'], [1, 'maj7#11'], [7, '7sus4'], [7, '7']] },
  warm:    { bpm: 64, fig: 'sparse', density: 0.75, vel: 0.32, bass: 0.38, pad: 0.55, str: [0.35, 0.45], cb: 4, energy: 0.5, prog: [[3, '', 7], [8, 'maj7'], [8, 'm6'], [0, 'm9'], [5, 'm9'], [10, '', 2], [3, 'add9', 7], [8, 'maj9']] },
  cold:    { bpm: 58, fig: 'pulse', vel: 0.22, bass: 0, pad: 0, str: [0.3, 0.3], cb: 4, energy: 0.55, pedal: 5, prog: [[6, 'maj7', 5], [1, 'maj7', 5], [10, 'm(maj7)', 5], [6, 'maj7#11', 5]] },
  build:   { bpm: 66, fig: 'arp', step: 0.5, vel: 0.28, velEnd: 0.42, bass: 0.40, pad: 0.55, str: [0.5, 0.66], cb: 2, energy: 0.65, prog: [[8, 'maj9'], [0, 'm7'], [0, 'm7', 10], [8, 'maj7'], [5, 'm9']] },
  glow:    { bpm: 64, fig: 'sparse', density: 0.6, vel: 0.28, bass: 0.34, pad: 0.5, str: [0.35, 0.3], cb: 4, energy: 0.6, prog: [[3, 'add9'], [8, 'maj7'], [0, 'm7'], [10, '6']] },
  bloom:   { bpm: 64, energy: 0.8 },
  coda:    { bpm: 70.6, fig: 'arp', step: 0.5, vel: 0.27, velEnd: 0.22, bass: 0.34, pad: 0.62, str: [0.6, 0.5], cb: 2, energy: 0.4, prog: [[3, 'add9'], [8, '', 3], [0, 'm7'], [8, 'maj7']] },
};
MOODS.calm = MOODS.intro; MOODS.night = MOODS.intro; MOODS.tension = MOODS.cold; MOODS.payoff = MOODS.bloom; MOODS.triumph = MOODS.build; MOODS.gratitude = MOODS.warm;

// nearest word onset to `want` inside [lo, hi], preferring phrase starts (gap >= 0.25 s before it)
function snapOnset(words, want, lo, hi) {
  const c = words.filter((w, i) => w[0] >= lo && w[0] <= hi).map(w => [w[0], words.indexOf(w)]);
  if (!c.length) return null;
  const score = ([t, i]) => Math.abs(t - want) - (i > 0 && t - words[i - 1][1] >= 0.25 ? 3 : 0);
  return c.sort((a, b) => score(a) - score(b))[0][0];
}
function splitLong(words, sec, maxS) {
  if (sec.t1 - sec.t0 <= maxS) return [sec];
  const mid = (sec.t0 + sec.t1) / 2, cand = sentenceStarts(words, 0.35).filter(t => t > sec.t0 + 12 && t < sec.t1 - 12);
  const t = cand.length ? cand.sort((a, b) => Math.abs(a - mid) - Math.abs(b - mid))[0] : mid;
  return [...splitLong(words, { ...sec, t1: t }, maxS), ...splitLong(words, { ...sec, t0: t, kind: 'split', swellIn: false }, maxS)];
}

// ---------------------------------------------------------------- the plan
export function resolvePlan(P) {
  const { cfg, words, film } = P, S = cfg.score, K = parseKey(S.key), A = s => anchor(words, s);
  const s1 = words.length ? words.at(-1)[1] : 0, chaps = chapters(P);
  const stops = (S.stops || []).map(s => Array.isArray(s) ? [A(s[0]), A(s[1])] : [A(s.t0), A(s.t1)]).filter(([a, b]) => b > a);
  let payoff = findPayoff(P);
  let sections;
  if (S.sections && S.sections.length) {                                              // PLAN mode
    sections = S.sections.map((s, i) => ({ ...s, t0: A(s.t0) ?? 0, t1: s.t1 != null ? A(s.t1) : null, kind: s.kind || (i ? 'plan' : 'start') }));
    sections.forEach((s, i) => { if (s.t1 == null) s.t1 = i + 1 < sections.length ? sections[i + 1].t0 : film; s.mood = s.mood || 'intro'; s.swellIn = s.cue === 'swell'; });
    const bl = sections.find(s => s.cue === 'bloom' || s.mood === 'bloom'); if (bl && (S.payoff == null || S.payoff === 'auto')) payoff = bl.t0;
  } else {                                                                            // AUTO mode
    const pay = payoff ?? film, B = [{ t: 0, kind: 'start' }];
    for (const c of chaps) if (c.t >= 4 && c.t <= pay - 4 && c.t - B.at(-1).t >= 4) B.push({ t: c.t, kind: 'chapter', word: c.word, swellIn: true });
    if (payoff != null) {
      const bt = snapOnset(words, payoff - S.build_s, payoff - S.build_s * 1.6, payoff - S.build_s * 0.6);
      if (bt != null && bt - B.at(-1).t >= 4 && payoff - bt >= 4) B.push({ t: bt, kind: 'build' }); else if (payoff - B.at(-1).t <= 18 && B.length > 1) B.at(-1).asBuild = true;
      B.push({ t: payoff, kind: 'payoff', swellIn: true });
    }
    const tail = Math.max(s1 + 0.25, payoff != null ? payoff + 1.9 : 0);
    if (words.length && film - tail >= S.coda_min_s) B.push({ t: +tail.toFixed(3), kind: 'coda' });
    const story = B.filter(b => b.kind === 'start' || b.kind === 'chapter'), spanEnd = B.find(b => b.kind === 'build' || b.kind === 'payoff')?.t ?? film;
    story.forEach((b, i) => {
      const x = story.length > 1 ? (b.t - story[1].t) / Math.max(1, spanEnd - story[1].t) : 0;
      b.mood = S.moods?.[i] || (b.asBuild ? 'build' : i === 0 ? 'intro' : x < 0.4 ? 'wonder' : x < 0.7 ? 'kinetic' : 'warm');
    });
    B.forEach(b => { if (!b.mood) b.mood = { build: 'build', payoff: 'bloom', coda: 'coda' }[b.kind]; });
    sections = [];
    B.forEach((b, i) => { const t1 = i + 1 < B.length ? B[i + 1].t : film; if (t1 - b.t > 0.05) sections.push(...splitLong(words, { ...b, t0: b.t, t1, parent: i }, S.max_section_s)); });
  }
  sections.forEach((s, i) => { s.t0 = +s.t0.toFixed(3); s.t1 = +s.t1.toFixed(3); s.next = sections[i + 1]; s.parent = s.parent ?? i; });
  const bounds = sections.map(s => s.t0).concat(payoff ?? []);
  // breaths: speech gaps where the piano rests and a glass cell plays in octave 7
  let breaths = [];
  if (S.breaths === 'auto') {
    const gaps = [];
    for (let i = 1; i < words.length; i++) { const a = words[i - 1][1], b = words[i][0]; if (b - a >= S.breath_min_gap_s && a > 2 && !bounds.some(t => t > a - 1.5 && t < b + 1.5) && !stops.some(([x, y]) => x < b && y > a)) gaps.push([a, b]); }
    gaps.sort((x, y) => (y[1] - y[0]) - (x[1] - x[0]));
    for (const g of gaps) if (breaths.length < Math.floor(film / 25) + 1 && breaths.every(h => Math.abs(h[0] - g[0]) >= S.breath_spacing_s)) breaths.push(g);
    breaths.sort((a, b) => a[0] - b[0]);
  } else if (Array.isArray(S.breaths)) breaths = S.breaths.map(s => Array.isArray(s) ? [A(s[0]), A(s[1])] : [A(s.t0), A(s.t1)]);
  // motif statements (rising major sixth landing ON the word): configured words + the payoff word
  const mt = [];
  for (const w of S.motif_words || []) {
    if (typeof w === 'number' || /[#@~]/.test(w)) { mt.push(A(w)); continue; }
    const toks = String(w).split(/\s+/).map(norm);
    words.forEach((x, i) => { if (toks.every((t, j) => words[i + j] && norm(words[i + j][2]).startsWith(t))) mt.push(x[0]); });
  }
  let motifs = [];
  for (const t of mt.sort((a, b) => a - b)) if (t > 1.5 && (payoff == null || t < payoff - S.motif_min_gap_s) && motifs.every(u => t - u >= S.motif_min_gap_s)) motifs.push(t);
  motifs = motifs.slice(0, Math.max(0, S.motif_max - 1)); if (payoff != null) motifs.push(payoff);
  const coda = sections.find(s => s.mood === 'coda');
  return { key: K, film, payoff, sections, chapters: chaps, stops, breaths, motifs, coda: coda ? { t0: coda.t0, t1: coda.t1 } : null };
}

// ================================================================ render (only when run as a script)
function render(P, PL, outPath, printCues) {
  const { words, film, cfg } = P, S = cfg.score, K = PL.key, N = Math.round(SR * film), G = S.gain;
  let seed = S.seed >>> 0 || 1; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647, nz = () => rnd() * 2 - 1;
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12), clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const LOG = [], TEMPO = [], cue = (t, what) => LOG.push([+t.toFixed(2), what]);
  const DL = new Float32Array(N), DR = new Float32Array(N), WL = new Float32Array(N), WR = new Float32Array(N), PM = new Float32Array(N);
  const put = (i, v, pan, send) => { if (i < 0 || i >= N) return; const l = v * (pan > 0 ? 1 - pan : 1), r = v * (pan < 0 ? 1 + pan : 1); DL[i] += l; DR[i] += r; WL[i] += l * send; WR[i] += r * send; };
  const put2 = (i, l, r, send) => { if (i < 0 || i >= N) return; DL[i] += l; DR[i] += r; WL[i] += l * send; WR[i] += r * send; };
  function envArr(len, pts) { const e = new Float32Array(len); let j = 0;
    for (let k = 0; k < len; k++) { const x = k / SR; while (j < pts.length - 2 && x > pts[j + 1][0]) j++;
      const [x0, a0] = pts[j], [x1, a1] = pts[Math.min(j + 1, pts.length - 1)], u = x1 > x0 ? clamp((x - x0) / (x1 - x0), 0, 1) : 1; e[k] = a0 + (a1 - a0) * (0.5 - 0.5 * Math.cos(Math.PI * u)); }
    return e; }
  const blep = (ph, dt) => ph < dt ? (ph /= dt, ph + ph - ph * ph - 1) : ph > 1 - dt ? (ph = (ph - 1) / dt, ph * ph + ph + ph + 1) : 0;
  const inSp = (a, b) => inSpeech(words, a, b);

  // ---------- instruments (v4 palette) ----------
  function piano(t, m, vel, dur = 2.5, pan) {
    const f = mtof(m), i0 = Math.round(t * SR); if (pan === undefined) pan = clamp((m - 62) / 40, -0.45, 0.45);
    const T60 = clamp(16 * Math.pow(2, -(m - 33) / 13), 1.0, 16); let len = Math.round(Math.min(T60 * 0.8, dur + 1.0) * SR); if (i0 + len > N) len = N - i0; if (len <= 0 || i0 < 0) return;
    const bright = 0.2 + 0.6 * vel, Bc = 1.5e-4 * Math.pow(2, (m - 48) / 18), att = (0.003 + 0.009 * (1 - vel)) * SR, buf = new Float32Array(len);
    for (let h = 1; h <= 10; h++) {
      const fh = f * h * Math.sqrt(1 + Bc * h * h); if (fh > 12000) break;
      const a = Math.pow(h, -1.25) * Math.exp(-(h - 1) * (1.15 - bright)), T = T60 / (1 + 0.45 * (h - 1)), ph = rnd() * 6.2832;
      const w = 2 * Math.PI * fh / SR, c = Math.cos(w), s = Math.sin(w), d1 = Math.pow(10, -3 / (T * 0.22 * SR)), d2 = Math.pow(10, -3 / (T * SR));
      let x = Math.cos(ph), y = Math.sin(ph), e1 = 0.62 * a, e2 = 0.38 * a;
      for (let k = 0; k < len; k++) { const nx = x * c - y * s; y = x * s + y * c; x = nx; buf[k] += y * (e1 + e2); e1 *= d1; e2 *= d2; }
    }
    let l1 = 0, l2 = 0; const hc = 1 - Math.exp(-2 * Math.PI * (220 + 1100 * vel) / SR), hn = Math.min(len, Math.round(0.04 * SR));
    for (let k = 0; k < hn; k++) { l1 += hc * (nz() - l1); l2 += hc * (l1 - l2); buf[k] += l2 * 0.9 * vel * Math.exp(-k / (0.011 * SR)); }
    const dI = Math.round(dur * SR), dd = Math.exp(-1 / ((m < 48 ? 0.26 : 0.16) * SR)), g = G.piano * Math.pow(vel, 1.5); let dmp = 1;
    for (let k = 0; k < len; k++) { const a = k < att ? 0.5 - 0.5 * Math.cos(Math.PI * k / att) : 1; if (k > dI) dmp *= dd; const v = buf[k] * a * dmp * g; put(i0 + k, v, pan, 0.3); PM[i0 + k] += v; }
  }
  const rollChord = (t, ms, vel, dur = 2.5, gap = 0.03) => ms.forEach((m, i) => piano(t + i * gap, m, vel * (i ? 0.85 : 1), dur - i * gap));
  function pad(t, dur, ms, lvl, { att = 1.2, rel = 1.4, lp = 950, send = 0.55 } = {}) {
    const i0 = Math.round(t * SR); let len = Math.round((dur + rel) * SR); if (i0 + len > N) len = N - i0; if (len <= 0 || i0 < 0) return;
    const L = new Float32Array(len), R = new Float32Array(len), H = [1, 0.3, 0.14, 0.06], g0 = 1 / Math.sqrt(ms.length);
    for (const m of ms) for (const [dc, pp] of [[-6, -0.6], [0, 0], [5.5, 0.6]]) { const fv = mtof(m) * Math.pow(2, dc / 1200);
      for (let h = 0; h < 4; h++) { const fh = fv * (h + 1); if (fh > 3500) break;
        const w = 2 * Math.PI * fh / SR, c = Math.cos(w), s = Math.sin(w), ph = rnd() * 6.2832, a = H[h] * g0, gl = a * (pp > 0 ? 1 - pp : 1), gr = a * (pp < 0 ? 1 + pp : 1); let x = Math.cos(ph), y = Math.sin(ph);
        for (let k = 0; k < len; k++) { const nx = x * c - y * s; y = x * s + y * c; x = nx; L[k] += y * gl; R[k] += y * gr; } } }
    const e = envArr(len, [[0, 0], [att, 1], [dur, 1], [dur + rel, 0]]), cf = 1 - Math.exp(-2 * Math.PI * lp / SR); let a1 = 0, a2 = 0, b1 = 0, b2 = 0;
    for (let k = 0; k < len; k++) { a1 += cf * (L[k] - a1); a2 += cf * (a1 - a2); b1 += cf * (R[k] - b1); b2 += cf * (b1 - b2);
      const a = e[k] * lvl * G.pad * (1 + 0.08 * Math.sin(2 * Math.PI * 0.11 * (t + k / SR))); put2(i0 + k, a2 * a, b2 * a, send); }
  }
  const DET = [-10, -6, -2.5, 2, 6, 10.5];
  function strings(t, ms, pts, { lp, send = 0.5, vib = 1, width = 0.75, gain = G.strings } = {}) {
    const i0 = Math.round(t * SR); let len = Math.round(pts[pts.length - 1][0] * SR); if (i0 + len > N) len = N - i0; if (len <= 0 || i0 < 0) return;
    const e = envArr(len, pts), pk = Math.max(...pts.map(p => p[1])) || 1, g = gain / Math.sqrt(ms.length), VL = new Float32Array(len), VR = new Float32Array(len);
    for (const m of ms) { const f = mtof(m); VL.fill(0); VR.fill(0);
      DET.forEach((dc, vi) => { const p = (vi / (DET.length - 1) * 2 - 1) * width, gl = p > 0 ? 1 - p : 1, gr = p < 0 ? 1 + p : 1;
        let ph = rnd(), dt = 0; const vr = 4.6 + rnd(), vp = rnd() * 6.2832, dr = 0.08 + rnd() * 0.17, dp = rnd() * 6.2832;
        for (let k = 0; k < len; k++) { if ((k & 15) === 0) { const x = k / SR, cents = dc + vib * Math.min(1, x / 0.9) * 5.5 * Math.sin(6.2832 * vr * x + vp) + 1.8 * Math.sin(6.2832 * dr * x + dp); dt = f * (1 + cents * 0.000577623) / SR; }
          ph += dt; if (ph >= 1) ph -= 1; const s = 2 * ph - 1 - blep(ph, dt); VL[k] += s * gl; VR[k] += s * gr; } });
      const fc0 = lp ?? clamp(380 + 2.0 * f, 380, 1700), cf = 1 - Math.exp(-2 * Math.PI * fc0 * 1.4 / SR); let la = 0, ba = 0, lb = 0, bb = 0, F = 0, o1 = 0, o2 = 0;
      for (let k = 0; k < len; k++) { if ((k & 15) === 0) F = 2 * Math.sin(Math.PI * fc0 * (0.5 + 0.6 * e[k] / pk) / SR);
        let h = VL[k] - la - ba; ba += F * h; la += F * ba; h = VR[k] - lb - bb; bb += F * h; lb += F * bb; o1 += cf * (la - o1); o2 += cf * (lb - o2); const a = e[k] * g; put2(i0 + k, o1 * a, o2 * a, send); } }
  }
  const sc = (ta, tb, ms, a0, a1, fi = 0.8, fo = 1.0, o = {}) => { if (tb - ta > 0.05 && (a0 > 0 || a1 > 0)) strings(ta - fi / 2, ms, [[0, 0], [fi, a0], [tb - ta + fi / 2, a1], [tb - ta + fi / 2 + fo, 0]], o); };
  function brass(t, ms, pts, { lp = 850, send = 0.45, pan = -0.12 } = {}) {
    const i0 = Math.round(t * SR); let len = Math.round(pts[pts.length - 1][0] * SR); if (i0 + len > N) len = N - i0; if (len <= 0 || i0 < 0) return;
    const e = envArr(len, pts), pk = Math.max(...pts.map(p => p[1])) || 1, V = new Float32Array(len), g = G.brass / Math.sqrt(ms.length);
    for (const m of ms) { const f = mtof(m); V.fill(0);
      for (const dc of [-5, 0, 4.5]) { let ph = rnd(); for (let k = 0; k < len; k++) { const x = k / SR, sq = x < 0.09 ? -22 * (1 - x / 0.09) : 0, dt = f * (1 + (dc + sq) * 0.000577623) / SR; ph += dt; if (ph >= 1) ph -= 1; V[k] += 2 * ph - 1 - blep(ph, dt); } }
      let lo = 0, bd = 0, F = 0; for (let k = 0; k < len; k++) { if ((k & 15) === 0) F = 2 * Math.sin(Math.PI * (160 + lp * Math.pow(e[k] / pk, 1.3)) / SR); const hp = V[k] - lo - 0.6 * bd; bd += F * hp; lo += F * bd; put(i0 + k, lo * e[k] * g, pan, send); } }
  }
  function glass(t, m, vel, pan = 0) {
    const f = mtof(m), i0 = Math.round(t * SR), T = f > 4000 ? 1.0 : 2.0; let len = Math.round(T * 1.2 * SR); if (i0 + len > N) len = N - i0; if (len <= 0 || i0 < 0) return;
    const buf = new Float32Array(len);
    for (const [r, a, TT] of [[1, 1, T], [1.0007, 0.45, T * 1.25], [2, 0.08, T * 0.35], [4.2, 0.03, T * 0.15]]) { const fh = f * r; if (fh > 19000) continue;
      const w = 2 * Math.PI * fh / SR, c = Math.cos(w), s = Math.sin(w), d = Math.pow(10, -3 / (TT * SR)); let x = 1, y = 0, e = a;
      for (let k = 0; k < len; k++) { const nx = x * c - y * s; y = x * s + y * c; x = nx; buf[k] += y * e; e *= d; } }
    const at = 0.0015 * SR; for (let k = 0; k < len; k++) put(i0 + k, buf[k] * (k < at ? k / at : 1) * G.glass * vel, pan, 0.8);
  }

  // ---------- pitch set (relative major M0 = the payoff key) ----------
  const M0 = K.M0, oct = (pc, o) => 12 * (o + 1) + pc, CELL = [9, 7, 4, 2].map(d => (M0 + d) % 12);   // falling pentatonic cell 6-5-3-2
  const cellNotes = o => CELL.map(pc => Math.min(oct(pc, o), 117));
  function rainCell(t0, vel, gap, why, pan = 0.3) {
    const times = [0, 1, 2, 3].map(i => t0 + i * gap), o = inSp(times[0] - 0.05, times[3] + 0.3) ? 8 : 7;
    cellNotes(o).forEach((m, i) => glass(times[i], m, vel * (o === 8 ? 0.75 : 1) * (1 - 0.07 * i), pan - 0.15 * i)); cue(t0, `glass cell octave ${o} ${why}`);
  }
  const motifPair = () => { let e = oct((M0 + 4) % 12, 5); if (e > 79) e -= 12; if (e < 72) e += 12; return [e - 9, e]; };   // rising major sixth 5 -> 3
  function motif(tE, vel, str, dur, why) { const [g, e] = motifPair(), tG = tE - 0.94;
    piano(tG, g, vel * 0.85, tE - tG + 0.15); piano(tE, e, vel, dur);
    if (str) { sc(tG, tE, [g], str * 0.6, str * 0.75, 0.25, 0.3); sc(tE, tE + dur, [e], str, str * 0.7, 0.2, 0.9); }
    cue(tE, `motif ${NAMES[g % 12]}->${NAMES[e % 12]} ${why}`); }

  // ---------- global mute windows for piano figures ----------
  const MUTE = [...PL.breaths.map(([a, b]) => [a - 0.05, b]), ...PL.stops.map(([a, b]) => [a - 0.4, b + 0.1])];
  if (PL.payoff != null) MUTE.push([PL.payoff - 0.95, PL.payoff + 0.4]);
  PL.motifs.forEach(t => MUTE.push([t - 1.0, t + 0.5]));
  PL.sections.forEach((s, i) => { if (!s.swellIn || s.kind === 'payoff') return;    // a breath before each downbeat that resolves a swell
    const pf = (PL.sections[i - 1] && (PL.sections[i - 1].fig || (MOODS[PL.sections[i - 1].mood] || {}).fig)) || 'sparse';
    MUTE.push([s.t0 - (pf === 'arp' || pf === 'circle' ? 1.0 : 0.55), s.t0 + 0.35]); });
  const muted = t => MUTE.some(([a, c]) => t >= a - 0.05 && t < c), atStop = t => PL.stops.some(([a, c]) => t >= a - 0.4 && t < c + 0.1);

  function figure(o, g, k0, k1, B, U, b, t0, t1) {
    const top = o.top ?? 79, vel = t => o.vel + ((o.velEnd ?? o.vel) - o.vel) * (t - t0) / Math.max(0.01, t1 - t0);
    if (o.fig === 'sparse') {
      for (let k = k0; k < k1; k++) for (const sub of [0, 0.5]) { const p = (sub ? 0.18 : k === k0 ? 0.9 : 0.5) * o.density, t = g(k + sub); if (rnd() >= p || muted(t)) continue;
        let m = U[Math.floor(rnd() * U.length)]; if (rnd() < 0.3 && m + 12 <= top) m += 12;
        piano(t + (rnd() - 0.5) * 0.02, m, vel(t) * (0.8 + 0.3 * rnd()), Math.min(b * 1.8, g(k1) - t + 0.12)); }
      return; }
    if (o.fig !== 'arp' && o.fig !== 'circle') return;
    const base = [...new Set([B + 12, ...U])].sort((a, c) => a - c), ext = [...base];
    for (const m of base.slice(1, 3)) if (m + 12 <= top) ext.push(m + 12);
    const seq = o.fig === 'circle' ? [...ext, ...ext.slice(1, -1).reverse()] : ext; let i = 0;
    for (let x = k0; x < k1 - 1e-6;) { const t = g(x);
      if (!muted(t)) piano(t + (rnd() - 0.5) * 0.016, seq[i % seq.length], vel(t) * (Math.abs(x - Math.round(x)) < 1e-6 ? 1 : 0.8), Math.min(b * 1.5, g(k1) - t + 0.12));
      i++; x += o.step ?? 0.5; }
  }

  // ---------- sections ----------
  const progIdx = {};
  const chordFor = (sec, M, i) => sec.chords?.length ? parseChord(sec.chords[i % sec.chords.length]) : relChord(K, M.prog[i % M.prog.length]);
  for (const sec of PL.sections) {
    const M = MOODS[sec.mood] || MOODS.intro, o = { ...M, ...sec, str: sec.strings ?? M.str }, t0 = sec.t0, t1 = sec.t1, len = t1 - t0;
    if (len < 0.05) continue;
    if (sec.mood === 'bloom' || sec.mood === 'payoff') { renderBloom(sec, o); continue; }
    if (sec.mood === 'coda') { renderCoda(sec, o); continue; }
    const beats = Math.max(1, Math.round(len * o.bpm / 60)), b = len / beats, g = k => t0 + k * b;
    TEMPO.push({ section: sec.kind, mood: sec.mood, t0, t1, beats, bpm: +(60 / b).toFixed(1) });
    const cb = o.chord_beats ?? (sec.chords?.length ? Math.max(1, Math.min(M.cb ?? 4, Math.floor(beats / sec.chords.length))) : o.cb ?? 4), slots = [];   // listed chords all get played for (let k = 0; k < beats; k += cb) slots.push([k, Math.min(beats, k + cb)]);
    if (slots.length > 1 && slots.at(-1)[1] - slots.at(-1)[0] < cb / 2) { slots.at(-2)[1] = slots.at(-1)[1]; slots.pop(); }
    let pi = progIdx[sec.parent] ?? 0; const chords = slots.map(() => chordFor(sec, M, pi++)); progIdx[sec.parent] = pi;
    const nextSwell = sec.next && sec.next.swellIn;
    if (!sec.chords?.length) {
      if (sec.mood === 'build' || (nextSwell && sec.next.kind === 'payoff')) { const n = chords.length;   // dominant of the payoff key
        if (n >= 2) chords[n - 2] = relChord(K, [10, '7sus4']); chords[n - 1] = relChord(K, [10, n >= 2 ? '7' : '7sus4']); }
      else if (nextSwell && sec.mood !== 'cold') chords[chords.length - 1] = relChord(K, [7, '7sus4']);
    }
    const isStop = sec.cue === 'stop', hold = sec.cue === 'hold' || sec.cue === 'breath';
    if (isStop) { cue(t0, `stop: silence ${t0}-${t1}`); continue; }
    if (sec.mood === 'cold' || sec.mood === 'tension') {               // pedal + brass colour, no thirds in the strings
      const ped = 36 + ((K.m0 + (o.pedal ?? 5)) % 12); strings(t0 - 0.2, [ped, ped + 7], [[0, 0], [1.5, o.str[0]], [len, o.str[1]], [len + 1.4, 0]], { vib: 0, lp: 420 });
      for (let k = 0; k < beats; k += 2) if (!muted(g(k))) piano(g(k), ped, o.vel, 2.0);
      slots.forEach(([k0, k1], i) => { const { U } = voicing(chords[i]), d = g(k1) - g(k0); brass(g(k0) - 0.05, U.slice(0, 3), [[0, 0], [Math.min(0.5, d * 0.2), 0.35], [d * 0.75, 0.25], [d + 0.4, 0]]); });
      sec.chordList = slots.map(([k0], i) => [+g(k0).toFixed(2), chords[i].sym]); cue(t0, `cold: pedal ${NAMES[ped % 12]} + brass`); continue;
    }
    slots.forEach(([k0, k1], i) => {
      const ch = chords[i], { B, U } = voicing(ch), ta = g(k0), tb = g(k1), x0 = (ta - t0) / len, x1 = (tb - t0) / len;
      if (o.bass && !atStop(ta)) piano(ta, B, o.bass, tb - ta + 0.4);
      if (o.pad) pad(ta - 0.3, tb - ta + 0.3, [B, ...U], o.pad, { att: 0.9, rel: 1.0 });
      const a0 = o.str[0] + (o.str[1] - o.str[0]) * x0; let a1 = o.str[0] + (o.str[1] - o.str[0]) * x1;
      const last = i === slots.length - 1, sw = last && nextSwell;                   // the last chord before a chapter/payoff swells from low
      sc(ta, tb, U.slice(-3), sw ? Math.min(a0, 0.12) : a0, sw ? Math.max(a1, 0.55) : a1, 0.8, sw ? 0.35 : 1.0);
      if (!hold) figure(o, g, k0, k1, B, U, b, t0, t1);
      ch.at = +ta.toFixed(2);
    });
    sec.chordList = chords.map(c => [c.at, c.sym]);
    if (sec.swellIn && sec.kind !== 'payoff') { const { B, U } = voicing(chords[0]); piano(t0, B - 12, 0.36, 3); rollChord(t0, [B, ...U, U[U.length - 1] + 12], 0.4, 3); cue(t0, `${sec.kind} ${sec.word ? '"' + sec.word + '" ' : ''}swell resolves: ${chords[0].sym} rolled`); }
  }
  function renderBloom(sec, o) {             // the payoff: root-position major, motif lands on the word, glass sparkle
    const P0 = sec.t0, len = sec.t1 - P0, C1 = oct(M0, 1), c2 = C1 + 12;
    const hold = Math.min(len, 3.2);
    piano(P0, C1, 0.36, 3.5); rollChord(P0, [c2, c2 + 7, c2 + 12, c2 + 16, c2 + 19, c2 + 24, c2 + 28, c2 + 31], 0.22, hold);
    const held = Math.min(Math.max(2.2, len - 0.3), 6);                       // the chord holds through a short post-payoff line, into the coda
    pad(P0, held, [c2, c2 + 7, c2 + 16, c2 + 19, c2 + 24, c2 + 28], 0.55, { att: 0.75, rel: 1.6 });
    rollChord(P0 + 0.34, [c2 + 12, c2 + 19, c2 + 24, c2 + 28, c2 + 31, c2 + 36], 0.34, hold - 0.2);
    sc(P0, P0 + Math.max(1.92, held - 0.3), [c2 + 12, c2 + 19, c2 + 24, c2 + 28, c2 + 31], 0.45, 0.72, 0.5, 1.4);
    [0, 4, 7].forEach((d, i) => glass(P0 + [0, 0.12, 0.25][i], Math.min(oct((M0 + d) % 12, 8), 117), 0.3, 0.3 - 0.3 * i));
    cue(P0, `PAYOFF bloom: ${NAMES[M0]} major root position + glass sparkle`); TEMPO.push({ section: 'payoff', mood: 'bloom', t0: P0, t1: sec.t1, beats: 'held' });
    sec.chordList = [[+P0.toFixed(2), NAMES[M0]]];
    if (len > 6.5) {                          // speech goes on long after the payoff: a glowing major bed until the coda / end
      const t0 = P0 + 5.0, beats = Math.max(1, Math.round((sec.t1 - t0) * 64 / 60)), b = (sec.t1 - t0) / beats, g = k => t0 + k * b, M = MOODS.glow; let ci = 0;
      for (let k = 0; k < beats; k += 4) { const ch = relChord(K, M.prog[ci++ % M.prog.length]), { B, U } = voicing(ch), k1 = Math.min(beats, k + 4);
        pad(g(k) - 0.3, g(k1) - g(k) + 0.3, [B, ...U], 0.45, { att: 0.9, rel: 1.0 }); sc(g(k), g(k1), U.slice(-3), 0.35, 0.3); figure({ ...M }, g, k, k1, B, U, b, t0, sec.t1); sec.chordList.push([+g(k).toFixed(2), ch.sym]); }
    }
  }
  function renderCoda(sec, o) {              // one beat per line, glass cell completes onto the tonic, minor-plagal amen, ring, silence
    const t0 = sec.t0, t1 = sec.t1, len = t1 - t0, c2 = oct(M0, 2);
    const ringT = len >= 5.5 ? t1 - 2.65 : t0; sec.chordList = [];
    if (ringT > t0) {
      const nb = Math.max(2, Math.round((ringT - t0) / 0.85)), b = (ringT - t0) / nb, g = k => t0 + k * b, M = MOODS.coda;
      TEMPO.push({ section: 'coda', mood: 'coda', t0, t1: ringT, beats: nb, bpm: +(60 / b).toFixed(1) }); let ci = 0;
      for (let k = 0; k < nb - 1; k += 2) { const k1 = Math.min(nb - 1, k + 2), ch = relChord(K, M.prog[ci++ % M.prog.length]), { B, U } = voicing(ch);
        piano(g(k), B, 0.34, g(k1) - g(k) + 0.4); pad(g(k) - 0.3, g(k1) - g(k) + 0.3, [B, ...U], M.pad, { att: 0.9, rel: 1.0 });
        sc(g(k), g(k1), U.slice(-3), 0.6 - 0.1 * k / nb, 0.55 - 0.1 * k1 / nb, 0.6, 1.0); figure({ ...M, top: 84 }, g, k, k1, B, U, b, t0, ringT); sec.chordList.push([+g(k).toFixed(2), ch.sym]); }
      const iv = relChord(K, [8, 'm6']), { B: ivB, U: ivU } = voicing(iv), tA = g(nb - 1);          // minor plagal "amen" on the last beat
      piano(tA, ivB, 0.34, b + 0.05); pad(tA - 0.3, b + 0.3, [ivB, ...ivU], 0.62, { att: 0.6, rel: 0.35 }); ivU.forEach((m, i) => piano(tA + i * b / 4, m, 0.24, b - i * b / 4));
      sec.chordList.push([+tA.toFixed(2), iv.sym]);
      const pat = [...cellNotes(7)]; const lines = []; for (let k = 1; k < nb; k++) lines.push(pat[(k - 1) % 4]);
      if (lines.length >= 3) { lines[lines.length - 3] = oct((M0 + 4) % 12, 7); lines[lines.length - 2] = oct((M0 + 2) % 12, 7); }
      lines.push(oct(M0, 7)); lines.forEach((m, i) => glass(g(i + 1), Math.min(m, 117), 0.6, i % 2 ? -0.3 : 0.3));
      cue(t0, `coda: ${nb} beats of ${b.toFixed(3)} s, one glass note per beat (lines at ${t0.toFixed(2)} + k*${b.toFixed(3)}), cell lands on ${NAMES[M0]}`);
      PL.coda.grid = { t0, beat: +b.toFixed(4), beats: nb, ring: +ringT.toFixed(3) };
    }
    piano(ringT, oct(M0, 1), 0.42, 2.6); rollChord(ringT, [c2, c2 + 7, c2 + 16, c2 + 19, c2 + 24, c2 + 26, c2 + 28, c2 + 31], 0.45, 2.6, 0.06);
    pad(ringT, 1.45, [c2, c2 + 7, c2 + 16, c2 + 19, c2 + 24, c2 + 28], 0.62, { att: 0.25, rel: 1.3 }); sc(ringT, ringT + 1.35, [c2 + 12, c2 + 19, c2 + 28, c2 + 31], 0.58, 0.4, 0.4, 1.1);
    glass(ringT + 1.28, Math.min(oct((M0 + 7) % 12, 7), 117), 0.3, 0.4); cue(ringT, `final ringing ${NAMES[M0]}(add9)`); sec.chordList.push([+ringT.toFixed(2), NAMES[M0] + '(add9)']);
  }

  // ---------- point cues: opener glass, breaths, motifs, plan events ----------
  const op = cfg.sfx && cfg.sfx.opener; if (op && typeof op.t === 'number') { glass(op.t, Math.min(oct((M0 + 2) % 12, 7), 117), 0.32, 0.2); cue(op.t, 'glass: the opener lands (the cell\'s last note, alone)'); }
  for (const [a, b] of PL.breaths) { const gap = Math.min(0.25, (b - a - 0.4) / 4); if (gap > 0.12) rainCell(a + 0.15, 0.5, gap, `in the breath ${a.toFixed(2)}-${b.toFixed(2)}`); }
  PL.motifs.forEach((t, i) => { const x = t / film, last = i === PL.motifs.length - 1; motif(t, 0.38 + 0.12 * x, x > 0.45 || last ? 0.42 + 0.3 * x : 0, last ? 3.0 : 3.2, last ? 'on the PAYOFF word' : `#${i + 1}`); });
  for (const ev of cfg.score.events || []) {
    const t = anchor(words, ev.t);
    if (ev.type === 'motif') motif(t, ev.vel ?? 0.45, ev.strings ?? 0.5, ev.dur ?? 3, 'event');
    else if (ev.type === 'glass' || ev.type === 'cell') rainCell(t, ev.vel ?? 0.5, ev.gap ?? 0.22, 'event');
    else if (ev.type === 'note') piano(t, typeof ev.note === 'string' ? noteNum(ev.note) : ev.note, ev.vel ?? 0.35, ev.dur ?? 2);
    else if (ev.type === 'roll') { const { B, U } = voicing(parseChord(ev.chord)); rollChord(t, [B, ...U], ev.vel ?? 0.36, ev.dur ?? 3); }
    else if (ev.type === 'swell') { const { U } = voicing(parseChord(ev.chord || NAMES[M0])); sc(t - (ev.dur ?? 3), t, U, 0.05, ev.peak ?? 0.5, 1.0, 0.6); }
    else if (ev.type === 'brass') { const { U } = voicing(parseChord(ev.chord)); brass(t, U, [[0, 0], [0.3, ev.level ?? 0.4], [(ev.dur ?? 2) * 0.7, 0.3], [ev.dur ?? 2, 0]]); }
    cue(t, `event ${ev.type}`);
  }

  // ---------- sympathetic resonance, gates, hall, master ----------
  { const RL = new Float32Array(N), RR = new Float32Array(N);
    for (let m = 36; m <= 84; m++) { const w = 2 * Math.PI * mtof(m) / SR, r = Math.pow(10, -3 / (3.0 * SR)), a1 = 2 * r * Math.cos(w), a2 = r * r, b = 1 - r, p = clamp((m - 60) / 30, -0.6, 0.6), gl = p > 0 ? 1 - p : 1, gr = p < 0 ? 1 + p : 1; let y1 = 0, y2 = 0;
      for (let i = 0; i < N; i++) { const y = b * PM[i] + a1 * y1 - a2 * y2; y2 = y1; y1 = y; RL[i] += y * gl; RR[i] += y * gr; } }
    let ep = 0, er = 0; for (let i = 0; i < N; i++) { ep += PM[i] * PM[i]; er += RL[i] * RL[i] + RR[i] * RR[i]; }
    const g = Math.sqrt(ep / (er / 2 + 1e-20)) * Math.pow(10, S.sympathetic_db / 20); for (let i = 0; i < N; i++) put2(i, RL[i] * g, RR[i] * g, 0.4); }
  const CUTS = PL.stops.concat(PL.sections.filter(s => s.cue === 'stop').map(s => [s.t0, s.t1]));
  for (const [a, b] of CUTS) { const r = Math.round(0.03 * SR), ia = Math.round(a * SR), ib = Math.round(b * SR);
    for (let i = ia; i < ib + r && i < N; i++) { const gg = i < ia + r ? 1 - (i - ia) / r : i < ib ? 0 : (i - ib) / r; DL[i] *= gg; DR[i] *= gg; WL[i] *= gg; WR[i] *= gg; } }
  function freeverb(inL, inR, { fb = 0.925, damp = 0.4, pre = 0.022, resets = [] } = {}) {
    const k = SR / 44100, CT = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617], AT = [556, 441, 341, 225];
    const mk = off => ({ c: CT.map(d => ({ b: new Float32Array(Math.round((d + off) * k)), i: 0, f: 0 })), a: AT.map(d => ({ b: new Float32Array(Math.round((d + off) * k)), i: 0 })) });
    const ch = [mk(0), mk(23)], Pd = Math.round(pre * SR), rs = new Set(resets.map(t => Math.round(t * SR))), oL = new Float32Array(N), oR = new Float32Array(N);
    for (let i = 0; i < N; i++) { if (rs.has(i)) for (const C of ch) { C.c.forEach(x => { x.b.fill(0); x.f = 0; }); C.a.forEach(x => x.b.fill(0)); }
      const j = i - Pd, inp = j >= 0 ? (inL[j] + inR[j]) * 0.015 : 0;
      for (let s = 0; s < 2; s++) { const C = ch[s]; let o = 0;
        for (const cb of C.c) { const y = cb.b[cb.i]; cb.f = y * (1 - damp) + cb.f * damp; cb.b[cb.i] = inp + cb.f * fb; if (++cb.i >= cb.b.length) cb.i = 0; o += y; }
        for (const ap of C.a) { const bo = ap.b[ap.i], y = bo - o; ap.b[ap.i] = o + bo * 0.5; if (++ap.i >= ap.b.length) ap.i = 0; o = y; }
        (s ? oR : oL)[i] = o; } }
    return [oL, oR]; }
  const [RVL, RVR] = freeverb(WL, WR, { resets: CUTS.map(c => c[0] + 0.035) });
  const rms = a => { let s = 0; for (let i = 0; i < N; i++) s += a[i] * a[i]; return Math.sqrt(s / N); };
  const wg = (rms(DL) + rms(DR)) / (rms(RVL) + rms(RVR) + 1e-20) * Math.pow(10, S.reverb_db / 20);
  const Lo = new Float32Array(N), Ro = new Float32Array(N);
  { const hp = Math.exp(-2 * Math.PI * 25 / SR); let xl = 0, yl = 0, xr = 0, yr = 0; const fi = 0.15 * SR, f1 = Math.round((film - 0.15) * SR), f0 = Math.max(0, f1 - Math.round(0.85 * SR));
    for (let i = 0; i < N; i++) { let l = DL[i] + RVL[i] * wg, r = DR[i] + RVR[i] * wg;
      for (const [a, b] of CUTS) { const x = i / SR; if (x > a - 0.03 && x < b + 0.03) { const gg = x < a ? (a - x) / 0.03 : x > b ? (x - b) / 0.03 : 0; l *= gg; r *= gg; } }
      yl = hp * (yl + l - xl); xl = l; yr = hp * (yr + r - xr); xr = r;
      const g = i < fi ? i / fi : i >= f1 ? 0 : i > f0 ? 0.5 + 0.5 * Math.cos(Math.PI * (i - f0) / (f1 - f0)) : 1; Lo[i] = yl * g; Ro[i] = yr * g; } }
  let pk = 0; for (let i = 0; i < N; i++) pk = Math.max(pk, Math.abs(Lo[i]), Math.abs(Ro[i]));
  const sc16 = Math.pow(10, S.peak_dbfs / 20) / (pk || 1) * 32767, buf = Buffer.alloc(44 + N * 4);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write('WAVEfmt ', 8); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
  buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(N * 4, 40);
  for (let i = 0; i < N; i++) { const d = Math.abs(Lo[i] * sc16) < 0.5 && Math.abs(Ro[i] * sc16) < 0.5 ? 0 : rnd() - rnd();       // TPDF dither; silence stays digital zero
    buf.writeInt16LE(clamp(Math.round(Lo[i] * sc16 + d), -32768, 32767), 44 + i * 4); buf.writeInt16LE(clamp(Math.round(Ro[i] * sc16 + d), -32768, 32767), 46 + i * 4); }
  fs.writeFileSync(outPath, buf);
  const plan = { film, key: K.name, home_minor: NAMES[K.m0] + 'm', payoff_major: NAMES[M0], payoff: PL.payoff, chapters: PL.chapters, stops: PL.stops, breaths: PL.breaths, motifs: PL.motifs, coda: PL.coda,
    sections: PL.sections.map(s => ({ t0: s.t0, t1: s.t1, kind: s.kind, mood: s.mood, cue: s.cue, chords: s.chordList })), tempo: TEMPO, cues: LOG.sort((a, b) => a[0] - b[0]) };
  fs.writeFileSync(path.join(P.dir, 'score_plan.json'), JSON.stringify(plan, null, 1));
  if (printCues) console.log(JSON.stringify({ tempo: TEMPO, cues: plan.cues }, null, 1));
  console.log(`${path.basename(outPath)} ${N} samples (${(N / SR).toFixed(3)} s), pre-norm peak ${pk.toFixed(4)}, reverb return ${wg.toFixed(3)}, ${PL.sections.length} sections, payoff ${PL.payoff ?? 'none'}, ${PL.breaths.length} breaths, ${PL.motifs.length} motifs, ${LOG.length} cues -> score_plan.json`);
}

const isMain = process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
if (isMain) {
  const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
  const dir = path.resolve(arg('--dir') || process.cwd()), P = loadProject(dir);
  if (!P.configFound) console.log('note: no audio_config.json in', dir, '- using defaults (AUTO mode, A minor -> C major payoff)');
  const PL = resolvePlan(P);
  if (process.argv.includes('--plan')) {
    console.log(JSON.stringify({ film: P.film, key: PL.key, payoff: PL.payoff, chapters: PL.chapters, stops: PL.stops, breaths: PL.breaths, motifs: PL.motifs, coda: PL.coda,
      sections: PL.sections.map(s => ({ t0: s.t0, t1: s.t1, kind: s.kind, mood: s.mood, cue: s.cue })) }, null, 1));
  } else render(P, PL, path.resolve(dir, arg('--out') || 'music.wav'), process.argv.includes('--cues'));
}
