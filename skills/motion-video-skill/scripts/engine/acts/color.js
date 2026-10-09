// acts/color.js — THE COLOUR WORLD (owner 2026-10-08: "make the world colourful just like the images").
// Loaded after world.js and before the act files. It redeclares the W* backgrounds and style.js B_drop / B_rain (same
// signatures), so every scene that paints a background turns colourful; it adds the shared C_* primitives for the subject
// artists (documented in docs/color_api.md); it restyles the generic scenes (step cards, title, kinetic type, pages, cards).
// Look: bright friendly 2D illustration, soft gradients and highlights, chunky rounded shapes, layered depth, glossy water.
// One sky clock (CSKY) drives every background. renderFrame stays pure: RNG / hash / vnoise / n2 only.
'use strict';

// =====================================================================================================================
// colour maths
// =====================================================================================================================
const C_hx=h=>{h=h.replace('#','');return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)]};
const C_col=x=>typeof x==='string'?(x[0]==='#'?C_hx(x):x.replace(/[^\d.,]/g,'').split(',').slice(0,3).map(Number)):x;
const C_c=(a,al=1)=>{a=C_col(a);return al>=1?`rgb(${Math.round(a[0])},${Math.round(a[1])},${Math.round(a[2])})`:`rgba(${Math.round(a[0])},${Math.round(a[1])},${Math.round(a[2])},${+Math.max(0,al).toFixed(3)})`};
const C_s=a=>{a=C_col(a);return `${Math.round(a[0])},${Math.round(a[1])},${Math.round(a[2])}`};      // 'r,g,b' for glow()/sprite()
const C_mx=(a,b,k)=>{a=C_col(a);b=C_col(b);return [lerp(a[0],b[0],k),lerp(a[1],b[1],k),lerp(a[2],b[2],k)]};
const C_mul=(a,b)=>[a[0]*b[0]/255,a[1]*b[1]/255,a[2]*b[2]/255];
const C_lum=a=>{a=C_col(a);const f=v=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4)};return 0.2126*f(a[0])+0.7152*f(a[1])+0.0722*f(a[2])};
const C_n3=a=>[a[0]/255,a[1]/255,a[2]/255];
const C_WH=[255,255,255],C_BK=[0,0,0];
const C_GOLDG=['#FFF3BF','#FFD45C','#F0A626'];          // gold fill (gratitude only), always with a dark brown edge
const C_GOLDEDGE='#5A3606';
// path helper: a circle that never joins the previous sub-path
const C_circ=(P,x,y,r)=>{P.moveTo(x+r,y);P.arc(x,y,r,0,Math.PI*2)};

// =====================================================================================================================
// THE SKY CLOCK — one light arc, colourful at every point
// keys: N rainy blue night · B blue hour · D rainy day · G warm golden afternoon · O cool overcast · P pre-dawn ·
// R golden sunrise · M bright golden morning. The film's arc (which key when) is PROJECT.world.skyArc.
// fields: top/mid/hz sky stops · lc light colour · sun/moon 0..1 · sx,sy sun position · rays · rain · cloud (amount) ·
//         stars · cl/cs cloud lit/shade · tint (multiplies land colours) · deep/surf water body colours
// =====================================================================================================================
const C_KEY={
 N:{pa:'#C3CEFF',pb:'#B4C6F7',pc:'#DCE6FF',top:'#101C58',mid:'#22409A',hz:'#4677C9',lc:'#AFC8FF',sun:0,moon:1,rays:0.12,rain:0.65,cloud:0.55,stars:0.9,cl:'#86A2E6',cs:'#34489A',tint:'#7088D8',deep:'#0B2766',surf:'#2F5DB0',sx:600,sy:170},
 B:{pa:'#B4DDF7',pb:'#A6D8EC',pc:'#D4F3EE',top:'#1C3A92',mid:'#3474C4',hz:'#86D2DE',lc:'#C8E2FF',sun:0,moon:0.75,rays:0.12,rain:0.55,cloud:0.6,stars:0.35,cl:'#ADC9F2',cs:'#5D7DC4',tint:'#A0BCEA',deep:'#0F3F86',surf:'#4C9AD0',sx:600,sy:170},
 D:{pa:'#C4E4FB',pb:'#B2DCF5',pc:'#E2F5FA',top:'#3F8CD8',mid:'#7FBDEB',hz:'#D2ECF6',lc:'#FFFDF4',sun:0,moon:0,rays:0.3,rain:0.7,cloud:0.95,stars:0,cl:'#FFFFFF',cs:'#AFC0D6',tint:'#F4F9FF',deep:'#14569E',surf:'#6BB6E3',sx:590,sy:215},
 G:{pa:'#FFDDA8',pb:'#FFF0D8',pc:'#FFDCA8',top:'#3A8DDB',mid:'#8DCAEB',hz:'#FFDF9C',lc:'#FFD68C',sun:1,moon:0,rays:0.6,rain:0.25,cloud:0.5,stars:0,cl:'#FFF8E8',cs:'#F0C49A',tint:'#FFF0CC',deep:'#155FA6',surf:'#86CBEA',sx:590,sy:215},
 O:{pa:'#C9D3EC',pb:'#D6D0EA',pc:'#F0E2EA',top:'#5A7496',mid:'#8CA0BA',hz:'#C4CEDA',lc:'#E6ECF5',sun:0,moon:0,rays:0.06,rain:0.45,cloud:1.0,stars:0,cl:'#E2E7EE',cs:'#97A6BA',tint:'#C6CED8',deep:'#2D4A6C',surf:'#7F97B2',sx:590,sy:215},
 P:{pa:'#D9C9F4',pb:'#F2C4D9',pc:'#FFE0D0',top:'#262C74',mid:'#6E56AA',hz:'#F29CB2',lc:'#FFBED2',sun:0,moon:0,rays:0.15,rain:0.12,cloud:0.45,stars:0.45,cl:'#FFC7D6',cs:'#7B67B5',tint:'#B7A0DA',deep:'#2A2768',surf:'#B07FB8',sx:470,sy:1110},
 R:{pa:'#FFD9B0',pb:'#FFC8A6',pc:'#FFEFC8',top:'#4E6CC4',mid:'#F09C74',hz:'#FFD777',lc:'#FFC878',sun:1,moon:0,rays:0.65,rain:0,cloud:0.4,stars:0,cl:'#FFE6BC',cs:'#E39A86',tint:'#FFD6AE',deep:'#2F4A93',surf:'#FFB878',sx:470,sy:1010},
 M:{pa:'#CBE9FB',pb:'#FFE8BA',pc:'#FFF4D8',top:'#56A8E8',mid:'#A6D8F3',hz:'#FFE6AA',lc:'#FFE8B4',sun:1,moon:0,rays:0.5,rain:0,cloud:0.35,stars:0,cl:'#FFFFFF',cs:'#C9DDF0',tint:'#FFF6E0',deep:'#1765B4',surf:'#9ADBF2',sx:560,sy:290}};
// the arc comes from PROJECT.world.skyArc (keyframes [t, key]; a key holds between two equal entries, eases between
// different ones). VotR: [[0,'N'],[21.5,'N'],[25,'B'],[53,'B'],[56.5,'D'],[102.5,'D'],[106.4,'G'],[141,'G'],[144.6,'O'],
// [185.5,'O'],[188,'P'],[207.1,'P'],[207.68,'R'],[210.4,'R'],[211.0,'M'],[9999,'M']]. Default: one rainy day.
const C_ARC=(()=>{const a=(WORLD.skyArc||[[0,'D'],[9999,'D']]).map(([t,k])=>[+t,k]);if(a[a.length-1][0]<9999)a.push([9999,a[a.length-1][1]]);if(a.length<2)a.push([9999,a[0][1]]);return a})();
const C_KF={};for(const k in C_KEY){const o={...C_KEY[k]};for(const f in o)if(typeof o[f]==='string')o[f]=C_hx(o[f]);C_KF[k]=o}
let C_SKT=NaN,C_SKV=null;
function CSKY(t){if(t===C_SKT)return C_SKV;let i=1;while(i<C_ARC.length-1&&t>C_ARC[i][0])i++;const [a,ka]=C_ARC[i-1],[b,kb]=C_ARC[i];const k=eio(inv(a,b,t)),A=C_KF[ka],Bk=C_KF[kb];
 const o={key:k<0.5?ka:kb,k};for(const f in A){const va=A[f],vb=Bk[f];o[f]=Array.isArray(va)?C_mx(va,vb,k):lerp(va,vb,k)}
 o.sx*=W/720;o.sy*=H/1280;o.bright=C_lum(o.mid);o.light=o.bright>0.3;      // light sky -> dark type with a white edge; dark sky -> cream type with a navy edge
 C_SKT=t;C_SKV=o;return o}
// a base (daylight) colour as the clock lights it
function C_tint(base,t,k=1){const S=CSKY(t),b=C_col(base);return C_mx(b,C_mul(b,S.tint),k)}
// where the light comes from right now (sun, moon, or the sun behind the clouds)
function C_lightPos(t,o={}){const S=CSKY(t);if(S.moon>S.sun&&S.moon>0.05)return {x:o.mx??560,y:(o.my??170)+t*0.5,a:S.moon*0.6,moon:true};return {x:S.sx,y:S.sy,a:Math.max(S.sun,0.3),moon:false}}

// =====================================================================================================================
// cached textures
// =====================================================================================================================
// watercolour mottling (laid over every sky with soft-light)
const C_WASH=(()=>{const w=180,h=320,c=mkC(w,h),x=c.getContext('2d'),id=x.createImageData(w,h);for(let j=0;j<h;j++)for(let i=0;i<w;i++){const v=0.55*n2(i*0.035,j*0.035,3)+0.3*n2(i*0.09,j*0.09,7)+0.15*n2(i*0.22,j*0.22,11);const q=(j*w+i)*4,l=128+v*130;id.data[q]=id.data[q+1]=id.data[q+2]=Math.max(0,Math.min(255,l));id.data[q+3]=255}x.putImageData(id,0,0);return c})();
// soil cross-section texture: strata, pebbles, specks, root hairs (neutral; tinted per frame by the clock)
const C_SOIL=(()=>{const w=900,h=1100,c=mkC(w*1.5,h*1.5),x=c.getContext('2d');x.scale(1.5,1.5);const r=RNG(6061);
 for(let i=0;i<9;i++){const y0=60+i*120+r()*40,hh=18+r()*46;x.fillStyle=r()<0.5?'rgba(255,214,160,0.07)':'rgba(40,18,6,0.09)';x.beginPath();x.moveTo(0,y0);for(let px=0;px<=w;px+=20)x.lineTo(px,y0+Math.sin(px*0.01+i)*8+(r()-0.5)*3);for(let px=w;px>=0;px-=20)x.lineTo(px,y0+hh+Math.sin(px*0.012+i*2)*8);x.closePath();x.fill()}
 for(let i=0;i<2200;i++){x.fillStyle=r()<0.55?`rgba(30,14,4,${0.12+r()*0.22})`:`rgba(255,226,180,${0.08+r()*0.16})`;const s=0.8+r()*1.8;x.fillRect(r()*w,r()*h,s,s)}
 x.lineCap='round';for(let i=0;i<40;i++){let px=r()*w,py=10+r()*220;x.strokeStyle=`rgba(70,40,18,${0.25+r()*0.25})`;x.lineWidth=0.8+r()*0.8;x.beginPath();x.moveTo(px,py);for(let j=0;j<6;j++){px+=(r()-0.5)*14;py+=4+r()*9;x.lineTo(px,py)}x.stroke()}
 const PC=['#B99B7B','#9E7F63','#CBB194','#8F8A84','#A88F78'];for(let i=0;i<95;i++){const px=r()*w,py=30+r()*(h-40),rx=3+Math.pow(r(),1.6)*15,ry=rx*(0.5+r()*0.3),rot=(r()-0.5)*0.8;
  x.save();x.translate(px,py);x.rotate(rot);x.fillStyle='rgba(30,14,4,0.25)';x.beginPath();x.ellipse(1.2,1.6,rx,ry,0,0,7);x.fill();x.fillStyle=PC[Math.floor(r()*PC.length)];x.beginPath();x.ellipse(0,0,rx,ry,0,0,7);x.fill();
  x.strokeStyle='rgba(60,34,16,0.55)';x.lineWidth=0.9;x.stroke();x.fillStyle='rgba(255,250,235,0.45)';x.beginPath();x.ellipse(-rx*0.35,-ry*0.4,rx*0.35,ry*0.22,-0.3,0,7);x.fill();x.restore()}
 return c})();
