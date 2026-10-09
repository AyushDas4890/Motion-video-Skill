// acts/style.js — CHOSEN direction B (unanimous critics' pick; ported from style_B.js) "Ink and Water": the whole world is sumi-e, painted live on rice paper.
// Night is ink soaked into the paper; the film's dawn is the paper showing through again.
// Owns: the B_* kit (ink clock, shaders, drops, seals, washes), STYLE/CAPOPT/WORDOPT overrides. (VotR's five style-frame
// scenes SCENES.B_* now live in examples/voice-of-the-rain/acts/style_frames.js.)
'use strict';

// ---------- palette ----------
const B={ink:'#151826',inkRGB:'21,24,38',paper:'#F1E9DA',paperRGB:'241,233,218',
 verm:'#E8553A',          // bright vermilion: key words (always with an ink stroke)
 sealDeep:'#B0361F',      // deep vermilion: marks written on paper (passes 4.5:1 on cream)
 seal:'#C23B26',          // hanko paste
 gold:'#F2C46B',goldDeep:'#9C6A1C', // gold leaf: gratitude only
 mist:'#C7CFD3',ivory:'#EDEFF5',wash:'#A9B8CF'};
Object.assign(STYLE,{accent:B.verm,accentRGB:'232,85,58',accentInk:'#A8321F',ink:B.ink,night:'#0A0D18',paper:'#EEE6D5',cool:'196,208,216'});

// global light arc = how much ink is on the paper (sky density at the top of frame)
// PROJECT.world.inkArc (VotR: [[0,1.30],[23.2,1.18],[55,1.0],[104,0.86],[143.4,0.76],[187.3,0.68],[200,0.55],[207.6,0.07],[999,0.05]]:
// night holds; dawn ramps 200->207.6 so the paper shows through on "Thank"). Default: a gentle lift over the film.
const B_ARC=WORLD.inkArc||[[0,1.0],[PRJ.filmEnd||DUR,0.6],[1e9,0.55]];
function B_ink(t){for(let i=1;i<B_ARC.length;i++){const [a,va]=B_ARC[i-1],[b,vb]=B_ARC[i];if(t<=b)return lerp(va,vb,inv(a,b,t))}return 0.02}

// ---------- caption overrides (template grammar untouched, art only) ----------
// gold-leaf words outrank every other key word; everything else gets bright vermilion with an ink edge
const B_GOLDW=wordsRe(WORLD.inkGoldWords||CAPCFG.goldWords);
window.CAPOPT={famS:FAM.display,famB:FAM.display,wS:'600',wB:'700',colS:'#FFFFFF',small:46,big:108,stroke:B.ink};
window.WORDOPT={stroke:B.ink};

// ---------- cached textures ----------
const B_C={};
function B_canvas(key,w,h,fn){if(B_C[key])return B_C[key];const c=document.createElement('canvas');c.width=w;c.height=h;fn(c.getContext('2d'),w,h);return B_C[key]=c}
// gold leaf: squares of leaf laid with seams, a metallic band, crackle and specks
const B_leaf=()=>B_canvas('leaf',640,200,(x,w,h)=>{const gr=x.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#FFEDB5');gr.addColorStop(0.3,'#F4C862');gr.addColorStop(0.58,'#C98E2C');gr.addColorStop(0.78,'#E9B24C');gr.addColorStop(1,'#F8DA90');x.fillStyle=gr;x.fillRect(0,0,w,h);
 const r=RNG(911),S=56;for(let row=0;row<5;row++){const off=(row%2)*S*0.45+r()*10;for(let col=-1;col<13;col++){const sx=col*S+off+(r()-0.5)*4,sy=row*S*0.8+(r()-0.5)*4;x.fillStyle=r()<0.5?`rgba(255,244,205,${0.06+r()*0.14})`:`rgba(120,75,10,${0.05+r()*0.1})`;x.fillRect(sx,sy,S,S*0.8);x.strokeStyle=`rgba(110,68,12,${0.22+r()*0.2})`;x.lineWidth=0.8+r();x.strokeRect(sx,sy,S,S*0.8)}}
 x.strokeStyle='rgba(120,80,20,0.22)';x.lineWidth=0.7;for(let i=0;i<70;i++){let px=r()*w,py=r()*h;x.beginPath();x.moveTo(px,py);for(let j=0;j<5;j++){px+=(r()-0.5)*30;py+=(r()-0.5)*16;x.lineTo(px,py)}x.stroke()}
 for(let i=0;i<260;i++){x.fillStyle=`rgba(255,250,225,${0.3+r()*0.6})`;x.fillRect(r()*w,r()*h,1+r()*2,1+r()*1.5)}});
