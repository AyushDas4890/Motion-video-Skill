// acts/shared.js — shared devices owned by the lead: poem card, full poem page, footnotes, step chapter card,
// kinetic type block, mosaic grid. Every act file uses these; THEME carries the chosen art direction.
'use strict';
const THEME={
 cardBg:(t)=>{sky3('#070912','#0E1226','#06070D');bokeh(t,14,77,0.28)},   // dark ground behind floating cards
 card:['#1A2346','#2B2140'],cardText:'#E9ECF6',cardDim:0.78,cardEdge:'rgba(255,255,255,0.16)',
 lit:'#FFE2A6',hl:'rgba(242,196,107,0.30)',hlEdge:'rgba(255,226,166,0.55)',
 pageBg:null,pageInk:'#EDEFF5',pageTitle:'#FFFFFF',pageSig:STYLE.accent,
 chapGrad:['#B9B4B0','#F2EDE8','#DCC9BB','#B79C90'],chapNum:'181,137,111',chapInk:'#141016',
 footCap:'#FFE2A6',footText:'#FFFFFF',footStroke:'rgba(6,6,14,0.9)'};

// ---------- poem typesetting (wrap with hanging indent; memoised) ----------
const PLAY={};
function poemRows(lis,size,maxW,fam=FAM.text,st='italic',indent=28){const key=lis.join(',')+'|'+size+'|'+maxW+'|'+fam+st;if(PLAY[key])return PLAY[key];g.save();g.font=F(size,fam,'400',st);const sp=g.measureText(' ').width;const rows=[];
 for(const li of lis){const ws=POEM[li].split(' ');let row=[],x=0,first=true;
  ws.forEach((w,wi)=>{const ww=g.measureText(w).width+(GLOSS[norm(w)]?size*0.5:0);const lim=first?maxW:maxW-indent;if(row.length&&x+ww>lim){rows.push({li,first,words:row,w:x-sp});row=[];x=0;first=false}row.push({w,wi,x:x+(first?0:indent),ww});x+=ww+sp});rows.push({li,first,words:row,w:x-sp})}
 g.restore();return PLAY[key]=rows}
// draw a set of poem lines. opt: {x, y, size, lh, maxW, fam, st, col, dim, lit:{li:[times]}|set, t, hl:{li:[t0,t1]}, glow, align:'left'|'center', gloss:[words], kind}
function drawPoemLines(t,lis,opt){const size=opt.size||28,lh=opt.lh||size*1.42,fam=opt.fam||FAM.text,st=opt.st||'italic',maxW=opt.maxW||W-120;const rows=poemRows(lis,size,maxW,fam,st,opt.indent??28);
 let y=opt.y,prev=null;const bounds={};const litIdx={};
 for(const r of rows){if(prev!=null&&prev!==r.li)y+=opt.gap??size*0.38;prev=r.li;const x0=opt.align==='center'?(opt.x??W/2)-r.w/2:(opt.x??60);
  const cues=opt.lit&&opt.lit[r.li];
  // highlighter sweep behind lit words (template device): grows left->right with the word cues
  if(cues&&opt.hl!==false){let x1=null,xa=null;for(const wd of r.words){const tw=Array.isArray(cues)?cues[wd.wi]:-1e9;if(t>=tw-0.05){const k=Array.isArray(cues)?eo5((t-tw+0.05)/0.22):1;xa=xa??(x0+wd.x-6);x1=x0+wd.x+wd.ww*k+6}}
   if(x1!=null&&x1>xa&&opt.brush&&typeof B_washBand==='function'){B_washBand(xa,y,x1-xa,size*1.05,opt.hlCol||THEME.hl,r.li*7+3,1)}else if(x1!=null&&x1>xa){g.save();g.fillStyle=opt.hlCol||THEME.hl;const hh=size*1.02;g.beginPath();g.moveTo(xa,y-hh*0.48);for(let q=0;q<=12;q++){const xx=lerp(xa,x1,q/12);g.lineTo(xx,y-hh*0.48+vnoise(xx*0.05,r.li)*1.6)}g.lineTo(x1,y+hh*0.5);for(let q=12;q>=0;q--){const xx=lerp(xa,x1,q/12);g.lineTo(xx,y+hh*0.5+vnoise(xx*0.05+9,r.li)*1.6)}g.closePath();g.fill();g.restore()}}
  for(const wd of r.words){const tw=cues?(Array.isArray(cues)?cues[wd.wi]:-1e9):1e9;const lk=cues?cl((t-tw+0.05)/0.18):0;const on=lk>0;if(on){(litIdx[r.li]=litIdx[r.li]||[]).push(wd.wi)}
   const col=on?(opt.litCol||THEME.lit):(opt.col||THEME.cardText);const a=on?1:(opt.dim??THEME.cardDim);const dy=0;
   if(on&&opt.glow!==false){g.save();g.globalAlpha*=0.5*lk;g.shadowColor='rgba(255,200,110,0.9)';g.shadowBlur=16*SC;g.font=F(size,fam,'400',st);g.textBaseline='middle';g.fillStyle=col;if(!QA.hideText)g.fillText(wd.w,x0+wd.x,y+dy);g.restore()}
   T(wd.w,x0+wd.x,y+dy,size,col,fam,'400','left',a,{st,kind:opt.kind||'must',edge:opt.edge||null});
   // glossary marker: superscript numeral after the glossed word (decorative; the definition carries it at the frame edge)
   const key=norm(wd.w);if(opt.gloss&&GLOSS[key]&&opt.gloss.includes(key)){T(FN_MARK[GLOSS[key].n],x0+wd.x+wd.ww-size*0.5+1,y-size*0.42,size*0.62,opt.litCol||THEME.lit,FAM.text,'600','left',1,{kind:'deco'})}
   bounds[r.li+':'+wd.wi]=[x0+wd.x,y-size/2,x0+wd.x+wd.ww,y+size/2]}
  y+=lh}
 for(const li of lis)logPoem(li,POEM[li],litIdx[li]||[]);return {bottom:y,bounds}}
