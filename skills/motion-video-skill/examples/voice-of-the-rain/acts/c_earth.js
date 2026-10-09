// acts/c_earth.js — MOTHER EARTH, ROOTS & TREE (colour world, owner 2026-10-08 "make the world colourful just like the images").
// Loaded after every act file, so the SCENES assignments here replace the act versions. Uses the shared colour world
// (acts/color.js: CSKY, Wbg, Wground, C_*). Original drawings only: a leafy Mother Earth (profile face, flower crown, open
// hand), brown cartoon roots, a young plant, seeds that sprout, a golden wooden ladder, a puffy cartoon tree that first
// appears as a white tree-and-roots icon grown out of the constellation.
// Every static illustration is rendered once into a cached canvas or Path2D and animated with transforms. renderFrame stays pure.
'use strict';
{const S=SCENES;

// =====================================================================================================================
// utilities
// =====================================================================================================================
const CE_LAY=mkC(),CE_LX=CE_LAY.getContext('2d');
const CE_C={};
// a cached illustration: logical box (ox,oy,w,h) rendered at k px per logical px; fn draws with the global g in logical coords
function CE_cache(key,ox,oy,w,h,k,fn){if(CE_C[key])return CE_C[key];const c=mkC(Math.ceil(w*k),Math.ceil(h*k)),x=c.getContext('2d');const pg=g;g=x;
 try{x.setTransform(k,0,0,k,-ox*k,-oy*k);x.lineCap='round';x.lineJoin='round';fn()}finally{g=pg}return CE_C[key]={c,ox,oy,w,h}}
function CE_put(A,a=1){if(a<=0.003)return;const pa=g.globalAlpha;g.globalAlpha=pa*a;g.drawImage(A.c,A.ox,A.oy,A.w,A.h);g.globalAlpha=pa}
// draw a cached illustration lit by the sky clock: the art, then a multiply by the clock's land tint inside its silhouette
function CE_putTint(A,t,k=1,a=1){if(a<=0.003)return;const S=CSKY(t),pa=g.globalAlpha;g.globalAlpha=pa*a;g.drawImage(A.c,A.ox,A.oy,A.w,A.h);
 if(k>0.01){const m=g.getTransform(),x=CE_LX;x.setTransform(1,0,0,1,0,0);x.globalAlpha=1;x.globalCompositeOperation='source-over';x.fillStyle=C_c(C_mx(C_WH,S.tint,k));x.fillRect(0,0,PW,PH);
  x.globalCompositeOperation='destination-in';x.setTransform(m);x.drawImage(A.c,A.ox,A.oy,A.w,A.h);x.globalCompositeOperation='source-over';
  g.save();g.setTransform(1,0,0,1,0,0);g.globalCompositeOperation='multiply';g.drawImage(CE_LAY,0,0);g.restore()}
 g.globalAlpha=pa}
// a circle sub-path wound anticlockwise: the same winding as CE_taper polygons and the hand/face outlines (no nonzero holes)
const CE_circN=(P,x,y,r)=>{P.moveTo(x+r,y);P.arc(x,y,r,0,Math.PI*2,true)};
// a small two-tone leaf (cache-time stamp)
function CE_lf(x,y,s,a,c1,c2,ol){g.save();g.translate(x,y);g.rotate(a);g.beginPath();g.moveTo(0,0);g.quadraticCurveTo(s*0.5,-s*0.44,s,0);g.quadraticCurveTo(s*0.5,s*0.44,0,0);
 if(ol){g.strokeStyle=ol;g.lineWidth=Math.max(0.6,s*0.09);g.stroke()}g.fillStyle=c2;g.fill();g.beginPath();g.moveTo(0,0);g.quadraticCurveTo(s*0.5,-s*0.44,s,0);g.quadraticCurveTo(s*0.5,-s*0.04,0,0);g.fillStyle=c1;g.fill();g.restore()}
// a tapered stroke along points [[x,y],...] from width w0 to w1 (filled polygon with round ends, always anticlockwise)
function CE_taper(P,pts,w0,w1){const n=pts.length;if(n<2)return;const L=[],R=[];for(let i=0;i<n;i++){const a=pts[Math.min(n-1,i+1)],c=pts[Math.max(0,i-1)],dx=a[0]-c[0],dy=a[1]-c[1],l=Math.hypot(dx,dy)||1,w=lerp(w0,w1,i/(n-1))/2;
 L.push([pts[i][0]-dy/l*w,pts[i][1]+dx/l*w]);R.push([pts[i][0]+dy/l*w,pts[i][1]-dx/l*w])}
 P.moveTo(L[0][0],L[0][1]);for(let i=1;i<n;i++)P.lineTo(L[i][0],L[i][1]);const e=pts[n-1],ae=Math.atan2(L[n-1][1]-e[1],L[n-1][0]-e[0]);P.arc(e[0],e[1],Math.max(0.3,w1/2),ae,ae+Math.PI,true);
 for(let i=n-1;i>=0;i--)P.lineTo(R[i][0],R[i][1]);const s=pts[0],as=Math.atan2(R[0][1]-s[1],R[0][0]-s[0]);P.arc(s[0],s[1],Math.max(0.3,w0/2),as,as+Math.PI,true);P.closePath()}
const CE_ang=(P,i)=>{const n=P.length-1,a=P[Math.max(0,Math.min(i,n-1))],b=P[Math.max(1,Math.min(i+1,n))];return Math.atan2(b[1]-a[1],b[0]-a[0])};
// partial polyline 0..f
const CE_part=(pts,f)=>{if(f>=1)return pts;const n=pts.length-1,m=f*n,P=[];for(let i=0;i<=Math.ceil(m);i++){const q=Math.min(i,m),i0=Math.floor(q),i1=Math.min(n,i0+1),fr=q-i0;P.push([lerp(pts[i0][0],pts[i1][0],fr),lerp(pts[i0][1],pts[i1][1],fr)])}return P};
// fill below the soil edge of Wground(y) with a colour in a blend mode (dry dust, wet darkening)
function CE_soilTone(y,col,a,comp){if(a<=0.01)return;g.save();const P=new Path2D();P.moveTo(-W,C_edge(-W,y)+9);for(let x=-W;x<=2*W;x+=20)P.lineTo(x,C_edge(x,y)+9);P.lineTo(2*W,3*H);P.lineTo(-W,3*H);P.closePath();g.clip(P);
 g.globalCompositeOperation=comp||'source-over';g.globalAlpha*=a;g.fillStyle=col;g.fillRect(-W,y-20,3*W,3*H);g.restore()}
// light on a day sky needs an edge; on a dark sky a soft glow is enough
const CE_spk=(x,y,s,a,col)=>C_sparkle(x,y,s,a,{col:col||'255,236,170',edge:CSKY(CUR_T).light?'rgba(90,60,10,0.55)':null});

// =====================================================================================================================
// MOTHER EARTH — an original giant gentle woman made of leaves and vines: profile face looking down at her open hand,
// a flower crown, flowing leafy hair, the hand held out palm-up (the drop rests on it). Wide-frame logical coordinates.
// =====================================================================================================================
const CE_ME={hand:[150,604],drop:[176,586],eye:[452,336]};
function CE_mePaths(){
 const face=new Path2D();face.moveTo(570,96);face.bezierCurveTo(505,104,458,150,452,214);face.bezierCurveTo(448,246,450,272,442,290);face.bezierCurveTo(436,302,428,312,424,322);
 face.bezierCurveTo(410,346,390,370,376,390);face.bezierCurveTo(366,404,372,416,388,416);face.bezierCurveTo(396,416,400,418,402,424);face.bezierCurveTo(398,432,392,440,394,446);
 face.bezierCurveTo(396,452,402,454,408,456);face.bezierCurveTo(401,460,396,466,400,473);face.bezierCurveTo(404,479,410,481,413,483);face.bezierCurveTo(407,494,407,507,415,517);
 face.bezierCurveTo(428,532,452,536,478,536);face.bezierCurveTo(506,537,526,548,540,566);face.lineTo(556,660);face.lineTo(700,660);face.lineTo(700,96);face.closePath();
 // hair: a big leafy mass over the crown, flowing down the right side (clockwise polygon + clockwise puffs)
 const hair=new Path2D();const hp=[[452,206],[458,140],[500,86],[566,52],[646,46],[720,66],[770,110],[790,200],[784,320],[796,460],[780,600],[800,760],[786,920],[804,1100],[790,1320],[620,1320],[640,1100],[612,900],[626,760],[590,640],[574,520],[560,420],[520,300]];
 hp.forEach(([x,y],i)=>i?hair.lineTo(x,y):hair.moveTo(x,y));hair.closePath();
 const r=RNG(77);for(const [x,y,rr] of [[520,292,26],[548,360,28],[566,440,26],[578,520,26],[596,600,28],[470,186,24],[500,130,26]])C_circ(hair,x,y,rr);for(let i=0;i<54;i++){const u=i/53,k=Math.floor(u*16);const a=hp[Math.min(k,15)],b=hp[Math.min(k+1,16)],f=u*16-k;C_circ(hair,lerp(a[0],b[0],f)+(r()-0.5)*10,lerp(a[1],b[1],f)+(r()-0.5)*10,22+r()*20)}
 // neck, shoulder and chest (under the arm)
 const body=new Path2D();body.moveTo(520,560);body.bezierCurveTo(540,600,548,640,560,680);body.bezierCurveTo(600,700,640,712,660,740);body.lineTo(700,1320);body.lineTo(380,1320);body.bezierCurveTo(420,1100,450,900,470,800);body.bezierCurveTo(480,740,500,690,520,560);body.closePath();
 // the arm: shoulder down to the elbow, forearm rising to the wrist (palm-up hand held out to the left)
 const arm=new Path2D();const ua=[[628,744],[596,812],[548,880],[500,924]];const fa=[[488,926],[420,860],[340,768],[268,666]];
 CE_taper(arm,[[628,744],[600,806],[556,872],[506,916],[470,904],[420,860],[340,768],[268,666]],116,62);
 // the hand: palm platform + four fingers fanned to the left with up-curled tips + a thumb raised
 const hand=new Path2D();hand.moveTo(282,642);hand.bezierCurveTo(250,614,212,606,170,612);hand.bezierCurveTo(158,614,150,620,150,630);hand.bezierCurveTo(150,648,164,660,184,666);hand.bezierCurveTo(222,680,262,690,288,688);hand.closePath();
 const fing=[[[160,622],[120,616],[88,606],[70,592]],[[158,632],[116,630],[80,626],[60,612]],[[160,644],[118,646],[84,644],[64,632]],[[166,656],[130,662],[100,662],[82,652]]];
 const fw=[[19,15],[21,16],[21,16],[19,14]];fing.forEach((p,i)=>CE_taper(hand,p,fw[i][0],fw[i][1]));
 const thumb=[[232,650],[214,628],[196,606],[188,584]];CE_taper(hand,thumb,30,20);
 return {face,hair,body,arm,hand,fing,thumb}}
// leafy fill: base gradient + stamped leaves inside a path; size range, density, palette
function CE_leafFill(P,box,o){const [x0,y0,x1,y1]=box;g.save();g.clip(P);
 const gr=g.createLinearGradient(x0,y0,x1,y1);gr.addColorStop(0,o.c0);gr.addColorStop(0.55,o.c1);gr.addColorStop(1,o.c2);g.fillStyle=gr;g.fillRect(x0-20,y0-20,x1-x0+40,y1-y0+40);
 const r=RNG(o.seed||5),n=o.n||400,pal=o.pal;for(let i=0;i<n;i++){const x=x0+r()*(x1-x0),y=y0+r()*(y1-y0),u=cl(((x-x0)/(x1-x0))*0.45+((y-y0)/(y1-y0))*0.55+(r()-0.5)*0.35),ci=Math.min(pal.length-1,Math.floor(u*pal.length)),s=o.s0+r()*(o.s1-o.s0);
  CE_lf(x,y,s,r()*6.28,pal[ci][0],pal[ci][1],o.ol?C_c(C_mx(C_col(pal[ci][1]),C_BK,0.35),0.6):null)}
 g.restore()}
function CE_meDraw(){const P=CE_mePaths(),OL='#174A1E';
 const outline=(p,w=5)=>{g.lineWidth=w;g.strokeStyle=OL;g.stroke(p)};
 const leafPal=[['#C8F070','#9BD54C'],['#A6DC52','#74BE3E'],['#86C944','#559F34'],['#5FAE3A','#3A862E'],['#3F8E31','#286A26']];
 // hair (behind everything)
 outline(P.hair,6);CE_leafFill(P.hair,[440,20,830,1330],{c0:'#7CC442',c1:'#3E8E30',c2:'#225E23',n:2900,s0:12,s1:26,pal:leafPal,seed:11,ol:true});
 // vines hanging in the hair
 g.save();g.clip(P.hair);g.strokeStyle='rgba(40,96,34,0.85)';g.lineWidth=3;const rv=RNG(19);for(let i=0;i<9;i++){let x=600+rv()*190,y=160+rv()*200;g.beginPath();g.moveTo(x,y);for(let j=0;j<14;j++){x+=Math.sin(j*0.9+i)*10;y+=52;g.lineTo(x,y)}g.stroke()}
 // soft light from the upper left on the hair mass
 const hg=g.createLinearGradient(460,60,800,400);hg.addColorStop(0,'rgba(230,255,170,0.32)');hg.addColorStop(1,'rgba(230,255,170,0)');g.fillStyle=hg;g.fillRect(440,20,400,600);g.restore();
 // body
 outline(P.body,5);CE_leafFill(P.body,[380,540,720,1330],{c0:'#8CCB46',c1:'#4E9C34',c2:'#245F24',n:1500,s0:10,s1:20,pal:leafPal,seed:13,ol:true});
 // face: smoother moss skin
 outline(P.face,5);g.save();g.clip(P.face);const fg=g.createLinearGradient(380,200,640,600);fg.addColorStop(0,'#C9F06E');fg.addColorStop(0.45,'#93D04A');fg.addColorStop(1,'#4E9C34');g.fillStyle=fg;g.fillRect(340,80,380,600);
 const rm=RNG(23);for(let i=0;i<5200;i++){const x=360+rm()*340,y=90+rm()*580,u=cl((x-360)/340*0.6+(y-90)/580*0.5+(rm()-0.5)*0.3),s=2.5+rm()*4.5;CE_lf(x,y,s,rm()*6.28,C_c(C_mx('#D8F98A','#5FAE3A',u),0.75),C_c(C_mx('#A9E05C','#3C8A30',u),0.75))}
 // soft modelling: cheek blush, eye socket shade, under-nose shade
 glow(476,452,58,'255,150,120',0.22,0.4);glow(462,338,40,'40,100,30',0.28,0.4);glow(408,436,16,'40,100,30',0.25,0.4);glow(452,522,40,'40,90,30',0.18,0.4);
 g.lineWidth=12;g.strokeStyle='rgba(240,255,190,0.55)';g.stroke(P.face);g.restore();
 // eye: looking down at the hand, half closed and serene
 const [ex,ey]=CE_ME.eye;g.save();g.beginPath();g.moveTo(ex-20,ey+4);g.quadraticCurveTo(ex-2,ey-9,ex+18,ey-4);g.quadraticCurveTo(ex+4,ey+10,ex-20,ey+4);g.fillStyle='#F4FFE0';g.fill();g.save();g.clip();
 g.fillStyle='#2E5F1E';g.beginPath();g.arc(ex-6,ey+6,8,0,7);g.fill();g.fillStyle='#7FBF3A';g.beginPath();g.arc(ex-6,ey+6,5,0,7);g.fill();g.fillStyle='#183A12';g.beginPath();g.arc(ex-7,ey+7,2.6,0,7);g.fill();g.restore();
 g.strokeStyle='#1F4A18';g.lineWidth=3.2;g.beginPath();g.moveTo(ex-22,ey+4);g.quadraticCurveTo(ex-2,ey-11,ex+20,ey-5);g.stroke();
 g.lineWidth=2;for(let i=0;i<5;i++){const u=i/4,lx=lerp(ex-20,ex+10,u),ly=ey+3-Math.sin(u*Math.PI)*9;g.beginPath();g.moveTo(lx,ly);g.quadraticCurveTo(lx-8,ly-2,lx-12,ly+3-i*0.4);g.stroke()}
 g.strokeStyle='rgba(31,74,24,0.55)';g.lineWidth=1.6;g.beginPath();g.moveTo(ex-16,ey+8);g.quadraticCurveTo(ex,ey+12,ex+14,ey+3);g.stroke();
 // brow: a leafy arc
 for(let i=0;i<9;i++){const u=i/8;CE_lf(lerp(ex-26,ex+26,u),ey-24-Math.sin(u*Math.PI)*8,9,-0.2+u*0.5,'#3F8E31','#2A6A26')}g.restore();
 // lips: a quiet smile with a warm tint
 g.save();g.fillStyle='rgba(200,90,70,0.35)';g.beginPath();g.moveTo(394,448);g.quadraticCurveTo(402,452,410,456);g.quadraticCurveTo(402,462,398,472);g.quadraticCurveTo(394,462,394,448);g.fill();
 g.strokeStyle='rgba(30,70,24,0.8)';g.lineWidth=2;g.beginPath();g.moveTo(404,457);g.quadraticCurveTo(414,460,420,454);g.stroke();g.restore();
 // nostril
 g.fillStyle='rgba(30,70,24,0.6)';g.beginPath();g.ellipse(396,414,5,2.4,0.3,0,7);g.fill();
 // arm and hand
 outline(P.arm,5);CE_leafFill(P.arm,[250,640,700,980],{c0:'#A6DC52',c1:'#5BAA38',c2:'#2C7228',n:1300,s0:7,s1:15,pal:leafPal,seed:31,ol:true});
 g.save();g.clip(P.arm);g.lineWidth=14;g.strokeStyle='rgba(240,255,190,0.35)';g.stroke(P.arm);g.restore();
 outline(P.hand,5);CE_leafFill(P.hand,[50,570,300,700],{c0:'#C6EE6C',c1:'#86C944',c2:'#3E8E31',n:900,s0:4,s1:9,pal:leafPal,seed:37});
 g.save();g.clip(P.hand);g.lineWidth=8;g.strokeStyle='rgba(245,255,200,0.6)';g.stroke(P.hand);
 // palm hollow (where the drop rests) and finger creases
 const pg=g.createRadialGradient(196,628,4,196,630,46);pg.addColorStop(0,'rgba(230,255,170,0.75)');pg.addColorStop(1,'rgba(230,255,170,0)');g.fillStyle=pg;g.beginPath();g.ellipse(196,628,52,18,-0.08,0,7);g.fill();
 g.strokeStyle='rgba(30,80,24,0.55)';g.lineWidth=1.6;for(const [x,y] of [[118,622],[110,636],[114,650],[126,662]]){g.beginPath();g.moveTo(x,y-6);g.quadraticCurveTo(x+4,y,x,y+6);g.stroke()}g.restore();
 // vines curling round the wrist and forearm
 g.strokeStyle='#2C7228';g.lineWidth=3.2;g.beginPath();for(let i=0;i<=40;i++){const u=i/40,x=lerp(300,470,u)+Math.sin(u*18)*14,y=lerp(690,900,u)+Math.cos(u*18)*10;i?g.lineTo(x,y):g.moveTo(x,y)}g.stroke();
 for(let i=0;i<8;i++){const u=i/7,x=lerp(300,470,u)+Math.sin(u*18)*14,y=lerp(690,900,u)+Math.cos(u*18)*10;CE_lf(x,y,14,-0.6+(i%2)*1.6,'#B6E45E','#5BAA38','rgba(23,74,30,0.7)')}
 // curly tendrils off the hand
 g.strokeStyle='#3E8E31';g.lineWidth=2.4;for(const [x,y,s] of [[262,694,1],[230,686,-1]]){g.beginPath();for(let i=0;i<=30;i++){const u=i/30,a=u*9*s,r=18*(1-u)+3;i?g.lineTo(x+Math.cos(a)*r-u*6,y+16+u*26+Math.sin(a)*r):g.moveTo(x+r,y+16)}g.stroke()}
 // small flowers tucked in the hair and on the shoulder
 const rf=RNG(57);for(let i=0;i<16;i++){const x=600+rf()*190,y=300+rf()*900,cs=['#F49AC6','#FFFFFF','#B983E6','#FFB347'];C_flower(x,y,7+rf()*5,{t:0,col:cs[i%4],tint:false,rot:rf()*6})}
}
const CE_meArt=()=>CE_cache('me',30,20,800,1310,2,CE_meDraw);
// the flower crown: positions along the crown (drawn live so they can bloom)
const CE_CROWN=(()=>{const r=RNG(91),L=[],cols=['#FF9A3C','#FFB347','#F49AC6','#FFFFFF','#B983E6','#FF7E5F','#FFE36A'];
 for(let i=0;i<24;i++){const u=i/23,a=lerp(Math.PI*1.06,Math.PI*1.96,u),x=618+Math.cos(a)*(168+r()*26),y=214+Math.sin(a)*(150+r()*24);L.push([x,y,14+r()*11,cols[Math.floor(r()*cols.length)],r()*6.28,r()])}
 for(let i=0;i<10;i++){L.push([570+r()*210,110+r()*230,9+r()*8,cols[Math.floor(r()*cols.length)],r()*6.28,0.5+r()*0.5])}return L})();
function CE_meCrown(t,p,s=1){
 // a leafy band under the flowers
 if(p>0.02){for(let i=0;i<16;i++){const u=i/15,a=lerp(Math.PI*1.08,Math.PI*1.94,u),x=618+Math.cos(a)*180,y=214+Math.sin(a)*160;C_leaf(x,y,30*cl(p*2-u*0.5),a+Math.PI*0.5+(i%2?0.7:-0.7),{t,col:'#7ED957',col2:'#2F8A3A',w:0.36,a:cl(p*3)})}}
 for(const [x,y,sz,col,rot,d] of CE_CROWN){const k=p>=1?1:cl(p*1.6-d*0.6);if(k<=0)continue;C_flower(x,y,sz*s,{t,col,rot,p:k,petals:col==='#FFFFFF'?8:5})}}
// Mother Earth in the frame: cx,cy = translate; z = scale; rise 0..1 (from below), crown bloom 0..1, sway with t
function CE_mother(t,o={}){const A=CE_meArt(),rise=o.rise??1,z=o.z??1,br=Math.sin(t*1.3)*0.004;
 g.save();g.translate(o.x??0,(o.y??0)+(1-rise)*760);g.translate(360,640);g.scale(z*(1+br),z*(1+br));g.translate(-360,-640);
 if(o.halo>0){g.save();g.globalCompositeOperation='screen';glow(560,330,420,o.haloCol||'255,244,214',0.55*o.halo,0.3);glow(560,330,230,'255,255,240',0.35*o.halo,0.4);g.restore()}
 CE_putTint(A,t,o.tint??0.6);CE_meCrown(t,o.crown??1);
 if(o.after)o.after();g.restore()}
// where the palm and drop land on screen for a given transform
const CE_meXY=(o,[x,y])=>{const z=o.z??1;return [360+(x-360)*z+(o.x??0),640+(y-640)*z+(o.y??0)+(1-(o.rise??1))*760]};

// =====================================================================================================================
// ROOTS — rich brown cartoon roots spreading wide and branching (inspired by tree_root_1), rounded tips that curl;
// water / light climbs them as dashes of light. Geometry in reach units (R px), base at (0,0), down = +y.
// =====================================================================================================================
const CE_RG={};
const CE_MAINS={wide:[[0.06,1,0.07,-1],[0.4,0.82,0.064,-0.7],[0.95,0.6,0.06,0.5],[1.571,0.48,0.082,0.3],[2.19,0.6,0.06,-0.5],[2.74,0.82,0.064,0.7],[3.08,1,0.07,1]]};
function CE_rootGeo(key,o={}){if(CE_RG[key])return CE_RG[key];const r=RNG(o.seed||1),B=[],dep=o.depth??2,N=o.N||16,grav=o.grav??0.035;
 function br(x,y,a,L,w,d,curl,s0){const pts=[[x,y]];let px=x,py=y;
  for(let i=1;i<=N;i++){const u=i/N;a+=grav*(Math.PI/2-a)*(1+d*0.4)+(r()-0.5)*0.2;if(u>0.72)a+=curl*0.16;px+=Math.cos(a)*L/N;py=Math.max(0.01,py+Math.sin(a)*L/N);pts.push([px,py])}
  const dur=0.22+0.34*L,b={pts,w0:w,w1:Math.max(0.0035,w*0.15),d,s0,dur};B.push(b);
  if(d<dep){const n=d===0?(o.sub||3)+Math.floor(r()*2):1+Math.floor(r()*2);
   for(let j=0;j<n;j++){const at=Math.min(N-2,Math.max(2,Math.floor(N*(0.18+0.64*(j+0.15+r()*0.7)/n)))),q=pts[at],pa=CE_ang(pts,at);let side=r()<0.5?-1:1,ca=pa+side*(0.45+r()*0.55);
    if(Math.sin(ca)<0.06){side=-side;ca=pa+side*(0.45+r()*0.55)}
    br(q[0],q[1],ca,L*(0.34+r()*0.24),lerp(w,b.w1,at/N)*0.74,d+1,(r()<0.7?-side:0)*(0.7+r()*0.6),s0+dur*at/N)}}}
 const M=o.mains||CE_MAINS.wide;M.forEach(([a,L,w,c],i)=>br((i-(M.length-1)/2)*0.014,0,a,L*(o.len||1),w*(o.wk??1.95),0,c,0));
 let e=0;for(const b of B)e=Math.max(e,b.s0+b.dur);for(const b of B){b.s0/=e;b.dur/=e}
 return CE_RG[key]=B}
function CE_rootPaths(G,R,p,ex){const E=new Path2D(),Bd=new Path2D(),Hh=new Path2D();
 for(const b of G){const f=p>=1?1:cl((p-b.s0)/b.dur);if(f<=0)continue;const P=CE_part(b.pts,f).map(([x,y])=>[x*R,y*R]);if(P.length<2)continue;
  const w0=b.w0*R,w1=lerp(b.w0,b.w1,f)*R;CE_taper(E,P,w0+2*ex,w1+2*ex);CE_taper(Bd,P,w0,w1);
  if(b.d<=1&&P.length>3){const k=Math.floor(P.length*0.72);for(let i=0;i<k;i++){const w=lerp(w0,w1,i/(P.length-1)),[px,py]=P[i];i?Hh.lineTo(px,py-w*0.24):Hh.moveTo(px,py-w*0.24)}}}
 return {E,B:Bd,H:Hh}}
// draw roots at (x,y), reach R px, growth p; o.col body colour, o.tk clock tint, o.icon = flat fill colour (white icon look)
function CE_roots(x,y,G,R,p,o={}){if(p<=0)return;const t=o.t??CUR_T,ex=Math.max(1.1,R*0.0045);let Pp;
 if(p>=1){const k=R+'|'+ex;G._c=G._c||{};Pp=G._c[k]||(G._c[k]=CE_rootPaths(G,R,1,ex))}else Pp=CE_rootPaths(G,R,p,ex);
 g.save();g.translate(x,y);g.globalAlpha*=o.a??1;
 if(o.icon){const m=/,\s*([\d.]+)\)\s*$/.exec(o.icon);g.globalAlpha*=m?+m[1]:1}
 const base=C_tint(o.col||'#B07440',t,o.tk??0.5),edge=C_mx(base,[44,22,8],0.72);
 g.fillStyle=C_c(edge);g.fill(Pp.E);
 const gr=g.createLinearGradient(0,0,0,R*0.9);gr.addColorStop(0,C_c(C_mx(base,C_WH,0.14)));gr.addColorStop(1,C_c(C_mx(base,C_BK,0.2)));g.fillStyle=gr;g.fill(Pp.B);
 g.strokeStyle=C_c(C_mx(base,C_WH,0.42),0.7);g.lineCap='round';g.lineJoin='round';g.lineWidth=Math.max(1,R*0.007);g.stroke(Pp.H);
 g.restore()}