// a hanko seal impression: vermilion paste, carved border, carved glyph, paste speckle
function B_sealTex(kind){return B_canvas('seal'+kind,200,200,(x,w,h)=>{const r=RNG(kind.length*131+kind.charCodeAt(0)*7);const edge=(px,py,a)=>[px+(r()-0.5)*a,py+(r()-0.5)*a];
 x.fillStyle=B.seal;x.beginPath();const P=[];for(let i=0;i<4;i++){const c=[[14,14],[186,14],[186,186],[14,186]][i],n=[[186,14],[186,186],[14,186],[14,14]][i];for(let j=0;j<12;j++){const u=j/12;P.push(edge(lerp(c[0],n[0],u),lerp(c[1],n[1],u),5))}}P.forEach(([a,b],i)=>i?x.lineTo(a,b):x.moveTo(a,b));x.closePath();x.fill();
 x.globalCompositeOperation='destination-out';x.strokeStyle='#000';x.fillStyle='#000';x.lineCap='round';
 x.lineWidth=7;x.beginPath();for(let i=0;i<=40;i++){const u=i/40*4,s=Math.floor(u)%4,f=u-Math.floor(u);const c=[[32,32],[168,32],[168,168],[32,168]][s],n=[[168,32],[168,168],[32,168],[32,32]][s];const [a,b]=edge(lerp(c[0],n[0],f),lerp(c[1],n[1],f),2.5);i?x.lineTo(a,b):x.moveTo(a,b)}x.stroke();
 if(kind==='drop'){x.lineWidth=13;x.beginPath();x.arc(100,104,46,-1.2,4.6);x.stroke();x.beginPath();x.moveTo(100,62);x.bezierCurveTo(124,96,122,124,100,126);x.bezierCurveTo(78,124,76,96,100,62);x.fill()}
 else{x.font=`normal 700 ${kind.length>1?96:110}px ${FAM.display}`;x.textAlign='center';x.textBaseline='middle';x.fillText(kind,100,108)}
 for(let i=0;i<160;i++){x.globalAlpha=0.5+r()*0.5;x.beginPath();x.arc(r()*w,r()*h,0.6+r()*2.2,0,7);x.fill()}x.globalAlpha=1})}
// critics: the seal is rationed to the title, chapter cards and the closing colophon -> B_seal is a no-op unless B_SEAL is on
let B_SEAL=false;function B_sealOn(f){B_SEAL=true;try{f()}finally{B_SEAL=false}}
function B_seal(kind,x,y,s,rot=0,a=1){if(!B_SEAL)return;g.save();g.globalAlpha*=a;g.translate(x,y);g.rotate(rot);g.drawImage(B_sealTex(kind),-s/2,-s/2,s,s);g.restore()}
// numeral / glyph mask for the wet-ink numeral shader
const B_glyph=ch=>B_canvas('gl'+ch,720,1280,(x,w,h)=>{x.fillStyle='#000';x.fillRect(0,0,w,h);x.fillStyle='#fff';x.font=`normal 700 760px ${FAM.displayS}`;x.textAlign='center';x.textBaseline='middle';x.fillText(ch,w/2,560)});
const B_scr=()=>B_canvas('scr',1800,600,()=>{});

// gold text = gold leaf. Any T() drawn in B.gold gets the leaf texture over its flat fill (QA still logs the flat gold).
const B_T0=T;
T=function(s,x,y,size,col,fam=FAM.text,wt='400',al='center',a=1,opt={}){const w=B_T0(s,x,y,size,col,fam,wt,al,a,opt);
 if(col!==B.gold||!w||a<=0.003||QA.hideText)return w;
 const m=g.getTransform(),sc=Math.hypot(m.a,m.b),pad=size*0.15,hh=size*1.5,cw=Math.min(1800,Math.ceil((w+pad*2)*sc)),ch=Math.min(600,Math.ceil(hh*sc));
 const c=B_scr(),x2=c.getContext('2d');x2.setTransform(1,0,0,1,0,0);x2.globalCompositeOperation='source-over';x2.clearRect(0,0,cw+2,ch+2);
 x2.setTransform(sc,0,0,sc,0,0);x2.font=F(size,fam,wt,opt.st||'normal');x2.letterSpacing=(opt.ls||0)+'px';x2.textAlign='left';x2.textBaseline='middle';x2.fillStyle='#fff';x2.fillText(s,pad,hh/2);
 x2.globalCompositeOperation='source-in';x2.drawImage(B_leaf(),0,0,w+pad*2,hh);
 const x0=al==='center'?x-w/2:al==='right'?x-w:x;g.save();g.globalAlpha*=a;g.drawImage(c,0,0,cw,ch,x0-pad,y-hh/2,w+pad*2,hh);g.restore();return w};

// ---------- ink helpers (2D) ----------
// deckled rice-paper sheet outline
function B_sheetPath(x,y,w,h,seed,amp=2.4){g.beginPath();const per=2*(w+h),N=Math.ceil(per/5);
 for(let i=0;i<N;i++){const u=i/N*per;let px,py,nx,ny;if(u<w){px=x+u;py=y;nx=0;ny=-1}else if(u<w+h){px=x+w;py=y+u-w;nx=1;ny=0}else if(u<2*w+h){px=x+w-(u-w-h);py=y+h;nx=0;ny=1}else{px=x;py=y+h-(u-2*w-h);nx=-1;ny=0}
  const d=(vnoise(u*0.06,seed)*0.55+vnoise(u*0.5,seed+3)*0.45)*amp;i?g.lineTo(px+nx*d,py+ny*d):g.moveTo(px+nx*d,py+ny*d)}g.closePath()}