// glossy water-drop sprites (raindrop1 look: refraction band, bright caustic at the base, hard specular, soft cast shadow)
const C_DROPSZ=140;
function C_dropSprite(deep,shadow){return B_canvas('Cdrop'+(deep?'D':'L')+(shadow?'s':''),720,800,(x,w,h)=>{x.scale(2,2);const s=C_DROPSZ,cx=170,cy=232;
 const path=()=>{x.beginPath();x.moveTo(cx,cy-s*1.25);x.bezierCurveTo(cx+s*.95,cy-s*.1,cx+s*.8,cy+s*.85,cx,cy+s*.85);x.bezierCurveTo(cx-s*.8,cy+s*.85,cx-s*.95,cy-s*.1,cx,cy-s*1.25);x.closePath()};
 if(shadow){x.save();x.filter='blur(13px)';x.translate(s*0.15,s*0.22);path();x.fillStyle='rgba(6,24,70,0.26)';x.fill();x.restore()}
 path();const gr=x.createRadialGradient(cx-s*0.08,cy+s*0.28,s*0.06,cx,cy+s*0.02,s*1.22);
 if(deep){gr.addColorStop(0,'rgba(196,240,255,0.80)');gr.addColorStop(0.42,'rgba(84,170,236,0.70)');gr.addColorStop(0.78,'rgba(30,104,206,0.80)');gr.addColorStop(1,'rgba(12,48,140,0.95)')}
 else{gr.addColorStop(0,'rgba(220,250,255,0.62)');gr.addColorStop(0.45,'rgba(120,200,246,0.46)');gr.addColorStop(0.8,'rgba(44,128,214,0.58)');gr.addColorStop(1,'rgba(18,64,160,0.85)')}
 x.fillStyle=gr;x.fill();
 x.save();path();x.clip();
 // the refracted world, upside down: a darker band on top, a teal-green band, a bright caustic crescent below
 let b=x.createLinearGradient(0,cy-s*1.25,0,cy-s*0.1);b.addColorStop(0,deep?'rgba(8,34,100,0.55)':'rgba(10,44,120,0.45)');b.addColorStop(1,'rgba(10,44,120,0)');x.fillStyle=b;x.fillRect(cx-s,cy-s*1.3,s*2,s*1.3);
 x.fillStyle='rgba(70,200,170,0.20)';x.beginPath();x.ellipse(cx+s*0.08,cy+s*0.06,s*0.62,s*0.2,-0.12,0,7);x.fill();
 b=x.createRadialGradient(cx,cy+s*0.56,0,cx,cy+s*0.56,s*0.62);b.addColorStop(0,'rgba(255,255,255,0.92)');b.addColorStop(0.5,'rgba(220,250,255,0.4)');b.addColorStop(1,'rgba(220,250,255,0)');x.fillStyle=b;x.beginPath();x.ellipse(cx,cy+s*0.56,s*0.62,s*0.36,0,0,7);x.fill();
 x.restore();
 path();x.lineWidth=s*0.05;x.strokeStyle=deep?'rgba(10,40,120,0.7)':'rgba(14,56,140,0.55)';x.stroke();
 x.lineWidth=s*0.035;x.strokeStyle='rgba(255,255,255,0.62)';x.beginPath();x.arc(cx,cy+s*0.08,s*0.71,0.62,Math.PI-0.4);x.stroke();
 x.fillStyle='rgba(255,255,255,0.97)';x.beginPath();x.ellipse(cx-s*0.33,cy-s*0.16,s*0.12,s*0.3,0.45,0,7);x.fill();
 x.beginPath();x.arc(cx-s*0.1,cy-s*0.63,s*0.055,0,7);x.fill();
 x.fillStyle='rgba(255,255,255,0.62)';x.beginPath();x.ellipse(cx+s*0.3,cy+s*0.5,s*0.13,s*0.06,-0.4,0,7);x.fill()})}

// =====================================================================================================================
// PRIMITIVES (C_*) — documented in docs/color_api.md
// =====================================================================================================================
// ---------- cartoon cloud: puffy, flat-bottomed, lit top-left, shaded bottom-right; optional falling cartoon drops ----------
const C_CG={};
function C_cloudGeo(seed){if(C_CG[seed])return C_CG[seed];const r=RNG(seed*7919+13),cs=[];
 const nb=4+Math.floor(r()*3);for(let i=0;i<nb;i++){const u=i/(nb-1),R=26+r()*14;cs.push([lerp(-78,78,u)+(r()-0.5)*10,-R*0.55,R])}
 const nt=2+Math.floor(r()*3);for(let i=0;i<nt;i++){const u=nt===1?0.5:i/(nt-1),R=34+r()*22;cs.push([lerp(-46,46,u)+(r()-0.5)*18,-34-r()*26-R*0.25,R])}
 const base=new Path2D(),lit=new Path2D();let x0=1e9,x1=-1e9,top=0;for(const [x,y,R] of cs){C_circ(base,x,y,R);C_circ(lit,x-R*0.12,y-R*0.2,R*0.86);x0=Math.min(x0,x-R);x1=Math.max(x1,x+R);top=Math.min(top,y-R)}
 base.rect(-80,-28,160,28);return C_CG[seed]={base,lit,cs,w:x1-x0,cx:(x0+x1)/2,top}}
function C_cloud(x,y,w,o={}){const a=o.a??1;if(a<=0.01)return;const G=C_cloudGeo(o.seed??1),t=o.t??CUR_T,S=CSKY(t);const lit=C_col(o.lit||S.cl),sh=C_col(o.shade||S.cs),k=w/G.w;
 g.save();g.globalAlpha*=a;g.translate(x,y);g.scale(k*(o.flip?-1:1),k*(o.sy||1));g.translate(-G.cx,0);
 g.save();g.beginPath();g.rect(-400,-400,800,400);g.clip();
 if(o.outline){g.strokeStyle=C_c(C_mx(sh,C_BK,0.35));g.lineWidth=(o.ow||3)/k*2;g.lineJoin='round';g.stroke(G.base)}
 g.fillStyle=C_c(sh);g.fill(G.base);
 g.save();g.clip(G.base);g.fillStyle=C_c(lit);g.fill(G.lit);
 const gr=g.createLinearGradient(0,-26,0,0);gr.addColorStop(0,C_c(sh,0));gr.addColorStop(1,C_c(C_mx(sh,C_BK,0.1),0.6));g.fillStyle=gr;g.fillRect(-150,-26,300,26);
 g.fillStyle=C_c(C_WH,o.gloss??0.28);g.beginPath();for(const [cx,cy,R] of G.cs)if(cy<-30){g.moveTo(cx-R*0.3+R*0.16,cy-R*0.5);g.ellipse(cx-R*0.3,cy-R*0.5,R*0.16,R*0.09,-0.5,0,7)}g.fill();
 g.restore();
 if(o.outline){g.strokeStyle=C_c(C_mx(sh,C_BK,0.35));g.lineWidth=(o.ow||3)/k;g.beginPath();g.moveTo(-80,-0.5);g.lineTo(80,-0.5);g.stroke()}
 g.restore();g.restore();
 if(o.rain>0){const n=Math.round(3+7*o.rain),rr=RNG((o.seed??1)*31+5),fall=o.fall??w*0.75,ds=o.dropS??Math.max(3,w*0.028),dc=o.dropCol||'#4F8FE8';
  g.save();for(let i=0;i<n;i++){const px=x+(rr()-0.5)*w*0.62,sp=0.55+rr()*0.5,ph=rr(),u=(t*sp*(o.speed??0.9)+ph)%1,py=y+ds*1.5+u*fall,s=ds*(0.75+rr()*0.5);
   g.globalAlpha=a*o.rain*cl(Math.min(u*7,(1-u)*4));drop(px,py,s,dc);g.fillStyle='rgba(255,255,255,0.75)';g.beginPath();g.ellipse(px-s*0.3,py-s*0.1,s*0.12,s*0.26,0.4,0,7);g.fill()}g.restore()}}

// ---------- sun with rays ----------
function C_sun(x,y,r,t,o={}){const a=o.a??1;if(a<=0.01)return;g.save();g.globalAlpha*=a;
 glow(x,y,r*5.5,o.glowc||'255,206,120',0.5,0.22);glow(x,y,r*2.4,'255,240,205',0.65,0.4);
 if(o.rays!==false){g.save();g.translate(x,y);g.rotate((t||0)*0.05);const n=o.n||16;const gr=g.createRadialGradient(0,0,r*0.9,0,0,r*2.5);gr.addColorStop(0,'rgba(255,214,110,0.85)');gr.addColorStop(1,'rgba(255,214,110,0)');g.fillStyle=gr;g.beginPath();
  for(let i=0;i<n;i++){const a0=i/n*Math.PI*2,L=r*(i%2?1.85:2.45),hw=Math.PI/n*0.42;g.moveTo(Math.cos(a0-hw)*r*0.95,Math.sin(a0-hw)*r*0.95);g.lineTo(Math.cos(a0)*L,Math.sin(a0)*L);g.lineTo(Math.cos(a0+hw)*r*0.95,Math.sin(a0+hw)*r*0.95);g.closePath()}g.fill();g.restore()}
 const dg=g.createRadialGradient(x-r*0.3,y-r*0.32,r*0.08,x,y,r);dg.addColorStop(0,o.c1||'#FFFBE2');dg.addColorStop(0.5,o.c2||'#FFDE63');dg.addColorStop(1,o.c3||'#FFB01F');g.fillStyle=dg;g.beginPath();g.arc(x,y,r,0,7);g.fill();
 g.strokeStyle='rgba(255,252,236,0.75)';g.lineWidth=r*0.07;g.lineCap='round';g.beginPath();g.arc(x,y,r*0.8,Math.PI*1.08,Math.PI*1.42);g.stroke();g.restore()}

// ---------- soft light rays (god rays) fanning from a point ----------
function C_rays(x,y,o={}){const a=o.a??0.2;if(a<=0.01)return;const n=o.n||6,len=o.len||1400,ang=o.ang??2.2,sp=o.spread??0.8,t=o.t??CUR_T,col=o.col||'255,244,214';g.save();g.globalCompositeOperation='screen';
 for(let i=0;i<n;i++){const h=hash(i*13.7+(o.seed||0)),aa=ang+(n>1?(i/(n-1)-0.5)*sp:0)+Math.sin(t*0.25+i*1.7)*0.025,wd=(o.w||0.045)*(0.5+h),al=a*(0.45+0.55*hash(i*3.1+1))*(0.75+0.25*Math.sin(t*0.6+i*2.3));
  const gr=g.createLinearGradient(x,y,x+Math.cos(aa)*len,y+Math.sin(aa)*len);gr.addColorStop(0,`rgba(${col},${al})`);gr.addColorStop(0.55,`rgba(${col},${al*0.35})`);gr.addColorStop(1,`rgba(${col},0)`);g.fillStyle=gr;
  g.beginPath();g.moveTo(x,y);g.lineTo(x+Math.cos(aa-wd)*len,y+Math.sin(aa-wd)*len);g.lineTo(x+Math.cos(aa+wd)*len,y+Math.sin(aa+wd)*len);g.closePath();g.fill()}g.restore()}

// ---------- sparkle: a four-point star with a soft glow ----------
function C_starPath(s,q=0.16){g.beginPath();g.moveTo(0,-s);g.quadraticCurveTo(s*q,-s*q,s,0);g.quadraticCurveTo(s*q,s*q,0,s);g.quadraticCurveTo(-s*q,s*q,-s,0);g.quadraticCurveTo(-s*q,-s*q,0,-s);g.closePath()}
function C_sparkle(x,y,s,a=1,o={}){if(a<=0.01||s<=0.5)return;const col=o.col||'255,236,170';g.save();g.globalAlpha*=a;glow(x,y,s*2.2,col,0.55,0.35);g.translate(x,y);g.rotate(o.rot||0);
 const gr=g.createRadialGradient(0,0,0,0,0,s);gr.addColorStop(0,'#FFFFFF');gr.addColorStop(0.3,'#FFFFFF');gr.addColorStop(1,`rgba(${col},0.9)`);g.fillStyle=gr;
 if(o.edge){g.strokeStyle=o.edge;g.lineWidth=Math.max(0.8,s*0.06);C_starPath(s);g.stroke()}C_starPath(s);g.fill();
 if(o.small!==false){g.rotate(Math.PI/4);C_starPath(s*0.42,0.2);g.fill()}g.restore()}

// ---------- rolling hills: layered, far ones hazed toward the sky; optional mini trees; mirror for water reflections ----------
const C_HILLCOL=[['#A4D6B4','#76B693'],['#6FC45A','#3F9548'],['#49A846','#2B7D35']];   // far .. near, [crest, foot] in daylight
const C_MTNCOL=[['#A3B9E6','#7F9BCB'],['#6E9FC6','#4C7DA2'],['#55A07E','#33775B']];
function C_hillY(x,j,seed,amp,peak){const f=[0.0062,0.0089,0.0117][j%3],ph=hash(seed*3+j)*6.28,ph2=hash(seed*5+j*7)*6.28;
 if(peak){const s=Math.pow(Math.max(0,0.5+0.5*Math.sin(x*f*0.85+ph)),1.5)*0.8+0.16*(vnoise(x*0.03,seed+j)*0.5+0.5)+0.12*Math.max(0,Math.sin(x*f*2.1+ph2));return s*amp}
 return (0.55+0.28*Math.sin(x*f+ph)+0.14*Math.sin(x*f*2.3+ph2)+0.1*vnoise(x*0.02+j*10,seed+j))*amp}
function C_miniTree(x,y,s,t,seed){const r=RNG(seed),d=C_tint('#2C7F36',t),m=C_tint('#4DAA45',t),l=C_tint('#8AD06A',t),tr=C_tint('#8A5A3A',t),q=0.85+r()*0.3;
 g.fillStyle=C_c(tr);g.fillRect(x-s*0.06,y-s*0.6,s*0.12,s*0.64);
 let P=new Path2D();C_circ(P,x,y-s*0.92*q,s*0.4);C_circ(P,x-s*0.24,y-s*0.72*q,s*0.28);C_circ(P,x+s*0.25,y-s*0.74*q,s*0.28);g.fillStyle=C_c(d);g.fill(P);
 P=new Path2D();C_circ(P,x-s*0.06,y-s*0.97*q,s*0.31);C_circ(P,x-s*0.26,y-s*0.77*q,s*0.19);g.fillStyle=C_c(m);g.fill(P);
 g.fillStyle=C_c(l,0.9);g.beginPath();g.arc(x-s*0.15,y-s*1.08*q,s*0.12,0,7);g.fill()}