// light / water running along the roots: dir +1 from the base out to the tips, -1 from the tips up to the base (drinking)
function CE_rootLight(x,y,G,R,lit,o={}){if(lit<=0)return;const t=o.t??CUR_T,col=o.col||'160,232,255',dir=o.dir||1,a=o.a??1;
 const segs=[];for(const b of G){let f,f0,f1;if(dir>0){f=cl((lit-b.s0)/b.dur);f0=0;f1=f}else{f=cl((lit-(1-b.s0-b.dur))/b.dur);f0=1-f;f1=1}if(f<=0.01)continue;
  const n=b.pts.length-1,P=[];for(let i=Math.floor(f0*n);i<=Math.ceil(f1*n);i++)P.push([b.pts[i][0]*R,b.pts[i][1]*R]);if(P.length>1)segs.push({P,w:b.w0*R})}
 if(!segs.length)return;
 g.save();g.translate(x,y);g.globalAlpha*=a;g.lineCap='round';g.lineJoin='round';g.shadowColor=`rgba(${col},0.7)`;g.shadowBlur=6*SC;
 const line=s=>{g.beginPath();s.P.forEach(([px,py],i)=>i?g.lineTo(px,py):g.moveTo(px,py));g.stroke()};
 g.strokeStyle=`rgba(${col},0.85)`;for(const s of segs){g.lineWidth=Math.max(0.9,s.w*0.36);line(s)}g.shadowBlur=0;
 g.strokeStyle='rgba(255,255,255,0.7)';g.setLineDash([2.5,22]);g.lineDashOffset=-dir*t*80;for(const s of segs){if(s.w<3)continue;g.lineWidth=Math.max(1.2,s.w*0.18);line(s)}
 g.restore()}
