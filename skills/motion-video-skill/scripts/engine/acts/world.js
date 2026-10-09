// acts/world.js — direction B world kit (lead): backgrounds keyed to the ink clock, sea, ground, roots/trees, drops, ripples,
// poem card, poem page, step card, kinetic words, hands, figures, portraits, particle head, crown, coaster. Scenes live in act1/3/4/5.js.
'use strict';
// highlighter (critics r1): a brushed ink-blue wash before gratitude, a gold wash after; ink stays >= 7:1
Object.defineProperty(THEME,'hl',{get(){return CUR_T>=WORLD.hlGoldFrom?'rgba(240,190,95,0.62)':'rgba(120,150,205,0.42)'},configurable:true});  // a live getter (Object.assign froze it to blue)
Object.assign(THEME,{cardBg:(t)=>Wbg(t,1,{moon:false}),lit:B.ink,
 pageInk:B.ink,pageTitle:B.ink,pageSig:'#3E404C',chapNum:'207,214,226',chapInk:B.ivory,footCap:'#F1E9DA',footText:'#FFFFFF',footStroke:'rgba(10,12,22,0.92)'});
window.CAPOPT={...window.CAPOPT,famB:FAM.bodoni,wB:'700',small:64,big:104};
const GOLD='#FFD36E',BRASS='#8A8466',SILVER='207,222,240',GOLDRGB='255,211,120';

// ---------- backgrounds ----------
// ink night on paper (density from the clock, only ever lifts) + a pool of light behind the subject + vignette: values have a source
function Wbg(t,m=1,opt={}){const D=B_ink(t)*m;sky('#0A0D18','#151B2E');g.drawImage(GL.run('B_night',B_NIGHT_FS,{T:t,K:0,D},{},PW,PH),0,0,W,H);
 if(opt.moon!==false)Wmoon(t,opt.mx,opt.my);glow(opt.lx??360,opt.ly??520,opt.lr??430,'196,210,232',(opt.la??0.11)*cl(D/0.6+0.3),0.25);Wdawn(t);vignette(opt.vig??0.5,'4,6,14')}
// dawn (critic r2): from 203 s the paper warms to cream, the ink turns sepia, a peach horizon and a low gold glow rise in the bottom third
function Wdawn(t){const w=eio(cl((t-WORLD.dawnInk[0])/WORLD.dawnInk[1]));if(w<=0)return;g.save();g.globalCompositeOperation='soft-light';g.fillStyle=`rgba(214,160,96,${0.75*w})`;g.fillRect(-W,-H,3*W,3*H);g.globalCompositeOperation='screen';const gr=g.createLinearGradient(0,H*0.55,0,H);gr.addColorStop(0,'rgba(255,190,140,0)');gr.addColorStop(1,`rgba(255,196,140,${0.38*w})`);g.fillStyle=gr;g.fillRect(-W,H*0.55,3*W,H);g.restore();glow(360,H*0.92,520,'255,206,140',0.3*w,0.3)}
function Wmoon(t,x=560,y0=170){if(t>WORLD.moonSet)return;const a=cl((WORLD.moonSet-t)/22),y=y0+t*1.5;glow(x,y,170,'235,230,218',0.16*a,0.3);g.save();g.globalAlpha=a*0.94;g.fillStyle='#EEE7D8';g.beginPath();g.arc(x,y,30,0,7);g.fill();
 g.globalAlpha=a*0.18;g.fillStyle='#8A93A6';g.beginPath();g.arc(x-8,y-6,9,0,7);g.arc(x+9,y+8,6,0,7);g.fill();g.restore()}
const W_SEA_FS=B_VAP_FS.replace('uniform float T,K,D;','uniform float T,K,D,OFF,VAP,MT;').replace('vec2 P=vec2(uv.x*720.,(1.-uv.y)*640.);','vec2 P=vec2(uv.x*720.,(1.-uv.y)*1280.-OFF);')
 .replace('d+=mtn(P,rf,sf,0.32*D/0.7,170.,1.);','d+=MT*mtn(P,rf,sf,0.32*D/0.7,170.,1.);').replace('d+=mtn(P,rm,sm,0.9*D/0.7,220.,2.);','d+=MT*mtn(P,rm,sm,0.9*D/0.7,220.,2.);')
 .replace('d=d*0.25+lake+refl;','d=d*0.25+lake+refl*MT;').replace('d*=1.-0.9*vap;','d*=1.-0.9*vap*VAP;').replace('col=mix(col,vec3(0.955,0.962,0.968),vap*0.55);','col=mix(col,vec3(0.955,0.962,0.968),vap*0.55*VAP);');
