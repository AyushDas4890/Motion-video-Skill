// layout.js — the template's shot grammar: S speaker / X split / C cutaway / F full graphic. Transitions, motion blur, renderFrame.
// Geometry comes from ASPECT (kit.js presets + PROJECT.layout overrides); nothing here is project-specific.
'use strict';
const SPLIT=ASPECT.split||'h';           // 'h': art above / speaker below the seam (9:16) · 'v': art left / speaker right (16:9, 1:1)
const SEAM=ASPECT.seam,SPLIT_Y=SEAM;     // the seam (y for 'h', x for 'v'); 50/50 by default
const CUT_CAP_Y=H*ASPECT.capY;           // one-word cutaway caption, centred low (above the bottom safe edge)
let FPS=60;
function shotAt(t){for(let i=0;i<SHOTS.length;i++){const s=SHOTS[i];if(t>=s.t0&&t<s.t1)return i}return SHOTS.length-1}
// S: cap the zoom per shot so the chest-caption zone keeps >= 120 px under the (padded) face box (critic r2: captions were shrinking to ~2% H)
const SZM=new Map();function sZmax(s){if(SZM.has(s))return SZM.get(s);if(ASPECT.sCap!=='chest'){SZM.set(s,9);return 9}let lo=0.82;const fr=[];for(let k=0;k<=8;k++){const i=srcIndex(lerp(s.t0,s.t1,k/8)),b=faceBox(i);fr.push(b[1]+b[3])}const bot=Math.max(...fr);const z=Math.max(lo,(SAFE_BOT-26-120)/(bot*spkS0({x:0,y:0,w:W,h:H})));SZM.set(s,z);return z}
// glossary rail: [[word, t0, t1]..] keeps a gloss chip docked lower-left on C/F non-card shots (PROJECT.glossRail)
const GLOSS_RAIL=PRJ.glossRail||[];let glossRailLater=false;
function glossRail(t){const on=GLOSS_RAIL.filter(([,a,b])=>t>=a&&t<b);if(!on.length)return;let y=SAFE_BOT-34;g.save();g.setTransform(SC,0,0,SC,0,0);
 for(const [w,a,b] of on){const G=GLOSS[w],k=eo5(cl((t-a)/0.25))*(1-eo(cl((t-b+0.25)/0.25))),s1=24,s2=22,l1=w+FN_MARK[G.n]+' ',tw=mw(l1,s1,FAM.text,'600','italic')+mw(G.def,s2,FAM.text,'400','italic')+34;
  g.save();g.globalAlpha*=k;g.fillStyle='rgba(250,246,236,0.94)';g.shadowColor='rgba(0,0,0,0.35)';g.shadowBlur=10*SC;g.beginPath();g.roundRect(22,y-22,tw,44,12);g.fill();g.shadowBlur=0;
  TGRP='rail'+w;const x1=22+14+T(l1,36,y,s1,'#1d2433',FAM.text,'600','left',1,{st:'italic'});T(G.def,x1,y,s2,'#3a4152',FAM.text,'400','left',1,{st:'italic'});TGRP=null;g.restore();logGloss(w,G.def);y-=52}
 g.restore()}