function B_sheet(x,y,w,h,seed,opt={}){g.save();if(opt.shadow!==false){g.shadowColor=`rgba(0,0,0,${opt.sa||0.6})`;g.shadowBlur=(opt.sb||46)*SC;g.shadowOffsetY=(opt.sy||20)*SC}B_sheetPath(x,y,w,h,seed);g.fillStyle=opt.fill||'#EEE5D3';g.fill();g.restore();
 g.save();B_sheetPath(x,y,w,h,seed);g.clip();g.globalAlpha*=opt.tex??0.9;{const sw=Math.min(PW,Math.max(w,60)*SC),sh=Math.min(PH,Math.max(h,40)*SC);g.drawImage(PAPER,Math.max(0,Math.min(180+seed*37%200,PW-sw)),Math.max(0,Math.min(420+seed*53%300,PH-sh)),sw,sh,x,y,w,h)}g.globalAlpha=1;
 const lg=g.createLinearGradient(x,y,x+w*0.6,y+h);lg.addColorStop(0,'rgba(255,252,240,0.18)');lg.addColorStop(1,'rgba(70,55,35,0.14)');g.fillStyle=lg;g.fillRect(x,y,w,h);g.restore();
 g.save();B_sheetPath(x,y,w,h,seed);g.strokeStyle='rgba(120,98,66,0.4)';g.lineWidth=1.1;g.stroke();g.restore()}
// a brushed ensō: pooled start, pressure falls off, bristles separate into a dry tail
function B_enso(cx,cy,R,p,seed,col=B.ink,wid=22,a0=-Math.PI*0.58,span=Math.PI*1.84,sy=1){if(p<=0)return;const N=200,n=Math.max(2,Math.floor(N*cl(p))),wf=s=>wid*(s<0.05?0.6+0.4*s/0.05:1)*(1-0.6*Math.pow(s,1.5));
 g.save();g.translate(cx,cy);g.scale(1,sy);g.strokeStyle=col;g.fillStyle=col;g.lineCap='round';const NB=30;
 for(let b=0;b<NB;b++){const off=b/(NB-1)-0.5;g.lineWidth=wid/NB*2.6*(0.7+0.6*hash(b+seed));g.globalAlpha=0.55+0.4*hash(b*3+seed);g.beginPath();let on=false;
  for(let i=0;i<=n;i++){const s=i/N,a=a0+span*s,r=R+off*wf(s)+vnoise(s*8,seed)*R*0.015;const dry=vnoise(s*34+b*3.1,seed+b)>1.02-Math.pow(s,1.3)*1.1;if(dry){if(on){g.stroke();g.beginPath();on=false}continue}const x=Math.cos(a)*r,y=Math.sin(a)*r;if(!on){g.moveTo(x,y);on=true}else g.lineTo(x,y)}if(on)g.stroke()}
 g.globalAlpha=0.8;const sa=a0;g.beginPath();g.ellipse(Math.cos(sa)*R,Math.sin(sa)*R,wid*0.55,wid*0.62,sa,0,7);g.fill();
 if(p<1){const ea=a0+span*p,ew=wf(p);g.globalAlpha=0.85;g.beginPath();g.ellipse(Math.cos(ea)*R,Math.sin(ea)*R,ew*0.5,ew*0.38,ea,0,7);g.fill()}g.restore()}
// a wet wash band laid by a flat brush (highlighter): ragged edges, overlapping strokes
function B_washBand(x,y,w,h,col,seed,a=1){if(w<=2)return;g.save();g.fillStyle=col;for(let s=0;s<4;s++){const yy=y+(s-1.5)*h*0.1,hh=h*(0.82+0.1*hash(s+seed)),ww=w*(0.965+0.035*hash(s*7+seed));g.globalAlpha=a*(0.34+0.12*hash(s*3+seed));g.beginPath();const N=Math.max(6,Math.ceil(ww/7));
  for(let i=0;i<=N;i++){const u=i/N;g.lineTo(x+ww*u,yy-hh/2+vnoise(u*ww*0.035+s*9,seed)*hh*0.12+(u<0.02?hh*0.18:0))}
  for(let i=N;i>=0;i--){const u=i/N;g.lineTo(x+ww*u+(i===N?vnoise(s,seed)*6:0),yy+hh/2+vnoise(u*ww*0.03+s*5+7,seed)*hh*0.14)}g.closePath();g.fill()}g.restore()}
// one tapered brush blade (reed / grass): presses in, lifts out
function B_blade(x0,y0,ang,len,wid,bend,col,a=1,seed=0){const N=26;let x=x0,y=y0;const L=[],R=[];for(let i=0;i<=N;i++){const u=i/N,aa=ang+bend*u*u+vnoise(u*3,seed)*0.06,w=wid*Math.pow(Math.sin(Math.PI*Math.min(1,0.12+u*0.95)),0.6)*(1-0.75*u);
  L.push([x-Math.sin(aa)*w/2,y+Math.cos(aa)*w/2]);R.push([x+Math.sin(aa)*w/2,y-Math.cos(aa)*w/2]);x+=Math.cos(aa)*len/N;y+=Math.sin(aa)*len/N}
 g.save();g.globalAlpha*=a;g.fillStyle=col;g.beginPath();L.forEach(([p,q],i)=>i?g.lineTo(p,q):g.moveTo(p,q));R.reverse().forEach(([p,q])=>g.lineTo(p,q));g.closePath();g.fill();g.restore()}