// the a2/a4 sapling's roots: wide and shallow, so the cutaway caption band (y~806) stays calm
const CE_GA=()=>CE_rootGeo('A',{seed:11});

// =====================================================================================================================
// PLANTS — a young plant (droops when dry, perks up and flowers when it drinks), seeds that split, sprouts that unfold
// =====================================================================================================================
function CE_plant(x,y,s,o={}){const t=o.t??CUR_T,dr=o.droop||0,dry=o.dry||0,gw=o.grow??1;if(gw<=0.01)return;
 const sw=Math.sin(t*1.6+x*0.01)*0.035*(1-dr*0.6)+(o.shake||0)*Math.sin(t*41)*0.025;
 const h=150*s*gw,tx=x+(20+70*dr)*s*gw,ty=y-h*(1-0.38*dr),cx=x-14*s,cy=y-h*0.62;
 const leafC=C_c(C_mx('#62C94C','#CDB45A',dry)),leafC2=C_c(C_mx('#2C8A36','#8C7A2E',dry));
 g.save();g.translate(x,y);g.rotate(sw);g.translate(-x,-y);g.lineCap='round';
 g.strokeStyle=C_c(C_tint(C_mx('#2E7D32','#7D6B2C',dry),t,0.45));g.lineWidth=7.5*s;g.beginPath();g.moveTo(x,y);g.quadraticCurveTo(cx,cy,tx,ty);g.stroke();
 g.strokeStyle=C_c(C_tint(C_mx('#8AD65A','#D8C46A',dry),t,0.45),0.85);g.lineWidth=2.2*s;g.beginPath();g.moveTo(x-2*s,y);g.quadraticCurveTo(cx-2*s,cy,tx-1.5*s,ty);g.stroke();
 const at=u=>{const q=1-u;return [q*q*x+2*q*u*cx+u*u*tx,q*q*y+2*q*u*cy+u*u*ty]};
 for(const [u,side,k] of [[0.22,-1,1],[0.36,1,1.05],[0.52,-1,0.95],[0.66,1,0.85],[0.8,-1,0.7],[0.9,1,0.55]]){const lg=cl(gw*1.5-u*0.6);if(lg<=0)continue;const [px,py]=at(u);
  const ang=-Math.PI/2+side*(0.85+0.3*u)+side*dr*1.45+Math.sin(t*2+u*9)*0.04;
  C_leaf(px,py,64*s*k*lg,ang,{t,col:leafC,col2:leafC2,w:0.4})}
 const [bx,by]=at(1);
 if((o.bloom||0)>0.01)C_flower(bx,by-4*s,17*s,{t,p:o.bloom,col:'#F47FB8',petals:6});
 else{g.fillStyle=C_c(C_tint(C_mx('#E86AA6','#B89A50',dry),t,0.4));g.strokeStyle='rgba(90,30,50,0.6)';g.lineWidth=1.2;g.beginPath();g.ellipse(bx,by-5*s,5*s,8*s,0.3+dr,0,7);g.fill();g.stroke()}
 g.restore();return [bx,by]}
