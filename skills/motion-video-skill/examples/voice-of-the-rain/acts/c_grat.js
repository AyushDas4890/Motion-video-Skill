// acts/c_grat.js — GRATITUDE & PEOPLE (colour world). Owner 2026-10-08: "make the world colourful just like the images".
// ORIGINAL friendly caricatures (inspired by the brief's reference pictures, never traced or copied):
//  - a girl with closed eyes hugging herself among big leaves and purple flowers (a1_gratitude vignette, a4_existence)
//  - a mosaic of family portraits: mother in a sari, father with glasses, teacher, friend in a cricket cap, grandparents...
//  - people receiving the rain: a farmer in a dhoti, face lifted; a child with a paper boat; a woman with a clay pot
//  - warm illustrated hands passing a gold spark and giving it back
//  - a penguin in a blue hat holding an orange THANK YOU! sign under the golden sunrise
// Static art is drawn ONCE into cached canvases with t-independent inputs (t:0, tint:false), then animated with transforms,
// so renderFrame stays pure (RNG / hash / vnoise only). Uses the shared colour world in acts/color.js (CSKY, Wbg, Wsea, C_*).
'use strict';

// ---------------------------------------------------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------------------------------------------------
const CG_C={};
let CG_EW=0.8;      // global outline weight (soft, not clip-art)
// cache art drawn in LOCAL coords inside the box [x0,x0+w]x[y0,y0+h] at `res` px per logical unit
function CG_cache(key,x0,y0,w,h,res,fn){if(CG_C[key])return CG_C[key];const c=document.createElement('canvas');c.width=Math.ceil(w*res);c.height=Math.ceil(h*res);
 const x=c.getContext('2d'),pg=g;g=x;try{x.setTransform(res,0,0,res,-x0*res,-y0*res);x.lineCap='round';x.lineJoin='round';fn(x)}finally{g=pg}return CG_C[key]={c,x0,y0,w,h}}
function CG_blit(o,x,y,s=1,rot=0,a=1){if(a<=0.003)return;g.save();g.globalAlpha*=a;g.translate(x,y);if(rot)g.rotate(rot);g.scale(s,s);g.drawImage(o.c,o.x0,o.y0,o.w,o.h);g.restore()}
const CG_dk=(c,k)=>C_c(C_mx(c,C_BK,k)),CG_lt=(c,k)=>C_c(C_mx(c,C_WH,k));
// flat fill + soft shadow crescent on the side away from the light (top-left) + thin darker same-hue edge
function CG_fill(P,base,o={}){const d=o.d??5;g.save();g.fillStyle=o.sh||CG_dk(base,0.16);g.fill(P);g.clip(P);g.translate(-d,-d*(o.dy??1));g.fillStyle=C_c(base);g.fill(P);g.restore();
 if(o.hl){g.save();g.clip(P);g.fillStyle=`rgba(255,255,255,${o.hl[4]??0.28})`;g.beginPath();g.ellipse(o.hl[0],o.hl[1],o.hl[2],o.hl[3],-0.5,0,7);g.fill();g.restore()}
 if(o.edge!==false){g.strokeStyle=o.edge||CG_dk(base,0.3);g.lineWidth=(o.lw||2.2)*CG_EW;g.stroke(P)}}
// a chunky tube (arm, leg, finger): edge, shadow, lit core shifted toward the light
function CG_tube(P,w,base,o={}){g.save();g.lineCap=o.cap||'round';g.lineJoin='round';g.strokeStyle=o.edge||CG_dk(base,0.3);g.lineWidth=w+(o.lw||2.2)*2*CG_EW;g.stroke(P);
 g.strokeStyle=o.sh||CG_dk(base,0.16);g.lineWidth=w;g.stroke(P);g.translate(-(o.d??2.5),-(o.d??2.5));g.strokeStyle=C_c(base);g.lineWidth=Math.max(1,w-(o.core??7));g.stroke(P);g.restore()}
const CG_P=(fn)=>{const P=new Path2D();fn(P);return P};
const CG_quad=(x0,y0,cx,cy,x1,y1)=>CG_P(P=>{P.moveTo(x0,y0);P.quadraticCurveTo(cx,cy,x1,y1)});
const CG_qpt=(x0,y0,cx,cy,x1,y1,u)=>[(1-u)*(1-u)*x0+2*u*(1-u)*cx+u*u*x1,(1-u)*(1-u)*y0+2*u*(1-u)*cy+u*u*y1];
// a rounded face (slightly pointed chin) centred at (cx,cy)
const CG_face=(cx,cy,rx,ry,chin=1)=>CG_P(P=>{P.moveTo(cx,cy-ry);P.bezierCurveTo(cx+rx*0.62,cy-ry,cx+rx,cy-ry*0.55,cx+rx,cy);P.bezierCurveTo(cx+rx,cy+ry*0.55,cx+rx*0.6*chin,cy+ry,cx,cy+ry*1.04);
 P.bezierCurveTo(cx-rx*0.6*chin,cy+ry,cx-rx,cy+ry*0.55,cx-rx,cy);P.bezierCurveTo(cx-rx,cy-ry*0.55,cx-rx*0.62,cy-ry,cx,cy-ry)});
const CG_line=(col,w)=>{g.strokeStyle=col;g.lineWidth=w;g.lineCap='round';g.lineJoin='round'};
// eyes: 'open' (glossy dark ovals) | 'happy' (closed, smiling arcs) | 'calm' (closed, relaxed lids with lashes)
function CG_eyes(cx,y,dx,kind,s=1,col='#2A1A12'){for(const sg of [-1,1]){const x=cx+sg*dx;
 if(kind==='open'){g.fillStyle=col;g.beginPath();g.ellipse(x,y,6.2*s,8*s,0,0,7);g.fill();g.fillStyle='#FFFFFF';g.beginPath();g.arc(x-2*s,y-3*s,2.3*s,0,7);g.fill();g.beginPath();g.arc(x+2*s,y+2.6*s,1.1*s,0,7);g.fill()}
 else if(kind==='happy'){CG_line(col,3.4*s);g.beginPath();g.moveTo(x-9*s,y+3*s);g.quadraticCurveTo(x,y-8*s,x+9*s,y+3*s);g.stroke()}
 else{CG_line(col,3.6*s);g.beginPath();g.moveTo(x-11*s,y-1*s);g.quadraticCurveTo(x,y+8*s,x+11*s,y-1*s);g.stroke();g.lineWidth=2.2*s;g.beginPath();g.moveTo(x+sg*9*s,y+1*s);g.lineTo(x+sg*14*s,y+5*s);g.moveTo(x+sg*4*s,y+4*s);g.lineTo(x+sg*7*s,y+9*s);g.stroke()}}}
function CG_brows(cx,y,dx,col,s=1,lift=0){CG_line(col,3.2*s);for(const sg of [-1,1]){const x=cx+sg*dx;g.beginPath();g.moveTo(x-sg*10*s,y+2*s);g.quadraticCurveTo(x,y-5*s-lift,x+sg*11*s,y+1*s);g.stroke()}}
function CG_blush(cx,y,dx,s=1,a=0.42){g.fillStyle=`rgba(255,112,112,${a})`;for(const sg of [-1,1]){g.beginPath();g.ellipse(cx+sg*dx,y,11*s,6.5*s,0,0,7);g.fill()}}
function CG_mouth(cx,y,kind,s=1,lip='#B4473C'){if(kind==='teeth'||kind==='gap'||kind==='open'){const P=CG_P(P=>{P.moveTo(cx-14*s,y-2*s);P.quadraticCurveTo(cx,y-5*s,cx+14*s,y-2*s);P.quadraticCurveTo(cx+12*s,y+15*s,cx,y+16*s);P.quadraticCurveTo(cx-12*s,y+15*s,cx-14*s,y-2*s)});
  g.fillStyle='#7A2328';g.fill(P);g.save();g.clip(P);if(kind!=='open'){g.fillStyle='#FFFFFF';g.fillRect(cx-15*s,y-6*s,30*s,9*s);if(kind==='gap'){g.fillStyle='#7A2328';g.fillRect(cx-1.6*s,y-6*s,3.2*s,9*s)}}g.fillStyle='#F07A86';g.beginPath();g.ellipse(cx,y+14*s,8*s,5*s,0,0,7);g.fill();g.restore();CG_line('#5E1A1E',1.8*s);g.stroke(P)}
 else{CG_line(lip,3.4*s);g.beginPath();g.moveTo(cx-12*s,y);g.quadraticCurveTo(cx,y+(kind==='big'?12:8)*s,cx+12*s,y);g.stroke()}}
function CG_nose(cx,y,col,s=1){CG_line(col,2.6*s);g.beginPath();g.moveTo(cx+1*s,y-7*s);g.quadraticCurveTo(cx+7*s,y+3*s,cx-1*s,y+5*s);g.stroke()}

// ---------------------------------------------------------------------------------------------------------------------
// THE GRATITUDE GIRL — eyes closed, hugging herself, a long side braid with a purple flower clip, saffron kurta with a teal
// neckline. Local origin = chest centre; head centre at (0,-150). Cached once.
// ---------------------------------------------------------------------------------------------------------------------
const CG_GIRLC={sk:'#F2BC90',skS:'#DC9A6C',skE:'#A65F3C',hair:'#3C2619',hairH:'#7A5038',hairE:'#20130B',ku:'#FFC83C',kuS:'#F09C1C',kuE:'#B0650A',tr:'#13A398'};
function CG_girlArt(){const C=CG_GIRLC;
 const head=fn=>{g.save();g.translate(0,-150);g.rotate(-0.09);fn();g.restore()};
 // back hair (behind everything)
 head(()=>{CG_fill(CG_P(P=>{P.ellipse(0,-14,95,93,0,0,7);P.rect(-90,-14,180,96)}),C.hair,{edge:C.hairE,d:6})});
 // neck in the shadow of the chin
 CG_fill(CG_P(P=>{P.moveTo(-25,-100);P.lineTo(25,-100);P.lineTo(27,-36);P.lineTo(-27,-36);P.closePath()}),C.skS,{edge:C.skE,d:3});
 // torso (kurta)
 const torso=CG_P(P=>{P.moveTo(-32,-58);P.bezierCurveTo(-72,-58,-122,-50,-142,-18);P.bezierCurveTo(-162,34,-154,200,-156,340);P.lineTo(156,340);P.bezierCurveTo(154,200,162,34,142,-18);P.bezierCurveTo(122,-50,72,-58,32,-58);P.quadraticCurveTo(0,-22,-32,-58);P.closePath()});
 CG_fill(torso,C.ku,{edge:C.kuE,d:12,hl:[-70,40,40,90,0.18]});
 g.save();g.clip(torso);CG_line(CG_dk(C.ku,0.2),2.4);for(const [x0,y0,x1,y1] of [[-60,200,-40,330],[30,220,46,330],[100,180,110,320]]){g.beginPath();g.moveTo(x0,y0);g.quadraticCurveTo(x0+12,(y0+y1)/2,x1,y1);g.stroke()}g.restore();
 // neckline trim (teal with white dots)
 const nl=CG_quad(-34,-58,0,-14,34,-58);CG_line(CG_dk(C.tr,0.35),11);g.stroke(nl);CG_line(C.tr,8);g.stroke(nl);g.fillStyle='#FFFFFF';for(let i=1;i<8;i++){const [x,y]=CG_qpt(-34,-58,0,-14,34,-58,i/8);g.beginPath();g.arc(x,y+1,1.7,0,7);g.fill()}
 // upper arms (sleeves) hanging at the sides
 for(const sg of [-1,1])CG_tube(CG_quad(sg*130,-12,sg*156,70,sg*132,152),62,C.ku,{edge:C.kuE,sh:C.kuS,core:16,d:4});
 // the braid falls over her right shoulder (viewer left)
 const bp=[-86,-118,-128,-40,-110,96];
 for(let i=0;i<10;i++){const u=i/9,[x,y]=CG_qpt(...bp,u),s=1-u*0.35;g.save();g.translate(x,y);g.rotate(i%2?0.55:-0.55);CG_fill(CG_P(P=>P.ellipse(0,0,22*s,15*s,0,0,7)),C.hair,{edge:C.hairE,d:3,lw:1.8,hl:[-6,-5,9*s,4*s,0.25]});g.restore()}
 {const [x,y]=CG_qpt(...bp,1);CG_fill(CG_P(P=>{P.moveTo(x-10,y+6);P.quadraticCurveTo(x-16,y+40,x-4,y+52);P.quadraticCurveTo(x+4,y+36,x+12,y+50);P.quadraticCurveTo(x+16,y+24,x+10,y+6);P.closePath()}),C.hair,{edge:C.hairE,d:2});
  CG_fill(CG_P(P=>P.roundRect(x-15,y-2,30,12,5)),'#9B5BD6',{edge:'#5A2A8C',d:2})}
 // the self-hug: two forearms cross the chest, each hand rests on the opposite shoulder with the fingers draped over it
 const fore=(ex,ey,cx,cy,hx,hy)=>{CG_tube(CG_quad(ex,ey,cx,cy,hx,hy),54,C.ku,{edge:C.kuE,sh:C.kuS,core:16,d:4});
  const [ax,ay]=CG_qpt(ex,ey,cx,cy,hx,hy,0.74),[bx,by]=CG_qpt(ex,ey,cx,cy,hx,hy,0.82);g.lineCap='butt';CG_line(CG_dk(C.tr,0.3),57);g.lineCap='butt';g.beginPath();g.moveTo(ax,ay);g.lineTo(bx,by);g.stroke();CG_line(C.tr,52);g.lineCap='butt';g.beginPath();g.moveTo(ax,ay);g.lineTo(bx,by);g.stroke();
  g.fillStyle='#FFFFFF';for(let i=0;i<5;i++){const [px,py]=CG_qpt(ex,ey,cx,cy,hx,hy,0.78),a=Math.atan2(hy-cy,hx-cx)+Math.PI/2,o=(i-2)*9;g.beginPath();g.arc(px+Math.cos(a)*o,py+Math.sin(a)*o,1.8,0,7);g.fill()}};
 const hand=(hx,hy,sg,ang)=>{g.save();g.translate(hx,hy);
  // four fingers lie over the shoulder top and curl down its outer side
  for(let i=3;i>=0;i--){const y0=-16+i*9,L=[30,35,33,25][i];CG_tube(CG_P(P=>{P.moveTo(sg*6,y0);P.quadraticCurveTo(sg*(10+L*0.75),y0-3+i*1.5,sg*(12+L),y0+12+i*2)}),12.5,C.sk,{edge:C.skE,sh:C.skS,core:5,d:1,lw:1.4})}
  // back of the hand, along the forearm
  g.rotate(ang);CG_fill(CG_P(P=>P.ellipse(-4,0,26,19,0,0,7)),C.sk,{edge:C.skE,sh:C.skS,d:3,lw:1.6,hl:[-10,-6,10,5,0.25]});
  CG_line(C_c(C_mx(C.skE,C.sk,0.4),0.6),1.4);for(let i=0;i<3;i++){g.beginPath();g.arc(14,-9+i*8.5,3.4,-1.2,1.2);g.stroke()}
  g.restore()};
 fore(132,150,62,112,-88,-26);hand(-88,-26,-1,Math.atan2(-26-112,-88-62));        // her left arm, underneath
 fore(-132,150,-60,120,90,-30);hand(90,-30,1,Math.atan2(-30-120,90+60));           // her right arm, on top
 // head
 head(()=>{
  for(const sg of [-1,1]){CG_fill(CG_P(P=>P.ellipse(sg*79,6,13,18,0,0,7)),C.sk,{edge:C.skE,sh:C.skS,d:2});CG_line(C.skE,1.6);g.beginPath();g.arc(sg*80,6,6,sg>0?-1.2:1.9,sg>0?1.2:4.4);g.stroke()}
  const face=CG_face(0,4,79,82);CG_fill(face,C.sk,{edge:C.skE,sh:C.skS,d:9,hl:[-38,-36,22,13,0.22]});
  CG_eyes(0,8,31,'calm',1.05,'#3A2216');CG_brows(0,-20,31,C.hair,1.05);CG_nose(3,30,CG_dk(C.sk,0.32));CG_blush(0,36,48,1.25,0.45);CG_mouth(0,52,'smile',1.1,'#B9473B');
  // fringe swept to one side + crown highlight
  const fr=CG_P(P=>{P.moveTo(-92,22);P.bezierCurveTo(-104,-66,-48,-112,6,-110);P.bezierCurveTo(62,-110,104,-74,92,18);P.quadraticCurveTo(84,-26,58,-40);P.quadraticCurveTo(42,-22,20,-50);P.quadraticCurveTo(-8,-30,-30,-54);P.quadraticCurveTo(-58,-30,-76,-30);P.quadraticCurveTo(-88,-10,-92,22);P.closePath()});
  CG_fill(fr,C.hair,{edge:C.hairE,d:5});CG_line(C.hairH,3);for(const [x0,y0,x1,y1,cx,cy] of [[-56,-88,-20,-60,-44,-70],[-10,-100,30,-62,10,-90],[40,-96,70,-50,60,-80]]){g.globalAlpha=0.55;g.beginPath();g.moveTo(x0,y0);g.quadraticCurveTo(cx,cy,x1,y1);g.stroke();g.globalAlpha=1}
  C_flower(-66,-66,17,{t:0,tint:false,col:'#B57BEA',petals:5});C_leaf(-56,-56,20,0.5,{t:0,tint:false,col:'#5CBF4E',col2:'#2F8A3A',w:0.35})});
}
const CG_GIRL=()=>CG_cache('girl',-215,-290,430,640,2.2,CG_girlArt);