// a watercolour drop: pale wash body, pigment pooled on the lower rim, paper-white highlight
function B_drop(x,y,s,a=1,dark=true,cut=0){if(a<=0.01||s<=0.3)return;g.save();g.globalAlpha*=a;
 glow(x,y,s*3.2,dark?'205,220,235':'120,140,160',dark?0.25:0.12,0.3);
 const gr=g.createLinearGradient(x,y-s*1.25,x,y+s*0.85);gr.addColorStop(0,dark?'rgba(215,228,238,0.15)':'rgba(150,170,190,0.18)');gr.addColorStop(0.6,dark?'rgba(205,220,232,0.42)':'rgba(90,110,135,0.35)');gr.addColorStop(1,dark?'rgba(235,242,248,0.85)':'rgba(40,52,75,0.7)');
 if(cut>0){g.beginPath();g.rect(x-s*2,y-s*1.3+cut*s*2.1,s*4,s*4);g.clip()}
 drop(x,y,s,gr);g.lineWidth=Math.max(0.8,s*0.08);g.strokeStyle=dark?'rgba(236,243,250,0.7)':'rgba(25,30,45,0.5)';g.beginPath();g.moveTo(x,y-s*1.25);g.bezierCurveTo(x+s*.95,y-s*.1,x+s*.8,y+s*.85,x,y+s*.85);g.bezierCurveTo(x-s*.8,y+s*.85,x-s*.95,y-s*.1,x,y-s*1.25);g.stroke();g.lineWidth=Math.max(0.6,s*0.05);g.strokeStyle=dark?'rgba(240,246,252,0.32)':'rgba(25,30,45,0.3)';g.beginPath();g.arc(x,y+s*0.08,s*0.7,0.5,Math.PI-0.5);g.stroke();
 g.fillStyle='rgba(255,255,255,0.95)';g.beginPath();g.ellipse(x-s*0.32,y-s*0.12,s*0.11,s*0.27,0.45,0,7);g.fill();g.globalAlpha*=0.6;g.beginPath();g.ellipse(x+s*0.28,y+s*0.45,s*0.12,s*0.06,0,0,7);g.fill();g.restore()}
// glossary footnote as a colophon slip pasted at the painting's edge: seal marker, the word, the definition in small caps italic
function B_gloss(word,x,y,t,t0,al='left'){const G=GLOSS[word];if(!G)return;const k=eo((t-t0)/0.3);if(k<=0)return;
 const def=G.def.toUpperCase(),s1=27,s2=19,w1=mw(word,s1,FAM.text,'400','italic'),w2=mw(def,s2,FAM.text,'600','italic',0.8);const sw=Math.max(w1+64,w2+40),sh=92;
 g.save();g.translate(al==='left'?x:x-sw,y);g.rotate(-0.014);g.globalAlpha*=k;const prevG=TGRP;
 B_sheet(0,0,sw,sh,G.n*11+3,{sa:0.45,sb:20,sy:8,fill:'#EFE7D6'});
 B_seal(String(G.n),24,31,26,-0.05);
 TGRP='B_gloss'+word;T(word,46,30,s1,B.ink,FAM.text,'400','left',1,{st:'italic'});T(FN_MARK[G.n],46+w1+3,22,22,B.sealDeep,FAM.text,'600','left',1,{kind:'deco'});
 T(def,20,66,s2,'#2A2C38',FAM.text,'600','left',1,{st:'italic',ls:0.8});TGRP=prevG;g.restore();logGloss(word,G.def)}

// ---------- WebGL: shared GLSL ----------
const B_HEAD=`#version 300 es
precision highp float;
in vec2 uv;out vec4 o;uniform vec2 res;
${GLSL_NOISE}
mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
float ss(float a,float b,float x){float t=clamp((x-a)/(b-a),0.,1.);return t*t*(3.-2.*t);}
const vec3 ABS=vec3(2.5,2.1,1.4);
vec3 inkOn(vec3 pap,float d){return pap*exp(-ABS*max(d,0.));}
float fibres(vec2 p){float f=0.;for(int i=0;i<4;i++){float a=float(i)*1.7+0.5;vec2 q=rot(a)*p;f=max(f,ss(0.80,0.97,vn(q*vec2(0.035,0.9)+float(i)*17.3)));}return f;}
vec3 paper(vec2 p,vec3 base){float mott=fbm(p*0.012);float tooth=vn(p*1.1)*0.5+vn(p*2.3)*0.5;vec3 c=base*(0.955+0.07*mott)+(tooth-0.5)*0.03;c+=fibres(p)*0.04;c-=fibres(p*1.31+50.)*0.03;return c;}
float gran(vec2 p){return 0.8+0.4*vn(p*0.85);}
float warp(vec2 p){vec2 q=vec2(fbm(p),fbm(p+vec2(5.2,1.3)));return fbm(p+2.4*q);}
const vec3 CREAM=vec3(0.937,0.906,0.851);
`;