// a sprout: a curved stem and two seed-leaves that unfold (k 0..1)
function CE_sprout(x,y,h,k,t,s=1){if(h<=1)return;const sw=Math.sin(t*2.1+x*0.05)*0.06,tx=x+Math.sin(sw)*h*0.4+6*s,ty=y-h;
 g.save();g.lineCap='round';g.strokeStyle=C_c(C_tint('#3E9B3A',t,0.4));g.lineWidth=Math.max(2,4.5*s);g.beginPath();g.moveTo(x,y);g.quadraticCurveTo(x-10*s,y-h*0.55,tx,ty);g.stroke();
 g.strokeStyle=C_c(C_tint('#9BE06A',t,0.4),0.8);g.lineWidth=Math.max(1,1.4*s);g.beginPath();g.moveTo(x-1.2*s,y);g.quadraticCurveTo(x-11*s,y-h*0.55,tx-1*s,ty);g.stroke();g.restore();
 const lo=eo(cl((k-0.3)/0.7)),L=36*s*(0.4+0.6*lo);
 C_leaf(tx,ty,L,-Math.PI/2-0.22-1.1*lo,{t,col:'#86DE5C',col2:'#2F9A3E',w:0.46});C_leaf(tx,ty,L,-Math.PI/2+0.22+1.1*lo,{t,col:'#86DE5C',col2:'#2F9A3E',w:0.46})}
// a glossy brown seed; open 0..1 splits it and lets a sprout rise
function CE_seed(x,y,s,a,open,t,o={}){g.save();g.translate(x,y);g.rotate(a);const gap=cl(open*3)*5*s;
 for(const sd of [-1,1]){g.save();g.translate(0,sd*gap*0.5);g.rotate(sd*cl(open*2)*0.18);g.beginPath();g.ellipse(0,0,16*s,10*s,0,sd>0?0:Math.PI,sd>0?Math.PI:Math.PI*2);g.closePath();
  const gr=g.createLinearGradient(0,-10*s,0,10*s);gr.addColorStop(0,'#D39A58');gr.addColorStop(1,'#6B4220');g.fillStyle=gr;g.fill();g.strokeStyle='#3A2210';g.lineWidth=1.4;g.stroke();g.restore()}
 g.fillStyle='rgba(255,238,205,0.5)';g.beginPath();g.ellipse(-4*s,-5*s-gap*0.5,6*s,2.2*s,-0.1,0,7);g.fill();g.restore();
 if(open>0.12){const k=eo(cl((open-0.12)/0.88));CE_sprout(x,y-4*s,(o.h||110)*s*k,k,t,s)}}

// =====================================================================================================================
// CRACKS in dry soil (a4_pain2): jagged, branching, a faint warm glow inside
// =====================================================================================================================
const CE_CRK=(()=>{const r=RNG(313),L=[];
 function cr(x,y,a,len,w,d,s0){const pts=[[x,y]];let px=x,py=y;const n=7;for(let i=1;i<=n;i++){a+=(r()-0.5)*0.9;a=lerp(a,Math.PI/2,0.15);px+=Math.cos(a)*len/n;py+=Math.sin(a)*len/n;pts.push([px,py])}
  L.push({pts,w,d,s0});if(d<2){const k=1+Math.floor(r()*2);for(let j=0;j<k;j++){const at=2+Math.floor(r()*4),q=pts[at];cr(q[0],q[1],a+(r()<0.5?-1:1)*(0.6+r()*0.5),len*0.5,w*0.55,d+1,s0+0.5*at/n)}}}
 [[96,0.2],[228,-0.25],[492,0.25],[622,-0.15],[350,0.05]].forEach(([x,da])=>cr(x,0,Math.PI/2+da,150+r()*130,10,0,0));return L})();
function CE_cracks(t,y,p,glowA,a=1){if(p<=0.01||a<=0.01)return;g.save();g.translate(0,y+8);g.globalAlpha*=a;const P=new Path2D(),segs=[];
 for(const c of CE_CRK){const f=cl((p-c.s0*0.5)/0.55);if(f<=0)continue;const Q=CE_part(c.pts,f);if(Q.length<2)continue;CE_taper(P,Q,c.w,lerp(c.w,1,f));segs.push([Q,c.w])}
 g.fillStyle='rgba(40,18,8,0.92)';g.fill(P);g.strokeStyle='rgba(225,180,130,0.35)';g.lineWidth=1.2;g.stroke(P);
 if(glowA>0.01){g.globalCompositeOperation='screen';g.lineCap='round';g.lineJoin='round';const pu=glowA*(0.75+0.25*Math.sin(t*6));
  for(const [Q,w] of segs){g.strokeStyle=`rgba(255,120,60,${0.28*pu})`;g.lineWidth=w*1.6+6;g.beginPath();Q.forEach(([px,py],i)=>i?g.lineTo(px,py):g.moveTo(px,py));g.stroke();
   g.strokeStyle=`rgba(255,196,120,${0.85*pu})`;g.lineWidth=Math.max(1,w*0.3);g.stroke()}}
 g.restore()}
// wet soil: darkened and cooled above a wavy water front that sinks; seeping drops
function CE_wet(t,y,a,front,seed=7){if(a<=0.01)return;const yf=front??3000,fy=x=>Math.min(yf+(vnoise(x*0.012+t*0.3,31)-0.5)*44,yf+30);
 g.save();const P=new Path2D();P.moveTo(-W,C_edge(-W,y)+9);for(let x=-W;x<=2*W;x+=24)P.lineTo(x,C_edge(x,y)+9);P.lineTo(2*W,3*H);P.lineTo(-W,3*H);P.closePath();g.clip(P);
 const Q=new Path2D();Q.moveTo(-60,y-30);Q.lineTo(W+60,y-30);for(let x=W+60;x>=-60;x-=20)Q.lineTo(x,fy(x));Q.closePath();
 g.globalCompositeOperation='multiply';g.fillStyle=`rgba(96,104,150,${0.55*a})`;g.fill(Q);
 g.globalCompositeOperation='screen';g.lineCap='round';g.lineJoin='round';
 if(front!=null&&yf<H+40){g.beginPath();for(let x=-60;x<=W+60;x+=20){const v=fy(x);x>-60?g.lineTo(x,v):g.moveTo(x,v)}g.strokeStyle=`rgba(120,190,255,${0.35*a})`;g.lineWidth=14;g.stroke();g.strokeStyle=`rgba(210,240,255,${0.7*a})`;g.lineWidth=2.4;g.stroke()}
 g.restore();
 const r=RNG(seed),lim=front??H;for(let i=0;i<22;i++){const x=20+r()*680,sp=90+r()*90,yy=y+18+((t*sp+r()*900)%Math.max(40,lim-y));if(yy<lim-6)B_drop(x,yy,3.6+r()*2.4,0.8*a)}}

// =====================================================================================================================
// THE TREE — one skeleton whose five limbs end exactly on the five roll-call stars (W_STARS). As an icon (m=0) it is a
// white tree with white leaves (the tree.png look); as colour (m=1) a thick twisting light-brown trunk with root flare and
// a big puffy 3-green canopy (the tree_root_2 look) whose five crown clusters are the five stars. Base at (0,0).
// =====================================================================================================================
const CE_TR=(()=>{const r=RNG(707),S=W_STARS.map(([x,y])=>[x-360,y-1000]);
 const trunk=[];for(let i=0;i<=14;i++){const u=i/14;trunk.push([Math.sin(u*3.4+0.4)*18*(1-u*0.25)-6,-u*390])}
 const FK=[[-14,-318],[-4,-372],[2,-386],[8,-372],[16,-322]],limbs=[],twigs=[];
 S.forEach(([sx,sy],i)=>{const [fx,fy]=FK[i],cx=lerp(fx,sx,0.25)+(sx<0?-30:30),cy=lerp(fy,sy,0.7),pts=[];
  for(let j=0;j<=14;j++){const u=j/14,q=1-u;pts.push([q*q*fx+2*q*u*cx+u*u*sx,q*q*fy+2*q*u*cy+u*u*sy])}limbs.push(pts);
  for(let k=0;k<3;k++){const at=5+k*3+Math.floor(r()*2),p0=pts[at],pa=CE_ang(pts,at),sd=k%2?1:-1,a=pa+sd*(0.6+r()*0.35),L=55+r()*55,tp=[];
   for(let j=0;j<=6;j++){const u=j/6,aa=a-sd*u*0.35;tp.push([p0[0]+Math.cos(aa)*L*u,p0[1]+Math.sin(aa)*L*u])}twigs.push({pts:tp,li:i,at})}});
 const flare=[[[-12,-50],[-30,-16],[-60,-2],[-96,6]],[[12,-50],[34,-16],[64,-2],[100,6]]];
 const CL=[];S.forEach(([sx,sy],i)=>{const c=[[sx,sy,88+r()*10]];for(let j=0;j<6;j++){const a=j/6*6.283+r()*0.5,d=62+r()*16;c.push([sx+Math.cos(a)*d,sy+Math.sin(a)*d*0.8,48+r()*16])}CL.push({cx:sx,cy:sy,c,i})});
 [[0,-600,118],[-130,-600,96],[130,-615,96],[-70,-515,76],[90,-512,76],[-250,-560,64],[290,-540,58],[-160,-720,70],[150,-740,64]].forEach(([x,y,R2],j)=>CL.push({cx:x,cy:y,c:[[x,y,R2]],i:-1,j}));
 const FL=[],FC=['#F49AC6','#B983E6','#FFFFFF','#FFB347','#FF8FA3'];CL.forEach((C,ci)=>{const n=C.i>=0?2:1;for(let k=0;k<n;k++){const cc=C.c[Math.floor(r()*C.c.length)],a=r()*6.283,d=r()*cc[2]*0.65;FL.push({ci,dx:cc[0]+Math.cos(a)*d-C.cx,dy:cc[1]+Math.sin(a)*d-C.cy,col:FC[Math.floor(r()*FC.length)],s:8+r()*5,rot:r()*6})}});
 const IL=new Path2D(),leafAt=(x,y,s2,a)=>{IL.moveTo(x+Math.cos(a)*s2,y+Math.sin(a)*s2);IL.ellipse(x,y,s2,s2*0.42,a,0,Math.PI*2)};
 S.forEach(([sx,sy])=>{for(let j=0;j<24;j++){const a=r()*6.283,d=Math.sqrt(r())*80;leafAt(sx+Math.cos(a)*d,sy+Math.sin(a)*d*0.85,6+r()*4,r()*6.283)}});
 twigs.forEach(tw=>{const e=tw.pts[6];for(let j=0;j<7;j++){const a=r()*6.283,d=r()*22;leafAt(e[0]+Math.cos(a)*d,e[1]+Math.sin(a)*d,5+r()*3,r()*6.283)}});
 return {S,trunk,limbs,twigs,flare,CL,FL,IL}})();