function C_hills(t,y,o={}){const a=o.a??1;if(a<=0.01)return;const S=CSKY(t),n=o.n||3,amp=o.amp||60,gap=o.gap??amp*0.42,seed=o.seed||1,bot=o.bot??H*2.4,x0=o.x0??-W*0.7,x1=o.x1??W*1.7,cols=o.cols||C_HILLCOL,mir=o.mirror;
 g.save();g.globalAlpha*=a;
 for(let j=0;j<n;j++){const jj=n===1?2:n===2?j+1:j,yb=y-(n-1-j)*gap,A=amp*(1.2-0.2*(n-1-j));
  let ct=o.tint===false?C_col(cols[jj][0]):C_tint(cols[jj][0],t),cb=o.tint===false?C_col(cols[jj][1]):C_tint(cols[jj][1],t);const hz=(o.haze??0.42)*(jj===0?1:jj===1?0.35:0.12);ct=C_mx(ct,S.hz,hz);cb=C_mx(cb,S.hz,hz*0.7);
  if(mir!=null){ct=C_mx(ct,S.deep,0.35);cb=C_mx(cb,S.deep,0.35)}
  const P=new Path2D(),pts=[];for(let x=x0;x<=x1;x+=10){let yy=yb-C_hillY(x,jj,seed,A,o.peak);let xx=x;if(mir!=null){yy=mir+(mir-yy)*0.82;xx=x+Math.sin(yy*0.28+t*2.2)*2.2}pts.push([xx,yy])}
  pts.forEach(([px,py],i)=>i?P.lineTo(px,py):P.moveTo(px,py));if(mir!=null){P.lineTo(x1,mir);P.lineTo(x0,mir)}else{P.lineTo(x1,bot);P.lineTo(x0,bot)}P.closePath();
  const gt=mir!=null?mir:yb-A,gb=mir!=null?mir+A:yb+gap*1.6+30,gr=g.createLinearGradient(0,gt,0,gb);gr.addColorStop(0,C_c(mir!=null?cb:ct));gr.addColorStop(1,C_c(mir!=null?ct:cb));g.fillStyle=gr;g.fill(P);
  if(mir==null){g.save();g.strokeStyle=C_c(C_mx(S.lc,C_WH,0.4),0.38*(jj===0?0.6:1));g.lineWidth=2;g.lineJoin='round';g.beginPath();pts.forEach(([px,py],i)=>i?g.lineTo(px,py+1):g.moveTo(px,py+1));g.stroke();g.restore();
   if(jj===1&&(o.trees??0)>0){const r=RNG(seed*97+3);for(let i=0;i<o.trees;i++){const tx=40+(i+r()*0.7)*(W-40)/o.trees,ty=yb-C_hillY(tx,jj,seed,A,o.peak)+6;C_miniTree(tx,ty,(o.treeS||30)*(0.75+r()*0.5),t,seed*11+i)}}
   if(jj===2&&(o.flowers??0)>0){const r=RNG(seed*53+7),FC=['#C58BEA','#F49AC6','#FFE36A','#FFFFFF','#FF9E7A'];for(let i=0;i<o.flowers;i++){const fx=(i+r())*W/o.flowers,fy=yb-C_hillY(fx,jj,seed,A,o.peak)+14+r()*90,fs=2.4+r()*2.2,fc=C_c(C_tint(FC[i%5],t));g.fillStyle=fc;g.beginPath();for(let q=0;q<5;q++){const qa=q*1.2566+i;C_circ(g,fx+Math.cos(qa)*fs,fy+Math.sin(qa)*fs,fs*0.75)}g.fill();g.fillStyle=C_c(C_tint('#FFD24A',t));g.beginPath();g.arc(fx,fy,fs*0.5,0,7);g.fill()}}}}
 g.restore()}

// ---------- grass tufts along a baseline ----------
function C_grass(x,y,w,o={}){const t=o.t??CUR_T,h=o.h||20,r=RNG(o.seed||3),n=Math.max(2,Math.round(w/5*(o.dens||1))),base=o.base||(()=>y);
 const cols=(o.cols||['#2B7F33','#4DAE41','#82D45A']).map(c=>C_c(o.tint===false?C_col(c):C_tint(c,t)));const P=[new Path2D(),new Path2D(),new Path2D()];
 for(let i=0;i<n;i++){const bx=x+(i+r()*0.8)*w/n,by=base(bx)+2,hh=h*(0.45+r()*0.8),lean=(r()-0.5)*hh*0.7+Math.sin(t*1.7+bx*0.045)*hh*0.12*(o.sway??1),bw=1.5+r()*2.2,q=r(),p=P[q<0.3?0:q<0.68?1:2];
  p.moveTo(bx-bw,by);p.quadraticCurveTo(bx-bw*0.2+lean*0.3,by-hh*0.6,bx+lean,by-hh);p.quadraticCurveTo(bx+bw*0.4+lean*0.3,by-hh*0.55,bx+bw,by);p.closePath()}
 g.save();g.globalAlpha*=o.a??1;P.forEach((p,i)=>{g.fillStyle=cols[i];g.fill(p)});g.restore()}

// ---------- leaf: glossy, gradient, midrib and veins ----------
function C_leaf(x,y,s,ang,o={}){if(s<=0.5)return;const t=o.t??CUR_T,wd=o.w??0.34,tc=c=>o.tint===false?C_col(c):C_tint(c,t),c1=tc(o.col||'#4CB648'),c2=tc(o.col2||'#2A8A3A');
 g.save();g.globalAlpha*=o.a??1;g.translate(x,y);g.rotate(ang);const P=new Path2D();P.moveTo(0,0);P.bezierCurveTo(s*0.22,-s*wd*1.15,s*0.72,-s*wd*1.0,s,0);P.bezierCurveTo(s*0.72,s*wd*0.95,s*0.22,s*wd*1.1,0,0);
 const gr=g.createLinearGradient(0,-s*wd,0,s*wd);gr.addColorStop(0,C_c(C_mx(c1,C_WH,0.14)));gr.addColorStop(0.5,C_c(c1));gr.addColorStop(1,C_c(c2));g.fillStyle=gr;g.fill(P);
 if(o.outline!==false){g.strokeStyle=C_c(C_mx(c2,C_BK,0.3),0.8);g.lineWidth=Math.max(0.8,s*0.016);g.stroke(P)}
 g.strokeStyle=o.vein||C_c(C_mx(c1,C_WH,0.5),0.85);g.lineWidth=Math.max(0.7,s*0.02);g.lineCap='round';g.beginPath();g.moveTo(s*0.04,0);g.quadraticCurveTo(s*0.5,-s*0.03,s*0.9,0);
 for(let i=1;i<=4;i++){const u=i/5.2;g.moveTo(s*u,-s*0.012);g.lineTo(s*(u+0.12),-s*wd*0.58*(1-u*0.45));g.moveTo(s*u,s*0.012);g.lineTo(s*(u+0.12),s*wd*0.58*(1-u*0.45))}g.stroke();
 g.fillStyle='rgba(255,255,255,0.2)';g.beginPath();g.ellipse(s*0.42,-s*wd*0.45,s*0.2,s*wd*0.16,-0.08,0,7);g.fill();g.restore()}
// a bush of big rounded leaves (gratitude-card style)
function C_bush(x,y,s,o={}){const t=o.t??CUR_T,r=RNG(o.seed||5),n=o.n||7,cols=o.cols||['#1A8F66','#2BB57D','#62D49C'];
 for(let i=0;i<n;i++){const u=n===1?0.5:i/(n-1),ang=-Math.PI*(0.93-0.86*u)+(r()-0.5)*0.18,len=s*(0.62+0.45*Math.sin(Math.PI*u))*(0.85+r()*0.3),ci=i%2;
  C_leaf(x+(u-0.5)*s*0.34,y,len,ang+Math.sin(t*1.1+i+(o.seed||5))*0.025*(o.sway??1),{col:cols[ci+1],col2:cols[ci],w:0.4,vein:'rgba(235,255,240,0.6)',t,tint:o.tint})}}

// ---------- flower: purple / pink petals, golden centre, optional stem; p = bloom 0..1 ----------
function C_flower(x,y,s,o={}){const p=o.p??1;if(p<=0.01||s<=0.3)return;const t=o.t??CUR_T,tc=c=>o.tint===false?C_col(c):C_tint(c,t),c1=tc(o.col||'#B983E6'),c2=tc(o.col2||C_mx(C_col(o.col||'#B983E6'),[70,20,120],0.45)),n=o.petals||5,k=p>=1?1:spr(p*1.1,12,0.6);
 if(o.stem>0){const sx=x+Math.sin(t*1.2+x)*2;g.save();g.strokeStyle=C_c(tc('#3F9A3E'));g.lineWidth=Math.max(1,s*0.12);g.lineCap='round';g.beginPath();g.moveTo(x,y);g.quadraticCurveTo(sx+s*0.3,y+o.stem*0.5,sx,y+o.stem);g.stroke();g.restore();
  C_leaf(x+s*0.1,y+o.stem*0.55,s*1.2,-0.5,{t,w:0.3,col:'#5CBF4E',col2:'#2F8A3A',tint:o.tint});C_leaf(x-s*0.05,y+o.stem*0.75,s*1.1,Math.PI+0.5,{t,w:0.3,col:'#5CBF4E',col2:'#2F8A3A',tint:o.tint})}
 g.save();g.globalAlpha*=o.a??1;g.translate(x,y);g.rotate((o.rot||0)+Math.sin(t*1.3+x*0.1)*0.05);g.scale(k*s,k*s);
 const pg=g.createRadialGradient(0,0,0.08,0,0,1.1);pg.addColorStop(0,C_c(C_mx(c1,C_WH,0.55)));pg.addColorStop(0.45,C_c(c1));pg.addColorStop(1,C_c(c2));
 for(let i=0;i<n;i++){g.save();g.rotate(i/n*Math.PI*2);g.beginPath();g.ellipse(0,-0.56,0.36,0.56,0,0,7);g.fillStyle=pg;g.fill();g.strokeStyle=C_c(C_mx(c2,C_BK,0.2),0.7);g.lineWidth=0.05;g.stroke();g.restore()}
 const cg=g.createRadialGradient(-0.08,-0.08,0.02,0,0,0.3);cg.addColorStop(0,'#FFF4A8');cg.addColorStop(1,'#F0A83A');g.fillStyle=cg;g.beginPath();g.arc(0,0,0.28,0,7);g.fill();
 g.fillStyle='rgba(150,80,10,0.5)';for(let i=0;i<5;i++){g.beginPath();g.arc(Math.cos(i*1.3)*0.13,Math.sin(i*1.3)*0.13,0.035,0,7);g.fill()}g.restore()}

// ---------- cartoon tree: thick twisting trunk with root flare, puffy 3-green canopy, scalloped outline; p = grow ----------
const C_TREEG={};
function C_treeGeo(seed){if(C_TREEG[seed])return C_TREEG[seed];const r=RNG(seed*131+7);const j=(v,a)=>v+(r()-0.5)*a;
 const back=[[-0.42,-0.56,0.14],[-0.31,-0.74,0.16],[-0.12,-0.85,0.17],[0.11,-0.88,0.17],[0.31,-0.77,0.16],[0.44,-0.6,0.14],[0.27,-0.5,0.15],[0.02,-0.53,0.17],[-0.23,-0.49,0.15]].map(([x,y,R])=>[j(x,0.04),j(y,0.04),R*(0.9+r()*0.2)]);
 const mid=back.map(([x,y,R])=>[x-0.028,y-0.04,R*0.82]);
 const top=[[-0.22,-0.81,0.1],[0.03,-0.94,0.11],[0.27,-0.86,0.09],[-0.36,-0.66,0.08],[0.13,-0.7,0.09]].map(([x,y,R])=>[j(x,0.03),j(y,0.03),R]);
 const curls=[];for(let i=0;i<12;i++){const c=back[Math.floor(r()*back.length)];curls.push([c[0]+(r()-0.5)*c[2]*1.2,c[1]+(r()-0.2)*c[2]*0.9,c[2]*(0.28+r()*0.22)])}
 for(const A of [back,mid,top,curls])for(const c of A)c[1]-=0.07;return C_TREEG[seed]={back,mid,top,curls}}
function C_trunkPath(k){const s=v=>v*k,P=new Path2D();P.moveTo(s(-0.31),s(0.01));
 P.bezierCurveTo(s(-0.19),s(-0.02),s(-0.115),s(-0.06),s(-0.095),s(-0.17));P.bezierCurveTo(s(-0.07),s(-0.3),s(-0.1),s(-0.41),s(-0.19),s(-0.53));P.lineTo(s(-0.125),s(-0.565));
 P.bezierCurveTo(s(-0.055),s(-0.47),s(-0.02),s(-0.45),s(0.0),s(-0.48));P.bezierCurveTo(s(0.04),s(-0.53),s(0.1),s(-0.59),s(0.16),s(-0.635));P.lineTo(s(0.215),s(-0.59));
 P.bezierCurveTo(s(0.12),s(-0.47),s(0.08),s(-0.33),s(0.1),s(-0.17));P.bezierCurveTo(s(0.12),s(-0.06),s(0.2),s(-0.02),s(0.33),s(0.01));
 P.bezierCurveTo(s(0.2),s(0.035),s(0.08),s(0.02),s(0.0),s(0.04));P.bezierCurveTo(s(-0.08),s(0.02),s(-0.2),s(0.035),s(-0.31),s(0.01));P.closePath();return P}
