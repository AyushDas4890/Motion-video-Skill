// acts/c_chars.js — CHARACTERS (colour world). Owner 2026-10-08: "make the world colourful just like the images".
// ORIGINAL friendly caricatures, inspired by the brief's reference pictures, never traced or copied:
//  - a1_lamp: a warm cartoon teacher (round glasses, mustard vest, maroon tie) writing "friend / philosopher / guide" on a green
//    chalkboard in a lamp-lit classroom, kids at desks seen from behind, blue night rain in the window
//  - a1_poet / a5_whitman: Walt Whitman as a big-headed friendly caricature (full white beard, tilted slouch hat, open collar,
//    cinnamon coat, an open book whose page turns, a raised finger), blinking
//  - a1_hornbill / a1_hornbill_cover: an illustrated great hornbill (black body, white wing bars, yellow-orange casque bill,
//    red eye, banded white tail) beating its wings in and landing on a colourful "Hornbill · Class XI · English" cover
//  - roll call 191-197: one illustrated vignette per noun (parents swinging a child, two friends under umbrellas in the rain,
//    the teacher at the board, a cricket bat and ball, a village street) each folding into a star of one evening sky
//  - pride beats 146-187: everything in cold silver-grey (#8A93A6 family): a fame spotlight ring, a crown that draws itself,
//    glints cold, hovers, then melts into one drop on "No."
// Static art is drawn ONCE into cached canvases with t-independent inputs, then animated with transforms, so renderFrame
// stays pure (RNG / hash / vnoise only). Every hit is cued from WT(). All top-level names start with CH_.
'use strict';

// ---------------------------------------------------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------------------------------------------------
const CH_C={};
// cache art drawn in LOCAL coords inside [x0,x0+w]x[y0,y0+h] at `res` px per logical unit (the global g is swapped)
function CH_cache(key,x0,y0,w,h,res,fn){if(CH_C[key])return CH_C[key];const c=document.createElement('canvas');c.width=Math.ceil(w*res);c.height=Math.ceil(h*res);
 const x=c.getContext('2d'),pg=g;g=x;try{x.setTransform(res,0,0,res,-x0*res,-y0*res);x.lineCap='round';x.lineJoin='round';fn(x)}finally{g=pg}return CH_C[key]={c,x0,y0,w,h}}
function CH_blit(o,x,y,s=1,rot=0,a=1,sy){if(a<=0.003)return;g.save();g.globalAlpha*=a;g.translate(x,y);if(rot)g.rotate(rot);g.scale(s,sy??s);g.drawImage(o.c,o.x0,o.y0,o.w,o.h);g.restore()}
const CH_P=(fn)=>{const P=new Path2D();fn(P);return P};
const CH_dk=(c,k)=>C_c(C_mx(c,C_BK,k)),CH_lt=(c,k)=>C_c(C_mx(c,C_WH,k));
const CH_eb=(x)=>{const c=1.70158,c3=c+1;return 1+c3*Math.pow(x-1,3)+c*Math.pow(x-1,2)};   // ease-out-back
// cel shading: darker base, the lit body shifted toward the top-left light, optional highlight, thin darker same-hue edge
function CH_fill(P,base,o={}){const d=o.d??5;g.save();const fr=o.eo?'evenodd':'nonzero';g.fillStyle=o.sh||CH_dk(base,o.dk??0.2);g.fill(P,fr);g.clip(P,fr);g.translate(-d,-d*(o.dy??1));g.fillStyle=C_c(base);g.fill(P,fr);
 if(o.sheen){g.translate(d,d*(o.dy??1));const gr=g.createLinearGradient(0,o.sheen[0],0,o.sheen[1]);gr.addColorStop(0,`rgba(255,255,255,${o.sheen[2]??0.22})`);gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fill(P);g.translate(-d,-d*(o.dy??1))}
 if(o.hl){g.translate(d,d*(o.dy??1));g.fillStyle=`rgba(255,255,255,${o.hl[4]??0.26})`;g.beginPath();g.ellipse(o.hl[0],o.hl[1],o.hl[2],o.hl[3],o.hl[5]??-0.5,0,7);g.fill()}
 g.restore();if(o.edge!==false){g.save();g.strokeStyle=o.edge||CH_dk(base,0.45);g.lineWidth=o.lw??2.2;g.lineJoin='round';g.lineCap='round';g.stroke(P);g.restore()}}
// a chunky tube (arm, leg): edge, shade, lit core shifted toward the light
function CH_tube(P,w,base,o={}){g.save();g.lineCap=o.cap||'round';g.lineJoin='round';g.strokeStyle=o.edge||CH_dk(base,0.45);g.lineWidth=w+(o.lw??2.2)*2;g.stroke(P);
 g.strokeStyle=CH_dk(base,0.18);g.lineWidth=w;g.stroke(P);g.translate(-(o.d??2),-(o.d??2));g.strokeStyle=C_c(base);g.lineWidth=Math.max(1,w*0.62);g.stroke(P);g.restore()}
const CH_line=(col,w)=>{g.strokeStyle=col;g.lineWidth=w;g.lineCap='round';g.lineJoin='round'};
const CH_shadow=(x,y,rx,ry,a=0.28,col='20,24,50')=>{g.save();g.fillStyle=`rgba(${col},${a})`;g.beginPath();g.ellipse(x,y,rx,ry,0,0,7);g.fill();g.restore()};
// two-bone IK: returns elbow point (bend side sg = +1/-1)
function CH_ik(sx,sy,tx,ty,L1,L2,sg=1){let dx=tx-sx,dy=ty-sy,d=Math.hypot(dx,dy);const dm=Math.min(d,L1+L2-0.5);if(d>dm){dx*=dm/d;dy*=dm/d;d=dm}
 const a=Math.atan2(dy,dx),b=Math.acos(cl((L1*L1+d*d-L2*L2)/(2*L1*d),-1,1));return [sx+Math.cos(a+sg*b)*L1,sy+Math.sin(a+sg*b)*L1,sx+dx,sy+dy]}
// eyes with blink (bl 0 open .. 1 shut); look offset lx,ly
function CH_eyes(cx,y,dx,s,bl=0,lx=0,ly=0,col='#2A1A12'){for(const sg of [-1,1]){const x=cx+sg*dx;
 if(bl>0.85){CH_line(col,3*s);g.beginPath();g.moveTo(x-7*s,y);g.quadraticCurveTo(x,y+4*s,x+7*s,y);g.stroke();continue}
 const ry=8*s*(1-bl);g.fillStyle='#FFFFFF';g.beginPath();g.ellipse(x,y,7.4*s,Math.max(1,ry*1.12),0,0,7);g.fill();
 g.save();g.beginPath();g.ellipse(x,y,7.4*s,Math.max(1,ry*1.12),0,0,7);g.clip();g.fillStyle=col;g.beginPath();g.ellipse(x+lx*s,y+ly*s,5*s,6.4*s,0,0,7);g.fill();
 g.fillStyle='#FFFFFF';g.beginPath();g.arc(x+lx*s-1.8*s,y+ly*s-2.6*s,1.9*s,0,7);g.fill();g.restore();
 CH_line('rgba(60,30,20,0.85)',1.6*s);g.beginPath();g.ellipse(x,y,7.4*s,Math.max(1,ry*1.12),0,Math.PI*1.05,Math.PI*1.95);g.stroke()}}
// blink curve: shut briefly around each time in ts
const CH_blink=(t,ts)=>{let b=0;for(const a of ts){const u=(t-a)/0.16;if(u>0&&u<1)b=Math.max(b,Math.sin(u*Math.PI))}return b};
const CH_bl=(t,seed=0)=>{const p=3.1+hash(seed)*1.3,u=((t+hash(seed+7)*3)%p)/0.15;return u<1?Math.sin(u*Math.PI):0};   // periodic blink

// ---------------------------------------------------------------------------------------------------------------------
// THE TEACHER (a1_lamp + roll call): big head, round glasses, side-parted hair, small moustache, light-blue shirt,
// maroon tie, mustard sweater vest. Origin = belt centre. st = {bl, arm:[tx,ty] (chalk hand target), hold (book arm), smile}
// ---------------------------------------------------------------------------------------------------------------------
const CH_SKIN='#C98A5C',CH_SKIN_L='#DDA478';
function CH_teacherHead(){return CH_cache('tHead',-80,-340,160,190,2.2,()=>{
 // neck
 CH_fill(CH_P(P=>{P.rect(-17,-200,34,40)}),CH_SKIN,{d:3,edge:CH_dk(CH_SKIN,0.4)});
 // ears
 for(const sg of [-1,1])CH_fill(CH_P(P=>{P.ellipse(sg*50,-246,10,14,0,0,7)}),CH_SKIN,{d:2});
 // face
 const F=CH_P(P=>{P.moveTo(0,-308);P.bezierCurveTo(32,-308,52,-288,52,-252);P.bezierCurveTo(52,-214,30,-192,0,-190);P.bezierCurveTo(-30,-192,-52,-214,-52,-252);P.bezierCurveTo(-52,-288,-32,-308,0,-308)});
 CH_fill(F,CH_SKIN,{d:6,hl:[-18,-272,16,10,0.16]});
 // hair: side part with a swoop
 const Hh=CH_P(P=>{P.moveTo(-54,-238);P.bezierCurveTo(-60,-292,-30,-322,4,-320);P.bezierCurveTo(40,-318,60,-292,55,-240);P.bezierCurveTo(50,-262,44,-276,30,-284);
  P.bezierCurveTo(10,-270,-14,-276,-26,-292);P.bezierCurveTo(-34,-276,-44,-264,-48,-232);P.closePath()});
 CH_fill(Hh,'#4A2E1E',{d:4,hl:[8,-306,18,6,0.18,-0.1]});
 CH_line('rgba(30,16,8,0.5)',2);g.beginPath();g.moveTo(-26,-292);g.quadraticCurveTo(-8,-300,20,-304);g.stroke();
 // brows
 CH_line('#3A2214',4);for(const sg of [-1,1]){g.beginPath();g.moveTo(sg*10,-272);g.quadraticCurveTo(sg*22,-279,sg*35,-272);g.stroke()}
 // nose
 g.fillStyle=CH_dk(CH_SKIN,0.12);g.beginPath();g.ellipse(2,-238,8,6,0,0,7);g.fill();CH_line(CH_dk(CH_SKIN,0.4),2.2);g.beginPath();g.moveTo(-2,-256);g.quadraticCurveTo(-6,-242,0,-236);g.stroke();
 // moustache + smile
 g.fillStyle='#3A2214';g.beginPath();g.moveTo(0,-229);g.bezierCurveTo(-10,-233,-22,-231,-25,-222);g.bezierCurveTo(-16,-224,-8,-222,0,-224);g.bezierCurveTo(8,-222,16,-224,25,-222);g.bezierCurveTo(22,-231,10,-233,0,-229);g.fill();
 const M=CH_P(P=>{P.moveTo(-16,-216);P.quadraticCurveTo(0,-206,16,-216);P.quadraticCurveTo(13,-201,0,-199);P.quadraticCurveTo(-13,-201,-16,-216)});g.fillStyle='#7A2328';g.fill(M);
 g.save();g.clip(M);g.fillStyle='#FFFFFF';g.fillRect(-16,-218,32,6);g.fillStyle='#E26A72';g.beginPath();g.ellipse(0,-200,8,4,0,0,7);g.fill();g.restore();
 // cheeks
 g.fillStyle='rgba(235,96,86,0.28)';for(const sg of [-1,1]){g.beginPath();g.ellipse(sg*31,-228,10,6,0,0,7);g.fill()}
})}
// the glasses are drawn live over the eyes (so the blink shows through the lenses)
function CH_glasses(cx,y,dx,r,s=1){g.save();for(const sg of [-1,1]){g.fillStyle='rgba(190,230,255,0.16)';g.beginPath();g.arc(cx+sg*dx,y,r,0,7);g.fill();
  g.strokeStyle='rgba(255,255,255,0.55)';g.lineWidth=2*s;g.beginPath();g.arc(cx+sg*dx,y,r*0.72,-2.5,-1.7);g.stroke()}
 CH_line('#2B2730',3.6*s);for(const sg of [-1,1]){g.beginPath();g.arc(cx+sg*dx,y,r,0,7);g.stroke()}g.beginPath();g.moveTo(cx-dx+r,y-2*s);g.quadraticCurveTo(cx,y-7*s,cx+dx-r,y-2*s);g.stroke();
 g.beginPath();g.moveTo(cx-dx-r,y-2*s);g.lineTo(cx-dx-r-9*s,y-5*s);g.moveTo(cx+dx+r,y-2*s);g.lineTo(cx+dx+r+9*s,y-5*s);g.stroke();g.restore()}
