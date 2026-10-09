// det_debug.mjs — determinism debug: render T, then other frames, then T again; saves both PNGs so you can diff them
// (a scene that keeps state between frames, or seeds RNG from call order, shows up here). Run from work/.
//   node det_debug.mjs T other1,other2 outprefix      -> outprefix_a.png, outprefix_b.png
import fs from 'fs';import {openFilm,framePng} from './pw.mjs';
const [T,others,out]=process.argv.slice(2);
if(!T||!others||!out){console.log('usage: node det_debug.mjs T other1,other2 outprefix');process.exit(1)}
const {browser:b,page:p}=await openFilm({quiet:true});
const a=await framePng(p,+T);for(const o of others.split(','))await framePng(p,+o);const c=await framePng(p,+T);
fs.writeFileSync(out+'_a.png',Buffer.from(a.split(',')[1],'base64'));fs.writeFileSync(out+'_b.png',Buffer.from(c.split(',')[1],'base64'));
console.log(a===c?'IDENTICAL':'DIFFERENT',out+'_a.png',out+'_b.png');await b.close();