// ---------------------------------------------------------------------------------------------------------------------
// PORTRAITS for the mosaic: twelve original busts on pastel cards (220 x 290 logical each)
// ---------------------------------------------------------------------------------------------------------------------
const CG_PS=[
 {bg:['#FFE9D2','#FFC39E'],sk:'#D49A6C',hair:'bun',hc:'#24160E',eyes:'open',mouth:'teeth',bindi:1,ear:1,cloth:'sari',cc:'#E2437F',bc:'#FFC83A'},          // mother in a sari
 {bg:['#DDEFFF','#A6D0FA'],sk:'#C2875C',hair:'side',hc:'#1E140D',eyes:'open',mouth:'smile',glasses:'rect',mous:'#1E140D',cloth:'shirt',cc:'#79AEEE'},     // father with glasses
 {bg:['#4C8F68','#2F6A4B'],sk:'#E2AE86',hair:'side',hc:'#2B2018',grey:1,eyes:'open',mouth:'smile',glasses:'round',cloth:'tie',cc:'#FFFFFF',tie:'#D9433A',board:1}, // teacher
 {bg:['#FFF4B8','#FFD45E'],sk:'#B67748',hair:'cap',hc:'#1A110B',eyes:'happy',mouth:'teeth',cloth:'jersey',cc:'#2F7BEA',cap:'#2A6FD6',trim:'#FF8A1F'},     // friend in a cricket cap
 {bg:['#DDF7E9','#A7E2C4'],sk:'#C68C62',hair:'bald',hc:'#F2F2F4',eyes:'happy',mouth:'smile',glasses:'round',mous:'#F4F4F6',cloth:'kurta',cc:'#FFF6E2',shawl:'#9A5B34',old:1}, // grandfather
 {bg:['#EEE0FF','#CBB3F6'],sk:'#DEA77C',hair:'pig',hc:'#1E140D',eyes:'open',mouth:'open',cloth:'pinafore',cc:'#FFFFFF',pin:'#3D6FD9',ribbon:'#F0405A',kid:1}, // child
 {bg:['#FFE3EE','#FFB6D0'],sk:'#CF966A',hair:'bun',hc:'#E9E9EE',eyes:'happy',mouth:'smile',glasses:'round',cloth:'sari',cc:'#FFFDF6',bc:'#2E78D8',old:1},  // grandmother
 {bg:['#FFDCCF','#FFAA90'],sk:'#C4875C',hair:'braid',hc:'#1E140D',eyes:'open',mouth:'smile',bindi:1,ear:1,cloth:'kurta2',cc:'#17A398',dup:'#FF77B4',jas:1}, // sister
 {bg:['#D4F4F1','#92DCD5'],sk:'#D09868',hair:'turban',hc:'#1A110B',tur:'#FF8A1F',eyes:'happy',mouth:'teeth',beard:1,cloth:'kurta',cc:'#FFFFFF'},           // neighbour uncle
 {bg:['#E2F1FF','#B6D8FF'],sk:'#B27350',hair:'bob',hc:'#2A1810',eyes:'open',mouth:'smile',ear:1,cloth:'coat',cc:'#FFFFFF',top:'#5BB6E8'},                  // doctor
 {bg:['#FFE8C8','#FFC27A'],sk:'#A4683F',hair:'spiky',hc:'#18100A',eyes:'open',mouth:'gap',cloth:'tee',cc:'#3DB35A',kid:1},                                 // little brother
 {bg:['#F1F8CC','#CDE784'],sk:'#965C36',hair:'wrap',hc:'#EDEDED',wrap:'#FFFFFF',check:'#E0473A',eyes:'happy',mouth:'smile',mous:'#F2F2F2',cloth:'vest',cc:'#FFFFFF',old:1}]; // farmer
