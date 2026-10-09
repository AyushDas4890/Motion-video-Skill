// examples/voice-of-the-rain/acts/style_frames.js — the five 'Ink and Water' style frames (concept phase), moved out of
// the generic acts/style.js. Load after style.js + world.js. Not used by the final beats; kept as ink-kit demos.
'use strict';
// SF1 — speaker full: the template's chest caption, "gratitude" in gold leaf, three leaf flakes, the vermilion seal signs the line
SCENES.B_spk=(t,c)=>{const cap=capAt(t);if(!cap)return;const z=chestZone(),O=window.CAPOPT,ki=cap.findIndex(w=>norm(w[2])==='gratitude');if(ki<0)return;
 const lines=(ki>0?1:0)+1+(ki<cap.length-1?1:0),hs=(ki>0?O.small:0)+O.big*0.86+(ki<cap.length-1?O.small:0),y0=(z[0]+z[1])/2-hs/2+(ki>0?O.small:0)+O.big*0.43;
 const s=capClean(cap[ki][2]),ww=Math.min(W-70,mw(s,O.big,O.famB,O.wB)),xr=W/2+(lines>1?14:0)+ww/2;
 const k=spr(t-cap[ki][0]+0.06,15,0.55);if(k<=0.01)return;
 if(B_GOLDW.test(s)){const r=RNG(41);for(let i=0;i<4;i++){const a=r()*6.28,dist=ww*0.35+r()*ww*0.4,fx=W/2+Math.cos(a)*dist,fy=y0+Math.sin(a)*48-(t-cap[ki][0])*(14+r()*20),sz=2+r()*5,rr=t*(0.6+r()*1.5)+r()*6;
  g.save();g.translate(fx,fy);g.rotate(rr);g.scale(1,0.4+0.6*Math.abs(Math.sin(rr*1.3)));g.globalAlpha=cl(k)*(0.5+0.5*r());g.fillStyle=r()<0.5?'#F6D27E':'#C9902F';g.beginPath();g.moveTo(-sz,-sz*0.6);g.lineTo(sz*0.9,-sz*0.8);g.lineTo(sz,sz*0.7);g.lineTo(-sz*0.7,sz*0.9);g.closePath();g.fill();g.restore();glow(fx,fy,sz*3,'255,214,140',0.18*cl(k))}}
 B_seal('drop',Math.min(W-34,xr+44),y0+O.big*0.12,48,0.06,cl(k*1.4))};