function C_circles(cs,k){const P=new Path2D();for(const [x,y,R] of cs)C_circ(P,x*k,y*k,R*k);return P}
function C_tree(x,y,s,o={}){const t=o.t??CUR_T,p=o.p??1;if(p<=0.001||s<=0.01)return;const G=C_treeGeo(o.seed||1),k=s*500,tc=c=>o.tint===false?C_col(c):C_tint(c,t);
 const L=(o.leaf||['#2E7C34','#4EA63F','#88CC5A']).map(tc),ol=C_c(C_mx(L[0],C_BK,0.38)),b0=tc((o.bark||[])[0]||'#CDA27A'),b1=tc((o.bark||[])[1]||'#8D6143'),bo=C_c(C_mx(b1,C_BK,0.45));
 g.save();g.globalAlpha*=o.a??1;g.translate(x,y);g.lineJoin='round';g.lineCap='round';
 const tk=eo(cl(p/0.45));g.save();if(tk<1){g.beginPath();g.rect(-k,-k*0.66*tk-1,2*k,k*0.66*tk+k*0.12);g.clip()}
 const T=C_trunkPath(k);g.strokeStyle=bo;g.lineWidth=Math.max(2,k*0.009);g.stroke(T);const tg=g.createLinearGradient(-k*0.16,0,k*0.18,0);tg.addColorStop(0,C_c(C_mx(b0,C_WH,0.15)));tg.addColorStop(0.45,C_c(b0));tg.addColorStop(1,C_c(b1));g.fillStyle=tg;g.fill(T);
 g.strokeStyle=C_c(C_mx(b1,C_BK,0.25),0.55);g.lineWidth=Math.max(1,k*0.005);g.beginPath();
 for(const [a,b,c,d,e,f] of [[-0.05,-0.08,-0.03,-0.2,-0.06,-0.32],[0.04,-0.06,0.06,-0.18,0.04,-0.28],[-0.2,-0.005,-0.12,-0.03,-0.08,-0.08],[0.2,-0.005,0.13,-0.03,0.09,-0.09],[0.0,-0.36,0.03,-0.42,0.08,-0.5]]){g.moveTo(a*k,b*k);g.quadraticCurveTo(c*k,d*k,e*k,f*k)}g.stroke();g.restore();
 if(p>0.3){const ck=p>=1?1:spr((p-0.3)/0.7*1.6,10,0.55),sw=Math.sin(t*0.9+(o.seed||1))*0.012*(o.sway??1);g.save();g.translate(0,-k*0.62);g.rotate(sw);g.scale(ck,ck);g.translate(0,k*0.62);
  const Bp=C_circles(G.back,k),Mp=C_circles(G.mid,k),Tp=C_circles(G.top,k);
  g.lineWidth=Math.max(3,k*0.014);g.strokeStyle=ol;g.stroke(Bp);g.fillStyle=C_c(L[0]);g.fill(Bp);
  g.save();g.clip(Bp);g.lineWidth=Math.max(2,k*0.008);g.strokeStyle=C_c(C_mx(L[0],C_BK,0.25),0.75);g.stroke(Mp);const mg=g.createLinearGradient(0,-1.02*k,0,-0.45*k);mg.addColorStop(0,C_c(L[2]));mg.addColorStop(0.55,C_c(L[1]));mg.addColorStop(1,C_c(C_mx(L[1],L[0],0.4)));g.fillStyle=mg;g.fill(Mp);
  for(const [cx,cy,R] of G.top){const rg=g.createRadialGradient((cx-R*0.3)*k,(cy-R*0.35)*k,0,cx*k,cy*k,R*k*1.25);rg.addColorStop(0,C_c(C_mx(L[2],C_WH,0.25),0.85));rg.addColorStop(0.6,C_c(L[2],0.35));rg.addColorStop(1,C_c(L[2],0));g.fillStyle=rg;g.beginPath();g.arc(cx*k,cy*k,R*k*1.25,0,7);g.fill()}g.restore();
  g.strokeStyle=C_c(C_mx(L[0],C_BK,0.2),0.6);g.lineWidth=Math.max(1,k*0.005);g.beginPath();for(const [cx,cy,R] of G.curls){g.moveTo(cx*k+R*k*Math.cos(3.6),cy*k+R*k*Math.sin(3.6));g.arc(cx*k,cy*k,R*k,3.6,5.9)}g.stroke();
  g.fillStyle='rgba(255,255,230,0.22)';g.beginPath();for(const [cx,cy,R] of G.top){g.moveTo(cx*k-R*k*0.3+R*k*0.3,cy*k-R*k*0.35);g.ellipse(cx*k-R*k*0.3,cy*k-R*k*0.35,R*k*0.3,R*k*0.18,-0.4,0,7)}g.fill();
  if(o.flowers){const r=RNG((o.seed||1)*7+1);for(let i=0;i<o.flowers;i++){const c=G.back[Math.floor(r()*G.back.length)],a=r()*6.28;C_flower((c[0]+Math.cos(a)*c[2]*0.6)*k,(c[1]+Math.sin(a)*c[2]*0.6)*k,k*0.022,{t,col:r()<0.5?'#E58BC0':'#B983E6',tint:o.tint})}}
  g.restore()}
 g.restore()}

// ---------- roots: brown, spreading wide, branching, rounded tips; p = grow, lit = water/light flowing along them ----------
const C_RG={};
// geometry (unit = reach R): branches {pts:[[x,y,w]], d}; d 0 = main root, 1 = branch, 2 = twig. Cached per seed/spread/depth/n.
function C_rootGeo(seed,spread=1,depth=2,nm=6){const key=seed+'|'+spread+'|'+depth+'|'+nm;if(C_RG[key])return C_RG[key];const r=RNG(seed*977+3),B=[];
 // one branch: N steps; main roots sag gently, outer ones curl up at the tip; branches droop; width tapers to a rounded tip
 function br(x,y,a,L,w0,d,curl,droop){const N=d?9:18,pts=[[x,y,w0]];let px=x,py=y;
  for(let i=1;i<=N;i++){const q=i/N;
   if(curl&&q>0.66)a+=curl*(0.09+0.16*(q-0.66)*3);else a+=(Math.PI/2-a)*(droop||0.02)+(r()-0.5)*(d?0.16:0.07);
   px+=Math.cos(a)*L/N;py+=Math.sin(a)*L/N;pts.push([px,py,w0*(1-0.86*Math.pow(q,1.05))+0.005])}
  const b={pts,d};B.push(b);
  if(d<depth){const n=d===0?5+Math.floor(r()*3):2+Math.floor(r()*2);
   for(let j=0;j<n;j++){const q=d===0?lerp(0.2,0.88,(j+0.25+r()*0.5)/n):0.35+r()*0.4,at=Math.max(1,Math.round(q*N)),P=pts[at],P0=pts[at-1],ha=Math.atan2(P[1]-P0[1],P[0]-P0[0]);
    const side=(j%2?1:-1),ba=d===0?lerp(ha,Math.PI/2,0.55)+side*(0.25+r()*0.3):ha+side*(0.45+r()*0.35);
    br(P[0],P[1],ba,L*(d===0?0.22+r()*0.13:0.3+r()*0.16)*(1-q*0.3),P[2]*(d===0?0.6:0.55),d+1,(d===0&&r()<0.3)?(Math.cos(ba)>0?-1:1)*0.7:0,d===0?0.05:0.04)}}
  return b}
 const mains=[];
 for(let i=0;i<nm;i++){const u=i/(nm-1),c=Math.abs(u-0.5)*2,a=lerp(Math.PI-0.1,0.1,u)+(r()-0.5)*0.06,
  L=lerp(0.62,1.15,Math.pow(c,0.9))*(0.92+r()*0.16)*spread,w=lerp(0.17,0.13,c),curl=c>0.75?(Math.cos(a)>0?-1:1):0;
  mains.push(br((u-0.5)*0.3,0.11,a,L,w,0,curl,c>0.75?0.012:0.03))}
 B.mains=mains;return C_RG[key]=B}
function C_roots(x,y,s,p=1,o={}){if(p<=0)return;const t=o.t??CUR_T,R=s*300,dep=o.depth??2,Bs=C_rootGeo(o.seed||1,o.spread||1,dep,o.n||6),md=dep+1,tc=c=>o.tint===false?C_col(c):C_tint(c,t);
 const base=tc(o.col||'#B5733F'),body=C_c(base),edge=C_c(C_mx(base,C_BK,0.5)),hi=C_c(C_mx(base,C_WH,0.4),0.55),sh=C_c(C_mx(base,C_BK,0.35),0.45),bark=C_c(C_mx(base,C_BK,0.42),0.4),lit=o.lit||0,lc=o.litCol||'120,214,255';
 g.save();g.globalAlpha*=o.a??1;g.translate(x,y);g.lineCap='round';g.lineJoin='round';
 // grow: level d starts when p*md passes d; each branch grows from its base
 const polys=[];for(const b of Bs){const f=cl(p*md-b.d);if(f<=0)continue;const n=b.pts.length-1,m=f*n,P=[];
  for(let i=0;i<=Math.ceil(m);i++){const q=Math.min(i,m),i0=Math.floor(q),i1=Math.min(n,i0+1),fr=q-i0,A=b.pts[i0],Bq=b.pts[i1];P.push([lerp(A[0],Bq[0],fr)*R,lerp(A[1],Bq[1],fr)*R,lerp(A[2],Bq[2],fr)*R])}
  if(P.length>1)polys.push({P,d:b.d})}
 const nrm=(P,i)=>{const a=P[Math.min(P.length-1,i+1)],c=P[Math.max(0,i-1)],dx=a[0]-c[0],dy=a[1]-c[1],l=Math.hypot(dx,dy)||1;return [-dy/l,dx/l]};
 const shape=(P,ex)=>{const L=[],Rr=[];for(let i=0;i<P.length;i++){const [nx,ny]=nrm(P,i),w=P[i][2]/2+ex;L.push([P[i][0]+nx*w,P[i][1]+ny*w]);Rr.push([P[i][0]-nx*w,P[i][1]-ny*w])}
  const Q=new Path2D();L.forEach(([px,py],i)=>i?Q.lineTo(px,py):Q.moveTo(px,py));const e=P[P.length-1],re=Math.max(0.6,e[2]/2+ex);
  const a0=Math.atan2(L[L.length-1][1]-e[1],L[L.length-1][0]-e[0]);Q.arc(e[0],e[1],re,a0,a0-Math.PI,true);Rr.reverse().forEach(([px,py])=>Q.lineTo(px,py));
  const s0=P[0],rs=Math.max(0.6,s0[2]/2+ex),b0=Math.atan2(Rr[Rr.length-1][1]-s0[1],Rr[Rr.length-1][0]-s0[0]);Q.arc(s0[0],s0[1],rs,b0,b0-Math.PI,true);Q.closePath();return Q};
 const ex=Math.max(1.4,R*0.009),fw=(o.fw??0.19*R)*cl(p*3),fb=Math.max(fw*1.25,0.27*R)*cl(p*3),fh=0.13*R;
 // flared base: the trunk foot the main roots grow out of
 const flare=ex2=>{const Q=new Path2D();Q.moveTo(-fw-ex2,-3);Q.bezierCurveTo(-fw-ex2,fh*0.45,-fb*0.9-ex2,fh*0.7,-fb-ex2,fh+ex2);Q.lineTo(fb+ex2,fh+ex2);Q.bezierCurveTo(fb*0.9+ex2,fh*0.7,fw+ex2,fh*0.45,fw+ex2,-3);Q.closePath();return Q};
 // crotch webs: fill the V between neighbouring main roots near the base so the split is smooth (like a real root flare)
 const mainsP=polys.filter(q=>q.d===0&&q.P.length>4),web=ex2=>{const Q=new Path2D();for(let i=0;i+1<mainsP.length;i++){const A=mainsP[i].P,Bq=mainsP[i+1].P,ka=Math.min(A.length-1,4),kb=Math.min(Bq.length-1,4);
   Q.moveTo(A[0][0],A[0][1]-ex2);Q.lineTo(A[ka][0],A[ka][1]);Q.quadraticCurveTo((A[ka][0]+Bq[kb][0])/2,Math.min(A[ka][1],Bq[kb][1])-(1-0.6)*Math.abs(A[ka][0]-Bq[kb][0])*0.2,Bq[kb][0],Bq[kb][1]);Q.lineTo(Bq[0][0],Bq[0][1]-ex2);Q.closePath()}return Q};
 g.fillStyle=edge;if(fw>0){g.fill(flare(ex));g.fill(web(ex))}for(const q of polys)g.fill(shape(q.P,ex));
 const U=new Path2D();if(fw>0){U.addPath(flare(0));U.addPath(web(0))}for(const q of polys)U.addPath(shape(q.P,0));
 g.fillStyle=body;g.fill(U);
 // shading inside the silhouette: underside shade, top highlight, bark lines on the thick roots
 g.save();g.clip(U);
 const side=(q,off,wk,col,from=0,to=1)=>{const P=q.P,n=P.length,i0=Math.floor(from*(n-1)),i1=Math.ceil(to*(n-1));g.strokeStyle=col;g.lineCap='butt';
   const pt=i=>{const [nx,ny]=nrm(P,i),sg=ny<0?1:-1,o1=off*P[i][2]*sg;return [P[i][0]+nx*o1,P[i][1]+ny*o1]};
   for(let a=i0;a<i1;a+=4){const b=Math.min(i1,a+4);g.lineWidth=Math.max(0.8,P[Math.min(n-1,a+2)][2]*wk);g.beginPath();for(let i=a;i<=b;i++){const [x1,y1]=pt(i);i===a?g.moveTo(x1,y1):g.lineTo(x1,y1)}g.stroke()}g.lineCap='round'};
 for(const q of polys)side(q,-0.32,0.42,sh);
 for(const q of polys)if(q.d<2)side(q,0.26,0.2,hi,0,0.92);
 for(const q of polys)if(q.d===0){side(q,0.06,0.07,bark,0.04,0.55);side(q,-0.12,0.06,bark,0.1,0.42)}
 if(fw>0){const gr=g.createLinearGradient(-fw,0,fw,0);gr.addColorStop(0,'rgba(255,255,255,0)');gr.addColorStop(0.35,C_c(C_mx(base,C_WH,0.3),0.35));gr.addColorStop(1,'rgba(0,0,0,0.12)');g.fillStyle=gr;g.fill(flare(0))}
 g.restore();
 // water / light travelling along the roots: a glowing blue core inside each root (base -> tips), a bright bead at the front
 if(lit>0){g.save();g.shadowColor=`rgba(${lc},0.8)`;g.shadowBlur=7*SC;
  for(const q of polys){const f=cl(lit*md-q.d);if(f<=0)continue;const P=q.P,n=P.length-1,m=Math.max(1,Math.floor(n*f));
   g.lineCap='butt';for(let a=0;a<m;a+=4){const b=Math.min(m,a+4);g.strokeStyle=`rgba(${lc},${0.5+0.3*(a/m)})`;g.lineWidth=Math.max(1,P[Math.min(n,a+2)][2]*0.28);g.beginPath();for(let i=a;i<=b;i++)i===a?g.moveTo(P[i][0],P[i][1]):g.lineTo(P[i][0],P[i][1]);g.stroke()}g.lineCap='round';
   if(f<1){const e=P[m];g.fillStyle='rgba(235,250,255,0.95)';g.beginPath();g.arc(e[0],e[1],Math.max(1.5,e[2]*0.32),0,7);g.fill()}}
  g.restore()}
 g.restore()}