// SF2 — blue-hour lake: wet sky wash, two ranges with brushed edges dissolving into mist, a lake of dry strokes, a column of vapour
const B_VAP_FS=B_HEAD+`
uniform float T,K,D;
const float HZ=452.;
float rFar(float x){return HZ-30.-120.*exp(-pow((x-95.)/70.,2.))-150.*exp(-pow((x-235.)/62.,2.))-190.*exp(-pow((x-560.)/80.,2.))-120.*exp(-pow((x-680.)/50.,2.))-34.*fbm(vec2(x*0.014,3.1))-8.*vn(vec2(x*0.08,1.));}
float rMid(float x){return HZ+2.-250.*exp(-pow((x+20.)/105.,2.))-95.*exp(-pow((x-170.)/80.,2.))-70.*exp(-pow((x-360.)/150.,2.))-230.*exp(-pow((x-745.)/90.,2.))-70.*exp(-pow((x-600.)/55.,2.))-24.*fbm(vec2(x*0.022,8.7))-6.*vn(vec2(x*0.1,5.));}
float mtn(vec2 P,float ry,float slope,float A,float fadeTo,float seed){
 float dep=P.y-ry;float inside=ss(-1.2,1.2,dep+(vn(P*0.3+seed)-0.5)*2.4);float dp=max(dep,0.);
 float lost=ss(0.2,0.55,vn(vec2(P.x*0.02,seed)));
 float edge=exp(-dp/4.)*0.85*mix(0.3,1.,lost);
 float wash=0.62*exp(-dp/(fadeTo*0.42))*(0.72+0.56*warp(P*0.011+seed));
 float a=atan(slope);float st=vn(rot(-a)*(P+seed*31.)*vec2(0.05,0.55));
 float cun=ss(0.62,0.8,st)*0.4*exp(-dp/(fadeTo*0.5));
 return inside*A*(edge+wash+cun)*gran(P);}
void main(){
 vec2 P=vec2(uv.x*720.,(1.-uv.y)*640.);
 vec3 pap=paper(P,CREAM);
 float w=warp(P*0.0042+vec2(T*0.006,0.));
 float d=mix(D*1.05,D*0.12,ss(0.,HZ-20.,P.y))*(0.8+0.4*w)*gran(P);
 float gl=exp(-pow((P.y-HZ+40.)/70.,2.))*exp(-pow((P.x-520.)/230.,2.));
 d*=1.-0.7*gl;
 float rf=rFar(P.x),sf=(rFar(P.x+2.)-rFar(P.x-2.))/4.;
 d+=mtn(P,rf,sf,0.32*D/0.7,170.,1.);
 float rm=rMid(P.x),sm=(rMid(P.x+2.)-rMid(P.x-2.))/4.;
 d+=mtn(P,rm,sm,0.9*D/0.7,220.,2.);
 if(P.y>HZ){float dy=P.y-HZ;
  float hs=vn(vec2(P.x*0.006+dy*0.002,dy*0.3));float hs2=vn(vec2(P.x*0.022,dy*0.85+3.));
  float lake=(0.22+0.26*ss(0.4,0.75,hs)+0.12*hs2)*D/0.7*(0.55+0.45*ss(0.,170.,dy));
  float ry=HZ-dy*1.2;float wob=sin(P.y*0.33+T*1.3)*3.+sin(P.y*0.1-T*0.7)*5.;
  float refl=mtn(vec2(P.x+wob,ry),rMid(P.x+wob),0.,0.9*D/0.7,220.,2.)*0.42+mtn(vec2(P.x+wob,ry),rFar(P.x+wob),0.,0.32*D/0.7,170.,1.)*0.25;
  float glint=ss(0.74,0.86,vn(vec2(P.x*0.03,dy*0.55+T*0.4)))*exp(-pow((P.x-500.)/120.,2.))*ss(90.,0.,dy);
  d=d*0.25+lake+refl;d*=1.-0.9*glint;}
 float mist=exp(-pow((P.y-HZ+8.)/26.,2.))*(0.7+0.3*vn(vec2(P.x*0.01,T*0.2)));
 d*=1.-0.6*mist;
 // vapour column off the lake, features travel upward with T
 float colW=70.+max(0.,HZ-P.y)*0.55;
 float cm=exp(-pow((P.x-548.+16.*sin(P.y*0.011+T*0.6))/colW,2.));
 float vv=warp(vec2(P.x*0.008+0.2*sin(P.y*0.01),(P.y+T*40.)*0.007));
 float fil=vn(vec2(P.x*0.03+vv*3.,(P.y+T*60.)*0.02));
 float plume=cm*ss(HZ+14.,HZ-26.,P.y)*ss(90.,330.,P.y)*ss(0.3,0.62,vv)*(0.5+0.5*fil);
 float low=ss(HZ+12.,HZ-6.,P.y)*ss(HZ-200.,HZ-30.,P.y)*ss(0.48,0.78,vn(vec2(P.x*0.013,(P.y+T*30.)*0.02)))*0.45;
 float vap=clamp(plume*1.05+low,0.,1.);
 d*=1.-0.9*vap;
 vec3 col=inkOn(pap,d);
 col=mix(col,vec3(0.955,0.962,0.968),vap*0.55);
 o=vec4(col,1.);}`;