function CH_teacherBody(){return CH_cache('tBody',-110,-200,220,330,2.2,()=>{
 // trousers (mostly hidden by the desk)
 CH_fill(CH_P(P=>{P.moveTo(-58,0);P.lineTo(-54,120);P.lineTo(-6,120);P.lineTo(0,20);P.lineTo(6,120);P.lineTo(54,120);P.lineTo(58,0);P.closePath()}),'#6E5038',{d:4});
 // shirt torso
 const T0=CH_P(P=>{P.moveTo(-60,2);P.bezierCurveTo(-64,-60,-84,-120,-80,-150);P.quadraticCurveTo(-60,-176,-24,-180);P.lineTo(24,-180);P.quadraticCurveTo(60,-176,80,-150);P.bezierCurveTo(84,-120,64,-60,60,2);P.closePath()});
 CH_fill(T0,'#9CCBF0',{d:6,sheen:[-180,-100,0.25]});
 // tie
 CH_fill(CH_P(P=>{P.moveTo(-7,-172);P.lineTo(7,-172);P.lineTo(10,-158);P.lineTo(13,-70);P.lineTo(0,-56);P.lineTo(-13,-70);P.lineTo(-10,-158);P.closePath()}),'#9B2335',{d:3,hl:[-3,-130,3,26,0.2,0]});
 // vest
 const V=CH_P(P=>{P.moveTo(-66,-140);P.quadraticCurveTo(-40,-150,-30,-160);P.lineTo(0,-92);P.lineTo(30,-160);P.quadraticCurveTo(40,-150,66,-140);P.bezierCurveTo(70,-90,62,-40,60,0);P.lineTo(-60,0);P.bezierCurveTo(-62,-40,-70,-90,-66,-140);P.closePath()});
 CH_fill(V,'#E3A43A',{d:6,sheen:[-160,-60,0.2]});
 CH_line(CH_dk('#E3A43A',0.3),1.6);for(let i=0;i<5;i++){g.beginPath();g.moveTo(-58,-120+i*26);g.lineTo(58,-120+i*26);g.globalAlpha=0.25;g.stroke();g.globalAlpha=1}
 g.fillStyle='#FFF2D6';for(let i=0;i<3;i++){g.beginPath();g.arc(0,-74+i*24,3.2,0,7);g.fill()}
 // collar
 for(const sg of [-1,1])CH_fill(CH_P(P=>{P.moveTo(sg*2,-174);P.lineTo(sg*28,-184);P.lineTo(sg*24,-160);P.closePath()}),'#F4F8FF',{d:2,edge:'#8AA6C0',lw:1.6});
 // belt
 CH_fill(CH_P(P=>{P.rect(-60,-4,120,12)}),'#5A3A22',{d:2});g.fillStyle='#E9C46A';g.fillRect(-7,-4,14,12);g.fillStyle='#5A3A22';g.fillRect(-3,-1,6,6);
})}
// the teacher; x,y = belt centre; s = scale; st: {bl, tgt:[x,y] for the chalk hand (scene coords), chalk, smile, book}
function CH_teacher(x,y,s,st={}){g.save();g.translate(x,y);g.scale(s,s);
 CH_blit(CH_teacherBody(),0,0);
 // book arm (viewer's right): elbow down, forearm across the hip holding a red book
 const sh2=[76,-146],el2=[96,-76],hd2=[84,-8];
 CH_tube(CH_P(P=>{P.moveTo(...sh2);P.lineTo(...el2);P.lineTo(...hd2)}),26,'#9CCBF0');
 g.save();g.translate(96,-26);g.rotate(0.12);CH_fill(CH_P(P=>{P.roundRect(-10,-44,26,74,4)}),'#D2453C',{d:3,hl:[-2,-20,4,16,0.2]});g.fillStyle='#F7E9C8';g.fillRect(-10,-42,4,70);g.restore();
 CH_fill(CH_P(P=>{P.ellipse(...hd2,12,11,0,0,7)}),CH_SKIN,{d:2});
 // chalk arm (viewer's left) by IK toward the target
 const sx=-74,sy=-146;let tx=-150,ty=-120;if(st.tgt){tx=(st.tgt[0]-x)/s;ty=(st.tgt[1]-y)/s}
 const [ex,ey,hx,hy]=CH_ik(sx,sy,tx,ty,86,84,-1);
 CH_tube(CH_P(P=>{P.moveTo(sx,sy);P.lineTo(ex,ey);P.lineTo(hx,hy)}),26,'#9CCBF0');
 CH_fill(CH_P(P=>{P.ellipse(hx,hy,12,11,0,0,7)}),CH_SKIN,{d:2});
 const an=Math.atan2(hy-ey,hx-ex);g.save();g.translate(hx,hy);g.rotate(an);g.fillStyle='#FFFFFF';g.fillRect(8,-3,16,6);CH_line('rgba(120,120,120,0.6)',1);g.strokeRect(8,-3,16,6);g.restore();
 // head (+ a small tilt toward the board)
 g.save();g.translate(0,-190);g.rotate(st.tilt||0);g.translate(0,190);CH_blit(CH_teacherHead(),0,0);
 CH_eyes(0,-252,21,1,st.bl||0,st.lx??-2,st.ly??0,'#2A1A12');CH_glasses(0,-252,21,16,1);g.restore();
 g.restore()}

// ---------------------------------------------------------------------------------------------------------------------
// THE CLASSROOM (a1_lamp): lamp-lit warm wall, green chalkboard with chalk doodles, a window of blue night rain, shelf,
// clock, the teacher's desk in front; kids seen from behind in the foreground
// ---------------------------------------------------------------------------------------------------------------------
const CH_WIN=[588,272,96,236];   // window glass rect (x,y,w,h); the room cache has a hole there
function CH_room(){return CH_cache('room',0,190,720,720,2,()=>{
 const wg=g.createLinearGradient(0,190,0,650);wg.addColorStop(0,'#FBE7BF');wg.addColorStop(1,'#F3CF94');g.fillStyle=wg;g.fillRect(0,190,720,470);
 const r=RNG(5);for(let i=0;i<60;i++){g.fillStyle=`rgba(${r()<0.5?'255,255,255':'214,150,80'},${0.04+r()*0.05})`;g.beginPath();g.ellipse(r()*720,190+r()*460,20+r()*60,10+r()*30,r()*3,0,7);g.fill()}
 // wainscot
 const wn=g.createLinearGradient(0,640,0,910);wn.addColorStop(0,'#62AE9F');wn.addColorStop(1,'#3F8476');g.fillStyle=wn;g.fillRect(0,640,720,270);
 g.fillStyle='#2F6E62';g.fillRect(0,636,720,10);g.fillStyle='rgba(255,255,255,0.22)';g.fillRect(0,636,720,3);
 CH_line('rgba(30,80,70,0.55)',3);for(let x=30;x<720;x+=150){g.strokeRect(x,664,120,200)}
 // window hole + frame
 const [wx,wy,ww,wh]=CH_WIN;
 g.save();g.fillStyle='rgba(120,70,30,0.25)';g.fillRect(wx-14,wy+wh+8,ww+28,10);g.restore();
 CH_fill(CH_P(P=>{P.rect(wx-12,wy-12,ww+24,wh+24);P.rect(wx,wy,ww,wh)}),'#F7EEDF',{eo:1,d:3,edge:'#B79870',lw:2});
 g.save();g.fillStyle='#F7EEDF';g.strokeStyle='#B79870';g.lineWidth=2;g.fillRect(wx+ww*0.5-4,wy,8,wh);g.strokeRect(wx+ww*0.5-4,wy,8,wh);g.fillRect(wx,wy+wh*0.48-4,ww,8);g.strokeRect(wx,wy+wh*0.48-4,ww,8);g.restore();
 // chalkboard
 CH_fill(CH_P(P=>{P.roundRect(62,288,506,330,10)}),'#B87440',{d:4,edge:'#6E3F1C',lw:2.6,sheen:[288,330,0.25]});
 const bg=g.createLinearGradient(76,302,552,604);bg.addColorStop(0,'#46886A');bg.addColorStop(1,'#285A43');g.fillStyle=bg;g.beginPath();g.roundRect(76,302,478,302,4);g.fill();
 g.save();g.beginPath();g.roundRect(76,302,478,302,4);g.clip();const r2=RNG(9);for(let i=0;i<26;i++){g.fillStyle=`rgba(235,245,235,${0.03+r2()*0.04})`;g.beginPath();g.ellipse(84+r2()*460,310+r2()*290,30+r2()*80,8+r2()*16,r2()*0.6-0.3,0,7);g.fill()}
 g.strokeStyle='rgba(0,0,0,0.25)';g.lineWidth=6;g.strokeRect(76,302,478,302);g.restore();
 // chalk doodles: a rain cloud with drops, a sun peeking out, a little rainbow arc (top left of the board)
 g.save();CH_line('rgba(246,244,232,0.85)',3);g.beginPath();g.moveTo(104,370);g.arc(124,356,16,Math.PI*0.6,Math.PI*1.5);g.arc(152,340,22,Math.PI*1.1,Math.PI*1.95);g.arc(184,354,18,Math.PI*1.4,Math.PI*0.35);g.lineTo(104,370);g.stroke();
 for(const [x,y] of [[124,388],[148,396],[172,386]]){g.beginPath();g.moveTo(x,y-9);g.quadraticCurveTo(x+6,y,x,y+3);g.quadraticCurveTo(x-6,y,x,y-9);g.stroke()}
 g.beginPath();g.arc(232,334,13,0,7);g.stroke();for(let i=0;i<8;i++){const a=i*Math.PI/4;g.beginPath();g.moveTo(232+Math.cos(a)*19,334+Math.sin(a)*19);g.lineTo(232+Math.cos(a)*27,334+Math.sin(a)*27);g.stroke()}
 g.lineWidth=2.4;for(const [rr,c] of [[44,'rgba(255,150,170,0.8)'],[37,'rgba(255,230,130,0.8)'],[30,'rgba(150,220,255,0.8)']]){g.strokeStyle=c;g.beginPath();g.arc(318,392,rr,Math.PI*1.05,Math.PI*1.95);g.stroke()}
 g.restore();
 // chalk tray
 CH_fill(CH_P(P=>{P.roundRect(68,600,494,14,3)}),'#9A5E2E',{d:2,edge:'#5E3416'});
 for(const [x,c] of [[140,'#FFFFFF'],[164,'#FFE27A'],[186,'#FF9FB4']]){g.fillStyle=c;g.fillRect(x,595,18,6)}
 // left wall: clock and a shelf of books
 CH_fill(CH_P(P=>{P.arc(50,262,26,0,7)}),'#E85D4A',{d:2});g.fillStyle='#FFF8EC';g.beginPath();g.arc(50,262,20,0,7);g.fill();CH_line('#33302C',2.6);g.beginPath();g.moveTo(50,262);g.lineTo(50,248);g.moveTo(50,262);g.lineTo(60,266);g.stroke();
 CH_fill(CH_P(P=>{P.rect(0,420,92,10)}),'#B07040',{d:2,edge:'#6E3F1C'});
 const bc=['#E85D4A','#3E8EDE','#F2B33D','#58B368','#9A63D6','#E8749A'];for(let i=0;i<6;i++){const h=40+((i*37)%18);CH_fill(CH_P(P=>{P.rect(4+i*14,420-h,12,h)}),bc[i],{d:1.5,lw:1.4})}
 // a soft warm light pool from the lamp
 g.save();g.globalCompositeOperation='soft-light';const lg=g.createRadialGradient(300,250,10,300,300,420);lg.addColorStop(0,'rgba(255,240,200,0.9)');lg.addColorStop(1,'rgba(255,240,200,0)');g.fillStyle=lg;g.fillRect(0,190,720,720);g.restore();
 // cut the four window panes (the night is drawn live behind), then the sill and a potted plant
 g.save();g.globalCompositeOperation='destination-out';const vx=wx+ww*0.5,hy=wy+wh*0.48;for(const [x0,y0,x1,y1] of [[wx,wy,vx-4,hy-4],[vx+4,wy,wx+ww,hy-4],[wx,hy+4,vx-4,wy+wh],[vx+4,hy+4,wx+ww,wy+wh]])g.fillRect(x0,y0,x1-x0,y1-y0);g.restore();
 g.fillStyle='rgba(255,255,255,0.10)';g.beginPath();g.moveTo(wx,wy+40);g.lineTo(wx+40,wy);g.lineTo(wx+62,wy);g.lineTo(wx,wy+62);g.fill();
 CH_fill(CH_P(P=>{P.roundRect(wx-22,wy+wh+8,ww+44,14,4)}),'#E9D8BC',{d:2,edge:'#A88660'});
 CH_fill(CH_P(P=>{P.moveTo(wx+8,wy+wh+8);P.lineTo(wx+12,wy+wh-20);P.lineTo(wx+44,wy+wh-20);P.lineTo(wx+48,wy+wh+8);P.closePath()}),'#D9744A',{d:2});
 for(let i=0;i<5;i++)C_leaf(wx+28,wy+wh-22,30+i*3,-Math.PI/2+(i-2)*0.45,{col:'#57B860',col2:'#2E8A45',tint:false,w:0.42});
})}
function CH_desk(){return CH_cache('desk',300,600,420,320,2,()=>{
 // the teacher's desk: top + front panel
 CH_fill(CH_P(P=>{P.moveTo(318,688);P.lineTo(704,688);P.lineTo(716,708);P.lineTo(306,708);P.closePath()}),'#D49556',{d:2,edge:'#7A4824',sheen:[688,708,0.35]});
 CH_fill(CH_P(P=>{P.rect(312,708,398,210)}),'#B06E38',{d:4,edge:'#6E3F1C',sheen:[708,760,0.15]});
 CH_line('rgba(90,50,20,0.5)',3);g.strokeRect(332,726,170,180);g.strokeRect(520,726,170,180);
 g.fillStyle='#E9C46A';for(const x of [417,605]){g.beginPath();g.arc(x,760,5,0,7);g.fill()}
 // books stack
 const bk=[['#3E8EDE',96],['#F2B33D',88],['#E85D4A',92]];bk.forEach(([c,w],i)=>{CH_fill(CH_P(P=>{P.roundRect(340+i*4,670-i*16,w,16,3)}),c,{d:2});g.fillStyle='#FFF6E4';g.fillRect(342+i*4+w-8,672-i*16,5,12)});
 // potted plant + a mug of pencils
 CH_fill(CH_P(P=>{P.moveTo(626,690);P.lineTo(620,650);P.lineTo(672,650);P.lineTo(666,690);P.closePath()}),'#D9744A',{d:2});
 for(let i=0;i<7;i++)C_leaf(646,650,34+((i*13)%14),-Math.PI/2+(i-3)*0.42,{col:'#5BC06A',col2:'#2E8A45',tint:false,w:0.44});
 CH_fill(CH_P(P=>{P.roundRect(560,652,34,38,5)}),'#5A8FE0',{d:2});for(const [dx,c] of [[-8,'#F2B33D'],[2,'#E85D4A'],[10,'#58B368']]){g.save();g.translate(577+dx,652);g.rotate(dx*0.03);g.fillStyle=c;g.fillRect(-2.5,-30,5,30);g.fillStyle='#F5D2A8';g.beginPath();g.moveTo(-2.5,-30);g.lineTo(0,-37);g.lineTo(2.5,-30);g.fill();g.restore()}
})}
// a kid seen from behind: x,y = centre of the back of the head; hair style 'puffs' | 'messy' | 'short'
function CH_kidBack(x,y,s,o={}){g.save();g.translate(x,y);g.scale(s,s);
 const shirt=o.shirt||'#58B368',hair=o.hair||'#2A1C14';
 // raised arm (behind the head on that side) — o.raise 0..1
 if(o.raise>0.01){const sg=o.side||1,ang=sg*lerp(2.4,0.32,o.raise);g.save();g.translate(sg*44,56);g.rotate(ang);CH_tube(CH_P(P=>{P.moveTo(0,0);P.lineTo(0,-70);P.lineTo(sg*4,-112)}),24,shirt);CH_fill(CH_P(P=>{P.ellipse(sg*4,-122,12,15,0,0,7)}),o.skin||CH_SKIN,{d:2});g.restore()}
 CH_fill(CH_P(P=>{P.moveTo(-80,140);P.bezierCurveTo(-80,70,-60,48,0,46);P.bezierCurveTo(60,48,80,70,80,140);P.closePath()}),shirt,{d:6,sheen:[46,90,0.22]});
 CH_fill(CH_P(P=>{P.rect(-13,26,26,26)}),o.skin||CH_SKIN,{d:2});
 for(const sg of [-1,1])CH_fill(CH_P(P=>{P.ellipse(sg*40,4,9,13,0,0,7)}),o.skin||CH_SKIN,{d:2});
 const hs=o.style||'short';
 if(hs==='puffs'){for(const sg of [-1,1])CH_fill(CH_P(P=>{P.arc(sg*36,-34,18,0,7)}),hair,{d:3,hl:[sg*30,-42,7,4,0.18]})}
 CH_fill(CH_P(P=>{P.ellipse(0,-2,42,46,0,0,7)}),hair,{d:5,hl:[-12,-30,16,8,0.16]});
 if(hs==='messy'){g.fillStyle=hair;for(let i=0;i<7;i++){const a=-2.6+i*0.36;g.beginPath();g.moveTo(Math.cos(a)*36,Math.sin(a)*40);g.lineTo(Math.cos(a+0.12)*52,Math.sin(a+0.12)*54);g.lineTo(Math.cos(a+0.26)*38,Math.sin(a+0.26)*42);g.fill()}}
 if(hs==='puffs'){g.strokeStyle='#F2B33D';g.lineWidth=7;g.beginPath();g.arc(0,-2,40,-2.7,-0.44);g.stroke()}
 CH_line('rgba(0,0,0,0.25)',2);g.beginPath();g.moveTo(-8,-40);g.quadraticCurveTo(0,-10,6,30);g.stroke();
 g.restore()}
