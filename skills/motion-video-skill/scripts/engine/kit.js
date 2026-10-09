// kit.js — motion-video engine core (proven on "The Voice of the Rain" v4).
// Logical canvas W x H (9:16 = 720x1280), drawn at SC=1.5 into a PW x PH canvas (1080x1920). renderFrame(t) is a pure
// function of t: every random number is seeded, nothing reads a clock. Shared by every scene file.
// EVERY project-specific constant comes from PROJECT (work/project.js, loaded before this file). Do not hard-code
// titles, names, texts, times or footage facts here.
'use strict';
const PRJ=(typeof PROJECT!=='undefined'&&PROJECT)?PROJECT:{};
// aspect presets: logical size, must-read safe band (fractions of H), split geometry ('h' = scene above / speaker below the
// seam y; 'v' = scene left / speaker right of the seam x), cutaway caption y (fraction of H), speaker anchors, S caption
// device ('chest' = kinetic stack under the chin | 'word' = boxed word at capY), speaker fit ('auto' = cover unless the
// source aspect is far from the rect's, then a rounded card on the world backdrop SPKBG). PROJECT.layout overrides any key.
const ASPECTS={
 '9:16':{W:720,H:1280,safeTop:0.14,safeBot:0.80,split:'h',seam:640,capY:0.63,sAnchor:{top:320,chinMax:930},xAnchor:{top:60,chinMax:470},sCap:'chest',fit:'auto'},
 '16:9':{W:1280,H:720,safeTop:0.08,safeBot:0.90,split:'v',seam:640,capY:0.80,sAnchor:{top:84,chinMax:540},xAnchor:{top:84,chinMax:540},sCap:'word',fit:'auto'},
 '1:1':{W:720,H:720,safeTop:0.08,safeBot:0.88,split:'v',seam:360,capY:0.78,sAnchor:{top:84,chinMax:520},xAnchor:{top:84,chinMax:540},sCap:'word',fit:'auto'}};
const ASPECT={...(ASPECTS[PRJ.aspect||'9:16']||ASPECTS['9:16']),...(PRJ.layout||{})};
// the speaker footage: frames <dir>/00001.jpg.. (frame i = time (i-1)/fps), source size w x h, n frames, dur seconds
const FOOT={dir:'vf',fps:30,w:480,h:864,n:1,dur:10,digits:5,...(PRJ.footage||{})};
const W=ASPECT.W,H=ASPECT.H,SC=1.5,PW=W*SC,PH=H*SC,DUR=FOOT.dur,SRCW=FOOT.w,SRCH=FOOT.h,NSRC=FOOT.n,SRCFPS=FOOT.fps;
const SAFE_TOP=H*ASPECT.safeTop,SAFE_BOT=H*ASPECT.safeBot;            // must-read text lives between these
const MAINC=document.getElementById('c');MAINC.width=PW;MAINC.height=PH;MAINC.style.width=PW+'px';MAINC.style.height=PH+'px';const MAIN=MAINC.getContext('2d');let g=MAIN;
const mkC=(w=PW,h=PH)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c};
const LAYER=[0,1,2,3].map(()=>{const c=mkC();return {c,x:c.getContext('2d')}});
const ACC=mkC(),ACX=ACC.getContext('2d');
function resetCtx(x){x.setTransform(SC,0,0,SC,0,0);x.globalAlpha=1;x.filter='none';x.globalCompositeOperation='source-over';x.shadowColor='rgba(0,0,0,0)';x.shadowBlur=0;x.shadowOffsetX=0;x.shadowOffsetY=0;x.letterSpacing='0px';x.setLineDash([]);x.lineCap='butt';x.lineJoin='miter';x.textAlign='left';x.textBaseline='alphabetic'}
// never let a negative radius crash a render
{const P=CanvasRenderingContext2D.prototype,A=P.arc,E=P.ellipse,RR=P.roundRect;P.arc=function(x,y,r,a,b,c){return A.call(this,x,y,Math.max(0,r||0),a,b,c)};P.ellipse=function(x,y,rx,ry,ro,a,b,c){return E.call(this,x,y,Math.max(0,rx||0),Math.max(0,ry||0),ro,a,b,c)};P.roundRect=function(x,y,w,h,r){return RR.call(this,x,y,Math.max(0,w),Math.max(0,h),typeof r==='number'?Math.max(0,Math.min(r,w/2,h/2)):r)};const PA=Path2D.prototype.arc;Path2D.prototype.arc=function(x,y,r,a,b,c){return PA.call(this,x,y,Math.max(0,r||0),a,b,c)}}

// ---------- palette & type (STYLE is set by the chosen art direction) ----------
const STYLE={accent:'#F2C46B',accentRGB:'242,196,107',accentInk:'#9A6714',ink:'#17141D',night:'#05070F',paper:'#EEE6D5',cool:'200,215,255'};
const FAM={display:'"Sitka Banner","Sitka Display","Palatino Linotype",Georgia,serif',displayS:'"Sitka Display","Sitka Banner",Georgia,serif',head:'"Sitka Heading","Sitka Display",Georgia,serif',text:'"Sitka Text","Sitka Small","Palatino Linotype",Georgia,serif',small:'"Sitka Small","Sitka Text",Georgia,serif',script:'"Edwardian Script ITC","Segoe Script",cursive',sans:'"Segoe UI Variable Display","Segoe UI",Arial,sans-serif',sansB:'"Segoe UI Variable Display","Segoe UI",Arial,sans-serif',bodoni:'"Bodoni MT","Sitka Banner",Georgia,serif'};
// canvas font strings MUST be "style weight SIZE family" — a malformed one silently falls back to 10px
const F=(size,fam=FAM.text,wt='400',st='normal')=>`${st} ${wt} ${+size.toFixed(2)}px ${fam}`;