// ---------- water: ripple rings (raindrop2), crown splash, glossy drop, falling drop, puddle ----------
function C_ripples(x,y,t,t0,o={}){const n=o.n??4,sc=o.sc??1,flat=o.flat??0.24,life=o.life??2.2,sp=o.speed??95,lc=o.light||'240,250,255',dc=o.dark||'18,64,150';g.save();
 for(let j=0;j<n;j++){const age=t-t0-j*0.22;if(age<=0)continue;const R=(10+age*sp)*sc,al=cl(1-age/life)*(o.a??1);if(al<=0.01)continue;
  g.strokeStyle=`rgba(${dc},${0.42*al})`;g.lineWidth=2.2+sc*0.9;g.beginPath();g.ellipse(x,y+R*flat*0.1,R*0.94,R*flat*0.94,0,0,7);g.stroke();
  g.strokeStyle=`rgba(${lc},${0.85*al})`;g.lineWidth=1.3+sc*0.45;g.beginPath();g.ellipse(x,y,R,R*flat,0,0,7);g.stroke()}
 const age=t-t0;if(age>0&&age<0.6){const k=1-age/0.6;g.fillStyle=`rgba(${dc},${0.35*k})`;g.beginPath();g.ellipse(x,y,9*sc,9*sc*flat,0,0,7);g.fill()}g.restore()}
function C_splash(x,y,t,t0,s=1,o={}){const u=t-t0;if(u<0||u>1.25)return;const sd=(o.seed||77)%97,N=11,grow=eo(cl(u/0.45)),R0=(11+u*44)*s,R1=R0*1.38+9*s*grow,Hc=54*s*Math.sin(Math.PI*cl(u/0.62)),fade=cl(1-(u-0.46)/0.32),fy=0.3;g.save();g.lineJoin='round';g.lineCap='round';
 const hh=a=>Hc*(0.84+0.12*Math.sin(3*a+sd)+0.09*Math.sin(7*a+sd*2.1)),top=a=>[x+Math.cos(a)*R1,y+Math.sin(a)*R1*fy-hh(a)];
 const wall=(front)=>{if(Hc<1.5||fade<=0)return;const a0=front?0:Math.PI,st=20;g.beginPath();for(let i=0;i<=st;i++){const [px,py]=top(a0+Math.PI*i/st);g.lineTo(px,py)}for(let i=st;i>=0;i--){const a=a0+Math.PI*i/st;g.lineTo(x+Math.cos(a)*R0,y+Math.sin(a)*R0*fy)}g.closePath();
  const gr=g.createLinearGradient(0,y-Hc,0,y);gr.addColorStop(0,`rgba(240,252,255,${(front?0.7:0.45)*fade})`);gr.addColorStop(0.6,`rgba(150,215,250,${(front?0.42:0.28)*fade})`);gr.addColorStop(1,`rgba(70,150,225,${(front?0.55:0.35)*fade})`);g.fillStyle=gr;g.fill();
  g.strokeStyle=`rgba(255,255,255,${(front?0.85:0.5)*fade})`;g.lineWidth=1.6*s;g.beginPath();for(let i=0;i<=st;i++){const [px,py]=top(a0+Math.PI*i/st);i?g.lineTo(px,py):g.moveTo(px,py)}g.stroke()};
 const fingers=(front)=>{if(Hc<2||fade<=0)return;for(let i=0;i<N;i++){const a=i/N*Math.PI*2+sd*0.37+0.35*hash(i+sd),sa=Math.sin(a);if((sa>0)!==front)continue;const [bx,by]=top(a),fl=Hc*(0.22+0.38*hash(i*1.7+sd)),tx=bx+Math.cos(a)*fl*0.42,ty=by-fl,w0=4.2*s;
   g.beginPath();g.moveTo(bx-w0,by+2*s);g.quadraticCurveTo(bx+(tx-bx)*0.35-w0*0.3,by-fl*0.55,tx,ty);g.quadraticCurveTo(bx+(tx-bx)*0.35+w0*0.3,by-fl*0.5,bx+w0,by+2*s);g.closePath();g.fillStyle=`rgba(232,248,255,${0.82*fade})`;g.fill();
   if(u<0.5)B_drop(tx,ty-2.2*s,(2.1+1.4*hash(i*5.3+sd))*s,fade,true)}};
 wall(false);fingers(false);
 if(u>0.3){const ju=cl((u-0.3)/0.78),hj=74*s*Math.sin(Math.PI*ju);if(hj>2){g.beginPath();g.moveTo(x-6*s,y);g.bezierCurveTo(x-3*s,y-hj*0.45,x-1.5*s,y-hj*0.8,x,y-hj);g.bezierCurveTo(x+1.5*s,y-hj*0.8,x+3*s,y-hj*0.45,x+6*s,y);g.closePath();const jg=g.createLinearGradient(0,y-hj,0,y);jg.addColorStop(0,'rgba(245,253,255,0.92)');jg.addColorStop(1,'rgba(110,190,245,0.5)');g.fillStyle=jg;g.fill();B_drop(x,y-hj-6*s,4.6*s,1,true)}}
 wall(true);fingers(true);
 if(u>0.42){const v=u-0.42;for(let i=0;i<N;i++){const a=i/N*Math.PI*2+sd*0.37+0.35*hash(i+sd),sp=(70+80*hash(i*9.1+sd))*s,px=x+Math.cos(a)*(R1+sp*v),py=y+Math.sin(a)*R1*fy-Hc*0.95-(150*s)*v+520*v*v;B_drop(px,py,(1.8+1.6*hash(i*3.7+sd))*s,cl(1-v/0.75),true)}}
 const ra=cl(1-u/1.1);g.strokeStyle=`rgba(240,250,255,${0.75*ra})`;g.lineWidth=1.8*s;g.beginPath();g.ellipse(x,y,R1*1.15,R1*0.34,0,0,7);g.stroke();g.restore()}
function C_drop(x,y,s,a=1,o={}){B_drop(x,y,s,a,o.deep?false:true,o.cut||0)}
function C_puddle(x,y,w,h,t,o={}){const S=CSKY(t);g.save();g.beginPath();g.ellipse(x,y+h*0.08,w/2+3,h/2+2,0,0,7);g.fillStyle='rgba(30,40,60,0.18)';g.fill();
 g.beginPath();g.ellipse(x,y,w/2,h/2,0,0,7);const gr=g.createLinearGradient(0,y-h/2,0,y+h/2);gr.addColorStop(0,C_c(C_mx(S.top,S.mid,0.4)));gr.addColorStop(0.55,C_c(S.mid));gr.addColorStop(1,C_c(C_mx(S.hz,C_WH,0.3)));g.fillStyle=gr;g.fill();g.save();g.clip();
 g.fillStyle='rgba(255,255,255,0.35)';g.beginPath();g.ellipse(x-w*0.18,y-h*0.12,w*0.22,h*0.1,0,0,7);g.fill();
 const r=RNG(o.seed||9);for(let i=0;i<(o.drops??3);i++){const px=x+(r()-0.5)*w*0.6,py=y+(r()-0.5)*h*0.35,per=1.1+r()*0.8,age=(t+r()*per)%per;C_ripples(px,py,t,t-age,{n:2,sc:0.3*w/200,flat:h/w,life:1.1,speed:70})}g.restore();
 g.strokeStyle='rgba(255,255,255,0.7)';g.lineWidth=1.6;g.beginPath();g.ellipse(x,y,w/2,h/2,0,0.15,Math.PI-0.15);g.stroke();g.strokeStyle='rgba(20,40,80,0.3)';g.beginPath();g.ellipse(x,y,w/2,h/2,0,Math.PI+0.1,Math.PI*2-0.1);g.stroke();g.restore()}

// ---------- rainbow ----------
const C_RB=['255,92,92','255,165,64','255,226,82','104,206,96','72,170,240','88,108,224','168,104,214'];
function C_rainbow(x,y,R,p=1,o={}){if(p<=0)return;const bw=(o.w||R*0.17)/7,a=o.a??0.55,a0=o.a0??Math.PI,span=(o.span??Math.PI)*cl(p);g.save();g.lineCap='butt';
 for(let i=0;i<7;i++){g.strokeStyle=`rgba(${C_RB[i]},${a})`;g.lineWidth=bw+0.9;g.beginPath();g.arc(x,y,R-i*bw,a0,a0+span);g.stroke()}
 g.globalCompositeOperation='screen';g.strokeStyle=`rgba(255,255,255,${a*0.25})`;g.lineWidth=bw*2;g.beginPath();g.arc(x,y,R-bw*1.5,a0,a0+span);g.stroke();g.restore()}

// ---------- vapour wisps rising off water ----------
function C_vapour(t,hz,amt,o={}){if(amt<=0.01)return;const r=RNG(o.seed||17),S=CSKY(t),col=C_s(C_mx(S.hz,C_WH,0.65));g.save();
 for(let i=0;i<14;i++){const x0=30+i*50+r()*30,ph=r(),sp=22+r()*18,life=340+r()*120,u=((t*sp+ph*life)%life)/life,y=hz-u*life*0.9,s=40+u*70+r()*20,x=x0+Math.sin(t*0.6+i*1.7)*16*u;g.globalAlpha=amt*0.42*Math.sin(Math.PI*u);g.drawImage(sprite(col,0.5),x-s,y-s*0.7,2*s,1.4*s)}g.restore();Wmist(hz-12,90,0.7*amt,t)}

// ---------- text with gradient fill, edge and soft shadow (QA-logged like T) ----------
function C_gradFill(cols,size){const gr=g.createLinearGradient(0,-size*0.42,0,size*0.42);cols.forEach((c,i)=>gr.addColorStop(i/(cols.length-1),c));return gr}
function C_T(s,x,y,size,col,o={}){const a=o.a??1;if(a<=0.003||!s)return 0;const fam=o.fam||FAM.display,wt=o.wt||'700',st=o.st||'normal',al=o.al||'center';g.save();g.globalAlpha*=a;g.font=F(size,fam,wt,st);g.letterSpacing=(o.ls||0)+'px';g.textAlign=al;g.textBaseline='middle';
 const w=g.measureText(s).width,x0=al==='center'?x-w/2:al==='right'?x-w:x;
 if(!QA.hideText){g.lineJoin='round';g.translate(x,y);
  if(o.shadow){g.save();g.shadowColor=`rgba(${o.shadow[3]||'10,22,60'},${o.shadow[1]})`;g.shadowBlur=o.shadow[0]*SC;g.shadowOffsetY=(o.shadow[2]??3)*SC;if(o.stroke){g.lineWidth=o.stroke[1];g.strokeStyle=o.stroke[0];g.strokeText(s,0,0)}else{g.fillStyle=col;g.fillText(s,0,0)}g.restore()}
  if(o.stroke){g.lineWidth=o.stroke[1];g.strokeStyle=o.stroke[0];g.strokeText(s,0,0)}g.fillStyle=o.grad?C_gradFill(o.grad,size):col;g.fillText(s,0,0);g.translate(-x,-y)}
 logText(s,x0,y-size*0.5,x0+w,y+size*0.5,size,col,o.kind||'must',o.stroke?{stroke:o.stroke[0],w:o.stroke[1]*SC}:null,1);g.restore();return w}