// SF2 — split, top half: blue-hour lake; on "vapour" the water lifts off in wisps that braid into one rising column,
// the drop at its head atomising into mist. The colophon footnote glosses "impalpable".
SCENES.B_vapour=(t,c)=>{const D=B_ink(t)*0.92,HZ=452,CX=548;sky('#2A3450','#8F9CA6');
 g.drawImage(GL.run('B_vap',B_VAP_FS,{T:t,K:c.k,D},{},PW,960),0,0,W,640);
 const vt=WT('vapour',59.5),lift=eo((t-vt+0.15)/0.9);
 // ripples where the drop left the water
 g.save();g.lineCap='round';for(let j=0;j<4;j++){const age=t-(c.t0-0.5+j*0.22);if(age<=0)continue;const rx=16+age*62,ry=rx*0.16,al=cl(1-age/1.9);g.strokeStyle=`rgba(236,240,244,${0.55*al})`;g.lineWidth=1.3;g.beginPath();g.ellipse(CX,HZ+14,rx,ry,0,0.15,Math.PI-0.15);g.stroke();g.strokeStyle=`rgba(${B.inkRGB},${0.4*al})`;g.beginPath();g.ellipse(CX,HZ+14,rx,ry,0,Math.PI+0.2,Math.PI*2-0.2);g.stroke()}g.restore();
 // faint wisps all along the lake, and the braided column that the word lifts
 const dy=HZ-60-150*eo((t-c.t0+0.5)/1.3),at=cl((t-vt+0.05)/1.0),dx=CX+Math.sin(t*1.7)*3,ds=26;
 const r=RNG(21);for(let i=0;i<7;i++){const x=40+i*92+r()*40;if(Math.abs(x-CX)<80)continue;B_strand(x,HZ+6,(70+r()*80)*(0.5+0.5*lift),t,i*2.3,3.2,0.22+0.14*r(),(r()-0.5)*0.6)}
 // the column braids up from the water to the drop and past it
 for(let i=0;i<6;i++){B_strand(CX-62+i*25+r()*8,HZ+10,(HZ+10-dy)*(0.55+0.45*lift)+40+r()*50*lift,t,i*1.9+7,5.5+r()*3,0.18+0.1*r(),(i-2.5)*0.12,dx,0.4)}
 // the drop rides the head of the column and, on "vapour", unravels into the same wisps (no sparks: it is mist)
 glow(dx,dy-10,120,'200,215,232',0.3*(1-at*0.4),0.3);
 for(let i=0;i<4;i++)B_strand(dx+(i-1.5)*6,dy-6,(60+i*26)*at+8,t,i*2.7+31,3.6,0.7*at,(i-1.5)*0.35);
 B_drop(dx,dy,ds*(1-0.3*at),1-at*0.55,true,at*0.45);
 // reeds in the foreground (parallax: they slide faster than the range)
 const px=c.k*-6,rd=RNG(5);for(let i=0;i<12;i++){const bx=650+rd()*90+px,ang=-Math.PI/2-0.3+rd()*0.46;B_blade(bx,668,ang,110+rd()*170,5+rd()*6,(rd()-0.4)*0.9,B.ink,0.82+rd()*0.18,i)}
 for(let i=0;i<9;i++){const bx=-10+rd()*80-px,ang=-Math.PI/2+0.1-rd()*0.45;B_blade(bx,668,ang,90+rd()*150,4+rd()*5,(rd()-0.6)*0.8,B.ink,0.8,i+40)}
 for(let i=0;i<30;i++){const sx=630+rd()*90,sy=420+rd()*200;g.fillStyle=`rgba(${B.inkRGB},${0.5+rd()*0.5})`;g.beginPath();g.arc(sx,sy,0.6+Math.pow(rd(),2)*2.4,0,7);g.fill()}
 B_gloss('impalpable',22,190,t,vt-0.08);
 grain(t,0.05)};

// SF3 — cutaway: "clouds"
SCENES.B_clouds=(t,c)=>{const D=B_ink(t)*0.95;sky('#222B44','#8E99A3');const k=c.k,ct=WT('clouds',67);
 // the cloud billows on its word: a slow rise and swell from the onset
 const sw=eo((t-ct+0.25)/1.2);
 g.drawImage(GL.run('B_cld',B_CLD_FS,{T:t,K:k,D,PAR:[k*5,8-sw*14]},{},PW,PH),0,0,W,H);
 const r=RNG(9);
 // vapour still climbing into the cloud base: faint light trails
 g.save();g.lineCap='round';for(let i=0;i<12;i++){const x0=220+r()*300,ph=r()*6.28,len=110+r()*120,y1=900-r()*70;g.beginPath();for(let s=0;s<=20;s++){const u=s/20,y=y1-u*len,x=x0+Math.sin(u*3+ph+t*0.9)*10*u;s?g.lineTo(x,y):g.moveTo(x,y)}
  const gr=g.createLinearGradient(0,y1,0,y1-len);gr.addColorStop(0,'rgba(240,244,248,0)');gr.addColorStop(0.5,'rgba(240,244,248,0.3)');gr.addColorStop(1,'rgba(240,244,248,0)');g.strokeStyle=gr;g.lineWidth=1.2;g.setLineDash([14,9]);g.lineDashOffset=t*40+i*7;g.stroke()}g.restore();
 // the first drop gathers on the cloud's belly
 const da=cl((t-ct-0.1)/0.4);B_drop(372,758+eo((t-ct-0.1)/0.9)*10,9,da,true);
 B_seal('drop',664,1010,36,-0.04,0.95);
 grain(t,0.05)};

