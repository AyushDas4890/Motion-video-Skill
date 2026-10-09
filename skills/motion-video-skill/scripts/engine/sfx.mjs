// sfx.mjs - sound design driven by beats.json -> sfx.wav (48 kHz stereo float32, exactly film_len s) + sfx_cues.json
//
//   node sfx.mjs                   # from the project's work/ folder (reads audio_config.json, beats.json, caps.json)
//   node sfx.mjs --dir <work> --out sfx.wav --list    (--list prints every cue)
//
// Deterministic: no Math.random; every cue has its own RNG seeded from (type, t, variant), so adding or moving one cue
// never changes how any other cue sounds.
// Cue times `t` are PICTURE times. Every transient is written LEAD (0.05 s = 3 frames at 60 fps) earlier; risers/swells
// PEAK at t-LEAD; beds start fading in just before t. Every cue's `gain` is its own peak in dB re the hero drop (0 dB).
// Where cues come from (all automatic except the last):
//   1. one transition sound per beat cut, chosen by the INCOMING layout (C cut_air, X cut_tick, S cut_thump, F cut_card),
//      4 variants each, never the same variant twice in a row; level = type base + 8*(energy-0.6) (energy curve from the
//      score's sections, or audio_config sfx.energy); -4 dB for S->S / same-scene cuts, -6 dB more inside a word,
//      montage runs (5+ quick same-layout shots, each <= 1.6 s) -8 dB after the first, beats in sfx.soften_ids -8 dB; cold sections: dry, higher thumps;
//      warm sections: whooshes/cards pitched x0.85.
//   2. a HERO (card_chapter, hit, drop, bell, glint) within 80 ms of a cut OWNS it: the cut sound is dropped.
//   3. chapter cards (lay F, scene ~ /chap/): paper card hit + one tick per letter as it settles + a bell (pentatonic of the
//      payoff key, climbing card by card, warm after 45 % of the film).
//   4. opener drop (the 0 dB reference), key-word glints (beats with `key`), stops ("hit"), the payoff (sunrise swell + last
//      drop into the payoff word), coda glints - all positioned from score.mjs's resolved plan, so sound and music agree.
//   5. scene-specific hits: sfx_cues_extra.json (+ audio_config sfx.cues): [{t, type, gain, note, ...}] with t/end as
//      seconds or word anchors ("rain", "rain#2", "thank you~end", "word+0.2"). Types: see SYN below / references/audio_pipeline.md.
import fs from 'fs'; import path from 'path';
import { loadProject, resolvePlan, anchor, inSpeech, deepMerge, MOODS } from './score.mjs';

const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const DIR = path.resolve(arg('--dir') || process.cwd()), P = loadProject(DIR), PL = resolvePlan(P), WORDS = P.words, BEATS = P.beats;
const SDEF = {
  master_db: -9, lead_s: 0.05, reverb_return: 0.6,
  opener: { t: 0.2, type: 'drop', gain: 0, sub: 1, ripple: 1 },
  cut_type: { C: 'cut_air', X: 'cut_tick', S: 'cut_thump', F: 'cut_card' },
  cut_db: { cut_air: -15, cut_tick: -19, cut_thump: -13, cut_card: -14 },
  owners: ['card_chapter', 'hit', 'drop', 'bell', 'glint'], own_window_s: 0.08,
  energy: 'auto', peak: null, soften_ids: [], same_scene_db: -4, mid_word_db: -6, montage: { max_gap_s: 1.6, min_run: 5, db: -8 }, overrides: {},
  chapter: { card_gain: -8, letter_gain: -27, bell_gain: -15, stagger: 1 / 30, land: 0.12 },
  key_words: { type: 'glint', tone: 'silver', gain: -20, min_gap_s: 8 },
  payoff: { swell_gain: -7, swell_dur: 2.7, drop_gain: -4 },
  stops: { tone: 'why', gain: -5 },
  coda: { glint_gain: -19, end_glint_gain: -22 },
  extra: 'sfx_cues_extra.json', cues: [],
};
const CF = deepMerge(SDEF, P.cfg.sfx || {});
const SR = 48000, DUR = P.film, N = Math.round(SR * DUR), LEAD = CF.lead_s;

// ---------- deterministic randomness ----------
const mulberry = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const hashStr = s => { let h = 2166136261; for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };
let R = mulberry(1); const nz = () => R() * 2 - 1;
const db = x => Math.pow(10, x / 20), mtof = m => 440 * Math.pow(2, (m - 69) / 12), S = t => Math.round(t * SR);
const pw = (Pt, t) => { if (t <= Pt[0][0]) return Pt[0][1]; for (let i = 1; i < Pt.length; i++) if (t <= Pt[i][0]) { const [a, x] = Pt[i - 1], [b, y] = Pt[i]; return b > a ? x + (y - x) * (t - a) / (b - a) : y; } return Pt[Pt.length - 1][1]; };

// ---------- buses: DRY + reverb SEND ----------
const DRY = [new Float32Array(N), new Float32Array(N)], SND = [new Float32Array(N), new Float32Array(N)];
let SENDAMT = 0, PK = 0;
function put(i, v, pan = 0) { if (i < 0 || i >= N) return; const l = v * (1 - Math.max(0, pan)), r = v * (1 + Math.min(0, pan)); DRY[0][i] += l; DRY[1][i] += r; if (SENDAMT) { SND[0][i] += l * SENDAMT; SND[1][i] += r * SENDAMT; } const m = Math.abs(v); if (m > PK) PK = m; }
function put2(i, l, r) { if (i < 0 || i >= N) return; DRY[0][i] += l; DRY[1][i] += r; if (SENDAMT) { SND[0][i] += l * SENDAMT; SND[1][i] += r * SENDAMT; } const m = Math.max(Math.abs(l), Math.abs(r)); if (m > PK) PK = m; }