// letters DROP into place one after another (the template device), with gradient fill / edge / shadow
function C_dropIn(s,x,y,size,col,t0,t,o={}){if(t<t0||!s)return 0;const fam=o.fam||FAM.bodoni,wt=o.wt||'700',st=o.st||'normal',stag=o.stag??0.016,al=o.al||'center';g.save();g.font=F(size,fam,wt,st);g.letterSpacing=(o.ls||0)+'px';
 const tw=g.measureText(s).width;let cx=al==='center'?x-tw/2:al==='right'?x-tw:x;const x0=cx;g.textAlign='left';g.textBaseline='middle';const pa=g.globalAlpha;let any=0;const fill=o.grad?C_gradFill(o.grad,size):col;
 for(let i=0;i<s.length;i++){const ch=s[i],cw=g.measureText(ch).width+(o.ls||0),u=t-t0-i*stag,k=spr(u,o.w||13,o.z||0.5);
  if(u>0){any=Math.max(any,k);const fall=(1-k)*-(o.fall??size*0.8);g.save();g.globalAlpha=pa*cl(u*9);g.translate(cx+cw/2,y+fall);g.rotate((1-k)*(hash(i+s.length)-0.5)*0.4);
   if(!QA.hideText){g.lineJoin='round';const lx=-cw/2+(o.ls||0)/2;if(o.shadow){g.save();g.shadowColor=`rgba(${o.shadow[3]||'10,22,60'},${o.shadow[1]})`;g.shadowBlur=o.shadow[0]*SC;g.shadowOffsetY=(o.shadow[2]??3)*SC;if(o.stroke){g.lineWidth=o.stroke[1];g.strokeStyle=o.stroke[0];g.strokeText(ch,lx,0)}else{g.fillStyle=col;g.fillText(ch,lx,0)}g.restore()}
    if(o.stroke){g.lineWidth=o.stroke[1];g.strokeStyle=o.stroke[0];g.strokeText(ch,lx,0)}g.fillStyle=fill;g.fillText(ch,lx,0)}g.restore()}cx+=cw}
 g.globalAlpha=pa;if(any>0.5)logText(s,x0,y-size*0.5,x0+tw,y+size*0.5,size,col,o.kind||'must',o.stroke?{stroke:o.stroke[0],w:o.stroke[1]*SC}:null);g.restore();return tw}
// type colours for the current sky: light sky -> navy type + white edge; dark sky -> cream type + navy edge. gold = gratitude only
function C_inkFor(t){const S=CSKY(t);if(S.light)return {fg:'#15203F',st:['#FFFFFF',4],key:['#4E8DF2','#2453C6','#1B3A93'],keyCol:'#2453C6',kst:['#FFFFFF',5],sh:[16,0.28,4]};
 return {fg:'#FFF8EA',st:['#13204E',4],key:['#FFFFFF','#D9F6FF','#8ED8FF'],keyCol:'#CFF1FF',kst:['#0F1D4C',5],sh:[18,0.45,4]}}
const C_GOLDW=GRATW;   // gold words = PROJECT.captions.goldWords

// =====================================================================================================================
// THE BACKGROUNDS (redeclared; same signatures as world.js)
// =====================================================================================================================
// the cloud deck (far, hazed and slow; near, full colour and faster). Each cloud fades in/out with the clock's cloud amount.
const C_CLD=(()=>{const r=RNG(9091),L=[];for(let i=0;i<6;i++)L.push({far:1,seed:100+i,x0:r()*1150,y:270+r()*260,w:170+r()*120,v:3+r()*3,th:r()*0.7,a:0.62});
 for(let i=0;i<5;i++)L.push({far:0,seed:200+i,x0:r()*1150,y:60+r()*200,w:260+r()*170,v:6+r()*5,th:r()*0.8,a:0.95});return L})();
function C_cloudsBg(t,hz,S,o={}){const L=C_lightPos(t,o),body=Math.max(S.moon*(o.moon===false?0:1),S.sun*(o.sun===false?0:1));for(const c of C_CLD){let al=cl((S.cloud-c.th)/0.2)*c.a*(o.a??1)*cl((hz-70-c.y)/70);if(al<=0.01)continue;const x=((c.x0+t*c.v)%1150)-215;
 if(body>0.05){const d=Math.hypot((x-L.x)/(c.w*0.5+70),(c.y-30-L.y)/150);al*=lerp(1,lerp(0.22,1,cl((d-0.35)/0.75)),body)}
 C_cloud(x,c.y,c.w,{t,seed:c.seed,lit:c.far?C_mx(S.cl,S.mid,0.3):S.cl,shade:c.far?C_mx(S.cs,S.mid,0.4):S.cs,a:al,gloss:c.far?0.12:0.28})}}
function C_rainFar(t,a){if(a<=0.01)return;const r=RNG(4242),P=new Path2D();for(let i=0;i<46;i++){const x0=r()*W*1.3-100,ph=r(),l=26+r()*30,sp=520+r()*260,y=((ph*1400+t*sp)%1400)-100,x=x0+y*0.1;P.moveTo(x,y);P.lineTo(x+l*0.1,y+l)}
 g.save();g.strokeStyle=`rgba(236,245,255,${0.3*a})`;g.lineWidth=1;g.lineCap='round';g.stroke(P);g.restore()}
function C_vig(a,S){if(a>0.01)vignette(a*0.42,C_s(C_mx(S.top,C_BK,0.35)))}
// the sky: gradient + watercolour mottling + horizon glow + stars + moon/sun + rays + clouds + far rain
function C_sky(t,o={}){const S=CSKY(t),hz=o.hz??H*0.9,m=o.m??1;
 const gr=g.createLinearGradient(0,-60,0,hz);gr.addColorStop(0,C_c(S.top));gr.addColorStop(0.58,C_c(S.mid));gr.addColorStop(1,C_c(S.hz));g.fillStyle=gr;g.fillRect(-W,-H,3*W,3*H);
 if(m>1.001){g.fillStyle=C_c(C_mx(S.top,C_BK,0.5),cl((m-1)*0.8,0,0.4));g.fillRect(-W,-H,3*W,3*H)}else if(m<0.999){g.fillStyle=`rgba(255,255,255,${cl((1-m)*0.3,0,0.25)})`;g.fillRect(-W,-H,3*W,3*H)}
 if(o.tex!==false){g.save();g.globalCompositeOperation='soft-light';g.globalAlpha=0.5;g.drawImage(C_WASH,-90,-90,W+180,H+180);g.restore()}
 g.save();g.globalAlpha*=0.55;g.drawImage(sprite(C_s(C_mx(S.hz,C_WH,0.35)),0.35),-260,hz-300,W+520,560);g.restore();
 if(S.stars>0.02&&o.stars!==false)stars(t,130,23,0,0,W,hz*0.72,S.stars);
 if(o.moon!==false&&S.moon>0.01)Wmoon(t,o.mx,o.my);
 if(o.sun!==false&&S.sun>0.01&&S.sy<hz+40){g.save();g.beginPath();g.rect(-W,-H,3*W,hz+H+6);g.clip();C_sun(S.sx,S.sy,46,t,{a:S.sun});g.restore()}
 const L=C_lightPos(t,o);if(S.rays>0.02&&o.rays!==false){const ang=Math.atan2(640-L.y,360-L.x);C_rays(L.x,L.y,{a:S.rays*0.24*(o.raysA??1),ang,spread:L.y>hz-100?2.0:1.0,n:7,len:1500,t,col:C_s(C_mx(S.lc,C_WH,0.4)),w:0.05})}
 if(o.clouds!==false)C_cloudsBg(t,hz,S,{a:o.cloudA,moon:o.moon,sun:o.sun,mx:o.mx,my:o.my});
 if(o.rain!==false)C_rainFar(t,S.rain*(o.rainA??1))}

// each shot gets its own hill line and tree spacing (pure: the shot is a function of t)
function C_shotSeed(){const s=typeof CUR_SHOT!=='undefined'&&CUR_SHOT?CUR_SHOT:null;if(!s)return 1;let h=0;for(const ch of String(s.id||s.t0))h=(h*31+ch.charCodeAt(0))%9973;return 1+h%7}
// Wbg: bright painterly sky, layered clouds, sun or moon, rays, rolling hills along the bottom (opt.hills:false to drop them)
function Wbg(t,m=1,opt={}){const S=CSKY(t);C_sky(t,{m,moon:opt.moon!==false,sun:opt.sun!==false,mx:opt.mx,my:opt.my,hz:opt.hz??H*0.9,clouds:opt.clouds,rain:opt.rain,rays:opt.rays});
 if(opt.hills!==false)C_hills(t,opt.hy??1108*H/1280,{trees:opt.trees??5,seed:opt.hseed||C_shotSeed(),flowers:opt.flowers??16});
 const la=opt.la??0.11;if(la>0.005){g.save();g.globalCompositeOperation='screen';glow(opt.lx??360,opt.ly??520,opt.lr??430,C_s(C_mx(S.lc,C_WH,0.3)),la*1.5,0.25);g.restore()}
 C_vig(opt.vig??0.5,S)}

// the moon: soft cream disc with a cool halo, faint maria; sets slowly; fades by day
function Wmoon(t,x=560,y0=170){const S=CSKY(t),a=S.moon;if(a<=0.01)return;const y=y0+t*0.5,R=34;g.save();g.globalAlpha*=a;
 glow(x,y,R*6.5,C_s(S.lc),0.34,0.22);glow(x,y,R*2.3,'240,246,255',0.42,0.42);
 const gr=g.createRadialGradient(x-R*0.35,y-R*0.35,R*0.1,x,y,R);gr.addColorStop(0,'#FFFDF3');gr.addColorStop(0.7,'#F2F1FF');gr.addColorStop(1,'#C8D5FF');g.fillStyle=gr;g.beginPath();g.arc(x,y,R,0,7);g.fill();
 g.fillStyle='rgba(140,158,214,0.28)';for(const [dx,dy,r] of [[-10,-8,8],[11,6,6],[-4,12,4.5],[8,-12,3.5]]){g.beginPath();g.arc(x+dx,y+dy,r,0,7);g.fill()}g.restore()}

// sunrise warmth: a gold wash and a low warm glow (the clock already turns the sky; this adds the light)
function Wdawn(t){const w=eio(cl((t-WORLD.dawn[0])/WORLD.dawn[1]));if(w<=0)return;g.save();g.globalCompositeOperation='soft-light';g.fillStyle=`rgba(255,186,104,${0.42*w})`;g.fillRect(-W,-H,3*W,3*H);
 g.globalCompositeOperation='screen';const gr=g.createLinearGradient(0,H*0.5,0,H);gr.addColorStop(0,'rgba(255,200,130,0)');gr.addColorStop(1,`rgba(255,200,130,${0.3*w})`);g.fillStyle=gr;g.fillRect(-W,H*0.5,3*W,H);g.restore()}

// a soft mist band (sprite ellipses, no filter)
function Wmist(y,h,a,t=0,col){if(a<=0.01)return;const S=CSKY(CUR_T);col=col||C_s(C_mx(S.hz,C_WH,0.6));const spr_=sprite(col,0.5),pa=g.globalAlpha;g.save();
 for(let i=0;i<5;i++){const yy=y+(i-2)*h*0.18+Math.sin(t*0.3+i)*6,cx=360+Math.sin(i*2.1+t*0.2)*80;g.globalAlpha=pa*a*0.34;g.drawImage(spr_,cx-620,yy-h*0.42,1240,h*0.84)}g.restore()}

// ---------- the sea: GL water (perspective waves, rain-ring ripples, sky reflection, Fresnel, sun/moon glitter) ----------
const C_SEA_FS=`#version 300 es
precision highp float;
in vec2 uv;out vec4 o;uniform vec2 res;
${GLSL_NOISE}
uniform float T,HZ,RAIN,LA,AMP,RING;
uniform vec3 SKT,SKM,SKH,DEEP,SURF,LC;
uniform vec2 LP;
float hw(vec2 w){float h=0.;
 h+=0.22*sin(w.x*0.42+w.y*0.15+T*1.05);
 h+=0.16*sin(-w.x*0.27+w.y*0.47+T*1.35);
 h+=0.09*sin(w.x*0.95-w.y*0.66+T*2.05);
 h+=0.14*(vn(w*0.55+vec2(T*0.22,T*0.12))-0.5);
 h+=0.06*(vn(w*1.7-vec2(T*0.5,0.))-0.5);
 return h*AMP;}
float rg(vec2 w){float h=0.;vec2 c0=floor(w/2.2);
 for(int i=-1;i<=1;i++)for(int j=-1;j<=1;j++){vec2 c=c0+vec2(float(i),float(j));float a=h21(c),b=h21(c+17.31),q=h21(c+41.7);
  if(q>RAIN)continue;vec2 p=(c+vec2(0.15+0.7*a,0.15+0.7*b))*2.2;float ph=fract(T*0.62+q*9.17+a*3.1);float age=ph*1.6;
  float d=length(w-p),R=0.12+age*1.15,env=exp(-age*2.2)*smoothstep(0.,0.06,age);
  h+=env*(sin((d-R)*16.)*exp(-pow((d-R)*3.0,2.))*0.5+exp(-d*d*30.)*0.35*cos(age*24.)*(1.-smoothstep(0.,0.5,age)));}
 return h;}
float Hf(vec2 w,float fr){return hw(w)+rg(w)*fr*RING;}
vec3 skyAt(float y){float m=HZ*0.58;return y<m?mix(SKT,SKM,clamp(y/m,0.,1.)):mix(SKM,SKH,clamp((y-m)/max(1.,HZ-m),0.,1.));}
void main(){vec2 P=vec2(uv.x*720.,(1.-uv.y)*1280.);float dy=P.y-HZ;if(dy<=0.){o=vec4(0.);return;}
 float f=640.,D=10.*f/max(dy,0.5);vec2 w=vec2((P.x-360.)*D/f,D);
 float fr=1.-smoothstep(16.,75.,D),e=max(0.02,D/f*1.2);
 float h0=Hf(w,fr),hx=(Hf(w+vec2(e,0.),fr)-h0)/e,hz=(Hf(w+vec2(0.,e),fr)-h0)/e;
 float att=1.-smoothstep(30.,300.,D);
 vec3 n=normalize(vec3(-hx*att,1.,-hz*att));
 vec3 V=normalize(vec3((P.x-360.)/f,-dy/f,1.));
 vec3 R=reflect(V,n);
 float ry=max(R.y,0.)/max(R.z,0.05)*f;
 vec3 sky=skyAt(HZ-ry);
 float Fr=0.04+0.96*pow(1.-clamp(dot(-V,n),0.,1.),5.);
 float near=clamp(dy/(1280.-HZ+40.),0.,1.);
 vec3 body=mix(SURF,DEEP,smoothstep(0.,0.85,near));
 vec3 col=mix(body,sky,clamp(Fr*1.1+0.12,0.,1.));
 vec3 L=normalize(vec3((LP.x-360.)/f,max(0.012,(HZ-LP.y)/f),1.));
 float rl=max(dot(R,L),0.);col+=LC*(pow(rl,300.)*2.4+pow(rl,34.)*0.25)*LA;
 float crest=clamp((n.z*-1.+n.x*0.4)*3.,0.,1.)*fr;col+=vec3(0.95,0.98,1.)*crest*0.18;
 col=mix(col,SKH,exp(-dy*0.08)*0.6);
 o=vec4(col,1.);}`;