// m: 0 white icon .. 1 colour; p: growth 0..1; o.sc(cluster)->scale for the crown clusters (default m); o.tk clock tint (0 = untinted, for caching)
function CE_treeDraw(t,m,p,o={}){const T=CE_TR,tk=o.tk??0.45;if(p<=0)return;g.save();g.lineCap='round';g.lineJoin='round';
 const b0=C_tint('#D6A97C',t,tk),b1=C_tint('#8A5C3E',t,tk),WH2=[248,252,255];
 const E=new Path2D(),Bp=new Path2D();
 const add=(pts,f,w0,w1)=>{if(f<=0.002)return;const P=CE_part(pts,f);if(P.length<2)return;const we=lerp(w0,w1,f);CE_taper(E,P,w0+5*m,we+5*m);CE_taper(Bp,P,Math.max(0.6,w0),Math.max(0.6,we))};
 const ft=cl(p/0.32),fl=cl((p-0.22)/0.5),fw=cl((p-0.5)/0.4);
 add(T.trunk,ft,lerp(16,80,m),lerp(8,40,m));if(m>0.01)for(const F of T.flare)add(F,ft,lerp(0.6,34,m),lerp(0.6,7,m));
 T.limbs.forEach(L=>add(L,fl,lerp(7,32,m),lerp(2.6,10,m)));T.twigs.forEach(tw=>add(tw.pts,fw,lerp(3,12,m),lerp(1.2,4,m)));
 if(m>0.02){g.save();g.globalAlpha*=cl(m*1.5);g.fillStyle=C_c(C_mx(b1,C_BK,0.5));g.fill(E);g.restore()}
 const gr=g.createLinearGradient(-70,0,70,0);gr.addColorStop(0,C_c(C_mx(WH2,C_mx(b0,C_WH,0.22),m)));gr.addColorStop(0.5,C_c(C_mx(WH2,b0,m)));gr.addColorStop(1,C_c(C_mx(WH2,b1,m)));g.fillStyle=gr;g.fill(Bp);
 if(m>0.3&&ft>0.9){g.save();g.globalAlpha*=cl((m-0.3)/0.5);g.strokeStyle=C_c(C_mx(b1,C_BK,0.3),0.6);g.lineWidth=2.4;g.beginPath();
  for(const [a,b,c2,d,e,f] of [[-14,-20,-6,-120,-16,-230],[12,-30,18,-140,8,-250],[-4,-160,4,-220,-2,-300],[-30,-8,-20,-30,-12,-72],[30,-8,22,-34,14,-76]]){g.moveTo(a,b);g.quadraticCurveTo(c2,d,e,f)}g.stroke();g.restore()}
 const la=(1-m)*cl((p-0.72)/0.22);if(la>0.01){g.fillStyle=`rgba(255,255,255,${la})`;g.fill(T.IL)}
 if(m>0.01){const L0=C_tint('#2E7C34',t,tk),L1=C_tint('#4EA63F',t,tk),L2=C_tint('#8CD05C',t,tk),ol=C_mx(L0,C_BK,0.42),sc=o.sc||(()=>m),Bk=new Path2D(),Md=new Path2D(),Tp=[],scs=[];
  T.CL.forEach((C,ci)=>{const s=sc(C);scs[ci]=s;if(s<=0.01)return;for(const [x,y,R] of C.c){const X=C.cx+(x-C.cx)*s,Y=C.cy+(y-C.cy)*s,RR=R*s;C_circ(Bk,X,Y,RR);C_circ(Md,X-RR*0.1,Y-RR*0.16,RR*0.8)}if(C.i>=0)Tp.push([C.cx-30*s,C.cy-36*s,50*s])});
  g.lineWidth=6;g.strokeStyle=C_c(ol);g.stroke(Bk);g.fillStyle=C_c(L0);g.fill(Bk);
  g.save();g.clip(Bk);g.lineWidth=3;g.strokeStyle=C_c(C_mx(L0,C_BK,0.2),0.7);g.stroke(Md);const mg=g.createLinearGradient(0,-900,0,-470);mg.addColorStop(0,C_c(L2));mg.addColorStop(0.55,C_c(L1));mg.addColorStop(1,C_c(C_mx(L1,L0,0.5)));g.fillStyle=mg;g.fill(Md);
  for(const [x,y,R] of Tp){const rg=g.createRadialGradient(x,y,0,x,y,R*1.3);rg.addColorStop(0,C_c(C_mx(L2,C_WH,0.32),0.8));rg.addColorStop(1,C_c(L2,0));g.fillStyle=rg;g.beginPath();g.arc(x,y,R*1.3,0,7);g.fill()}
  g.strokeStyle=C_c(C_mx(L0,C_BK,0.2),0.55);g.lineWidth=2;g.beginPath();T.CL.forEach((C,ci)=>{const s=scs[ci];if(!(s>0.3))return;for(const [x,y,R] of C.c.slice(1,4)){const X=C.cx+(x-C.cx)*s,Y=C.cy+(y-C.cy)*s,RR=R*s*0.45;g.moveTo(X+RR*Math.cos(3.6),Y+RR*Math.sin(3.6));g.arc(X,Y,RR,3.6,5.9)}});g.stroke();g.restore();
  for(const F of T.FL){const s=scs[F.ci];if(!(s>0.4))continue;const C=T.CL[F.ci];C_flower(C.cx+F.dx*s,C.cy+F.dy*s,F.s,{t,p:cl((s-0.4)/0.5),col:F.col,rot:F.rot,tint:tk>0?undefined:false})}}
 g.restore()}
// the finished colour tree cached (untinted; CE_putTint lights it by the clock)
const CE_treeArt=()=>CE_cache('tree',-420,-940,840,975,1.6,()=>CE_treeDraw(0,1,1,{tk:0}));
function CE_tree(t,x,y,s,o={}){const A=CE_treeArt(),sw=Math.sin(t*0.9)*0.008;g.save();g.translate(x,y);g.scale(s,s*(o.sy??1));g.rotate(sw);CE_putTint(A,t,o.tk??0.4,o.a??1);g.restore()}
// the five influences glowing as gold lights inside the crown
function CE_glints(t,x,y,s,a){if(a<=0.01)return;CE_TR.S.forEach(([sx,sy],i)=>{const tw=0.75+0.25*Math.sin(t*3.1+i*1.7);CE_spk(x+sx*s,y+sy*s,(9+3*tw)*Math.max(0.6,s),a*tw,'255,226,140')})}
const CE_GT=()=>CE_rootGeo('T',{seed:91});                 // the tree's roots
const CE_GTI=()=>CE_rootGeo('TI',{seed:91,depth:3,wk:0.5});  // the same roots as fine white icon roots

// =====================================================================================================================
// THE LADDER — warm golden wood; in a5_ladder it is assembled from rain streaks that snap into rails and rungs
// =====================================================================================================================
function CE_ladP(L){if(L._p)return L._p;const P=[],rp=(s,u)=>[lerp(L.bx[s],L.tx[s],u),lerp(L.by,L.ty,u)];
 for(let s=0;s<2;s++)for(let i=0;i<L.seg;i++)P.push({a:rp(s,i/L.seg),b:rp(s,(i+1)/L.seg),w:L.rw*lerp(1,L.top,(i+0.5)/L.seg),rail:1,s});
 for(let i=0;i<L.n;i++){const u=(i+0.55)/(L.n+0.3);P.push({a:rp(0,u),b:rp(1,u),w:L.gw*lerp(1,L.top,u),rail:0})}return L._p=P}
// o.t0: assemble from rain (bottom rungs first); o.glow 0..1 gold halo; o.climb 0..1 a light running up the rails
function CE_ladder(t,L,o={}){const P=CE_ladP(L),r=RNG(L.seed||31),segs=[],asm=o.t0!=null;
 for(const pc of P){const rx=(r()-0.5)*460,ph=r(),mx=(pc.a[0]+pc.b[0])/2,my=(pc.a[1]+pc.b[1])/2;let A=pc.a,B=pc.b,k=1;
  if(asm){const ts=o.t0+0.04+0.42*cl((L.by-my)/(L.by-L.ty))+ph*0.06;k=eo(cl((t-ts)/0.26));
   if(k<1){const tau=Math.min(t,ts),cy=my-170-ph*70+900*(tau-ts),cx=mx+rx,ux=Math.cos(1.74)*36,uy=Math.sin(1.74)*36;if(k<=0&&(cy<-80||cy>H+80))continue;
    A=[lerp(cx-ux,pc.a[0],k),lerp(cy-uy,pc.a[1],k)];B=[lerp(cx+ux,pc.b[0],k),lerp(cy+uy,pc.b[1],k)]}}
  segs.push({A,B,w:lerp(2.4,pc.w,k),k,rail:pc.rail})}
 const wood=C_tint('#F4B65A',t,0.25),wood2=C_tint('#E09A40',t,0.25),edge=[96,54,14],rain=[214,236,255],hi=[255,236,180];
 g.save();g.lineCap='round';const line=(s,dx=0)=>{g.beginPath();g.moveTo(s.A[0]+dx,s.A[1]);g.lineTo(s.B[0]+dx,s.B[1]);g.stroke()};
 if((o.glow||0)>0.01){g.save();g.globalCompositeOperation='screen';for(const s of segs)if(s.rail&&s.k>0.9){glow((s.A[0]+s.B[0])/2,(s.A[1]+s.B[1])/2,52,'255,208,120',0.2*o.glow,0.3)}g.restore()}
 for(const s of segs){g.strokeStyle=C_c(C_mx(rain,edge,s.k),0.4+0.6*s.k);g.lineWidth=s.w+5*s.k;line(s)}
 for(const s of segs){g.strokeStyle=C_c(C_mx(rain,s.rail?wood:wood2,s.k));g.lineWidth=s.w;line(s)}
 for(const s of segs)if(s.k>0.5){g.strokeStyle=C_c(hi,0.8*s.k);g.lineWidth=Math.max(1,s.w*0.26);line(s,s.rail?-s.w*0.22:0)}
 if(o.climb>0&&o.climb<1){g.globalCompositeOperation='screen';for(let sd=0;sd<2;sd++){const u=o.climb,x=lerp(L.bx[sd],L.tx[sd],u),y=lerp(L.by,L.ty,u);glow(x,y,46,'255,226,150',0.75,0.3);glow(x,y,14,'255,255,240',0.9,0.5)}}
 g.restore()}

// =====================================================================================================================
// a walker on the road (seen from behind): yellow raincoat, red backpack and boots
// =====================================================================================================================
function CE_walker(x,y,s,t){const ph=t*7.5,l1=Math.sin(ph)*0.42;g.save();g.translate(x,y);g.scale(s,s);g.lineCap='round';g.lineJoin='round';
 g.fillStyle='rgba(60,40,20,0.25)';g.beginPath();g.ellipse(0,1,17,4,0,0,7);g.fill();
 for(const [a,dx] of [[l1,-5],[-l1,5]]){g.save();g.translate(dx,-28);g.rotate(a*0.45);g.strokeStyle='#26386E';g.lineWidth=8;g.beginPath();g.moveTo(0,0);g.lineTo(0,22);g.stroke();
  g.fillStyle='#D8433A';g.strokeStyle='#6A1A14';g.lineWidth=1.4;g.beginPath();g.ellipse(0,25,5.5,4.2,0,0,7);g.fill();g.stroke();g.restore()}
 for(const [a,dx] of [[-l1,-13],[l1,13]]){g.save();g.translate(dx,-56);g.rotate(a*0.5+(dx<0?0.15:-0.15));g.strokeStyle='#E8B020';g.lineWidth=7;g.beginPath();g.moveTo(0,0);g.lineTo(0,22);g.stroke();g.restore()}
 g.fillStyle='#F7C531';g.strokeStyle='#8A5E0A';g.lineWidth=1.6;g.beginPath();g.moveTo(-14,-24);g.quadraticCurveTo(-17,-52,-10,-62);g.lineTo(10,-62);g.quadraticCurveTo(17,-52,14,-24);g.closePath();g.fill();g.stroke();
 g.fillStyle='#E0524A';g.strokeStyle='#7A1E18';g.beginPath();g.roundRect(-9,-58,18,22,5);g.fill();g.stroke();g.fillStyle='rgba(255,255,255,0.35)';g.fillRect(-6,-55,12,3);
 g.fillStyle='#F7C531';g.strokeStyle='#8A5E0A';g.beginPath();g.arc(0,-72,11,0,7);g.fill();g.stroke();g.fillStyle='rgba(255,255,255,0.4)';g.beginPath();g.ellipse(-4,-77,4,2.4,-0.4,0,7);g.fill();
 g.restore()}

