// project.js — EVERY project-specific constant lives here (the engine reads PROJECT; python reads it via projcfg.py).
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
const PROJECT = {
 "title": "Untitled",
 "speaker": "",
 "lang": "en",
 "aspect": "9:16",
 "fps": 60,
 "filmEnd": 10.0,
 "footage": {
  "src": "",
  "dir": "vf",
  "fps": 30,
  "w": 480,
  "h": 864,
  "n": 300,
  "dur": 10.0,
  "digits": 5
 },
 "text": {
  "title": "Untitled",
  "author": "",
  "lines": [],
  "source": "",
  "credit": [],
  "cardHead": "",
  "cardHeadFloat": "",
  "cardFoot": ""
 },
 "gloss": {},
 "glossRail": [],
 "captions": {
  "keyWords": [],
  "funcWords": [],
  "keepPairs": [],
  "goldWords": [],
  "goldCapWords": [],
  "goldFrom": 0,
  "goldCol": "#FFD36E",
  "keyClock": [
   [ 0, "#C9DBFF" ]
  ]
 },
 "speakerLook": {
  "grade": false,
  "radius": 34,
  "rim": "rgba(255,255,255,0.55)"
 },
 "world": {
  "skyArc": [
   [ 0, "D" ],
   [ 10, "G" ]
  ],
  "inkArc": null,
  "hlGoldFrom": 1000000000,
  "dawn": [ 1000000000, 4 ],
  "dawnInk": [ 1000000000, 6 ],
  "moonSet": 4,
  "inkGoldWords": []
 },
 "layout": {},
 "qa": {
  "extraTimes": []
 },
 "reel": {
  "seg": []
 },
 "fonts": []
};