function Wsea(t,o={}){sky('#0A0D18','#2A3450');g.drawImage(GL.run('W_sea',W_SEA_FS,{T:t,K:0,D:B_ink(t)*(o.m||0.95),OFF:o.off??320,VAP:o.vap??0,MT:o.mt??0},{},PW,PH),0,0,W,H);if(o.moon!==false)Wmoon(t,o.mx,o.my);vignette(0.4,'4,6,14')}
const W_HZ=772;
function Wground(t,y,a=1){g.save();g.globalAlpha*=a;const gr=g.createLinearGradient(0,y,0,H+200);gr.addColorStop(0,'rgba(14,16,26,0.96)');gr.addColorStop(1,'rgba(5,6,11,1)');g.fillStyle=gr;g.beginPath();g.moveTo(-W,y+40);for(let x=-W;x<=2*W;x+=10)g.lineTo(x,y+(vnoise(x*0.012,7)-0.5)*16+(vnoise(x*0.05,3)-0.5)*5);g.lineTo(2*W,2*H);g.lineTo(-W,2*H);g.closePath();g.fill();
 g.strokeStyle='rgba(241,233,218,0.12)';g.lineWidth=1;g.beginPath();for(let x=-20;x<=W+20;x+=10)g.lineTo(x,y+(vnoise(x*0.012,7)-0.5)*16+(vnoise(x*0.05,3)-0.5)*5);g.stroke();g.restore()}
// a soft mist band (no hard steps)
function Wmist(y,h,a,t=0,col='205,214,228'){g.save();g.filter=`blur(${Math.round(h*0.25*SC)}px)`;for(let i=0;i<5;i++){const yy=y+(i-2)*h*0.18+Math.sin(t*0.3+i)*6;g.fillStyle=`rgba(${col},${a*0.32})`;g.beginPath();g.ellipse(360+Math.sin(i*2.1+t*0.2)*80,yy,560,h*0.35,0,0,7);g.fill()}g.filter='none';g.restore()}

// ---------- branching (roots go down, trees go up): smooth, tapered, three+ orders; cached by key ----------
const W_BR={};
function Wbranches(key,x,y,dir,len,depth,spread=0.9,kids=2){if(W_BR[key])return W_BR[key];let hsh=0;for(const ch of key)hsh=(hsh*31+ch.charCodeAt(0))>>>0;const r=RNG(hsh%100000+7),segs=[];
 (function br(x,y,a,l,d){const pts=[[x,y]];let px=x,py=y,da=(r()-0.5)*0.05;for(let i=0;i<10;i++){da+=(r()-0.5)*0.05;a+=da;px+=Math.cos(a)*l/10;py+=Math.sin(a)*l/10;pts.push([px,py])}segs.push({pts,d});
  if(d<depth){const n=kids+(r()<0.4?1:0);for(let j=0;j<n;j++)br(pts[6+Math.floor(r()*4)][0],pts[6+Math.floor(r()*4)][1],a+(j-(n-1)/2)*spread*(0.6+0.6*r()),l*(0.6+0.2*r()),d+1)}})(x,y,dir,len,0);
 return W_BR[key]=segs}
function Wtree(segs,p,col,w0,lit=0,rgb=SILVER){const md=Math.max(...segs.map(s=>s.d))+1;g.save();g.lineCap='round';g.lineJoin='round';
 for(let pass=0;pass<(lit>0?2:1);pass++){if(pass){g.globalCompositeOperation='lighter';g.shadowColor=`rgba(${rgb},0.9)`;g.shadowBlur=10*SC}
  for(const s of segs){const k=cl(p*md-s.d);if(k<=0)continue;if(pass&&lit*md-s.d<=0)continue;const n=s.pts.length-1,m=k*n,lw=Math.max(0.6,w0*Math.pow(0.6,s.d));
   for(let i=1;i<=Math.ceil(m);i++){const f=Math.min(1,m-i+1),a=s.pts[i-1],b=s.pts[i],u=(i-1)/n;g.strokeStyle=pass?`rgba(${rgb},${cl(lit*md-s.d)*0.85})`:col;g.lineWidth=(pass?0.5:1)*lw*(1-0.45*u);
    g.beginPath();g.moveTo(a[0],a[1]);g.lineTo(lerp(a[0],b[0],f),lerp(a[1],b[1],f));g.stroke()}}}
 g.restore()}