// =====================================================================================================================
// SCENES
// =====================================================================================================================

// a2_earth (32.62-34.62): "that is the Mother Earth" — the drop sits in its ring where it landed; on "Mother" she rises,
// her open hand coming up under the drop, flowers blooming open in her crown
S.a2_earth=(t,c)=>{const tm=WT('Mother',32.6);Wbg(t,1,{moon:true,mx:150,my:150,ly:600,la:0.12,hills:true});Wground(t,760);
 const rise=eo(cl((t-tm+0.08)/0.75)),o={rise,z:1,crown:cl((t-tm-0.25)/0.9)};const [px,py]=CE_meXY(o,CE_ME.drop);
 const u=eio(cl((t-tm-0.15)/0.75)),dx=lerp(360,px,u),dy=lerp(744,py,u)-Math.sin(u*Math.PI)*60;
 if(u<0.6)C_ripples(360,766,t,c.t0-0.7,{n:3,sc:1.3,flat:0.24,life:2.4,light:'220,240,255',dark:'60,110,200',a:1-u});
 CE_mother(t,o);
 glow(dx,dy,70,'200,235,255',0.35,0.4);B_drop(dx,dy,22,1);
 if(t>tm+0.8)for(let i=0;i<5;i++){const a=i*1.26+t*0.6;CE_spk(px+Math.cos(a)*48,py-6+Math.sin(a)*22,5+3*hash(i),cl((t-tm-0.8)*3)*(0.5+0.5*Math.sin(t*4+i*2)),'210,240,255')}
 grain(t,0.04)};

// a2_earthword (40.59-41.52): "Earth." — the word drops in, ringed by a leafy vine wreath that draws itself, flowers opening on it
function CE_wreath(cx,cy,R,p,t){if(p<=0)return;const a0=-Math.PI*0.62,span=Math.PI*2*p,pt=a=>{const rr=R+Math.sin(a*7)*6;return [cx+Math.cos(a)*rr,cy+Math.sin(a)*rr]};
 g.save();g.lineCap='round';g.lineJoin='round';const n=Math.max(2,Math.round(90*p));
 g.strokeStyle=C_c(C_tint('#2C6E2A',t,0.3));g.lineWidth=8;g.beginPath();for(let i=0;i<=n;i++){const [x,y]=pt(a0+span*i/n);i?g.lineTo(x,y):g.moveTo(x,y)}g.stroke();
 g.strokeStyle=C_c(C_tint('#8BD35E',t,0.3),0.8);g.lineWidth=2.4;g.stroke();g.restore();
 for(let i=0;i<40;i++){const a=a0+i/40*Math.PI*2;if(a>a0+span)break;const [x,y]=pt(a),k=cl((a0+span-a)/0.5),sd=i%2?1:-1;C_leaf(x,y,(24+8*hash(i*3.7))*eo(k),a+Math.PI/2+sd*0.85,{t,col:'#86DA5A',col2:'#2E8A3A',w:0.42})}
 const FC=['#F49AC6','#FFB347','#B983E6','#FFFFFF','#FF7E8A','#FFE36A','#9AD0FF'];for(let i=0;i<7;i++){const a=a0+(i+0.4)/7*Math.PI*2;if(a>a0+span)break;const [x,y]=pt(a);C_flower(x,y,15,{t,p:cl((a0+span-a)/0.9),col:FC[i],rot:i})}}
S.a2_earthword=(t,c)=>{const te=WT('Earth',40.4);Wbg(t,1,{moon:false,la:0.18,ly:540,lr:360});
 g.save();g.globalCompositeOperation='screen';glow(360,545,260,'200,240,255',0.18,0.3);g.restore();
 CE_wreath(360,545,232,eo(cl((t-te-0.04)/0.6)),t);
 C_dropIn('Earth',W/2,552,166,'#86D86A',c.t0,t,{grad:['#E6FFB4','#86D86A','#5DB2EE'],stroke:['#0C2A3E',5],shadow:[14,0.4,4,'6,18,40']});
 grain(t,0.04)};

// a2_source (52.39-54.0): "the source of its creation" — under the earth line the roots of a young plant grow and light up on "source"
S.a2_source=(t,c)=>{const ts=WT('source',52.4),GY=600,G=CE_GA();Wbg(t,1,{moon:false,ly:GY-90,la:0.16,hills:false});Wground(t,GY);
 const p=0.06+0.94*eo(cl((t-ts+0.25)/1.05));CE_roots(360,GY+14,G,290,p,{t});CE_rootLight(360,GY+14,G,290,cl((t-ts)/1.15),{t,col:'170,226,255',a:0.85});
 CE_plant(360,GY+4,1.0,{t});
 if(t>ts-0.05){const k=cl((t-ts+0.05)*4)*(1-cl((t-ts-0.7)*2));glow(360,GY+16,70,'190,235,255',0.5*k,0.4)}
 grain(t,0.04)};

// a2_mother (54.0-54.88): "is Mother Earth" — closer on her face and hand; a soft halo glows up behind her head
S.a2_mother=(t,c)=>{Wbg(t,1,{moon:false,ly:330,lx:560,la:0.18,hills:false});const k=eo(cl(c.k/0.6)),o={z:1.32,x:-20,y:110,halo:0.4+0.6*k,crown:1};
 CE_mother(t,o);const [px,py]=CE_meXY(o,CE_ME.drop);glow(px,py,80,'210,240,255',0.4,0.4);B_drop(px,py,22*1.32,1);
 for(let i=0;i<7;i++){const a=i*0.9+t*0.4;CE_spk(560+Math.cos(a)*(230+20*(i%3)),330+Math.sin(a)*170,6+5*hash(i*3.1),k*(0.45+0.55*Math.sin(t*3.5+i*1.9)),'255,244,214')}
 grain(t,0.04)};

// a4_card_l8 (109.58-113.31): card unchanged; under it a drop falls into the soil (lands on "I") and gold light runs down into the roots
S.a4_card_l8=(t,c)=>Wcard(t,c,{lines:[7],cy:420,a:109.4,b:113.4,under:(t,c)=>{Wground(t,900);const f=cl(c.k/1.2),G=CE_rootGeo('L8',{seed:23});
 const gp=0.25+0.75*eo(cl((c.k-1.15)/1.5));CE_roots(360,914,G,210,gp,{t});CE_rootLight(360,914,G,210,cl((c.k-1.25)/1.9),{t,col:'255,206,110'});
 CE_plant(360,904,0.55,{t});
 if(f<1)B_drop(360,lerp(600,880,f*f),13,1);else{C_splash(360,898,t,c.t0+1.2,0.5);C_ripples(360,902,t,c.t0+1.2,{n:2,sc:0.7,flat:0.22,light:'255,236,170'})}}});

// a4_bloom (114.59-115.94): "about its creation" — gold afternoon; the drop on her palm blooms gold through the rain
S.a4_bloom=(t,c)=>{Wbg(t,0.95,{moon:false,ly:600,la:0.16,hills:false});B_rain(t,40,51,800,70,0.35,1.2);const k=eo(cl(c.k/1.1)),o={z:1.12,x:40,y:40,crown:1};
 CE_mother(t,o);const [px,py]=CE_meXY(o,CE_ME.drop);
 g.save();g.globalCompositeOperation='screen';glow(px,py,90+260*k,'255,206,110',0.55*k,0.3);glow(px,py,60,'255,240,190',0.6*k,0.45);g.restore();
 B_drop(px,py,22*1.12,1);if(k>0){g.save();g.globalAlpha=0.7*k;const gr=g.createRadialGradient(px-4,py+6,2,px,py,26);gr.addColorStop(0,'#FFF3BF');gr.addColorStop(1,'rgba(240,166,38,0.15)');drop(px,py,22*1.12*0.9,gr);g.restore()}
 const r=RNG(5);for(let i=0;i<12;i++){const a=r()*6.28,d=40+r()*200*k,s=5+r()*7;C_sparkle(px+Math.cos(a)*d,py+Math.sin(a)*d*0.6,s,cl(k*2-r())*(0.5+0.5*Math.sin(t*5+i)),{col:'255,214,120',edge:'rgba(140,90,10,0.45)'})}
 grain(t,0.04)};

// ---- a4 underground sequence: one cross-section (ground at 420), a young plant above, its roots below ----
const CE_A4GY=420;
function CE_a4base(t,o){const GY=CE_A4GY;Wbg(t,0.95,{moon:false,ly:250,la:0.18,hills:false});Wground(t,GY);
 if(o.dry>0.01){CE_soilTone(GY,'rgb(244,214,160)',0.55*o.dry,'soft-light');CE_soilTone(GY,'rgb(226,188,136)',0.2*o.dry,'screen')}
 if(o.wet>0.01)CE_wet(t,GY,o.wet,o.front)}
// a4_pain (115.94-117.68): "that Mother Earth actually took a lot of" — dry, dusty soil; thirsty roots tremble; the plant droops
S.a4_pain=(t,c)=>{const GY=CE_A4GY,G=CE_GA();CE_a4base(t,{dry:1});
 g.save();g.translate(Math.sin(t*38)*1.3,0);CE_roots(360,GY+14,G,290,1,{t,col:'#C49464',tk:0.4});g.restore();
 CE_plant(360,GY+4,1.05,{t,droop:0.5+0.2*eo(cl(c.k/1.6)),dry:0.55,shake:1});
 const r=RNG(3);for(let i=0;i<10;i++){const x=r()*720,y=GY-20-((t*14+r()*200)%200);glow(x,y,3+r()*3,'255,236,190',0.35,0.5)}
 grain(t,0.04)};
// a4_pain2 (117.68-118.89): on "pain" the soil cracks open; the cracks glow faintly
S.a4_pain2=(t,c)=>{const GY=CE_A4GY,G=CE_GA(),tp=WT('pain',117.4),p=eo(cl((t-tp+0.04)/0.42));CE_a4base(t,{dry:1});
 CE_cracks(t,GY,p,p);
 g.save();g.translate(Math.sin(t*44)*2*(1-0.5*cl(c.k)),0);CE_roots(360,GY+14,G,290,1,{t,col:'#C49464',tk:0.4});g.restore();
 CE_plant(360,GY+4,1.05,{t,droop:0.72+0.1*p,dry:0.72,shake:1.4});grain(t,0.04)};