// ---------- math ----------
const cl=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),lerp=(a,b,k)=>a+(b-a)*k,inv=(a,b,x)=>cl((x-a)/(b-a));
const eo=x=>1-Math.pow(1-cl(x),3),ei=x=>Math.pow(cl(x),3),eio=x=>{x=cl(x);return x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2},eo5=x=>1-Math.pow(1-cl(x),5);
const spr=(x,w=14,z=0.55)=>{if(x<=0)return 0;const wd=w*Math.sqrt(1-z*z);return 1-Math.exp(-z*w*x)*(Math.cos(wd*x)+z*w/wd*Math.sin(wd*x))};
const sprH=x=>spr(x,9,0.78),sprS=x=>spr(x,16,0.42),sprP=x=>spr(x,18,0.5);
function RNG(s){s=(Math.abs(Math.floor(s))>>>0)%2147483646+1;return()=>(s=(s*16807)%2147483647)/2147483647}
const hash=n=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x)};
function vnoise(x,seed=0){const i=Math.floor(x),f=x-i,u=f*f*(3-2*f);return lerp(hash(i+seed*57.31),hash(i+1+seed*57.31),u)*2-1}
function fbm(x,seed=0,o=4){let a=0,amp=0.5,fr=1;for(let k=0;k<o;k++){a+=amp*vnoise(x*fr,seed+k*13);amp*=0.5;fr*=2.03}return a}
function n2(x,y,s=0){const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,ux=fx*fx*(3-2*fx),uy=fy*fy*(3-2*fy);const h=(a,b)=>hash(a*157.1+b*311.7+s*91.3);return lerp(lerp(h(ix,iy),h(ix+1,iy),ux),lerp(h(ix,iy+1),h(ix+1,iy+1),ux),uy)*2-1}
const gauss=(x,m,s)=>Math.exp(-(((x-m)/s)**2));
const hex=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
const mixc=(a,b,k)=>{const A=hex(a),B=hex(b);return `rgb(${A.map((v,i)=>Math.round(lerp(v,B[i],cl(k)))).join(',')})`};
const mixrgb=(a,b,k)=>{const A=a.split(',').map(Number),B=b.split(',').map(Number);return A.map((v,i)=>Math.round(lerp(v,B[i],cl(k)))).join(',')};