function CG_portraitArt(i){const P=CG_PS[i],cx=110,cy=120,fw=P.kid?50:54,fh=P.kid?56:60,r=RNG(i*37+11);
 // card background: pastel gradient, sun-dapple circles
 const bg=g.createLinearGradient(0,0,0,290);bg.addColorStop(0,P.bg[0]);bg.addColorStop(1,P.bg[1]);g.fillStyle=bg;g.fillRect(0,0,220,290);
 for(let k=0;k<7;k++){g.fillStyle=`rgba(255,255,255,${0.12+r()*0.16})`;g.beginPath();g.arc(r()*220,r()*200,8+r()*26,0,7);g.fill()}
 if(P.board){CG_line('rgba(255,255,255,0.75)',3);g.beginPath();g.moveTo(18,40);g.lineTo(40,62);g.moveTo(40,40);g.lineTo(18,62);g.moveTo(178,30);g.quadraticCurveTo(196,20,204,40);g.quadraticCurveTo(190,50,178,30);g.moveTo(170,70);g.lineTo(206,70);g.moveTo(170,82);g.lineTo(196,82);g.stroke();g.fillStyle='rgba(255,255,255,0.8)';g.beginPath();g.arc(30,96,5,0,7);g.fill()}
 const skE=CG_dk(P.sk,0.4),skS=CG_dk(P.sk,0.15),hairE=CG_dk(P.hc,0.45);
 // hair behind the head
 if(P.hair==='bun'){CG_fill(CG_P(Q=>Q.arc(cx+44,cy-50,24,0,7)),P.hc,{edge:hairE,d:3});CG_fill(CG_P(Q=>Q.ellipse(cx,cy-12,fw+6,fh+2,0,0,7)),P.hc,{edge:hairE,d:3})}
 if(P.hair==='braid'){CG_fill(CG_P(Q=>Q.ellipse(cx,cy-10,fw+6,fh+4,0,0,7)),P.hc,{edge:hairE,d:3})}
 if(P.hair==='bob'){CG_fill(CG_P(Q=>{Q.moveTo(cx-fw-10,cy+44);Q.bezierCurveTo(cx-fw-18,cy-80,cx+fw+18,cy-80,cx+fw+10,cy+44);Q.quadraticCurveTo(cx,cy+56,cx-fw-10,cy+44)}),P.hc,{edge:hairE,d:3})}
 if(P.hair==='pig'){for(const sg of [-1,1]){CG_fill(CG_P(Q=>Q.ellipse(cx+sg*(fw+22),cy+20,20,30,sg*0.3,0,7)),P.hc,{edge:hairE,d:3});CG_fill(CG_P(Q=>{const x=cx+sg*(fw+10),y=cy-20;Q.moveTo(x,y);Q.lineTo(x+sg*16,y-14);Q.lineTo(x+sg*18,y+12);Q.closePath();Q.moveTo(x,y);Q.lineTo(x-sg*2,y-20);Q.lineTo(x+sg*12,y-22);Q.closePath()}),P.ribbon,{edge:CG_dk(P.ribbon,0.4),d:1.5,lw:1.6})}}
 // shoulders and clothes
 const sh=CG_P(Q=>{Q.moveTo(4,292);Q.bezierCurveTo(8,232,52,206,110,204);Q.bezierCurveTo(168,206,212,232,216,292);Q.closePath()});
 const base={sari:P.cc,shirt:P.cc,tie:P.cc,jersey:P.cc,kurta:P.cc,pinafore:P.cc,kurta2:P.cc,coat:P.top||P.cc,tee:P.cc,vest:P.cc}[P.cloth];
 CG_fill(CG_P(Q=>Q.rect(cx-17,cy+40,34,52)),skS,{edge:skE,d:2});
 CG_fill(sh,base,{d:6});
 g.save();g.clip(sh);
 if(P.cloth==='sari'){g.fillStyle=P.cc;CG_fill(CG_P(Q=>{Q.moveTo(132,200);Q.lineTo(222,248);Q.lineTo(222,292);Q.lineTo(64,292);Q.closePath()}),C_mx(P.cc,C_BK,0.08),{d:4});CG_line(P.bc,7);g.beginPath();g.moveTo(130,206);g.lineTo(60,296);g.stroke();CG_line(CG_dk(P.bc,0.3),1.5);g.beginPath();g.moveTo(126,203);g.lineTo(55,293);g.moveTo(135,209);g.lineTo(66,299);g.stroke();
  g.fillStyle=CG_lt(P.bc,0.3);for(let k=0;k<6;k++){g.beginPath();g.arc(124-k*12,214+k*15,1.8,0,7);g.fill()}}
 if(P.cloth==='shirt'||P.cloth==='tie'){for(const sg of [-1,1])CG_fill(CG_P(Q=>{Q.moveTo(cx,cy+96);Q.lineTo(cx+sg*30,cy+82);Q.lineTo(cx+sg*36,cy+104);Q.closePath()}),P.cloth==='tie'?'#F4F4F4':CG_lt(P.cc,0.35),{d:2,lw:1.6});
  if(P.cloth==='tie')CG_fill(CG_P(Q=>{Q.moveTo(cx-8,cy+96);Q.lineTo(cx+8,cy+96);Q.lineTo(cx+13,cy+170);Q.lineTo(cx,cy+182);Q.lineTo(cx-13,cy+170);Q.closePath()}),P.tie,{d:2});
  else{CG_line(CG_dk(P.cc,0.3),1.6);g.beginPath();g.moveTo(cx,cy+100);g.lineTo(cx,cy+180);g.stroke();g.fillStyle=CG_dk(P.cc,0.3);for(let k=0;k<3;k++){g.beginPath();g.arc(cx+4,cy+118+k*22,2.4,0,7);g.fill()}CG_fill(CG_P(Q=>Q.roundRect(cx+30,cy+118,26,22,3)),P.cc,{d:1,lw:1.4})}}
 if(P.cloth==='jersey'){CG_line(P.trim,8);g.beginPath();g.moveTo(cx-30,cy+86);g.lineTo(cx,cy+118);g.lineTo(cx+30,cy+86);g.stroke();CG_line('#FFFFFF',2.5);g.beginPath();g.moveTo(cx-22,cy+150);g.lineTo(cx-40,cy+170);g.stroke()}
 if(P.cloth==='kurta'){CG_line(CG_dk(P.cc,0.25),2);g.beginPath();g.moveTo(cx,cy+92);g.lineTo(cx,cy+150);g.stroke();g.fillStyle=CG_dk(P.cc,0.35);for(let k=0;k<3;k++){g.beginPath();g.arc(cx,cy+104+k*16,2.6,0,7);g.fill()}
  if(P.shawl){for(const sg of [-1,1])CG_fill(CG_P(Q=>{Q.moveTo(cx+sg*40,cy+82);Q.quadraticCurveTo(cx+sg*90,cy+86,cx+sg*114,cy+120);Q.lineTo(cx+sg*114,cy+172);Q.lineTo(cx+sg*58,cy+172);Q.quadraticCurveTo(cx+sg*50,cy+120,cx+sg*40,cy+82)}),P.shawl,{d:3});
   CG_line(CG_lt(P.shawl,0.3),2);g.setLineDash([3,4]);g.beginPath();g.moveTo(cx-60,cy+168);g.lineTo(cx-110,cy+168);g.moveTo(cx+60,cy+168);g.lineTo(cx+110,cy+168);g.stroke();g.setLineDash([])}}
 if(P.cloth==='pinafore'){for(const sg of [-1,1])CG_fill(CG_P(Q=>{Q.moveTo(cx,cy+96);Q.lineTo(cx+sg*26,cy+84);Q.lineTo(cx+sg*30,cy+100);Q.closePath()}),'#FFFFFF',{d:2,lw:1.4});
  CG_fill(CG_P(Q=>{Q.moveTo(cx-60,cy+190);Q.lineTo(cx-48,cy+124);Q.lineTo(cx+48,cy+124);Q.lineTo(cx+60,cy+190);Q.closePath()}),P.pin,{d:3});for(const sg of [-1,1])CG_tube(CG_quad(cx+sg*44,cy+128,cx+sg*50,cy+100,cx+sg*58,cy+86),10,P.pin,{core:3,d:1})}
 if(P.cloth==='kurta2'){CG_line('#FFE07A',4);g.beginPath();g.moveTo(cx-24,cy+88);g.quadraticCurveTo(cx,cy+122,cx+24,cy+88);g.stroke();CG_fill(CG_P(Q=>{Q.moveTo(20,204);Q.quadraticCurveTo(70,214,96,292);Q.lineTo(40,292);Q.quadraticCurveTo(26,250,4,236);Q.closePath()}),P.dup,{d:3})}
 if(P.cloth==='coat'){for(const sg of [-1,1])CG_fill(CG_P(Q=>{Q.moveTo(cx+sg*22,cy+86);Q.lineTo(cx+sg*110,cy+100);Q.lineTo(cx+sg*110,cy+172);Q.lineTo(cx+sg*30,cy+172);Q.lineTo(cx+sg*8,cy+120);Q.closePath()}),'#FFFFFF',{d:3,edge:'#9FB4C8'});
  CG_line('#3A4A5C',4);g.beginPath();g.moveTo(cx-34,cy+88);g.quadraticCurveTo(cx-44,cy+150,cx-14,cy+156);g.moveTo(cx+34,cy+88);g.quadraticCurveTo(cx+40,cy+130,cx+30,cy+146);g.stroke();CG_fill(CG_P(Q=>Q.arc(cx+30,cy+154,8,0,7)),'#C9D3DE',{d:1.5,edge:'#3A4A5C'})}
 if(P.cloth==='tee'){CG_line(CG_dk(P.cc,0.3),5);g.beginPath();g.arc(cx,cy+88,24,0.2,Math.PI-0.2);g.stroke();g.save();g.translate(cx+40,cy+140);g.fillStyle='#FFE14D';g.beginPath();for(let k=0;k<10;k++){const a=-Math.PI/2+k*Math.PI/5,rr=k%2?8:18;g.lineTo(Math.cos(a)*rr,Math.sin(a)*rr)}g.closePath();g.fill();CG_line('#C79A12',1.6);g.stroke();g.restore()}
 if(P.cloth==='vest'){CG_line(CG_dk(P.cc,0.2),2);g.beginPath();g.moveTo(cx-34,cy+84);g.quadraticCurveTo(cx,cy+130,cx+34,cy+84);g.stroke();
  const gm=CG_P(Q=>{Q.moveTo(150,206);Q.quadraticCurveTo(196,214,214,250);Q.lineTo(206,292);Q.lineTo(156,292);Q.quadraticCurveTo(160,250,150,206)});CG_fill(gm,P.check,{d:3});g.save();g.clip(gm);CG_line('rgba(255,255,255,0.7)',3);for(let k=0;k<6;k++){g.beginPath();g.moveTo(140,200+k*16);g.lineTo(230,200+k*16);g.moveTo(150+k*14,200);g.lineTo(150+k*14,300);g.stroke()}g.restore()}
 g.restore();
 if(P.hair==='braid'){const bp=[cx-46,cy+20,cx-74,cy+90,cx-60,cy+176];for(let k=0;k<8;k++){const [x,y]=CG_qpt(...bp,k/7);g.save();g.translate(x,y);g.rotate(k%2?0.5:-0.5);CG_fill(CG_P(Q=>Q.ellipse(0,0,15,11,0,0,7)),P.hc,{edge:hairE,d:2,lw:1.6});g.restore();if(P.jas&&k<4){g.fillStyle='#FFFFFF';g.beginPath();g.arc(x+12,y-4,3.6,0,7);g.fill();CG_line('#D8E2D0',1);g.stroke()}}}
 // ears + face
 for(const sg of [-1,1]){CG_fill(CG_P(Q=>Q.ellipse(cx+sg*(fw+1),cy+6,9,13,0,0,7)),P.sk,{edge:skE,sh:skS,d:1.5,lw:1.6});if(P.ear){CG_fill(CG_P(Q=>Q.arc(cx+sg*(fw+2),cy+22,4.5,0,7)),'#FFC83A',{edge:'#A8730E',d:1,lw:1.2})}}
 const face=CG_face(cx,cy,fw,fh,P.old?1.05:0.95);CG_fill(face,P.sk,{edge:skE,sh:skS,d:6,hl:[cx-26,cy-26,15,9,0.2]});
 if(P.old){CG_line(CG_dk(P.sk,0.25),1.6);g.beginPath();g.moveTo(cx-18,cy-36);g.quadraticCurveTo(cx,cy-40,cx+18,cy-36);g.moveTo(cx-14,cy-29);g.quadraticCurveTo(cx,cy-32,cx+14,cy-29);g.stroke()}
 if(P.beard){CG_fill(CG_P(Q=>{Q.moveTo(cx-fw+2,cy+2);Q.bezierCurveTo(cx-fw,cy+60,cx-24,cy+78,cx,cy+82);Q.bezierCurveTo(cx+24,cy+78,cx+fw,cy+60,cx+fw-2,cy+2);Q.quadraticCurveTo(cx+fw-8,cy+40,cx+20,cy+40);Q.quadraticCurveTo(cx,cy+30,cx-20,cy+40);Q.quadraticCurveTo(cx-fw+8,cy+40,cx-fw+2,cy+2)}),P.hc,{edge:hairE,d:3})}
 const ey=cy+4;CG_eyes(cx,ey,P.kid?19:21,P.eyes,P.kid?1.15:1,'#22140C');
 CG_brows(cx,ey-18,21,P.hair==='bald'||P.hair==='wrap'?'#9A9AA2':(P.hc==='#E9E9EE'?'#8F8F98':P.hc),1,P.eyes==='happy'?2:0);
 CG_nose(cx+1,cy+22,CG_dk(P.sk,0.3));CG_blush(cx,cy+28,P.kid?30:33,P.kid?1.1:0.95,P.kid?0.5:0.36);
 if(P.mous){CG_fill(CG_P(Q=>{Q.moveTo(cx,cy+33);Q.bezierCurveTo(cx-10,cy+28,cx-24,cy+30,cx-27,cy+42);Q.quadraticCurveTo(cx-14,cy+36,cx,cy+39);Q.quadraticCurveTo(cx+14,cy+36,cx+27,cy+42);Q.bezierCurveTo(cx+24,cy+30,cx+10,cy+28,cx,cy+33)}),P.mous,{edge:CG_dk(P.mous,0.45),d:1.5,lw:1.4})}
 CG_mouth(cx,cy+(P.mous?47:42),P.mouth,P.kid?1.05:0.95);
 if(P.bindi){g.fillStyle='#E0232E';g.beginPath();g.arc(cx,cy-22,3.6,0,7);g.fill()}
 if(P.glasses==='rect'){CG_line('#2B2B33',3);for(const sg of [-1,1]){g.beginPath();g.roundRect(cx+sg*21-13,ey-10,26,19,4);g.stroke()}g.beginPath();g.moveTo(cx-8,ey-2);g.quadraticCurveTo(cx,ey-6,cx+8,ey-2);g.stroke();g.fillStyle='rgba(255,255,255,0.25)';for(const sg of [-1,1])g.fillRect(cx+sg*21-10,ey-8,8,6)}
 if(P.glasses==='round'){CG_line(P.old?'#8A6A3A':'#2B2B33',2.6);for(const sg of [-1,1]){g.beginPath();g.arc(cx+sg*21,ey,13,0,7);g.stroke()}g.beginPath();g.moveTo(cx-8,ey-2);g.quadraticCurveTo(cx,ey-6,cx+8,ey-2);g.stroke()}
 // hair in front
 const top=(Q)=>{};
 if(P.hair==='bun'||P.hair==='braid'){for(const sg of [-1,1])CG_fill(CG_P(Q=>{Q.moveTo(cx,cy-fh+2);Q.quadraticCurveTo(cx+sg*(fw+4),cy-fh,cx+sg*(fw+3),cy+8);Q.quadraticCurveTo(cx+sg*(fw-10),cy-34,cx,cy-38);Q.closePath()}),P.hc,{edge:hairE,d:2});
  CG_line(CG_lt(P.hc,0.25),2);g.beginPath();g.moveTo(cx-6,cy-fh+6);g.quadraticCurveTo(cx-30,cy-fh+6,cx-42,cy-30);g.stroke()}
 if(P.hair==='side'){CG_fill(CG_P(Q=>{Q.moveTo(cx-fw-2,cy+2);Q.bezierCurveTo(cx-fw-8,cy-60,cx-20,cy-fh-10,cx+12,cy-fh-6);Q.bezierCurveTo(cx+fw+4,cy-fh,cx+fw+8,cy-30,cx+fw+2,cy+2);Q.quadraticCurveTo(cx+fw-8,cy-30,cx+30,cy-40);Q.quadraticCurveTo(cx-14,cy-52,cx-30,cy-34);Q.quadraticCurveTo(cx-fw+2,cy-26,cx-fw-2,cy+2)}),P.hc,{edge:hairE,d:3});
  if(P.grey){g.fillStyle='#B9BBC4';for(const sg of [-1,1]){g.beginPath();g.ellipse(cx+sg*(fw-2),cy-12,6,14,0,0,7);g.fill()}}CG_line(CG_lt(P.hc,0.3),2);g.beginPath();g.moveTo(cx-24,cy-fh+2);g.quadraticCurveTo(cx+4,cy-fh-4,cx+30,cy-fh+6);g.stroke()}
 if(P.hair==='cap'){for(const sg of [-1,1])CG_fill(CG_P(Q=>Q.ellipse(cx+sg*(fw-4),cy-12,10,16,0,0,7)),P.hc,{edge:hairE,d:1.5});
  CG_fill(CG_P(Q=>{Q.moveTo(cx-fw-4,cy-22);Q.bezierCurveTo(cx-fw-4,cy-fh-34,cx+fw+4,cy-fh-34,cx+fw+4,cy-22);Q.closePath()}),P.cap,{d:4,hl:[cx-24,cy-60,16,8,0.3]});CG_line(CG_dk(P.cap,0.3),1.6);g.beginPath();g.moveTo(cx,cy-fh-22);g.lineTo(cx,cy-24);g.moveTo(cx-30,cy-fh-12);g.quadraticCurveTo(cx-34,cy-50,cx-40,cy-24);g.moveTo(cx+30,cy-fh-12);g.quadraticCurveTo(cx+34,cy-50,cx+40,cy-24);g.stroke();
  CG_fill(CG_P(Q=>Q.arc(cx,cy-fh-22,5,0,7)),P.trim,{d:1,lw:1.2});CG_fill(CG_P(Q=>{Q.moveTo(cx-fw-8,cy-22);Q.quadraticCurveTo(cx,cy-30,cx+fw+8,cy-22);Q.quadraticCurveTo(cx+fw+18,cy-6,cx+fw-6,cy-6);Q.quadraticCurveTo(cx,cy-14,cx-fw+6,cy-6);Q.quadraticCurveTo(cx-fw-18,cy-6,cx-fw-8,cy-22)}),CG_dk(P.cap,0.12),{d:2})}
 if(P.hair==='bald'){g.fillStyle='rgba(255,255,255,0.35)';g.beginPath();g.ellipse(cx-18,cy-fh+14,14,7,-0.3,0,7);g.fill();for(const sg of [-1,1])CG_fill(CG_P(Q=>{const x=cx+sg*(fw-2);C_circ(Q,x,cy-14,11);C_circ(Q,x+sg*4,cy-2,10);C_circ(Q,x-sg*2,cy-26,9)}),P.hc,{edge:'#B9BAC4',d:2,lw:1.4})}
 if(P.hair==='pig'){CG_fill(CG_P(Q=>{Q.moveTo(cx-fw-4,cy);Q.bezierCurveTo(cx-fw-8,cy-fh-24,cx+fw+8,cy-fh-24,cx+fw+4,cy);Q.lineTo(cx+fw-6,cy-28);Q.lineTo(cx+28,cy-30);Q.lineTo(cx+14,cy-26);Q.lineTo(cx,cy-31);Q.lineTo(cx-16,cy-26);Q.lineTo(cx-30,cy-30);Q.lineTo(cx-fw+6,cy-28);Q.closePath()}),P.hc,{edge:hairE,d:3});CG_line(CG_lt(P.hc,0.25),2);g.beginPath();g.moveTo(cx-20,cy-fh+2);g.quadraticCurveTo(cx,cy-fh-6,cx+22,cy-fh+2);g.stroke()}
 if(P.hair==='turban'){const tp=CG_P(Q=>{Q.moveTo(cx-fw-6,cy-6);Q.bezierCurveTo(cx-fw-20,cy-fh-40,cx+fw+20,cy-fh-40,cx+fw+6,cy-6);Q.quadraticCurveTo(cx+30,cy-34,cx,cy-24);Q.quadraticCurveTo(cx-30,cy-34,cx-fw-6,cy-6)});CG_fill(tp,P.tur,{d:5,hl:[cx-22,cy-70,18,8,0.3]});
  g.save();g.clip(tp);CG_line(CG_dk(P.tur,0.3),2.2);for(let k=0;k<4;k++){g.beginPath();g.moveTo(cx-fw-10,cy-18-k*16);g.quadraticCurveTo(cx,cy-60-k*12,cx+fw+10,cy-30-k*18);g.stroke()}g.restore();
  CG_fill(CG_P(Q=>{Q.moveTo(cx,cy+30);Q.bezierCurveTo(cx-10,cy+25,cx-26,cy+28,cx-30,cy+40);Q.quadraticCurveTo(cx-14,cy+34,cx,cy+37);Q.quadraticCurveTo(cx+14,cy+34,cx+30,cy+40);Q.bezierCurveTo(cx+26,cy+28,cx+10,cy+25,cx,cy+30)}),P.hc,{edge:hairE,d:1.5,lw:1.4})}
 if(P.hair==='bob'){CG_fill(CG_P(Q=>{Q.moveTo(cx-fw-6,cy+20);Q.bezierCurveTo(cx-fw-12,cy-60,cx-10,cy-fh-12,cx+20,cy-fh-6);Q.bezierCurveTo(cx+fw+6,cy-fh,cx+fw+12,cy-30,cx+fw+6,cy+20);Q.quadraticCurveTo(cx+fw-6,cy-20,cx+fw-14,cy-30);Q.quadraticCurveTo(cx+10,cy-26,cx-14,cy-46);Q.quadraticCurveTo(cx-fw+2,cy-20,cx-fw-6,cy+20)}),P.hc,{edge:hairE,d:3});CG_line(CG_lt(P.hc,0.3),2);g.beginPath();g.moveTo(cx-30,cy-fh+6);g.quadraticCurveTo(cx,cy-fh-6,cx+30,cy-fh+4);g.stroke()}
 if(P.hair==='spiky'){CG_fill(CG_P(Q=>{Q.moveTo(cx-fw-4,cy-2);let x=cx-fw-4;const pts=[[-48,-66],[-36,-52],[-26,-84],[-10,-60],[2,-90],[14,-62],[30,-84],[36,-56],[52,-68],[48,-36]];Q.lineTo(cx-fw+2,cy-40);for(const [px,py] of pts)Q.lineTo(cx+px,cy+py);Q.lineTo(cx+fw+4,cy-2);Q.quadraticCurveTo(cx+fw-6,cy-30,cx+20,cy-36);Q.quadraticCurveTo(cx,cy-30,cx-20,cy-38);Q.quadraticCurveTo(cx-fw+4,cy-30,cx-fw-4,cy-2)}),P.hc,{edge:hairE,d:3})}
 if(P.hair==='wrap'){const wp=CG_P(Q=>{Q.moveTo(cx-fw-6,cy-12);Q.bezierCurveTo(cx-fw-14,cy-fh-30,cx+fw+14,cy-fh-30,cx+fw+6,cy-12);Q.quadraticCurveTo(cx,cy-36,cx-fw-6,cy-12)});CG_fill(wp,P.wrap,{d:4,edge:'#B8B8C0'});g.save();g.clip(wp);CG_line(P.check,2.2);for(let k=0;k<5;k++){g.beginPath();g.moveTo(cx-fw-10,cy-20-k*13);g.quadraticCurveTo(cx,cy-46-k*12,cx+fw+10,cy-20-k*13);g.stroke()}g.restore();
  CG_fill(CG_P(Q=>{Q.moveTo(cx+fw-6,cy-50);Q.quadraticCurveTo(cx+fw+24,cy-70,cx+fw+18,cy-40);Q.quadraticCurveTo(cx+fw+10,cy-46,cx+fw-2,cy-36);Q.closePath()}),P.wrap,{d:2,edge:'#B8B8C0'})}
 // watercolour grain over the whole card (painterly, not clip-art)
 g.save();g.globalCompositeOperation='soft-light';g.globalAlpha=0.42;g.drawImage(C_WASH,(i*23)%60,(i*41)%90,120,160,0,0,220,290);g.restore();
 // frame
 g.strokeStyle='rgba(255,255,255,0.95)';g.lineWidth=7;g.beginPath();g.roundRect(3.5,3.5,213,283,12);g.stroke();g.strokeStyle='rgba(30,40,70,0.18)';g.lineWidth=1.5;g.beginPath();g.roundRect(7.5,7.5,205,275,9);g.stroke()}