// SF4 — floating poem card on the ink night, line 3; a wash of diluted indigo sweeps each word as he says it, a small ensō rings "Earth"
SCENES.B_card=(t,c)=>{const D=B_ink(t);sky('#0A0D18','#151B2E');
 g.drawImage(GL.run('B_night',B_NIGHT_FS,{T:t,K:c.k,D},{},PW,PH),0,0,W,H);
 B_rain(t,40,31,520,70,0.45,1.6);
 // silver motes in the light shaft
 const r=RNG(13);for(let i=0;i<40;i++){const u=r(),x=40+u*560+Math.sin(t*0.4+i)*10,y=(r()*1300-t*(6+r()*10))%1300;const yy=y<0?y+1300:y;const near=Math.exp(-Math.pow(((x-40)*0.835-(yy+140)*0.55)/130,2));glow(x,yy,2+r()*3,'215,226,240',0.2+0.6*near*r(),0.5)}
 // the card
 const cx=W/2,cy=598,cw=630,ch=420,ws=POEM[2].split(' '),cues=lineCues(2,42.7,44.4,{strict:true}),rows=[ws.slice(0,6),ws.slice(6)],ry=[-44,58],fs=50;
 g.save();g.translate(cx,cy);g.rotate(-0.032+0.02*eio(c.k/2));const z=1+0.03*c.k;g.scale(z,z);
 B_sheet(-cw/2,-ch/2,cw,ch,5,{sa:0.7,sb:60,sy:26});
 T('WALT WHITMAN  ·  THE VOICE OF THE RAIN',0,-ch/2+50,19,'#3E404C',FAM.text,'600','center',1,{ls:3});
 g.fillStyle=B.sealDeep;g.fillRect(-26,-ch/2+76,52,1.6);
 const lit=[];let wi=0;const pos=[];
 rows.forEach((row,ri)=>{const sp=mw(' ',fs,FAM.display),wd=row.map(s=>mw(s,fs,FAM.display)),tw=wd.reduce((a,b)=>a+b,0)+sp*(row.length-1)+(row.includes('Earth,')?16:0);let x=-tw/2;
  let sweep=null;row.forEach((s,j)=>{const i=wi+j;if(s==='Earth,')x+=16;const c0=cues[i],c1=Number.isFinite(cues[i+1])?cues[i+1]:c0+0.3;pos[i]={x,w:wd[j],y:ry[ri]};if(Number.isFinite(c0)&&t>=c0){lit.push(i);sweep=x+wd[j]*cl((t-c0)/Math.max(0.08,c1-c0))+(t>=c1?sp*0.5:0)}x+=wd[j]+sp});
  if(sweep!=null){g.save();g.globalCompositeOperation='multiply';B_washBand(-tw/2-12,ry[ri]+3,sweep+tw/2+16,fs*0.92,B.wash,ri*7+3,cl((sweep+tw/2)/40)*1.25);g.restore()}wi+=row.length});
 // the ensō rings "Earth" as it is spoken (brush lands just before the word, closes as it ends)
 const ei=ws.indexOf('Earth,'),pe=pos[ei],ew=mw('Earth',fs,FAM.display);B_enso(pe.x+ew/2+2,pe.y+2,66,eo((t-cues[ei]+0.2)/0.42),21,B.ink,12,-Math.PI*0.62,Math.PI*1.86,0.8);
 TGRP='B_card';pos.forEach((p,i)=>T(ws[i],p.x,p.y,fs,B.ink,FAM.display,'400','left'));TGRP=null;logPoem(2,POEM[2],lit);
 B_seal('drop',cw/2-56,ch/2-54,50,0.05);
 g.restore();
 // near plane: one big drop out of focus at the lens
 g.save();g.filter=`blur(${3.5*SC}px)`;B_drop(624,1100-c.k*10,34,0.6,true);g.restore();
 vignette(0.45,'4,6,14');grain(t,0.05)};

// SF5 — chapter card: "the cycle", step ii, on paper soaked to the blue-hour sky
SCENES.B_chapter=(t,c)=>{const D=B_ink(t);sky('#1E2A44','#2F3E58');const k=c.k,z=1+0.15*eo5((k-0.27)/0.37);
 g.save();g.translate(W/2,H*0.49);g.scale(z,z);g.translate(-W/2,-H*0.49);
 g.drawImage(GL.run('B_num',B_NUM_FS,{T:t,K:k,D},{G:[1,B_glyph('2')]},PW,PH),0,0,W,H);
 TGRP='B_chap';rise('the',W/2-150,540,54,B.ivory,c.t0+0.02,t,FAM.display,'400',0.03,'center',{st:'italic',stroke:[B.ink,4]});
 dropIn('cycle',W/2+6,640,156,B.ivory,c.t0+0.06,t,FAM.displayS,'700',0.055);TGRP=null;
 B_sealOn(()=>B_seal('ii',W/2+222,742,52,0.05,cl((k-0.32)/0.08)));
 g.restore();vignette(0.35,'6,9,20');grain(t,0.04)};

