// acts/act5.js — Act V + coda (143.61-221.6): give back. Cold brass pride, the crown melts; roll call of stars; sunrise on "Thank"; poem page #2.
'use strict';
{const S=SCENES;const BRR='167,160,126';
S.a5_why=(t,c)=>{Wbg(t,1,{moon:false});Wslam(t,c,'Why?','why',{size:230})};
S.a5_chap4=(t,c)=>Wchap(t,c,'4','give back','iv');
S.a5_short=(t,c)=>{Wbg(t,0.9,{moon:false,ly:700});Wground(t,900);const r0=360;g.save();g.translate(80,260);g.rotate(0.3);g.fillStyle='rgba(10,12,20,0.96)';g.beginPath();g.moveTo(0,0);g.quadraticCurveTo(120,-60,260,0);g.quadraticCurveTo(120,60,0,0);g.fill();g.restore();
 const f=cl(c.k/1.2);if(f<1)Wfall(r0,lerp(340,900,f*f),26,1);else{Wsplash(r0,902,t,c.t0+1.2,1.2);Wripple(r0,904,t,c.t0+1.2,3,1.2)}grain(t,0.05)};
S.a5_period=(t,c)=>{Wbg(t,0.9,{moon:false});g.fillStyle=`rgba(${SILVER},0.7)`;g.fillRect(100,600,520,2);for(let i=0;i<=8;i++)g.fillRect(100+i*65,590,2,22);B_drop(lerp(130,590,c.k/0.92),520,40,1);grain(t,0.05)};
S.a5_fame=(t,c)=>{Wbg(t,0.95,{moon:false,la:0.05});const tf=WT('fame',148),u=eo(cl((t-tf+0.15)/0.45)),b=cl((t-tf-0.25)/0.5);Wperson(360,960,0.8,'arms');g.save();g.strokeStyle='rgba(176,180,186,0.9)';g.lineWidth=3;g.beginPath();g.moveTo(360,880);g.lineTo(360,lerp(880,300,u));g.stroke();g.restore();if(b>0){const r=RNG(41);for(let i=0;i<22;i++){const a=r()*6.28,d=(40+r()*200)*eo(b);Wstar(360+Math.cos(a)*d,300+Math.sin(a)*d*0.7,2+r()*3,1-b*0.4,'190,194,200')}}grain(t,0.05)};
S.a5_ladder=(t,c)=>{Wbg(t,0.9,{moon:false});const k=eo(cl(c.k/0.5));B_rain(t,Math.round(70*(1-k)),71,900,80,0.5,0);g.save();g.strokeStyle=`rgba(${SILVER},${0.9*k})`;g.lineWidth=4;g.shadowColor=`rgba(${SILVER},0.7)`;g.shadowBlur=10*SC;g.beginPath();g.moveTo(270,1100);g.lineTo(320,160);g.moveTo(450,1100);g.lineTo(400,160);for(let i=0;i<12;i++){const y=1050-i*80,u=(1100-y)/940;g.moveTo(lerp(270,320,u),y);g.lineTo(lerp(450,400,u),y)}g.stroke();g.restore();grain(t,0.05)};
const LR=Wbranches('lroots',360,766,Math.PI/2,190,5,0.95);
const ladderRoots=(t,c,lit)=>{Wbg(t,0.85,{moon:false,ly:780});Wground(t,760);g.save();g.strokeStyle=`rgba(${SILVER},0.9)`;g.lineWidth=4;g.beginPath();g.moveTo(290,764);g.lineTo(320,120);g.moveTo(430,764);g.lineTo(400,120);for(let i=0;i<8;i++){const y=720-i*80,u=(764-y)/644;g.moveTo(lerp(290,320,u),y);g.lineTo(lerp(430,400,u),y)}g.stroke();g.restore();
 Wtree(LR,1,'rgba(150,130,104,0.6)',12,lit,SILVER)};
S.a5_roots=(t,c)=>{ladderRoots(t,c,eo(cl((t-WT('influences',153))/0.8)));grain(t,0.05)};
S.a5_roots_full=(t,c)=>{ladderRoots(t,c,0.6+0.4*eo(cl(c.k/0.8)));grain(t,0.05)};
S.a5_journey=(t,c)=>{Wbg(t,0.85,{moon:false});g.save();g.strokeStyle=`rgba(${SILVER},0.7)`;g.lineWidth=12;g.shadowColor=`rgba(${SILVER},0.6)`;g.shadowBlur=14*SC;g.beginPath();for(let i=0;i<=40;i++){const u=i/40,y=lerp(1150,260,u),x=360+Math.sin(u*9+c.k*0.5)*180*(1-u*0.7);i?g.lineTo(x,y):g.moveTo(x,y)}g.stroke();g.restore();
 for(let i=0;i<8;i++){const u=i/14,y=lerp(1150,260,u),x=360+Math.sin(u*9+c.k*0.5)*180*(1-u*0.7);glow(x+(i%2?8:-8),y,7,SILVER,0.6*cl(c.k*3-i*0.3),0.5)}Wperson(360+Math.sin(9*0.55+c.k*0.5)*180*(1-0.55*0.7),lerp(1150,260,0.55),0.9,'stand');grain(t,0.05)};
// the mosaic: painted faces on rice-paper slips, slightly rotated with bled edges
const FACE=(x,y,w,h,i,t)=>Wface(x,y,w,h,i);
S.a5_mosaic=(t,c)=>{Wbg(t,0.9,{moon:false});mosaic(t,c,[...Array(12).keys()].map(()=>FACE),{tw:220,th:290,cols:3});grain(t,0.05)};
S.a5_mosaic2=(t,c)=>{Wbg(t,0.9,{moon:false});mosaic(t,{...c,k:c.k+2.7},[...Array(12).keys()].map(()=>FACE),{tw:220,th:290,cols:3});grain(t,0.05)};
S.a5_faces=(t,c)=>{Wbg(t,0.9,{moon:false});mosaic(t,{...c,k:c.k+5},[...Array(12).keys()].map(()=>(x,y,w,h,i)=>Wface(x,y,w,h,i,cl(c.k*4-((i*7)%12)*0.3))),{tw:220,th:290,z0:1.1,cols:3});grain(t,0.05)};
S.a5_head=(t,c)=>{Wbg(t,0.95,{moon:false});Whead(t,340,520,1.6,eo(cl(c.k/0.9)));grain(t,0.05)};
S.a5_head_close=(t,c)=>{Wbg(t,0.95,{moon:false});Whead(t,230,640,3.0,1,0.2);grain(t,0.05)};
S.a5_head2=(t,c)=>{Wbg(t,0.9,{moon:false});const k=eo(cl(c.k/0.8));glow(390,480,220,GOLDRGB,0.16*k,0.3);Whead(t,340,520,1.6,1,0.6*k,k>0.5?GOLDRGB:SILVER);grain(t,0.05)};
// hands: A (left) passes one gold spark to B (right); later B returns the drop to A
const hands=(t)=>{Wbg(t,0.9,{moon:false,ly:600});Whand(150,660,1.45,1,0.35);Whand(570,680,1.45,-1,0.35)};
S.a5_spark=(t,c)=>{hands(t);const u=eio(cl(c.k/1.1));Wglint(lerp(310,420,u),600-Math.sin(u*Math.PI)*90,40,1);grain(t,0.05)};
S.a5_spark2=(t,c)=>{hands(t);Wglint(420,610,40,1);glow(420,610,90,GOLDRGB,0.3,0.3);grain(t,0.05)};
S.a5_giveback=(t,c)=>{hands(t);const u=eio(cl(c.k/1.4));B_drop(lerp(420,300,u),610-Math.sin(u*Math.PI)*90,24,1);rise('returns',W/2,470,52,GOLD,c.t0+0.5,t,FAM.display,'600',0.03,'center',{st:'italic',stroke:[B.ink,6]});grain(t,0.05)};
S.a5_card_l1011=(t,c)=>{const tc=c.t0+1.6;Wcard(t,c,{lines:[9,10],cy:520,a:175,b:177.6});B_enso(360,520,320,eo(cl((t-tc)/0.6)),88,`rgba(${GOLDRGB},0.85)`,12,-Math.PI*0.5,Math.PI*1.9,1.2)};
S.a5_whitman=(t,c)=>{Wbg(t,1,{ly:540});Wwhitman(t,c,1,false);grain(t,0.05)};
S.a5_crown=(t,c)=>{Wbg(t,1,{moon:false,la:0.05});const tk=WT('king',183.5);Wcrown(360,540,170,cl((t-c.t0)/(tk-c.t0+0.01)));grain(t,0.05)};
S.a5_crown_close=(t,c)=>{Wbg(t,1,{moon:false,la:0.05});g.save();g.translate(360,540);g.scale(1.3,1.3);g.translate(-360,-540);Wcrown(360,540,170,1);g.restore();g.save();g.strokeStyle=`rgba(240,238,225,${cl(1-c.k/0.5)})`;g.lineWidth=2;g.beginPath();g.moveTo(450,400);g.lineTo(500,380);g.stroke();g.restore();grain(t,0.05)};
S.a5_crown2=(t,c)=>{Wbg(t,1.05,{moon:false,la:0.04});Wcrown(360,520+Math.sin(t*1.5)*6,150,1);grain(t,0.05)};
S.a5_no=(t,c)=>{Wbg(t,1,{moon:false});const tn=WT('no',186.3),m=eo(cl((t-tn)/0.6));Wcrown(360,820,110,1,1-m,m);if(m>0.5)Wfall(360,lerp(840,1120,cl((m-0.5)/0.5)),14,1);Wslam(t,c,'No.',tn,{size:240,y:470})};
const GR5=Wbranches('groots',360,526,Math.PI/2,210,5,0.95);
const rootsLit=(t,c,p,lit)=>{Wbg(t,0.85,{moon:false,ly:560});Wground(t,520);Wtree(GR5,p,'rgba(150,130,104,0.6)',12,lit,SILVER)};
S.a5_rootsglow=(t,c)=>{rootsLit(t,c,1,eo(cl(c.k/1.2)));Wripple(360,524,t,c.t0,3,0.8);grain(t,0.05)};
S.a5_rootsx=(t,c)=>{rootsLit(t,c,1,1);grain(t,0.05)};
// ---------- roll call: one sky; each named noun slides up as a painted tile (80% of the panel), then shrinks into a star that stays ----------
const tileArt={
 parents:(t)=>{Wperson(-60,90,1.5,'stand');Wperson(30,90,1.0,'stand');g.strokeStyle='rgba(12,14,24,0.97)';g.lineWidth=7;g.lineCap='round';g.beginPath();g.moveTo(-44,40);g.quadraticCurveTo(-20,58,12,52);g.stroke();Wperson(110,90,1.5,'stand');g.beginPath();g.moveTo(48,52);g.quadraticCurveTo(70,58,94,40);g.stroke()},
 friends:(t)=>{for(const [x,s] of [[-70,1],[70,1]]){g.fillStyle='rgba(12,14,24,0.97)';g.beginPath();g.arc(x,-20,74,Math.PI,0);g.quadraticCurveTo(x+50,-10,x+37,-6);g.quadraticCurveTo(x+12,-14,x,-6);g.quadraticCurveTo(x-12,-14,x-37,-6);g.quadraticCurveTo(x-50,-10,x-74,-20);g.fill();g.strokeStyle='rgba(12,14,24,0.97)';g.lineWidth=4;g.beginPath();g.moveTo(x,-20);g.lineTo(x,80);g.quadraticCurveTo(x,96,x-14,92);g.stroke()}
  g.strokeStyle='rgba(60,70,100,0.5)';g.lineWidth=1.2;for(let i=0;i<24;i++){const x=-200+i*17,y=((i*53+t*240)%220)-110;g.beginPath();g.moveTo(x,y);g.lineTo(x-3,y+16);g.stroke()}},
 teacher:(t)=>{g.fillStyle='rgba(28,34,30,0.95)';g.fillRect(-150,-90,220,150);g.strokeStyle='#8a6a40';g.lineWidth=6;g.strokeRect(-150,-90,220,150);g.fillStyle='rgba(236,236,226,0.92)';g.font=F(40,FAM.script,'400','normal');g.textAlign='center';if(!QA.hideText)g.fillText('a b c',-40,-4);Wperson(130,90,1.6,'arms')},
 club:(t)=>{g.save();g.rotate(-0.5);g.fillStyle='rgba(12,14,24,0.97)';g.beginPath();g.roundRect(-22,-110,44,170,10);g.fill();g.fillRect(-7,50,14,70);g.restore();g.fillStyle='rgba(176,54,31,0.9)';g.beginPath();g.arc(90,40,22,0,7);g.fill();g.strokeStyle='rgba(241,233,218,0.8)';g.lineWidth=1.5;g.beginPath();g.arc(90,40,22,-1.2,1.2);g.stroke()},
 society:(t)=>{const r=RNG(17);for(let i=0;i<6;i++){const x=-180+i*62,w=60,h=40+r()*50;g.fillStyle='rgba(12,14,24,0.97)';g.beginPath();g.moveTo(x,90);g.lineTo(x,90-h);g.lineTo(x+w/2,90-h-28);g.lineTo(x+w,90-h);g.lineTo(x+w,90);g.fill();g.fillStyle='rgba(241,214,150,0.95)';g.fillRect(x+w*0.38,90-h*0.6,9,11)}}};
const ROLL=[['parents','parents',191.4,'parents'],['friends','friends',192.7,'friends'],['the teacher in school','teacher',193.7,'teacher'],['the club','club',195.2,'club'],['the society around','society',196.2,'society']];
function rollSky(t,c,upto){Wbg(t,0.95,{moon:false,la:0.05});stars(t,80,19,0,0,W,800,0.6);
 const lit=ROLL.map(([,w,a])=>WT(w,a));g.save();g.strokeStyle=`rgba(${SILVER},0.45)`;g.lineWidth=1.2;g.beginPath();let first=true;W_STARS.forEach(([x,y],i)=>{if(i>upto||t<lit[i]+0.9)return;first?g.moveTo(x,y):g.lineTo(x,y);first=false});g.stroke();g.restore();
 ROLL.forEach(([lab,w,a,art],i)=>{if(i>upto)return;const tw=lit[i],[sx,sy]=W_STARS[i],u=t-tw;
  if(i===upto&&u>-0.05&&u<1.25){const up=eo5(cl(u/0.14)),sh=eio(cl((u-0.75)/0.45));g.save();g.translate(lerp(360,sx,sh),lerp(lerp(900,540,up),sy,sh));g.scale(1-0.92*sh,1-0.92*sh);g.globalAlpha*=1-sh*0.6;g.rotate(0.01*(i%2?1:-1));
   B_sheet(-270,-170,540,340,i+3,{sa:0.5,sb:30,sy:10});g.save();g.translate(0,-30);tileArt[art](t);g.restore();T(lab,0,128,44,B.ink,FAM.display,'400','center',1,{st:'italic'});g.restore()}
  if(u>0.9)Wstar(sx,sy,7,cl((u-0.9)/0.3)*(0.85+0.15*Math.sin(t*3+i)))})}
ROLL.forEach(([,w],i)=>{S['a5_'+['parents','friends','teacher','club','society'][i]]=(t,c)=>{rollSky(t,c,i);grain(t,0.05)}});
const constel=(t,k,lines)=>{Wbg(t,0.9,{moon:false,la:0.05});stars(t,160,23,0,0,W,800,0.7);const r=RNG(29);g.save();g.strokeStyle=`rgba(${SILVER},${0.6*lines})`;g.lineWidth=1.4;g.beginPath();W_STARS.forEach(([x,y],i)=>{i?g.lineTo(x,y):g.moveTo(x,y)});g.stroke();g.restore();W_STARS.forEach(([x,y],i)=>Wstar(x,y,7,1));for(let i=0;i<46;i++){const x=40+r()*640,y=120+r()*560;Wstar(x,y,2.5,cl(k*3-r()*2))}};
S.a5_constellation=(t,c)=>{const te=WT('everybody',197.4);constel(t,cl((t-te)/0.5),eo(cl((t-te)/0.6)));grain(t,0.05)};
const TROOT=Wbranches('troot',360,1004,Math.PI/2,160,4,0.9),TREE=Wbranches('tree',360,1000,-Math.PI/2,280,5,0.72);
const treeArt=(t,p,lit)=>{Wground(t,1000);Wtree(TROOT,1,'rgba(150,130,104,0.55)',10,1,SILVER);Wtree(TREE,p,'rgba(14,16,26,0.97)',20,lit,SILVER)};
S.a5_branches=(t,c)=>{constel(t,1,1-eo(cl(c.k/1.2)));treeArt(t,eo(cl(c.k/2)),0.5);grain(t,0.05)};
S.a5_path=(t,c)=>{Wbg(t,0.8,{moon:false,ly:980,lr:520,la:0.2});glow(360,1000,460,'240,210,170',0.22,0.3);g.save();g.strokeStyle=`rgba(${SILVER},0.6)`;g.lineWidth=8;g.beginPath();g.moveTo(360,1280);g.quadraticCurveTo(300,1100,360,1000);g.stroke();g.restore();treeArt(t,1,0.6);grain(t,0.05)};
S.a5_grow=(t,c)=>{Wbg(t,0.8,{moon:false,ly:980,la:0.15});const z=1-0.15*eo(cl(c.k/1.4));g.save();g.translate(360,1000);g.scale(z,z);g.translate(-360,-1000);treeArt(t,1,0.7);g.restore();grain(t,0.05)};
S.a5_tree=(t,c)=>{Wbg(t,0.8,{moon:false,ly:860,lr:560,la:0.25});glow(360,860,500,'250,220,180',0.3,0.3);g.save();g.translate(0,-140);treeArt(t,1,0.8);g.restore();grain(t,0.05)};
// sunrise (after his full-frame "Thank you"): the hook's sea returns at dawn; a clean radial sun rises from the horizon into the ensō's open gap; a gold stroke closes it
S.a5_thankyou=(t,c)=>{const k=eo(cl(c.k/1.1));Wsea(t,{off:250,m:0.5,moon:false});Wdawn(t+6);const y=lerp(820,540,k),R=120;g.save();g.globalCompositeOperation='lighter';glow(360,y,R*3,GOLDRGB,0.5,0.3);glow(360,y,R*1.4,'255,236,190',0.6,0.4);g.restore();g.save();g.beginPath();g.rect(-W,-H,3*W,H+802);g.clip();const gr=g.createRadialGradient(360,y-20,8,360,y,R);gr.addColorStop(0,'#FFF3D0');gr.addColorStop(0.6,'#FFD36E');gr.addColorStop(1,'rgba(246,176,88,0.9)');g.fillStyle=gr;g.shadowColor='rgba(255,200,120,0.9)';g.shadowBlur=30*SC;g.beginPath();g.arc(360,y,R,0,7);g.fill();g.restore();Wmist(810,120,0.6,t,'240,226,210');B_enso(360,540,170,1,91,B.ink,22,-Math.PI*0.36,Math.PI*1.72);B_enso(360,540,170,eo(cl((c.k-0.7)/0.4)),92,GOLD,20,Math.PI*1.36,Math.PI*0.28);grain(t,0.04)};
// coda (209.6-221.6): dawn. Four cards cascade the poem line by line in large type (hard cuts inside the shot), then the whole poem
// on one page with the credit on two lines, the glossary, the dawn ensō behind the title, and the one closing seal.
const CODA=[[0,1.8,[7,8]],[1.8,3.6,[9,10]]],CODA_PG=3.6;
const codaBg=(t)=>{Wbg(t,1,{moon:false,la:0.25,lr:620});glow(360,240,700,'255,226,170',0.35,0.25)};
S.a5_poem_full=(t,c)=>{const u=t-c.t0,sub=CODA.find(([a,b])=>u>=a&&u<b);
 if(sub){const [a,b,lis]=sub,lit={};let k=0;const per=(b-a-0.5)/lis.length;lis.forEach(li=>{const ws=POEM[li].split(' '),s0=c.t0+a+0.25+k*per,done=k<lis.length-1&&t>=s0+per;lit[li]=ws.map((_,j)=>done?Infinity:s0+j*(per-0.1)/ws.length);k++});
  return Wcard(t,{...c,t0:c.t0+a,k:u-a,t1:c.t0+b},{lines:lis,lit,bg:codaBg,cy:520,size:lis.length>2?31:34})}
 const lit={};lit[7]=[...POEM[7].split(' ').keys()].map((j)=>c.t0+CODA_PG+0.6+j*0.06);lit[10]=[...POEM[10].split(' ').keys()].map((j)=>c.t0+CODA_PG+1.4+j*0.06);
 Wpage(t,{...c,t0:c.t0+CODA_PG,k:u-CODA_PG},{bg:(t)=>{codaBg(t);g.save();g.globalCompositeOperation='lighter';glow(360,90,160,GOLDRGB,0.55,0.3);g.restore()},lit,hl:true,credit:c.t0+CODA_PG+0.2,key:c.t0+CODA_PG+0.5,sig:-1,title:-1,seal:c.t0+CODA_PG+3.8,})};
}