// chalk words on the board: each written as it is spoken
const CH_CHALK=[['friend',196,432,'friend',3.9,0.22],['philosopher',196,482,'philosopher',4.3,0.48],['guide',196,532,'guide',5.0,0.3]];
function CH_lampScene(t,c){const S=CSKY(t);g.fillStyle='#F3CF94';g.fillRect(-W,-H,3*W,3*H);
 // window: the night outside (sky clock colours), rain streaks and beads on the glass
 const [wx,wy,ww,wh]=CH_WIN;g.save();g.beginPath();g.rect(wx-2,wy-2,ww+60,wh+4);g.clip();const og=g.createLinearGradient(0,wy,0,wy+wh);og.addColorStop(0,C_c(S.top));og.addColorStop(1,C_c(S.mid));g.fillStyle=og;g.fillRect(wx-2,wy-2,ww+60,wh+4);
 g.fillStyle=C_c(C_mx(S.top,C_BK,0.35));g.beginPath();g.moveTo(wx,wy+wh);for(let i=0;i<=8;i++){const xx=wx+i*18;g.lineTo(xx,wy+wh-40-((i*53)%40));g.lineTo(xx+12,wy+wh-40-((i*53)%40))}g.lineTo(wx+ww+60,wy+wh);g.fill();
 g.fillStyle='rgba(255,214,140,0.85)';for(let i=0;i<7;i++)g.fillRect(wx+6+i*19,wy+wh-30+((i*29)%14),3,4);
 const r=RNG(77);CH_line('rgba(210,230,255,0.5)',1.4);for(let i=0;i<26;i++){const xx=wx+r()*(ww+60),sp=500+r()*300,yy=wy+((r()*wh+t*sp)%(wh+40))-20;g.beginPath();g.moveTo(xx,yy);g.lineTo(xx-4,yy+16);g.stroke()}
 for(let i=0;i<7;i++){const xx=wx+8+r()*(ww+30),yy=wy+10+((r()*wh+t*(10+r()*30))%(wh-20));B_drop(xx,yy,3+r()*3,0.9)}
 g.restore();
 CH_blit(CH_room(),0,0);
 // lamp glow (warm) high up
 g.save();g.globalCompositeOperation='lighter';glow(300,262,170,'255,214,150',0.35,0.3);glow(300,262,60,'255,236,200',0.5,0.4);g.restore();
 CH_line('#3A3030',2.4);g.beginPath();g.moveTo(300,150);g.lineTo(300,240);g.stroke();
 CH_fill(CH_P(P=>{P.moveTo(268,262);P.quadraticCurveTo(272,236,300,234);P.quadraticCurveTo(328,236,332,262);P.closePath()}),'#E85D4A',{d:2});g.fillStyle='#FFF6D8';g.beginPath();g.ellipse(300,263,24,5,0,0,7);g.fill();
 // chalk words + the chalk hand target
 let tgt=[330,500];const tw=[];
 for(const [s,x,y,w,a,d] of CH_CHALK){const t0=WT(w,a),p=cl((t-t0)/d),wd=mw(s,38,FAM.text,'600','italic');tw.push([t0,d,x,y,wd]);if(p<=0)continue;
  g.save();g.beginPath();g.rect(x-10,y-34,(wd+16)*eio(p)+4,70);g.clip();C_T(s,x,y,38,'#FFFFFF',{fam:FAM.text,wt:'700',st:'italic',al:'left',stroke:['#0E2A1A',5],shadow:[6,0.5]});g.restore()}
 // hand path: rest -> each word's writing edge -> point at the list
 const hp=(i,p)=>{const [,,x,y,wd]=tw[i];return [x+wd*eio(p)+6,y+12+Math.sin(p*wd*0.25)*5]};
 for(let i=0;i<tw.length;i++){const [t0,d]=tw[i],p=(t-t0)/d;if(t>=t0-0.14){if(p<0){const k=eio(cl((t-t0+0.14)/0.14)),prev=i?hp(i-1,1):[330,500],nx=hp(i,0);tgt=[lerp(prev[0],nx[0],k),lerp(prev[1],nx[1],k)-Math.sin(k*Math.PI)*14]}else tgt=hp(i,cl(p))}}
 const tl=tw[2][0]+tw[2][1];if(t>tl){const k=eio(cl((t-tl)/0.3));const a0=hp(2,1);tgt=[lerp(a0[0],330,k),lerp(a0[1],500,k)]}
 const look=cl((t-tl-0.1)/0.2);
 CH_shadow(470,694,120,10,0.18,'90,50,20');
 CH_teacher(470,688,1.15,{tgt,bl:CH_blink(t,[c.t0+0.55,c.t0+1.45]),tilt:lerp(-0.08,0.02,look)+0.025*Math.sin(t*2.2),lx:lerp(-2.6,0,look),ly:lerp(-0.6,0.4,look)});
 CH_blit(CH_desk(),0,0);
 // the kids: bob gently; the left one raises a hand on "guide"
 const tg=WT('guide',5.0),rz=spr(t-tg-0.05,9,0.55);
 CH_kidBack(112,786+Math.sin(t*3.1)*2,1.05,{style:'puffs',hair:'#24160E',shirt:'#F08A3C',raise:cl(rz),side:-1,skin:'#B97A50'});
 CH_kidBack(630,796+Math.sin(t*2.7+1)*2,1.12,{style:'messy',hair:'#6B4024',shirt:'#58B368',skin:'#D9A274'});
}
SCENES.a1_lamp=(t,c)=>{CH_lampScene(t,c);grain(t,0.04)};