// ---------- water ----------
function Wripple(x,y,t,t0,n=3,sc=1,col='236,240,244',flat=0.22){for(let j=0;j<n;j++){const age=t-t0-j*0.24;if(age<=0)continue;const R=(10+age*95)*sc,al=cl(1-age/2.2);g.save();g.strokeStyle=`rgba(${col},${0.65*al})`;g.lineWidth=1.5+sc*0.4;g.beginPath();g.ellipse(x,y,R,R*flat,0,0,7);g.stroke();g.restore()}}
function Wfall(x,y,s,a=1,dark=true){g.save();const gr=g.createLinearGradient(x,y-s*7,x,y-s);gr.addColorStop(0,'rgba(220,230,240,0)');gr.addColorStop(1,`rgba(220,230,240,${0.35*a})`);g.strokeStyle=gr;g.lineWidth=s*0.35;g.beginPath();g.moveTo(x,y-s*7);g.lineTo(x,y-s*1.2);g.stroke();g.restore();B_drop(x,y,s,a,dark)}
// crown splash: a ring of droplets thrown up and falling back
function Wsplash(x,y,t,t0,s=1){const u=t-t0;if(u<0||u>0.9)return;const r=RNG(77);g.save();for(let i=0;i<14;i++){const a=-Math.PI*(0.08+0.84*i/13),v=(160+r()*120)*s,px=x+Math.cos(a)*v*u*0.9,py=y+Math.sin(a)*v*u+520*u*u;B_drop(px,py,(2.2+r()*2.4)*s,cl(1-u/0.9),true)}
 g.strokeStyle=`rgba(236,240,244,${0.8*cl(1-u/0.5)})`;g.lineWidth=2*s;g.beginPath();g.ellipse(x,y,(30+u*120)*s,(8+u*20)*s,0,Math.PI,0);g.stroke();g.restore()}
function Wglint(x,y,L,a,rgb=GOLDRGB){if(a<=0.01)return;g.save();g.globalCompositeOperation='lighter';glow(x,y,L*0.6,rgb,0.6*a,0.3);g.lineCap='round';
 for(const [dx,dy,l,w] of [[1,0,L,2],[0,1,L*0.8,2],[0.7,0.7,L*0.3,1.1],[0.7,-0.7,L*0.3,1.1]]){const gr=g.createLinearGradient(x-dx*l,y-dy*l,x+dx*l,y+dy*l);gr.addColorStop(0,`rgba(${rgb},0)`);gr.addColorStop(0.5,`rgba(255,246,225,${0.95*a})`);gr.addColorStop(1,`rgba(${rgb},0)`);g.strokeStyle=gr;g.lineWidth=w;g.beginPath();g.moveTo(x-dx*l,y-dy*l);g.lineTo(x+dx*l,y+dy*l);g.stroke()}
 glow(x,y,4,'255,250,235',a,0.5);g.restore()}
// a drop dissolving into rising silver points (impalpable)
function Watomize(x,y,t,t0,s=40,n=260){const u=t-t0;if(u<0){B_drop(x,y,s,1);return}const r=RNG(313);B_drop(x,y-u*20,s*(1-cl(u/0.8)),1-cl(u/0.8));g.save();g.globalCompositeOperation='lighter';
 for(let i=0;i<n;i++){const a=r()*6.28,rr=Math.sqrt(r())*s*0.8,v=40+r()*110,life=1.2+r()*1.4;const age=u-r()*0.5;if(age<0)continue;const k=age/life;if(k>1)continue;
  glow(x+Math.cos(a)*rr+Math.sin(age*2+i)*12*k,y+Math.sin(a)*rr*1.2-v*age-20*age*age,1.2+r()*1.6,SILVER,0.7*(1-k),0.5)}g.restore()}

// ---------- the poem card ----------
function Wcard(t,c,o){(o.bg||(t=>Wbg(t,0.95,{moon:false})))(t,c);if(o.under)o.under(t,c);
 const lis=o.lines,long=lis.length>1||POEM[lis[0]].length>50,size=o.size||(long?36:44),fam=FAM.display,st='normal',cw=W-56,maxW=cw-104;
 const rows=poemRows(lis,size,maxW,fam,st,26),lh=size*1.34,hT=rows.length*lh+(lis.length-1)*size*0.3,ch=hT+168;
 const cx=W/2,cy=o.cy||H*0.43,k=c.k,ent=1-eo5(k/0.34),z=(1+0.45*ent)*(1+0.012*k);
 const lit={};for(const li of lis)lit[li]=o.lit&&o.lit[li]?o.lit[li]:lineCues(li,o.a??c.t0-0.4,o.b??c.t1+0.6,{strict:true});
 g.save();g.translate(cx,cy);g.scale(z,z);g.rotate((o.rot??-0.016)+0.01*Math.sin(k*0.7));
 B_sheet(-cw/2,-ch/2,cw,ch,lis[0]*7+3,{sa:0.65,sb:56,sy:24});
 T('THE VOICE OF THE RAIN',0,-ch/2+42,19,'#3E404C',FAM.text,'600','center',1,{ls:3});g.fillStyle=B.sealDeep;g.fillRect(-26,-ch/2+60,52,1.6);
 const res=drawPoemLines(t,lis,{x:-cw/2+60,y:-ch/2+100+size*0.45,size,lh,maxW,fam,st,lit,col:B.ink,litCol:B.ink,dim:0.8,glow:false,gloss:o.glossW,gap:size*0.3,indent:26,brush:true,hlCol:o.hl});
 for(const li of lis){const b=res.bounds[li+':0'];if(b)T(String(li+1),-cw/2+30,(b[1]+b[3])/2,19,B.sealDeep,FAM.text,'600','center',1,{kind:'deco'})}
 if(o.enso){const [li,wi,t0]=o.enso,b=res.bounds[li+':'+wi];if(b){const ww=b[2]-b[0],R=ww*0.62;B_enso((b[0]+b[2])/2,b[3]-size*0.18,R,eo((t-t0+0.1)/0.4),21,B.sealDeep,8,Math.PI*0.06,Math.PI*0.88,0.28)}}  // enso = brushed swash under the word (a ring crossed its neighbours)
 if(TXT.cardFoot)T(TXT.cardFoot,0,ch/2-34,19,'#3A3C48',FAM.text,'400','center',1,{st:'italic'});
 if(o.over)o.over(t,c,res,cw,ch);
 g.restore();
 // gloss tag: centred under the card when the word is spoken, sentence case, large, held >= 2 s
 let gy=cy+ch*z/2+40;(o.gloss||[]).forEach(([w,t0])=>{const G=GLOSS[w];if(!G||t<t0)return;const kk=eo5(cl((t-t0)/0.35)),s1=34,s2=30,line=w+FN_MARK[G.n],d='= '+G.def;const tw=Math.max(mw(line,s1,FAM.text,'600','italic'),mw(d,s2,FAM.text,'400','italic'))+56;
  g.save();g.globalAlpha*=kk;g.translate(W/2,gy+(1-kk)*16);g.rotate(0.01);B_sheet(-tw/2,0,tw,104,G.n*13+5,{sa:0.5,sb:20,sy:8,fill:'#EFE7D6'});
  g.fillStyle=B.sealDeep;g.fillRect(-tw/2+20,36,8,8);TGRP='gl'+w;T(line,-tw/2+38,36,s1,B.ink,FAM.text,'600','left',1,{st:'italic'});T(d,-tw/2+38,76,s2,'#2A2C38',FAM.text,'400','left',1,{st:'italic'});TGRP=null;g.restore();logGloss(w,G.def);gy+=118});
 grain(t,0.05)}