// SF3 — clouds: ONE cumulus. Billows are a sphere height-field (z-buffered smooth-max), lit from above;
// lit tops are reserved paper, the shade is laid as three glazes with pooled edges, the flat base is pooled indigo.
// Lobes are hand-placed (a leaning tower with a low right shoulder); cauliflower buds are grown on each lobe's upper arc.
const B_CLOUD=(()=>{const r=RNG(4242),BASE=752,TOP=176,L=[];
 // lobes scattered inside a leaning tower envelope (no rows): big and low at the base, small and tight at the crown
 for(let i=0;i<26;i++){const v=Math.pow(r(),1.15),y=BASE-70-(BASE-70-TOP-40)*v,hw=70+250*Math.pow(1-v,0.8),x=376+v*40+(r()*2-1)*hw*0.8,R=(44+86*Math.pow(1-v,0.7))*(0.75+0.5*r());L.push([x,y,R])}
 L.push([380,TOP+40,58],[440,TOP+70,50],[384,560,150],[400,420,120],[410,300,90]);
 const S=L.map(v=>v.slice());
 for(const [x,y,R] of L){const n=2+Math.floor(r()*3);for(let i=0;i<n;i++){const a=-Math.PI*(0.1+0.8*(i+r()*0.8)/n),px=x+Math.cos(a)*R*0.86,py=y+Math.sin(a)*R*0.86;
  if(L.some(([x2,y2,R2])=>(x2!==x||y2!==y)&&Math.hypot(px-x2,py-y2)<R2*0.92))continue;S.push([px,py,R*(0.26+0.18*r())])}}
 return S})();
const B_CLD_FS=B_HEAD+`
uniform float T,K,D;uniform vec2 PAR;
const int NS=${B_CLOUD.length};
const vec3 SP[NS]=vec3[NS](${B_CLOUD.map(([x,y,R])=>`vec3(${x.toFixed(1)},${y.toFixed(1)},${R.toFixed(1)})`).join(',')});
const float BASE=752.;
float Hc(vec2 P){float s=0.;for(int i=0;i<NS;i++){vec3 c=SP[i];vec2 d=(P-c.xy)*vec2(0.97,1.06);float h2=c.z*c.z-dot(d,d);if(h2>0.)s+=exp(sqrt(h2)*0.08);}
 return s>0.?log(s)/0.08:0.;}
float SDc(vec2 P){float m=1e4;for(int i=0;i<NS;i++){vec3 c=SP[i];m=min(m,length((P-c.xy)*vec2(0.97,1.06))-c.z);}return max(m,P.y-BASE);}
// karst peak rising out of the cloud sea: steep, asymmetric, a shoulder, a broken ridge
float pk(float x,vec4 q,float seed){float dx=x-q.x;float w=dx<0.?q.z:q.z*1.45;float u=abs(dx)/w;
 return q.y+q.w*(1.-exp(-u*u*1.7))+60.*(fbm(vec2(x*0.022,seed))-0.5)*ss(0.,0.5,u)+12.*(vn(vec2(x*0.14,seed))-0.5)-46.*exp(-pow((dx-q.z*0.95)/(q.z*0.3),2.));}
float range(vec2 P,float ry,float sl,float A,float seed){float dep=P.y-ry;float inside=ss(-1.,1.4,dep+(vn(P*0.3+seed)-0.5)*2.);float dp=max(dep,0.);
 float lost=ss(0.25,0.6,vn(vec2(P.x*0.025,seed)));float edge=exp(-dp/3.5)*0.95*mix(0.35,1.,lost);
 vec2 q=rot(-atan(sl))*(P+seed*31.);
 float cun=ss(0.62,0.82,vn(q*vec2(0.045,0.5)))*0.5*exp(-dp/110.)+ss(0.7,0.9,vn(q*vec2(0.02,0.2)+9.))*0.3*exp(-dp/60.);
 float wash=0.5*exp(-dp/150.)*(0.7+0.6*warp(P*0.012+seed));
 float dian=ss(0.85,0.92,vn(P*0.2+seed*3.))*ss(24.,5.,dp)*ss(0.,3.,dp);
 return inside*A*(edge+wash+cun+dian*1.5)*gran(P);}
float mist(vec2 P,float yc,float wd,float sp,float seed){float f=fbm(vec2(P.x*0.0042+T*sp+seed,P.y*0.011+seed*2.));
 return exp(-pow((P.y-yc-(f-0.5)*90.)/wd,2.))*ss(0.26,0.6,f);}
void main(){
 vec2 P=vec2(uv.x*720.,(1.-uv.y)*1280.);
 vec3 pap=paper(P,CREAM);
 float w=warp(P*0.0034+vec2(T*0.008,0.));
 float d=D*mix(1.3,0.35,ss(0.,1000.,P.y))*(0.8+0.4*w)*gran(P);
 vec2 Q=P+vec2(-PAR.x,PAR.y);
 vec2 Qw=Q+vec2(fbm(Q*0.018)-0.5,fbm(Q*0.018+7.)-0.5)*20.+vec2(vn(Q*0.1)-0.5,vn(Q*0.1+3.)-0.5)*4.;
 float sd=SDc(Qw);
 float H=Hc(Qw);vec2 e=vec2(2.5,0.);
 float hx=(Hc(Qw+e.xy)-Hc(Qw-e.xy))/5.,hy=(Hc(Qw+e.yx)-Hc(Qw-e.yx))/5.;
 vec3 n=normalize(vec3(-hx,-hy,1.0));
 vec3 L=normalize(vec3(-0.45,-0.85,0.45));
 float lam=clamp(dot(n,L),0.,1.);
 // self-shadow: how much cloud lies between this point and the light (marched up-left through the silhouette)
 float occ=0.;vec2 Ld=normalize(vec2(-0.45,-0.85));for(int k=1;k<=6;k++){occ+=ss(18.,-18.,SDc(Qw+Ld*float(k)*float(k)*5.5))*(1.-float(k)*0.1);}occ/=3.9;
 float belly=ss(BASE-300.,BASE,Q.y);
 float lit=lam*(1.-0.38*occ)*(1.-0.45*belly);
 float sh=clamp(1.-lit,0.,1.);
 // glazes: two washes with pigment-pooled edges, wobbled by the wet paper, over a smooth graded wash
 float jn=(warp(Q*0.01+4.)-0.5)*0.2+(vn(Q*0.06)-0.5)*0.04;float s2=sh+jn;
 float g1=ss(0.40,0.46,s2),g2=ss(0.70,0.75,s2);
 float pool=exp(-pow((s2-0.44)/0.02,2.))+exp(-pow((s2-0.74)/0.02,2.));
 float dc=D*(0.03+0.13*g1+0.15*g2+0.42*pow(sh,1.7)+0.035*pool+0.16*belly*belly)*(0.85+0.3*warp(Q*0.008+3.))*gran(P);
 float soft=mix(9.,1.8,ss(0.3,0.7,sh));
 float ac=ss(soft,-soft,sd);
 float halo=exp(-max(sd,0.)/60.)*ss(BASE-150.,150.,Q.y)*(1.-ac);
 d*=1.-0.45*halo;
 d=mix(d,dc,ac);
 float litPaper=ac*ss(0.35,0.0,s2);
 float rf=pk(P.x,vec4(468.,830.,120.,300.),3.),sf=(pk(P.x+2.,vec4(468.,830.,120.,300.),3.)-pk(P.x-2.,vec4(468.,830.,120.,300.),3.))/4.;
 float df=range(P,rf,sf,0.45*D/0.7,3.);float fadeF=1.-ss(rf+50.,rf+260.,P.y+(fbm(P*0.01+3.)-0.5)*90.);
 d=mix(d,d*0.8+df,ss(-1.,1.,P.y-rf)*fadeF);
 float m0=mist(P,820.,70.,0.012,1.);d*=1.-0.85*m0;
 vec4 A1=vec4(70.,712.,104.,420.),A2=vec4(656.,760.,88.,400.);
 float r1=pk(P.x,A1,1.),r2=pk(P.x,A2,2.);float ry=min(r1,r2);bool left=r1<r2;
 float sl=left?(pk(P.x+2.,A1,1.)-pk(P.x-2.,A1,1.))/4.:(pk(P.x+2.,A2,2.)-pk(P.x-2.,A2,2.))/4.;
 float dn=range(P,ry,sl,0.95*D/0.7,left?1.:2.);float fadeN=1.-ss(ry+70.,ry+330.,P.y+(fbm(P*0.01+5.)-0.5)*110.);
 d=mix(d,d*0.75+dn,ss(-1.,1.,P.y-ry)*fadeN);
 float m1=mist(P,940.,70.,0.02,4.),m2=mist(P,1080.,120.,0.03,9.);
 d*=1.-0.85*m1;d*=1.-0.9*m2;
 d=mix(d,0.03,ss(1080.,1240.,P.y)*0.9);
 vec3 col=inkOn(pap,d);
 col=mix(col,vec3(0.88,0.9,0.93),clamp(litPaper*0.3+m1*0.22+m2*0.3,0.,1.));
 col+=vec3(0.75,0.82,0.92)*halo*0.05;
 o=vec4(col,1.);}`;