// ---------------------------------------------------------------------------------------------------------------------
// WALT WHITMAN — an ORIGINAL friendly caricature: big head, full flowing white beard, bushy white brows, rosy nose,
// a wide-brim grey-brown slouch hat tilted, open white collar, a cinnamon frock coat, slate trousers; an open book in one
// hand (a page turns), the other hand raised with a finger up. Origin = between the feet; height ~ 760 at s=1.
// ---------------------------------------------------------------------------------------------------------------------
const CH_WSKIN='#F0C29C',CH_COAT='#B65F2E',CH_BEARD='#F5F3EE';
function CH_whitBody(){return CH_cache('wBody',-190,-500,380,510,2,()=>{
 CH_shadow(0,-2,120,14,0.25);
 // shoes + trousers
 for(const sg of [-1,1]){CH_fill(CH_P(P=>{P.moveTo(sg*12,-160);P.lineTo(sg*64,-160);P.lineTo(sg*60,-22);P.lineTo(sg*16,-22);P.closePath()}),'#4F4C5E',{d:4});
  CH_fill(CH_P(P=>{P.moveTo(sg*12,-26);P.quadraticCurveTo(sg*40,-34,sg*74,-20);P.quadraticCurveTo(sg*82,-2,sg*60,0);P.lineTo(sg*12,0);P.closePath()}),'#3B2A22',{d:3,hl:[sg*50,-18,12,4,0.2,0]})}
 // frock coat
 const C=CH_P(P=>{P.moveTo(-34,-478);P.quadraticCurveTo(-96,-474,-122,-450);P.bezierCurveTo(-136,-400,-130,-300,-122,-240);P.bezierCurveTo(-118,-200,-128,-160,-134,-128);
  P.quadraticCurveTo(-70,-112,-4,-136);P.lineTo(4,-136);P.quadraticCurveTo(70,-112,134,-128);P.bezierCurveTo(128,-160,118,-200,122,-240);P.bezierCurveTo(130,-300,136,-400,122,-450);P.quadraticCurveTo(96,-474,34,-478);P.closePath()});
 CH_fill(C,CH_COAT,{d:8,sheen:[-478,-380,0.22],hl:[-70,-420,30,60,0.10,0.2]});
 // shirt in the open collar
 CH_fill(CH_P(P=>{P.moveTo(-34,-478);P.lineTo(34,-478);P.lineTo(10,-380);P.lineTo(-10,-380);P.closePath()}),'#FBF7EE',{d:3,edge:'#B9B2A6',lw:1.6});
 // lapels
 for(const sg of [-1,1])CH_fill(CH_P(P=>{P.moveTo(sg*34,-478);P.lineTo(sg*62,-440);P.lineTo(sg*40,-420);P.lineTo(sg*10,-370);P.lineTo(sg*12,-392);P.closePath()}),CH_dk(CH_COAT,0.12),{d:2,lw:1.8});
 // front edge + buttons + pockets
 CH_line(CH_dk(CH_COAT,0.45),2.4);g.beginPath();g.moveTo(0,-372);g.quadraticCurveTo(4,-250,0,-136);g.stroke();
 for(let i=0;i<3;i++){CH_fill(CH_P(P=>{P.arc(-14,-330+i*52,6,0,7)}),'#6B3A1E',{d:1.5,lw:1.4})}
 for(const sg of [-1,1]){CH_line(CH_dk(CH_COAT,0.4),2.4);g.beginPath();g.moveTo(sg*44,-238);g.lineTo(sg*96,-240);g.stroke()}
 // collar points of the shirt, open
 for(const sg of [-1,1])CH_fill(CH_P(P=>{P.moveTo(sg*6,-482);P.lineTo(sg*44,-492);P.lineTo(sg*30,-458);P.closePath()}),'#FFFFFF',{d:2,edge:'#B9B2A6',lw:1.6});
})}
function CH_whitHead(){return CH_cache('wHead',-190,-780,380,430,2,()=>{
 // neck
 CH_fill(CH_P(P=>{P.rect(-26,-500,52,40)}),CH_WSKIN,{d:3});
 // ears + white side hair
 for(const sg of [-1,1])CH_fill(CH_P(P=>{P.ellipse(sg*80,-566,13,19,0,0,7)}),CH_WSKIN,{d:2});
 // face
 const F=CH_P(P=>{P.moveTo(0,-652);P.bezierCurveTo(52,-652,82,-616,82,-566);P.bezierCurveTo(82,-512,48,-474,0,-472);P.bezierCurveTo(-48,-474,-82,-512,-82,-566);P.bezierCurveTo(-82,-616,-52,-652,0,-652)});
 CH_fill(F,CH_WSKIN,{d:7,hl:[-28,-612,22,12,0.18]});
 // side hair puffs
 for(const sg of [-1,1]){const P=CH_P(P=>{for(const [x,y,r] of [[86,-610,18],[94,-588,17],[92,-562,16],[86,-540,14]])C_circ(P,sg*x,y,r)});CH_fill(P,CH_BEARD,{d:3,sh:'#C9CDD6',edge:'#8B93A3',lw:1.8})}
 // the beard: a big flowing cloud with a wavy bottom
 const B=CH_P(P=>{P.moveTo(-82,-560);P.bezierCurveTo(-92,-520,-100,-470,-86,-430);P.quadraticCurveTo(-80,-398,-58,-392);P.quadraticCurveTo(-52,-366,-30,-372);P.quadraticCurveTo(-16,-346,0,-360);
  P.quadraticCurveTo(16,-346,30,-372);P.quadraticCurveTo(52,-366,58,-392);P.quadraticCurveTo(80,-398,86,-430);P.bezierCurveTo(100,-470,92,-520,82,-560);
  P.bezierCurveTo(70,-536,52,-526,30,-528);P.quadraticCurveTo(0,-516,-30,-528);P.bezierCurveTo(-52,-526,-70,-536,-82,-560);P.closePath()});
 CH_fill(B,CH_BEARD,{d:7,sh:'#C6CBD5',edge:'#8B93A3',lw:2.2,hl:[-40,-480,16,30,0.5,0.3]});
 // strands
 g.save();g.clip(B);CH_line('rgba(140,150,170,0.55)',1.8);const r=RNG(12);for(let i=0;i<14;i++){const x=-70+i*10.5+r()*4,y=-500+r()*20;g.beginPath();g.moveTo(x,y);g.bezierCurveTo(x+r()*16-8,y+40,x+r()*20-10,y+80,x*0.7+r()*8,y+120+r()*10);g.stroke()}g.restore();
 // little smile peeking out of the beard
 g.fillStyle='#B4473C';g.beginPath();g.moveTo(-14,-508);g.quadraticCurveTo(0,-494,14,-508);g.quadraticCurveTo(0,-500,-14,-508);g.fill();
 // moustache
 const M=CH_P(P=>{P.moveTo(0,-526);P.bezierCurveTo(-12,-534,-34,-534,-46,-518);P.bezierCurveTo(-52,-506,-40,-498,-30,-506);P.bezierCurveTo(-20,-512,-8,-512,0,-512);
  P.bezierCurveTo(8,-512,20,-512,30,-506);P.bezierCurveTo(40,-498,52,-506,46,-518);P.bezierCurveTo(34,-534,12,-534,0,-526);P.closePath()});CH_fill(M,CH_BEARD,{d:3,sh:'#C6CBD5',edge:'#8B93A3',lw:1.8});
 // rosy round nose + cheeks
 g.fillStyle='rgba(236,110,96,0.32)';for(const sg of [-1,1]){g.beginPath();g.ellipse(sg*48,-540,15,9,0,0,7);g.fill()}
 CH_fill(CH_P(P=>{P.ellipse(0,-542,15,13,0,0,7)}),'#E99A7E',{d:2.5,edge:'#B86A55',lw:1.6,hl:[-5,-547,5,3,0.5]});
 // bushy white brows
 for(const sg of [-1,1]){const P=CH_P(P=>{for(const [x,y,r] of [[14,-600,8],[26,-605,10],[40,-603,10],[52,-597,8]])C_circ(P,sg*x,y,r)});CH_fill(P,CH_BEARD,{d:2,sh:'#C6CBD5',edge:'#8B93A3',lw:1.5})}
})}
function CH_whitHat(){return CH_cache('wHat',-200,-800,400,200,2,()=>{
 const felt='#8A7663';
 // brim
 const Br=CH_P(P=>{P.ellipse(0,-642,168,34,0,0,7)});CH_fill(Br,felt,{d:5,dy:-1,sh:CH_dk(felt,0.3),edge:CH_dk(felt,0.5),lw:2.4});
 g.save();g.clip(Br);g.fillStyle='rgba(40,25,15,0.25)';g.beginPath();g.ellipse(0,-626,140,20,0,0,7);g.fill();g.restore();
 // crown (a soft pinched dome)
 const Cr=CH_P(P=>{P.moveTo(-84,-650);P.bezierCurveTo(-92,-700,-80,-744,-36,-748);P.quadraticCurveTo(0,-736,36,-750);P.bezierCurveTo(80,-746,92,-700,84,-650);P.quadraticCurveTo(0,-636,-84,-650);P.closePath()});
 CH_fill(Cr,felt,{d:7,sheen:[-750,-690,0.22],hl:[-40,-712,14,24,0.14,0.2]});
 CH_line(CH_dk(felt,0.4),2);g.beginPath();g.moveTo(-10,-742);g.quadraticCurveTo(0,-712,6,-690);g.stroke();
 // band
 CH_fill(CH_P(P=>{P.moveTo(-86,-672);P.quadraticCurveTo(0,-660,86,-672);P.lineTo(85,-652);P.quadraticCurveTo(0,-638,-85,-652);P.closePath()}),'#3F302A',{d:2});
 // a small feather tucked in the band (blue-green)
 g.save();g.translate(60,-668);g.rotate(-0.9);CH_fill(CH_P(P=>{P.ellipse(0,-24,8,26,0,0,7)}),'#3FA69A',{d:2,hl:[-2,-30,2,12,0.3,0]});CH_line('#25685F',1.4);g.beginPath();g.moveTo(0,4);g.lineTo(0,-48);g.stroke();g.restore();
})}
// open book: x,y = spine bottom; s scale; turn 0..1 (a page flips right -> left); ang tilt
function CH_book(x,y,s,turn=0,ang=0,cover='#8E2F2A'){g.save();g.translate(x,y);g.rotate(ang);g.scale(s,s);
 CH_fill(CH_P(P=>{P.moveTo(0,4);P.quadraticCurveTo(-36,-2,-70,8);P.lineTo(-74,-70);P.quadraticCurveTo(-36,-80,0,-74);P.quadraticCurveTo(36,-80,74,-70);P.lineTo(70,8);P.quadraticCurveTo(36,-2,0,4);P.closePath()}),cover,{d:2});
 const pg=(sg)=>CH_P(P=>{P.moveTo(0,-2);P.quadraticCurveTo(sg*32,-8,sg*64,0);P.lineTo(sg*66,-64);P.quadraticCurveTo(sg*32,-74,0,-68);P.closePath()});
 for(const sg of [-1,1]){CH_fill(pg(sg),'#FFF7E6',{d:2,edge:'#B9A27E',lw:1.4});CH_line('rgba(120,110,95,0.45)',1.5);for(let i=0;i<5;i++){g.beginPath();g.moveTo(sg*10,-56+i*11);g.quadraticCurveTo(sg*32,-60+i*11,sg*56,-54+i*11);g.stroke()}}
 if(turn>0&&turn<1){const k=Math.cos(turn*Math.PI);g.save();g.scale(k,1);CH_fill(pg(1),k>0?'#FFF7E6':'#F1E4C8',{d:1.5,edge:'#B9A27E',lw:1.4/Math.max(0.2,Math.abs(k))});g.restore()}
 g.restore()}
// st: {bl (blink), arm (0 down .. 1 raised finger), wag, turn (page), tilt, look}
function CH_whitman(x,y,s,st={}){g.save();g.translate(x,y);g.scale(s,s);
 const br=Math.sin((st.t||0)*2.4)*0.006;g.save();g.scale(1+br,1-br);CH_blit(CH_whitBody(),0,0);g.restore();
 // left arm (viewer's left): bent, holding the open book out to the side
 const bk=[-196,-372];
 CH_tube(CH_P(P=>{P.moveTo(-110,-450);P.lineTo(-156,-330);P.lineTo(bk[0]+10,bk[1]+8)}),34,CH_COAT,{lw:2.2});
 g.fillStyle='#FFFFFF';g.beginPath();g.ellipse(bk[0]+12,bk[1]+10,9,16,0.5,0,7);g.fill();CH_line('#B9B2A6',1.4);g.stroke();
 CH_book(bk[0]-8,bk[1]+2,1.12,st.turn||0,0.12);
 CH_fill(CH_P(P=>{P.ellipse(bk[0]+6,bk[1]-2,14,12,0.3,0,7)}),CH_WSKIN,{d:2});
 // right arm (viewer's right): rises to a raised finger
 const a=st.arm??1,sx=108,sy=-452,hx=lerp(150,184,a)+(st.wag||0)*6,hy=lerp(-300,-580,a);
 const [ex,ey]=CH_ik(sx,sy,hx,hy,92,100,-1);
 CH_tube(CH_P(P=>{P.moveTo(sx,sy);P.lineTo(ex,ey);P.lineTo(hx,hy+18)}),34,CH_COAT,{lw:2.2});
 g.fillStyle='#FFFFFF';g.beginPath();g.ellipse(hx,hy+20,17,7,0,0,7);g.fill();CH_line('#B9B2A6',1.4);g.stroke();
 g.save();g.translate(hx,hy);g.rotate((st.wag||0)*0.25);
 CH_fill(CH_P(P=>{P.roundRect(-14,-14,28,30,9)}),CH_WSKIN,{d:2});
 CH_fill(CH_P(P=>{P.roundRect(-5,-46,11,36,5)}),CH_WSKIN,{d:1.5,lw:1.8});
 CH_fill(CH_P(P=>{P.ellipse(-14,-2,6,9,0.4,0,7)}),CH_WSKIN,{d:1,lw:1.6});g.restore();
 // head: a little tilt and nod
 g.save();g.translate(0,-478);g.rotate(st.tilt||0);g.scale(1.3,1.3);g.translate(0,478);CH_blit(CH_whitHead(),0,0);
 CH_eyes(0,-574,30,1.15,st.bl||0,st.lx??0,st.ly??0,'#2B3A55');
 g.save();g.translate(0,-642);g.rotate(-0.1+(st.hat||0));g.translate(0,642);CH_blit(CH_whitHat(),0,0);g.restore();g.restore();
 g.restore()}