// ---------- the full poem on a page; paper sized to its content; credit on two lines; glossary key inside the paper ----------
function Wpage(t,c,o={}){(o.bg||(t=>Wbg(t,1,{moon:false})))(t,c);
 // auto-fit: the whole page (title .. glossary key) must sit inside the safe zone (title top >= SAFE_TOP, last line <= SAFE_BOT)
 const extra=(o.credit!=null||o.reserve?70:0)+(o.key!=null||o.reserve?4*29+16:0),room=SAFE_BOT-12-(SAFE_TOP+16)-36+20;let size=22,rows,lh,textH;
 for(;size>=18;size-=0.5){rows=poemRows([...Array(TEXT.length).keys()],size,W-112,FAM.text,'italic',28).length;lh=size*1.4;textH=58+50+44+rows*lh+10*size*0.3;if(textH+extra<=room)break}
 const ph=textH+extra+36,py=o.py??(SAFE_TOP+16-36+(room-(textH+extra))/2);
 g.save();if(o.cam)o.cam(py,ph);
 B_sheet(24,py,W-48,ph,17,{sa:0.6,sb:50,sy:20});if(o.under)o.under(py,ph);
 const res=poemPage(t,c,{top:py+58,size,ink:B.ink,titleCol:B.ink,sigCol:'#3E404C',dim:0.95,lit:o.lit,litCol:B.ink,hl:o.hl??!!o.lit,brush:true,glow:false,gloss:Object.keys(GLOSS),sig:o.sig,title:o.title??-1});
 let y=res.bottom+16;if(o.credit!=null){const ck=cl((t-o.credit)/0.3);if(ck>0){g.save();g.globalAlpha*=ck;g.fillStyle='rgba(176,54,31,0.6)';g.fillRect(W/2-60*ck,y,120*ck,1.2);g.restore();
   (TXT.credit.length?TXT.credit:[SOURCE]).slice(0,2).forEach((cr,i)=>rise(cr,W/2,y+24+i*26,19.5,'#3A3C48',o.credit+i*0.1,t,FAM.text,'400',0.008,'center',{st:'italic',blur:false}))}y+=70}
 if(o.key!=null){Object.entries(GLOSS).forEach(([w,G],i)=>{rise(FN_MARK[G.n]+' '+w+' — '+G.def,62,y+10,19,'#2A2C38',o.key+i*0.18,t,FAM.text,'400',0.006,'left',{st:'italic',blur:false});y+=29})}
 if(o.seal!=null)B_sealOn(()=>B_seal('i',W-70,py+ph-44,46,0.06,cl((t-o.seal)/0.12)));
 g.restore();grain(t,0.04);return {res,py,ph}}