function Wsea(t,o={}){const S=CSKY(t),HZ=452+(o.off??320),m=o.m??1,mt=o.mt??0,L=C_lightPos(t,o);
 C_sky(t,{hz:HZ,m,moon:o.moon!==false,sun:!!o.sun,mx:o.mx,my:o.my,raysA:0.8});
 const big=mt>0.3,hp={n:big?3:2,amp:big?120*mt+50:30,peak:big,seed:big?4:2,gap:big?52:12,trees:0,haze:0.5,bot:HZ+40,cols:big?C_MTNCOL:C_HILLCOL};
 C_hills(t,HZ+2,hp);
 const LA=L.moon?L.a:Math.max(S.sun,0.28)*(o.sun===false?0.6:1);
 g.drawImage(GL.run('C_sea',C_SEA_FS,{T:t,HZ,RAIN:cl((o.rain??S.rain)*0.7+0.1,0,0.9),LA,AMP:o.amp??1,RING:o.rings??1,SKT:C_n3(S.top),SKM:C_n3(S.mid),SKH:C_n3(S.hz),DEEP:C_n3(S.deep),SURF:C_n3(S.surf),LC:C_n3(C_mx(S.lc,C_WH,0.3)),LP:[L.x,L.y]},{},PW,PH),0,0,W,H);
 C_hills(t,HZ+2,{...hp,mirror:HZ,a:0.3});
 g.save();g.globalAlpha*=0.5;g.drawImage(sprite(C_s(C_mx(S.hz,C_WH,0.5)),0.3),-200,HZ-26,W+400,52);g.restore();
 if(o.vap)C_vapour(t,HZ,o.vap);
 C_vig(0.32,S)}

// ---------- ground: green sod and grass on top, rich brown soil cross-section below (pebbles, strata, root hairs) ----------
const C_edge=(x,y)=>y+(vnoise(x*0.012,7)-0.5)*16+(vnoise(x*0.05,3)-0.5)*5;
function Wground(t,y,a=1){if(a<=0.01)return;const S=CSKY(t);g.save();g.globalAlpha*=a;
 const P=new Path2D();P.moveTo(-W,C_edge(-W,y));for(let x=-W;x<=2*W;x+=10)P.lineTo(x,C_edge(x,y));P.lineTo(2*W,2*H+y);P.lineTo(-W,2*H+y);P.closePath();
 const gr=g.createLinearGradient(0,y,0,y+760);gr.addColorStop(0,'#94603A');gr.addColorStop(0.3,'#74482A');gr.addColorStop(1,'#43281A');g.fillStyle=gr;g.fill(P);
 g.save();g.clip(P);g.drawImage(C_SOIL,-90,y+6,900,1100);
 const hb=g.createLinearGradient(0,y,0,y+60);hb.addColorStop(0,'rgba(52,30,14,0.75)');hb.addColorStop(1,'rgba(52,30,14,0)');g.fillStyle=hb;g.fillRect(-W,y-20,3*W,80);
 g.globalCompositeOperation='multiply';g.fillStyle=C_c(C_mx(S.tint,C_WH,0.3));g.fillRect(-W,y-40,3*W,2*H);g.restore();
 const sod=new Path2D();sod.moveTo(-W,C_edge(-W,y)-1);for(let x=-W;x<=2*W;x+=10)sod.lineTo(x,C_edge(x,y)-1);for(let x=2*W;x>=-W;x-=10)sod.lineTo(x,C_edge(x,y)+11+4*vnoise(x*0.07,5));sod.closePath();
 const sg=g.createLinearGradient(0,y-8,0,y+16);sg.addColorStop(0,C_c(C_tint('#6CC24A',t)));sg.addColorStop(1,C_c(C_tint('#2F7E30',t)));g.fillStyle=sg;g.fill(sod);
 C_grass(-90,y,900,{t,base:x=>C_edge(x,y),h:17,dens:1.1,seed:5});
 const r=RNG(23);for(let i=0;i<9;i++){const fx=-30+i*92+r()*50,fy=C_edge(fx,y)-6-r()*6;C_flower(fx,fy,3.4+r()*1.6,{t,col:['#C58BEA','#F49AC6','#FFE36A','#FFFFFF'][i%4],petals:5})}
 g.restore()}

