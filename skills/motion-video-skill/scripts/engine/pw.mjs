// pw.mjs — shared launcher for every Node tool (render.mjs, scene_test.mjs, det_debug.mjs, fontcheck.mjs, envcheck).
// Finds Playwright (env GROOT = a node_modules folder that contains playwright; else the npx cache is searched) and ffmpeg
// (env FF; else python imageio_ffmpeg; else PATH), launches Chromium with WebGL on the GPU (ANGLE D3D11 on Windows),
// opens film.html (env PAGE) and init()s it with caps.json + face_boxes.json.
import {createRequire} from 'module';import fs from 'fs';import path from 'path';import {execFileSync} from 'child_process';import {pathToFileURL} from 'url';
export function findGroot(){const g=process.env.GROOT;if(g&&fs.existsSync(path.join(g,'playwright')))return g;
 const roots=[process.env.LOCALAPPDATA&&path.join(process.env.LOCALAPPDATA,'npm-cache','_npx'),process.env.HOME&&path.join(process.env.HOME,'.npm','_npx')].filter(Boolean);
 for(const r of roots){if(!fs.existsSync(r))continue;for(const d of fs.readdirSync(r)){const nm=path.join(r,d,'node_modules');if(fs.existsSync(path.join(nm,'playwright','package.json')))return nm}}
 try{const nm=execFileSync('npm',['root','-g'],{encoding:'utf8',shell:true}).trim();if(fs.existsSync(path.join(nm,'playwright')))return nm}catch(e){}
 throw new Error('Playwright not found. Set GROOT=<node_modules folder containing playwright> (e.g. run `npx playwright --version` once, then GROOT=%LOCALAPPDATA%/npm-cache/_npx/<hash>/node_modules)')}
export function findFF(){const f=process.env.FF;if(f&&fs.existsSync(f))return f;
 try{const p=execFileSync('python',['-c','import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())'],{encoding:'utf8'}).trim();if(p&&fs.existsSync(p))return p}catch(e){}
 return 'ffmpeg'}
export const GPU_ARGS=['--allow-file-access-from-files','--use-angle=d3d11','--enable-gpu','--ignore-gpu-blocklist','--enable-gpu-rasterization','--disable-gpu-driver-bug-workarounds'];
export async function launch(){const require=createRequire(findGroot()+'/');const {chromium}=require('playwright');return chromium.launch({args:GPU_ARGS})}
// open the film page and init it. opts: {fps, quiet}. Returns {browser, page, info}
export async function openFilm(opts={}){const b=await launch();const p=await b.newPage({viewport:{width:1080,height:1920}});
 p.on('pageerror',e=>console.log('PAGEERR',e.message));p.on('console',m=>{const s=m.text();if(/WTMISS|GLERR|FONTFAIL|ERR/.test(s))console.log('CONSOLE',s)});
 await p.goto(pathToFileURL(path.resolve(process.env.PAGE||'film.html')).href);
 const caps=JSON.parse(fs.readFileSync('caps.json','utf8'));const faces=fs.existsSync('face_boxes.json')?JSON.parse(fs.readFileSync('face_boxes.json','utf8')).boxes:null;
 const info=await p.evaluate(o=>init(o),{caps,faces,fps:opts.fps||undefined});
 const dim=await p.evaluate(()=>getProject());await p.setViewportSize({width:Math.round(dim.PW),height:Math.round(dim.PH)});
 if(!opts.quiet)console.log('INIT',JSON.stringify(info));
 if(/swiftshader|software|none/i.test(info.webgl)){console.log('FATAL: WebGL is not on the GPU:',info.webgl,'(check GPU drivers / --use-angle; the film needs hardware WebGL2)');process.exit(2)}
 if(info.fontsMissing.length)console.log('WARN fonts missing:',info.fontsMissing.join(', '));
 return {browser:b,page:p,info,dim}}
export const frameJpeg=async(p,t,q=0.95)=>Buffer.from(await p.evaluate(async([t,q])=>{await renderFrame(t);return document.getElementById('c').toDataURL('image/jpeg',q).split(',')[1]},[t,q]),'base64');
export const framePng=async(p,t)=>p.evaluate(async t=>{await renderFrame(t);return document.getElementById('c').toDataURL('image/png')},t);
