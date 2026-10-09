// scene_test.mjs — try a scene body without editing files: replaces one scene with `new Function('t','c', body)` and
// renders time t to a JPEG (prints the frame cost). Run from work/.
//   node scene_test.mjs "<js body using t and c>" out.jpg <t> [sceneName]
// sceneName defaults to the scene of the shot at t (the shot keeps its layout: S overlay / X panel / C / F).
// Example: node scene_test.mjs "Wbg(t,1);C_tree(W/2,H*0.86,0.5,{t,p:c.u})" ../review/x.jpg 12.5
import fs from 'fs';import {openFilm} from './pw.mjs';
const [body,out,tt,name]=process.argv.slice(2);
if(!body||!out){console.log('usage: node scene_test.mjs "<body>" out.jpg <t> [sceneName]');process.exit(1)}
const {browser:b,page:p}=await openFilm({quiet:true});
const r=await p.evaluate(async([body,tt,name])=>{const t=+tt||0.5;const sh=SHOTS[shotAt(t)];const nm=name||(sh&&sh.scene)||'__test';
 if(sh&&!sh.scene&&!name){sh.scene=nm}SCENES[nm]=new Function('t','c',body);const t0=performance.now();await renderFrame(t);const ms=performance.now()-t0;
 return {nm,lay:sh&&sh.lay,ms,url:document.getElementById('c').toDataURL('image/jpeg',0.92)}},[body,tt,name]);
console.log('scene',r.nm,'layout',r.lay,'frame',r.ms.toFixed(0),'ms ->',out);
fs.writeFileSync(out,Buffer.from(r.url.split(',')[1],'base64'));await b.close();
