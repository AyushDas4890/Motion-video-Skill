// acts/act3.js — Act III (54.88-104.07): the cycle. Sea, vapour, cloud, rain, ensō, the roller coaster of life.
'use strict';
{const S=SCENES;
S.a3_chap2=(t,c)=>Wchap(t,c,'2','the cycle','ii');
S.a3_generate=(t,c)=>{Wsea(t,{off:120});const hz=572,u=eo(cl(c.k/1.0));Wripple(360,hz+6,t,c.t0,3,1.3);B_drop(360,lerp(hz,hz-220,u),44,1);grain(t,0.05)};
S.a3_lift=(t,c)=>{Wsea(t,{off:520,moon:false});const hz=972,u=eio(cl(c.k/1.0));Wripple(360,hz+4,t,c.t0+0.1,3,1.8);g.save();g.strokeStyle='rgba(236,240,244,0.6)';g.lineWidth=5;g.beginPath();g.moveTo(360,hz);g.lineTo(360,lerp(hz,hz-300,u)+60);g.stroke();g.restore();B_drop(360,lerp(hz-10,hz-300,u),80,1);grain(t,0.05)};
S.a3_upward=(t,c)=>{const tu=WT('upward',57.7),k=eo(cl((t-tu+0.4)/1.4));Wsea(t,{off:320+k*500,vap:cl((t-tu+0.4)/0.8),moon:false});Watomize(360,lerp(760,420,eo(cl(c.k/1.6))),t,tu+0.3,40,160);grain(t,0.05)};
// L4: the card in the top third; below it the drop breaks into hundreds of silver points that rise and thin to nothing on "vapour"
S.a3_card_l4=(t,c)=>Wcard(t,c,{lines:[3],cy:300,bg:(t)=>{Wsea(t,{off:720,vap:0.6,moon:false})},under:(t)=>Watomize(360,820,t,WT('vapour',59.5),46),gloss:[['impalpable',WT('vapour',59.5)-0.08]],glossW:['impalpable']});
// L5: vaguely form'd — loose ink-wash clouds that keep re-forming behind the card
S.a3_card_l5=(t,c)=>Wcard(t,c,{lines:[4],cy:520,under:(t)=>{g.save();g.filter=`blur(${10*SC}px)`;for(let i=0;i<5;i++){const x=120+i*130+Math.sin(t*0.7+i)*30,y=880+Math.cos(t*0.5+i*2)*30;g.fillStyle=`rgba(205,214,228,${0.12+0.05*Math.sin(t+i)})`;bloomPath(g,x,y,80+30*Math.sin(t*0.9+i*1.7),i*7+Math.floor(t*2));g.fill()}g.filter='none';g.restore()}});
S.a3_clouds=(t,c)=>S.B_clouds(t,c);
S.a3_melt=(t,c)=>{const tm=WT('melts',69),m=eo(cl((t-tm+0.2)/0.8));g.drawImage(GL.run('B_cld',B_CLD_FS,{T:t,K:c.k,D:B_ink(t)*(0.95+0.5*m),PAR:[c.k*5,-6]},{},PW,PH),0,0,W,H);B_rain(t,Math.round(20+110*m),41,900,90,0.6,0);vignette(0.4,'4,6,14');grain(t,0.05)};
// L6: the rain laves the droughts — cracked earth darkens as it is bathed; atomies (dust motes) lift and settle
const CRACK=Wbranches('crack6',360,0,0,300,4,1.2,2),CRACK2=Wbranches('crack6b',360,0,Math.PI,300,4,1.2,2);
S.a3_card_l6=(t,c)=>Wcard(t,c,{lines:[5],cy:350,under:(t,c)=>{const tl=70.38,ta=70.9,wet=eo(cl((t-tl)/0.9));B_rain(t,Math.round(30+60*wet),43,800,80,0.45,0);
 g.save();const eg=g.createLinearGradient(0,830,0,960);eg.addColorStop(0,'rgba(0,0,0,0)');eg.addColorStop(1,`rgb(${Math.round(lerp(150,62,wet))},${Math.round(lerp(106,46,wet))},${Math.round(lerp(58,30,wet))})`);g.fillStyle=eg;g.fillRect(-W,830,3*W,130);g.fillStyle=`rgb(${Math.round(lerp(150,62,wet))},${Math.round(lerp(106,46,wet))},${Math.round(lerp(58,30,wet))})`;g.fillRect(-W,960,3*W,H);{const rr=RNG(5);for(let i=0;i<40;i++){g.fillStyle=`rgba(40,26,12,${0.15+rr()*0.2})`;g.fillRect(rr()*W,880+rr()*300,40+rr()*120,1.5+rr()*2)}}g.translate(0,930);Wtree(CRACK,1,`rgba(20,16,12,${0.9-0.4*wet})`,5);Wtree(CRACK2,1,`rgba(20,16,12,${0.9-0.4*wet})`,5);g.restore();
 const r=RNG(71),u=t-ta;if(u>0){g.save();g.globalCompositeOperation='lighter';for(let i=0;i<70;i++){const x=r()*W,h=40+r()*160,k=Math.sin(Math.PI*cl(u/(1.2+r())));glow(x+Math.sin(t+i)*8,860-h*k,1.5+r()*1.5,'230,214,180',0.6*k,0.5)}g.restore()}},gloss:[['lave',70.38],['atomies',70.9]],glossW:['lave','atomies']});
// L10-11: the parentheses swing round and join into the ensō on "circular"
S.a3_enso=(t,c)=>{const tc=WT('circular',73.5);Wcard(t,c,{lines:[9,10],cy:540});B_enso(360,540,320,eo(cl((t-tc+0.2)/0.6)),77,`rgba(${SILVER},0.9)`,16,-Math.PI*0.5,Math.PI*1.9,1.22)};
S.a3_updown=(t,c)=>{Wbg(t,0.9,{moon:false});const ph=-c.k*1.2;WtrackDraw(t,ph,170,540,0.0105,1);const x=360,y=Wtrack(x,ph,170,540,0.0105);B_drop(x,y-36,26,1);T('up · vapour',170,400,34,B.ivory,FAM.text,'400','center',0.95,{st:'italic',kind:'deco'});T('down · rain',560,740,34,B.ivory,FAM.text,'400','center',0.95,{st:'italic',kind:'deco'});grain(t,0.05)};
S.a3_card_l1011=(t,c)=>Wcard(t,c,{lines:[9,10],cy:540});
S.a3_eternal=(t,c)=>{Wbg(t,0.95,{moon:false});B_enso(360,540,220,eo(cl(c.k/0.8)),77,`rgba(${SILVER},0.9)`,18);const te=WT('eternal',78.5);rise('Eternal',W/2,550,84,B.ivory,te,t,FAM.display,'400',0.04,'center',{st:'italic',shadow:[16,0.6]});grain(t,0.05)};
S.a3_eternal_word=(t,c)=>{Wbg(t,0.95,{moon:false});B_enso(360,540,220,1,77,`rgba(${SILVER},0.9)`,18);const te=WT('eternal',79.9),s='ETERNAL · ETERNAL · ',p=eio(cl((t-te+0.1)/0.9));g.save();g.translate(360,540);g.rotate(-Math.PI/2+c.k*0.3);g.font=F(30,FAM.text,'600','normal');g.fillStyle=B.ivory;g.textAlign='center';const n=Math.floor(s.length*p);for(let i=0;i<n;i++){const a=i/s.length*Math.PI*2;g.save();g.rotate(a);if(!QA.hideText)g.fillText(s[i],0,-266);g.restore()}g.restore();
 dropIn('Eternal',W/2,550,96,B.ivory,te,t,FAM.bodoni,'700',0.03);grain(t,0.05)};
// ---------- IIIb ----------
// the cycle: a brushed ring filling 70% of the width; four drawn stations; the drop travels it
S.a3_cycle_diagram=(t,c)=>{Wbg(t,0.85,{moon:false});const R=250,cx=360,cy=470,k=eo(cl(c.k/0.5));B_enso(cx,cy,R,k,51,`rgba(${SILVER},0.85)`,9,Math.PI*0.5,Math.PI*1.95);
 const st=[[Math.PI/2,'sea'],[Math.PI,'vapour'],[-Math.PI/2,'cloud'],[0,'rain']];st.forEach(([a,s],i)=>{const x=cx+Math.cos(a)*R,y=cy+Math.sin(a)*R,o=cl(c.k*4-i*0.5);g.save();g.globalAlpha*=o;g.strokeStyle=B.ivory;g.lineWidth=2.4;g.fillStyle='rgba(205,214,228,0.85)';
  if(i===0){g.beginPath();for(let q=-30;q<=30;q+=3)g.lineTo(x+q,y+Math.sin(q*0.3)*5);g.stroke()}else if(i===1){for(let q=-1;q<=1;q++){g.beginPath();g.moveTo(x+q*12,y+16);g.bezierCurveTo(x+q*12-10,y,x+q*12+10,y-10,x+q*12,y-24);g.stroke()}}else if(i===2){bloomPath(g,x,y,30,5);g.fill()}else{for(let q=-2;q<=2;q++){g.beginPath();g.moveTo(x+q*10,y-18);g.lineTo(x+q*10-5,y+18);g.stroke()}}
  const lx=i===1?x+78:i===3?x-70:x,ly=i===0?y-50:i===2?y+66:y;T(s,lx,ly,34,B.ivory,FAM.text,'400','center',1,{st:'italic',stroke:[B.ink,5]});g.restore()});
 const a=Math.PI/2+c.k*2.4;B_drop(cx+Math.cos(a)*R,cy+Math.sin(a)*R,18,1);grain(t,0.05)};
S.a3_again=(t,c)=>{Wsea(t,{off:400,vap:0.5,moon:false});const u=eio(cl(c.k/1.1));B_drop(360,lerp(852,420,u),40,1);Wripple(360,856,t,c.t0,3,1.4);grain(t,0.05)};
S.a3_heaven=(t,c)=>{const th=WT('heaven',83.5),s=eo(cl((t-th+0.2)/0.6));Wbg(t,1.15,{moon:false,la:0.05});stars(t,220,7,0,0,W,780,s);for(let i=0;i<6;i++){const r=RNG(i+3);Wstar(r()*W,r()*600+60,3,s)}
 Wmist(980-c.k*60,260,0.9,t);Wmist(860-c.k*40,160,0.55,t+3);B_drop(360,lerp(820,480,eo(cl(c.k/1.3))),26,1);grain(t,0.05)};
S.a3_card_l5x=(t,c)=>Wcard(t,{...c,k:c.k+1},{lines:[4],cy:540,a:84.4,b:86.7});
const fallTo=(t,y0,y1,big)=>{const tr=WT('rain',88.2),f=cl((t-(tr-1.6))/1.6);if(t<tr)Wfall(360,lerp(y0,y1,f*f),big,1);else{Wsplash(360,y1,t,tr,1.4);Wripple(360,y1+6,t,tr,4,1.6)}};
S.a3_comeback=(t,c)=>{Wsea(t,{off:420,moon:false});stars(t,120,9,0,0,W,500,0.8);fallTo(t,160,872,22);grain(t,0.05)};
S.a3_comeback2=(t,c)=>{const tr=WT('rain',88.2),f=cl((t-c.t0)/(tr-c.t0+0.01));Wsea(t,{off:320-f*300,moon:false});if(t<tr)Wfall(360,560,60,1);else{Wsplash(360,W_HZ-296,t,tr,2.2);Wripple(360,W_HZ-296,t,tr,4,2.2)}grain(t,0.05)};
S.a3_motion=(t,c)=>{Wbg(t,0.85,{moon:false});const A=lerp(170,0,cl((t-(c.t1-0.6))/0.6));WtrackDraw(t,-c.k*1.5,A,540,0.0105);B_drop(360,Wtrack(360,-c.k*1.5,A,540,0.0105)-30,20,1);grain(t,0.05)};
// the coaster: every shot a new camera — POV ride, side view with rider, slow climb, crest close-up (arms up), plunge, the valley
const TA=260,TY=700,TF=0.008,crestX=Math.PI/2/TF,ty=x=>Wtrack(x,0,TA,TY,TF),tang=x=>Math.atan(-TA*TF*Math.cos(x*TF));
const side=(t,c,x,cam,arms=0,zoom=1)=>{Wbg(t,0.8,{moon:false});g.save();g.translate(360,560);g.scale(zoom,zoom);g.rotate(cam[2]||0);g.translate(-cam[0],-cam[1]);WtrackDraw(t,0,TA,TY,TF,1,cam[0]-700,cam[0]+700,true);Wcar(x,ty(x)-10,tang(x),arms,1.3);g.restore();grain(t,0.05)};
S.a3_coaster=(t,c)=>{const tr=WT('roller',93.2),x=crestX-80+eo(cl((t-tr+0.4)/1.0))*80;side(t,c,x,[crestX,ty(crestX)+120],x>crestX-10?1:0,0.75)};
S.a3_human=(t,c)=>{const x=crestX-420+c.k*160;side(t,c,x,[x,ty(x)-40])};
S.a3_climb=(t,c)=>{const x=lerp(crestX-220,crestX-60,c.k/0.94);side(t,c,x,[x,ty(x)-30,0.12],0,1.4)};
S.a3_top=(t,c)=>{const x=crestX+c.k*10;side(t,c,x,[x,ty(x)-20],1,2.0)};
S.a3_down=(t,c)=>{const x=lerp(crestX+30,crestX+330,eio(cl(c.k/0.92)));side(t,c,x,[x,ty(x)-40,-0.18],0,1.2)};
S.a3_valley=(t,c)=>{Wbg(t,1.05,{moon:false,ly:900,la:0.06});Wground(t,900);B_rain(t,80,47,900,80,0.5,0);g.save();g.strokeStyle=`rgba(${SILVER},0.6)`;g.lineWidth=4;g.beginPath();for(let x=-20;x<=W+20;x+=10)g.lineTo(x,930+Math.sin(x*0.02+t*2)*6);g.stroke();g.restore();
 g.save();g.translate(0,-200);WtrackDraw(t,Math.PI*0.5,260,700,0.008,0.9,-60,780,true);g.restore();grain(t,0.05)};
S.a3_nature=(t,c)=>{Wsea(t,{off:200,mt:1,moon:false,m:0.85});B_rain(t,80,49,900,80,0.45,1.2);glow(360,650,320,'214,170,190',0.14,0.3);grain(t,0.05)};
}
