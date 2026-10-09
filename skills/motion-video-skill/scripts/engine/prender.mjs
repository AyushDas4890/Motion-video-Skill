// prender.mjs — render the film in N parallel segments, concat losslessly, mux the final mix. Run from work/.
//   node prender.mjs <out.mp4> [fps=60] [N=4] [audio.wav] [width=PW]
// Each segment is its own headless Chromium on the GPU (render.mjs seg). Length = FILM_END (beats.js) or PROJECT.filmEnd.
// Output: H.264 High, yuv420p TV range, BT.709; AAC 256k 48 kHz. The audio is padded/cut to the picture length.
// N: 4 is right for a laptop GPU (~1.3x realtime at 60 fps for v4); more segments mostly fight over the GPU.
import {spawn,execFileSync} from 'child_process';import fs from 'fs';import {findFF} from './pw.mjs';
const [out,fps='60',N='4',audio='',width='']=process.argv.slice(2);const FF=findFF();
if(!out){console.log('usage: node prender.mjs <out.mp4> [fps=60] [N=4] [audio.wav] [width]');process.exit(1)}
fs.mkdirSync('parts',{recursive:true});const t0=Date.now();
const segs=[...Array(+N).keys()].map(k=>new Promise((res,rej)=>{const p=spawn(process.execPath,['render.mjs','seg',`parts/seg${k}.mp4`,fps,String(k),N],{stdio:['ignore','pipe','inherit'],env:process.env});
 p.stdout.on('data',d=>{const s=d.toString();if(/SEGDONE|FATAL|PAGEERR|WTMISS/.test(s)||/ 0\/| 1800\//.test(s))process.stdout.write(s)});p.on('close',c=>c===0?res():rej(new Error('seg '+k+' exit '+c)))}));
await Promise.all(segs);console.log('segments done in',((Date.now()-t0)/60000).toFixed(1),'min');
fs.writeFileSync('parts/list.txt',[...Array(+N).keys()].map(k=>`file 'seg${k}.mp4'`).join('\n'));
const vid=audio?'parts/_video.mp4':out;
execFileSync(FF,['-v','error','-y','-f','concat','-safe','0','-i','parts/list.txt','-c','copy',vid],{stdio:'inherit'});
if(width){const tmp=vid.replace('.mp4','_s.mp4');execFileSync(FF,['-v','error','-y','-i',vid,'-vf',`scale=${width}:-2:flags=lanczos`,'-c:v','libx264','-profile:v','high','-crf','20','-preset','medium','-pix_fmt','yuv420p','-color_range','tv','-colorspace','bt709','-color_primaries','bt709','-color_trc','bt709',tmp],{stdio:'inherit'});fs.renameSync(tmp,vid)}
if(audio)execFileSync(FF,['-v','error','-y','-i',vid,'-i',audio,'-map','0:v','-map','1:a','-c:v','copy','-af','apad','-c:a','aac','-b:a','256k','-ar','48000','-shortest','-movflags','+faststart',out],{stdio:'inherit'});
console.log('DONE',out,((Date.now()-t0)/60000).toFixed(1),'min');