// ---------- primitives ----------
function svf() { const o = { lp: 0, bp: 0, hp: 0 }; let s1 = 0, s2 = 0; o.run = (x, fc, q) => { const g = Math.tan(Math.PI * Math.min(fc, SR * 0.45) / SR), k = 1 / q, a1 = 1 / (1 + g * (g + k)), a2 = g * a1, a3 = g * a2; const v3 = x - s2, v1 = a1 * s1 + a2 * v3, v2 = s2 + a2 * s1 + a3 * v3; s1 = 2 * v1 - s1; s2 = 2 * v2 - s2; o.lp = v2; o.bp = k * v1; o.hp = x - k * v1 - v2; return o; }; return o; }
function nlayer(a, dur, g, { env, fc, q = 0.7, mode = 'bp', pan = 0, stereo = false }) {
  const i0 = S(a), n = S(dur), f = svf(), f2 = svf(), F = typeof fc === 'function' ? fc : () => fc, Pn = typeof pan === 'function' ? pan : () => pan;
  for (let k = 0; k < n; k++) { const u = k / n, e = env(u) * g, fq = F(u), y = f.run(nz(), fq, q)[mode]; if (stereo) put2(i0 + k, y * e, f2.run(nz(), fq, q)[mode] * e); else put(i0 + k, y * e, Pn(u)); }
}
function tones(a, Pp, g, o = {}) {
  const att = o.att ?? 0.002, dur = o.dur ?? 2.5, fade = o.fade ?? 0.05, gl = o.glide ?? 0, gk = o.gk ?? 60, trem = o.trem ?? 0, tf = o.tf ?? 7, pan = o.pan ?? 0;
  const i0 = S(a), n = S(dur), ph = new Float64Array(Pp.length), minD = Math.min(...Pp.map(p => p[2])), stop = minD > 0 ? 9.2 / minD : Infinity;
  for (let k = 0; k < n; k++) { const x = k / SR; if (x > stop) break; const e = Math.min(1, x / att) * Math.min(1, (dur - x) / fade) * (1 - trem * (0.5 + 0.5 * Math.sin(2 * Math.PI * tf * x))) * g, m = 1 + gl * Math.exp(-x * gk); let v = 0;
    for (let p = 0; p < Pp.length; p++) { ph[p] += 2 * Math.PI * Pp[p][0] * m / SR; v += Pp[p][1] * Math.exp(-x * Pp[p][2]) * Math.sin(ph[p]); }
    put(i0 + k, v * e, typeof pan === 'function' ? pan(x / dur) : pan); }
}
function click(a, g, fc = 6000, q = 1.2, len = 0.004, pan = 0) { const i0 = S(a), n = S(len * 6), f = svf(); for (let k = 0; k < n; k++) put(i0 + k, f.run(nz(), fc, q).bp * Math.exp(-k / (len * SR)) * g, pan); }
function drop1(a, g, f0 = 380, f1 = 2580, pan = 0, dk = 38, body = true) { const i0 = S(a); let ph = 0; for (let k = 0; k < 0.18 * SR; k++) { const x = k / SR, f = f0 + (f1 - f0) * Math.min(1, x / 0.045) ** 1.6; ph += 2 * Math.PI * f / SR; put(i0 + k, Math.sin(ph) * Math.exp(-x * dk) * g, pan); } if (body) tones(a, [[70, 1, 9]], g * 0.6, { dur: 0.5, att: 0.003, pan }); }
const swellEnv = (sw, x) => { let s = 0; for (const [st, dB, w] of sw) s += dB * Math.exp(-(((x - st) / w) ** 2)); return db(s); };