const CH_WHIT_LABEL='Walt Whitman (1819–1892)';
SCENES.a1_poet=(t,c)=>{Wbg(t,1,{ly:600,lr:380,la:0.0});
 // a warm spotlight pool behind him so he pops off the night sky
 g.save();g.globalCompositeOperation='screen';glow(360,640,360,'255,190,120',0.38,0.25);g.restore();
 const tp=WT('poet',18.4),tt=WT('tried',18.8),ar=spr(t-tp+0.12,10,0.5),wag=Math.sin((t-tp)*14)*cl((t-tp)*3)*cl(1-(t-tp-0.9)*2);
 CH_whitman(360,1088,0.86,{t,arm:0.15+0.85*cl(ar),wag,turn:cl((t-tt)/0.45),bl:CH_blink(t,[c.t0+0.32,c.t0+1.18]),tilt:0.04*Math.sin(t*1.8),lx:-1,ly:0.5});
 C_dropIn(CH_WHIT_LABEL,360,312,42,'#FFF8EA',c.t0+0.04,t,{fam:FAM.display,wt:'700',stroke:['#13204E',6],shadow:[14,0.5,4],stag:0.012,fall:30});
 grain(t,0.04)};
SCENES.a5_whitman=(t,c)=>{Wbg(t,1,{ly:520,la:0.05});
 g.save();g.globalCompositeOperation='screen';glow(360,520,330,'255,200,150',0.3,0.25);g.restore();
 const tr=WT('realize',179.5),ar=spr(t-tr+0.1,10,0.5),wag=Math.sin((t-tr)*12)*cl((t-tr)*3)*cl(1-(t-tr-0.9)*2);
 CH_whitman(360,1150,1.0,{t,arm:0.2+0.8*cl(ar),wag,turn:cl((t-c.t0-1.3)/0.5),bl:CH_blink(t,[c.t0+0.5,c.t0+1.7]),tilt:0.035*Math.sin(t*1.6),lx:0.5,ly:0.4});
 grain(t,0.04)};

// ---------------------------------------------------------------------------------------------------------------------
// THE GREAT HORNBILL — illustrated: glossy black body, cream-yellow neck, white wing bars + white trailing edge, a huge
// yellow bill with an orange casque (red-orange front), red eye with lashes, a long cream tail with a black band.
// Two forms: perched (origin = the feet) and flying (origin = body centre); wings flap by a foreshortening scale.
// ---------------------------------------------------------------------------------------------------------------------
const CH_HBK='#1E1D26',CH_HBK2='#2C2F42';
function CH_hbTail(){const P=CH_P(P=>{P.moveTo(-17,0);P.lineTo(-24,150);P.quadraticCurveTo(0,166,24,150);P.lineTo(17,0);P.closePath()});
 CH_fill(P,'#F4ECD6',{d:3,sh:'#D9CFB4',edge:'#7D7464',lw:1.8});g.save();g.clip(P);g.fillStyle=CH_HBK;g.fillRect(-30,82,60,34);CH_line('rgba(120,110,90,0.5)',1.4);g.beginPath();g.moveTo(0,4);g.lineTo(0,150);g.moveTo(-9,10);g.lineTo(-12,150);g.moveTo(9,10);g.lineTo(12,150);g.stroke();g.restore()}
function CH_hbHead(x,y,r){// head, neck stub drawn by the caller; bill + casque + eye
 CH_fill(CH_P(P=>{P.arc(x,y,r,0,7)}),CH_HBK,{d:3,hl:[x-r*0.3,y-r*0.45,r*0.45,r*0.22,0.22],edge:'#0B0B10'});
 // lower mandible
 CH_fill(CH_P(P=>{P.moveTo(x+r*0.55,y+r*0.25);P.quadraticCurveTo(x+r*2.6,y+r*0.75,x+r*4.2,y+r*1.55);P.quadraticCurveTo(x+r*2.6,y+r*1.05,x+r*0.4,y+r*0.75);P.closePath()}),'#F7D45A',{d:2,edge:'#8A6420',lw:1.8});
 // upper mandible (big downcurved)
 const U=CH_P(P=>{P.moveTo(x+r*0.5,y-r*0.55);P.quadraticCurveTo(x+r*2.8,y-r*0.7,x+r*4.3,y+r*1.5);P.quadraticCurveTo(x+r*2.6,y+r*0.5,x+r*0.55,y+r*0.35);P.closePath()});
 CH_fill(U,'#FFDF5E',{d:3,edge:'#8A6420',lw:1.8,hl:[x+r*2,y-r*0.3,r*0.9,r*0.16,0.4,0.25]});
 g.save();g.clip(U);const gr=g.createLinearGradient(x+r*0.5,0,x+r*4.3,0);gr.addColorStop(0,'rgba(240,120,40,0.55)');gr.addColorStop(0.45,'rgba(255,200,60,0)');gr.addColorStop(1,'rgba(255,250,220,0.5)');g.fillStyle=gr;g.fillRect(x,y-r*2,r*5,r*4);g.restore();
 // casque on top of the bill: concave top, orange, red-orange front
 const Cq=CH_P(P=>{P.moveTo(x+r*0.35,y-r*0.6);P.quadraticCurveTo(x+r*0.6,y-r*1.45,x+r*1.3,y-r*1.25);P.quadraticCurveTo(x+r*2.0,y-r*0.95,x+r*2.9,y-r*1.15);P.quadraticCurveTo(x+r*2.85,y-r*0.65,x+r*2.5,y-r*0.42);P.quadraticCurveTo(x+r*1.4,y-r*0.7,x+r*0.5,y-r*0.5);P.closePath()});
 CH_fill(Cq,'#F79A2C',{d:2.5,edge:'#8A4A18',lw:1.8,hl:[x+r*1.2,y-r*1.12,r*0.5,r*0.12,0.35,0.2]});
 g.save();g.clip(Cq);g.fillStyle='#E0452A';g.beginPath();g.moveTo(x+r*2.3,y-r*1.6);g.lineTo(x+r*3.2,y-r*1.6);g.lineTo(x+r*3.2,y);g.lineTo(x+r*2.45,y);g.fill();g.restore();
 // eye: cream ring, red iris, lashes
 const ex=x+r*0.12,ey=y-r*0.18;g.fillStyle='#F2E6C8';g.beginPath();g.arc(ex,ey,r*0.3,0,7);g.fill();g.fillStyle='#E23D2B';g.beginPath();g.arc(ex,ey,r*0.22,0,7);g.fill();
 g.fillStyle='#120A08';g.beginPath();g.arc(ex+r*0.03,ey,r*0.1,0,7);g.fill();g.fillStyle='#FFFFFF';g.beginPath();g.arc(ex-r*0.06,ey-r*0.08,r*0.05,0,7);g.fill();
 CH_line('#0B0B10',1.6);for(let i=0;i<4;i++){const a=-2.4+i*0.32;g.beginPath();g.moveTo(ex+Math.cos(a)*r*0.3,ey+Math.sin(a)*r*0.3);g.lineTo(ex+Math.cos(a)*r*0.48,ey+Math.sin(a)*r*0.48);g.stroke()}}
// the perched bird (no near wing motion): cached; origin = feet
function CH_hbPerch(){return CH_cache('hbPerch',-170,-260,380,440,2,()=>{
 g.save();g.translate(-36,-46);g.rotate(0.42);CH_hbTail();g.restore();
 // legs + toes
 CH_line('#4A4A55',7);g.beginPath();g.moveTo(-14,-34);g.lineTo(-10,-2);g.moveTo(8,-34);g.lineTo(10,-2);g.stroke();CH_line('#4A4A55',5);for(const x of [-10,10]){g.beginPath();g.moveTo(x-12,2);g.lineTo(x+14,2);g.stroke()}
 // body
 const Bd=CH_P(P=>{P.ellipse(-4,-86,50,72,0.5,0,7)});CH_fill(Bd,CH_HBK,{d:6,edge:'#0B0B10',hl:[10,-120,22,12,0.14,-0.6]});
 // neck (cream-yellow)
 CH_fill(CH_P(P=>{P.moveTo(2,-132);P.quadraticCurveTo(14,-170,30,-190);P.lineTo(58,-176);P.quadraticCurveTo(46,-150,40,-118);P.closePath()}),'#F3E2A2',{d:3,edge:'#8C7A40',lw:1.6});
 // folded wing: black with a white bar and white trailing tips
 const Wg=CH_P(P=>{P.moveTo(30,-136);P.quadraticCurveTo(-10,-150,-42,-104);P.quadraticCurveTo(-72,-56,-86,8);P.quadraticCurveTo(-40,-30,-10,-50);P.quadraticCurveTo(20,-74,30,-136);P.closePath()});
 CH_fill(Wg,CH_HBK2,{d:4,edge:'#0B0B10',lw:2});
 g.save();g.clip(Wg);g.fillStyle='#F4F1E8';g.beginPath();g.moveTo(-60,-120);g.lineTo(40,-112);g.lineTo(40,-96);g.lineTo(-60,-102);g.fill();
 CH_line('rgba(255,255,255,0.18)',1.6);for(let i=0;i<6;i++){g.beginPath();g.moveTo(16-i*8,-90+i*4);g.quadraticCurveTo(-30-i*6,-50+i*6,-70-i*2,-4+i*2);g.stroke()}
 g.fillStyle='#F4F1E8';for(let i=0;i<5;i++){g.beginPath();g.ellipse(-50-i*7,-40+i*11,10,5,-1.0,0,7);g.fill()}g.restore();
 CH_hbHead(44,-196,30);
})}
// a spread wing (shoulder at origin, pointing up = -y); white bar + white trailing edge
function CH_hbWing(dark){return CH_cache(dark?'hbWingD':'hbWing',-140,-230,200,250,2,()=>{
 const P=CH_P(P=>{P.moveTo(28,6);P.quadraticCurveTo(30,-80,6,-140);P.quadraticCurveTo(-20,-196,-62,-214);
  for(let i=0;i<6;i++){const a=-62-i*10,b=-206+i*30;P.quadraticCurveTo(a-14,b+6,a-10,b+22)}
  P.quadraticCurveTo(-110,-30,-70,-6);P.quadraticCurveTo(-30,8,28,6);P.closePath()});
 CH_fill(P,dark?'#141319':CH_HBK2,{d:4,edge:'#0B0B10',lw:2,sheen:dark?null:[-200,-120,0.12]});
 g.save();g.clip(P);g.fillStyle=dark?'rgba(200,196,186,0.7)':'#F4F1E8';g.beginPath();g.moveTo(-6,8);g.quadraticCurveTo(-14,-80,-44,-150);g.quadraticCurveTo(-58,-186,-74,-206);g.lineTo(-84,-196);g.quadraticCurveTo(-64,-150,-52,-110);g.quadraticCurveTo(-36,-50,-30,8);g.closePath();g.fill();
 g.fillStyle=dark?'rgba(200,196,186,0.6)':'#F4F1E8';for(let i=0;i<7;i++){g.beginPath();g.ellipse(-82-i*1,-20-i*22,12,6,1.2,0,7);g.fill()}
 CH_line('rgba(255,255,255,0.16)',1.4);for(let i=0;i<6;i++){g.beginPath();g.moveTo(10-i*4,-10-i*6);g.quadraticCurveTo(-40-i*6,-90-i*10,-60-i*4,-200+i*26);g.stroke()}g.restore();
})}
// flying form; origin = body centre; k = wing foreshortening (1 up .. -0.9 down); pitch rad
function CH_hbFly(x,y,s,k,pitch=0,legs=0){g.save();g.translate(x,y);g.rotate(pitch);g.scale(s,s);
 // far wing (behind)
 g.save();g.translate(-6,-18);g.scale(0.9,k*0.94);CH_blit(CH_hbWing(true),0,0);g.restore();
 // tail
 g.save();g.translate(-58,-4);g.rotate(Math.PI/2+0.06);CH_hbTail();g.restore();
 // legs (lowered when landing)
 if(legs>0.02){CH_line('#4A4A55',6);g.beginPath();g.moveTo(-10,20);g.lineTo(-14+legs*8,20+legs*34);g.moveTo(8,20);g.lineTo(6+legs*8,20+legs*34);g.stroke()}
 // body + neck + head
 CH_fill(CH_P(P=>{P.ellipse(0,0,76,34,-0.06,0,7)}),CH_HBK,{d:5,edge:'#0B0B10',hl:[-6,-18,30,8,0.14,0]});
 CH_fill(CH_P(P=>{P.moveTo(46,-22);P.quadraticCurveTo(66,-36,82,-40);P.lineTo(94,-14);P.quadraticCurveTo(76,-6,56,10);P.closePath()}),'#F3E2A2',{d:2,edge:'#8C7A40',lw:1.6});
 CH_hbHead(96,-34,26);
 // near wing (front)
 g.save();g.translate(10,-14);g.scale(1,k);CH_blit(CH_hbWing(false),0,0);g.restore();
 g.restore()}