const CG_PORT=i=>CG_cache('port'+i,0,0,220,290,2.4,()=>CG_portraitArt(i));


// ---------------------------------------------------------------------------------------------------------------------
// GLASS DROP: a lens-shaped teardrop (kit drop geometry: tip y-1.25s, belly y+0.85s); `inner` paints what it shows
// ---------------------------------------------------------------------------------------------------------------------
const CG_dropP=(x,y,s)=>CG_P(P=>{P.moveTo(x,y-s*1.25);P.bezierCurveTo(x+s*.95,y-s*.1,x+s*.8,y+s*.85,x,y+s*.85);P.bezierCurveTo(x-s*.8,y+s*.85,x-s*.95,y-s*.1,x,y-s*1.25);P.closePath()});
function CG_glass(x,y,s,inner,o={}){const P=CG_dropP(x,y,s);g.save();g.clip(P);inner(P);
 const rg=g.createRadialGradient(x-s*0.12,y+s*0.08,s*0.3,x,y-s*0.1,s*1.12);rg.addColorStop(0,'rgba(255,255,255,0)');rg.addColorStop(0.66,'rgba(255,255,255,0)');rg.addColorStop(1,o.rim||'rgba(24,56,128,0.6)');g.fillStyle=rg;g.fillRect(x-s*1.3,y-s*1.4,s*2.6,s*2.4);
 g.globalCompositeOperation='screen';glow(x+s*0.2,y+s*0.52,s*0.55,o.caus||'255,250,230',0.6,0.3);g.restore();
 g.save();g.fillStyle='rgba(255,255,255,0.88)';g.beginPath();g.ellipse(x-s*0.44,y-s*0.12,s*0.11,s*0.34,0.38,0,7);g.fill();g.beginPath();g.arc(x-s*0.26,y-s*0.62,s*0.065,0,7);g.fill();
 g.fillStyle='rgba(255,255,255,0.5)';g.beginPath();g.ellipse(x+s*0.38,y+s*0.48,s*0.16,s*0.05,-0.7,0,7);g.fill();
 g.strokeStyle=o.edge||'rgba(26,64,138,0.6)';g.lineWidth=Math.max(1.2,s*0.022);g.stroke(P);g.restore()}
// a glossy gold drop (gratitude only)
function CG_goldDrop(x,y,s,a=1){if(s<=0.5||a<=0.01)return;g.save();g.globalAlpha*=a;const P=CG_dropP(x,y,s);
 const gr=g.createRadialGradient(x-s*0.3,y-s*0.2,s*0.08,x,y+s*0.1,s*1.05);gr.addColorStop(0,'#FFF8DA');gr.addColorStop(0.45,'#FFD45C');gr.addColorStop(1,'#E8941C');g.fillStyle=gr;g.fill(P);
 g.save();g.clip(P);g.globalCompositeOperation='screen';glow(x+s*0.2,y+s*0.5,s*0.6,'255,246,200',0.7,0.3);g.restore();
 g.strokeStyle=C_GOLDEDGE;g.lineWidth=Math.max(1,s*0.05);g.stroke(P);g.fillStyle='rgba(255,255,255,0.9)';g.beginPath();g.ellipse(x-s*0.42,y-s*0.1,s*0.1,s*0.3,0.38,0,7);g.fill();g.restore()}
// a gold spark: soft warm glow, a four-point star with a brown edge (reads on light skies), two orbiting glints
function CG_spark(x,y,s,a,t){if(a<=0.01)return;g.save();g.globalCompositeOperation='screen';glow(x,y,s*5,'255,196,90',0.45*a,0.3);g.restore();
 C_sparkle(x,y,s,a,{col:'255,206,90',edge:'rgba(120,64,0,0.75)',rot:t*1.2});
 for(let i=0;i<2;i++){const an=t*4+i*3.14;C_sparkle(x+Math.cos(an)*s*1.3,y+Math.sin(an)*s*0.8,s*0.28,a*0.9,{col:'255,214,120',edge:'rgba(120,64,0,0.6)',small:false})}}

// ---------------------------------------------------------------------------------------------------------------------
// WARM ILLUSTRATED HANDS: a cupped, open hand seen from the front; wrist at the left, fingers curl up on the right;
// the palm's hollow sits at local (16,-44). A: saffron sleeve, light skin. B: teal sleeve, deeper skin, gold bangles.
// ---------------------------------------------------------------------------------------------------------------------
const CG_HANDS=[{sk:'#E8AE80',sl:'#FF9E2C',cf:'#FFE070',dot:'#FFF4D2'},{sk:'#A06844',sl:'#14A08F',cf:'#F6F0DC',dot:'#C9F2EA',bangle:'#F2B92E'}];
function CG_handArt(i){const H=CG_HANDS[i],sk=H.sk,skS=CG_dk(sk,0.15),skE=CG_dk(sk,0.34),pl=C_c(C_mx(C_col(sk),[255,212,196],0.36)),o={edge:skE,sh:skS};
 // sleeve from off-frame, with a printed dot pattern and a contrasting cuff
 const sq=[-470,104,-340,66,-200,22];CG_tube(CG_quad(...sq),112,H.sl,{core:26,d:6});
 g.fillStyle=H.dot;for(let k=0;k<12;k++){const u=0.06+k*0.075,[px,py]=CG_qpt(...sq,u);for(const off of [-30,0,30]){g.globalAlpha=0.75;g.beginPath();g.arc(px+(k%2?6:-6),py+off,3.2,0,7);g.fill()}}g.globalAlpha=1;
 CG_tube(CG_quad(-224,30,-212,27,-196,22),120,H.cf,{core:22,d:4,cap:'butt'});
 // wrist + back of the hand
 CG_tube(CG_quad(-200,22,-160,10,-104,2),82,sk,{...o,core:22,d:3});
 if(H.bangle){for(const bx of [-178,-162]){g.save();g.translate(bx,15);g.rotate(-0.1);CG_line(CG_dk(H.bangle,0.35),9);g.beginPath();g.ellipse(0,0,8,44,0,0,7);g.stroke();CG_line(H.bangle,6);g.stroke();g.strokeStyle='rgba(255,255,255,0.7)';g.lineWidth=2;g.beginPath();g.ellipse(0,0,8,44,0,3.6,4.6);g.stroke();g.restore()}}
 // thumb, raised on the far side of the hollow
 CG_tube(CG_quad(-70,-24,-60,-88,-10,-108),40,sk,{...o,core:13,d:2});
 g.fillStyle=C_c(C_mx(C_col(sk),C_WH,0.35));g.beginPath();g.ellipse(-12,-106,11,7,-0.5,0,7);g.fill();CG_line(skE,1.3);g.globalAlpha=0.6;g.stroke();g.globalAlpha=1;
 // heel of the palm and its outer edge
 const pb=CG_P(P=>{P.moveTo(-132,-20);P.bezierCurveTo(-74,-46,30,-44,90,-26);P.bezierCurveTo(108,6,86,58,22,64);P.bezierCurveTo(-48,70,-116,52,-134,20);P.closePath()});
 CG_fill(pb,sk,{...o,d:7,hl:[-50,24,46,12,0.14]});
 // the hollow of the palm (seen from above), with its creases
 const cup=CG_P(P=>P.ellipse(-16,-25,90,18,-0.03,0,7));g.fillStyle=pl;g.fill(cup);g.save();g.clip(cup);
 g.fillStyle=C_c(CG_dk(pl,0.12),0.6);g.beginPath();g.ellipse(-16,-12,92,10,0,0,7);g.fill();
 CG_line(C_c(CG_dk(pl,0.3),0.8),2);g.beginPath();g.moveTo(-78,-20);g.quadraticCurveTo(-24,-36,44,-28);g.moveTo(-66,-30);g.quadraticCurveTo(-30,-22,6,-24);g.stroke();g.restore();
 // fingers: index at the back -> little finger in front, curling up from the knuckles
 const FG=[[62,-32,140,-42,134,-100,30],[70,-21,154,-26,152,-90,32],[70,-7,156,-6,154,-70,31],[64,9,140,16,140,-42,27]];
 for(const [x0,y0,cx,cy,x1,y1,w] of FG){CG_tube(CG_quad(x0,y0,cx,cy,x1,y1),w,sk,{...o,core:11,d:2});
  for(const u of [0.48,0.78]){const [px,py]=CG_qpt(x0,y0,cx,cy,x1,y1,u),[qx,qy]=CG_qpt(x0,y0,cx,cy,x1,y1,u+0.02),a=Math.atan2(qy-py,qx-px)+Math.PI/2;
   CG_line(C_c(C_col(skE),0.55),1.6);g.beginPath();g.moveTo(px-Math.cos(a)*w*0.3,py-Math.sin(a)*w*0.3);g.quadraticCurveTo(px+Math.cos(a-Math.PI/2)*3,py+Math.sin(a-Math.PI/2)*3,px+Math.cos(a)*w*0.3,py+Math.sin(a)*w*0.3);g.stroke()}
  g.fillStyle=C_c(C_mx(C_col(sk),C_WH,0.3),0.8);g.beginPath();g.ellipse(x1-w*0.12,y1+w*0.18,w*0.2,w*0.14,0,0,7);g.fill()}
 // knuckle dimples along the base of the fingers
 CG_line(C_c(C_col(skE),0.45),1.4);for(let k=0;k<3;k++){g.beginPath();g.arc(84,-24+k*13,4,2.2,4.2);g.stroke()}}
const CG_HAND=i=>CG_cache('hand'+i,-480,-140,680,250,2.2,()=>CG_handArt(i));
const CG_CUP=[16,-44];
// place a hand: dir 1 = fingers to the right (A), -1 = mirrored (B)
function CG_putHand(i,x,y,s,dir,rot=0){g.save();g.translate(x,y);g.scale(dir,1);if(rot)g.rotate(rot);CG_blit(CG_HAND(i),0,0,s);g.restore()}
const CG_cupAt=(x,y,s,dir)=>[x+dir*CG_CUP[0]*s,y+CG_CUP[1]*s];

// ---------------------------------------------------------------------------------------------------------------------
// PEOPLE RECEIVING THE RAIN (local origin = between the feet): a farmer in a dhoti, face lifted, arms open; a woman in a
// magenta sari tilting a clay pot; a child in a yellow raincoat crouched by a puddle with a paper boat
// ---------------------------------------------------------------------------------------------------------------------
function CG_openHand(x,y,sg,sk,o,s=1){g.save();g.translate(x,y);g.scale(sg*s,s);
 for(let i=0;i<4;i++){const a=-1.95+i*0.3;CG_tube(CG_quad(0,0,Math.cos(a)*13,Math.sin(a)*13,Math.cos(a)*25,Math.sin(a)*25),7.5,sk,{...o,core:3,d:0.8,lw:1.1})}
 CG_tube(CG_quad(-3,4,-13,2,-19,-6),7.5,sk,{...o,core:3,d:0.8,lw:1.1});CG_fill(CG_P(P=>P.ellipse(0,0,11.5,9.5,0,0,7)),sk,{...o,d:2,lw:1.2});g.restore()}