// ---------- the palette (one synth per cue type; from Voice of the Rain v4) ----------
const SIL = [[1, 1, 1.2], [2.76, 0.5, 2.2], [5.4, 0.25, 3.5], [8.93, 0.12, 5]], WRM = [[1, 1, 0.9], [2, 0.35, 1.6], [3.01, 0.15, 2.6], [4.2, 0.06, 3.8]];
const SYN = {
  whoosh(c) { const A = c.t - LEAD, d = c.dur ?? 0.6, pk = c.pk ?? 0.72, st = A - pk * d, G = db(c.gain), dir = c.dir ?? 1, f0 = c.f0 ?? 300, f1 = c.f1 ?? 2000; SENDAMT = c.send ?? 0.15;
    const env = u => u < pk ? Math.pow(u / pk, c.p ?? 2.2) : Math.pow(1 - (u - pk) / (1 - pk), 2), fc = u => f0 * Math.pow(f1 / f0, Math.min(1, u / pk));
    nlayer(st, d, G, { env, fc, q: c.q ?? 0.9, pan: u => dir * (c.width ?? 0.3) * (2 * u - 1) });
    if (c.air !== 0) nlayer(st, d, G * (c.air ?? 0.3), { env, fc: 7500, mode: 'hp', pan: u => -dir * 0.2 * (2 * u - 1) }); },
  cut_air(c) { const V = [[0.30, 380, 1300, 0.9], [0.36, 520, 1700, 1.1], [0.26, 300, 1000, 0.8], [0.33, 450, 1500, 1.0]][c.v ?? 0], j = 0.92 + 0.16 * R(), fm = c.fm ?? 1;
    SYN.whoosh({ ...c, dur: V[0] * j, f0: V[1] * fm * j, f1: V[2] * fm, q: V[3], dir: (c.v ?? 0) % 2 ? 1 : -1, air: c.cold ? 0.45 : 0.3, send: c.cold ? 0.05 : 0.15 }); },
  cut_tick(c) { const A = c.t - LEAD, G = db(c.gain), j = 0.9 + 0.2 * R(), v = c.v ?? 0;
    SYN.whoosh({ ...c, gain: c.gain - 3, dur: [0.16, 0.2, 0.14, 0.18][v] * j, f0: 2600 * j, f1: 6200, q: 0.8, pk: 0.8, dir: v % 2 ? -1 : 1, air: 0.2, send: 0.1 });
    click(A, G * 1.2, [5600, 6400, 7200, 6000][v], 1.5, 0.003, v % 2 ? 0.15 : -0.15); tones(A, [[[3136, 3520, 4186, 3951][v], 1, 55]], G * 0.1, { dur: 0.12 }); },
  cut_thump(c) { const A = c.t - LEAD, G = db(c.gain), fm = c.cold ? 1.3 : 1, f0 = [56, 62, 52, 66][c.v ?? 0] * fm * (0.96 + 0.08 * R()); SENDAMT = c.cold ? 0.03 : 0.1;
    nlayer(A - 0.16, 0.18, G * 0.5, { env: u => u ** 2.5 * Math.min(1, (1 - u) * 18), fc: u => 140 * fm * Math.pow(3, u), mode: 'lp' });
    tones(A - 0.003, [[f0, 1, 13], [f0 * 2.01, 0.25, 22]], G, { att: 0.004, dur: 0.24, fade: 0.06, glide: c.cold ? 0.3 : 0.6, gk: 35 }); },
  cut_card(c) { const A = c.t - LEAD, G = db(c.gain), v = c.v ?? 0, lpf = [1800, 2400, 1500, 2100][v] * (c.fm ?? 1), bf = [96, 110, 88, 120][v]; SENDAMT = 0.12;
    nlayer(A - 0.12, 0.12, G * 0.25, { env: u => u * u * Math.min(1, (1 - u) * 15), fc: u => 600 * Math.pow(2.3, u), q: 0.8, pan: v % 2 ? 0.2 : -0.2 });
    nlayer(A - 0.003, 0.09, G, { env: u => u < 0.04 ? u / 0.04 : Math.exp(-(u - 0.04) * 14), fc: lpf, mode: 'lp' });
    tones(A, [[bf, 1, 24]], G * 0.7, { dur: 0.2 }); nlayer(A - 0.002, 0.05, G * 0.25, { env: u => Math.exp(-u * 6), fc: 6500, mode: 'hp' }); },
  card_chapter(c) { SYN.cut_card({ ...c, v: c.v ?? 1, fm: 0.8 }); const A = c.t - LEAD, G = db(c.gain); SENDAMT = 0.3;
    nlayer(A, 0.45, G * 0.35, { env: u => Math.min(1, u / 0.05) * (1 - u) ** 2, fc: u => 500 * (1 - 0.5 * u), mode: 'lp' }); tones(A, [[72, 1, 10]], G * 0.6, { dur: 0.4 }); },
  letter(c) { const A = c.t - LEAD, G = db(c.gain), i = c.i ?? 0; SENDAMT = 0.15; click(A, G, 5200 + 800 * (i % 3), 2, 0.0025, c.pan ?? 0); tones(A, [[c.f ?? 3136, 1, 90]], G * 0.1, { dur: 0.06, pan: c.pan ?? 0 }); },
  bell(c) { const A = c.t - LEAD, f = c.f ?? mtof(c.m ?? 84), w = c.w ?? 0, G = db(c.gain); SENDAMT = c.send ?? 0.45;
    let Pp = SIL.map((s, i) => [f * (s[0] * (1 - w) + WRM[i][0] * w), s[1] * (1 - w) + WRM[i][1] * w, s[2] * (1 - w) + WRM[i][2] * w]);
    if (c.tone === 'low') Pp = [[f, 1, 0.55], [f * 2, 0.45, 0.8], [f * 2.76, 0.3, 1.2], [f * 4.07, 0.15, 1.8], [f * 5.4, 0.08, 2.5]];
    if (c.tone === 'glass') Pp = [[f, 1, 9], [f * 2.76, 0.3, 16]];
    tones(A, Pp, G * 0.5, { att: 0.0025, dur: c.tone === 'low' ? 6 : 3.2, pan: c.pan ?? 0 }); },
  drop(c) { const A = c.t - LEAD, G = db(c.gain); SENDAMT = c.send ?? 0.35; drop1(A, G, c.f0 ?? 380, c.f1 ?? 2580, c.pan ?? 0);
    if (c.sub) tones(A, [[52, 1, 2.2], [78, 0.4, 3]], G * 0.7 * c.sub, { att: 0.04, dur: 2.2, fade: 0.3 });
    if (c.ripple) { drop1(A + 0.13, G * 0.25, 600, 3300, 0.2, 45, false); drop1(A + 0.29, G * 0.12, 700, 3800, -0.2, 50, false); } },
  plink(c) { SENDAMT = 0.35; drop1(c.t - LEAD, db(c.gain), c.f0 ?? 700, c.f1 ?? 3400, c.pan ?? 0, 55, !!c.body); },
  plink_rev(c) { const n = S(0.22), buf = new Float32Array(n); let ph = 0; for (let k = 0; k < n; k++) { const x = k / SR, f = 500 + 2400 * Math.min(1, x / 0.05) ** 1.5; ph += 2 * Math.PI * f / SR; buf[k] = Math.sin(ph) * Math.exp(-x * 22); }
    const i1 = S(c.t - LEAD), G = db(c.gain); SENDAMT = 0.35; for (let k = 0; k < n; k++) put(i1 - n + k, buf[n - 1 - k] * G * Math.min(1, k / (0.01 * SR)), c.pan ?? 0); },
  glint(c) { const A = c.t - LEAD, G = db(c.gain), tone = c.tone ?? 'silver', pan = c.pan ?? 0.15;
    if (tone === 'brass') { SENDAMT = 0.06; tones(A, [[1180, 1, 9], [1664, 0.7, 11], [2513, 0.5, 14], [3422, 0.3, 18], [4720, 0.2, 25]], G * 0.35, { att: 0.001, dur: 0.9, pan }); click(A, G * 0.6, 4200, 2, 0.002, pan); return; }
    SENDAMT = tone === 'gold' ? 0.5 : 0.4; const Pp = tone === 'gold' ? [[2093, 1, 5], [3136, 0.6, 7], [4186, 0.4, 9], [6272, 0.2, 12]] : [[2637, 1, 7], [3951, 0.6, 9], [5274, 0.35, 12]];
    tones(A, Pp, G * 0.3, { att: 0.003, dur: 1.4, glide: -0.04, gk: 80, trem: 0.25, tf: 13, pan });
    tones(A + 0.06, Pp.map(([f, a, d]) => [f * 2, a * 0.4, d * 1.5]), G * 0.12, { dur: 0.6, pan: -pan }); },
  swipe(c) { const A = c.t - LEAD, d = Math.max(0.2, (c.end ?? c.t + 0.5) - c.t), G = db(c.gain), i0 = S(A), n = S(d), f1 = svf(), f2 = svf(); let gr = 1, gs = 1, nx = 0; SENDAMT = 0.08;
    for (let k = 0; k < n; k++) { const u = k / n, x = k / SR; if (k >= nx) { gr = 0.55 + 0.45 * R(); nx = k + S(0.004 + 0.004 * R()); } gs += 0.05 * (gr - gs);
      const e = Math.min(1, x / 0.025) * Math.min(1, (d - x) / 0.07) * (0.85 + 0.15 * Math.sin(2 * Math.PI * 3.1 * x)), w = nz();
      put(i0 + k, (f1.run(w, 5200 * (1 + 0.15 * u), 1.4).bp + 0.25 * f2.run(w, 1800, 2.5).bp) * e * gs * G, -0.25 + 0.5 * u); } },
  pen(c) { const G = db(c.gain), end = (c.end ?? c.t + 0.8) - LEAD; let t = c.t - LEAD; SENDAMT = 0.06;
    while (t < end) { const L = Math.min(end - t, 0.06 + 0.16 * R()), fc = 4200 + 2300 * R(), i0 = S(t), n = S(L), f = svf(); let gs = 0;
      for (let k = 0; k < n; k++) { const u = k / n; gs += 0.2 * ((R() < 0.04 ? 1 : 0.35) - gs); put(i0 + k, f.run(nz(), fc * (1 + 0.1 * Math.sin(u * 9)), 2).bp * Math.sin(Math.PI * u) ** 0.6 * gs * G, 0.1 + 0.2 * Math.sin(t * 3)); }
      click(t, G * 0.5, 7000, 2, 0.0015); t += L + 0.02 + 0.05 * R(); } },
  brush(c) { const A = c.t - LEAD, d = (c.end ?? c.t + 0.5) - c.t, G = db(c.gain), i0 = S(A), n = S(d), f1 = svf(), f2 = svf(); let gt = 1, gs = 1; SENDAMT = 0.25;
    nlayer(A - 0.01, 0.05, G * 0.5, { env: u => Math.sin(Math.PI * u), fc: 220, mode: 'lp' });
    for (let k = 0; k < n; k++) { const u = k / n, x = k / SR; if (u > 0.62 && R() < 0.004) gt = R() < 0.5 ? 1 : 0.1; gs += 0.02 * ((u > 0.62 ? gt : 1) - gs);
      const pres = Math.min(1, x / 0.03) * (1 - 0.4 * u) * Math.min(1, (d - x) / 0.05);
      put(i0 + k, (f1.run(nz(), 750 + 350 * Math.sin(Math.PI * u), 0.6).bp + 0.4 * f2.run(nz(), 4500, 0.7).hp) * pres * gs * G, 0.45 * Math.sin(2 * Math.PI * u)); } },
  rain(c) { const kind = c.kind ?? 'open', G = db(c.gain), fi = c.fade ?? 0.5, fo = c.fadeOut ?? 0.5, a = c.t - LEAD - 0.4 * fi, b = (c.end ?? c.t + 3) - LEAD + 0.3 * fo, sw = c.swells ?? []; SENDAMT = 0.2;
    const L1 = svf(), R1 = svf(), L2 = svf(), R2 = svf(), lo = svf(), hp = kind === 'glass' ? 2600 : kind === 'soft' ? 3400 : 4200;
    const env = x => Math.sin(Math.PI / 2 * Math.max(0, Math.min(1, (x - a) / fi, (b - x) / fo))) * swellEnv(sw, x);
    for (let i = Math.max(0, S(a)); i < S(b) && i < N; i++) { const x = i / SR, e = env(x) * G; let l = L1.run(nz(), hp, 0.7).hp, r = R1.run(nz(), hp, 0.7).hp;
      if (kind === 'glass') { l = L2.run(l, 5200, 0.7).lp; r = R2.run(r, 5200, 0.7).lp; }
      const m = lo.run(nz(), kind === 'glass' ? 120 : 180, 0.7).lp * (kind === 'soft' ? 0.9 : 0.6); put2(i, (l * 0.5 + m) * e, (r * 0.5 + m) * e); }
    const dens = kind === 'glass' ? 14 : kind === 'soft' ? 18 : 28, cnt = Math.round((b - a) * dens);
    for (let j = 0; j < cnt; j++) { const x = a + R() * (b - a), e = env(x); if (e < 0.02) continue; const gg = G * e * (0.2 + 0.8 * R()) * 0.6;
      if (kind === 'glass') click(x, gg, 3000 + 2500 * R(), 6, 0.003, nz() * 0.7); else click(x, gg, 2500 + 4500 * R(), 2.5, 0.0015 + 0.0025 * R(), nz() * 0.8); }
    if (kind === 'glass') for (let x = a + 0.5; x < b - 0.3; x += 0.6 + 0.8 * R()) drop1(x, G * env(x) * 0.25, 1200, 3500, nz() * 0.6, 70, false); },
  wind(c) { const G = db(c.gain), a = c.t - LEAD - 0.3, b = (c.end ?? c.t + 3) - LEAD + 0.1, fL = svf(), fR = svf(), lo = svf(), gu = c.gusts ?? []; SENDAMT = 0.3;
    for (let i = Math.max(0, S(a)); i < S(b) && i < N; i++) { const x = i / SR, fade = Math.sin(Math.PI / 2 * Math.min(1, (x - a) / 0.8, (b - x) / 0.8)), sg = swellEnv(gu, x);
      const m = 0.5 + 0.25 * Math.sin(2 * Math.PI * 0.31 * x + 1) + 0.25 * Math.sin(2 * Math.PI * 0.17 * x + 2), fc = (320 + 520 * m) * Math.sqrt(sg), e = fade * sg * G, low = lo.run(nz(), 200, 0.7).lp * 0.35;
      put2(i, (fL.run(nz(), fc, 1.3).bp + low) * e, (fR.run(nz(), fc * 1.07, 1.3).bp + low) * e); } },
  swell(c) { const A = c.t - LEAD, d = c.dur ?? 1, tail = c.tail ?? 0.12, G = db(c.gain), st = A - d, n = S(d + tail), f = svf(), i0 = S(st), p = c.p ?? 2.5, f0 = c.f0 ?? 300, f1 = c.f1 ?? 2000; SENDAMT = c.send ?? 0.4;
    for (let k = 0; k < n; k++) { const x = k / SR, u = Math.min(1, x / d), e = x < d ? Math.pow(u, p) : Math.exp(-(x - d) / tail * 3) * (1 - (x - d) / tail);
      put(i0 + k, f.run(nz(), f0 * Math.pow(f1 / f0, u), c.q ?? 0.8).bp * e * G, (c.pan ?? 0) * (u - 0.5)); }
    if (c.notes) tones(st, c.notes.map((m, j) => [mtof(m), 1 / (1 + j * 0.4), 0]), G * 0.18, { att: d, dur: d + tail, fade: tail }); },
  bloom(c) { const A = c.t - LEAD, G = db(c.gain), st = A - 0.3; SENDAMT = 0.5;
    nlayer(st, 1.9, G * 0.6, { env: u => { const x = u * 1.9; return x < 0.3 ? (x / 0.3) ** 2 : Math.exp(-(x - 0.3) * 2.2); }, fc: 240, mode: 'lp' });
    tones(st, [[50, 1, 1.1], [75, 0.45, 1.4], [c.warm ? 130.8 : 100, 0.25, 1.8]], G, { att: 0.3, dur: 2.2, fade: 0.3 }); },
  hum(c) { const a = c.t - LEAD, b = (c.end ?? c.t + 1.5) - LEAD, G = db(c.gain), i0 = S(a), n = S(b - a), F = [55, 110.3, 164.8], Am = [1, 0.45, 0.2], ph = [0, 0, 0]; SENDAMT = 0.3;
    for (let k = 0; k < n; k++) { const x = k / SR, u = k / n, e = Math.min(1, x / 0.6) * Math.min(1, (b - a - x) / 0.02) * (0.7 + 0.3 * u) * (1 - (0.15 + 0.3 * u) * (0.5 + 0.5 * Math.sin(2 * Math.PI * 5.8 * x))); let v = 0;
      for (let j = 0; j < 3; j++) { ph[j] += 2 * Math.PI * F[j] / SR; v += Am[j] * Math.sin(ph[j]); } put(i0 + k, v * e * G, 0); } },
  creak(c) { const a = c.t - LEAD, d = c.dur ?? 1, G = db(c.gain), i0 = S(a), n = S(d), f1 = svf(), f2 = svf(); let nx = 0; SENDAMT = 0.2;
    for (let k = 0; k < n; k++) { const u = k / n; let imp = 0; if (k >= nx) { imp = 1; nx = k + S(1 / (18 + 22 * (0.5 + 0.5 * Math.sin(u * 7 + R() * 0.3)))); }
      put(i0 + k, (f1.run(imp, 310, 9).bp + 0.6 * f2.run(imp, 760, 11).bp) * Math.sin(Math.PI * u) ** 0.7 * G * 3, 0.15); } },
  crack(c) { const A = c.t - LEAD, G = db(c.gain); let x = A; SENDAMT = 0.25; nlayer(A, 0.012, G, { env: u => 1 - u, fc: 1500, q: 0.6, mode: 'hp' });
    for (let j = 0; j < 14; j++) { x += 0.006 + 0.03 * R() * (1 + j * 0.15); click(x, G * (0.9 - j * 0.05) * (0.4 + 0.6 * R()), 1500 + 3500 * R(), 3, 0.002, nz() * 0.4); }
    tones(A, [[72, 1, 16], [118, 0.4, 24]], G * 0.8, { dur: 0.35 }); },
  seed(c) { const A = c.t - LEAD, G = db(c.gain); SENDAMT = 0.3; for (let j = 0; j < 3; j++) click(A + j * 0.025, G * (1 - j * 0.25), 2500 + 1500 * R(), 3, 0.002, 0.1);
    tones(A + 0.05, [[1100, 1, 40]], G * 0.4, { glide: 0.3, gk: 25, dur: 0.15 }); tones(A, [[140, 1, 30]], G * 0.5, { dur: 0.15 }); },
  thunder(c) { const A = c.t - LEAD, G = db(c.gain), st = A - 0.3, d = 3.4, i0 = S(st), n = S(d), a1 = svf(), a2 = svf(), b1 = svf(), b2 = svf(); let bn = 0.6, bs = 0.6, bt = 0; SENDAMT = 0.35;
    for (let k = 0; k < n; k++) { const x = k / SR; if (k >= bt) { bn = 0.4 + 0.6 * R(); bt = k + S(0.15 + 0.25 * R()); } bs += 0.0004 * (bn - bs);
      const e = (x < 0.4 ? (x / 0.4) ** 2 : Math.exp(-(x - 0.4) * 1.1)) * bs * G * Math.min(1, (d - x) / 0.3);
      put2(i0 + k, a2.run(a1.run(nz(), 110, 0.7).lp, 140, 0.7).lp * e, b2.run(b1.run(nz(), 110, 0.7).lp, 140, 0.7).lp * e); } },
  ratchet(c) { const G = db(c.gain), end = (c.end ?? c.t + 0.8) - LEAD; let x = c.t - LEAD; SENDAMT = 0.05;
    while (x < end) { const u = (x - c.t + LEAD) / Math.max(0.05, (c.end ?? c.t + 0.8) - c.t); click(x, G, 3200, 4, 0.0025, 0.15); tones(x, [[880 + 40 * R(), 1, 120]], G * 0.25, { dur: 0.04, pan: 0.15 }); x += 1 / (13 - 5 * u); } },
  knock(c) { const A = c.t - LEAD, G = db(c.gain); SENDAMT = 0.25; tones(A, [[185, 1, 40], [412, 0.5, 55], [870, 0.2, 70]], G, { dur: 0.25 }); click(A, G * 0.4, 2000, 2, 0.002); },
  pop(c) { const A = c.t - LEAD, G = db(c.gain); SENDAMT = 0.15; tones(A, [[c.f ?? 520, 1, 45]], G, { glide: -0.4, gk: 70, dur: 0.12, pan: c.pan ?? 0 }); click(A, G * 0.2, 3000, 2, 0.0015); },
  hit(c) { const A = c.t - LEAD, G = db(c.gain), no = c.tone === 'no';
    if (!no) SYN.whoosh({ t: c.t, gain: c.gain - 8, dur: 0.18, f0: 900, f1: 3200, pk: 0.95, q: 1, air: 0.2 });
    SENDAMT = no ? 0.1 : 0.05; tones(A - 0.004, [[no ? 44 : 50, 1, no ? 4.5 : 6], [no ? 66 : 75, 0.35, 8]], G, { glide: no ? 1.6 : 1.2, gk: 28, dur: 0.9, att: 0.003, fade: 0.2 });
    nlayer(A - 0.004, 0.06, G * 0.8, { env: u => Math.exp(-u * 5), fc: no ? 900 : 1600, mode: 'lp' }); click(A, G * 0.5, no ? 2500 : 4000, 1.2, 0.003);
    if (no) nlayer(A, 0.5, G * 0.25, { env: u => (1 - u) ** 2, fc: 300, mode: 'lp' }); },
  melt(c) { const A = c.t - LEAD, d = c.dur ?? 0.9, G = db(c.gain), i0 = S(A), n = S(d), Pp = [[590, 1], [832, 0.7], [1256, 0.5], [1711, 0.3]], ph = [0, 0, 0, 0, 0]; SENDAMT = 0.35;
    for (let k = 0; k < n; k++) { const x = k / SR, u = k / n, m = (1 - 0.45 * Math.pow(u, 1.5)) * (1 + 0.012 * u * Math.sin(2 * Math.PI * (6 - 3 * u) * x)), e = Math.min(1, x / 0.01) * Math.min(1, (d - x) / 0.15) * (1 - 0.3 * u); let v = 0;
      for (let j = 0; j < 4; j++) { ph[j] += 2 * Math.PI * Pp[j][0] * m / SR; v += Pp[j][1] * Math.pow(1 - u, j) * Math.sin(ph[j]); }
      ph[4] += 2 * Math.PI * 293.66 * m / SR; v += 0.8 * u * Math.sin(ph[4]); put(i0 + k, v * e * G * 0.35, 0); } },
  hollow(c) { const a = c.t - LEAD, d = (c.end ?? c.t + 1.5) - c.t, G = db(c.gain), env = u => Math.sin(Math.PI / 2 * Math.min(1, u * 4, (1 - u) * 3)); SENDAMT = 0.15;
    nlayer(a, d, G, { env: u => env(u) * (0.8 + 0.2 * Math.sin(u * 6)), fc: 293.66, q: 14, pan: -0.1 }); nlayer(a, d, G * 0.6, { env, fc: 440, q: 14, pan: 0.1 }); },
  water_tone(c) { let x = c.t - LEAD; const G = db(c.gain); SENDAMT = 0.3; for (let j = 0; j < 4; j++) { tones(x, [[380 + 270 * R(), 1, 30]], G * (1 - j * 0.2), { glide: -0.45, gk: 50, dur: 0.14, att: 0.004, pan: nz() * 0.3 }); x += 0.08 + 0.05 * R(); } },
  shimmer(c) { const A = c.t - LEAD, G = db(c.gain), d = c.dur ?? 0.5, ms = c.notes ?? (c.tone === 'gold' ? [84, 88, 91, 95, 96, 100, 103] : [88, 91, 93, 96, 98, 100, 103]); SENDAMT = 0.55;
    ms.forEach((m, j) => tones(A + d * j / ms.length * (0.7 + 0.3 * R()), [[mtof(m), 1, 1.6 + 0.4 * j]], G * 0.12, { att: 0.08, dur: 2.2, trem: 0.3, tf: 6 + 3 * R(), pan: (j / (ms.length - 1) - 0.5) * 0.8 })); },
  gliss(c) { const A = c.t - LEAD, G = db(c.gain), d = c.dur ?? 0.35; SENDAMT = 0.45;
    [72, 74, 76, 79, 81, 84, 86, 88].forEach((m, j) => { const f = mtof(m); tones(A + d * j / 8, [[f, 1, 3.5], [2 * f, 0.3, 6], [3 * f, 0.1, 9]], G * 0.25 * (0.7 + 0.3 * j / 7), { dur: 1.6, pan: -0.4 + 0.8 * j / 7 }); }); },
  wing(c) { const A = c.t - LEAD, G = db(c.gain); SENDAMT = 0.2; nlayer(A - 0.1, 0.16, G, { env: u => Math.sin(Math.PI * u) ** 2, fc: u => 380 + 300 * u, q: 0.8, pan: c.pan ?? 0 }); nlayer(A - 0.08, 0.12, G * 0.2, { env: u => Math.sin(Math.PI * u), fc: 6000, mode: 'hp' }); },
  fall(c) { const A = c.t - LEAD, d = c.dur ?? 1.2, G = db(c.gain); SENDAMT = 0.3; nlayer(A - d, d, G, { env: u => Math.pow(u, 1.5) * Math.min(1, (1 - u) * 30), fc: u => 2200 * Math.pow(500 / 2200, u), q: 3, pan: u => 0.2 - 0.2 * u }); },
  soak(c) { const a = c.t - LEAD, d = (c.end ?? c.t + 1) - c.t, G = db(c.gain); SENDAMT = 0.1; nlayer(a, d, G, { env: u => Math.sin(Math.PI * u), fc: 5500, mode: 'hp', stereo: true });
    for (let x = a; x < a + d; x += 0.01 + 0.02 * R()) click(x, G * 0.5 * Math.sin(Math.PI * (x - a) / d) * R(), 4000 + 3000 * R(), 3, 0.001, nz() * 0.6); },
  foot(c) { const A = c.t - LEAD, G = db(c.gain); SENDAMT = 0.2; nlayer(A, 0.03, G, { env: u => Math.exp(-u * 5), fc: 900, mode: 'lp' }); tones(A, [[1568, 1, 30]], G * 0.2, { dur: 0.15 }); },
  rainticks(c) { const A = c.t - LEAD, G = db(c.gain); SENDAMT = 0.25; for (let j = 0; j < 10; j++) click(A - 0.06 + 0.12 * R(), G * (0.3 + 0.7 * R()), 3000 + 4000 * R(), 2.5, 0.002, nz() * 0.6); drop1(A, G * 0.3, 900, 3600, 0, 60, false); },
};
SYN.whoosh_cut = SYN.whoosh;   // a whoosh that replaces a cut sound (same synth, separate type so it is visible in the cue list)
SYN.bell_low = c => SYN.bell({ ...c, tone: 'low' });