// SF4 — ink night: sumi diffusing in still water. Billows with darker pigment fronts, clear-water veils between them,
// a cool shaft of light falling from the top left.
const B_NIGHT_FS=B_HEAD+`
uniform float T,K,D;
void main(){
 vec2 P=vec2(uv.x*720.,(1.-uv.y)*1280.);
 vec3 pap=paper(P,CREAM);
 vec2 p=P*0.0017+vec2(4.3,2.6);
 vec2 q=vec2(fbm(p+vec2(0.,T*0.025)),fbm(p+vec2(5.2,1.3)-vec2(T*0.02,0.)));
 vec2 r=vec2(fbm(p+3.4*q+vec2(1.7,9.2)),fbm(p+3.4*q+vec2(8.3,2.8)+T*0.015));
 float f=fbm(p+3.6*r);
 float bill=ss(0.3,0.72,f);
 float front=exp(-pow((f-0.5)/0.016,2.))*ss(0.35,0.7,vn(P*0.005+3.));
 float veil=ss(0.36,0.2,f);
 float wisp=ss(0.55,0.75,fbm(P*0.012+r*4.))*bill;
 float d=D*(0.72+0.48*bill+0.12*front+0.08*wisp-0.12*veil);
 float halo=exp(-pow(length((P-vec2(360.,600.))/vec2(420.,460.)),2.));
 vec2 sd=normalize(vec2(0.55,0.835));float sx=abs((P.x-40.)*sd.y-(P.y+140.)*sd.x);
 float shaft=exp(-pow(sx/120.,2.))*ss(1150.,60.,P.y);
 d*=1.-0.26*halo-0.3*shaft;
 d*=gran(P);
 vec3 col=inkOn(pap,d);
 col+=vec3(0.55,0.66,0.82)*(veil*0.03+shaft*0.035);
 o=vec4(col,1.);}`;