// footnote at the frame edge: "¹ IMPALPABLE  something that cannot be touched" — small caps + italic. y defaults to the low safe edge.
function footnote(t,word,t0,opt={}){const G=GLOSS[word];if(!G||t<t0)return;const k=eo5((t-t0)/0.45),o=opt.t1?eo((t-opt.t1)/0.3):0;if(o>=1)return;const y=opt.y??(SAFE_BOT-26-(opt.slot||0)*46),x=opt.x??44;
 g.save();g.globalAlpha*=k*(1-o);const capSz=19,txtSz=24;const cap=FN_MARK[G.n]+' '+word.toUpperCase();
 g.strokeStyle=opt.rule||'rgba(255,226,166,0.6)';g.lineWidth=1;g.beginPath();g.moveTo(x,y-24);g.lineTo(x+lerp(0,120,k),y-24);g.stroke();
 const cw=T(cap,x,y,capSz,opt.capCol||THEME.footCap,FAM.text,'600','left',1,{ls:3,stroke:[opt.stroke||THEME.footStroke,4]});
 rise(G.def,x+cw+14,y+1,txtSz,opt.txtCol||THEME.footText,t0+0.12,t,FAM.text,'400',0.012,'left',{st:'italic',blur:false,stroke:[opt.stroke||THEME.footStroke,4]});g.restore();logGloss(word,G.def)}

// ---------- the template's floating card on dark: slow zoom + tilt, highlighter sweep ----------
// opt: {lines:[li..], lit:{li:times[]}, gloss:[words], foot:[[word,t0]], size, tilt, title:true, bg:fn}
function floatingCard(t,c,opt){const k=c.k;(opt.bg||THEME.cardBg)(t,c);
 const size=opt.size||(opt.lines.length<=2?38:31),maxW=W-112,rows=poemRows(opt.lines,size,maxW,FAM.text,'italic',28);const lh=size*1.42;let hTxt=rows.length*lh+(opt.lines.length-1)*size*0.38;const head=opt.head!==false?70:0;
 const cw=W-56,ch=hTxt+head+70,cx=W/2,cy=opt.cy||H*0.47;const ent=1-eo5(k/0.34);const zoom=(1+0.45*ent)*(1+0.012*k);const tilt=(opt.tilt??0.10)*Math.sin(0.5+k*0.35)+ent*0.12;
 // render the card flat into a layer, then draw it in vertical slices with a perspective tilt (one side nearer)
 const L=onLayer(1,()=>{g.save();g.translate(cx,cy);g.translate(-cw/2,-ch/2);
   g.save();g.shadowColor='rgba(0,0,0,0.6)';g.shadowBlur=40*SC;g.shadowOffsetY=18*SC;g.beginPath();g.roundRect(0,0,cw,ch,22);const gr=g.createLinearGradient(0,0,cw,ch);gr.addColorStop(0,THEME.card[0]);gr.addColorStop(1,THEME.card[1]);g.fillStyle=gr;g.fill();g.restore();
   g.save();g.beginPath();g.roundRect(0,0,cw,ch,22);g.clip();const sh=g.createLinearGradient(0,0,0,ch);sh.addColorStop(0,'rgba(255,255,255,0.10)');sh.addColorStop(0.3,'rgba(255,255,255,0)');g.fillStyle=sh;g.fillRect(0,0,cw,ch);g.restore();
   g.strokeStyle=THEME.cardEdge;g.lineWidth=1.2;g.beginPath();g.roundRect(0.5,0.5,cw-1,ch-1,22);g.stroke();
   if(head)T(TXT.cardHeadFloat||[TEXT_AUTHOR,TEXT_TITLE].filter(Boolean).join(' · ').toUpperCase(),cw/2,46,19,'rgba(233,236,246,0.82)',FAM.sans,'600','center',1,{ls:4});
   drawPoemLines(t,opt.lines,{x:28,y:head+40+size*0.5,size,maxW,lit:opt.lit,gloss:opt.gloss,litCol:opt.litCol});g.restore()});
 // perspective slices: yaw about the vertical axis
 const N=36,x0=cx-cw/2-40,x1=cx+cw/2+40;g.save();g.translate(cx,cy);g.scale(zoom,zoom);g.translate(-cx,-cy);
 for(let i=0;i<N;i++){const u0=i/N,u1=(i+1)/N,sx=lerp(x0,x1,u0),sw=(x1-x0)/N;const depth=lerp(-1,1,(u0+u1)/2)*tilt;const sy=1-depth*0.5,dx=cx+(sx-cx)*(1-Math.abs(tilt)*0.18)-depth*6;
  g.drawImage(L,sx*SC,(cy-ch/2-40)*SC,sw*SC+1,(ch+80)*SC,dx,cy-(ch/2+40)*sy,sw*(1-Math.abs(tilt)*0.18)+0.6,(ch+80)*sy)}
 g.restore();
 // footnotes live at the frame edge, outside the card
 (opt.foot||[]).forEach(([w,t0],i)=>footnote(t,w,t0,{slot:i}));
 // QA: the card text was logged inside the layer with layer transforms; re-log is not needed (same logical coords up to the tilt <= 3%)
}