// perched with an optional open near wing folding in (f 0 open .. 1 folded) and a head bob
function CH_hbPerched(x,y,s,f=1,bob=0,hd=0){g.save();g.translate(x,y);g.scale(s,s);g.translate(0,bob);CH_blit(CH_hbPerch(),0,0);
 if(f<0.99){const e=eio(cl(f));g.save();g.translate(14,-130);g.rotate(lerp(-0.35,-2.3,e));g.scale(lerp(1,0.55,e),lerp(1,0.3,e));g.globalAlpha*=cl((1-f)*3);CH_blit(CH_hbWing(false),0,0);g.restore()}
 g.restore()}
// ---------------------------------------------------------------------------------------------------------------------
// THE TEXTBOOK COVER — an original illustrated cover: teal sky, a pale sun, layered green hills, glossy jungle leaves,
// a cream title plate. Text is drawn live (QA-logged). Local origin = cover centre; 500 x 660.
// ---------------------------------------------------------------------------------------------------------------------
function CH_coverArt(){return CH_cache('cover',-276,-346,552,700,2,()=>{
 // page block + spine shadow
 g.fillStyle='rgba(10,20,40,0.35)';g.beginPath();g.roundRect(-246,-320,510,674,16);g.fill();
 g.fillStyle='#F6EEDB';g.beginPath();g.roundRect(-244,-326,504,664,12);g.fill();CH_line('#C9B998',1.2);for(let i=0;i<5;i++){g.beginPath();g.moveTo(256-i*2,-320+i*2);g.lineTo(256-i*2,330-i*2);g.stroke()}
 const R=CH_P(P=>{P.roundRect(-250,-330,500,660,14)});
 const sk=g.createLinearGradient(0,-330,0,200);sk.addColorStop(0,'#8FE0D2');sk.addColorStop(0.55,'#3DB3A5');sk.addColorStop(1,'#1F8C86');g.fillStyle=sk;g.fill(R);
 g.save();g.clip(R);
 g.save();g.globalCompositeOperation='soft-light';g.globalAlpha=0.6;g.drawImage(C_WASH,-300,-380,600,760);g.restore();
 // sun + rays
 g.save();g.globalCompositeOperation='lighter';glow(150,-10,170,'255,236,170',0.5,0.3);g.restore();
 CH_fill(CH_P(P=>{P.arc(150,-10,58,0,7)}),'#FFE89A',{d:4,edge:false,sh:'#FFD067'});
 // hills (far -> near)
 const hill=(y,amp,f,ph,c1,c2)=>{const P=CH_P(P=>{P.moveTo(-260,340);for(let x=-260;x<=260;x+=10)P.lineTo(x,y-amp*Math.sin(x*f+ph)-amp*0.4*Math.sin(x*f*2.3+ph*1.7));P.lineTo(260,340);P.closePath()});
  const gr=g.createLinearGradient(0,y-amp,0,y+160);gr.addColorStop(0,c1);gr.addColorStop(1,c2);g.fillStyle=gr;g.fill(P);CH_line('rgba(20,70,50,0.35)',2);g.stroke(P)};
 hill(60,26,0.012,1.2,'#9EDB8C','#5DB86E');hill(130,30,0.016,3.1,'#6CC46A','#3E9C55');
 for(const [x,y,s] of [[-180,96,0.5],[-120,104,0.42],[80,84,0.46],[200,98,0.5]])C_miniTree(x,y,s*2.2,0,7+x);
 hill(210,34,0.011,0.4,'#4DAE5C','#2C8048');
 // a river ribbon
 g.fillStyle='rgba(170,230,255,0.75)';g.beginPath();g.moveTo(-40,330);g.bezierCurveTo(-10,280,60,250,30,210);g.bezierCurveTo(10,190,40,180,60,176);g.bezierCurveTo(70,190,50,210,70,230);g.bezierCurveTo(100,270,60,300,90,330);g.closePath();g.fill();
 // jungle leaves in the bottom corners
 for(let i=0;i<7;i++){C_leaf(-262,330,190-i*12,-0.25-i*0.2,{col:['#46B85A','#2E9A4A','#5ACB6C'][i%3],col2:'#1E6E3A',tint:false,w:0.36})}
 for(let i=0;i<7;i++){C_leaf(262,330,190-i*12,Math.PI+0.25+i*0.2,{col:['#46B85A','#2E9A4A','#5ACB6C'][i%3],col2:'#1E6E3A',tint:false,w:0.36})}
 C_flower(-150,250,26,{p:1,tint:false,col:'#B57BE8',col2:'#8A4FD0'});C_flower(170,262,24,{p:1,tint:false,col:'#FF8FB1',col2:'#E2557F'});C_flower(-60,300,20,{p:1,tint:false,col:'#FFB347',col2:'#F08A24'});
 // rain dashes in the sky
 CH_line('rgba(255,255,255,0.45)',2);const r=RNG(4);for(let i=0;i<26;i++){const x=-230+r()*460,y=-300+r()*240;g.beginPath();g.moveTo(x,y);g.lineTo(x-5,y+16);g.stroke()}
 // title plate
 g.fillStyle='rgba(20,60,70,0.28)';g.beginPath();g.roundRect(-196,-262,392,206,22);g.fill();
 CH_fill(CH_P(P=>{P.roundRect(-200,-270,400,206,22)}),'#FFF8EA',{d:3,edge:'#C9A86A',lw:3,sheen:[-270,-200,0.5]});
 CH_line('#C9A86A',1.6);g.beginPath();g.roundRect(-188,-258,376,182,16);g.stroke();
 g.fillStyle='#E0452A';g.fillRect(-46,-148,92,3);
 // spine band (left)
 g.restore();
 const sp=g.createLinearGradient(-250,0,-210,0);sp.addColorStop(0,'rgba(0,0,0,0.38)');sp.addColorStop(0.5,'rgba(0,0,0,0.12)');sp.addColorStop(1,'rgba(255,255,255,0.12)');g.fillStyle=sp;g.save();g.clip(R);g.fillRect(-250,-330,44,660);g.restore();
 CH_line('#145E5A',3);g.stroke(R);
})}
// draw the cover (art + live text) at x,y, scale s, rot; kind of the title text
function CH_cover(x,y,s,rot=0,kind='must'){g.save();g.translate(x,y);g.rotate(rot);g.scale(s,s);CH_blit(CH_coverArt(),0,0);
 C_T('Hornbill',0,-190,96,'#16264E',{fam:FAM.display,wt:'600',st:'italic',kind});
 C_T('Class XI · English',0,-112,40,'#16264E',{fam:FAM.text,wt:'700',ls:1,kind});
 g.restore()}
// a1_hornbill: the bird beats in from the upper left and flares onto the book's top edge on "Hornbill" (the cut)
SCENES.a1_hornbill=(t,c)=>{Wbg(t,1,{ly:520,la:0.06});
 const th=WT('Hornbill',15.5),u=cl((t-c.t0)/(th-c.t0)),bob=Math.sin(t*2)*4;
 g.save();g.globalCompositeOperation='screen';glow(360,520,300,'150,220,255',0.22,0.3);g.restore();
 CH_shadow(360,748,150,12,0.2);
 CH_cover(360,520+bob,0.62,-0.03,'deco');
 // flight path: a quadratic arc into the landing point; wing beat ~3.6 Hz, then a flare (wings up, body pitched up, legs down)
 const e=eo(u),P0=[-150,470],P1=[170,120],P2=[392,252+bob],
  x=lerp(lerp(P0[0],P1[0],e),lerp(P1[0],P2[0],e),e),y=lerp(lerp(P0[1],P1[1],e),lerp(P1[1],P2[1],e),e),
  fl=cl((u-0.72)/0.28),ph=(t-c.t0)*Math.PI*2*3.6,k=lerp(Math.cos(ph),1,eio(fl));
 CH_hbFly(x,y,1.0,k,-0.18+0.12*e-0.32*eio(fl)+Math.sin(ph)*0.03,fl);
 grain(t,0.04)};
// a1_hornbill_cover: the cover close; the bird has just landed on its top edge and folds its wings, bobs, blinks, clacks
SCENES.a1_hornbill_cover=(t,c)=>{Wbg(t,0.95,{moon:false,la:0.06});
 g.save();g.globalCompositeOperation='screen';glow(360,640,420,'150,220,255',0.2,0.3);g.restore();
 const k=c.k;CH_shadow(372,1000,220,16,0.22);
 CH_cover(360,694,0.92,-0.015);
 const f=cl(k/0.4),bob=(1-spr(k,12,0.4))*-10;
 CH_hbPerched(478,392,0.92,f,bob);
 grain(t,0.04)};