// ---------- arc: energy (cut level) and colour (cold / warm) from the score plan ----------
const secAt = t => PL.sections.find(s => t >= s.t0 && t < s.t1) || PL.sections.at(-1) || { mood: 'intro', t0: 0, t1: DUR };
let ENERGY;
if (Array.isArray(CF.energy)) ENERGY = CF.energy.map(([t, e]) => [anchor(WORDS, t), e]);
else {
  ENERGY = [];
  for (const s of PL.sections) { const e = (MOODS[s.mood] || MOODS.intro).energy ?? 0.5; ENERGY.push([s.t0, s.mood === 'build' ? 0.6 : e]); if (s.mood === 'build') ENERGY.push([s.t1 - 0.01, 0.8]); else ENERGY.push([s.t1 - 0.01, e]); }
  if (CF.peak != null) { const tp = anchor(WORDS, CF.peak); ENERGY.push([tp - 0.01, pw(ENERGY, tp)], [tp, 1.0], [tp + 7, pw(ENERGY, tp + 7)]); }
  ENERGY.sort((a, b) => a[0] - b[0]); if (!ENERGY.length) ENERGY = [[0, 0.5], [DUR, 0.5]];
}
const COLD = t => ['cold', 'tension'].includes(secAt(t).mood);
const firstWarm = PL.sections.find(s => ['warm', 'gratitude', 'glow', 'build', 'bloom', 'payoff', 'coda'].includes(s.mood))?.t0 ?? DUR;
const WARM = t => t >= firstWarm && !COLD(t);