// ---------- the full poem as a page (opening and coda). opt: {lit:{li:times|true}, sig:t0, credit:t0, title:t0, ink, bg} ----------
function poemPage(t,c,opt={}){if(opt.bg)opt.bg(t,c);const size=opt.size||21.5,lh=size*1.40,ink=opt.ink||THEME.pageInk;let y=opt.top||206;
 const tk=opt.title??-1;T(POEM_TITLE,W/2,y,44,opt.titleCol||THEME.pageTitle,FAM.display,'600','center',cl((t-tk)/0.25),{st:'italic',stroke:opt.stroke?[opt.stroke,4]:null});y+=50;
 if(opt.sig!=null){const sk=cl((t-opt.sig)/0.9);if(sk>0){const tw=mw(POEM_AUTHOR,40,FAM.script);g.save();g.beginPath();g.rect(W/2-tw/2-20,y-34,(tw+40)*eio(sk),70);g.clip();T(POEM_AUTHOR,W/2,y,40,opt.sigCol||THEME.pageSig,FAM.script,'400','center',1,{stroke:opt.stroke?[opt.stroke,3]:null});g.restore()}}y+=44;
 const lis=[...Array(TEXT.length).keys()];const res=drawPoemLines(t,lis,{x:56,y,size,lh,maxW:W-112,lit:opt.lit,col:ink,dim:opt.dim??0.92,gloss:opt.gloss,litCol:opt.litCol,hl:opt.hl,glow:opt.glow,brush:opt.brush,hlCol:opt.hlCol,gap:size*0.30,edge:opt.stroke?{stroke:opt.stroke,w:5}:null});
 if(opt.credit!=null){const ck=cl((t-opt.credit)/0.3);if(ck>0){const yy=Math.min(SAFE_BOT-14,res.bottom+18);g.save();g.globalAlpha*=ck;g.strokeStyle=opt.ruleCol||'rgba(255,226,166,0.55)';g.lineWidth=1;g.beginPath();g.moveTo(W/2-60*ck,yy-22);g.lineTo(W/2+60*ck,yy-22);g.stroke();
   rise(SOURCE,W/2,yy,19.5,opt.creditCol||ink,opt.credit,t,FAM.text,'400',0.008,'center',{st:'italic',blur:false,stroke:opt.stroke?[opt.stroke,3]:null});g.restore()}}
 return res}