function CG_farmerArt(){const sk='#8E5634',skS=CG_dk(sk,0.15),skE=CG_dk(sk,0.36),o={edge:skE,sh:skS};
 for(const sg of [-1,1]){CG_fill(CG_P(P=>P.ellipse(sg*18,-3,18,6,0,0,7)),'#7A4A26',{d:1.5,lw:1.3});CG_fill(CG_P(P=>P.ellipse(sg*17,-9,13,7,0,0,7)),sk,{...o,d:1.5,lw:1.3})}
 for(const sg of [-1,1])CG_tube(CG_quad(sg*15,-12,sg*16,-44,sg*14,-78),15,sk,{...o,core:5,d:1.5,lw:1.4});
 const dh=CG_P(P=>{P.moveTo(-44,-182);P.lineTo(44,-182);P.bezierCurveTo(52,-140,58,-100,53,-66);P.quadraticCurveTo(34,-57,22,-62);P.quadraticCurveTo(10,-98,0,-100);P.quadraticCurveTo(-10,-98,-22,-62);P.quadraticCurveTo(-34,-57,-53,-66);P.bezierCurveTo(-58,-100,-52,-140,-44,-182);P.closePath()});
 CG_fill(dh,'#FBF5E6',{d:5,sh:'#DCCFB4',edge:'#A89878',hl:[-26,-140,12,30,0.35]});
 g.save();g.clip(dh);CG_line('rgba(150,128,96,0.5)',2);for(const [x0,y0,x1,y1] of [[4,-180,2,-102],[18,-178,32,-70],[-12,-178,-32,-70],[32,-174,46,-80]]){g.beginPath();g.moveTo(x0,y0);g.quadraticCurveTo((x0+x1)/2+5,(y0+y1)/2,x1,y1);g.stroke()}
  CG_line('#2E9A5A',5);g.beginPath();g.moveTo(-56,-68);g.quadraticCurveTo(-34,-59,-22,-64);g.moveTo(22,-64);g.quadraticCurveTo(34,-59,56,-68);g.stroke();g.restore();
 const tor=CG_P(P=>{P.moveTo(-26,-272);P.quadraticCurveTo(-50,-270,-52,-252);P.lineTo(-45,-178);P.lineTo(45,-178);P.lineTo(52,-252);P.quadraticCurveTo(50,-270,26,-272);P.closePath()});CG_fill(tor,sk,{...o,d:4});
 const vs=CG_P(P=>{P.moveTo(-23,-272);P.lineTo(-33,-268);P.quadraticCurveTo(-37,-242,-46,-230);P.lineTo(-47,-176);P.lineTo(47,-176);P.lineTo(46,-230);P.quadraticCurveTo(37,-242,33,-268);P.lineTo(23,-272);P.quadraticCurveTo(0,-240,-23,-272);P.closePath()});
 CG_fill(vs,'#7FC0F2',{d:5,hl:[-20,-240,10,22,0.3]});
 // arms raised wide, palms open to the rain
 for(const sg of [-1,1]){CG_tube(CG_quad(sg*44,-258,sg*78,-268,sg*98,-300),21,sk,{...o,core:7,d:2});CG_tube(CG_quad(sg*98,-300,sg*110,-328,sg*108,-354),19,sk,{...o,core:6,d:2});CG_openHand(sg*108,-362,sg,sk,o)}
 // red-check gamcha over his shoulder
 const gm=CG_P(P=>{P.moveTo(8,-274);P.quadraticCurveTo(40,-282,54,-258);P.lineTo(46,-194);P.lineTo(28,-196);P.lineTo(34,-250);P.quadraticCurveTo(22,-262,2,-260);P.closePath()});
 CG_fill(gm,'#E0473A',{d:3});g.save();g.clip(gm);CG_line('rgba(255,255,255,0.7)',2.2);for(let k=0;k<9;k++){g.beginPath();g.moveTo(0,-284+k*11);g.lineTo(60,-274+k*11);g.moveTo(10+k*7,-290);g.lineTo(10+k*7,-180);g.stroke()}g.restore();
 CG_line('#E0473A',2);for(let k=0;k<5;k++){g.beginPath();g.moveTo(30+k*3.6,-196);g.lineTo(30+k*3.6,-186);g.stroke()}
 // neck (long: the head is tipped back) and the lifted face
 CG_tube(CG_quad(0,-262,0,-276,0,-290),32,skS,{edge:skE,sh:CG_dk(sk,0.25),core:10,d:2});
 const hx=0,hy=-314;for(const sg of [-1,1])CG_fill(CG_P(P=>P.ellipse(hx+sg*35,hy-2,7,11,0,0,7)),sk,{...o,d:1.5,lw:1.3});
 const face=CG_face(hx,hy,35,37,1.02);CG_fill(face,sk,{...o,d:5,hl:[hx-14,hy-16,10,6,0.2]});
 g.save();g.clip(face);g.fillStyle=C_c(C_mx(C_col(sk),C_BK,0.24),0.55);g.beginPath();g.ellipse(hx,hy+42,30,12,0,0,7);g.fill();g.restore();
 CG_eyes(hx,hy-6,14,'happy',0.78,'#20120A');CG_brows(hx,hy-17,14,'#EDEDF0',0.7,2);CG_nose(hx+1,hy+6,CG_dk(sk,0.35),0.7);CG_blush(hx,hy+8,22,0.7,0.35);
 CG_fill(CG_P(P=>{P.moveTo(hx,hy+15);P.bezierCurveTo(hx-8,hy+11,hx-19,hy+12,hx-22,hy+21);P.quadraticCurveTo(hx-11,hy+17,hx,hy+20);P.quadraticCurveTo(hx+11,hy+17,hx+22,hy+21);P.bezierCurveTo(hx+19,hy+12,hx+8,hy+11,hx,hy+15)}),'#F4F4F6',{edge:'#A9A9B4',d:1,lw:1.1});
 CG_mouth(hx,hy+24,'open',0.62);
 const tb=CG_P(P=>{P.moveTo(hx-41,hy-14);P.bezierCurveTo(hx-48,hy-68,hx+48,hy-68,hx+41,hy-14);P.quadraticCurveTo(hx,hy-30,hx-41,hy-14)});
 CG_fill(tb,'#FF9B2E',{d:4,hl:[hx-16,hy-46,14,6,0.3]});g.save();g.clip(tb);CG_line('rgba(160,70,0,0.45)',2.2);for(let k=0;k<4;k++){g.beginPath();g.moveTo(hx-46,hy-22-k*10);g.quadraticCurveTo(hx,hy-44-k*9,hx+46,hy-26-k*11);g.stroke()}g.restore()}
const CG_FARMER=()=>CG_cache('farmer',-150,-420,300,430,2.4,CG_farmerArt);

function CG_potArt(){const t='#C9643A',tS=CG_dk(t,0.18),tE=CG_dk(t,0.4);
 const body=CG_P(P=>{P.moveTo(-17,-40);P.bezierCurveTo(-50,-36,-52,30,0,40);P.bezierCurveTo(52,30,50,-36,17,-40);P.closePath()});CG_fill(body,t,{edge:tE,sh:tS,d:6,hl:[-18,-16,9,16,0.32]});
 g.save();g.clip(body);CG_line('#FFF2DC',3);g.beginPath();for(let k=0;k<=10;k++){const x=-46+k*9.2,y=-4+(k%2?7:-1);k?g.lineTo(x,y):g.moveTo(x,y)}g.stroke();g.fillStyle='#FFF2DC';for(let k=0;k<6;k++){g.beginPath();g.arc(-30+k*12,14,2.2,0,7);g.fill()}g.restore();
 CG_fill(CG_P(P=>P.ellipse(0,-42,24,8,0,0,7)),CG_dk(t,0.05),{edge:tE,d:2,lw:1.4});g.fillStyle='#4A1E0E';g.beginPath();g.ellipse(0,-42,17,4.6,0,0,7);g.fill();g.fillStyle='rgba(120,190,255,0.75)';g.beginPath();g.ellipse(0,-41,13,3,0,0,7);g.fill()}
const CG_POT=()=>CG_cache('pot',-60,-56,120,104,3,CG_potArt);
function CG_womanArt(){const sk='#C2865A',skS=CG_dk(sk,0.15),skE=CG_dk(sk,0.36),o={edge:skE,sh:skS},SA='#E2437F',BO='#FFC83A',BL='#16A38A';
 for(const sg of [-1,1])CG_fill(CG_P(P=>P.ellipse(sg*14,-5,14,7,0,0,7)),sk,{...o,d:1.5,lw:1.3});
 const skirt=CG_P(P=>{P.moveTo(-34,-168);P.lineTo(34,-168);P.bezierCurveTo(44,-110,54,-50,57,-9);P.quadraticCurveTo(0,1,-57,-9);P.bezierCurveTo(-54,-50,-44,-110,-34,-168);P.closePath()});
 CG_fill(skirt,SA,{d:6,hl:[-24,-110,10,40,0.18]});g.save();g.clip(skirt);CG_line(CG_dk(SA,0.25),2);for(let k=0;k<4;k++){g.beginPath();g.moveTo(-6+k*7,-150);g.quadraticCurveTo(-8+k*9,-80,-14+k*11,-6);g.stroke()}
 CG_line(BO,11);g.beginPath();g.moveTo(-62,-12);g.quadraticCurveTo(0,-2,62,-12);g.stroke();CG_line(CG_dk(BO,0.35),1.6);g.beginPath();g.moveTo(-62,-18);g.quadraticCurveTo(0,-8,62,-18);g.stroke();
 g.fillStyle='#FFFFFF';for(let k=0;k<12;k++){g.beginPath();g.arc(-52+k*9.4,-7+Math.abs(k-5.5)*0.25,1.5,0,7);g.fill()}g.restore();
 CG_fill(CG_P(P=>{P.moveTo(-30,-204);P.lineTo(30,-204);P.lineTo(34,-166);P.lineTo(-34,-166);P.closePath()}),sk,{...o,d:3});
 const bl=CG_P(P=>{P.moveTo(-22,-252);P.quadraticCurveTo(-42,-250,-44,-232);P.lineTo(-38,-200);P.lineTo(38,-200);P.lineTo(44,-232);P.quadraticCurveTo(42,-250,22,-252);P.quadraticCurveTo(0,-236,-22,-252);P.closePath()});CG_fill(bl,BL,{d:4});
 // arms up to the pot (above her, a little to the right)
 CG_tube(CG_quad(-38,-244,-62,-286,-14,-350),17,sk,{...o,core:6,d:2});CG_tube(CG_quad(38,-244,80,-286,72,-366),17,sk,{...o,core:6,d:2});
 for(const [x,y] of [[-38,-238],[38,-238]])CG_fill(CG_P(P=>P.ellipse(x,y,13,14,0,0,7)),BL,{d:2,lw:1.4});
 CG_line('#FFD54A',3.4);for(const [x,y,a] of [[-22,-336,-0.9],[70,-350,0.1]]){g.save();g.translate(x,y);g.rotate(a);for(let k=0;k<2;k++){g.beginPath();g.ellipse(k*5,0,4,9,0,0,7);g.stroke()}g.restore()}
 // the pallu across her chest from the hip to the shoulder, gold-edged
 const pa=CG_P(P=>{P.moveTo(30,-168);P.quadraticCurveTo(12,-214,-26,-254);P.lineTo(-44,-246);P.quadraticCurveTo(-50,-222,-40,-204);P.quadraticCurveTo(-2,-178,6,-160);P.closePath()});
 CG_fill(pa,SA,{d:4});CG_line(BO,5);g.beginPath();g.moveTo(30,-168);g.quadraticCurveTo(12,-214,-26,-254);g.stroke();
 // head tilted up a little
 const hx=2,hy=-286;CG_tube(CG_quad(hx,-250,hx,-258,hx,-268),22,skS,{edge:skE,sh:CG_dk(sk,0.25),core:8,d:2});
 CG_fill(CG_P(P=>P.arc(hx-28,hy-30,17,0,7)),'#24160E',{d:2});C_flower(hx-40,hy-38,8,{t:0,tint:false,col:'#FFFFFF',col2:'#E8E4D8',petals:5});C_flower(hx-22,hy-44,6,{t:0,tint:false,col:'#FFFFFF',col2:'#E8E4D8',petals:5});
 CG_fill(CG_P(P=>P.ellipse(hx,hy-6,36,38,0,0,7)),'#24160E',{d:3});
 for(const sg of [-1,1]){CG_fill(CG_P(P=>P.ellipse(hx+sg*33,hy+2,6,9,0,0,7)),sk,{...o,d:1,lw:1.2});CG_fill(CG_P(P=>P.arc(hx+sg*34,hy+14,3.6,0,7)),'#FFC83A',{edge:'#A8730E',d:1,lw:1})}
 const face=CG_face(hx,hy+2,32,34,0.95);CG_fill(face,sk,{...o,d:5,hl:[hx-12,hy-14,9,6,0.2]});
 CG_eyes(hx,hy-6,13,'happy',0.74,'#22140C');CG_brows(hx,hy-16,13,'#24160E',0.64,2);CG_nose(hx+1,hy+6,CG_dk(sk,0.33),0.62);CG_blush(hx,hy+10,20,0.68,0.42);CG_mouth(hx,hy+17,'teeth',0.62);
 g.fillStyle='#E0232E';g.beginPath();g.arc(hx,hy-24,2.8,0,7);g.fill();
 for(const sg of [-1,1])CG_fill(CG_P(P=>{P.moveTo(hx,hy-34);P.quadraticCurveTo(hx+sg*34,hy-36,hx+sg*33,hy+6);P.quadraticCurveTo(hx+sg*24,hy-22,hx,hy-27);P.closePath()}),'#24160E',{d:2});
 // the clay pot, tipped toward the sky, held from both sides
 g.save();g.translate(30,-388);g.rotate(-0.42);g.drawImage(CG_POT().c,-60,-56,120,104);g.restore();
 for(const [x,y,a] of [[-16,-356,-0.5],[70,-372,0.4]]){g.save();g.translate(x,y);g.rotate(a);CG_fill(CG_P(P=>P.ellipse(0,0,10,13,0,0,7)),sk,{...o,d:2,lw:1.2});CG_line(skE,1.1);for(let k=0;k<3;k++){g.beginPath();g.moveTo(-6+k*5,-10);g.lineTo(-6+k*5,-4);g.stroke()}g.restore()}}
