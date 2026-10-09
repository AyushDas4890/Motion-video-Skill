// acts/scenes_main.js — THIS project's scenes (empty starter). Loaded after the kits and acts/starter.js, before the
// timeline, so anything here can use every kit function and override any earlier SCENES.name.
// A scene draws the WHOLE logical frame (W x H) for time t; the layout places it (S overlay / X panel / C / F).
//   c = {t0, t1, k: t - t0, u: 0..1 through the shot, lay, a: beat args (+ a.beat = the beat), split: true in an X panel}
// Rules: pure in t (RNG/hash/vnoise only, never Math.random/Date) · cue from words: WT('word', after) · fill the
// background first (Wbg / C_sky / sky3 fill 3W x 3H so camera moves never show an edge) · must-read text inside
// SAFE_TOP..SAFE_BOT, >= 19 px, with an edge/plate for contrast · never draw over the speaker (layout.js draws him).
// Then point a beat at it in beats_data.py: (t0, 'C', 'my_scene', 'what it shows', 'motif', 'sound', {}) -> python beats.py
'use strict';

// Example (delete or adapt): a cloud that starts raining on the spoken word "rain".
// SCENES.my_rain=(t,c)=>{const tr=WT('rain',c.t0-0.3),ink=C_inkFor(t);
//  C_sky(t,{hz:H*0.9});C_hills(t,H*0.865,{trees:4,flowers:12});
//  C_cloud(W/2,H*0.24,W*0.62,{t,seed:3,rain:cl((t-tr)/0.4)});
//  C_dropIn('rain',W/2,H*0.42,140,ink.keyCol,tr,t,{grad:ink.key,stroke:ink.kst,shadow:ink.sh});grain(t,0.035)};