// ---------------------------------------------------------------------------------------------------------------------
// ROLL CALL (191.58-197.65): one evening sky; each named noun pops up as an illustrated card (a memory in daylight
// colours), its label beneath (>= 50 px), then the card folds into a star at W_STARS[i]; stars persist and connect.
// ---------------------------------------------------------------------------------------------------------------------
// a small front-facing person (origin = between the feet). o: kid, skin, hair, hs (bun|short|pigtails|cap|curly|long),
// top, bot, sari (colour; border gold), glasses, tash, arms [[lx,ly],[rx,ry]] (hand positions), eyes ('happy'|'open')
function CH_pp(o={}){const kid=!!o.kid,hr=kid?24:28,hy=kid?-104:-164,sy=kid?-76:-124,sw=kid?19:29,hipY=kid?-40:-66,hipW=kid?16:24;
 const skin=o.skin||CH_SKIN,top=o.top||'#3E8EDE',bot=o.bot||'#4F4C5E',hair=o.hair||'#2A1C14';
 const arms=o.arms||[[-sw-10,hipY+4],[sw+10,hipY+4]];
 // legs / skirt
 if(o.sari){CH_fill(CH_P(P=>{P.moveTo(-hipW-2,sy+20);P.quadraticCurveTo(-hipW-12,-30,-hipW-16,-2);P.lineTo(hipW+16,-2);P.quadraticCurveTo(hipW+12,-30,hipW+2,sy+20);P.closePath()}),o.sari,{d:4});
  g.fillStyle='#F2C14E';g.fillRect(-hipW-16,-12,2*hipW+32,7);for(const sg of [-1,1]){g.fillStyle='#3B2A22';g.beginPath();g.ellipse(sg*9,0,9,4,0,0,7);g.fill()}}
 else if(o.frock){for(const sg of [-1,1]){CH_tube(CH_P(P=>{P.moveTo(sg*7,hipY+6);P.lineTo(sg*8,-6)}),9,skin,{lw:1.6})}
  CH_fill(CH_P(P=>{P.moveTo(-sw+4,sy+8);P.lineTo(-sw-10,hipY+16);P.quadraticCurveTo(0,hipY+24,sw+10,hipY+16);P.lineTo(sw-4,sy+8);P.closePath()}),o.frock,{d:3});
  for(const sg of [-1,1]){g.fillStyle='#E2557F';g.beginPath();g.ellipse(sg*9,-3,8,4,0,0,7);g.fill()}}
 else{for(const sg of [-1,1]){CH_tube(CH_P(P=>{P.moveTo(sg*hipW*0.5,hipY);P.lineTo(sg*(hipW*0.55+2),-6)}),kid?11:15,bot,{lw:1.8});g.fillStyle='#3B2A22';g.beginPath();g.ellipse(sg*(hipW*0.55+5),-3,kid?8:10,kid?4:5,0,0,7);g.fill()}}
 // torso
 if(!o.frock)CH_fill(CH_P(P=>{P.moveTo(-sw,sy);P.quadraticCurveTo(-sw-4,(sy+hipY)/2,-hipW,hipY);P.lineTo(hipW,hipY);P.quadraticCurveTo(sw+4,(sy+hipY)/2,sw,sy);P.quadraticCurveTo(0,sy-8,-sw,sy);P.closePath()}),o.sari?(o.blouse||'#F2C14E'):top,{d:3});
 if(o.sari){g.save();CH_fill(CH_P(P=>{P.moveTo(-sw+2,sy-2);P.lineTo(-sw+16,sy-4);P.lineTo(hipW+4,hipY+10);P.lineTo(hipW-10,hipY+16);P.closePath()}),o.sari,{d:2});g.restore();CH_line('#F2C14E',3);g.beginPath();g.moveTo(-sw+16,sy-4);g.lineTo(hipW+4,hipY+10);g.stroke()}
 // arms
 for(let i=0;i<2;i++){const sg=i?1:-1,[hx,hy2]=arms[i];CH_tube(CH_P(P=>{P.moveTo(sg*(sw-4),sy+4);P.quadraticCurveTo(sg*(sw+6),(sy+hy2)/2+4,hx,hy2)}),kid?9:12,o.sari?skin:(o.sleeve||top),{lw:1.6});
  CH_fill(CH_P(P=>{P.arc(hx,hy2,kid?5.5:7,0,7)}),skin,{d:1.5,lw:1.4})}
 // head
 CH_fill(CH_P(P=>{P.rect(-5,hy+hr-6,10,12)}),skin,{d:1.5,lw:1.4});
 const hs=o.hs||'short';
 if(hs==='bun'){CH_fill(CH_P(P=>{P.arc(0,hy-hr-4,hr*0.48,0,7)}),hair,{d:2,lw:1.6})}
 if(hs==='long'){CH_fill(CH_P(P=>{P.moveTo(-hr-2,hy);P.quadraticCurveTo(-hr-6,hy+hr*1.6,-hr*0.4,hy+hr*1.7);P.lineTo(hr*0.4,hy+hr*1.7);P.quadraticCurveTo(hr+6,hy+hr*1.6,hr+2,hy);P.closePath()}),hair,{d:2,lw:1.6})}
 if(hs==='pigtails'){for(const sg of [-1,1]){CH_fill(CH_P(P=>{P.ellipse(sg*(hr+8),hy+4,8,13,sg*0.4,0,7)}),hair,{d:2,lw:1.4});g.fillStyle='#E2557F';g.beginPath();g.arc(sg*(hr+3),hy-4,3.5,0,7);g.fill()}}
 for(const sg of [-1,1])CH_fill(CH_P(P=>{P.ellipse(sg*hr,hy+2,5,7,0,0,7)}),skin,{d:1,lw:1.4});
 CH_fill(CH_P(P=>{P.arc(0,hy,hr,0,7)}),skin,{d:3,hl:[-hr*0.35,hy-hr*0.4,hr*0.3,hr*0.18,0.18]});
 // hair cap
 if(hs==='cap'){CH_fill(CH_P(P=>{P.moveTo(-hr-1,hy-2);P.quadraticCurveTo(-hr,hy-hr-6,0,hy-hr-6);P.quadraticCurveTo(hr,hy-hr-6,hr+1,hy-2);P.closePath()}),o.capc||'#1F4E9A',{d:2});CH_fill(CH_P(P=>{P.moveTo(-hr*0.2,hy-6);P.quadraticCurveTo(hr*0.9,hy-10,hr*1.5,hy-2);P.quadraticCurveTo(hr*0.8,hy+1,-hr*0.2,hy-2);P.closePath()}),o.capc||'#1F4E9A',{d:1.5})}
 else{const Hh=CH_P(P=>{P.moveTo(-hr-1,hy+4);P.quadraticCurveTo(-hr-3,hy-hr-4,0,hy-hr-3);P.quadraticCurveTo(hr+3,hy-hr-4,hr+1,hy+4);P.quadraticCurveTo(hr*0.7,hy-hr*0.5,hs==='short'?hr*0.1:0,hy-hr*0.55);P.quadraticCurveTo(-hr*0.6,hy-hr*0.5,-hr-1,hy+4);P.closePath()});CH_fill(Hh,hair,{d:2,lw:1.6,hl:[-hr*0.3,hy-hr*0.8,hr*0.3,hr*0.12,0.18,-0.2]});
  if(hs==='curly'){for(let i=0;i<7;i++){const a=-2.9+i*0.45;CH_fill(CH_P(P=>{P.arc(Math.cos(a)*hr*0.95,hy+Math.sin(a)*hr*0.95,hr*0.32,0,7)}),hair,{d:1.5,lw:1.3})}}}
 // face
 const ey=hy+hr*0.06,ex=hr*0.36;if((o.eyes||'happy')==='happy'){CH_line('#2A1A12',kid?2.4:2.8);for(const sg of [-1,1]){g.beginPath();g.moveTo(sg*ex-5,ey+2);g.quadraticCurveTo(sg*ex,ey-5,sg*ex+5,ey+2);g.stroke()}}
 else{g.fillStyle='#2A1A12';for(const sg of [-1,1]){g.beginPath();g.ellipse(sg*ex,ey,3.4,4.4,0,0,7);g.fill()}g.fillStyle='#FFFFFF';for(const sg of [-1,1]){g.beginPath();g.arc(sg*ex-1,ey-1.6,1.3,0,7);g.fill()}}
 g.fillStyle='rgba(235,96,86,0.32)';for(const sg of [-1,1]){g.beginPath();g.ellipse(sg*hr*0.58,hy+hr*0.38,5,3,0,0,7);g.fill()}
 if(o.tash){g.fillStyle='#2A1A12';g.beginPath();g.ellipse(-5,hy+hr*0.42,6,2.6,0.2,0,7);g.ellipse(5,hy+hr*0.42,6,2.6,-0.2,0,7);g.fill()}
 CH_line('#9B2D2D',2.4);g.beginPath();g.moveTo(-7,hy+hr*0.52);g.quadraticCurveTo(0,hy+hr*0.78,7,hy+hr*0.52);g.stroke();
 if(o.bindi){g.fillStyle='#D62839';g.beginPath();g.arc(0,hy-hr*0.38,2.4,0,7);g.fill()}
 if(o.glasses){CH_line('#2B2730',2.2);for(const sg of [-1,1]){g.beginPath();g.arc(sg*ex,ey,7.5,0,7);g.stroke()}g.beginPath();g.moveTo(-ex+7.5,ey);g.lineTo(ex-7.5,ey);g.stroke()}
}
const CH_CARD=[420,290];   // card w,h
// card backgrounds: sky gradient + ground (+ sun), drawn in local card coords (origin = centre)
function CH_cardBg(sky,ground,o={}){const [w,h]=CH_CARD;const sg=g.createLinearGradient(0,-h/2,0,h/2);sg.addColorStop(0,sky[0]);sg.addColorStop(1,sky[1]);g.fillStyle=sg;g.fillRect(-w/2,-h/2,w,h);
 g.save();g.globalCompositeOperation='soft-light';g.globalAlpha=0.5;g.drawImage(C_WASH,-w/2-20,-h/2-20,w+40,h+40);g.restore();
 if(o.sun){g.save();g.globalCompositeOperation='lighter';glow(o.sun[0],o.sun[1],90,'255,236,170',0.45,0.3);g.restore();CH_fill(CH_P(P=>{P.arc(o.sun[0],o.sun[1],26,0,7)}),'#FFE27A',{d:3,edge:false,sh:'#FFC94A'})}
 if(ground){const gy=o.gy??60;const P=CH_P(P=>{P.moveTo(-w/2-4,h/2+4);P.lineTo(-w/2-4,gy+10);P.quadraticCurveTo(-w/4,gy-14,0,gy);P.quadraticCurveTo(w/4,gy+12,w/2+4,gy-6);P.lineTo(w/2+4,h/2+4);P.closePath()});
  const gg=g.createLinearGradient(0,gy-14,0,h/2);gg.addColorStop(0,ground[0]);gg.addColorStop(1,ground[1]);g.fillStyle=gg;g.fill(P);CH_line('rgba(20,70,40,0.3)',2);g.stroke(P)}}