// ---------- cues ----------
const cues = [], C = (t, type, gain, note, o = {}) => { if (t == null || t < 0 || t >= DUR) return; cues.push({ t: +(+t).toFixed(3), type, gain, note, ...o }); };
const M0 = PL.key.M0, PENT = [7, 9, 12, 16, 19, 21, 24].map(d => 72 + M0 - (M0 >= 6 ? 12 : 0) + d);   // pentatonic of the payoff key, from its 5th (G5 A5 C6 E6 G6 A6 C7 in C)

// 1. opener (the 0 dB reference)
if (CF.opener && CF.opener.type) { const { t, type, gain, ...o } = CF.opener; C(anchor(WORDS, t) ?? 0.2, type, gain ?? 0, 'opener (the 0 dB reference)', o); }
// 2. chapter cards: card hit + one tick per letter as it settles + a bell
PL.chapters.forEach((ch, ci) => {
  const t0 = ch.t, ck = CF.chapter, word = ch.word || 'chapter', m = PENT[Math.min(ci, PENT.length - 1)], w = t0 > DUR * 0.45 ? 1 : 0;
  C(t0, 'card_chapter', ck.card_gain, `${ch.id} chapter ${ci + 1} '${word}' card hit`, { v: ci % 4 });
  let last = t0; [...word].forEach((c, i) => { if (c === ' ') return; last = t0 + 0.05 + i * ck.stagger + ck.land;
    C(last, 'letter', ck.letter_gain, `${ch.id} chapter ${ci + 1} letter '${c}'`, { i, f: mtof(m + 24 + [0, 2, 4, 7][i % 4]), pan: (i / word.length - 0.5) * 0.6 }); });
  C(last + 0.06, 'bell', ck.bell_gain, `${ch.id} chapter ${ci + 1} bell`, { m, w });
});
// 3. stops: a hit slams in, everything else is silence (score.mjs gates the music)
PL.stops.forEach(([a], i) => C(a, 'hit', CF.stops.gain, `stop ${i + 1} slam`, { tone: Array.isArray(CF.stops.tone) ? CF.stops.tone[i % CF.stops.tone.length] : CF.stops.tone }));
// 4. key words (beats with `key`): a soft glint on the word (the payoff has its own cue)
if (CF.key_words && CF.key_words.type) { let lastK = -1e9;
  for (const b of BEATS) { if (!b.key) continue; let t; try { t = anchor(WORDS, { word: String(b.key).split(/\s+/)[0], after: b.t0 - 0.35 }); } catch { t = b.t0; }
    if (PL.payoff != null && Math.abs(t - PL.payoff) < 1.5) continue; if (t - lastK < CF.key_words.min_gap_s) continue; lastK = t;
    const { type, gain, min_gap_s, ...o } = CF.key_words; C(t, type, gain, `${b.id} key word '${b.key}'`, o); } }