// a4_return (118.89-120.28): "So when it gets back to Mother Earth" — rain soaks in; a wet front sinks down to the roots
S.a4_return=(t,c)=>{const GY=CE_A4GY,G=CE_GA(),k=eo(cl(c.k/1.25));CE_a4base(t,{dry:1-k,wet:k,front:GY+20+k*560});
 CE_cracks(t,GY,1,0.6*(1-k),1-0.85*k);
 CE_roots(360,GY+14,G,290,1,{t,col:k>0.5?'#B07440':'#BE8A58',tk:0.45});CE_rootLight(360,GY+14,G,290,cl((c.k-0.8)/1.2)*0.35,{t,col:'160,228,255',dir:-1,a:0.8});
 B_rain(t,80,53,900,80,0.5,0);for(let i=0;i<7;i++){const x=50+i*104+hash(i*7.3)*40,t0=c.t0+((i*0.37)%1.2);C_splash(x,GY+2,t,t0,0.32,{seed:i+5})}
 CE_plant(360,GY+4,1.05,{t,droop:lerp(0.82,0.32,k),dry:lerp(0.72,0.2,k)});grain(t,0.04)};
// a4_drink (120.28-121.25): "Mother Earth" — the roots drink: water climbs from the root tips up to the plant as light; it perks up and flowers
S.a4_drink=(t,c)=>{const GY=CE_A4GY,G=CE_GA(),k=eo(cl(c.k/0.85));CE_a4base(t,{wet:1});
 CE_roots(360,GY+14,G,290,1,{t});CE_rootLight(360,GY+14,G,290,0.3+0.7*k,{t,col:'150,228,255',dir:-1});
 const up=eo(cl((c.k-0.25)/0.6));const [bx,by]=CE_plant(360,GY+4,1.05,{t,droop:0.3*(1-up),dry:0.2*(1-up),bloom:cl((c.k-0.5)/0.45)});
 if(up>0&&up<1){g.save();g.globalCompositeOperation='screen';glow(360+(bx-360)*up,lerp(GY,by,up),26,'190,240,255',0.8,0.4);g.restore()}
 if(c.k>0.55)for(let i=0;i<6;i++){const a=i*1.05+t*0.8,d=34+8*Math.sin(t*2+i);CE_spk(bx+Math.cos(a)*d,by-6+Math.sin(a)*d*0.7,5+3*hash(i),cl((c.k-0.55)*4)*(0.5+0.5*Math.sin(t*5+i*2)),'255,236,170')}
 grain(t,0.04)};

// a4_card_l7 (121.25-123.84): card unchanged; under it five glossy seeds pulse on "serves" and sprout green on "nature"
const CE_SEEDS=[[150,960,0.3],[260,1000,-0.4],[360,950,0.1],[470,1010,0.6],[580,965,-0.2]];
S.a4_card_l7=(t,c)=>Wcard(t,c,{lines:[6],cy:430,gloss:[['latent',121.56]],glossW:['latent'],under:(t)=>{Wground(t,880);const ts=WT('serves',121.3),tn=WT('nature',122.2),pu=Math.exp(-Math.pow((t-ts-0.3)/0.25,2));
 CE_SEEDS.forEach(([x,y,a],i)=>{const op=i===2?cl((t-tn)/0.7):0.8*cl((t-tn-0.16-Math.abs(i-2)*0.13)/0.8);if(pu>0.02)glow(x,y,46,'255,226,140',0.45*pu,0.4);CE_seed(x,y,1.3+0.15*pu,a,op,t,{h:i===2?100:72})})}});

// a4_shoots (126.79-127.93): "as rain," — green shoots unfold in the rain (low in the middle so the caption band stays calm)
S.a4_shoots=(t,c)=>{Wbg(t,0.85,{moon:false,ly:640,hills:false});Wground(t,920);B_rain(t,50,61,900,80,0.4,1.2);
 [[78,200],[166,250],[252,170],[360,58],[468,178],[556,240],[644,196]].forEach(([x,h],i)=>{const k=eo(cl(c.k/0.85-Math.abs(i-3)*0.06));CE_sprout(x,926,h*k,k,t,1.6)});
 for(let i=0;i<6;i++){const x=40+i*128+hash(i*3.1)*40,t0=c.t0+((i*0.29)%0.9);C_splash(x,922,t,t0,0.3,{seed:i+11})}
 grain(t,0.04)};

// ---- the ladder of success (overcast) ----
const CE_LADA={bx:[248,472],by:1096,tx:[324,396],ty:40,seg:9,n:13,rw:15,gw:10,top:0.55,seed:31};
const CE_LADB={bx:[288,432],by:646,tx:[322,398],ty:-280,seg:9,n:11,rw:14,gw:9.5,top:0.62,seed:37};
const CE_LADC={bx:[296,424],by:352,tx:[328,392],ty:-420,seg:8,n:9,rw:14,gw:9.5,top:0.65,seed:43};
const CE_GL=()=>CE_rootGeo('LAD',{seed:41,sub:4});
// a5_ladder (151.38-152.56): cut on "ladder" — rain streaks fly together and freeze into the golden rails and rungs
S.a5_ladder=(t,c)=>{const tl=WT('ladder',151.2),k=cl((t-tl)/0.6);Wbg(t,0.9,{moon:false,la:0.1});
 B_rain(t,Math.round(70*(1-0.7*k)),71,900,80,0.5,0);
 const gk=eo(cl((t-tl-0.45)/0.4));g.save();g.globalCompositeOperation='screen';glow(360,600,440,'255,214,150',0.22*gk,0.3);g.restore();
 CE_ladder(t,CE_LADA,{t0:tl,glow:gk});
 if(gk>0)for(let i=0;i<6;i++){const u=(i+0.5)/6,sd=i%2,x=lerp(CE_LADA.bx[sd],CE_LADA.tx[sd],u),y=lerp(CE_LADA.by,CE_LADA.ty,u);CE_spk(x+(sd?14:-14),y,6+3*hash(i),gk*(0.5+0.5*Math.sin(t*5+i*2)),'255,226,150')}
 grain(t,0.04)};
// a5_roots (152.56-153.58, split): beneath the ladder the roots that hold it; they begin to glow just before "influences"
S.a5_roots=(t,c)=>{const GY=640,G=CE_GL(),ti=WT('influences',153.3);Wbg(t,0.9,{moon:false,hills:false,ly:520});Wground(t,GY);
 CE_roots(360,GY+14,G,240,1,{t});CE_rootLight(360,GY+14,G,240,cl((t-ti+0.4)/0.9)*0.5,{t,col:'255,214,130'});
 CE_ladder(t,CE_LADB,{glow:0.6});grain(t,0.04)};
// a5_roots_full (153.58-155.35): cut on "influences" — the whole root system lights up gold and the light climbs the ladder
S.a5_roots_full=(t,c)=>{const GY=340,G=CE_GL();Wbg(t,0.9,{moon:false,hills:false,ly:300});Wground(t,GY);
 CE_roots(360,GY+14,G,380,1,{t});CE_rootLight(360,GY+14,G,380,0.3+0.7*eo(cl(c.k/1.2)),{t,col:'255,214,130'});
 CE_ladder(t,CE_LADC,{glow:1,climb:cl((c.k-0.3)/1.3)});grain(t,0.04)};
// a5_journey (155.35-156.72): "during the journey" — a glowing road winding up a green hill; footprints glow behind a walker
const CE_road=u=>{const q=1-u;return [430-70*q+Math.sin(u*7.2+0.3)*150*Math.pow(q,0.9),480+820*Math.pow(q,1.5),14+256*Math.pow(q,1.6)]};
S.a5_journey=(t,c)=>{Wbg(t,0.9,{moon:false,hills:false,ly:430,la:0.16});C_hills(t,560,{n:2,amp:60,seed:5,trees:6,treeS:24});
 const S2=CSKY(t),hill=new Path2D();hill.moveTo(-40,1300);hill.lineTo(-40,700);hill.bezierCurveTo(120,560,300,470,440,468);hill.bezierCurveTo(560,470,680,540,760,600);hill.lineTo(760,1300);hill.closePath();
 const hg=g.createLinearGradient(0,470,0,1280);hg.addColorStop(0,C_c(C_tint('#7CCB5A',t,0.6)));hg.addColorStop(1,C_c(C_tint('#2F8A3A',t,0.6)));g.fillStyle=hg;g.fill(hill);
 g.strokeStyle=C_c(C_mx(S2.lc,C_WH,0.5),0.4);g.lineWidth=2;g.stroke(hill);
 const rf=RNG(17),FC=['#C58BEA','#F49AC6','#FFE36A','#FFFFFF','#FF9E7A'];for(let i=0;i<26;i++){const y=560+Math.pow(rf(),0.8)*700,x=rf()*720,sz=4+(y-560)/700*9;C_flower(x,y,sz,{t,col:FC[i%5]})}
 C_miniTree(120,660,40,t,3);C_miniTree(640,640,34,t,4);C_miniTree(60,760,52,t,5);
 const L=[],R=[];for(let i=0;i<=48;i++){const u=i/48,[x,y,w]=CE_road(u);L.push([x-w/2,y]);R.push([x+w/2,y])}const road=new Path2D();L.forEach(([x,y],i)=>i?road.lineTo(x,y):road.moveTo(x,y));for(let i=R.length-1;i>=0;i--)road.lineTo(R[i][0],R[i][1]);road.closePath();
 g.save();g.globalCompositeOperation='screen';g.strokeStyle='rgba(255,214,140,0.35)';g.lineWidth=18;g.stroke(road);g.restore();
 const rg=g.createLinearGradient(0,1280,0,470);rg.addColorStop(0,'#FFEDBE');rg.addColorStop(1,'#FFD36E');g.fillStyle=rg;g.fill(road);g.strokeStyle='rgba(150,96,30,0.55)';g.lineWidth=2;g.stroke(road);

 const uw=0.55+0.06*cl(c.k/1.37),[wx,wy,ww]=CE_road(uw);
 for(let j=1;j<=10;j++){const u=uw-0.034*j;if(u<0.02)break;const [x,y,w]=CE_road(u),sd=j%2?1:-1,s=w/90,a=cl(1-j/11)*cl((c.k+1-j*0.06)*2);g.save();g.globalCompositeOperation='screen';glow(x+sd*w*0.07,y,16*s,'255,210,120',0.6*a,0.4);g.restore();
  g.fillStyle=`rgba(255,250,225,${0.9*a})`;g.beginPath();g.ellipse(x+sd*w*0.07,y,5*s,8*s*0.5,0,0,7);g.fill()}
 CE_walker(wx,wy,ww/90,t);B_rain(t,36,77,900,70,0.35,1.2);grain(t,0.04)};