// ---------- step card ----------
const Wglyph=ch=>B_canvas('Wg'+ch,720,1280,(x,w,h)=>{x.fillStyle='#000';x.fillRect(0,0,w,h);x.fillStyle='#fff';x.font=`normal 700 470px ${FAM.displayS}`;x.textAlign='center';x.textBaseline='middle';x.fillText(ch,w/2,600)});
function Wchap(t,c,num,word,seal){const D=Math.max(B_ink(t),0.5),k=c.k,z=1+0.15*eo5((k-0.27)/0.37);sky('#1E2A44','#2F3E58');
 g.save();g.translate(W/2,H*0.49);g.scale(z,z);g.translate(-W/2,-H*0.49);
 g.drawImage(GL.run('B_num',B_NUM_FS,{T:t,K:k,D},{G:[1,Wglyph(num)]},PW,PH),0,0,W,H);{const nk=cl((k-0.06)/0.12);g.save();g.globalAlpha*=nk;g.font=F(470,FAM.displayS,'700','normal');g.textAlign='center';g.textBaseline='middle';const ng=g.createLinearGradient(0,400,0,780);ng.addColorStop(0,'rgba(214,222,236,0)');ng.addColorStop(1,'rgba(214,222,236,0.36)');g.fillStyle=ng;if(!QA.hideText)g.fillText(num,W/2,600);g.restore();logText(num,W/2-140,420,W/2+140,780,470,'#D6DEEC','deco')}
 const two=/^the /.test(word),big=two?word.slice(4):word,col=/gratitude/.test(word)?GOLD:B.ivory;let sz=150;while(mw(big,sz,FAM.bodoni,'700')>W*0.82)sz-=4;const bw=mw(big,sz,FAM.bodoni,'700');
 TGRP='Wchap';if(two)rise('the',W/2-bw/2+30,640-sz*0.78,64,B.ivory,c.t0+0.02,t,FAM.display,'400',0.02,'center',{st:'italic',stroke:[B.ink,4]});
 dropIn(big,W/2,640,sz,col,c.t0+0.04,t,FAM.bodoni,'700',0.016,'center',{stroke:[B.ink,5],fall:sz*0.6});TGRP=null;
 B_sealOn(()=>B_seal(seal,Math.min(W-40,W/2+bw/2+6),640+sz*0.42,50,0.05,cl((k-0.3)/0.08)));
 g.restore();vignette(0.35,'6,9,20');grain(t,0.04)}

// ---------- kinetic serif block; key words take the clock colour (silver -> gold for gratitude) ----------
function Wkin(t,c,spec,lines,o={}){if(o.bg!==false)(o.bg||(t=>Wbg(t,1)))(t,c);const ws=spec.map(([s,w,k])=>[s,typeof w==='number'?w:WT(w,c.t0-0.6),k]);
 kineticBlock(t,ws,lines,{cy:o.cy||H*0.46,small:o.small||52,big:o.big||104,famB:FAM.bodoni,keyCol:o.keyCol||keyCol(t,spec.find(s=>s[2])?.[0]||''),lh:o.lh});grain(t,0.05)}
function Wslam(t,c,s,word,o={}){const t0=typeof word==='number'?word:WT(word,c.t0-0.5),u=t-t0;if(u<-0.02)return;const k=spr(u,18,0.45),sz=o.size||250;
 g.save();g.translate(W/2,o.y||H*0.45);g.scale(1.35-0.35*k,1.35-0.35*k);g.globalAlpha*=cl(u*12);T(s,0,0,sz,o.col||B.ivory,FAM.bodoni,'700','center',1,{stroke:[B.ink,8],shadow:[24,0.6]});g.restore()}

// ---------- figures (dry brush, silver rim light) ----------
function Wbrush(pts,w0,w1,col){const N=pts.length;g.save();g.fillStyle=col;g.beginPath();const L=[],R=[];for(let i=0;i<N;i++){const a=pts[Math.min(N-1,i+1)],b=pts[Math.max(0,i-1)],dx=a[0]-b[0],dy=a[1]-b[1],l=Math.hypot(dx,dy)||1,w=lerp(w0,w1,i/(N-1))/2;L.push([pts[i][0]-dy/l*w,pts[i][1]+dx/l*w]);R.push([pts[i][0]+dy/l*w,pts[i][1]-dx/l*w])}
 L.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));R.reverse().forEach(([x,y])=>g.lineTo(x,y));g.closePath();g.fill();g.restore()}
const qpts=(x0,y0,cx,cy,x1,y1,n=14)=>[...Array(n).keys()].map(i=>{const u=i/(n-1);return [(1-u)*(1-u)*x0+2*u*(1-u)*cx+u*u*x1,(1-u)*(1-u)*y0+2*u*(1-u)*cy+u*u*y1]});
// an open hand, palm up, fingers readable; dir 1 = reaching right; cup 0..1 curls the fingers
function Whand(x,y,s,dir=1,cup=0.3,col='rgba(16,18,30,0.96)',rim=`rgba(${SILVER},0.55)`){g.save();g.translate(x,y);g.scale(dir*s,s);
 Wbrush(qpts(-300,40,-160,30,-40,20),70,64,col);                               // forearm
 g.fillStyle=col;g.beginPath();g.ellipse(10,10,70,34,-0.05,0,7);g.fill();        // palm
 for(let i=0;i<4;i++){const by=-8+i*10,len=78-Math.abs(i-1.2)*9,tip=[60+len,by-10-cup*30+i*4];Wbrush(qpts(50,by,60+len*0.6,by-8,tip[0],tip[1]),16-i*1.2,10-i,col)}
 Wbrush(qpts(-10,-14,30,-58,72,-66),20,11,col);                                // thumb
 g.strokeStyle=rim;g.lineWidth=1.6/s;g.beginPath();g.moveTo(-300,6);g.quadraticCurveTo(-160,-2,-30,-14);g.quadraticCurveTo(30,-60,74,-70);g.stroke();g.restore()}