const CG_WOMAN=()=>CG_cache('woman',-120,-460,240,470,2.4,CG_womanArt);
const CG_POTMOUTH=[30+Math.sin(0.42)*42,-388-Math.cos(0.42)*42];
function CG_childArt(){const sk='#D49C70',skS=CG_dk(sk,0.15),skE=CG_dk(sk,0.36),o={edge:skE,sh:skS},CO='#FFCB2B',coE='#B5830A';
 for(const sg of [-1,1])CG_fill(CG_P(P=>P.roundRect(sg*24-15,-32,30,32,[10,10,6,6])),'#E8413A',{d:3,hl:[sg*24-6,-24,4,8,0.35]});
 const coat=CG_P(P=>{P.moveTo(-36,-126);P.bezierCurveTo(-58,-110,-66,-70,-60,-30);P.quadraticCurveTo(-46,-20,-30,-28);P.quadraticCurveTo(-16,-36,0,-28);P.quadraticCurveTo(16,-36,30,-28);P.quadraticCurveTo(46,-20,60,-30);P.bezierCurveTo(66,-70,58,-110,36,-126);P.closePath()});
 CG_fill(coat,CO,{edge:coE,d:6,hl:[-26,-92,10,22,0.32]});CG_line(CG_dk(CO,0.25),2);g.beginPath();g.moveTo(0,-120);g.lineTo(0,-34);g.stroke();
 for(let k=0;k<3;k++)CG_fill(CG_P(P=>P.roundRect(-7,-108+k*24,14,6,3)),'#2F6FD6',{d:1,lw:1});
 for(const sg of [-1,1]){CG_tube(CG_quad(sg*40,-114,sg*62,-64,sg*30,-8),24,CO,{edge:coE,core:8,d:2});CG_fill(CG_P(P=>P.ellipse(sg*26,-3,12,10,0,0,7)),sk,{...o,d:2,lw:1.3})}
 const hx=0,hy=-152;CG_fill(CG_P(P=>P.ellipse(hx,hy+2,47,47,0,0,7)),CO,{edge:coE,d:4});
 const face=CG_face(hx,hy+6,33,34,0.95);CG_fill(face,sk,{...o,d:5,hl:[hx-12,hy-10,9,6,0.22]});
 CG_fill(CG_P(P=>{P.moveTo(hx-34,hy-2);P.bezierCurveTo(hx-36,hy-36,hx+36,hy-36,hx+34,hy-2);P.quadraticCurveTo(hx+18,hy-16,hx+8,hy-12);P.quadraticCurveTo(hx-6,hy-22,hx-16,hy-12);P.quadraticCurveTo(hx-28,hy-14,hx-34,hy-2)}),'#20140C',{d:2});
 CG_line(CG_dk(CO,0.18),6);g.beginPath();g.ellipse(hx,hy+4,40,41,0,Math.PI*1.04,Math.PI*1.96);g.stroke();
 CG_eyes(hx,hy+2,13,'open',0.8,'#1E120A');CG_blush(hx,hy+15,21,0.75,0.5);CG_mouth(hx,hy+21,'open',0.55);
 g.fillStyle=C_c(CG_dk(sk,0.25),0.6);for(const [x,y] of [[-16,10],[-12,13],[13,11],[17,14]]){g.beginPath();g.arc(hx+x,hy+y,1.1,0,7);g.fill()}}
const CG_CHILD=()=>CG_cache('child',-90,-210,180,215,2.6,CG_childArt);
// the paper boat (drawn live, it bobs)
function CG_boat(x,y,s,rot){g.save();g.translate(x,y);g.rotate(rot);g.scale(s,s);
 g.fillStyle='rgba(30,60,110,0.18)';g.beginPath();g.ellipse(0,13,34,5,0,0,7);g.fill();
 const hull=CG_P(P=>{P.moveTo(-36,-2);P.lineTo(36,-2);P.lineTo(24,12);P.lineTo(-24,12);P.closePath()});CG_fill(hull,'#FFFFFF',{edge:'#7C93B4',sh:'#D2DDEB',d:2,lw:1.4});
 CG_fill(CG_P(P=>{P.moveTo(-17,-2);P.lineTo(0,-30);P.lineTo(0,-2);P.closePath()}),'#F4F7FC',{edge:'#7C93B4',d:1,lw:1.3});CG_fill(CG_P(P=>{P.moveTo(0,-30);P.lineTo(17,-2);P.lineTo(0,-2);P.closePath()}),'#D6E1EF',{edge:'#7C93B4',d:1,lw:1.3});
 CG_line('rgba(124,147,180,0.8)',1.2);g.beginPath();g.moveTo(-24,12);g.lineTo(-30,-2);g.moveTo(24,12);g.lineTo(30,-2);g.stroke();g.restore()}

// ---------------------------------------------------------------------------------------------------------------------
// THE SUNRISE PENGUIN: chubby navy body, cream belly, glossy eyes, blue bucket hat with a daisy, orange feet; the left
// flipper waves (live), the right holds the stick of an orange sign. Origin = between the feet.
// ---------------------------------------------------------------------------------------------------------------------
const CG_PG={nv:'#25314F',nvE:'#121A2E',wh:'#FFFAF0',whS:'#D9E1EE',or:'#FF9A1F',orS:'#E57512',orE:'#9A4A08',hat:'#3A93F0',hatE:'#174A96',band:'#1C55A8'};
function CG_pengArt(){const C=CG_PG;
 for(const sg of [-1,1])CG_fill(CG_P(P=>P.ellipse(sg*34,-8,30,12,sg*0.15,0,7)),C.or,{edge:C.orE,sh:C.orS,d:2,hl:[sg*30,-14,10,3,0.35]});
 const body=CG_P(P=>{P.moveTo(0,-270);P.bezierCurveTo(70,-270,106,-190,102,-110);P.bezierCurveTo(100,-40,62,-8,0,-8);P.bezierCurveTo(-62,-8,-100,-40,-102,-110);P.bezierCurveTo(-106,-190,-70,-270,0,-270);P.closePath()});
 CG_fill(body,C.nv,{edge:C.nvE,sh:'#18213A',d:12,hl:[-50,-200,20,48,0.14]});
 g.save();g.clip(body);g.fillStyle='rgba(255,170,90,0.28)';g.beginPath();g.ellipse(96,-150,22,90,0.1,0,7);g.fill();g.restore();     // warm sunrise rim
 const bel=CG_P(P=>{P.moveTo(0,-212);P.bezierCurveTo(14,-238,54,-242,64,-206);P.bezierCurveTo(72,-180,66,-160,62,-150);P.bezierCurveTo(80,-110,72,-38,0,-20);P.bezierCurveTo(-72,-38,-80,-110,-62,-150);P.bezierCurveTo(-66,-160,-72,-180,-64,-206);P.bezierCurveTo(-54,-242,-14,-238,0,-212);P.closePath()});
 CG_fill(bel,C.wh,{edge:'#A9B4CA',sh:C.whS,d:9});
 g.save();g.clip(bel);g.fillStyle='rgba(255,196,130,0.22)';g.beginPath();g.ellipse(40,-90,40,80,0,0,7);g.fill();g.restore();
 CG_eyes(0,-198,27,'open',1.55,'#1A1420');CG_blush(0,-170,46,1.05,0.5);
 const bk=CG_P(P=>{P.moveTo(-19,-182);P.quadraticCurveTo(0,-195,19,-182);P.quadraticCurveTo(11,-160,0,-157);P.quadraticCurveTo(-11,-160,-19,-182);P.closePath()});CG_fill(bk,C.or,{edge:C.orE,sh:C.orS,d:2,hl:[-5,-183,6,3,0.55]});
 CG_line(C.orE,1.4);g.beginPath();g.moveTo(-14,-176);g.quadraticCurveTo(0,-172,14,-176);g.stroke();
 // right flipper (viewer left) raised to the sign stick
 CG_fill(CG_P(P=>{P.moveTo(-88,-160);P.quadraticCurveTo(-130,-176,-140,-222);P.quadraticCurveTo(-112,-214,-80,-186);P.closePath()}),C.nv,{edge:C.nvE,d:3});
 // the hat
 CG_fill(CG_P(P=>P.ellipse(0,-254,96,21,-0.06,0,7)),'#2F86E6',{edge:C.hatE,d:3});
 CG_fill(CG_P(P=>{P.moveTo(-62,-258);P.bezierCurveTo(-64,-322,64,-322,62,-258);P.closePath()}),C.hat,{edge:C.hatE,d:6,hl:[-24,-298,16,8,0.32]});
 CG_fill(CG_P(P=>{P.moveTo(-62,-266);P.quadraticCurveTo(0,-280,62,-266);P.lineTo(62,-256);P.quadraticCurveTo(0,-270,-62,-256);P.closePath()}),C.band,{d:1,lw:1.2});
 C_flower(40,-266,13,{t:0,tint:false,col:'#FFFFFF',col2:'#E6E6EE',petals:6})}
const CG_PENG=()=>CG_cache('peng',-160,-340,310,350,2.4,CG_pengArt);
function CG_flipper(x,y,a){const C=CG_PG;g.save();g.translate(x,y);g.rotate(a);CG_fill(CG_P(P=>{P.moveTo(-6,-14);P.quadraticCurveTo(40,-30,62,-70);P.quadraticCurveTo(52,-24,4,14);P.closePath()}),C.nv,{edge:C.nvE,d:3});g.restore()}
function CG_signArt(){CG_tube(CG_quad(0,0,0,70,0,150),11,'#B87842',{edge:'#6E4220',core:4,d:1.5});
 const B=CG_P(P=>P.roundRect(-118,-74,236,128,18));CG_fill(B,'#FF8A1F',{edge:'#A44E0C',sh:'#E06C10',d:7});
 g.save();g.clip(B);const gr=g.createLinearGradient(0,-74,0,54);gr.addColorStop(0,'rgba(255,214,140,0.55)');gr.addColorStop(0.5,'rgba(255,214,140,0)');g.fillStyle=gr;g.fillRect(-120,-76,240,130);
 CG_line('rgba(170,80,10,0.25)',2);for(let k=0;k<4;k++){g.beginPath();g.moveTo(-118,-46+k*28);g.quadraticCurveTo(0,-52+k*28,118,-44+k*28);g.stroke()}g.restore();
 for(const [x,y] of [[-102,-58],[102,-58]]){g.fillStyle='#8A4A12';g.beginPath();g.arc(x,y,4,0,7);g.fill()}}
const CG_SIGN=()=>CG_cache('sign',-126,-82,252,240,2.6,CG_signArt);
function CG_rockArt(){const P=CG_P(P=>{P.moveTo(-230,60);P.bezierCurveTo(-210,-10,-150,-46,-70,-52);P.bezierCurveTo(10,-60,120,-50,170,-20);P.bezierCurveTo(220,6,240,40,236,60);P.lineTo(236,320);P.lineTo(-230,320);P.closePath()});
 const gr=g.createLinearGradient(0,-60,0,200);gr.addColorStop(0,'#7A4A6A');gr.addColorStop(0.5,'#4E2C4C');gr.addColorStop(1,'#2E1A34');g.fillStyle=gr;g.fill(P);
 g.save();g.clip(P);g.strokeStyle='rgba(255,170,110,0.75)';g.lineWidth=9;g.beginPath();g.moveTo(-60,-50);g.bezierCurveTo(30,-60,130,-46,176,-16);g.bezierCurveTo(214,8,232,36,234,60);g.stroke();
 g.fillStyle='rgba(255,190,130,0.22)';g.beginPath();g.ellipse(80,-20,120,26,0.08,0,7);g.fill();
 g.fillStyle='rgba(20,10,30,0.25)';for(const [x,y,r] of [[-120,30,26],[60,40,32],[150,80,22],[-40,110,40]]){g.beginPath();g.ellipse(x,y,r,r*0.5,0,0,7);g.fill()}
 g.fillStyle='#5DA84A';for(const [x,y] of [[-150,-24],[-110,-38],[-170,-6]]){g.beginPath();g.ellipse(x,y,22,8,-0.3,0,7);g.fill()}g.restore();
 g.strokeStyle='#2A1630';g.lineWidth=2;g.stroke(P)}
const CG_ROCK=()=>CG_cache('rock',-240,-70,480,400,1.8,CG_rockArt);

// ---------------------------------------------------------------------------------------------------------------------
// THE MOSAIC HEAD: a profile made of hundreds of small colour tiles (pieces of the portraits); they fly in from the whole
// frame and settle; "lit from within" warms them to gold from the centre of the head outward
// ---------------------------------------------------------------------------------------------------------------------
const CG_HSTEP=10.5;
let CG_HT_=null;
function CG_HT(){if(CG_HT_)return CG_HT_;const c=mkC(10,10).getContext('2d'),r=RNG(4242),out=[];
 const pal=['#FFC39E','#A6D0FA','#FFD45E','#A7E2C4','#CBB3F6','#FFB6D0','#FFAA90','#92DCD5','#B6D8FF','#FFC27A','#CDE784','#E2437F','#79AEEE','#2F7BEA','#17A398','#FF8A1F','#3DB35A','#D49A6C','#C2875C','#9B5BD6'];
 for(let y=-160;y<=236;y+=CG_HSTEP)for(let x=-160;x<=140;x+=CG_HSTEP){if(!c.isPointInPath(W_HEADP,x,y))continue;
  const n=n2(x*0.018+3.1,y*0.018+7.7,5)*0.5+0.5,pi=Math.floor((n*0.75+r()*0.25)*pal.length)%pal.length;let col=C_col(pal[pi]);
  const sh=(x+y)/420;col=C_mx(col,sh<0?C_WH:[30,40,90],Math.abs(sh)*0.28);col=C_mx(col,r()<0.5?C_WH:C_BK,r()*0.08);
  const a=r()*6.283,d=420+r()*500;out.push({x,y,c:col,s:C_c(col),ox:Math.cos(a)*d,oy:Math.sin(a)*d*1.2,rot:(r()-0.5)*3,h:r(),cv:(r()-0.5)*160,dg:Math.hypot(x+6,y+46)})}
 return CG_HT_=out}