function zoomOf(s,t){const z=(s.zoom||(s.lay==='S'?1.22:1))*(s.lay==='S'?0.87:s.lay==='X'?0.8:1);return z*(1+(s.push!=null?s.push:0.010)*(t-s.t0))}
// template camera: every shot opens with an ease-out scale settle; shots over 2 s get a second push at ~55%
const CAMDEF={S:{z0:1.1,d:0.5},X:{z0:1.25,d:0.4,sz0:1.3,sd:0.8},C:{z0:1.3,d:0.38},F:{z0:1.35,d:0.35}};
function camScale(s,t){const c={...CAMDEF[s.lay],...(s.cam||{})};const k=t-s.t0,D=s.t1-s.t0;let z=lerp(c.z0,c.z1||1,eo5(k/c.d));if(D>2.05&&c.second!==false){const a=s.t0+D*0.55;z*=1+(c.second||0.10)*eio((t-a)/Math.min(1.5,D*0.45))}if(c.cut&&t>=c.cut[0])z*=c.cut[1];return z*(1+(c.push!=null?c.push:0.006)*k)}
function speakerEntry(s,t){const pi=SHOTS.indexOf(s)-1;if(s.lay==='X'&&pi>=0&&SHOTS[pi].lay==='X'&&SHOTS[pi].t1>=s.t0-0.01)return 1;const c={...CAMDEF[s.lay],...(s.cam||{})};const z0=s.lay==='X'?c.sz0:c.z0,d=s.lay==='X'?c.sd:c.d;return lerp(z0,1,eo5((t-s.t0)/d))}
function withCam(s,t,fx,fy,fn){const z=camScale(s,t);g.save();g.translate(fx,fy);g.scale(z,z);g.translate(-fx,-fy);fn();g.restore()}
function sceneCtx(s,t,extra={}){return {t0:s.t0,t1:s.t1,k:t-s.t0,u:cl((t-s.t0)/(s.t1-s.t0)),lay:s.lay,a:s.args||{},...extra}}
function drawScene(s,t,extra){const fn=SCENES[s.scene];if(!fn){sky('#200','#000');T('MISSING '+s.scene,W/2,H/2,30,'#f66');return}g.save();fn(t,sceneCtx(s,t,extra));g.restore()}
// chest caption zone: below the chin, above the bottom 20%
function chestZone(){const fr=faceRect();const top=fr?Math.max(fr[3]+12,H*0.60):H*0.66;return [top,Math.min(SAFE_BOT-18,Math.max(top+80,SAFE_BOT-26))]}
function drawShot(i,t,opt={}){const s=SHOTS[i];if(!s)return;CUR_SHOT=s;if(LOG){LOG.shot=s.id||i;LOG.lay=s.lay}const cap=s.cap||({S:ASPECT.sCap||'chest',X:'seam',C:'word',F:'none'})[s.lay];
 if(s.lay==='S'){const pop=s.pop?1+0.06*(1-spr(t-s.t0,13,0.75)):1;g.save();g.translate(W/2,H*0.45);g.scale(pop,pop);g.translate(-W/2,-H*0.45);speaker({x:0,y:0,w:W,h:H},Math.min(zoomOf(s,t),sZmax(s)),[s.t0,s.t1],s.anchor||ASPECT.sAnchor,{exiting:opt.exiting,entry:speakerEntry(s,t)});g.restore();
  if(QA.speakerOnly)return;if(s.scene)drawScene(s,t,{over:true});
  if(cap==='chest'){const z=chestZone();chestCaption(t,capAt(t),z[0],z[1],{key:s.key})}else if(cap==='chesttop'){chestCaption(t,capAt(t),SAFE_TOP+10,(faceRect()||[0,330])[1]-12)}else if(cap==='word')wordCaption(t,ASPECT.sCap==='word'?CUT_CAP_Y:Math.max(chestZone()[0]+40,CUT_CAP_Y))}
 else if(s.lay==='X'&&SPLIT==='v'){// art left of the seam, speaker right; the seam word sits low on the art panel
  const fy=s.fy!=null?s.fy:H*0.42,sc=s.fs||1;if(!QA.speakerOnly){const pc=pushClip(0,0,SEAM,H);withCam(s,t,SEAM/2,H/2,()=>{g.translate(SEAM/2,H/2);g.scale(sc,sc);g.translate(-W/2,-fy);drawScene(s,t,{split:true})});popClip(pc)}
  speaker({x:SEAM,y:0,w:W-SEAM,h:H},zoomOf(s,t)*(s.szoom||1),[s.t0,s.t1],s.anchor||ASPECT.xAnchor,{exiting:opt.exiting,entry:speakerEntry(s,t)});
  if(cap==='seam'&&!QA.speakerOnly)wordCaption(t,CUT_CAP_Y,{size:50,cx:SEAM/2,maxW:SEAM-40})}
 else if(s.lay==='X'){const fy=s.fy!=null?s.fy:H*0.42,sc=s.fs||1;if(!QA.speakerOnly){const pc=pushClip(0,0,W,SPLIT_Y);withCam(s,t,W/2,SPLIT_Y/2,()=>{g.translate(W/2,SPLIT_Y/2);g.scale(sc,sc);g.translate(-W/2,-fy);drawScene(s,t,{split:true})});popClip(pc)}
  speaker({x:0,y:SPLIT_Y,w:W,h:H-SPLIT_Y},zoomOf(s,t)*(s.szoom||1),[s.t0,s.t1],s.anchor||ASPECT.xAnchor,{exiting:opt.exiting,entry:speakerEntry(s,t)});
  if(cap==='seam'&&!QA.speakerOnly){const fr=faceRect();wordCaption(t,Math.min(SPLIT_Y-6,(fr?fr[1]:999)-34),{size:50})}}
 else if(s.lay==='C'){glossRailLater=true;withCam(s,t,s.fx||W/2,s.fy||H*0.45,()=>drawScene(s,t,{}));if(cap==='word')wordCaption(t,s.capY||CUT_CAP_Y);if(!/card|poem|chap/.test(s.scene||''))glossRail(t)}
 else{withCam(s,t,s.fx||W/2,s.fy||H*0.45,()=>drawScene(s,t,{}));if(cap==='word')wordCaption(t,s.capY||CUT_CAP_Y);if(!/card|poem|chap/.test(s.scene||''))glossRail(t)}}