// a standing / gesturing person in dry brush; pose: 'stand' | 'cup' (child cupping rain) | 'bend' (farmer, conical hat) | 'arms' (arms up)
function Wperson(x,y,s,pose='stand',col='rgba(12,14,24,0.97)'){g.save();g.translate(x,y);g.scale(s,s);const rim=`rgba(${SILVER},0.45)`;
 const bend=pose==='bend'?0.5:0;g.rotate(0);const hx=bend*34,hy=-92+bend*26;
 Wbrush(qpts(0,-30,bend*14,-56,hx*0.8,hy+18),26,20,col);                         // torso
 g.fillStyle=col;g.beginPath();g.arc(hx,hy,13,0,7);g.fill();
 if(pose==='bend'){g.beginPath();g.moveTo(hx-34,hy+2);g.lineTo(hx,hy-24);g.lineTo(hx+34,hy+2);g.closePath();g.fill()}
 Wbrush(qpts(-5,-32,-8,-14,-11,0),10,7,col);Wbrush(qpts(5,-32,8,-14,12,0),10,7,col);
 const arm=pose==='arms'?[[-30,-118],[30,-118]]:pose==='cup'?[[-8,-74],[8,-74]]:pose==='bend'?[[hx+20,hy+60],[hx+30,hy+66]]:[[-16,-36],[16,-36]];
 Wbrush(qpts(-8,-72+bend*20,(-8+arm[0][0])/2-8,(-72+arm[0][1])/2,arm[0][0],arm[0][1]),8,6,col);Wbrush(qpts(8,-72+bend*20,(8+arm[1][0])/2+8,(-72+arm[1][1])/2,arm[1][0],arm[1][1]),8,6,col);
 if(pose==='cup'){g.beginPath();g.ellipse(0,-76,13,6,0,0,Math.PI);g.fill()}
 g.strokeStyle=rim;g.lineWidth=1.2/s;g.beginPath();g.arc(hx,hy,13,-2.6,-0.6);g.stroke();g.restore()}
// constellation stars (roll call): one sky, five named stars
const W_STARS=[[150,330],[280,250],[430,300],[560,240],[600,400]];
function Wstar(x,y,r,a,rgb=SILVER){if(a<=0.01)return;g.save();g.globalCompositeOperation='lighter';glow(x,y,r*5,rgb,0.35*a,0.4);Wglint(x,y,r*3.2,a,rgb);g.restore()}