// 5. payoff: sunrise swell into the word + the last drop on it
if (PL.payoff != null && CF.payoff) {
  C(PL.payoff, 'swell', CF.payoff.swell_gain, 'PAYOFF swell into the word', { dur: CF.payoff.swell_dur, p: 4, f0: 200, f1: 3500, tail: 1.4, send: 0.5 });
  C(PL.payoff, 'drop', CF.payoff.drop_gain, 'PAYOFF the last drop lands on the word', { ripple: 1, sub: 0.6 });
}
// 6. coda: title glint at the coda start, a last glint where the score's final glass note sounds
if (PL.coda && CF.coda) { const ring = PL.coda.t1 - PL.coda.t0 >= 5.5 ? PL.coda.t1 - 2.65 : PL.coda.t0;
  C(PL.coda.t0, 'glint', CF.coda.glint_gain, 'coda: the title/page glows', { tone: 'gold' }); C(ring + 1.28, 'glint', CF.coda.end_glint_gain, 'coda: closing glint (credit / seal)', { tone: 'silver', pan: 0.2 }); }
// 7. scene-specific cues (before the cuts, so a hero in them owns its cut)
const extraPath = path.join(DIR, CF.extra || 'sfx_cues_extra.json');
const extra = [...(fs.existsSync(extraPath) ? JSON.parse(fs.readFileSync(extraPath, 'utf8')) : []), ...(CF.cues || [])];
for (const e of extra) { const t = anchor(WORDS, e.t); const o = { ...e }; delete o.t; if (o.end != null) o.end = anchor(WORDS, o.end); C(t, e.type, e.gain ?? -18, e.note || 'extra', o); }
if (extra.length) console.log('merged', extra.length, 'extra cues');
// 8. hard cuts: one transition sound per beat t0, chosen by the incoming layout
const OWNS = new Set(CF.owners), SOFT = new Set(CF.soften_ids || []);
const root = s => String(s).replace(/(_close|_full|_foot|_word|x|\d)+$/, '');
const vr = mulberry(hashStr('cuts')), lastV = {}, cutsLog = { placed: 0, owned: [], skipped: [], softened: [] };
const montage = new Set();                                                       // runs of quick same-layout cuts (roll calls, lists): soften after the first
if (CF.montage) { const mc = CF.montage; let run = [];
  const flush = () => { if (run.length >= mc.min_run) run.slice(1).forEach(x => montage.add(x.id)); run = []; };
  for (let i = 1; i < BEATS.length; i++) { const b = BEATS[i], p = BEATS[i - 1];
    if (b.lay !== 'S' && b.lay === p.lay && b.t0 - p.t0 <= mc.max_gap_s) { if (!run.length) run.push(p); run.push(b); } else flush(); }
  flush(); }