// ---------- the template's "step" chapter card: soft gradient, giant faded numeral, serif letters drop in, push ----------
function chapterCard(t,c,num,word,opt={}){const k=c.k;const G=opt.grad||THEME.chapGrad;
 const gr=g.createLinearGradient(0,0,W*0.6,H);gr.addColorStop(0,G[0]);gr.addColorStop(0.35,G[1]);gr.addColorStop(0.7,G[2]);gr.addColorStop(1,G[3]);g.fillStyle=gr;g.fillRect(-W,-H,3*W,3*H);
 glow(W*0.82,H*0.12,520,'255,250,245',0.55,0.2);if(opt.paper)g.drawImage(PAPER,0,0,W,H);if(opt.under)opt.under(t,c);
 const push=1+0.15*eio((k-0.27)/0.37);g.save();g.translate(W/2,H*0.48);g.scale(push,push);g.translate(-W/2,-H*0.48);
 // giant faded numeral behind (fades toward the top), in from frame 4
 const nk=cl((k-0.10)/0.10);if(nk>0){g.save();g.globalAlpha*=nk;g.font=F(330,opt.numFam||FAM.bodoni,'400','normal');g.textAlign='center';g.textBaseline='middle';const ng=g.createLinearGradient(0,H*0.48-200,0,H*0.48+140);ng.addColorStop(0,`rgba(${THEME.chapNum},0)`);ng.addColorStop(1,`rgba(${THEME.chapNum},0.95)`);g.fillStyle=ng;g.fillText(num,W/2+8,H*0.48-8);g.restore();logText(num,W/2-120,H*0.48-160,W/2+120,H*0.48+150,330,'#b5896f','deco')}
 // the word: one letter per frame, each rising from blur (3 f)
 rise(word,W/2,H*0.48+6,opt.size||96,opt.ink||THEME.chapInk,c.t0+0.05,t,opt.fam||FAM.displayS,'600',1/30,'center',{st:'normal',w:22,z:0.9});
 g.restore();grain(t,0.05)}

// ---------- the template's kinetic serif block: small white words + big accent key words, stair-stepped, one word per beat ----------
// words: [[text, time, isKey]...] ; lines: array of arrays of indexes
function kineticBlock(t,words,lines,opt={}){const sm=opt.small||44,bg=opt.big||92,cy=opt.cy||H*0.55,lhp=opt.lh||(sm*0.95+bg*0.55);
 let y=cy-(lines.length-1)*lhp/2;lines.forEach((L,li)=>{const ws=L.map(i=>words[i]);const sizes=ws.map(w=>w[2]?bg:sm);const fams=ws.map(w=>w[2]?(opt.famB||FAM.display):(opt.famS||FAM.display));const wts=ws.map(w=>w[2]?'700':'600');
  const widths=ws.map((w,i)=>mw(w[0],sizes[i],fams[i],wts[i]));const sp=sm*0.28;const tw=widths.reduce((a,b)=>a+b,0)+sp*(ws.length-1);let x=W/2-tw/2+(li%2?24:-24);
  ws.forEach((w,i)=>{const u=t-w[1];if(u>-0.001){const kk=cl(u/0.1);g.save();g.globalAlpha*=kk;if(kk<1)g.filter=`blur(${((1-kk)*7*SC).toFixed(1)}px)`;T(w[0],x+widths[i]/2,y+(1-kk)*12+(w[2]?0:bg*0.12),sizes[i],w[2]?(opt.keyCol||STYLE.accent):'#FFFFFF',fams[i],wts[i],'center',1,{stroke:['rgba(8,6,16,0.9)',w[2]?7:5],shadow:[16,0.5]});g.filter='none';g.restore()}x+=widths[i]+sp});y+=lhp})}

// ---------- the template's panning mosaic grid. tiles: [(x,y,w,h,i,t)=>draw]; opt.focus: index to punch toward ----------
function mosaic(t,c,tiles,opt={}){const cols=opt.cols||3,gap=opt.gap||12,tw=opt.tw||250,th=opt.th||330;const rows=Math.ceil(tiles.length/cols)+2;
 const pull=lerp(opt.z0||1.69,1,eo5(c.k/(opt.d||0.8)));const pan=[(opt.pan||[1,1])[0]*c.k*14,(opt.pan||[1,1])[1]*c.k*22];
 g.save();g.translate(W/2,H/2);g.scale(pull*(opt.zoom||1),pull*(opt.zoom||1));g.rotate(opt.rot??-0.06);g.translate(-W/2+pan[0]+(opt.off||[0,0])[0],-H/2+pan[1]+(opt.off||[0,0])[1]);
 const gx0=W/2-(cols*(tw+gap))/2,gy0=H/2-(rows*(th+gap))/2;let n=0;
 for(let r=0;r<rows;r++)for(let q=-1;q<=cols;q++){const i=(n++)%tiles.length;const x=gx0+q*(tw+gap)+(r%2)*tw*0.5,y=gy0+r*(th+gap);g.save();g.beginPath();g.roundRect(x,y,tw,th,14);g.clip();tiles[i](x,y,tw,th,i,t);g.restore();g.strokeStyle='rgba(255,255,255,0.10)';g.lineWidth=1;g.beginPath();g.roundRect(x,y,tw,th,14);g.stroke()}
 g.restore()}