// --- the five memories (static parts cached; local card coords) ---
const CH_VIG={
 parents:()=>CH_cache('vParents',-210,-145,420,290,2,()=>{CH_cardBg(['#FFE3A8','#FFF4D6'],['#8ED46A','#4FAE55'],{sun:[150,-80],gy:70});
  C_tree(-150,92,0.22,{p:1,seed:3,tint:false,t:0});for(const [x,y,c] of [[-40,110,'#B57BE8'],[60,120,'#FF8FB1'],[150,104,'#FFB347'],[-110,124,'#FF8FB1']])C_flower(x,y,9,{p:1,tint:false,col:c});
  C_grass(-210,96,420,{h:12,dens:0.5,seed:4,tint:false,t:0});
  g.save();g.translate(-78,126);CH_pp({sari:'#D6336C',blouse:'#F2C14E',hair:'#24160E',hs:'bun',bindi:1,skin:'#C98A5C',arms:[[-38,-70],[44,-92]]});g.restore();
  g.save();g.translate(78,126);CH_pp({top:'#3E8EDE',bot:'#4F4C5E',hair:'#2A1C14',hs:'short',glasses:1,tash:1,skin:'#B97A50',arms:[[-44,-92],[38,-70]]});g.restore()}),
 friends:()=>CH_cache('vFriends',-210,-145,420,290,2,()=>{CH_cardBg(['#7FA7D9','#C5D9F0'],['#6E7F95','#4E5D72'],{gy:74});
  // a rainy town: soft houses + trees behind
  for(const [x,w,h,c] of [[-200,70,90,'#9DB4D6'],[-130,60,120,'#8EA6CB'],[110,70,100,'#9DB4D6'],[170,60,80,'#8EA6CB']]){g.fillStyle=c;g.fillRect(x,74-h,w,h);g.fillStyle='rgba(255,236,170,0.8)';for(let j=0;j<3;j++)g.fillRect(x+10+j*18,74-h+16,8,10)}
  for(const x of [-60,60]){CH_fill(CH_P(P=>{P.rect(x-4,30,8,46)}),'#7A5A3A',{d:1.5,lw:1.4});CH_fill(CH_P(P=>{C_circ(P,x,18,26);C_circ(P,x-16,30,18);C_circ(P,x+16,30,18)}),'#5DA86A',{d:3})}
  // puddles
  for(const [x,y,w] of [[-120,112,70],[100,124,90],[10,104,50]]){g.fillStyle='rgba(170,205,240,0.75)';g.beginPath();g.ellipse(x,y,w,9,0,0,7);g.fill();g.strokeStyle='rgba(255,255,255,0.5)';g.lineWidth=1.5;g.beginPath();g.ellipse(x-w*0.2,y-2,w*0.4,3,0,Math.PI,2*Math.PI);g.stroke()}
  g.save();g.translate(-46,128);CH_pp({kid:1,top:'#F2B33D',bot:'#3E5F8A',hair:'#24160E',hs:'pigtails',skin:'#C98A5C',arms:[[-14,-70],[26,-50]],frock:'#F2B33D'});g.restore();
  g.save();g.translate(46,128);CH_pp({kid:1,top:'#58B368',bot:'#4F4C5E',hair:'#4A2E1E',hs:'curly',skin:'#B97A50',arms:[[-26,-50],[14,-70]]});g.restore()}),
 club:()=>CH_cache('vClub',-210,-145,420,290,2,()=>{CH_cardBg(['#9FDCF7','#E2F6FF'],['#7BCB5C','#3F9A47'],{sun:[-150,-86],gy:44});
  // the pitch strip + a little pavilion with a pennant
  g.fillStyle='#E9D9A6';g.beginPath();g.moveTo(-40,48);g.lineTo(40,48);g.lineTo(90,150);g.lineTo(-90,150);g.closePath();g.fill();
  CH_fill(CH_P(P=>{P.rect(110,-2,90,46)}),'#FFF6E4',{d:2});CH_fill(CH_P(P=>{P.moveTo(100,0);P.lineTo(155,-34);P.lineTo(210,0);P.closePath()}),'#E85D4A',{d:2});
  CH_line('#6E5038',2);g.beginPath();g.moveTo(155,-34);g.lineTo(155,-66);g.stroke();g.fillStyle='#3E8EDE';g.beginPath();g.moveTo(155,-66);g.lineTo(178,-58);g.lineTo(155,-50);g.fill();
  // wicket (three stumps + bails) behind the batter
  for(let i=0;i<3;i++){CH_fill(CH_P(P=>{P.roundRect(-104+i*12,40,6,62,2)}),'#F4E2B8',{d:1,lw:1.2,edge:'#8A6A40'})}CH_line('#8A6A40',3);g.beginPath();g.moveTo(-106,40);g.lineTo(-74,40);g.stroke();
  g.save();g.translate(-40,132);CH_pp({kid:1,top:'#FFFFFF',bot:'#F4F1E8',hair:'#24160E',hs:'cap',capc:'#1F4E9A',skin:'#C98A5C',eyes:'open',arms:[[18,-62],[26,-64]]});g.restore()}),
 society:()=>CH_cache('vSociety',-210,-145,420,290,2,()=>{CH_cardBg(['#FFB38A','#FFE1B8'],['#C9A06A','#A87C48'],{sun:[0,-30],gy:96});
  // a big tree, a row of colourful village houses with tiled roofs, a lantern string
  CH_fill(CH_P(P=>{P.rect(170,10,14,80)}),'#7A5A3A',{d:2});CH_fill(CH_P(P=>{C_circ(P,176,-10,40);C_circ(P,146,8,28);C_circ(P,206,6,28)}),'#4FA65E',{d:4});
  const hc=[['#F6A5C0','#C2453C'],['#FFE08A','#B8562E'],['#9ED6F2','#A0442E'],['#B9E8A0','#C2453C'],['#D9B8F2','#8E3B2E']];
  hc.forEach(([wall,roof],i)=>{const x=-200+i*72,h=62+((i*17)%22),y=100;CH_fill(CH_P(P=>{P.rect(x+4,y-h,62,h)}),wall,{d:3});CH_fill(CH_P(P=>{P.moveTo(x-4,y-h+2);P.lineTo(x+35,y-h-30);P.lineTo(x+74,y-h+2);P.closePath()}),roof,{d:2});
   CH_fill(CH_P(P=>{P.roundRect(x+26,y-30,18,30,[8,8,0,0])}),'#7A4A2A',{d:1.5,lw:1.4})});
  CH_line('rgba(80,50,30,0.7)',1.6);g.beginPath();g.moveTo(-210,-40);g.quadraticCurveTo(-30,-6,180,-38);g.stroke()}),
};
// the per-frame (animated) layer of each memory, in card coords; u = seconds since the word
const CH_VIGA={
 parents:(t,u)=>{const sw=Math.abs(Math.sin(u*5.2))*cl(u*4),cy=126-sw*26;// the child swings between their hands
  CH_line('#C98A5C',9);g.beginPath();g.moveTo(-34,34);g.quadraticCurveTo(-24,cy-60,-14,cy-66);g.stroke();CH_line('#B97A50',9);g.beginPath();g.moveTo(34,34);g.quadraticCurveTo(24,cy-60,14,cy-66);g.stroke();
  g.save();g.translate(0,cy);CH_pp({kid:1,frock:'#FFD23F',hair:'#24160E',hs:'pigtails',skin:'#C98A5C',arms:[[-16,-66],[16,-66]]});g.restore()},
 friends:(t,u)=>{for(const [x,c,ph] of [[-46,'#E8463C',0],[46,'#F2B33D',1.3]]){const b=Math.sin(t*3+ph)*2;g.save();g.translate(x,b);CH_line('#5A4632',3);g.beginPath();g.moveTo(x>0?-14:14,58);g.lineTo(0,-34);g.stroke();
   const U=CH_P(P=>{P.moveTo(-62,-24);P.quadraticCurveTo(-58,-78,0,-82);P.quadraticCurveTo(58,-78,62,-24);for(let i=0;i<4;i++){const a=62-i*31;P.quadraticCurveTo(a-15,-34,a-31,-24)}P.closePath()});CH_fill(U,c,{d:4,sheen:[-82,-50,0.35]});
   CH_line(CH_dk(c,0.35),1.6);for(const xx of [-31,0,31]){g.beginPath();g.moveTo(0,-82);g.quadraticCurveTo(xx*0.7,-50,xx,-26);g.stroke()}g.restore()}
  const r=RNG(5);CH_line('rgba(235,245,255,0.75)',1.6);for(let i=0;i<40;i++){const x=-210+r()*440,y=-145+((r()*300+t*520)%300);g.beginPath();g.moveTo(x,y);g.lineTo(x-4,y+14);g.stroke()}
  for(let i=0;i<4;i++){const ph=(t*1.6+i*0.27)%1;C_ripples([-130,100,0,-90][i],[112,124,104,118][i],t,t-ph*0.9,{n:2,sc:0.35,life:0.9,a:0.6})}},
 teacher:(t,u)=>{g.save();g.scale(0.62,0.62);g.translate(-330,-470);CH_blit(CH_room(),0,0);
  g.save();CH_line('rgba(246,243,230,0.9)',4);for(let i=0;i<3;i++){const w=[110,180,95][i],y=432+i*50,p=cl(u*3-i*0.5);if(p>0){g.beginPath();g.moveTo(196,y);for(let x=0;x<=w*p;x+=8)g.lineTo(196+x,y+Math.sin(x*0.3+i)*5);g.stroke()}}g.restore();
  const ty=cl(u*3)*1.0,tg=[lerp(300,380,ty),lerp(460,540,ty)];CH_teacher(470,688,1.15,{tgt:tg,bl:CH_bl(t,4),tilt:0.03*Math.sin(t*2),lx:0,ly:0.4});CH_blit(CH_desk(),0,0);g.restore()},
 club:(t,u)=>{const hit=0.22,sw=u<hit?lerp(-1.6,-1.9,eio(cl(u/hit))):lerp(-1.9,0.9,eo(cl((u-hit)/0.16)));
  // ball: comes in from the right, is struck, flies up-left out of the card with a trail
  let bx,by;if(u<hit){const k=cl((u+0.3)/(hit+0.3));bx=lerp(190,-6,k);by=lerp(40,74,k)-Math.sin(k*Math.PI)*30}else{const k=u-hit;bx=-6+k*520;by=74-k*640+k*k*300}
  g.save();g.translate(-24,80);g.rotate(sw);CH_fill(CH_P(P=>{P.roundRect(-5,-2,10,26,3)}),'#2A2A33',{d:1});CH_fill(CH_P(P=>{P.roundRect(-9,22,18,64,[3,3,8,8])}),'#E9C98A',{d:2,edge:'#8A6A40',hl:[-3,40,3,16,0.3,0]});g.restore();
  if(u>hit&&u<hit+0.6){g.save();g.globalAlpha=cl(1-(u-hit)/0.6);CH_line('rgba(255,255,255,0.8)',3);g.beginPath();g.moveTo(-6,74);g.quadraticCurveTo((bx-6)/2,(by+74)/2+20,bx,by);g.stroke();C_sparkle(-6,74,16,1,{col:'255,240,200'});g.restore()}
  CH_fill(CH_P(P=>{P.arc(bx,by,8,0,7)}),'#D62828',{d:1.5,edge:'#7A1010',lw:1.6,hl:[bx-2,by-3,3,2,0.5]});CH_line('rgba(255,255,255,0.8)',1.2);g.beginPath();g.arc(bx,by,8,-1,1);g.stroke()},
 society:(t,u)=>{// windows light up one by one; lanterns glow; two villagers wave
  for(let i=0;i<5;i++){const x=-200+i*72,h=62+((i*17)%22),on=cl((u-i*0.08)*6);for(const dx of [10,48]){g.fillStyle=on>0?`rgba(255,${200+30*on},${110+60*on},${0.5+0.5*on})`:'rgba(70,60,90,0.6)';g.fillRect(x+dx,100-h+14,14,14)}if(on>0){g.save();g.globalCompositeOperation='lighter';glow(x+35,100-h+20,30,'255,210,120',0.25*on,0.3);g.restore()}}
  for(let i=0;i<9;i++){const x=-190+i*44,y=-40+Math.sin((x+190)/400*Math.PI)*-14+18*(i%2?0.2:0),c=['#FF5E5E','#FFD23F','#4ECDC4','#B57BE8'][i%4];g.save();g.globalCompositeOperation='lighter';glow(x,y+8,16,C_s(c),0.6*cl(u*4-i*0.2),0.4);g.restore();g.fillStyle=c;g.beginPath();g.ellipse(x,y+8,5,7,0,0,7);g.fill()}
  for(const [x,sh,hs,sk] of [[-120,'#4ECDC4','long','#C98A5C'],[60,'#FF8C42','short','#B97A50']]){const wv=Math.sin(t*9+x)*0.5;g.save();g.translate(x,140);g.scale(0.72,0.72);CH_pp({top:sh,bot:'#5A4A6A',hs,hair:'#24160E',skin:sk,arms:[[-36,-70],[40+wv*8,-150]]});g.restore()}},
};
const CH_ROLL=[['parents','parents',191.4,'#FFB3C7'],['friends','friends',192.7,'#FFE08A'],['the teacher in school','teacher',193.7,'#A8E6CF'],['the club','club',195.2,'#9ED6F2'],['the society around','society',196.2,'#D9B8F2']];
function CH_rollTimes(i){const [,w,a]=CH_ROLL[i],sh=SHOTS.find(s=>s.scene==='a5_'+['parents','friends','teacher','club','society'][i]),tw=WT(w,a),t0=sh?sh.t0:tw-0.15,t1=sh?sh.t1:tw+1;
 const pop=Math.max(t0,tw-0.12),ts=Math.min(Math.max(tw+0.5,t1-0.45),t1-0.32),te=t1-0.02;return {tw,pop,ts,te,t0,t1}}
function CH_rollStar(i,t,a){const [x,y]=W_STARS[i],c=CH_ROLL[i][3],tw=Math.sin(t*3.1+i*1.7)*0.12;
 g.save();g.globalCompositeOperation='lighter';glow(x,y,46,C_s(c),0.4*a,0.35);g.restore();C_sparkle(x,y,15*(1+tw)*a,a,{col:'255,250,230',edge:'rgba(40,30,90,0.5)',rot:0.1*Math.sin(t+i)})}
function CH_rollScene(t,c,upto){Wbg(t,0.95,{moon:false,la:0.05});
 const T=[...Array(upto+1).keys()].map(CH_rollTimes);
 // constellation lines between stars already lit (drawn in as each new star arrives)
 g.save();g.lineCap='round';for(let i=1;i<=upto;i++){const k=cl((t-T[i].te)/0.35);if(k<=0)continue;const [x0,y0]=W_STARS[i-1],[x1,y1]=W_STARS[i];
  g.strokeStyle='rgba(255,246,220,0.55)';g.lineWidth=2.2;g.beginPath();g.moveTo(x0,y0);g.lineTo(lerp(x0,x1,eio(k)),lerp(y0,y1,eio(k)));g.stroke()}g.restore();
 for(let i=0;i<=upto;i++){const k=cl((t-T[i].te+0.05)/0.25);if(k>0)CH_rollStar(i,t,k<1?CH_eb(k):1)}
 // the current memory card
 const i=upto,{tw,pop,ts,te}=T[i];if(t<pop||t>=te)return;
 const [lab,key]=CH_ROLL[i],u=t-tw,p=spr(t-pop,11,0.55),sh=eio(cl((t-ts)/(te-ts))),[sx,sy]=W_STARS[i];
 const cx=lerp(360,sx,sh),cy=lerp(lerp(560,492,cl(p)),sy,sh)+(1-cl(p*1.4))*60,sc=lerp(lerp(0.55,1,p),0.04,sh),rot=(i%2?0.025:-0.025)*(1-sh)+sh*0.9;
 g.save();g.translate(cx,cy);g.rotate(rot);g.scale(sc,sc);g.globalAlpha*=cl(1-(sh-0.75)*4);
 const [w,h]=CH_CARD;g.fillStyle='rgba(30,20,70,0.35)';g.beginPath();g.roundRect(-w/2-8,-h/2-2,w+16,h+20,26);g.fill();
 CH_fill(CH_P(P=>{P.roundRect(-w/2-10,-h/2-10,w+20,h+20,24)}),'#FFF8EA',{d:2,edge:'#B9A27E',lw:2});
 g.save();g.beginPath();g.roundRect(-w/2,-h/2,w,h,16);g.clip();if(CH_VIG[key])CH_blit(CH_VIG[key](),0,0);if(CH_VIGA[key])CH_VIGA[key](t,Math.max(0,u));g.restore();
 CH_line('rgba(120,100,70,0.5)',1.5);g.beginPath();g.roundRect(-w/2,-h/2,w,h,16);g.stroke();
 if(sh>0.6){g.save();g.globalCompositeOperation='lighter';glow(0,0,260,C_s(CH_ROLL[i][3]),0.6*(sh-0.6)*2.5,0.3);g.restore()}
 g.restore();
 // label (fades before the fold so it never shrinks below size)
 const la=cl(p*3)*cl(1-(t-ts)/0.12);if(la>0.01){const sz=lab.length>12?50:56;C_T(lab,360,730,sz,'#FFF8EA',{fam:FAM.display,wt:'700',st:'italic',stroke:['#2A1B5E',7],shadow:[16,0.45,4,'20,10,60'],a:la})}
}
['parents','friends','teacher','club','society'].forEach((n,i)=>{SCENES['a5_'+n]=(t,c)=>{CH_rollScene(t,c,i);grain(t,0.04)}});