// ---------- transcript ----------
let CAPS=[],WORDS=[];
// word normaliser: Unicode letters/digits kept, so WT() works in any language (identical to v4's for English)
const norm=s=>String(s).normalize('NFC').toLowerCase().replace(/[’‘]/g,"'").replace(/[^\p{L}\p{M}\p{N}']/gu,'');
// WT(word, after): start time of the first spoken occurrence of `word` at or after `after`
function WT(word,after=0){word=norm(word);for(const w of WORDS){if(w[0]>=after-0.001&&norm(w[2])===word)return w[0]}console.log('WTMISS',word,after);return after}
function WE(word,after=0){word=norm(word);for(const w of WORDS){if(w[0]>=after-0.001&&norm(w[2])===word)return w[1]}return after}
function wordAt(t,hold=0.45){let best=null;for(const w of WORDS){if(w[0]-0.04<=t){best=w}else break}if(!best)return null;const nx=WORDS[WORDS.indexOf(best)+1];const end=nx?Math.min(nx[0]-0.04,best[1]+hold):best[1]+hold;return t<=Math.max(end,best[1]+0.08)?best:null}
function capAt(t){return CAPS.find(k=>t>=k[0][0]-0.08&&t<k[k.length-1][1]+0.3)}

// ---------- QA log (read by render.mjs / qa.py) ----------
const QA={mask:false,hideText:false,speakerOnly:false,on:false};let LOG=null,CLIP=null,TGRP=null;
function newLog(t){LOG={t,texts:[],faces:[],spk:[],poem:[],gloss:[],shot:null,lay:null,blooms:[],speakerVisible:false,trans:false}}
function logPoem(li,str,lit){if(LOG)LOG.poem.push({li,s:str,lit})}
function logGloss(word,def){if(LOG)LOG.gloss.push({word,def})}
function bboxPhys(x0,y0,x1,y1){const m=g.getTransform();const P=[[x0,y0],[x1,y0],[x0,y1],[x1,y1]].map(([x,y])=>[m.a*x+m.c*y+m.e,m.b*x+m.d*y+m.f]);return [Math.min(...P.map(p=>p[0])),Math.min(...P.map(p=>p[1])),Math.max(...P.map(p=>p[0])),Math.max(...P.map(p=>p[1]))]}
// kind: 'must' (must be read) | 'deco' (decorative art) ; edge: {stroke:'#000',w:px} or {plate:'#hex'} for contrast
function logText(s,x0,y0,x1,y1,size,col,kind='must',edge=null,alpha=1){if(!LOG||!s||!s.trim())return;let b=bboxPhys(x0,y0,x1,y1);let clipped=false;
 if(CLIP){const c=CLIP;const nb=[Math.max(b[0],c[0]),Math.max(b[1],c[1]),Math.min(b[2],c[2]),Math.min(b[3],c[3])];if(nb[2]<=nb[0]||nb[3]<=nb[1])return;clipped=(nb[0]>b[0]+1||nb[1]>b[1]+1||nb[2]<b[2]-1||nb[3]<b[3]-1);b=nb}
 const m=g.getTransform(),scale=Math.hypot(m.b,m.d);LOG.texts.push({s,grp:TGRP,b:b.map(v=>Math.round(v)),px:+(size*scale).toFixed(1),col,kind,edge,alpha:+(alpha*g.globalAlpha).toFixed(2),clipped})}
function pushClip(x,y,w,h){g.save();g.beginPath();g.rect(x,y,w,h);g.clip();const prev=CLIP;const b=bboxPhys(x,y,x+w,y+h);CLIP=prev?[Math.max(b[0],prev[0]),Math.max(b[1],prev[1]),Math.min(b[2],prev[2]),Math.min(b[3],prev[3])]:b;return prev}
function popClip(prev){g.restore();CLIP=prev}

// ---------- textures & sprites ----------
const SPR={};
function sprite(rgb,soft=0.35){const k=rgb+'|'+soft;if(SPR[k])return SPR[k];const r=96,cv=document.createElement('canvas');cv.width=cv.height=r*2;const x=cv.getContext('2d');const gr=x.createRadialGradient(r,r,0,r,r,r);gr.addColorStop(0,`rgba(${rgb},1)`);gr.addColorStop(soft,`rgba(${rgb},0.4)`);gr.addColorStop(1,`rgba(${rgb},0)`);x.fillStyle=gr;x.fillRect(0,0,2*r,2*r);return SPR[k]=cv}
function glow(x,y,rad,rgb,a=1,soft=0.35){if(a<=0.003||rad<=0.5)return;const pa=g.globalAlpha;g.globalAlpha=pa*Math.min(1,a);g.drawImage(sprite(rgb,soft),x-rad,y-rad,rad*2,rad*2);g.globalAlpha=pa}
const PAPER=mkC();(()=>{const x=PAPER.getContext('2d');x.scale(SC,SC);x.fillStyle='#EEE6D5';x.fillRect(0,0,W,H);const r=RNG(77);
 for(let i=0;i<26000;i++){x.fillStyle=r()<.5?`rgba(110,85,50,${0.02+r()*0.05})`:`rgba(255,255,255,${0.05+r()*0.08})`;x.fillRect(r()*W,r()*H,0.7+r()*1.6,0.7+r()*1.6)}
 for(let i=0;i<700;i++){x.strokeStyle=`rgba(120,95,60,${0.03+r()*0.06})`;x.lineWidth=0.5;x.beginPath();const px=r()*W,py=r()*H,a=r()*6.28,l=10+r()*50;x.moveTo(px,py);x.quadraticCurveTo(px+Math.cos(a+0.6)*l/2,py+Math.sin(a+0.6)*l/2,px+Math.cos(a)*l,py+Math.sin(a)*l);x.stroke()}
 const vg=x.createRadialGradient(W/2,H*0.45,H*0.25,W/2,H*0.5,H*0.8);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(90,65,30,0.28)');x.fillStyle=vg;x.fillRect(0,0,W,H)})();
const GRAINS=[0,1,2,3].map(s=>{const cv=document.createElement('canvas');cv.width=PW/2;cv.height=PH/2;const x=cv.getContext('2d');const id=x.createImageData(PW/2,PH/2);const r=RNG(s*991+7);for(let i=0;i<id.data.length;i+=4){const v=128+(r()-0.5)*100;id.data[i]=id.data[i+1]=id.data[i+2]=v;id.data[i+3]=255}x.putImageData(id,0,0);return cv});
function grain(t,a=0.06){g.save();g.globalCompositeOperation='overlay';g.globalAlpha=a;g.drawImage(GRAINS[Math.floor(t*12)%4],0,0,W,H);g.restore()}
function vignette(a=0.5,c='0,0,0'){const vg=g.createRadialGradient(W/2,H*0.45,H*0.3,W/2,H*0.5,H*0.85);vg.addColorStop(0,`rgba(${c},0)`);vg.addColorStop(1,`rgba(${c},${a})`);g.fillStyle=vg;g.fillRect(-W,-H,3*W,3*H)}

// ---------- drawing helpers ----------
function sky(top,bot,y0=0,y1=H){const gr=g.createLinearGradient(0,y0,0,y1);gr.addColorStop(0,top);gr.addColorStop(1,bot);g.fillStyle=gr;g.fillRect(-W,-H,3*W,3*H)}
function sky3(a,b,c,y0=0,y1=H,m=0.55){const gr=g.createLinearGradient(0,y0,0,y1);gr.addColorStop(0,a);gr.addColorStop(m,b);gr.addColorStop(1,c);g.fillStyle=gr;g.fillRect(-W,-H,3*W,3*H)}
const mw=(s,size,fam=FAM.text,wt='400',st='normal',ls=0)=>{g.save();g.font=F(size,fam,wt,st);g.letterSpacing=ls+'px';const w=g.measureText(s).width;g.restore();return w};
function shadowed(fn,blur=16,a=0.6,dy=2){g.save();g.shadowColor=`rgba(0,0,0,${a})`;g.shadowBlur=blur*SC;g.shadowOffsetY=dy*SC;fn();g.restore()}
// plain text. opt: {st,ls,kind,edge,stroke:[col,w],shadow:[blur,a]}
function T(s,x,y,size,col,fam=FAM.text,wt='400',al='center',a=1,opt={}){if(a<=0.003||!s)return;g.save();g.globalAlpha*=a;g.font=F(size,fam,wt,opt.st||'normal');g.letterSpacing=(opt.ls||0)+'px';g.textAlign=al;g.textBaseline='middle';
 const w=g.measureText(s).width,x0=al==='center'?x-w/2:al==='right'?x-w:x;
 if(opt.shadow){g.shadowColor=`rgba(0,0,0,${opt.shadow[1]})`;g.shadowBlur=opt.shadow[0]*SC;g.shadowOffsetY=1.5*SC}
 if(!QA.hideText){if(opt.stroke){g.lineJoin='round';g.lineWidth=opt.stroke[1];g.strokeStyle=opt.stroke[0];g.strokeText(s,x,y);g.shadowColor='rgba(0,0,0,0)'}g.fillStyle=col;g.fillText(s,x,y)}
 logText(s,x0,y-size*0.5,x0+w,y+size*0.5,size,col,opt.kind||'must',opt.edge||(opt.stroke?{stroke:opt.stroke[0],w:opt.stroke[1]*SC}:null),a);g.restore();return w}
// letters rise from blur into focus on springs, one after another
function rise(s,x,y,size,col,t0,t,fam=FAM.text,wt='400',stag=0.03,al='center',opt={}){if(t<t0||!s)return;g.save();g.font=F(size,fam,wt,opt.st||'normal');g.letterSpacing=(opt.ls||0)+'px';const tw=g.measureText(s).width;let cx=al==='center'?x-tw/2:al==='right'?x-tw:x;const x0=cx;g.textAlign='left';g.textBaseline='middle';g.fillStyle=col;const pa=g.globalAlpha;let any=0;
 if(opt.shadow){g.shadowColor=`rgba(0,0,0,${opt.shadow[1]})`;g.shadowBlur=opt.shadow[0]*SC;g.shadowOffsetY=1.5*SC}
 for(let i=0;i<s.length;i++){const ch=s[i],cw=g.measureText(ch).width+(opt.ls||0),k=spr(t-t0-i*stag,opt.w||11,opt.z||0.85);if(k>0.002){any=Math.max(any,k);g.globalAlpha=pa*cl(k*1.3);if(opt.blur!==false&&k<0.97)g.filter=`blur(${((1-cl(k))*7*SC).toFixed(1)}px)`;
  if(!QA.hideText){if(opt.stroke){g.lineJoin='round';g.lineWidth=opt.stroke[1];g.strokeStyle=opt.stroke[0];g.strokeText(ch,cx,y+(1-k)*size*0.32)}g.fillText(ch,cx,y+(1-k)*size*0.32)}if(opt.blur!==false)g.filter='none'}cx+=cw}
 g.globalAlpha=pa;if(any>0.3)logText(s,x0,y-size*0.5,x0+tw,y+size*0.5,size,col,opt.kind||'must',opt.edge||(opt.stroke?{stroke:opt.stroke[0],w:opt.stroke[1]*SC}:null));g.restore();return tw}
// template device: letters DROP into place one by one (falling from above, spring landing)
function dropIn(s,x,y,size,col,t0,t,fam=FAM.display,wt='600',stag=0.07,al='center',opt={}){if(t<t0||!s)return;g.save();g.font=F(size,fam,wt,opt.st||'normal');g.letterSpacing=(opt.ls||0)+'px';const tw=g.measureText(s).width;let cx=al==='center'?x-tw/2:al==='right'?x-tw:x;const x0=cx;g.textAlign='left';g.textBaseline='middle';g.fillStyle=col;const pa=g.globalAlpha;let any=0;
 for(let i=0;i<s.length;i++){const ch=s[i],cw=g.measureText(ch).width+(opt.ls||0),u=t-t0-i*stag,k=spr(u,13,0.5);if(u>0){any=Math.max(any,k);const fall=(1-k)*-(opt.fall||size*1.1);g.save();g.globalAlpha=pa*cl(u*7);g.translate(cx+cw/2,y+fall);g.rotate((1-k)*(hash(i+s.length)-0.5)*0.5);if(!QA.hideText)g.fillText(ch,-cw/2+(opt.ls||0)/2,0);g.restore()}cx+=cw}
 g.globalAlpha=pa;if(any>0.5)logText(s,x0,y-size*0.5,x0+tw,y+size*0.5,size,col,opt.kind||'must',opt.edge||null);g.restore();return tw}
function drop(x,y,s,col){g.beginPath();g.moveTo(x,y-s*1.25);g.bezierCurveTo(x+s*.95,y-s*.1,x+s*.8,y+s*.85,x,y+s*.85);g.bezierCurveTo(x-s*.8,y+s*.85,x-s*.95,y-s*.1,x,y-s*1.25);g.fillStyle=col;g.fill()}
function bloomPath(c,cx,cy,r,seed){c.beginPath();const p1=hash(seed)*6.28,p2=hash(seed+1)*6.28,p3=hash(seed+2)*6.28;for(let i=0;i<=120;i++){const a=i/120*Math.PI*2;const rr=Math.max(0,r*(1+0.07*Math.sin(3*a+p1)+0.045*Math.sin(7*a+p2)+0.03*Math.sin(13*a+p3)));c.lineTo(cx+Math.cos(a)*rr,cy+Math.sin(a)*rr)}c.closePath()}
function stars(t,n,seed,x,y,w,h,a=1){if(a<=0.01)return;const r=RNG(seed);g.save();g.fillStyle='#fff';for(let i=0;i<n;i++){const sx=x+r()*w,sy=y+r()*h,b=r(),ph=r()*6;const tw=0.6+0.4*Math.sin(t*(0.7+b*2.2)+ph);g.globalAlpha=a*(0.15+0.85*b*b)*tw;const s=b>0.94?2:1.1;g.fillRect(sx,sy,s,s);if(b>0.975)glow(sx+1,sy+1,10,'200,220,255',0.45*a*tw)}g.restore()}
function bokeh(t,n,seed,a=0.4,y0=0,y1=H,cols=[STYLE.accentRGB,'130,165,255']){const r=RNG(seed);for(let i=0;i<n;i++){const x=r()*W+Math.sin(t*0.13+i)*28,y=y0+r()*(y1-y0)+Math.cos(t*0.1+i*2)*16,rad=22+r()*85,c=r()<0.55?cols[0]:cols[1];glow(x,y,rad,c,a*(0.2+0.5*r()),0.82)}}
function rain(t,n,seed,a=0.5,x=0,y=0,w=W,h=H,len=30,slant=5,speed=1,col='210,225,255'){if(a<=0.01)return;const r=RNG(seed);g.save();g.beginPath();g.rect(x,y,w,h);g.clip();g.strokeStyle=`rgb(${col})`;g.lineCap='round';
 const P=[new Path2D(),new Path2D()];for(let i=0;i<n;i++){const px=r(),sp=(800+r()*700)*speed,ph=r(),th=r()<0.28?1:0,ln=len*(0.6+r()*0.8);const yy=y-80+((t*sp/(h+160)+ph)%1)*(h+160),xx=x+px*w;P[th].moveTo(xx,yy);P[th].lineTo(xx-slant,yy+ln)}
 g.globalAlpha=a*0.4;g.lineWidth=0.8;g.stroke(P[0]);g.globalAlpha=a*0.7;g.lineWidth=1.4;g.stroke(P[1]);g.restore()}
// a dry-brush stroke laid down left to right
function brush(x,y,w,h,prog,seed,col='#1B2350'){if(prog<=0)return;const x1=x+w*prog;g.save();g.fillStyle=col;g.beginPath();const N=30;
 for(let i=0;i<=N;i++){const u=i/N;g.lineTo(lerp(x,x1,u),y-h/2+vnoise(u*5+seed,seed)*h*0.07+(u<0.05?h*0.12*(1-u/0.05):0))}
 for(let i=N;i>=0;i--){const u=i/N;g.lineTo(lerp(x,x1,u)+(i===N?vnoise(seed,3)*8:0),y+h/2+vnoise(u*6+seed+9,seed)*h*0.09)}
 g.closePath();g.globalAlpha*=0.94;g.fill();g.globalAlpha=0.4;g.strokeStyle='rgba(0,0,0,0.5)';g.lineWidth=0.8;
 for(let b=0;b<9;b++){const yy=y-h*0.42+b*h*0.105;g.beginPath();g.moveTo(x+3,yy);g.lineTo(Math.max(x+3,x1-6-hash(b+seed)*w*0.18),yy+vnoise(b,seed)*2);g.stroke()}g.restore()}
// editorial annotation: dot, leader line, small caps + italic
function label(t,t0,t1,ax,ay,lx,ly,cap,txt,ink=false){const k=eo((t-t0)/0.5),o=t1?eo((t-t1)/0.35):0;if(k<=0||o>=1)return;g.save();g.globalAlpha=1-o;const c=ink?'rgba(23,20,29,':'rgba(255,255,255,';
 g.strokeStyle=c+'0.75)';g.lineWidth=1;g.beginPath();g.moveTo(ax,ay);g.lineTo(lerp(ax,lx,k),lerp(ay,ly,k));g.stroke();g.fillStyle=c+'1)';g.beginPath();g.arc(ax,ay,4*k,0,7);g.fill();g.strokeStyle=c+'0.45)';g.beginPath();g.arc(ax,ay,11*k+Math.sin(t*3)*1.5,0,7);g.stroke();
 const al=lx<ax?'right':'left',off=lx<ax?-12:12;rise(cap,lx+off,ly-20,19,ink?'#7A4E0E':STYLE.accent,t0+0.2,t,FAM.sans,'600',0.012,al,{ls:5,blur:false,shadow:ink?null:[8,0.8]});
 rise(txt,lx+off,ly+14,32,ink?STYLE.ink:'#fff',t0+0.3,t,FAM.text,'400',0.016,al,{st:'italic',blur:false,shadow:ink?null:[12,0.8]});g.restore()}

// ---------- the speaker (never recoloured, never keyed, face never covered) ----------
let FACES=null;const fcache=new Map();let FRAME=null;
function srcIndex(t){return Math.min(NSRC,Math.max(1,Math.floor(t*SRCFPS+1e-4)+1))}
// FOOT.dir is relative to film.html ('vf') or absolute ('C:/x/vf' -> file:///C:/x/vf)
const FOOTURL=/^[A-Za-z]:[\\/]/.test(FOOT.dir)?'file:///'+FOOT.dir.replace(/\\/g,'/'):FOOT.dir;
function loadFrame(i){if(fcache.has(i))return fcache.get(i);const p=new Promise(r=>{const im=new Image();im.onload=()=>r(im);im.onerror=()=>r(null);im.src=FOOTURL+'/'+String(i).padStart(FOOT.digits,'0')+'.jpg'});fcache.set(i,p);if(fcache.size>40)fcache.delete(fcache.keys().next().value);return p}
// face_boxes.json is padded 15% sides / 30% up / 20% down (neck). Re-pad from the raw Haar box: 12% sides, 26% up (hair), 7% down (chin).
function faceBox(i){if(!FACES)return [SRCW*0.083,SRCH*0.308,SRCW*0.69,SRCH*0.42];const b=FACES[Math.min(FACES.length-1,Math.max(0,i-1))];const rw=b[2]/1.3,rh=b[3]/1.5,rx=b[0]+0.15*rw,ry=b[1]+0.30*rh;return [rx-0.12*rw,ry-0.26*rh,rw*1.24,rh*1.33]}
const FMED={};function faceMed(t0,t1){const k=t0.toFixed(2)+'|'+t1.toFixed(2);if(FMED[k])return FMED[k];const a=srcIndex(t0),b=Math.max(a,srcIndex(t1)-1);const xs=[],ys=[],ws=[],hs=[];for(let i=a;i<=b;i+=2){const f=faceBox(i);xs.push(f[0]+f[2]/2);ys.push(f[1]+f[3]/2);ws.push(f[2]);hs.push(f[3])}const md=v=>v.sort((p,q)=>p-q)[Math.floor(v.length/2)];return FMED[k]={cx:md(xs),cy:md(ys),w:md(ws),h:md(hs)}}
// draw the footage into rect r, scaled to cover, zoomed about the face; anchor = where the face centre sits in r (fractions)
let SPK=null;// last speaker placement: {s,dx,dy,r}
// anchor: [fx,fy] = face centre at fractions of r, or {top:y, fx} = top of the face box (hair) at y px below r.y
// opt.entry (>=1): extra zoom about the chin (face-box bottom centre) for the template's zoom-out settle — captions below never get covered
// speaker grade (OFF unless the owner allows it: PROJECT.speakerLook.grade): highlights pulled down ~25%, near-white wall
// cooled toward blue-grey, skin and warm clothes protected (warm/saturated mask), 25% vignette inside the speaker rect.
// Deterministic GL pass. VotR v4 used it (owner decision 2026-10-08). radius/rim = the rounded speaker card.
const SPKLOOK={grade:false,radius:34,rim:'rgba(255,255,255,0.55)',...(PRJ.speakerLook||{})};
let SPKGRADE=!!SPKLOOK.grade,SPKCARD=null;const SPKBL=document.createElement('canvas');SPKBL.width=PW;SPKBL.height=PH;const GRADE_FS=`#version 300 es
precision highp float;in vec2 uv;out vec4 o;uniform sampler2D F;
void main(){vec3 c=texture(F,uv).rgb;float L=dot(c,vec3(0.2126,0.7152,0.0722));float mx=max(c.r,max(c.g,c.b)),mn=min(c.r,min(c.g,c.b)),sat=(mx-mn)/(mx+1e-4);
 float warm=smoothstep(0.015,0.07,c.r-c.b)*smoothstep(0.05,0.16,sat);
 float k=0.62,Lc=L<k?L:k+(L-k)*0.5;vec3 g1=c*(Lc/max(L,1e-4));
 float neutral=(1.-smoothstep(0.04,0.14,sat))*smoothstep(0.45,0.85,L);g1=mix(g1,g1*vec3(0.89,0.95,1.05),neutral*(1.-warm));
 g1=mix(g1,mix(c,g1,0.3)*vec3(1.02,1.0,0.98),warm);o=vec4(clamp(g1,0.,1.),1.);}`;
const GRADEK=Math.min(2,2560/Math.max(SRCW,SRCH));   // grade pass resolution: 2x the source, capped at 2560 px
function gradeFrame(src){return GL.run('spkgrade',GRADE_FS,{},{F:[3,src]},Math.round(SRCW*GRADEK),Math.round(SRCH*GRADEK))}
// cover scale, unless fit is 'contain' (or 'auto' and the source aspect is far from the rect's): then the speaker floats in
// a rounded card on the world backdrop (SPKBG)
function spkFit(r,fit=ASPECT.fit){const ra=(r.w/r.h)/(SRCW/SRCH),far=Math.max(ra,1/ra)>1.7;return fit==='contain'||(fit==='auto'&&far)?'contain':'cover'}
function spkS0(r,fit){return spkFit(r,fit)==='contain'?Math.min(r.w/SRCW,r.h/SRCH):Math.max(r.w/SRCW,r.h/SRCH)}
function speaker(r,zoom=1,shot=[0,DUR],anchor={top:40},opt={}){const s0=spkS0(r,opt.fit);let s=s0*zoom;const fm=faceMed(shot[0],shot[1]);
 let dx,dy;if(Array.isArray(anchor)){dx=r.x+r.w*anchor[0]-fm.cx*s;dy=r.y+r.h*anchor[1]-fm.cy*s}else{dx=r.x+r.w*(anchor.fx??0.5)-fm.cx*s;dy=r.y+anchor.top-(fm.cy-fm.h/2)*s;if(anchor.chinMax!=null)dy=Math.min(dy,r.y+anchor.chinMax-(fm.cy+fm.h/2)*s)}const cx_=(d,s)=>SRCW*s>=r.w?Math.min(r.x,Math.max(r.x+r.w-SRCW*s,d)):r.x+(r.w-SRCW*s)/2,cy_=(d,s)=>SRCH*s>=r.h?Math.min(r.y,Math.max(r.y+r.h-SRCH*s,d)):d;dx=cx_(dx,s);dy=cy_(dy,s);
 const e=opt.entry||1;if(e>1.0001){const px=fm.cx*s+dx,py=(fm.cy+fm.h/2)*s+dy;s*=e;dx=px-(px-dx)*e;dy=py-(py-dy)*e;dx=cx_(dx,s);dy=cy_(dy,s)}
 g.save();g.beginPath();g.rect(r.x,r.y,r.w,r.h);g.clip();
 if(QA.mask){g.fillStyle='#000';g.fillRect(r.x,r.y,r.w,r.h)}else if(FRAME){const gap=SRCW*s<r.w-0.5||SRCH*s<r.h-0.5;if(gap){const m=14,cx0=Math.max(dx,r.x+m),cy0=Math.max(dy,r.y+m),cx1=Math.min(dx+SRCW*s,r.x+r.w-m),cy1=Math.min(dy+SRCH*s,r.y+r.h-m),rad=SPKLOOK.radius;if(typeof SPKBG==='function')SPKBG(CUR_T,r);else{g.fillStyle='#1d2a3a';g.fillRect(r.x,r.y,r.w,r.h)}g.save();g.shadowColor='rgba(0,0,0,0.45)';g.shadowBlur=30*SC;g.shadowOffsetY=10*SC;g.beginPath();g.roundRect(cx0,cy0,cx1-cx0,cy1-cy0,rad);g.fillStyle='#000';g.fill();g.restore();g.beginPath();g.roundRect(cx0,cy0,cx1-cx0,cy1-cy0,rad);g.clip();SPKCARD=[cx0,cy0,cx1,cy1]}else SPKCARD=null;const src=SPKGRADE?gradeFrame(FRAME):FRAME;g.drawImage(src,dx,dy,SRCW*s,SRCH*s);if(SPKGRADE){const vg=g.createRadialGradient(r.x+r.w/2,r.y+r.h*0.45,Math.min(r.w,r.h)*0.35,r.x+r.w/2,r.y+r.h*0.45,Math.hypot(r.w,r.h)*0.62);vg.addColorStop(0,'rgba(6,8,16,0)');vg.addColorStop(1,'rgba(6,8,16,0.25)');g.fillStyle=vg;g.fillRect(r.x,r.y,r.w,r.h)}if(SPKCARD&&SPKLOOK.rim){g.strokeStyle=SPKLOOK.rim;g.lineWidth=2;g.beginPath();g.roundRect(SPKCARD[0]+1,SPKCARD[1]+1,SPKCARD[2]-SPKCARD[0]-2,SPKCARD[3]-SPKCARD[1]-2,SPKLOOK.radius-1);g.stroke()}}g.restore();
 SPK={s,dx,dy,r};if(LOG)LOG.spk.push({b:bboxPhys(r.x,r.y,r.x+r.w,r.y+r.h).map(Math.round),exiting:!!opt.exiting});const fb=faceBox(srcIndex(CUR_T));const fx0=Math.max(r.x,fb[0]*s+dx),fy0=Math.max(r.y,fb[1]*s+dy),fx1=Math.min(r.x+r.w,(fb[0]+fb[2])*s+dx),fy1=Math.min(r.y+r.h,(fb[1]+fb[3])*s+dy);
 if(LOG&&fx1>fx0&&fy1>fy0){LOG.faces.push({b:bboxPhys(fx0,fy0,fx1,fy1).map(Math.round),exiting:!!opt.exiting});LOG.speakerVisible=true}
 return {s,dx,dy,face:[fx0,fy0,fx1,fy1]}}
// face rect (logical) for the current frame under the current placement
function faceRect(){if(!SPK)return null;const fb=faceBox(srcIndex(CUR_T)),{s,dx,dy}=SPK;return [fb[0]*s+dx,fb[1]*s+dy,(fb[0]+fb[2])*s+dx,(fb[1]+fb[3])*s+dy]}

// ---------- captions (the template's grammar) ----------
// caption config (PROJECT.captions): keyWords = words that become the big key word of a chest caption (else the longest
// word of 5+ letters); goldWords / goldCapWords = the rationed gold accent (chest key word / boxed word) from goldFrom s;
// keyClock = [[t, colour]..] key-word colour over the film's light arc; funcWords = extra function words for grouping
const CAPCFG={keyWords:[],funcWords:[],goldWords:[],goldCapWords:null,goldFrom:0,goldCol:'#FFD36E',keyClock:[[0,'#C9DBFF']],...(PRJ.captions||{})};
const wordsRe=a=>a&&a.length?new RegExp('^('+a.map(w=>String(w).replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|')+')$','iu'):/(?!)/;
const KEY=wordsRe(CAPCFG.keyWords);
const capClean=s=>s.replace(/[.,?!;:"“”«»¿¡।…]/g,'');
function keyIndex(cap){let ki=-1,best=0;cap.forEach((w,i)=>{const s=capClean(w[2]);if(KEY.test(s)&&s.length>best){best=s.length;ki=i}});if(ki<0){cap.forEach((w,i)=>{const s=capClean(w[2]);if(s.length>best&&s.length>=5){best=s.length;ki=i}})}return ki}
// Kinetic chest caption: small white serif words + one big bold accent key word, stacked, overlapping slightly; each word pops as spoken.
function chestCaption(t,cap,y0,y1,opt={}){if(!cap)return;TGRP='chest'+cap[0][0];let ki=keyIndex(cap);if(opt.key){const f=cap.findIndex(w=>norm(w[2])===opt.key);if(f>=0)ki=f}const ws=cap.map(w=>capClean(w[2]));const pre=ws.slice(0,Math.max(0,ki)),post=ki>=0?ws.slice(ki+1):[];
 opt={...(window.CAPOPT||{}),...opt};const sm=opt.small||38,bg=opt.big||78,famS=opt.famS||FAM.display,famB=opt.famB||FAM.display,wS=opt.wS||'600',wB=opt.wB||'700',stS=opt.stS||'normal',stB=opt.stB||'normal',colS=opt.colS||'#FFFFFF',colB=opt.colB||keyCol(t,ki>=0?cap[ki][2]:''),strk=opt.stroke||'rgba(10,8,20,0.92)';const lines=[];
 if(ki<0){lines.push({ws:cap.map((w,i)=>[w,i]),big:false})}else{if(pre.length)lines.push({ws:cap.slice(0,ki).map((w,i)=>[w,i]),big:false});lines.push({ws:[[cap[ki],ki]],big:true});if(post.length)lines.push({ws:cap.slice(ki+1).map((w,i)=>[w,ki+1+i]),big:false})}
 let hs=lines.map(L=>L.big?bg*0.86:sm*1.0);let tot=hs.reduce((a,b)=>a+b,0);
 // tight chest zone: set the whole group on ONE line (key word big) instead of shrinking a stacked block (critic r2: floor 64/110 px)
 if(lines.length>1&&(y1-y0)/tot<0.74){const all=cap.map((w,i)=>[w,i]),szs=all.map(([,i])=>i===ki?bg:sm),fams=all.map(([,i])=>i===ki?famB:famS),wts=all.map(([,i])=>i===ki?wB:wS),sts=all.map(([,i])=>i===ki?stB:stS);
  const tx=all.map(([w])=>capClean(w[2]));let tw=tx.reduce((a,s,j)=>a+mw(s,szs[j],fams[j],wts[j],sts[j]),0)+sm*0.3*(tx.length-1);const f=Math.max(0.36,Math.min(1,(W-60)/tw,(y1-y0)/(bg*1.2)));let x=(opt.cx||W/2)-tw*f/2;const yy=Math.min((y0+y1)/2,y1-bg*f*0.66);
  all.forEach(([w,i],j)=>{const S=szs[j]*f,ww=mw(tx[j],S,fams[j],wts[j],sts[j]),k=spr(t-w[0]+0.06,15,0.55);if(k>0.002){g.save();g.translate(x+ww/2,yy+(i===ki?0:S*0.12));const pk=0.55+0.45*k;g.scale(pk,pk);g.globalAlpha*=cl(k*2.2);T(tx[j],0,0,S,i===ki?colB:colS,fams[j],wts[j],'center',1,{stroke:[strk,i===ki?3:2.5],shadow:[12,0.6],st:sts[j]});g.restore()}x+=ww+sm*0.3*f});TGRP=null;return}
 const fit=Math.min(1,Math.max(0.5,(y1-y0)/tot));hs=hs.map(h=>h*fit);tot*=fit;let y=(y0+y1)/2-tot/2;const cx=opt.cx||W/2;
 lines.forEach((L,li)=>{const sz=(L.big?bg:sm)*fit,fam=L.big?famB:famS,wt=L.big?wB:wS,st=L.big?stB:stS;const tx=L.ws.map(([w])=>capClean(w[2]));const sp=mw(' ',sz,fam,wt,st);let tw=tx.reduce((a,s)=>a+mw(s,sz,fam,wt,st),0)+sp*(tx.length-1);const sc=Math.min(1,(W-70)/tw);const S=sz*sc;tw*=sc;
  const off=lines.length>1?(L.big?14:(li===0?-26:30)):0;let x=cx-tw/2+off;const yy=y+hs[li]/2;
  L.ws.forEach(([w,wi],j)=>{const s=tx[j],ww=mw(s,S,fam,wt,st),k=spr(t-w[0]+0.06,15,0.55);if(k>0.002){g.save();g.translate(x+ww/2,yy);const pk=0.55+0.45*k;g.scale(pk,pk);g.globalAlpha*=cl(k*2.2);
    const col=L.big?colB:colS;T(s,0,0,S,col,fam,wt,'center',1,{stroke:[strk,L.big?3:2.5],shadow:[12,0.6],st});g.restore()}x+=ww+sp*sc});y+=hs[li]});TGRP=null}
// Cutaway / seam caption: ONE bold white sans word with a dark outline, the word being spoken.
// Cutaway / seam caption: bold white sans with a dark outline, one word at a time; a function word rides with the next
// content word (<=3 words, >=8 frames on screen) so nothing strobes. Hard swap with a 3-frame spring settle.
const FUNCW=new Set([...(CAPCFG.funcWords||[]),'a','an','the','of','to','in','is','it','its',"it's",'and','or','but','that','this','we','you','i','my','as','by','for','from','be','so','very','our','at','on','with','has','have','been','are','there','can','could','should','will','what','how','when','then','now','into','about','some','those','them','us','here','was','were','if','because']);
let CAPG=[];
function buildCapGroups(){CAPG=[];let pend=[];const flush=()=>{if(pend.length){CAPG.push(pend);pend=[]}};
 for(const w of WORDS){const n=norm(w[2]);pend.push(w);const end=/[.,?!;:]$/.test(w[2]);if(!FUNCW.has(n)||end||pend.length>=3){if(pend.length>3){const last=pend.pop();flush();pend=[last]}flush()}}flush();
 for(let i=0;i<CAPG.length-1;i++){const a=CAPG[i],b=CAPG[i+1];if(b[0][0]-a[0][0]<0.27&&a.length+b.length<=3){CAPG.splice(i,2,[...a,...b]);i--}}}
function groupAt(t){let gi=-1;for(let i=0;i<CAPG.length;i++){if(CAPG[i][0][0]-0.04<=t)gi=i;else break}if(gi<0)return null;const G=CAPG[gi],nx=CAPG[gi+1];const end=nx&&nx[0][0]-G[G.length-1][1]<0.6?nx[0][0]-0.04:G[G.length-1][1]+0.35;return t<=Math.max(end,G[0][0]+0.27)?G:null}
function wordCaption(t,y,opt={}){opt={...(window.WORDOPT||{}),...opt};const G=groupAt(t);if(!G)return;const s=G.map(w=>capClean(w[2]).replace(/^[“"]|[”"]$/g,'')).join(' ').trim();if(!s)return;const k=spr(t-G[0][0]+0.04,26,0.7);const sz=opt.size||52;const sc=Math.min(1,(opt.maxW||W-80)/mw(s,sz,opt.fam||FAM.sansB,opt.wt||'800'));
 const gw=G.some(w=>GOLDCAPW.test(capClean(w[2]))&&w[0]>=CAPCFG.goldFrom);if(gw)opt={...opt,col:CAPCFG.goldCol};g.save();g.translate(opt.cx??W/2,y);const pk=0.94+0.06*k;g.scale(pk,pk);const fs=sz*sc,bw=mw(s,fs,opt.fam||FAM.sansB,opt.wt||'800')+fs*0.7,bh=fs*1.18;g.beginPath();g.roundRect(-bw/2,-bh/2-fs*0.04,bw,bh,Math.min(14,bh*0.28));g.fillStyle=opt.box||'rgba(21,24,38,0.86)';g.fill();T(s,0,0,fs,opt.col||'#FFFFFF',opt.fam||FAM.sansB,opt.wt||'800','center',1,{stroke:[opt.stroke||'rgba(8,8,14,0.95)',2]});g.restore()}
// key-word colour follows the sky clock: gold is rationed for gratitude
const GRATW=wordsRe(CAPCFG.goldWords),GOLDCAPW=wordsRe(CAPCFG.goldCapWords&&CAPCFG.goldCapWords.length?CAPCFG.goldCapWords:CAPCFG.goldWords);
let KEYCLOCK=CAPCFG.keyClock;  // gold is rationed: only goldWords get it (critic r2)
function keyCol(t,word){if(GRATW.test(capClean(word||''))&&t>=CAPCFG.goldFrom)return CAPCFG.goldCol;let c=KEYCLOCK[0][1];for(const [a,col] of KEYCLOCK)if(t>=a)c=col;return c}

// ---------- the quoted source text (verbatim; PROJECT.text) ----------
// TEXT = the lines the film quotes word for word (a poem, a definition, a slide...). QA checks every logged line against it.
// POEM / POEM_TITLE / POEM_AUTHOR are aliases (the VotR scenes use them).
const TXT={title:PRJ.title||'',author:'',lines:[],source:'',credit:[],cardHead:'',cardFoot:'',...(PRJ.text||{})};
const TEXT=TXT.lines,TEXT_TITLE=TXT.title,TEXT_AUTHOR=TXT.author,POEM=TEXT,POEM_TITLE=TEXT_TITLE,POEM_AUTHOR=TEXT_AUTHOR;
const GLOSS=PRJ.gloss||{};        // {word:{n, line, def}}: glossary footnotes; logGloss() is checked by QA
const SOURCE=TXT.source;           // one-line credit for the quoted text
// the world kits' clocks (PROJECT.world): skyArc = colour-world sky keyframes [[t,'N'|'B'|'D'|'G'|'O'|'P'|'R'|'M']..]
// (acts/color.js), inkArc = ink-world night density [[t,density]..] (acts/style.js), hlGoldFrom = highlighter turns gold,
// dawn = [start, ramp s] of the colour world's sunrise wash, dawnInk = same for the ink world, moonSet = ink-world moon gone
const WORLD={skyArc:null,inkArc:null,hlGoldFrom:1e9,dawn:[1e9,4],dawnInk:[1e9,6],moonSet:0,...(PRJ.world||{})};
const FN_MARK=['','¹','²','³','⁴'];
// cue the words of poem line li to times: align to spoken words between [a,b] when quoted, else spread evenly
// opt.strict: words after the last spoken match stay unlit (Infinity) instead of being spread to b
function lineCues(li,a,b,opt={}){const ws=TEXT[li].split(' ');const sp=WORDS.filter(w=>w[0]>=a-0.05&&w[0]<=b);const out=[];let j=0;let hits=0;
 for(let i=0;i<ws.length;i++){const n=norm(ws[i]);let found=-1;for(let q=j;q<Math.min(sp.length,j+4);q++){if(norm(sp[q][2])===n){found=q;break}}if(found>=0){out[i]=sp[found][0];j=found+1;hits++}else out[i]=null}
 // fill gaps by interpolation between known anchors (or evenly over [a,b])
 const idx=out.map((v,i)=>v==null?null:i).filter(v=>v!=null);for(let i=0;i<ws.length;i++){if(out[i]!=null)continue;const L=idx.filter(q=>q<i).pop(),R=idx.find(q=>q>i);const ta=L!=null?out[L]:a,tb=R!=null?out[R]:b,ia=L!=null?L:-1,ib=R!=null?R:ws.length;out[i]=lerp(ta,tb,(i-ia)/(ib-ia))}
 if(opt.strict){const last=idx.length?idx[idx.length-1]:-1;for(let i=last+1;i<ws.length;i++)out[i]=Infinity}
 return out}

// ---------- WebGL2 helper (off-screen; drawn into the 2D canvas) ----------
const GL=(()=>{const c=document.createElement('canvas');c.width=PW;c.height=PH;const gl=c.getContext('webgl2',{preserveDrawingBuffer:true,premultipliedAlpha:false,alpha:true});if(!gl)return null;
 const vs=`#version 300 es\nin vec2 p;out vec2 uv;void main(){uv=p*0.5+0.5;gl_Position=vec4(p,0.,1.);}`;const buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
 const progs={};function prog(name,fs){if(progs[name])return progs[name];const mk=(type,src)=>{const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))console.log('GLERR',name,gl.getShaderInfoLog(s));return s};const p=gl.createProgram();gl.attachShader(p,mk(gl.VERTEX_SHADER,vs));gl.attachShader(p,mk(gl.FRAGMENT_SHADER,fs));gl.bindAttribLocation(p,0,'p');gl.linkProgram(p);return progs[name]=p}
 const texs={};function tex(slot,src){let t=texs[slot];if(!t){t=texs[slot]=gl.createTexture()}gl.activeTexture(gl.TEXTURE0+slot);gl.bindTexture(gl.TEXTURE_2D,t);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,src);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE)}
 // run(name, fragmentSource, uniforms{name:number|[..]}, textures{name:[slot, imageSource]}, w,h) -> canvas
 function run(name,fs,U={},TX={},w=PW,h=PH){if(c.width!==w||c.height!==h){c.width=w;c.height=h}const p=prog(name,fs);gl.viewport(0,0,w,h);gl.useProgram(p);gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
  for(const [k,[slot,src]] of Object.entries(TX)){tex(slot,src);gl.uniform1i(gl.getUniformLocation(p,k),slot)}
  gl.uniform2f(gl.getUniformLocation(p,'res'),w,h);for(const [k,v] of Object.entries(U)){const l=gl.getUniformLocation(p,k);if(Array.isArray(v))[0,0,gl.uniform2f,gl.uniform3f,gl.uniform4f][v.length].call(gl,l,...v);else gl.uniform1f(l,v)}
  gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);return c}
 return {run,gl,canvas:c}})();
const GLSL_NOISE=`float h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float vn(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);return mix(mix(h21(i),h21(i+vec2(1,0)),u.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),u.x),u.y);}
float fbm(vec2 p){float a=0.,m=.5;for(int i=0;i<6;i++){a+=m*vn(p);p=mat2(1.6,1.2,-1.2,1.6)*p;m*=.5;}return a;}`;

// ---------- frame driver ----------
let CUR_T=0;
const SCENES={};          // name -> fn(t, ctx) registered by act files
const SHOTS=[];           // filled by edl.js
const EVENTS=[];          // sound/visual hit points registered by scenes and the edl: {t,type,note}
function ev(t,type,note=''){EVENTS.push({t:+t.toFixed(3),type,note})}