// ---------- portraits: ink-wash faces on rice-paper slips (mosaic) ----------
const W_FACE=[{hair:'bun',g:0,age:2},{hair:'short',g:1,age:1},{hair:'cap',g:0,age:3},{hair:'sari',g:0,age:2},{hair:'short',g:1,age:0},{hair:'bald',g:1,age:3},{hair:'braid',g:0,age:0},{hair:'turban',g:0,age:2},{hair:'curly',g:1,age:1},{hair:'short',g:0,age:3,beard:1},{hair:'bun',g:1,age:1},{hair:'long',g:0,age:1}];
function Wface(x,y,w,h,i,warm=0){const F=W_FACE[i%W_FACE.length],r=RNG(i*17+3);g.save();g.filter=`blur(${0.7*SC}px)`;g.fillStyle='#E9E1CE';g.fillRect(x,y,w,h);g.globalAlpha=0.8;g.drawImage(PAPER,(i*97)%400,(i*61)%600,w*SC,h*SC,x,y,w,h);g.globalAlpha=1;
 if(warm>0){g.fillStyle=`rgba(255,214,150,${0.35*warm})`;g.fillRect(x,y,w,h)}
 const cx=x+w/2+(r()-0.5)*14,cy=y+h*0.44,fw=w*0.25,fh=h*0.2,ink='rgba(21,24,38,';
 g.fillStyle=ink+'0.88)';g.beginPath();g.ellipse(cx,y+h*1.02,w*0.42,h*0.3,0,Math.PI,0);g.fill();                 // shoulders
 if(F.hair==='sari'){g.fillStyle='rgba(21,24,38,0.35)';g.beginPath();g.ellipse(cx,cy-4,fw*1.35,fh*1.45,0,0,7);g.fill()}
 g.fillStyle=ink+'0.14)';g.beginPath();g.ellipse(cx,cy,fw,fh,0,0,7);g.fill();                                         // face wash
 g.fillStyle=ink+'0.9)';const hy=cy-fh*0.55;
 if(F.hair==='bun'){g.beginPath();g.ellipse(cx,hy,fw*1.05,fh*0.6,0,Math.PI,0);g.fill();g.beginPath();g.arc(cx,hy-fh*0.6,fw*0.42,0,7);g.fill()}
 else if(F.hair==='short'||F.hair==='curly'){g.beginPath();g.ellipse(cx,hy,fw*1.06,fh*0.62,0,Math.PI,0);g.fill();if(F.hair==='curly')for(let k=0;k<7;k++){g.beginPath();g.arc(cx-fw+k*fw/3,hy-fh*0.35,fw*0.2,0,7);g.fill()}}
 else if(F.hair==='cap'){g.beginPath();g.ellipse(cx,hy-2,fw*1.1,fh*0.5,0,Math.PI,0);g.fill();g.fillRect(cx-fw*1.3,hy-2,fw*2.6,5)}
 else if(F.hair==='turban'){g.fillStyle='rgba(21,24,38,0.7)';g.beginPath();g.ellipse(cx,hy-6,fw*1.15,fh*0.75,0,Math.PI,0);g.fill()}
 else if(F.hair==='braid'||F.hair==='long'){g.beginPath();g.ellipse(cx,hy,fw*1.08,fh*0.62,0,Math.PI,0);g.fill();g.fillRect(cx-fw*1.08,hy,fw*0.3,fh*1.6);g.fillRect(cx+fw*0.78,hy,fw*0.3,fh*(F.hair==='long'?1.6:0.6))}
 else if(F.hair==='bald'){g.strokeStyle=ink+'0.7)';g.lineWidth=2;g.beginPath();g.arc(cx,cy,fw*1.02,-2.6,-0.5);g.stroke()}
 g.strokeStyle=ink+'0.85)';g.lineWidth=2;g.lineCap='round';const ey=cy-fh*0.05;g.beginPath();g.moveTo(cx-fw*0.5,ey);g.lineTo(cx-fw*0.22,ey);g.moveTo(cx+fw*0.22,ey);g.lineTo(cx+fw*0.5,ey);g.moveTo(cx,ey+4);g.lineTo(cx-3,ey+fh*0.4);g.moveTo(cx-fw*0.25,cy+fh*0.55);g.quadraticCurveTo(cx,cy+fh*(0.62+0.06*(1-F.age/3)),cx+fw*0.25,cy+fh*0.55);g.stroke();
 if(i%3===1){g.lineWidth=1.6;g.beginPath();g.arc(cx-fw*0.36,ey,fw*0.24,0,7);g.arc(cx+fw*0.36,ey,fw*0.24,0,7);g.stroke()}
 if(F.beard){g.fillStyle=ink+'0.6)';g.beginPath();g.ellipse(cx,cy+fh*0.75,fw*0.7,fh*0.45,0,0,Math.PI);g.fill()}
 if(F.age>=3){g.strokeStyle=ink+'0.35)';g.lineWidth=1;g.beginPath();g.moveTo(cx-fw*0.5,cy-fh*0.38);g.lineTo(cx+fw*0.5,cy-fh*0.38);g.stroke()}
 g.filter='none';g.globalCompositeOperation='multiply';g.globalAlpha=0.35;g.drawImage(PAPER,(i*131)%500,(i*71)%700,w*SC,h*SC,x,y,w,h);g.restore()}


// ---------- particle head: a readable profile that the particles settle into ----------
const W_HEADP=(()=>{const P=new Path2D();P.moveTo(-40,-150);P.bezierCurveTo(40,-170,100,-120,104,-60);P.lineTo(110,-30);P.lineTo(132,8);P.lineTo(110,16);P.lineTo(114,34);P.lineTo(106,40);P.lineTo(110,56);P.bezierCurveTo(104,80,80,90,60,92);P.lineTo(44,140);P.lineTo(60,230);P.lineTo(-90,230);P.lineTo(-70,120);P.bezierCurveTo(-130,90,-150,-20,-120,-90);P.bezierCurveTo(-100,-130,-80,-146,-40,-150);P.closePath();return P})();
const W_HEAD=(()=>{const c=mkC(10,10).getContext('2d'),r=RNG(5150),pts=[];let n=0;while(pts.length<1100&&n<20000){n++;const x=r()*300-160,y=r()*400-170;if(c.isPointInPath(W_HEADP,x,y))pts.push([x,y,r()*W,r()*H,r()])}return pts})();
function Whead(t,cx,cy,s,p,lit=0,rgb=SILVER){g.save();g.globalCompositeOperation='lighter';for(const [x,y,ox,oy,h] of W_HEAD){const k=eio(cl((p-h*0.35)/0.65)),px=lerp(ox,cx+x*s,k),py=lerp(oy,cy+y*s,k);glow(px,py,(1.4+h*1.6)*s,rgb,(0.22+0.4*k+0.3*lit)*(0.5+0.5*h),0.5)}
 const ok=cl((p-0.7)/0.3);if(ok>0){g.translate(cx,cy);g.scale(s,s);g.strokeStyle=`rgba(${rgb},${0.7*ok})`;g.lineWidth=2/s;g.stroke(W_HEADP)}g.restore()}