const CG_GOLDC=[255,198,84];
function CG_head(t,cx,cy,s,p,lit=0){const T=CG_HT(),ts=CG_HSTEP*0.84,ga=g.globalAlpha;const set=cl((p-0.82)/0.18);
 if(lit>0){g.save();g.globalCompositeOperation='screen';glow(cx-10*s,cy-46*s,250*s*(0.6+0.4*lit),'255,200,110',0.55*lit,0.3);g.restore()}
 g.save();g.translate(cx,cy);g.scale(s,s);
 if(set>0){const bg=g.createLinearGradient(0,110,0,190);bg.addColorStop(0,`rgba(46,54,98,${0.55*set})`);bg.addColorStop(1,'rgba(46,54,98,0)');g.fillStyle=bg;g.fill(W_HEADP)}
 for(const q of T){const k=eio(cl((p-q.h*0.42)/0.58));if(k<=0.001)continue;const fa=cl((196-q.y)/70);if(fa<=0.01)continue;
  let col=q.s;if(lit>0){const m=cl(lit*1.35-q.dg/250);if(m>0)col=C_c(C_mx(q.c,CG_GOLDC,m*0.3))}
  g.fillStyle=col;g.globalAlpha=ga*fa;
  if(k>=0.999){g.fillRect(q.x-ts/2,q.y-ts/2,ts,ts)}
  else{const u=1-k,px=q.x+q.ox*u+Math.sin(k*Math.PI)*q.cv*0.5,py=q.y+q.oy*u-Math.sin(k*Math.PI)*q.cv*0.3,z=ts*(1+1.6*u);g.save();g.translate(px,py);g.rotate(q.rot*u);g.fillRect(-z/2,-z/2,z,z);g.restore()}}
 g.globalAlpha=ga;
 if(set>0){g.save();g.clip(W_HEADP);const gr=g.createLinearGradient(-120,-150,120,200);gr.addColorStop(0,`rgba(255,255,255,${0.22*set})`);gr.addColorStop(0.55,'rgba(255,255,255,0)');gr.addColorStop(0.9,`rgba(20,30,80,${0.18*set})`);gr.addColorStop(1,'rgba(20,30,80,0)');g.fillStyle=gr;g.fillRect(-170,-170,330,360);
  if(lit>0){g.globalCompositeOperation='screen';const lg=g.createRadialGradient(-6,-46,4,-6,-46,210);lg.addColorStop(0,`rgba(255,214,120,${0.85*lit})`);lg.addColorStop(0.45,`rgba(255,180,70,${0.4*lit})`);lg.addColorStop(1,'rgba(255,170,60,0)');g.fillStyle=lg;g.fillRect(-170,-170,330,360);g.globalCompositeOperation='source-over'}g.restore();
  // painted features over the tiles: eye with a catch-light, brow, nostril, mouth, ear
  g.globalAlpha=ga*set;const ink='#2A1838';
  const eye=CG_P(P=>{P.moveTo(58,-38);P.quadraticCurveTo(71,-50,86,-39);P.quadraticCurveTo(73,-30,58,-38);P.closePath()});g.fillStyle='#FFFDF6';g.fill(eye);g.save();g.clip(eye);
  g.fillStyle=lit>0.3?'#B9741E':'#5A3A26';g.beginPath();g.arc(79,-39,6.4,0,7);g.fill();g.fillStyle='#1A1020';g.beginPath();g.arc(80,-39,3.2,0,7);g.fill();g.restore();
  g.fillStyle='#FFFFFF';g.beginPath();g.arc(77.6,-41.4,1.6,0,7);g.fill();
  CG_line(ink,2.6);g.beginPath();g.moveTo(56,-40);g.quadraticCurveTo(71,-53,88,-40);g.stroke();CG_line(ink,1.6);for(const [a,b] of [[80,-47],[85,-44],[74,-49]]){g.beginPath();g.moveTo(a,b);g.lineTo(a+4,b-5);g.stroke()}
  CG_line(ink,4);g.beginPath();g.moveTo(52,-60);g.quadraticCurveTo(72,-68,92,-58);g.stroke();
  CG_line(ink,2);g.beginPath();g.moveTo(118,12);g.quadraticCurveTo(112,16,108,12);g.stroke();g.beginPath();g.moveTo(108,40);g.quadraticCurveTo(100,43,94,40);g.stroke();
  g.beginPath();g.arc(-14,-6,15,-1.1,1.9);g.stroke();g.beginPath();g.arc(-12,-6,7,-0.9,1.6);g.stroke();
  if(lit>0){g.globalAlpha=ga;C_sparkle(78,-42,7*lit,lit,{col:'255,214,120',edge:'rgba(120,64,0,0.6)',small:false})}}
 g.restore()}

// ---------------------------------------------------------------------------------------------------------------------
// MOSAIC tiles (the template's mosaic() grid, painted with the portrait cards)
// ---------------------------------------------------------------------------------------------------------------------
const CG_tile=(x,y,w,h,i)=>{const o=CG_PORT(i);g.drawImage(o.c,x,y,w,h)};
const CG_TILES=Array(12).fill(CG_tile);
function CG_mosaic(t,c,o={}){Wbg(t,0.9,{moon:false});const sp=o.blur?(1-eo5(c.k/0.8)):0;
 if(sp>0.08)g.filter=`blur(${(sp*3.2*SC).toFixed(1)}px)`;mosaic(t,c,o.tiles||CG_TILES,{tw:220,th:290,cols:3,...(o.m||{})});g.filter='none'}

// =====================================================================================================================
// SCENES
// =====================================================================================================================
// a1_gratitude (22.5, C, night): a glowing drop; inside it, warm and small, the grateful girl among leaves; the FIRST gold
SCENES.a1_gratitude=(t,c)=>{Wbg(t,1.05,{moon:false});const tg=WT('gratitude',22),gk=eo(cl((t-tg)/0.55)),pk=spr(c.k+0.06,9,0.55),x=360,y=540,s=186*(0.9+0.1*pk);
 g.save();g.globalCompositeOperation='screen';glow(x,y,s*2.8,'255,196,110',0.42*gk,0.3);glow(x,y,s*1.4,'255,226,170',0.3*gk,0.4);g.restore();
 CG_glass(x,y,s,()=>{const gr=g.createLinearGradient(0,y-s*1.25,0,y+s*0.85);gr.addColorStop(0,'#FFEFC6');gr.addColorStop(0.5,'#FFD08E');gr.addColorStop(1,'#F7A27A');g.fillStyle=gr;g.fillRect(x-s,y-s*1.3,s*2,s*2.2);
  C_rays(x+s*0.6,y-s*1.1,{ang:2.1,spread:0.9,n:5,len:s*2.4,a:0.35,t});
  C_flower(x-s*0.62,y-s*0.08,s*0.12,{t,stem:s*0.8,col:'#B983E6'});C_flower(x+s*0.6,y-s*0.22,s*0.11,{t,stem:s*0.9,col:'#C795F0'});
  CG_blit(CG_GIRL(),x,y+s*0.5,s*0.0032*(1+0.01*Math.sin(t*2)));
  C_bush(x-s*0.6,y+s*0.95,s*0.62,{t,seed:21,n:5,tint:false});C_bush(x+s*0.62,y+s*0.95,s*0.6,{t,seed:22,n:5,tint:false});
  if(gk<1){g.fillStyle=`rgba(30,60,150,${0.62*(1-gk)})`;g.fillRect(x-s,y-s*1.3,s*2,s*2.2)}},{rim:`rgba(${gk>0.5?'150,90,20':'24,56,128'},0.55)`,edge:gk>0.5?'rgba(140,84,10,0.7)':'rgba(26,64,138,0.6)'});
 CG_spark(x+s*0.5,y-s*0.5,22*eo(cl((t-tg)/0.35)),gk,t);grain(t,0.04)};

// a4_gather (105.4, C): coloured specks (gold sparkles, purple petals, little drops, leaves) spiral together into one gold drop
SCENES.a4_gather=(t,c)=>{Wbg(t,1,{moon:false});const cx=360,cy=520,r=RNG(611),kD=eo(cl((c.k-0.38)/0.55));
 g.save();g.globalCompositeOperation='screen';glow(cx,cy,70+220*kD,'255,210,120',0.22+0.3*kD,0.3);g.restore();
 for(let i=0;i<92;i++){const a0=r()*6.283,dx=170+r()*360,del=r()*0.36,ty=r(),sz=r(),spin=r()<0.5?1:-1,ph=r()*6;
  const dy=Math.sin(a0)>0?Math.min(dx*0.8,215):dx*0.85,k=eio(cl((c.k-del*0.45)/(0.9-del*0.45)));if(k>=0.985)continue;
  const an=a0+spin*k*1.5,rr=1-k,x=cx+Math.cos(an)*dx*rr,y=cy+Math.sin(an)*dy*rr+Math.sin(t*3+ph)*4*rr,sc=(0.45+0.55*rr)*1.45,al=cl(c.k*8)*cl((1-k)*6);
  if(ty<0.42)C_sparkle(x,y,(6+sz*8)*sc,al,{col:'255,204,90',edge:'rgba(120,66,0,0.65)',rot:t*2+ph});
  else if(ty<0.68){g.save();g.globalAlpha*=al;g.translate(x,y);g.rotate(t*2.5*spin+ph);const pc=sz<0.5?['#C995F2','#8A4FC8']:['#FFA6CF','#D9558E'];const pg=g.createLinearGradient(0,-8*sc,0,8*sc);pg.addColorStop(0,pc[0]);pg.addColorStop(1,pc[1]);g.fillStyle=pg;g.beginPath();g.ellipse(0,0,(5+sz*4)*sc*1.6,(5+sz*4)*sc,0,0,7);g.fill();g.strokeStyle='rgba(80,30,110,0.45)';g.lineWidth=1;g.stroke();g.restore()}
  else if(ty<0.86)B_drop(x,y,(4+sz*4)*sc,al,false);
  else C_leaf(x,y,(16+sz*10)*sc,t*2*spin+ph,{t,a:al,col:'#62C44E',col2:'#2F8A3A'})}
 CG_goldDrop(cx,cy,40*kD*(1+0.06*Math.sin(t*9)*kD),1);if(kD>0.5)CG_spark(cx+26,cy-30,12*kD,kD,t);grain(t,0.04)};

// a4_voice (107.1, C): the speaking drop forms on a leaf tip in the warm afternoon; it shows the world upside down; on
// "rain", "says" and "that" gold sound-rings ripple out of it
const CG_vdrop=(t,c)=>{const k=eo(cl(c.k/0.9)),wob=Math.sin(c.k*18)*Math.exp(-c.k*3)*0.06,s=lerp(22,92,k);return {s,sx:s*(1-wob),sy:s*(1+wob)}};
SCENES.a4_voice=(t,c)=>{Wbg(t,0.95,{moon:false});C_corners(t);const sw=Math.sin(t*1.2)*0.012,tipX=368,tipY=404;
 // the branch and its leaves from the top-left; the last leaf's tip holds the drop
 g.save();g.translate(tipX,tipY);g.rotate(sw);g.translate(-tipX,-tipY);
 CG_line('#5C7A2E',9);g.beginPath();g.moveTo(-30,236);g.quadraticCurveTo(140,250,250,322);g.stroke();CG_line('#7FA040',4);g.stroke();
 C_leaf(40,244,120,-0.9,{t,col:'#5CBF4E',col2:'#2F8A3A'});C_leaf(120,262,110,0.7,{t,col:'#4FB04A',col2:'#2A7A34'});C_leaf(170,280,100,-0.6,{t,col:'#6ACB55',col2:'#33903C'});
 C_leaf(232,328,158,0.5,{t,col:'#58C04C',col2:'#2B8536',w:0.36});g.restore();
 const D=CG_vdrop(t,c),dx=tipX+Math.sin(t*1.2)*1.5,dy=tipY+D.sy*1.25-6;
 // speaking rings
 for(const w of ['rain','says','that']){const tw=WT(w,107.9),u=t-tw;if(u>0&&u<1.1){for(let j=0;j<2;j++){const v=u-j*0.12;if(v<=0)continue;const R=D.s*1.15+v*210,al=(1-v/1.1)*0.85;
  g.save();g.lineWidth=5;g.strokeStyle=`rgba(255,255,255,${al*0.8})`;g.beginPath();g.ellipse(dx,dy,R,R*0.92,0,0,7);g.stroke();g.lineWidth=2.6;g.strokeStyle=`rgba(232,160,30,${al})`;g.stroke();g.restore()}}}
 g.save();g.translate(dx,dy);g.scale(D.sx/D.s,D.sy/D.s);g.translate(-dx,-dy);
 CG_glass(dx,dy,D.s,()=>{const s=D.s,gr=g.createLinearGradient(0,dy-s*1.25,0,dy+s*0.85);gr.addColorStop(0,'#3E9C46');gr.addColorStop(0.3,'#7CC65A');gr.addColorStop(0.46,'#FFE3A0');gr.addColorStop(0.7,'#9ED2F2');gr.addColorStop(1,'#5FA6E6');g.fillStyle=gr;g.fillRect(dx-s,dy-s*1.3,s*2,s*2.2);
  g.fillStyle='#2F8A3A';for(const [ox,oy,rr] of [[-0.5,-0.42,0.2],[-0.18,-0.5,0.14],[0.4,-0.44,0.18]]){g.beginPath();g.arc(dx+ox*s,dy+oy*s*1.6,rr*s,0,7);g.fill()}
  g.save();g.globalCompositeOperation='screen';glow(dx-s*0.42,dy+s*0.42,s*0.5,'255,226,150',0.8,0.3);g.restore()},{rim:'rgba(24,70,140,0.55)'});
 g.restore();
 CG_spark(dx+D.s*0.42,dy-D.s*0.36,9*cl(c.k/0.9),cl(c.k/0.9)*0.9,t);grain(t,0.04)};

// a4_humanity (123.84, C): people receiving the rain in a green field; ground at y~760 so the caption sits on the field
SCENES.a4_humanity=(t,c)=>{const S=CSKY(t);Wbg(t,0.95,{moon:false,hills:false});C_hills(t,690,{n:3,amp:46,trees:6,seed:7,flowers:0});
 const gr=g.createLinearGradient(0,690,0,1280);gr.addColorStop(0,C_c(C_tint('#62B848',t)));gr.addColorStop(0.35,C_c(C_tint('#3E9A3C',t)));gr.addColorStop(1,C_c(C_tint('#2A7A34',t)));g.fillStyle=gr;g.fillRect(-W,696,3*W,H*1.5);
 g.save();g.strokeStyle=C_c(C_tint('#7DCB5A',t),0.45);g.lineWidth=2;for(let i=-6;i<=6;i++){g.beginPath();g.moveTo(360+i*30,700);g.lineTo(360+i*190,1290);g.stroke()}g.restore();
 C_grass(-20,700,760,{t,h:14,seed:9,dens:0.7});C_puddle(372,752,236,32,t,{drops:4,seed:5});
 const sway=Math.sin(t*1.4)*0.012;
 g.save();g.translate(182,776);g.rotate(sway);CG_blit(CG_FARMER(),0,0,0.94);g.restore();
 g.save();g.translate(560,778);g.rotate(-sway*0.8);CG_blit(CG_WOMAN(),0,0,0.94);g.restore();
 CG_blit(CG_CHILD(),356,730,0.95);CG_boat(394,752+Math.sin(t*3.1)*2.2,0.9,Math.sin(t*2.3)*0.06);
 B_rain(t,120,57,1000,90,0.85,0);
 // drops fall into the pot's mouth and onto the farmer's palms
 const pm=[560+CG_POTMOUTH[0]*0.94,778+CG_POTMOUTH[1]*0.94];for(let i=0;i<3;i++){const u=((t*1.6+i/3)%1);B_drop(pm[0]+(i-1)*6,lerp(pm[1]-230,pm[1],u),5,cl(u*5)*cl((1-u)*8),false)}
 for(const [hx,i] of [[182-102,0],[182+102,1]]){const u=((t*1.3+i*0.5)%1);B_drop(hx,lerp(220,776-370*0.94,u),4.5,cl(u*5)*cl((1-u)*8),false)}
 // a warm catch-light on each in turn: "some" (farmer), "way" (child's boat), "other" (the pot)
 for(const [w,x,y] of [['some',182,436],['way',394,738],['other',pm[0],pm[1]-10]]){const tw=WT(w,123.9),u=t-tw;if(u>0)CG_spark(x,y,11*eo(cl(u/0.2)),cl(1-(u-0.6)/0.5),t)}
 grain(t,0.04)};