// ---------- the backdrop behind the rounded speaker card: the act's sky, rendered small (soft) and scaled up ----------
const C_SPKC=mkC(Math.round(W*0.375),Math.round(H*0.375));
function SPKBG(t,r){const pg=g,x=C_SPKC.getContext('2d');g=x;try{resetCtx(x);x.setTransform(C_SPKC.width/W,0,0,C_SPKC.height/H,0,0);C_sky(t,{hz:H*0.94,rays:true,rain:false});C_hills(t,1150*H/1280,{trees:4,seed:3});C_vig(0.4,CSKY(t))}finally{g=pg}
 g.save();g.beginPath();g.rect(r.x,r.y,r.w,r.h);g.clip();g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';g.drawImage(C_SPKC,0,0,W,H);g.restore()}

// ---------- the drop, the rain, falls, splashes, ripples, glints (style.js / world.js redeclared) ----------
function B_drop(x,y,s,a=1,dark=true,cut=0){if(a<=0.01||s<=0.3)return;g.save();g.globalAlpha*=a;if(dark&&s>=6)glow(x,y,s*2.6,'150,205,255',0.16,0.3);
 if(cut>0){g.beginPath();g.rect(x-s*2,y-s*1.3+cut*s*2.1,s*4,s*4);g.clip()}
 const k=s/C_DROPSZ,sp=C_dropSprite(!dark,s>=10);g.drawImage(sp,x-170*k,y-232*k,360*k,400*k);g.restore()}
function B_rain(t,n,seed,speed,len,a,blur){const r=RNG(seed),S=CSKY(t),P0=new Path2D(),P1=new Path2D(),P2=new Path2D();
 for(let i=0;i<n;i++){const x0=r()*W*1.2-60,ph=r(),l=len*(0.6+0.8*r()),q=r(),y=((ph*1500+t*speed)%1500)-120,x=x0+y*0.12,p=q<0.5?P1:P2;P0.moveTo(x,y);P0.lineTo(x+l*0.042,y+l*0.35);p.moveTo(x+l*0.042,y+l*0.35);p.lineTo(x+l*0.12,y+l)}
 g.save();g.lineCap='round';const lw=blur?2.4:1.5;
 if(S.light){g.strokeStyle=`rgba(30,76,150,${a*0.3})`;g.lineWidth=lw+1.6;g.stroke(P1);g.stroke(P2)}
 g.strokeStyle=`rgba(240,248,255,${a*0.22})`;g.lineWidth=lw*0.8;g.stroke(P0);
 g.strokeStyle=`rgba(244,250,255,${a*(blur?0.5:0.82)})`;g.lineWidth=lw;g.stroke(P1);g.strokeStyle=`rgba(214,236,255,${a*(blur?0.36:0.6)})`;g.stroke(P2);g.restore()}
function Wfall(x,y,s,a=1,dark=true){g.save();const gr=g.createLinearGradient(x,y-s*7,x,y-s);gr.addColorStop(0,'rgba(230,244,255,0)');gr.addColorStop(1,`rgba(230,244,255,${0.55*a})`);g.strokeStyle=gr;g.lineWidth=s*0.32;g.lineCap='round';g.beginPath();g.moveTo(x,y-s*7);g.lineTo(x,y-s*1.2);g.stroke();g.restore();B_drop(x,y,s,a,dark)}
function Wsplash(x,y,t,t0,s=1){C_splash(x,y,t,t0,s)}
function Wripple(x,y,t,t0,n=3,sc=1,col='240,250,255',flat=0.22){C_ripples(x,y,t,t0,{n,sc,flat,light:col})}
function Wglint(x,y,L,a,rgb=GOLDRGB){if(a<=0.01)return;C_sparkle(x,y,L*0.55,a,{col:rgb})}

// =====================================================================================================================
// generic devices restyled: poem card, poem page, step card, kinetic type, slam
// =====================================================================================================================
// behind cards and pages: the sky plus leafy corners (below the text zone)
function C_corners(t){const r=RNG(41);C_bush(-10,1290,190,{t,seed:3,n:6});C_bush(730,1290,170,{t,seed:4,n:6});
 C_flower(70,1150,15,{t,col:'#B983E6'});C_flower(130,1196,11,{t,col:'#F49AC6'});C_flower(650,1160,13,{t,col:'#F49AC6'});C_flower(598,1208,10,{t,col:'#B983E6'})}
function C_cardBg(t){Wbg(t,0.95,{moon:false});C_corners(t)}
THEME.cardBg=(t)=>C_cardBg(t);
Object.defineProperty(THEME,'hl',{get(){return CUR_T>=WORLD.hlGoldFrom?'rgba(255,192,64,0.58)':'rgba(84,180,245,0.44)'},configurable:true});   // sky-blue marker; gold from "gratitude"
Object.assign(THEME,{chapNum:'150,175,215',chapInk:'#15203F'});

function Wcard(t,c,o){(o.bg||C_cardBg)(t,c);if(o.under)o.under(t,c);
 const lis=o.lines,long=lis.length>1||POEM[lis[0]].length>50,size=o.size||(long?36:44),fam=FAM.display,st='normal',cw=W-56,maxW=cw-104;
 const rows=poemRows(lis,size,maxW,fam,st,26),lh=size*1.34,hT=rows.length*lh+(lis.length-1)*size*0.3,ch=hT+168;
 const cx=W/2,cy=o.cy||H*0.43,k=c.k,ent=1-eo5(k/0.34),z=(1+0.45*ent)*(1+0.012*k);
 const lit={};for(const li of lis)lit[li]=o.lit&&o.lit[li]?o.lit[li]:lineCues(li,o.a??c.t0-0.4,o.b??c.t1+0.6,{strict:true});
 g.save();g.translate(cx,cy);g.scale(z,z);g.rotate((o.rot??-0.016)+0.01*Math.sin(k*0.7));
 B_sheet(-cw/2,-ch/2,cw,ch,lis[0]*7+3,{sa:0.3,sb:46,sy:20});
 if(TXT.cardHead!==null)T(TXT.cardHead||String(TEXT_TITLE).toUpperCase(),0,-ch/2+42,19,'#3E404C',FAM.text,'600','center',1,{ls:3});g.fillStyle='#2F7FD0';g.fillRect(-26,-ch/2+60,52,2);
 const res=drawPoemLines(t,lis,{x:-cw/2+60,y:-ch/2+100+size*0.45,size,lh,maxW,fam,st,lit,col:B.ink,litCol:B.ink,dim:0.8,glow:false,gloss:o.glossW,gap:size*0.3,indent:26,brush:true,hlCol:o.hl});
 for(const li of lis){const b=res.bounds[li+':0'];if(b)T(String(li+1),-cw/2+30,(b[1]+b[3])/2,19,'#1F5FA8',FAM.text,'600','center',1,{kind:'deco'})}
 if(o.enso){const [li,wi,t0]=o.enso,b=res.bounds[li+':'+wi];if(b){const ww=b[2]-b[0],R=ww*0.62;B_enso((b[0]+b[2])/2,b[3]-size*0.18,R,eo((t-t0+0.1)/0.4),21,'#2F7FD0',8,Math.PI*0.06,Math.PI*0.88,0.28)}}
 if(TXT.cardFoot)T(TXT.cardFoot,0,ch/2-34,19,'#3A3C48',FAM.text,'400','center',1,{st:'italic'});
 if(o.over)o.over(t,c,res,cw,ch);
 g.restore();
 let gy=cy+ch*z/2+40;(o.gloss||[]).forEach(([w,t0])=>{const G=GLOSS[w];if(!G||t<t0)return;const kk=eo5(cl((t-t0)/0.35)),line=w+FN_MARK[G.n],d='= '+G.def;let s1=38,s2=34,tw=Math.max(mw(line,s1,FAM.text,'600','italic'),mw(d,s2,FAM.text,'400','italic'))+56;if(tw>W-40){const f=(W-40)/tw;s1*=f;s2*=f;tw=W-40}
  g.save();g.globalAlpha*=kk;g.translate(W/2,gy+(1-kk)*16);g.rotate(0.01);B_sheet(-tw/2,0,tw,120,G.n*13+5,{sa:0.28,sb:20,sy:8,fill:'#F4EEDF'});
  g.fillStyle='#2F7FD0';g.beginPath();g.arc(-tw/2+24,42,5,0,7);g.fill();TGRP='gl'+w;T(line,-tw/2+38,40,s1,B.ink,FAM.text,'600','left',1,{st:'italic'});T(d,-tw/2+38,86,s2,'#2A2C38',FAM.text,'400','left',1,{st:'italic'});TGRP=null;g.restore();logGloss(w,G.def);gy+=132});
 grain(t,0.04)}

function Wpage(t,c,o={}){(o.bg||C_cardBg)(t,c);
 const extra=(o.credit!=null||o.reserve?70:0)+(o.key!=null||o.reserve?4*29+16:0),room=SAFE_BOT-12-(SAFE_TOP+16)-36+20;let size=22,rows,lh,textH;
 for(;size>=18;size-=0.5){rows=poemRows([...Array(TEXT.length).keys()],size,W-112,FAM.text,'italic',28).length;lh=size*1.4;textH=58+50+44+rows*lh+10*size*0.3;if(textH+extra<=room)break}
 const ph=textH+extra+36,py=o.py??(SAFE_TOP+16-36+(room-(textH+extra))/2);
 g.save();if(o.cam)o.cam(py,ph);
 B_sheet(24,py,W-48,ph,17,{sa:0.3,sb:44,sy:18});if(o.under)o.under(py,ph);
 const res=poemPage(t,c,{top:py+58,size,ink:B.ink,titleCol:B.ink,sigCol:'#1F4F9A',dim:0.95,lit:o.lit,litCol:B.ink,hl:o.hl??!!o.lit,brush:true,glow:false,gloss:Object.keys(GLOSS),sig:o.sig,title:o.title??-1});
 let y=res.bottom+16;if(o.credit!=null){const ck=cl((t-o.credit)/0.3);if(ck>0){g.save();g.globalAlpha*=ck;g.fillStyle='rgba(47,127,208,0.7)';g.fillRect(W/2-60*ck,y,120*ck,1.6);g.restore();
   (TXT.credit.length?TXT.credit:[SOURCE]).slice(0,2).forEach((cr,i)=>rise(cr,W/2,y+24+i*26,19.5,'#3A3C48',o.credit+i*0.1,t,FAM.text,'400',0.008,'center',{st:'italic',blur:false}))}y+=70}
 if(o.key!=null){Object.entries(GLOSS).forEach(([w,G],i)=>{rise(FN_MARK[G.n]+' '+w+' — '+G.def,62,y+10,19,'#2A2C38',o.key+i*0.18,t,FAM.text,'400',0.006,'left',{st:'italic',blur:false});y+=29})}
 if(o.seal!=null){const sk=cl((t-o.seal)/0.25);if(sk>0)B_drop(W-74,py+ph-50,15*eo(sk),1,false)}
 g.restore();grain(t,0.035);return {res,py,ph}}

// the template "step" card: a soft pastel gradient tinted to the act's sky, giant faded numeral, dark serif word whose letters
// drop in one per frame, a push. "gratitude" is set in gold.
function Wchap(t,c,num,word,seal){const S=CSKY(t),k=c.k,z=1+0.15*eo5((k-0.27)/0.37);
 const gr=g.createLinearGradient(0,0,W*0.55,H);gr.addColorStop(0,C_c(S.pa));gr.addColorStop(0.5,C_c(S.pb));gr.addColorStop(1,C_c(S.pc));g.fillStyle=gr;g.fillRect(-W,-H,3*W,3*H);
 g.save();g.globalCompositeOperation='soft-light';g.globalAlpha=0.4;g.drawImage(C_WASH,-90,-90,W+180,H+180);g.restore();
 glow(W*0.86,H*0.08,560,C_s(C_mx(S.lc,C_WH,0.6)),0.8,0.2);
 const r=RNG(num.charCodeAt(0)*17+5);for(let i=0;i<6;i++)glow(r()*W,180+r()*900,140+r()*160,C_s(C_mx([S.pa,S.pb,S.pc][i%3],C_WH,0.25)),0.45,0.6);
 C_rays(W*0.9,-40,{a:0.22,ang:2.0,spread:0.9,n:6,len:1500,t,col:C_s(C_mx(S.lc,C_WH,0.5))});
 C_cloud(160+k*14,262,240,{t,seed:31,lit:C_mx(S.cl,C_WH,0.7),shade:C_mx(S.cs,S.pb,0.5),a:0.85,gloss:0.25,rain:0.7,fall:150,dropCol:C_c(C_mx(S.mid,[40,110,230],0.6))});
 C_cloud(600-k*10,330,170,{t,seed:33,lit:C_mx(S.cl,C_WH,0.7),shade:C_mx(S.cs,S.pb,0.55),a:0.6,gloss:0.2});
 const pc=[[C_c(C_mx(S.pa,[120,190,150],0.35)),C_c(C_mx(S.pb,[120,190,150],0.45))],[C_c(C_mx(S.pb,[110,200,120],0.45)),C_c(C_mx(S.pc,[80,170,100],0.5))],[C_c(C_mx(S.pc,[90,185,95],0.55)),C_c(C_mx(S.pc,[60,150,80],0.6))]];
 C_hills(t,1185,{n:3,amp:58,gap:30,trees:0,haze:0,seed:6,cols:pc,tint:false});
 for(let i=0;i<7;i++){const fx=60+i*100+hash(i*3.3)*30,fy=1196+hash(i*7.1)*40;C_flower(fx,fy,8+4*hash(i),{t,col:['#C58BEA','#F49AC6','#FFE36A','#FFFFFF'][i%4],tint:false,p:cl((k-0.05*i)/0.3)})}
 g.save();g.translate(W/2,H*0.49);g.scale(z,z);g.translate(-W/2,-H*0.49);
 const nk=cl((k-0.06)/0.12);if(nk>0){g.save();g.globalAlpha*=nk;g.font=F(470,FAM.displayS,'700','normal');g.textAlign='center';g.textBaseline='middle';const nc=C_s(C_mx(S.pb,S.top,0.45)),ng=g.createLinearGradient(0,400,0,780);ng.addColorStop(0,`rgba(${nc},0.04)`);ng.addColorStop(1,`rgba(${nc},0.5)`);g.fillStyle=ng;if(!QA.hideText)g.fillText(num,W/2,600);g.restore();logText(num,W/2-140,420,W/2+140,780,470,C_c(C_mx(S.pb,S.top,0.45)),'deco')}
 const two=/^the /.test(word),big=two?word.slice(4):word,gold=C_GOLDW.test(big);let sz=150;while(mw(big,sz,FAM.bodoni,'700')>W*0.82)sz-=4;const bw=mw(big,sz,FAM.bodoni,'700');
 const ink=C_c(C_mx(S.top,[8,12,32],0.62));TGRP='Wchap';
 if(two)rise('the',W/2-bw/2+30,640-sz*0.78,64,ink,c.t0+0.02,t,FAM.display,'400',0.02,'center',{st:'italic'});
 if(gold){const gk=cl((k-0.2)/0.3);if(gk>0){g.save();g.globalCompositeOperation='screen';glow(W/2,640,330,'255,214,120',0.55*gk,0.3);g.restore()}
  C_dropIn(big,W/2,640,sz,'#FFD36E',c.t0+0.04,t,{grad:C_GOLDG,stroke:[C_GOLDEDGE,4],shadow:[18,0.28,6,'90,54,6'],fall:sz*0.6});
  for(let i=0;i<6;i++){const a=i/6*6.28+0.4,d=bw*0.55+20*Math.sin(t*2+i);C_sparkle(W/2+Math.cos(a)*d,640+Math.sin(a)*sz*0.75,10+6*hash(i),gk*(0.6+0.4*Math.sin(t*5+i*1.7)),{col:'255,214,120',edge:'rgba(140,90,10,0.5)'})}}
 else C_dropIn(big,W/2,640,sz,ink,c.t0+0.04,t,{shadow:[14,0.16,5],fall:sz*0.6});
 TGRP=null;
 const uk=eo(cl((k-0.3)/0.3));if(uk>0){const wc=gold?'#E9A42B':C_c(C_mx(S.mid,S.top,0.3));g.save();g.strokeStyle=wc;g.lineWidth=6;g.lineCap='round';g.beginPath();for(let i=0;i<=40;i++){const u=i/40,xx=W/2-bw*0.32+bw*0.64*u*uk,yy=640+sz*0.64+Math.sin(u*Math.PI*4+t*3)*4;i?g.lineTo(xx,yy):g.moveTo(xx,yy)}g.stroke();g.restore();B_drop(W/2-bw*0.32+bw*0.64*uk+14,640+sz*0.64-12,11,uk,false)}
 g.restore();grain(t,0.03)}

// kinetic serif block in the colourful world: navy type with a white edge on a light sky (cream type with a navy edge on a
// dark sky); key words in a blue gradient, gratitude words in gold. Same word timing and stair-step layout as the template.
function C_kin(t,words,lines,o={}){const sm=o.small||44,bg=o.big||92,cy=o.cy||H*0.55,lhp=o.lh||(sm*0.95+bg*0.55),ink=C_inkFor(t);
 let y=cy-(lines.length-1)*lhp/2;
 lines.forEach((L,li)=>{const ws=L.map(i=>words[i]),sizes=ws.map(w=>w[2]?bg:sm),fams=ws.map(w=>w[2]?(o.famB||FAM.bodoni):(o.famS||FAM.display)),wts=ws.map(w=>w[2]?'700':'600');
  const widths=ws.map((w,i)=>mw(w[0],sizes[i],fams[i],wts[i])),sp=sm*0.28,tw=widths.reduce((a,b)=>a+b,0)+sp*(ws.length-1);let x=W/2-tw/2+(li%2?24:-24);
  ws.forEach((w,i)=>{const u=t-w[1];if(u>-0.001){const k=spr(u,16,0.55),gold=C_GOLDW.test(capClean(w[0]))&&t>=CAPCFG.goldFrom;g.save();g.translate(x+widths[i]/2,y+(w[2]?0:bg*0.12));const pk=0.62+0.38*k;g.scale(pk,pk);
    if(w[2])C_T(w[0],0,0,sizes[i],gold?'#FFD36E':ink.keyCol,{fam:fams[i],wt:'700',grad:gold?C_GOLDG:ink.key,stroke:gold?[C_GOLDEDGE,5]:ink.kst,shadow:ink.sh,a:cl(u/0.07)});
    else C_T(w[0],0,0,sizes[i],ink.fg,{fam:fams[i],wt:'600',stroke:ink.st,shadow:ink.sh,a:cl(u/0.07)});g.restore()}x+=widths[i]+sp});y+=lhp})}
function C_kinBg(t,o={}){const S=CSKY(t);Wbg(t,1,{moon:false,la:0.22,ly:o.ly??600,lr:520});if(S.light){g.save();g.globalCompositeOperation='screen';glow(360,o.ly??600,430,'255,255,255',0.32,0.35);g.restore()}
 const r=RNG(o.seed||8);for(let i=0;i<7;i++){const x=r()<0.5?40+r()*110:570+r()*110,y=230+r()*720,s=6+r()*8,ph=r()*6.28;B_drop(x,y+Math.sin(t*1.3+ph)*6,s,0.9,!S.light)}}
function Wkin(t,c,spec,lines,o={}){if(o.bg!==false)(o.bg||(t=>C_kinBg(t)))(t,c);const ws=spec.map(([s,w,k])=>[s,typeof w==='number'?w:WT(w,c.t0-0.6),k]);
 C_kin(t,ws,lines,{cy:o.cy||H*0.46,small:o.small||52,big:o.big||104,famB:FAM.bodoni,lh:o.lh});grain(t,0.04)}
function Wslam(t,c,s,word,o={}){const t0=typeof word==='number'?word:WT(word,c.t0-0.5),u=t-t0;if(u<-0.02)return;const k=spr(u,18,0.45),sz=o.size||250,S=CSKY(t),y=o.y||H*0.45;
 if(u<0.7){const q=u/0.7;g.save();g.strokeStyle=`rgba(255,255,255,${0.7*(1-q)})`;g.lineWidth=6*(1-q)+1;g.beginPath();g.ellipse(W/2,y,sz*(0.5+q*1.3),sz*(0.2+q*0.5),0,0,7);g.stroke();g.restore()}
 g.save();g.translate(W/2,y);g.scale(1.35-0.35*k,1.35-0.35*k);
 const light=S.light||S.bright>0.2,grad=o.col?null:(light?['#6E7BF0','#3B46B8','#26307E']:['#FFFFFF','#E0F4FF','#9ED9FF']),st=light?['#FFFFFF',8]:['#101C4A',8];
 C_T(s,0,0,sz,o.col||(light?'#3B46B8':'#E0F4FF'),{fam:FAM.bodoni,wt:'700',grad,stroke:st,shadow:[26,0.32,8],a:cl(u*12)});g.restore()}

// =====================================================================================================================
// generic scenes (registered so that the act files cannot overwrite them; the subject artists' c_*.js files still can)
// =====================================================================================================================
const C_SCN={};
function C_scene(name,fn){let cur=fn;Object.defineProperty(SCENES,name,{configurable:true,enumerable:true,get(){return cur},set(v){const src=(document.currentScript&&document.currentScript.src)||'';if(/acts\/act\d\w*\.js/.test(src)){C_SCN[name]=v;return}cur=v}})}

// TITLE: rain over a night sea; the title drops in letter by letter; one glossy drop falls into the sea and rings out
// (VotR's restyled scenes a1_title, a1_page, a2_creation_word, a2_lyrical2, a3_eternal_word, a4_important, a5_why
// live in examples/voice-of-the-rain/acts/vr_color_scenes.js; register your own with C_scene(name, fn).)