// a5_rootsglow (187.43-188.66): "So many influences were there during" — from where the drop landed, roots spread and light underground
const CE_GR=()=>CE_rootGeo('RG',{seed:61,sub:4});
S.a5_rootsglow=(t,c)=>{const GY=520,G=CE_GR(),k=eo(cl(c.k/1.1));Wbg(t,1,{moon:false,hills:false,ly:430,la:0.12});Wground(t,GY);
 C_ripples(360,GY+2,t,c.t0-0.2,{n:3,sc:0.9,flat:0.22,light:'220,240,255'});
 CE_roots(360,GY+14,G,330,0.4+0.6*k,{t});CE_rootLight(360,GY+14,G,330,k,{t,col:'170,228,255'});
 glow(360,GY+12,64,'200,240,255',0.55*(1-0.5*k),0.4);grain(t,0.04)};
// a5_rootsx (188.66-189.72, split): "our formative years" — the root network keeps spreading under the dark ground
S.a5_rootsx=(t,c)=>{const GY=300,G=CE_GR();Wbg(t,1,{moon:false,hills:false,ly:240});Wground(t,GY);CE_soilTone(GY,'rgb(70,60,110)',0.35,'multiply');
 CE_roots(360,GY+14,G,390,0.85+0.15*eo(cl(c.k/1)),{t});CE_rootLight(360,GY+14,G,390,1,{t,col:'170,228,255'});grain(t,0.04)};

// ---- the constellation becomes the tree ----
// upper sky kept blue (over the pre-dawn clock)
function CE_blueTop(a=1){g.save();const gr=g.createLinearGradient(0,-60,0,820);gr.addColorStop(0,`rgba(16,34,98,${0.85*a})`);gr.addColorStop(0.6,`rgba(30,62,140,${0.45*a})`);gr.addColorStop(1,'rgba(40,70,140,0)');g.fillStyle=gr;g.fillRect(-W,-H,3*W,H+820);g.restore()}
// the icon ground: deep green with a thin glowing white horizon line (the tree.png look)
function CE_iconGround(y,a=1){if(a<=0.01)return;g.save();g.globalAlpha*=a;const P=new Path2D();P.moveTo(-W,y+14);P.quadraticCurveTo(360,y-12,2*W,y+14);P.lineTo(2*W,3*H);P.lineTo(-W,3*H);P.closePath();
 const gr=g.createLinearGradient(0,y,0,H);gr.addColorStop(0,'#0F5A34');gr.addColorStop(1,'#05301C');g.fillStyle=gr;g.fill(P);
 g.strokeStyle='rgba(235,255,240,0.9)';g.lineWidth=2.4;g.beginPath();g.moveTo(-40,y+11);g.quadraticCurveTo(360,y-12,760,y+11);g.stroke();
 g.globalCompositeOperation='screen';g.strokeStyle='rgba(160,255,200,0.25)';g.lineWidth=10;g.stroke();g.restore()}
function CE_bigStars(t,a){if(a<=0.01)return;W_STARS.forEach(([x,y],i)=>{glow(x,y,34,'8,16,48',0.45*a,0.5);C_sparkle(x,y,13+2*Math.sin(t*3+i),a,{col:'255,248,214'})})}
// a5_constellation (197.65-198.86): on "Everybody" the constellation completes and a white tree grows up into it: its limbs
// end on the five stars, white roots light under the ground line
S.a5_constellation=(t,c)=>{const te=WT('everybody',197.4),k=cl((t-te)/0.5),p=eo(cl((t-te-0.1)/0.95)),GY=1000;
 Wbg(t,1,{moon:false,hills:false,clouds:false,la:0.05});CE_blueTop(1);stars(t,120,23,0,0,W,820,0.85);
 CE_iconGround(GY,1);
 g.save();g.strokeStyle=`rgba(255,250,225,${0.75*(1-0.6*p)})`;g.lineWidth=1.8;g.setLineDash([]);g.beginPath();W_STARS.forEach(([x,y],i)=>{if(i>0&&k<i/5)return;i?g.lineTo(x,y):g.moveTo(x,y)});g.stroke();g.restore();
 const Gi=CE_GTI();CE_roots(360,GY+4,Gi,250,p,{icon:'rgba(235,252,255,0.92)'});CE_rootLight(360,GY+4,Gi,250,p,{t,col:'170,240,255',a:0.55,dir:1});
 g.save();g.translate(360,GY);CE_treeDraw(t,0,p);g.restore();
 CE_bigStars(t,1);grain(t,0.04)};
// a5_branches (198.86-200.98): "contributed in our" — the white lines thicken into a brown trunk and limbs, each star blooms
// into a puffy green crown cluster, the colourful ground and brown roots open out from the trunk, gold lights stay in the crown
S.a5_branches=(t,c)=>{const GY=1000,m=eo(cl(c.k/1.1)),rv=eo(cl((c.k-0.1)/1.0));
 Wbg(t,1,{moon:false,hills:false,clouds:false,la:0.08});CE_blueTop(1-0.35*m);stars(t,120,23,0,0,W,820,0.85*(1-0.5*m));
 CE_iconGround(GY,1);const hw=20+460*rv;
 g.save();g.beginPath();g.rect(360-hw,GY-60,hw*2,H);g.clip();Wground(t,GY);CE_roots(360,GY+14,CE_GT(),250,1,{t});CE_rootLight(360,GY+14,CE_GT(),250,0.4+0.6*rv,{t,col:'170,232,255'});g.restore();
 if(rv<1)CE_roots(360,GY+4,CE_GTI(),250,1,{icon:`rgba(235,252,255,${0.9*(1-rv)})`});
 const sc=C=>{const u=C.i>=0?c.k-0.08-C.i*0.07:c.k-0.42-C.j*0.035;return u<=0?0:spr(u,10,0.55)};
 g.save();g.translate(360,GY);CE_treeDraw(t,m,1,{sc});g.restore();
 CE_bigStars(t,1-m);CE_glints(t,360,GY,1,cl((c.k-0.5)*2));grain(t,0.04)};
// a5_path (200.98-202.08): "path of success" — a path of light runs from us past the tree toward the glowing horizon
const CE_path=u=>{const q=1-u;return [450-60*q+Math.sin(u*6+0.6)*120*Math.pow(q,1.1),904+396*Math.pow(q,1.7),8+300*Math.pow(q,1.8)]};
S.a5_path=(t,c)=>{Wbg(t,1,{moon:false,hills:false,clouds:true,ly:900,lx:460,lr:520,la:0.32});
 g.save();g.globalCompositeOperation='screen';glow(460,900,300,'255,206,150',0.45,0.3);glow(460,900,90,'255,240,200',0.6,0.4);g.restore();
 C_hills(t,1000,{n:3,amp:46,gap:22,seed:9,trees:5,treeS:20,flowers:22});
 const L=[],R=[];for(let i=0;i<=40;i++){const [x,y,w]=CE_path(i/40);L.push([x-w/2,y]);R.push([x+w/2,y])}const P=new Path2D();L.forEach(([x,y],i)=>i?P.lineTo(x,y):P.moveTo(x,y));for(let i=R.length-1;i>=0;i--)P.lineTo(R[i][0],R[i][1]);P.closePath();
 g.save();g.globalCompositeOperation='screen';g.strokeStyle='rgba(255,210,140,0.4)';g.lineWidth=16;g.stroke(P);g.restore();
 const pg=g.createLinearGradient(0,1280,0,900);pg.addColorStop(0,'#FFE6A6');pg.addColorStop(1,'#FFF6DA');g.fillStyle=pg;g.fill(P);
 g.save();g.globalCompositeOperation='screen';g.strokeStyle='rgba(255,255,255,0.9)';g.lineCap='round';g.setLineDash([4,22]);g.lineDashOffset=-t*90;g.lineWidth=3;g.beginPath();for(let i=0;i<=40;i++){const [x,y]=CE_path(i/40);i?g.lineTo(x,y):g.moveTo(x,y)}g.stroke();g.restore();
 const s=0.62+0.02*eo(cl(c.k/1.1));CE_tree(t,236,1040,s);CE_glints(t,236,1040,s,1);grain(t,0.04)};
// a5_grow (202.08-203.54): "And when we grow up" — the tree grows tall over its lit roots
S.a5_grow=(t,c)=>{const GY=1030,k=eo(cl(c.k/1.3));Wbg(t,1,{moon:false,hills:false,ly:860,la:0.24});
 g.save();g.globalCompositeOperation='screen';glow(360,1000,380,'255,200,170',0.3,0.3);g.restore();Wground(t,GY);
 CE_roots(360,GY+14,CE_GT(),210,1,{t});CE_rootLight(360,GY+14,CE_GT(),210,1,{t,col:'170,232,255'});
 const s=lerp(0.5,0.8,k),sy=1+0.08*Math.sin(Math.PI*cl(c.k/1.3));CE_tree(t,360,GY+4,s,{sy});CE_glints(t,360,GY+4,s,1);
 for(let i=0;i<8;i++){const u=((c.k*0.6+i/8)%1),x=360+Math.sin(i*2.3+u*4)*200*s,y=GY-80-u*700*s;CE_spk(x,y,5+3*hash(i),Math.sin(u*Math.PI)*0.9,'255,232,170')}
 grain(t,0.04)};
// a5_tree (204.88-206.04, split): "successful in life" — the grown tree with its lit roots beneath; a warm horizon glow, no sun yet
S.a5_tree=(t,c)=>{const GY=730;Wbg(t,1,{moon:false,sun:false,hills:false,ly:640,lr:460,la:0.3});
 g.save();g.globalCompositeOperation='screen';glow(360,680,330,'255,196,150',0.4,0.3);g.restore();C_hills(t,730,{n:2,amp:30,gap:16,seed:13,trees:0,flowers:0});Wground(t,GY);
 CE_roots(360,GY+14,CE_GT(),150,1,{t});CE_rootLight(360,GY+14,CE_GT(),150,1,{t,col:'170,232,255'});
 const s=0.535+0.01*c.k;CE_tree(t,360,GY+4,s);CE_glints(t,360,GY+4,s,1);grain(t,0.04)};

// ---- lead override 2026-10-09 (owner: "i do not like the roots, use the reference images for roots") ----
// every root in this file is drawn with the shared C_roots (tree_root_1/2 look: thick warm brown, wide, curled tips, drooping
// branches); light/water = glowing core inside the brown root. Each geometry G keeps its own stable seed.
const CE_RSEED=new WeakMap(),CE_RLAST=new WeakMap();let CE_RSN=1;
const CE_rseedOf=G=>{if(!CE_RSEED.has(G)){const q=G[0]&&G[0].pts[G[0].pts.length-1]||[0,0];CE_RSEED.set(G,1+Math.abs(Math.round(q[0]*7919+q[1]*104729+G.length*31))%9973)}return CE_RSEED.get(G)};
CE_roots=function(x,y,G,R,p,o={}){if(p<=0)return;CE_RLAST.set(G,p);let a=o.a??1;if(o.icon){const m=/,\s*([\d.]+)\)\s*$/.exec(o.icon);a*=m?+m[1]:1}
 C_roots(x,y,R/300,p,{t:o.t,seed:CE_rseedOf(G),a,col:o.icon?undefined:o.col})};
CE_rootLight=function(x,y,G,R,lit,o={}){if(lit<=0)return;C_roots(x,y,R/300,CE_RLAST.get(G)??1,{t:o.t,seed:CE_rseedOf(G),a:o.a??1,col:undefined,lit:cl(lit),litCol:o.col||'150,226,255'})};

}