// ---------- the crown: ruling-pen line in cold brass, hard specular, no glow ----------
function Wcrown(cx,cy,s,p,a=1,melt=0){const pts=[[-1,0.5],[-1,-0.3],[-0.55,0.15],[0,-0.6],[0.55,0.15],[1,-0.3],[1,0.5],[-1,0.5]];let L=0;const seg=[];for(let i=1;i<pts.length;i++){const d=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);seg.push(d);L+=d}
 g.save();g.translate(cx,cy+melt*s*0.6);g.scale(s,s*(1-melt*0.55));g.globalAlpha*=a;
 if(p>=1){const gr=g.createLinearGradient(0,-0.6,0,0.5);gr.addColorStop(0,'rgba(138,132,102,0.55)');gr.addColorStop(1,'rgba(60,58,44,0.75)');g.fillStyle=gr;g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.fill()}
 g.strokeStyle='#A7A07E';g.lineWidth=6/s;g.lineJoin='miter';g.beginPath();g.moveTo(pts[0][0],pts[0][1]);let acc=0;
 for(let i=1;i<pts.length;i++){const f=cl((p*L-acc)/seg[i-1]);if(f<=0)break;g.lineTo(lerp(pts[i-1][0],pts[i][0],f),lerp(pts[i-1][1],pts[i][1],f));acc+=seg[i-1]}g.stroke();
 if(p>=1){g.fillStyle='#A7A07E';for(const [x,y] of [[-1,-0.3],[0,-0.6],[1,-0.3]]){g.beginPath();g.arc(x,y-0.06,0.07,0,7);g.fill()}g.strokeStyle='rgba(240,238,225,0.9)';g.lineWidth=2/s;g.beginPath();g.moveTo(-0.9,0.42);g.lineTo(-0.2,0.42);g.stroke()}
 g.restore()}

// ---------- the coaster: rails, ties, an ink trestle, a car with a rider ----------
const Wtrack=(x,ph=0,A=180,y0=640,f=0.0105)=>y0-A*Math.sin(x*f+ph);
function WtrackDraw(t,ph,A,y0,f,a=1,x0=-W,x1=2*W,trestle=false){g.save();g.globalAlpha*=a;g.lineCap='round';
 if(trestle){g.strokeStyle='rgba(10,12,20,0.95)';g.lineWidth=3;for(let x=Math.ceil(x0/48)*48;x<=x1;x+=48){const y=Wtrack(x,ph,A,y0,f);g.beginPath();g.moveTo(x,y+14);g.lineTo(x,y0+A+260);g.stroke();g.beginPath();g.moveTo(x,y+60);g.lineTo(x+48,Wtrack(x+48,ph,A,y0,f)+120);g.stroke()}}
 for(const [off,lw,col] of [[0,4,`rgba(${SILVER},0.95)`],[14,2.4,`rgba(${SILVER},0.6)`]]){g.strokeStyle=col;g.lineWidth=lw;g.shadowColor=`rgba(${SILVER},0.7)`;g.shadowBlur=8*SC;g.beginPath();for(let x=x0;x<=x1;x+=6)g.lineTo(x,Wtrack(x,ph,A,y0,f)+off);g.stroke()}
 g.shadowBlur=0;g.strokeStyle=`rgba(${SILVER},0.45)`;g.lineWidth=1.4;for(let x=Math.ceil(x0/18)*18;x<=x1;x+=18){const y=Wtrack(x,ph,A,y0,f);g.beginPath();g.moveTo(x,y);g.lineTo(x,y+14);g.stroke()}g.restore()}
function Wcar(x,y,ang,arms=0,s=1){g.save();g.translate(x,y);g.rotate(ang);g.scale(s,s);g.fillStyle='rgba(12,14,24,0.98)';g.beginPath();g.roundRect(-34,-26,68,26,6);g.fill();g.strokeStyle=`rgba(${SILVER},0.8)`;g.lineWidth=1.6;g.stroke();
 g.fillStyle=`rgba(${SILVER},0.9)`;g.beginPath();g.arc(-14,2,6,0,7);g.arc(14,2,6,0,7);g.fill();Wperson(0,-24,0.42,arms>0.5?'arms':'stand','rgba(12,14,24,0.98)');g.restore()}
// backdrop behind the rounded speaker card (speaker below cover scale): the act's world, softly lit
function SPKBG(t,r){g.save();g.beginPath();g.rect(r.x,r.y,r.w,r.h);g.clip();Wbg(t,1,{moon:false,la:0.18});g.restore()}