for (let i = 0; i < BEATS.length; i++) { const b = BEATS[i], p = BEATS[i - 1] || { lay: '-', scene: '-' }; if (b.t0 <= 0 || b.t0 >= DUR) continue;
  const ps = p.scene || '-', bs = b.scene || '-', type = CF.cut_type[b.lay] || 'cut_air';
  const owner = cues.find(c => OWNS.has(c.type) && Math.abs(c.t - b.t0) < CF.own_window_s);
  if (owner) { cutsLog.owned.push(`${b.id}@${b.t0} by ${owner.type}`); continue; }
  const mid = WORDS.find(w => b.t0 > w[0] + 0.02 && b.t0 < w[1] - 0.02);
  const soft = SOFT.has(b.id) || montage.has(b.id);
  const cont = (p.lay === 'S' && b.lay === 'S') || (ps !== '-' && bs !== '-' && (root(ps).startsWith(root(bs)) || root(bs).startsWith(root(ps))));
  if (mid && cont && b.lay === 'S') { cutsLog.skipped.push(`${b.id}@${b.t0} mid-word punch-in`); continue; }
  let gain = (CF.cut_db[type] ?? -15) + 8 * (pw(ENERGY, b.t0) - 0.6), why = '';
  if (soft) { gain += CF.montage?.db ?? -8; why = ' (montage/soften, ' + (CF.montage?.db ?? -8) + ')'; }
  else if (cont) { gain += CF.same_scene_db; why = ` (same scene, ${CF.same_scene_db})`; }
  if (mid && (cont || soft)) { gain += CF.mid_word_db; why += ` (mid-word, ${CF.mid_word_db})`; }
  if (why) cutsLog.softened.push(b.id + why);
  const last = lastV[type]; let v = Math.floor(vr() * (last == null ? 4 : 3)); if (last != null && v >= last) v++; lastV[type] = v;
  const { type: ot, note: on, ...op } = CF.overrides[b.id] || {};
  C(b.t0, ot || type, +gain.toFixed(1), `${b.id} cut ${p.lay}->${b.lay} into ${bs}${on ? ': ' + on : ''}${why}`, { v, ...(COLD(b.t0) ? { cold: 1 } : {}), ...(WARM(b.t0) ? { fm: 0.85 } : {}), ...op });
  cutsLog.placed++; }