// a4_existence (141.04, F): the grateful girl among leaves and purple flowers; she glows gold from the heart; the spoken
// words in kinetic type above her, then the script "Be thankful · Be grateful"
SCENES.a4_existence=(t,c)=>{C_kinBg(t,{ly:380});const tg=WT('gratitude',140.9),gk=eo(cl((t-tg)/0.9)),rs=spr(c.k+0.04,8,0.7);
 C_flower(96,660,27,{t,stem:440,col:'#B983E6'});C_flower(626,612,25,{t,stem:480,col:'#C795F0'});C_flower(56,820,16,{t,stem:300,col:'#F49AC6'});C_flower(672,800,15,{t,stem:320,col:'#F49AC6'});
 const by=lerp(1040,962,rs)+Math.sin(t*1.7)*2.5;
 g.save();g.globalCompositeOperation='screen';glow(360,by-40,430*(0.55+0.45*gk),'255,204,110',0.5*gk,0.3);g.restore();
 CG_blit(CG_GIRL(),360,by,1+0.006*Math.sin(t*1.7));
 g.save();g.globalCompositeOperation='screen';glow(360,by+70,150*gk,'255,214,130',0.55*gk,0.35);g.restore();
 const r=RNG(141);for(let i=0;i<14;i++){const x=200+r()*320,sp=40+r()*50,ph=r(),u=((t-tg)*sp/300+ph)%1;if(t<tg)break;C_sparkle(x+Math.sin(t*2+i)*10,by+120-u*420,5+r()*5,gk*cl(Math.min(u*6,(1-u)*4)),{col:'255,204,90',edge:'rgba(120,66,0,0.6)',rot:t+i})}
 C_bush(80,1300,330,{t,seed:11,n:7});C_bush(650,1300,320,{t,seed:12,n:7});C_bush(360,1330,250,{t,seed:13,n:6});
 C_flower(178,1080,20,{t,col:'#B983E6'});C_flower(556,1100,18,{t,col:'#F49AC6'});
 Wkin(t,c,[['GRATITUDE','gratitude',1],['should','should',0],['be','be',0],['a','a',0],['part','part',0],['of','of',0],['human','human',0],['existence','existence',0]],[[0],[1,2,3,4,5],[6,7]],{bg:false,cy:382,big:92,small:46});
 const ts=WT('part',141.8);if(t>ts){g.save();g.globalCompositeOperation='screen';g.globalAlpha=cl((t-ts)/0.3);g.fillStyle='rgba(255,255,255,0.5)';g.filter=`blur(${14*SC}px)`;g.beginPath();g.ellipse(360,582,250,38,0,0,7);g.fill();g.restore()}
 C_dropIn('Be thankful · Be grateful',360,582,62,'#4A1C78',ts,t,{fam:FAM.script,wt:'400',stag:0.016,fall:16,stroke:['#FFFFFF',6],shadow:[10,0.3,2]})};

// the mosaic (156.72 C pull-back with motion blur; 159.47 X keeps panning)
SCENES.a5_mosaic=(t,c)=>{CG_mosaic(t,c,{blur:true});grain(t,0.04)};
SCENES.a5_mosaic2=(t,c)=>{CG_mosaic(t,{...c,k:c.k+2.75});grain(t,0.04)};
// a5_faces (170.36, C): the tiles wake from the overcast shade one by one; on "faces" each gets a gold catch-light
SCENES.a5_faces=(t,c)=>{const tf=WT('faces',170.3);
 CG_mosaic(t,{...c,k:c.k+5},{m:{z0:1.1},tiles:Array(12).fill((x,y,w,h,i)=>{CG_tile(x,y,w,h,i);const ord=hash(x*0.013+y*0.0071+3),lk=eo(cl((t-c.t0-ord*0.2)/0.16));
  if(lk<1){g.fillStyle=`rgba(40,50,88,${0.55*(1-lk)})`;g.fillRect(x,y,w,h)}
  const gk=cl((t-tf-ord*0.16)/0.14);if(gk>0){const sc=w/220,P=CG_PS[i],ex=x+110*sc,ey=y+124*sc,dx=(P.kid?19:21)*sc;
   g.save();g.globalCompositeOperation='screen';glow(ex,ey+10*sc,120*sc,'255,200,110',0.32*gk,0.3);g.restore();
   g.strokeStyle=`rgba(255,200,90,${0.9*gk})`;g.lineWidth=5;g.beginPath();g.roundRect(x+3,y+3,w-6,h-6,12);g.stroke();
   if(P.eyes==='open'){for(const sg of [-1,1])C_sparkle(ex+sg*dx-2*sc,ey-3*sc,5.5*sc*spr(t-tf-ord*0.16,14,0.5),gk,{col:'255,214,120',small:false})}
   else C_sparkle(ex-36*sc,ey-26*sc,9*sc*spr(t-tf-ord*0.16,14,0.5),gk,{col:'255,214,120',edge:'rgba(120,64,0,0.6)'})}})});grain(t,0.04)};

// the head made of the people's tiles (161.03 forms; 161.96 close on the eye; 164.36 X lit from within)
SCENES.a5_head=(t,c)=>{Wbg(t,0.95,{moon:false});CG_head(t,340,500,1.6,eo(cl(c.k/0.88)),0);grain(t,0.04)};
SCENES.a5_head_close=(t,c)=>{Wbg(t,0.95,{moon:false});const z=1+0.04*eo(cl(c.k/1.2));CG_head(t,236,628,3.0*z,0.9+0.1*eo(cl(c.k/0.6)),0.12);grain(t,0.04)};
SCENES.a5_head2=(t,c)=>{Wbg(t,0.9,{moon:false});const tb=WT('because',164.2),k=eo(cl((t-tb)/1.15));CG_head(t,340,520,1.6,1,k);
 if(k>0.2){const r=RNG(52);for(let i=0;i<10;i++){const a=r()*6.28,d=60+r()*170,u=((t-tb)*0.6+r())%1;C_sparkle(330+Math.cos(a)*d,440+Math.sin(a)*d*0.8-u*40,4+r()*5,k*cl(Math.min(u*5,(1-u)*4)),{col:'255,204,90',edge:'rgba(120,66,0,0.6)'})}}grain(t,0.04)};

// hands passing a gold spark (166.08 / 167.22), and giving the drop back (173.26 X)
const CG_HA=[188,652],CG_HB=[532,652],CG_HS=1;
function CG_handsBg(t){Wbg(t,0.9,{moon:false,ly:600});g.save();g.globalCompositeOperation='screen';glow(360,600,330,'255,236,200',0.25,0.35);g.restore()}
function CG_twoHands(t,bLift=0,aLift=0){CG_putHand(0,CG_HA[0],CG_HA[1]+Math.sin(t*1.6)*2-aLift,CG_HS,1);CG_putHand(1,CG_HB[0],CG_HB[1]+Math.sin(t*1.6+1)*2-bLift,CG_HS,-1)}
const CG_sparkU=t=>{const ta=WT('a',166.4);return eio(cl((t-ta)/0.86))};
function CG_sparkPos(u){const [ax,ay]=CG_cupAt(CG_HA[0],CG_HA[1],CG_HS,1),[bx,by]=CG_cupAt(CG_HB[0],CG_HB[1],CG_HS,-1);return [lerp(ax,bx,u),lerp(ay,by,u)-Math.sin(u*Math.PI)*120-6]}
SCENES.a5_spark=(t,c)=>{CG_handsBg(t);CG_twoHands(t);const u=CG_sparkU(t);
 for(let j=1;j<6;j++){const v=u-j*0.035;if(v<=0||u<=0)continue;const [x,y]=CG_sparkPos(v);C_sparkle(x,y,6-j*0.8,(1-j/6)*0.85,{col:'255,214,120',small:false})}
 const [x,y]=CG_sparkPos(u);CG_spark(x,y,21,1,t);grain(t,0.04)};
SCENES.a5_spark2=(t,c)=>{CG_handsBg(t);const [bx,by]=CG_cupAt(CG_HB[0],CG_HB[1],CG_HS,-1),z=1.22+0.05*eo(cl(c.k/1.1));
 g.save();g.translate(450,600);g.scale(z,z);g.translate(-450,-600);const u=CG_sparkU(t),land=cl((u-0.999)*1000),tl=WT('a',166.4)+0.86,lk=eo(cl((t-tl)/0.5));
 g.save();g.globalCompositeOperation='screen';glow(bx,by,200*lk,'255,200,110',0.45*lk,0.3);g.restore();
 CG_twoHands(t,lk*4);
 for(let j=1;j<6;j++){const v=u-j*0.035;if(v<=0||u>=1)continue;const [x,y]=CG_sparkPos(v);C_sparkle(x,y,6-j*0.8,(1-j/6)*0.85,{col:'255,214,120',small:false})}
 const [x,y]=CG_sparkPos(u);CG_spark(x,y-lk*4,21+3*Math.sin(t*6)*lk,1,t);
 if(lk>0){g.save();g.globalCompositeOperation='screen';glow(bx,by-10,90,'255,214,140',0.5*lk,0.4);g.restore()}
 g.restore();grain(t,0.04)};
SCENES.a5_giveback=(t,c)=>{CG_handsBg(t);const tg=WT('give',173.3),tl=WT('them',174.2),u=eio(cl((t-tg+0.1)/(tl-tg))),[ax,ay]=CG_cupAt(CG_HA[0],CG_HA[1],CG_HS,1),[bx,by]=CG_cupAt(CG_HB[0],CG_HB[1],CG_HS,-1);
 const land=eo(cl((t-tl)/0.4));CG_twoHands(t,6*(1-u)*cl(u*8),4*land);
 const x=lerp(bx,ax,u),y=lerp(by,ay,u)-Math.sin(u*Math.PI)*70-12;g.save();g.globalCompositeOperation='screen';glow(x,y,70,'190,225,255',0.4,0.3);g.restore();
 B_drop(x,y,30,1,false);C_sparkle(x+11,y-16,11,0.95,{col:'255,214,120',edge:'rgba(120,64,0,0.6)',rot:t});
 if(land>0){g.save();g.globalCompositeOperation='screen';glow(ax,ay,150*land,'255,204,110',0.45*land,0.3);g.restore()}
 C_dropIn('returns',360,438,64,'#FFD36E',WT('back',173.6),t,{fam:FAM.display,wt:'700',st:'italic',grad:C_GOLDG,stroke:[C_GOLDEDGE,6],shadow:[14,0.35,3],stag:0.03,fall:30});grain(t,0.04)};

// a5_thankyou (208.45-210.95, C, no caption): the golden sunrise over the hook's sea; the sun rises at x 470 (where the
// sea's glitter path points); a penguin on a sunlit rock pops up with an orange THANK YOU! sign and waves; a gold
// painterly stroke closes round the sun (it replaces the old black ensō)
SCENES.a5_thankyou=(t,c)=>{const HZ=702;Wsea(t,{off:HZ-452,m:0.55,moon:false});const k=eo(cl(c.k/1.5)),sy=lerp(HZ+30,HZ-176,k);
 g.save();g.beginPath();g.rect(-W,-H,3*W,H+HZ);g.clip();C_sun(470,sy,62,t,{});g.restore();Wdawn(t);
 const ek=eio(cl((c.k-1.0)/1.0));if(ek>0){B_enso(470,sy,112,ek,93,'#C9760E',20,-Math.PI*0.42,Math.PI*1.86);B_enso(470,sy,112,ek,93,'#FFD45C',13,-Math.PI*0.42,Math.PI*1.86)}
 CG_blit(CG_ROCK(),262,1062,1);
 g.save();for(let i=0;i<3;i++){const ph=(t*0.5+i/3)%1;g.strokeStyle=`rgba(255,246,228,${0.7*(1-ph)})`;g.lineWidth=3;g.beginPath();g.ellipse(262,1074+ph*14,240+ph*40,22+ph*8,0,Math.PI*0.95,Math.PI*2.05);g.stroke()}g.restore();
 const pu=c.k-0.2,ps=spr(pu,11,0.42);if(pu>0){const px=362,py=1010,sq=1+(1-ps)*0.25,hop=Math.abs(Math.sin(c.k*5.2))*10*cl((c.k-0.9)/0.3)*cl((2.2-c.k)/0.3);
  g.save();g.translate(px,py-hop);g.scale(0.92*ps/Math.sqrt(sq),0.92*ps*sq);
  const sk=spr(c.k-0.45,10,0.4);if(c.k>0.45){g.save();g.translate(-122,-212);g.rotate(-0.07+Math.sin(t*3)*0.035);g.translate(0,-160+40*(1-sk));g.scale(sk,sk);CG_blit(CG_SIGN(),0,0,1);
   TGRP='cg_sign';C_T('THANK',0,-38,46,'#FFF6E2',{fam:FAM.sansB,wt:'900',stroke:['#7A3410',6],shadow:[6,0.3,2]});C_T('YOU!',0,18,50,'#FFF6E2',{fam:FAM.sansB,wt:'900',stroke:['#7A3410',6],shadow:[6,0.3,2]});TGRP=null;g.restore()}
  CG_blit(CG_PENG(),0,0,1);CG_flipper(86,-160,-0.2+Math.sin(t*9)*0.45*cl((c.k-0.6)/0.2));g.restore()}
 grain(t,0.04)};
