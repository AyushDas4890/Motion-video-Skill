// acts/act1.js — Acts I-II (0-54.88): hook, step i, title, poem page #1, hornbill, poet, first gold; the drop's descent and creation.
'use strict';
{const S=SCENES;
// ---------- the hook: a soft-falling shower across the moon; one macro drop from frame 0; crown splash at 0.20; L1 pops on frames 4-28 ----------
const HOOKW=[['And',0.06,0],['who',0.18,0],['art',0.32,0],['thou?',0.46,1]];
const hookWorld=(t)=>{Wsea(t,{m:1.05,off:188,mx:520,my:150});g.save();g.rotate(0.12);B_rain(t,70,5,620,60,0.5,1.4);g.restore();
 const hit=0.20;if(t<hit){const f=t/hit;Wfall(360,lerp(150,630,f*f),58,1)}else{Wsplash(360,640,t,hit,2.2);Wripple(360,644,t,hit,4,2.4,'236,240,244',0.2);glow(360,640,200,SILVER,0.3*cl(1-(t-hit)/0.9),0.3)}};
S.a1_hookdrop=(t,c)=>{hookWorld(t);kineticBlock(t,HOOKW,[[0,1],[2,3]],{cy:780,small:58,big:150,famB:FAM.bodoni,keyCol:keyCol(t,'thou')});grain(t,0.05)};
S.a1_hookq=(t,c)=>{hookWorld(t);kineticBlock(t,HOOKW,[[0,1],[2,3]],{cy:780,small:58,big:150,famB:FAM.bodoni,keyCol:keyCol(t,'thou')});grain(t,0.05)};
S.a1_lamp=(t,c)=>{Wbg(t,1.1,{mx:470,my:150,ly:430});B_rain(t,60,11,700,70,0.55,0);
 g.save();g.strokeStyle='rgba(8,10,18,0.95)';g.lineWidth=16;g.strokeRect(110,180,500,560);g.lineWidth=9;g.beginPath();g.moveTo(360,180);g.lineTo(360,740);g.moveTo(110,460);g.lineTo(610,460);g.stroke();g.restore();
 for(let i=0;i<9;i++){const x=140+((i*97)%440),y=(200+((i*131+t*60*(0.5+i%3*0.3))%520));B_drop(x,y,4+(i%3),0.8)}
 g.fillStyle='rgba(8,10,18,0.97)';g.fillRect(-W,740,3*W,60);
 g.save();g.translate(360,726);for(const sd of [-1,1]){g.beginPath();g.moveTo(0,8);g.quadraticCurveTo(sd*70,-14,sd*150,0);g.lineTo(sd*150,14);g.quadraticCurveTo(sd*70,4,0,20);g.closePath();g.fillStyle='#E9E1CF';g.fill();g.strokeStyle='rgba(60,50,40,0.5)';g.lineWidth=1;g.stroke();for(let i=0;i<5;i++){g.strokeStyle='rgba(40,44,60,0.35)';g.beginPath();g.moveTo(sd*(24+i*22),2-i*1.2);g.lineTo(sd*(40+i*22),1-i*1.2);g.stroke()}}g.restore();
 grain(t,0.05)};
S.a1_chap1=(t,c)=>Wchap(t,c,'1','the poem','i');
S.a1_page=(t,c)=>{Wbg(t,1);const p=eio(cl(c.k/1.1));g.save();g.translate(360,520);g.rotate(-0.06);g.scale(1.3,1.3);B_sheet(-260,-150,520,300,9,{});
 const sz=30,rows=['And who art thou? said I','to the soft-falling shower,'];rows.forEach((r,i)=>{const w=mw(r,sz,FAM.text,'400','italic'),pr=cl(p*2-i);if(pr<=0)return;g.save();g.beginPath();g.rect(-240,-60+i*60-30,(w+20)*pr,60);g.clip();T(r,-230,-60+i*60,sz,B.ink,FAM.text,'400','left',1,{st:'italic',kind:'deco'});g.restore();if(pr<1)Wglint(-230+w*pr,-60+i*60+8,16,0.9,SILVER)});
 g.restore();grain(t,0.05)};
S.a1_title=(t,c)=>{sky('#05060B','#0A0C16');glow(360,600,380,SILVER,0.08,0.3);const u=c.k;dropIn('The Voice',W/2,560,96,B.ivory,c.t0+0.05,t,FAM.display,'600',0.035,'center',{st:'italic',fall:46});dropIn('of the Rain',W/2,670,96,B.ivory,c.t0+0.3,t,FAM.display,'600',0.035,'center',{st:'italic',fall:46});
 rise('WALT WHITMAN',W/2,770,24,'#C9CED8',c.t0+0.6,t,FAM.text,'600',0.02,'center',{ls:6});const dk=cl((u-0.9)/0.35);if(u>0.2&&dk<1)Wfall(W/2,lerp(80,500,eio(cl((u-0.2)/0.7))),10,1);if(dk>0)Wripple(W/2,812,t,c.t0+1.25,2,0.8);
 B_sealOn(()=>B_seal('drop',W/2+214,820,40,0.05,cl((u-1.0)/0.1)));grain(t,0.05)};
S.a1_poem_full=(t,c)=>Wpage(t,c,{sig:c.t0+0.35,title:c.t0,credit:c.t0+0.9,reserve:true});
S.a1_poem_foot=(t,c)=>Wpage(t,c,{sig:-1,credit:-1,key:c.t0+0.4,reserve:true,cam:(py,ph)=>{const z=1+0.012*c.k;g.translate(W/2,py+ph*0.55);g.scale(z,z);g.translate(-W/2,-(py+ph*0.55))}});
// a hornbill in dry brush: heavy curved bill with casque, long tail; wings beat while it flies
function hornbill(x,y,s,flap,col='rgba(12,14,24,0.97)'){g.save();g.translate(x,y);g.scale(s,s);g.fillStyle=col;
 g.beginPath();g.ellipse(0,0,46,22,-0.1,0,7);g.fill();g.beginPath();g.arc(44,-14,14,0,7);g.fill();
 g.fillStyle='#E8DCC0';g.beginPath();g.moveTo(54,-22);g.quadraticCurveTo(96,-30,118,6);g.quadraticCurveTo(92,-6,56,-6);g.closePath();g.fill();
 g.fillStyle='#C9A866';g.beginPath();g.moveTo(52,-26);g.quadraticCurveTo(80,-40,98,-22);g.quadraticCurveTo(76,-28,54,-18);g.fill();
 g.fillStyle=col;g.beginPath();g.moveTo(-40,-4);g.lineTo(-118,10);g.lineTo(-112,22);g.lineTo(-38,10);g.fill();g.fillStyle='rgba(236,232,220,0.85)';g.fillRect(-116,12,22,8);
 const wy=-60*flap;g.fillStyle=col;g.beginPath();g.moveTo(-14,-10);g.quadraticCurveTo(-30,wy-30,-80,wy-20);g.quadraticCurveTo(-40,wy*0.3-6,20,-6);g.fill();
 g.strokeStyle=`rgba(${SILVER},0.5)`;g.lineWidth=1.2;g.beginPath();g.ellipse(0,0,46,22,-0.1,-2.8,-0.4);g.stroke();g.fillStyle='#F1E9DA';g.beginPath();g.arc(48,-17,2.4,0,7);g.fill();g.restore()}
S.a1_hornbill=(t,c)=>{Wbg(t,1,{ly:700});const k=c.k,land=WT('Hornbill',15)-c.t0;g.save();g.translate(360,860);g.rotate(-0.04);B_sheet(-220,-60,440,300,4,{});T('HORNBILL',0,40,34,B.ink,FAM.display,'700','center',1,{ls:6,kind:'deco'});g.restore();
 const f=eio(cl(k/Math.max(0.3,land))),bx=lerp(-120,360,f),by=lerp(260,770,f)-Math.sin(f*Math.PI)*160;hornbill(bx,by,1.5,f<0.98?Math.sin(t*16):0.1);grain(t,0.05)};
S.a1_hornbill_cover=(t,c)=>{Wbg(t,0.9,{moon:false});const k=c.k,z=1+0.45*(1-eo5(k/0.34));g.save();g.translate(360,540);g.scale(z,z);g.rotate(-0.02);B_sheet(-250,-330,500,660,8,{fill:'#E7DFCC'});
 T('Hornbill',0,-110,92,B.ink,FAM.display,'600','center',1,{st:'italic'});g.fillStyle=B.sealDeep;g.fillRect(-40,-50,80,2);T('Class XI  ·  English',0,0,30,'#2A2C38',FAM.text,'600','center',1,{ls:2});T('NCERT',0,52,28,'#2A2C38',FAM.text,'700','center',1,{ls:6});
 hornbill(-10,190,1.0,0.15);g.restore();grain(t,0.05)};
S.a1_poet=(t,c)=>{Wbg(t,1,{ly:540});Wwhitman(t,c,c.k/1.0);grain(t,0.05)};
S.a1_mote=(t,c)=>{Wbg(t,1.2,{moon:false,la:0.05});const k=c.k,r=RNG(3);g.save();g.globalCompositeOperation='lighter';for(let i=0;i<120;i++){const a=r()*6.28,d=60+r()*340,f=eio(cl(k/1.2-r()*0.3));glow(360+Math.cos(a)*d*(1-f),540+Math.sin(a)*d*(1-f),2+r()*3,SILVER,0.6*f+0.2,0.5)}g.restore();glow(360,540,60*eo(cl(k/1.2)),SILVER,0.6,0.3);grain(t,0.05)};
S.a1_gratitude=(t,c)=>{Wbg(t,1.1,{moon:false});const tg=WT('gratitude',22),gk=eo(cl((t-tg)/0.6));B_drop(360,520,110,1,true);if(gk>0){g.save();g.globalAlpha=0.75*gk;const gr=g.createRadialGradient(350,560,6,360,540,120);gr.addColorStop(0,'#FFE6A8');gr.addColorStop(1,'rgba(242,180,80,0.15)');drop(360,520,104*gk,gr);g.restore();glow(360,540,200,GOLDRGB,0.2*gk,0.3)}Wglint(418,440,90,cl((t-tg)/0.12)*(0.85+0.15*Math.sin((t-tg)*9)));grain(t,0.05)};
// ---------- Act II: the drop's descent (every shot changes scale: macro / wide / punch) ----------
S.a2_delve=(t,c)=>{Wbg(t,1,{moon:false});const k=c.k,z=1+k*1.3;g.save();g.translate(360,520);g.scale(z,z);g.translate(0,-k*160);for(let i=0;i<11;i++){const y=-300+i*52;T(POEM[i].slice(0,26),0,y,22,`rgba(220,226,236,${(0.55-i*0.03)})`,FAM.text,'400','center',1,{st:'italic',kind:'deco'})}g.restore();
 g.save();const gr=g.createLinearGradient(0,700,0,900);gr.addColorStop(0,'rgba(10,13,24,0)');gr.addColorStop(0.5,'rgba(10,13,24,0.95)');gr.addColorStop(1,'rgba(10,13,24,0)');g.fillStyle=gr;g.fillRect(0,700,W,200);for(const [x0,x1] of [[0,110],[W,W-110]]){const e=g.createLinearGradient(x0,0,x1,0);e.addColorStop(0,'rgba(10,13,24,1)');e.addColorStop(1,'rgba(10,13,24,0)');g.fillStyle=e;g.fillRect(Math.min(x0,x1),0,110,H)}g.restore();grain(t,0.05)};
S.a2_deeper=(t,c)=>{Wsea(t,{m:1.15,off:-80,moon:false});g.save();g.globalCompositeOperation='lighter';for(let i=0;i<7;i++){const x=120+i*80+Math.sin(t*0.5+i)*20;const gr=g.createLinearGradient(x,0,x+60,900);gr.addColorStop(0,`rgba(${SILVER},0.16)`);gr.addColorStop(1,`rgba(${SILVER},0)`);g.fillStyle=gr;g.beginPath();g.moveTo(x-10,0);g.lineTo(x+18,0);g.lineTo(x+90,900);g.lineTo(x+40,900);g.fill()}
 const r=RNG(8);for(let i=0;i<50;i++){const x=r()*W,y=(r()*H+t*30*(0.4+r()))%H;glow(x,y,1.5+r()*2,SILVER,0.35,0.5)}g.restore();grain(t,0.05)};
function leaf(t,s=1.7,ox=-60,oy=300){Wbg(t,1.05,{ly:600});g.save();g.translate(ox,oy);g.rotate(0.42);g.scale(s,s);const P=new Path2D();P.moveTo(0,0);P.quadraticCurveTo(160,-90,340,0);P.quadraticCurveTo(160,90,0,0);g.fillStyle='rgba(10,12,20,0.96)';g.fill(P);g.strokeStyle=`rgba(${SILVER},0.35)`;g.lineWidth=1.4/s;g.stroke(P);g.beginPath();g.moveTo(0,0);g.lineTo(330,0);g.stroke();for(let i=1;i<7;i++){g.beginPath();g.moveTo(i*44,0);g.lineTo(i*44+30,(i%2?-1:1)*30);g.stroke()}g.restore();return [ox+340*s*Math.cos(0.42),oy+340*s*Math.sin(0.42)]}
S.a2_feel=(t,c)=>{const [x,y]=leaf(t);B_drop(x-6,y+24,14+24*eo(cl(c.k/1.0)),1);grain(t,0.05)};
S.a2_hang=(t,c)=>{const [x,y]=leaf(t,3.2,-640,40),tr=WT('rain',28),u=t-tr;if(u<0)B_drop(x-10+Math.sin(t*30)*2*cl(c.k),y+50,64,1);else Wfall(x-10,y+50+u*u*1400,64,1);grain(t,0.05)};
S.a2_fall=(t,c)=>{Wbg(t,1.05);B_rain(t,110,17,900,90,0.6,1.2);B_rain(t,60,19,1300,60,0.8,0);Wfall(360,lerp(200,1100,cl(c.k/1.5)),20,1);grain(t,0.05)};
S.a2_goldcatch=(t,c)=>{Wbg(t,1.05,{moon:false});B_rain(t,70,17,900,90,0.5,1.2);const y=lerp(380,700,c.k/1.44),tg=WT('gratitude',30);Wfall(360,y,52,1);Wglint(400,y-34,50,cl((t-tg)/0.1)*cl(1-(t-tg-0.5)/0.4));grain(t,0.05)};
S.a2_creator=(t,c)=>{Wbg(t,1,{ly:700});Wground(t,760);const hit=c.t0+0.12;if(t<hit)Wfall(360,lerp(500,760,cl(c.k/0.12)),24,1);else{Wsplash(360,762,t,hit,1.6);Wripple(360,766,t,hit,4,1.6,'241,233,218',0.2);glow(360,760,90,SILVER,0.45*cl(1-(t-hit)),0.3)}grain(t,0.05)};
S.a2_earth=(t,c)=>{Wbg(t,1,{ly:900});const tm=WT('Mother',32.6),k=eo(cl((t-tm+0.3)/0.9));g.save();const gr=g.createRadialGradient(360,1150,100,360,1250,700);gr.addColorStop(0,'rgba(34,40,62,1)');gr.addColorStop(1,'rgba(8,10,18,1)');g.fillStyle=gr;g.beginPath();g.arc(360,1250,lerp(120,620,k),0,7);g.fill();
 g.strokeStyle=`rgba(${SILVER},${0.5*k})`;g.lineWidth=2;g.beginPath();g.arc(360,1250,lerp(120,620,k),Math.PI*1.1,Math.PI*1.9);g.stroke();g.restore();B_enso(360,500,190,eo(cl((t-tm)/0.7)),33,`rgba(${SILVER},0.9)`,16);grain(t,0.05)};
S.a2_voice=(t,c)=>{Wbg(t,1,{moon:false,ly:600});B_drop(360,620,120,1);Wripple(360,700,t,c.t0,3,0.8,'241,233,218',0.3);Wcard(t,c,{lines:[1],bg:()=>{},cy:290,size:30,a:c.t0-0.2,b:c.t1+0.4})};
S.a2_creation=(t,c)=>{Wbg(t,1,{moon:false,ly:640});B_drop(360,660,100,1);const tc=WT('creation',38);rise('creation',W/2,420,84,B.ivory,tc,t,FAM.display,'400',0.04,'center',{st:'italic',shadow:[20,0.7]});grain(t,0.05)};
S.a2_creation_word=(t,c)=>{Wbg(t,1,{moon:false});const z=1+0.04*c.k;g.save();g.translate(W/2,540);g.scale(z,z);glow(0,0,260,SILVER,0.2,0.3);rise('creation',0,0,150,B.ivory,c.t0,t,FAM.display,'400',0.04,'center',{st:'italic',shadow:[30,0.5]});g.restore();grain(t,0.05)};
S.a2_earthword=(t,c)=>{Wbg(t,1,{moon:false});const te=WT('Earth',40);dropIn('Earth',W/2,540,170,B.ivory,c.t0,t,FAM.bodoni,'700',0.03);B_enso(W/2,540,250,eo(cl((t-te)/0.5)),21,`rgba(${SILVER},0.95)`,14,-Math.PI*0.36,Math.PI*1.86,0.62);grain(t,0.05)};
S.a2_card_l3=(t,c)=>Wcard(t,c,{lines:[2],a:42.6,b:44.6,enso:[2,5,WT('Earth',42.7)]});
S.a2_card_l3x=(t,c)=>Wcard(t,{...c,k:c.k+1},{lines:[2],a:42.6,b:44.6,enso:[2,5,WT('Earth',42.7)],cy:540});
S.a2_lyrical=(t,c)=>{Wbg(t,1.05,{moon:false});B_rain(t,90,23,800,80,0.55,1.2);const s='said the voice of the rain,',p=eio(cl(c.k/0.9)),tw=mw(s,54,FAM.display,'400','italic');g.save();g.beginPath();g.rect(W/2-tw/2-10,400,(tw+20)*p,140);g.clip();T(s,W/2,470,54,B.ivory,FAM.display,'400','center',1,{st:'italic',shadow:[16,0.6]});g.restore();g.fillStyle=`rgba(${SILVER},0.8)`;g.fillRect(W/2-tw/2,508,tw*eo(cl((c.k-0.5)/0.5)),1.5);grain(t,0.05)};
S.a2_lyrical2=(t,c)=>{Wbg(t,1,{moon:false});glow(W/2,540,340,SILVER,0.2,0.3);rise('I am the Poem of Earth,',W/2,480,54,B.ivory,c.t0,t,FAM.display,'400',0.02,'center',{st:'italic',shadow:[18,0.6]});rise('said the voice of the rain,',W/2,570,54,B.ivory,c.t0+0.3,t,FAM.display,'400',0.02,'center',{st:'italic',shadow:[18,0.6]});logPoem(2,POEM[2],[...Array(10).keys()]);grain(t,0.05)};
// the drop as a world: refraction of a tiny inverted landscape inside, caustics
function bigdrop(t,c,s,inner){Wbg(t,1.05,{moon:false,ly:560});B_drop(360,560,s,1);if(inner){g.save();g.beginPath();g.ellipse(360,600,s*0.68,s*0.6,0,0,7);g.clip();g.fillStyle='rgba(28,36,60,0.55)';g.fillRect(200,480,320,120);g.fillStyle='rgba(16,20,34,0.7)';g.beginPath();g.moveTo(200,600);for(let x=200;x<=520;x+=10)g.lineTo(x,600-30*Math.abs(Math.sin(x*0.03)));g.lineTo(520,700);g.lineTo(200,700);g.fill();g.fillStyle='rgba(241,233,218,0.9)';g.beginPath();g.arc(320,520,9,0,7);g.fill();g.restore()}}
S.a2_believes=(t,c)=>{bigdrop(t,c,170+10*c.k,1);grain(t,0.05)};
S.a2_jewel=(t,c)=>{bigdrop(t,c,190,0);const r=RNG(31);g.save();g.globalCompositeOperation='lighter';for(let i=0;i<18;i++){const a=r()*6.28+t*0.6,d=50+r()*110;glow(360+Math.cos(a)*d,600+Math.sin(a)*d*0.8,3+r()*5,SILVER,0.6,0.4)}g.restore();grain(t,0.05)};
S.a2_caustics=(t,c)=>{Wbg(t,1.2,{moon:false});g.save();g.globalCompositeOperation='lighter';g.strokeStyle=`rgba(${SILVER},0.24)`;g.lineWidth=1.8;for(let j=0;j<18;j++){g.beginPath();for(let x=-20;x<=W+20;x+=8){const y=160+j*58+Math.sin(x*0.02+t*1.4+j)*16+Math.sin(x*0.051-t*0.9+j*2)*9;x<0?g.moveTo(x,y):g.lineTo(x,y)}g.stroke()}g.restore();B_drop(360,330,60,0.95);grain(t,0.05)};
S.a2_source=(t,c)=>{Wbg(t,1,{ly:400});Wground(t,460);const ts=WT('source',52.4),p=eo(cl((t-ts+0.2)/1.2));Wtree(Wbranches('srctap',360,464,Math.PI/2,260,3,0.55),p,'rgba(122,88,54,0.95)',20,p*0.6,SILVER);grain(t,0.05)};
S.a2_mother=(t,c)=>{Wbg(t,1,{ly:560});const k=eo(cl(c.k/0.6));g.save();g.fillStyle='rgba(22,28,46,1)';g.beginPath();g.arc(360,1150,560,0,7);g.fill();g.restore();glow(360,560,280,SILVER,0.22*k,0.3);B_enso(360,520,200,1,33,`rgba(${SILVER},${0.6+0.35*k})`,16);grain(t,0.05)};
}