// SF5 — step card as wet paper soaked to the act's sky (never a daylight flash at night): the template's soft diagonal
// gradient is a graded indigo wash, lighter where the light sits (upper right). The giant numeral is wet sumi dropped into it:
// a pooled core, a pale back-run halo where the water pushed the pigment out, and a dark tide line at the halo's rim.
const B_NUM_FS=B_HEAD+`
uniform float T,K,D;uniform sampler2D G;
void main(){
 vec2 P=vec2(uv.x*720.,(1.-uv.y)*1280.);float fx=uv.x,fy=1.-uv.y;
 vec3 pap=paper(P,CREAM);
 float bloom=exp(-pow(length((vec2(fx,fy)-vec2(0.84,0.12))/vec2(0.55,0.35)),2.));
 float wb=warp(P*0.0032+vec2(1.3,T*0.01));
 float dbg=D*(1.12-0.55*bloom-0.12*fx+0.12*fy)*(0.82+0.36*wb)*gran(P);
 float st=fbm(P*0.0036+2.);dbg+=D*0.09*exp(-pow((st-0.53)/0.006,2.));
 float bk=fbm(P*0.006+9.);dbg*=1.-0.16*ss(0.6,0.66,bk);dbg+=D*0.07*exp(-pow((bk-0.6)/0.008,2.));
 float sp=0.55+0.8*ss(0.,0.9,K);
 float n=fbm(P*0.028),n2=vn(P*0.31);float m=0.,mw=0.;
 for(int i=0;i<18;i++){float fi=float(i);float a=6.2831*(fi+n2)/18.;
  float rr=(2.+9.*h21(P*0.13+fi))*sp;m+=texture(G,uv+vec2(cos(a),sin(a))*rr/vec2(720.,1280.)).r;
  float rw=(12.+50.*h21(P*0.07+fi*3.))*sp*(0.6+0.9*fibres(P*0.8));mw+=texture(G,uv+vec2(cos(a+1.),sin(a+1.))*rw/vec2(720.,1280.)).r;}
 m/=18.;mw/=18.;
 float thr=0.46+(n-0.5)*0.38;
 float core=ss(thr-0.07,thr+0.07,m);
 float halo=ss(0.03,0.45,mw)*(1.-core);
 float tide=ss(0.02,0.045,mw)*ss(0.1,0.055,mw);
 float pool=core*ss(thr+0.3,thr+0.02,m);
 float fade=mix(0.35,0.78,ss(200.,900.,P.y));
 float dn=(core*(0.62+0.2*vn(P*0.4)+0.12*fibres(P*0.7))*(0.8+0.4*warp(P*0.008))+pool*0.22)*fade;
 float grow=ss(0.,0.25,K);
 float d=dbg*(1.-0.32*halo*grow)+D*(dn+tide*0.16*fade)*grow;
 vec3 col=inkOn(pap,d);
 col+=vec3(0.55,0.66,0.82)*(bloom*0.05+halo*grow*0.035);
 o=vec4(col,1.);}`;

// ---------- scenes ----------
// a rising wisp of vapour, like incense smoke: waves travel up the strand, it widens and thins as it climbs
function B_strand(x0,y0,len,t,seed,wid,a,lean=0,tx=null,conv=0){const N=44,P=[];for(let i=0;i<=N;i++){const u=i/N,y=y0-u*len;
  const x=x0+(tx==null?0:(tx-x0)*conv*Math.sin(Math.PI*Math.min(1,u/0.75)*0.5))+Math.sin(u*5.2+seed*1.7-t*1.9)*(5+u*38)+Math.sin(u*11.3+seed*3.1-t*3.1)*(2+u*11)+lean*u*u*len*0.25;P.push([x,y,u])}
 g.save();g.lineCap='round';g.lineJoin='round';
 for(let pass=0;pass<2;pass++){if(pass===0)g.filter=`blur(${6*SC}px)`;else g.filter='none';
  for(let i=1;i<=N;i++){const [x,y,u]=P[i],[px,py]=P[i-1];const al=a*cl(u/0.1)*Math.pow(1-u,1.3)*(pass?1:0.6);if(al<=0.01)continue;
   g.strokeStyle=`rgba(242,246,250,${al})`;g.lineWidth=wid*(0.35+u*1.8)*(pass?1:3.6);g.beginPath();g.moveTo(px,py);g.lineTo(x,y);g.stroke()}}
 g.restore()}
// rain at depth: thin slanted streaks falling through the light (two parallax planes, the far one out of focus)
function B_rain(t,n,seed,speed,len,a,blur){const r=RNG(seed);g.save();if(blur)g.filter=`blur(${blur*SC}px)`;g.lineCap='round';
 for(let i=0;i<n;i++){const x0=r()*W*1.2-60,ph=r(),l=len*(0.6+0.8*r()),aa=a*(0.4+0.6*r());const y=((ph*1500+t*speed)%1500)-120,x=x0+y*0.12;
  const near=Math.exp(-Math.pow(((x-40)*0.835-(y+140)*0.55)/140,2));const gr=g.createLinearGradient(x,y,x+l*0.12,y+l);gr.addColorStop(0,'rgba(215,226,240,0)');gr.addColorStop(1,`rgba(215,226,240,${aa*(0.35+0.65*near)})`);
  g.strokeStyle=gr;g.lineWidth=blur?2:1.1;g.beginPath();g.moveTo(x,y);g.lineTo(x+l*0.12,y+l);g.stroke()}g.restore()}
// ---------- the five style frames ----------

// ===================== shared world API for act authors =====================
// B_ink(t): ink density of the night (1.3 at 0 -> 0.02 at dawn 207.6); every background keys to it so brightness only climbs.
