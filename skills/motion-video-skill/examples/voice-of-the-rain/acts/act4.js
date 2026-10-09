// acts/act4.js — Act IV (104.07-143.61): gratitude. Gold arrives on "gratitude"; roots drink silver sap; seeds wake; the rain does its duty.
'use strict';
{const S=SCENES;
S.a4_important=(t,c)=>Wkin(t,c,[['the','the',0],['most','most',0],['IMPORTANT','important',1],['thing','thing',0]],[[0,1],[2],[3]],{big:96});
S.a4_gather=(t,c)=>{Wbg(t,1,{moon:false});const r=RNG(61),k=eio(cl(c.k/0.95));g.save();g.globalCompositeOperation='lighter';for(let i=0;i<120;i++){const a=r()*6.28,d=80+r()*420;glow(360+Math.cos(a)*d*(1-k),540+Math.sin(a)*d*(1-k),2+r()*3,SILVER,0.5,0.5)}g.restore();glow(360,540,50*k,SILVER,0.5,0.3);grain(t,0.05)};
S.a4_chap3=(t,c)=>Wchap(t,c,'3','gratitude','iii');
S.a4_voice=(t,c)=>{Wbg(t,0.95,{moon:false,ly:560});glow(360,560,280,GOLDRGB,0.08,0.3);B_drop(360,560,130,1);Wripple(360,640,t,c.t0,3,0.9,'241,233,218',0.3);grain(t,0.05)};
// L8: the gratitude line — gold sweeps exactly his words; under the card a drop falls into the soil and a gold thread runs down into the roots
const L8R=Wbranches('l8roots',360,912,Math.PI/2,150,4,0.95);
S.a4_card_l8=(t,c)=>Wcard(t,c,{lines:[7],cy:420,a:109.4,b:113.4,under:(t,c)=>{Wground(t,900);const f=cl(c.k/1.2);if(f<1)Wfall(360,lerp(600,900,f*f),12,1);else Wripple(360,904,t,c.t0+1.2,2,0.8);
 Wtree(L8R,1,'rgba(150,140,120,0.45)',9,eo(cl((c.k-1.2)/1.6)),GOLDRGB)}});
S.a4_bloom=(t,c)=>{Wbg(t,0.95,{moon:false,ly:700});B_rain(t,60,51,800,80,0.4,1.2);const k=eo(cl(c.k/1.2));g.save();g.fillStyle='rgba(12,14,24,0.97)';g.beginPath();g.moveTo(-40,1280);g.lineTo(-40,860);g.bezierCurveTo(120,640,300,700,330,800);g.bezierCurveTo(360,860,420,860,470,780);g.bezierCurveTo(560,640,700,700,760,860);g.lineTo(760,1280);g.fill();g.strokeStyle=`rgba(${SILVER},0.4)`;g.lineWidth=1.6;g.beginPath();g.moveTo(-40,860);g.bezierCurveTo(120,640,300,700,330,800);g.bezierCurveTo(360,860,420,860,470,780);g.bezierCurveTo(560,640,700,700,760,860);g.stroke();g.restore();glow(400,790,60+180*k,GOLDRGB,0.35*k,0.3);B_drop(400,790,30,1);grain(t,0.05)};
const soil=(t,y)=>{Wbg(t,0.9,{moon:false,ly:y-120});Wground(t,y)};
const ROOTS=Wbranches('roots4',360,386,Math.PI/2,200,5,0.85);
S.a4_pain=(t,c)=>{soil(t,380);g.save();g.translate(Math.sin(t*40)*1.4,0);Wtree(ROOTS,1,'rgba(150,130,104,0.75)',12);g.restore();for(let i=0;i<5;i++){g.strokeStyle='rgba(4,4,8,0.9)';g.lineWidth=2;g.beginPath();g.moveTo(80+i*140,380);g.lineTo(96+i*140,440);g.stroke()}grain(t,0.05)};
S.a4_pain2=(t,c)=>{soil(t,420);const tp=WT('pain',117.4),p=eo(cl((t-tp+0.05)/0.35));Wtree(Wbranches('crack',360,424,Math.PI/2,280,4,1.4,2),p,'rgba(4,4,8,1)',7,p*0.5,'255,190,150');grain(t,0.05)};
S.a4_return=(t,c)=>{soil(t,380);B_rain(t,90,53,900,80,0.55,0);const k=eo(cl(c.k/1.3));g.save();const gr=g.createLinearGradient(0,380,0,380+520*k);gr.addColorStop(0,'rgba(130,160,200,0.35)');gr.addColorStop(1,'rgba(130,160,200,0)');g.fillStyle=gr;g.fillRect(0,380,W,520*k);g.restore();Wtree(ROOTS,1,'rgba(150,130,104,0.55)',12,k*0.5);grain(t,0.05)};
S.a4_drink=(t,c)=>{soil(t,380);Wtree(ROOTS,1,'rgba(150,130,104,0.5)',12,eo(cl(c.k/0.9)),SILVER);grain(t,0.05)};
// L7: seeds only, latent, unborn — five curled seeds in the soil under the card pulse once on 121.56
const seed=(x,y,s,a,open=0)=>{g.save();g.translate(x,y);g.rotate(a);g.fillStyle='rgba(60,48,34,0.98)';g.beginPath();g.ellipse(0,0,16*s,10*s,0,0,7);g.fill();g.strokeStyle=`rgba(${SILVER},0.55)`;g.lineWidth=1.4;g.beginPath();g.ellipse(0,0,16*s,10*s,0,-2.6,-0.4);g.stroke();g.beginPath();g.moveTo(-10*s,0);g.quadraticCurveTo(0,-4*s,12*s,2*s);g.stroke();
 if(open>0){g.strokeStyle=`rgba(${SILVER},0.9)`;g.lineWidth=2.4;g.beginPath();g.moveTo(4*s,-6*s);g.quadraticCurveTo(10*s,-30*s*open,0,-60*s*open);g.stroke();if(open>0.6){g.fillStyle=`rgba(${SILVER},0.85)`;g.beginPath();g.ellipse(8*s,-60*s*open,10*s,5*s,-0.5,0,7);g.fill()}}g.restore()};
const SEEDS=[[150,960,0.3],[260,1000,-0.4],[360,950,0.1],[470,1010,0.6],[580,965,-0.2]];
S.a4_card_l7=(t,c)=>Wcard(t,c,{lines:[6],cy:430,gloss:[['latent',121.56]],glossW:['latent'],under:(t)=>{Wground(t,880);const pu=Math.exp(-Math.pow((t-121.56-0.3)/0.25,2));SEEDS.forEach(([x,y,a],i)=>{if(pu>0.02)glow(x,y,40,SILVER,0.35*pu,0.4);seed(x,y,1.3+0.15*pu,a)})}});
// people receiving the rain: a child cupping it, a woman with open palms, a farmer bent in the paddy under a conical hat
S.a4_humanity=(t,c)=>{Wbg(t,0.85,{moon:false,ly:700});Wground(t,900);B_rain(t,90,57,900,80,0.5,0);g.save();g.strokeStyle=`rgba(${SILVER},0.35)`;g.lineWidth=1.4;for(let i=0;i<8;i++){g.beginPath();g.moveTo(380+i*40,900);g.lineTo(372+i*40,870);g.stroke()}g.restore();
 Wperson(170,904,2.0,'cup');Wperson(300,904,2.4,'arms');Wperson(500,904,2.3,'bend');grain(t,0.05)};
S.a4_pour=(t,c)=>{Wbg(t,0.85,{moon:false,ly:600});Wground(t,640);B_rain(t,160,59,1100,110,0.9,0);B_rain(t,80,60,900,70,0.6,1.4);for(let i=0;i<6;i++)Wripple(80+i*112,646,t,c.t0+i*0.17,2,0.5,'236,240,244',0.2);const k=eo(cl(c.k/1.0));g.save();const gr=g.createLinearGradient(0,640,0,640+320*k);gr.addColorStop(0,'rgba(130,160,200,0.35)');gr.addColorStop(1,'rgba(130,160,200,0)');g.fillStyle=gr;g.fillRect(0,640,W,320*k);g.restore();
 SEEDS.forEach(([x,y,a],i)=>seed(x,y-150,1.3,a,i===2?eo(cl((c.k-0.4)/0.7)):0));grain(t,0.05)};
S.a4_shoots=(t,c)=>{Wbg(t,0.8,{moon:false,ly:800});Wground(t,860);B_rain(t,50,61,900,80,0.4,1.2);const r=RNG(9);for(let i=0;i<7;i++){const x=120+i*80+r()*20,k=eo(cl(c.k/1.0-i*0.06));B_blade(x,864,-Math.PI/2-0.3,180*k,12,0.6,'rgba(16,18,28,0.98)',1,i);B_blade(x,864,-Math.PI/2+0.3,150*k,11,-0.6,'rgba(16,18,28,0.98)',1,i+9);
 g.strokeStyle=`rgba(${SILVER},${0.5*k})`;g.lineWidth=1.2;g.beginPath();g.moveTo(x,864);g.quadraticCurveTo(x-30,864-100*k,x-60*k,864-160*k);g.stroke()}grain(t,0.05)};
S.a4_card_l9=(t,c)=>Wcard(t,c,{lines:[8],cy:520});
S.a4_card_l8f=(t,c)=>Wcard(t,c,{lines:[7],cy:520,a:130.6,b:132.9,bg:(t)=>{Wbg(t,0.8+0.25*Math.sin(t*2.2),{moon:false})}});
S.a4_rings=(t,c)=>{Wbg(t,0.85,{moon:false});const k=eo(cl(c.k/1.4));for(let i=0;i<10;i++){const R=30+i*26,a=cl(k*10-i);if(a<=0)continue;B_enso(360,540,R,a,i*7+3,`rgba(${SILVER},0.7)`,3+(i%3),-Math.PI*0.5+i*0.4,Math.PI*1.92)}grain(t,0.05)};
S.a4_thousand=(t,c)=>{Wbg(t,1,{moon:false});g.save();g.translate(360,520);const r=RNG(71);for(let i=0;i<180;i++){const R=20+r()*560,a0=r()*6.28,len=0.15+c.k*0.25;g.strokeStyle=`rgba(${SILVER},${0.15+r()*0.4})`;g.lineWidth=1;g.beginPath();g.arc(0,0,R,a0,a0+len);g.stroke()}g.restore();
 const t1=WT('thousand',134.8),t2=WT('two',135.4);if(t>=t1)Wslam(t,c,(t>=t2?'2,000':'1,000')+' years',t>=t2?t2:t1,{size:96,y:380});grain(t,0.05)};
S.a4_duty=(t,c)=>{Wsea(t,{off:120,mt:1,moon:false,m:0.75});B_rain(t,90,63,900,80,0.45,0);glow(360,560,300,'240,214,180',0.1,0.3);grain(t,0.05)};
S.a4_village=(t,c)=>{Wbg(t,0.75,{moon:false,ly:900});glow(360,980,520,'230,200,170',0.12,0.3);B_rain(t,80,67,900,80,0.45,1.2);const r=RNG(13);for(let i=0;i<9;i++){const x=i*86-20+r()*20,w=70+r()*30,h=60+r()*50,y=900;g.fillStyle='rgba(8,10,18,0.97)';g.beginPath();g.moveTo(x,y);g.lineTo(x,y-h);g.lineTo(x+w/2,y-h-36);g.lineTo(x+w,y-h);g.lineTo(x+w,y);g.fill();g.strokeStyle=`rgba(${SILVER},0.3)`;g.lineWidth=1.2;g.beginPath();g.moveTo(x,y-h);g.lineTo(x+w/2,y-h-36);g.lineTo(x+w,y-h);g.stroke();if(r()<0.5){g.fillStyle='rgba(241,226,190,0.8)';g.fillRect(x+w*0.4,y-h*0.6,10,12)}}g.fillStyle='rgba(8,10,18,0.97)';g.fillRect(-W,898,3*W,H);grain(t,0.05)};
// cupped hands holding one drop; on "gratitude" the drop fills with gold and lights the palms
S.a4_existence=(t,c)=>{Wbg(t,0.9,{moon:false,ly:780});const tg=WT('gratitude',140.9),k=eo(cl((t-tg)/0.9));Whand(110,880,1.5,1,0.75);Whand(610,880,1.5,-1,0.75);B_drop(360,800,46,1);if(k>0){g.save();g.globalAlpha=0.8*k;const gr=g.createRadialGradient(352,812,4,360,800,52);gr.addColorStop(0,'#FFE6A8');gr.addColorStop(1,'rgba(242,180,80,0.2)');drop(360,800,44*k,gr);g.restore();glow(360,800,240,GOLDRGB,0.3*k,0.3)}
 Wkin(t,c,[['GRATITUDE','gratitude',1],['should','should',0],['be','be',0],['a','a',0],['part','part',0],['of','of',0],['human','human',0],['existence','existence',0]],[[0],[1,2,3,4,5],[6,7]],{bg:false,cy:H*0.31,big:96,small:46})};
}