cues.sort((a, b) => a.t - b.t || a.type.localeCompare(b.type));

// ---------- render ----------
// calibration (measured in v4): a cue's `gain` is its own peak in dB re the hero drop, so every synth is trimmed to peak at 0 dB for gain 0
const TRIM = { shimmer: 19.6, rain: -3.8, card_chapter: 3.5, letter: 3.4, pen: 9, cut_card: 3.5, cut_air: 2.9, cut_tick: 1.5, rainticks: 7.1, wing: 7.4, whoosh_cut: 8.6, whoosh: 2.6,
  hum: -3.5, gliss: 11.1, creak: 30.6, foot: 11.2, thunder: 27, fall: 14, ratchet: 11, seed: 6.7, knock: -2.7, hit: -1.4, hollow: 22.4, melt: 2, soak: -3, wind: 2, swell: -0.4, bloom: -0.6, glint: 1.2, swipe: 1.3, water_tone: 1.2 };
const peaks = {};
for (const c of cues) { if (!SYN[c.type]) throw new Error(`unknown cue type ${c.type} at ${c.t} (types: ${Object.keys(SYN).join(', ')})`);
  R = mulberry(hashStr(c.type + '@' + c.t.toFixed(3) + '#' + (c.v ?? '') + (c.m ?? '') + (c.i ?? ''))); SENDAMT = 0; PK = 0;
  SYN[c.type](TRIM[c.type] ? { ...c, gain: c.gain + TRIM[c.type] } : c); (peaks[c.type] ||= []).push(20 * Math.log10(PK + 1e-12) - c.gain); }
function reverb(x, o) { const y = new Float32Array(N); const combs = [1687, 1601, 2053, 2251].map(d => ({ d: d + o, b: new Float32Array(d + o), i: 0 })), aps = [556, 441, 341].map(d => ({ d: d + o, b: new Float32Array(d + o), i: 0 })); let lp = 0;
  for (let n = 0; n < N; n++) { let s = 0; for (const c of combs) { const v = c.b[c.i]; s += v; c.b[c.i] = x[n] * 0.3 + v * 0.84; c.i = (c.i + 1) % c.d; }
    for (const a of aps) { const v = a.b[a.i], u = s + v * 0.5; a.b[a.i] = u; s = v - u * 0.5; a.i = (a.i + 1) % a.d; } lp += 0.35 * (s - lp); y[n] = lp; } return y; }
const MG = db(CF.master_db), OUT = [0, 1].map(ch => { const w = reverb(SND[ch], ch ? 23 : 0), o = new Float32Array(N); for (let n = 0; n < N; n++) o[n] = (DRY[ch][n] + CF.reverb_return * w[n]) * MG; return o; });
const EF = S(0.05); for (const o of OUT) for (let k = 0; k < EF; k++) o[N - 1 - k] *= Math.sin(Math.PI / 2 * k / EF);   // 50 ms end fade: no tail stops on a step
let pk = 0; for (const o of OUT) for (let n = 0; n < N; n++) pk = Math.max(pk, Math.abs(o[n]));
if (pk > 0.89) { const s = 0.89 / pk; for (const o of OUT) for (let n = 0; n < N; n++) o[n] *= s; console.log('WARNING: peak', pk.toFixed(3), 'trimmed to -1 dBFS; lower sfx.master_db'); pk = 0.89; }
const buf = Buffer.alloc(44 + N * 8); buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 8, 4); buf.write('WAVE', 8); buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(3, 20); buf.writeUInt16LE(2, 22);
buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 8, 28); buf.writeUInt16LE(8, 32); buf.writeUInt16LE(32, 34); buf.write('data', 36); buf.writeUInt32LE(N * 8, 40);
for (let n = 0; n < N; n++) { buf.writeFloatLE(OUT[0][n], 44 + n * 8); buf.writeFloatLE(OUT[1][n], 48 + n * 8); }
const outPath = path.resolve(DIR, arg('--out') || 'sfx.wav');
fs.writeFileSync(outPath, buf);
fs.writeFileSync(path.join(DIR, 'sfx_cues.json'), '[\n' + cues.map(c => JSON.stringify(c)).join(',\n') + '\n]\n');
const byType = {}; for (const c of cues) byType[c.type] = (byType[c.type] || 0) + 1;
if (process.argv.includes('--list')) cues.forEach(c => console.log(c.t.toFixed(2).padStart(7), c.type.padEnd(13), String(c.gain).padStart(6), c.note));
console.log(`${path.basename(outPath)} ${(N / SR).toFixed(3)} s, peak ${(20 * Math.log10(pk || 1e-9)).toFixed(2)} dBFS, ${cues.length} cues; beats ${BEATS.length}, payoff ${PL.payoff ?? 'none'}`);
console.log('cuts:', cutsLog.placed, 'placed;', cutsLog.owned.length, 'owned by a hero:', cutsLog.owned.join(', ') || '-');
console.log('skipped:', cutsLog.skipped.join(', ') || 'none', '| softened:', cutsLog.softened.length, cutsLog.softened.length ? '(' + cutsLog.softened.slice(0, 12).join('; ') + (cutsLog.softened.length > 12 ? '; ...' : '') + ')' : '');
console.log('by type:', JSON.stringify(byType));