let CUR_SHOT=null;
function bottomShade(){const gr=g.createLinearGradient(0,H*0.6,0,H);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(0,0,0,0.30)');g.fillStyle=gr;g.fillRect(0,H*0.6,W,H*0.4)}

// ---------- transitions ----------
const TRD={bloom:0.6,drop:0.75,whip:0.32,ripple:0.7};
function inTransition(t){const i=shotAt(t),s=SHOTS[i];const d=TRD[s.tr];return d&&i>0&&t-s.t0<d?{i,s,k:(t-s.t0)/d}:null}
function onLayer(n,fn){const L=LAYER[n];const pg=g;g=L.x;resetCtx(g);g.clearRect(0,0,W,H);fn();g=pg;return L.c}
function drawFrame(t){const tr=inTransition(t);if(tr&&LOG)LOG.trans=true;
 if(!tr){drawShot(shotAt(t),t);return}
 const {i,s,k}=tr,prev=SHOTS[i-1];
 if(s.tr==='bloom'){// ink bloom opens from a point that is never on the face
  drawShot(i-1,t,{exiting:true});const fr=faceRect();const p=eio(k);let [bx,by]=s.bp||[W*0.14,H*0.1];
  if(fr&&bx>fr[0]-60&&bx<fr[2]+60&&by>fr[1]-60&&by<fr[3]+60){bx=fr[0]>W/2?W*0.1:W*0.9;by=H*0.08}
  const img=onLayer(0,()=>drawShot(i,t));const r=p*1700+4;if(LOG)LOG.blooms.push({b:bboxPhys(bx-r,by-r,bx+r,by+r).map(Math.round),k:+k.toFixed(3),origin:bboxPhys(bx,by,bx,by).slice(0,2).map(Math.round)});
  g.save();bloomPath(g,bx,by,r,i*7);g.clip();g.setTransform(1,0,0,1,0,0);g.drawImage(img,0,0);g.restore();
  g.save();bloomPath(g,bx,by,r,i*7);g.strokeStyle=`rgba(225,236,255,${0.5*(1-p)})`;g.lineWidth=6*(1-p)+1;g.stroke();g.restore()}
 else if(s.tr==='whip'){// fast slide with motion blur (the sub-frame accumulation does the smear)
  const p=eio(k),dir=s.dir||1;g.save();g.translate(-dir*W*p,0);drawShot(i-1,t,{exiting:true});g.restore();g.save();g.translate(dir*W*(1-p),0);drawShot(i,t);g.restore()}
 else if(s.tr==='drop'||s.tr==='ripple'){// a drop falls through the old shot; its splash ring opens the new one
  let [bx,by]=s.bp||[W/2,H*0.4];{const fr=faceRect();if(fr&&bx>fr[0]-80&&bx<fr[2]+80&&by>fr[1]-80&&by<fr[3]+80){by=Math.max(SAFE_TOP,fr[1]-140);if(by>fr[1]-80)bx=fr[0]>W/2?W*0.15:W*0.85}}const fall=cl(k/0.35),p=eio((k-0.3)/0.7);drawShot(i-1,t,{exiting:p>0});
  if(fall<1){glow(bx,lerp(-40,by,fall*fall),26,STYLE.cool,0.6);drop(bx,lerp(-40,by,fall*fall),9,'rgba(230,240,255,0.95)')}
  if(p>0){const img=onLayer(0,()=>drawShot(i,t));const r=p*1600+2;g.save();g.beginPath();g.arc(bx,by,r,0,7);g.clip();g.setTransform(1,0,0,1,0,0);g.drawImage(img,0,0);g.restore();
   g.save();for(let j=0;j<3;j++){g.strokeStyle=`rgba(225,236,255,${0.55*(1-p)/(j+1)})`;g.lineWidth=3-j;g.beginPath();g.arc(bx,by,Math.max(0,r-j*26),0,7);g.stroke()}g.restore();if(LOG)LOG.blooms.push({b:bboxPhys(bx-r,by-r,bx+r,by+r).map(Math.round),k:+k.toFixed(3),origin:bboxPhys(bx,by,bx,by).slice(0,2).map(Math.round)})}}
 else drawShot(i,t)}

// motion blur: average sub-frames across a 180° shutter, only where things move fast
function needsBlur(t){const tr=inTransition(t);if(tr&&(tr.s.tr==='whip'||tr.s.tr==='drop'))return 7;const i=shotAt(t),s=SHOTS[i];if(s&&s.blur&&t-s.t0<s.blur)return 5;if(s&&i>0&&t-s.t0<0.075&&s.mb!==false)return 5;return 0}
async function renderFrame(t){CUR_T=t;newLog(t);FRAME=QA.mask?null:await loadFrame(srcIndex(t));g=MAIN;resetCtx(g);g.fillStyle='#000';g.fillRect(0,0,W,H);
 const n=needsBlur(t);
 if(!n){drawFrame(t);return}
 const sh=0.5/FPS;ACX.setTransform(1,0,0,1,0,0);ACX.globalAlpha=1;ACX.clearRect(0,0,PW,PH);
 let mid=null;for(let j=0;j<n;j++){const ts=t+sh*(j/(n-1)-0.5);CUR_T=ts;newLog(t);if(j===Math.floor(n/2))mid=LOG;g=MAIN;resetCtx(g);g.fillStyle='#000';g.fillRect(0,0,W,H);drawFrame(ts);ACX.globalAlpha=1/(j+1);ACX.drawImage(MAINC,0,0)}
 LOG=mid;CUR_T=t;MAIN.setTransform(1,0,0,1,0,0);MAIN.globalAlpha=1;MAIN.drawImage(ACC,0,0);resetCtx(MAIN)}

async function init(o){CAPS=o.caps;WORDS=CAPS.flat();buildCapGroups();FACES=o.faces||null;FPS=o.fps||PRJ.fps||60;
 const fams=['Sitka Banner','Sitka Display','Sitka Text','Sitka Small','Sitka Heading','Edwardian Script ITC','Segoe UI Variable Display','Bodoni MT',...(PRJ.fonts||[])];const bad=[];
 for(const f of fams){g.font=`normal 400 40px monospace`;const a=g.measureText('Hamburgefonstiv 0123').width;g.font=`normal 400 40px "${f}",monospace`;if(g.measureText('Hamburgefonstiv 0123').width===a)bad.push(f)}
 if(typeof buildEDL==='function')buildEDL();
 const gl=GL?GL.gl:null;let ren='none';if(gl){const e=gl.getExtension('WEBGL_debug_renderer_info');ren=e?gl.getParameter(e.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER)}
 return {fontsMissing:bad,webgl:ren,shots:SHOTS.length,events:EVENTS.length}}
// what QA / render need to know about this project (qa.py reads it from <qadir>/project.json)
window.getProject=()=>({title:PRJ.title||'',aspect:PRJ.aspect||'9:16',W,H,SC,PW,PH,SAFE_TOP,SAFE_BOT,safeTop:ASPECT.safeTop,safeBot:ASPECT.safeBot,
 filmEnd:typeof FILM_END!=='undefined'?FILM_END:(PRJ.filmEnd||DUR),text:TEXT,gloss:Object.fromEntries(Object.entries(GLOSS).map(([k,v])=>[k,v.def])),fps:FPS});
window.init=init;window.renderFrame=renderFrame;window.getLog=()=>LOG;window.QA=QA;window.getShots=()=>SHOTS.map(s=>({t0:s.t0,t1:s.t1,lay:s.lay,scene:s.scene||null,tr:s.tr||'cut',id:s.id||null,cap:s.cap||null}));window.getEvents=()=>EVENTS.slice().sort((a,b)=>a.t-b.t);
