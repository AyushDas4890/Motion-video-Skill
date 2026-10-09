// render.mjs — headless Chromium on the GPU -> frames -> ffmpeg. Run from work/.
//   node render.mjs test 1.2,5,9.5 strip.jpg [thumbW=270]   contact strip (thumbs side by side) -> then LOOK at it
//   node render.mjs stills 1.2,5 outdir                     full-res JPEGs (<outdir>/<t>.jpg)
//   node render.mjs seg out.mp4 FPS K N                     render segment K of N (0-based) at FPS (prender.mjs runs these)
//   node render.mjs qa 1.2,5 qadir                          normal + mask + text-hidden + speaker-only frames, logs.json,
//                                                           project.json (then: python qa.py frames qadir)
//   node render.mjs hash 1.2,5                              determinism: md5 of each frame, rendered twice (2nd pass reversed)
//   node render.mjs meta                                    shots + events JSON to stdout
// env: GROOT (node_modules with playwright; auto-found in the npx cache), FF (ffmpeg; auto: imageio_ffmpeg), PAGE (default
// film.html), CRF (default 16), PRESET (default medium). Prints PAGEERR (JS error) / CONSOLE WTMISS (cue word not found): fix both.
import {spawn,execFileSync} from 'child_process';import fs from 'fs';import crypto from 'crypto';
import {openFilm,findFF,frameJpeg,framePng} from './pw.mjs';
const FF=findFF(),mode=process.argv[2];
if(!mode){console.log('usage: node render.mjs test|stills|seg|qa|hash|meta ...');process.exit(1)}
const fps=mode==='seg'?+process.argv[4]:undefined;
const {browser:b,page:p,dim}=await openFilm({fps});
const shot=(t,q=0.95)=>frameJpeg(p,t,q);
const setQA=o=>p.evaluate(o=>Object.assign(window.QA,o),o);
const times=s=>String(s).split(',').filter(Boolean).map(Number);
if(mode==='test'){const ts=times(process.argv[3]),tw=+(process.argv[5]||270);fs.mkdirSync('tt',{recursive:true});
 for(const t of ts)fs.writeFileSync(`tt/${t}.jpg`,await shot(t));
 execFileSync(FF,['-v','error','-y',...ts.flatMap(t=>['-i',`tt/${t}.jpg`]),'-filter_complex',`${ts.map((_,i)=>`[${i}]scale=${tw}:-2[s${i}]`).join(';')};${ts.map((_,i)=>`[s${i}]`).join('')}${ts.length>1?`hstack=${ts.length}`:'null'}`,process.argv[4]||'test.jpg']);console.log('strip',process.argv[4]||'test.jpg')}
else if(mode==='stills'){const ts=times(process.argv[3]),dir=process.argv[4]||'stills';fs.mkdirSync(dir,{recursive:true});for(const t of ts)fs.writeFileSync(`${dir}/${t.toFixed(2)}.jpg`,await shot(t,0.95));console.log('stills',ts.length,dir)}
else if(mode==='qa'){const ts=times(process.argv[3]),dir=process.argv[4]||'qa';fs.mkdirSync(dir,{recursive:true});const logs={};
 fs.writeFileSync(`${dir}/project.json`,JSON.stringify(await p.evaluate(()=>getProject())));
 for(const t of ts){const k=t.toFixed(3);await setQA({mask:false,hideText:false});fs.writeFileSync(`${dir}/${k}_n.jpg`,await shot(t,0.92));logs[k]=await p.evaluate(()=>getLog());
  await setQA({mask:true,hideText:false});fs.writeFileSync(`${dir}/${k}_m.jpg`,await shot(t,0.92));logs[k].maskLog=await p.evaluate(()=>getLog());
  await setQA({mask:false,hideText:true});fs.writeFileSync(`${dir}/${k}_b.jpg`,await shot(t,0.92));await setQA({mask:false,hideText:false,speakerOnly:true});fs.writeFileSync(`${dir}/${k}_s.jpg`,await shot(t,0.92));await setQA({mask:false,hideText:false,speakerOnly:false})}
 fs.writeFileSync(`${dir}/logs.json`,JSON.stringify(logs));console.log('qa frames',ts.length,dir)}
else if(mode==='hash'){const ts=times(process.argv[3]);const h=async t=>crypto.createHash('md5').update(await framePng(p,t)).digest('hex');
 const A={},B={};for(const t of ts)A[t]=await h(t);for(const t of ts.slice().reverse())B[t]=await h(t);let ok=true;for(const t of ts){const same=A[t]===B[t];ok&&=same;console.log('HASH',t,A[t],same?'OK':'MISMATCH '+B[t])}console.log(ok?'DETERMINISM PASS':'DETERMINISM FAIL')}
else if(mode==='meta'){console.log(JSON.stringify({shots:await p.evaluate(()=>getShots()),events:await p.evaluate(()=>getEvents())}))}
else if(mode==='seg'){const out=process.argv[3],K=+process.argv[5],N=+process.argv[6];const DURV=dim.filmEnd;const total=Math.round(DURV*fps),a=Math.floor(total*K/N),z=Math.floor(total*(K+1)/N);
 const f=spawn(FF,['-v','error','-y','-f','image2pipe','-framerate',String(fps),'-c:v','mjpeg','-i','-','-vf','scale=in_range=pc:out_range=tv:in_color_matrix=bt601:out_color_matrix=bt709:flags=lanczos,format=yuv420p','-c:v','libx264','-profile:v','high','-crf',process.env.CRF||'16','-preset',process.env.PRESET||'medium','-color_range','tv','-colorspace','bt709','-color_primaries','bt709','-color_trc','bt709','-movflags','+faststart',out],{stdio:['pipe','inherit','inherit']});
 const t0=Date.now();for(let i=a;i<z;i++){const buf=await shot(i/fps,0.95);if(!f.stdin.write(buf))await new Promise(r=>f.stdin.once('drain',r));if((i-a)%300==0)console.log(`seg${K} ${i-a}/${z-a} ${((Date.now()-t0)/Math.max(1,i-a)).toFixed(0)}ms/f`)}
 f.stdin.end();await new Promise(r=>f.on('close',r));console.log('SEGDONE',K,out)}
else console.log('unknown mode',mode);
await b.close();
