// acts/starter.js — generic STARTER scenes. new_project.py (via starter_beats.py) fills beats_data.py with them so the very
// first render of a new project already reads as a film: every non-speaker shot shows its spoken KEY WORD over the
// colourful world (acts/color.js), on the word. They are placeholders: replace them shot by shot with scenes that
// ILLUSTRATE each idea (README "Add a scene"); keep them for shots that only need a word.
// Beat args (beats_data.py extra {'args': {...}}):
//   gen_word  {word, wt, motif}  word = display word, wt = its spoken onset (s), motif = 'sky'|'cloud'|'garden'|'tree'|'sea'
//   gen_kin   {max}              the shot's spoken words as the template's kinetic serif block (key word big)
//   gen_title {title, sub}       title card (default PROJECT.title / PROJECT.text.title)
//   gen_chap  {num, word, seal}  the template "step" chapter card (Wchap)
// All pure in t (CSKY clock, seeded RNG). Aspect-aware: positions are fractions of W/H, split panels respected.
'use strict';
const ST_MOTIFS=['sky','cloud','garden','tree','sea'];
function ST_seed(c){const id=String((c.a&&c.a.beat&&c.a.beat.id)||c.t0);let h=7;for(const ch of id)h=(h*31+ch.charCodeAt(0))%9973;return h}
// the shot's key word: args.word/args.wt, else the longest word spoken in the shot
function ST_word(c){const a=c.a||{};if(a.word)return [a.word,a.wt??WT(a.word,c.t0-0.3)];let best=null;
 for(const w of WORDS){if(w[0]<c.t0-0.02||w[0]>=c.t1)continue;if(!best||capClean(w[2]).length>capClean(best[2]).length)best=w}
 return best?[capClean(best[2]).replace(/^[“"‘']|[”"’']$/g,''),best[0]]:['',c.t0]}
function ST_fit(s,size,maxW,fam=FAM.bodoni,wt='700'){while(size>36&&mw(s,size,fam,wt)>maxW)size-=4;return size}
const ST_panelW=c=>c.split&&SPLIT==='v'?SEAM:W;
// backdrops (one per motif); hills sit at ~86% H, the word lives in the sky above them
function ST_back(t,c,motif){const sd=ST_seed(c),u=c.k,hy=H*0.865;
 if(motif==='sea'&&H>=1000){Wsea(t,{off:H*0.62-452,mt:0.45,vap:0.25});return}
 if(motif==='cloud'){C_sky(t,{hz:H*0.9});C_hills(t,hy,{trees:4,seed:1+sd%7,flowers:12});
  C_cloud(W*0.5+Math.sin(t*0.25+sd)*18,H*0.2,Math.min(W*0.66,520),{t,seed:sd%9+1,rain:1,a:1});return}
 Wbg(t,1,{moon:false,hy});
 if(motif==='garden'){const r=RNG(sd);const n=Math.max(5,Math.round(W/110));for(let i=0;i<n;i++){const x=(i+0.5)*W/n+(r()-0.5)*30,y=hy+18+r()*40;
   C_flower(x,y,13+r()*6,{t,p:cl((t-c.t0-0.08*i)/0.6),stem:30+r()*30,col:['#B983E6','#F49AC6','#FFE36A','#FFFFFF'][i%4]})}
  C_bush(-10,H+10,Math.min(190,W*0.26),{t,seed:3,n:6});C_bush(W+10,H+10,Math.min(170,W*0.24),{t,seed:4,n:6})}
 else if(motif==='tree')C_tree(W*(sd%2?0.3:0.7),hy+12,Math.min(0.5,W/1440),{t,p:eo(cl(u/1.4)),seed:1+sd%5,flowers:6})}
// the big key word: letters drop in on the spoken onset; gold only for PROJECT.captions.goldWords
function ST_bigWord(t,c,s,t0,y,size0){if(!s)return;const S=CSKY(t),ink=C_inkFor(t),gold=GRATW.test(s)&&t0>=CAPCFG.goldFrom;
 const size=ST_fit(s,size0,ST_panelW(c)*0.84);
 g.save();g.globalCompositeOperation='screen';glow(W/2,y,size*2.2,C_s(C_mx(S.lc,C_WH,0.5)),S.light?0.22:0.16,0.4);g.restore();
 const tw=C_dropIn(s,W/2,y,size,gold?'#FFD36E':ink.keyCol,t0-0.06,t,{fam:FAM.bodoni,grad:gold?C_GOLDG:ink.key,stroke:gold?[C_GOLDEDGE,5]:ink.kst,shadow:ink.sh,fall:size*0.6});
 const k=t-t0-0.22;if(k>0&&k<1.4&&tw){const r=RNG(s.length*13+7);for(let i=0;i<3;i++){const x=W/2+(r()-0.5)*tw,yy=y-size*(0.3+r()*0.4);C_sparkle(x,yy,10+r()*8,Math.sin(Math.PI*cl(k/1.4-i*0.12)),{edge:S.light?'rgba(40,70,140,0.5)':null,rot:k*0.6})}}}
// gen_word: the colour world + the spoken key word (split: centred on the panel; cutaway: high, clear of the caption band)
SCENES.gen_word=(t,c)=>{const a=c.a||{},motif=a.motif||ST_MOTIFS[ST_seed(c)%ST_MOTIFS.length];ST_back(t,c,motif);
 const [s,t0]=ST_word(c),y=c.split?((a.beat&&a.beat.fy)??H*0.42):H*0.36;ST_bigWord(t,c,s,t0,y,c.split?130:150);
 // a few glossy drops drifting in the light (the world's motif), never over the word
 const S=CSKY(t),r=RNG(ST_seed(c)+5);for(let i=0;i<5;i++){const x=r()<0.5?W*(0.06+r()*0.14):W*(0.8+r()*0.14),yy=H*(0.18+r()*0.5)+Math.sin(t*1.2+i)*6;B_drop(x,yy,6+r()*7,0.85,!S.light)}
 grain(t,0.035)};
// gen_kin: the spoken words of the shot as the template's kinetic serif block (key word big, one word per beat)
SCENES.gen_kin=(t,c)=>{const a=c.a||{};C_kinBg(t,{seed:ST_seed(c)%13+1,ly:H*0.47});
 const ws=WORDS.filter(w=>w[0]>=c.t0-0.02&&w[0]<c.t1-0.05).slice(0,a.max||8);if(!ws.length){grain(t,0.04);return}
 const ki=keyIndex(ws),spec=ws.map((w,i)=>[capClean(w[2]).replace(/^[“"‘']|[”"’']$/g,''),w[0],i===ki?1:0]);
 const lines=[];let cur=[];spec.forEach((s,i)=>{if(s[2]){if(cur.length)lines.push(cur);lines.push([i]);cur=[]}else{cur.push(i);if(cur.length===3){lines.push(cur);cur=[]}}});if(cur.length)lines.push(cur);
 const hk=Math.min(1,H/1000);let sm=52*hk,bg=104*hk;const lw=(L,f)=>L.reduce((s,i)=>s+mw(spec[i][0],(spec[i][2]?bg:sm)*f,spec[i][2]?FAM.bodoni:FAM.display,spec[i][2]?'700':'600'),0)+sm*f*0.28*(L.length-1)+48;
 let f=1;for(const L of lines)f=Math.min(f,(W-70)/lw(L,1));const lh=(sm*0.95+bg*0.55)*f,room=(SAFE_BOT-SAFE_TOP)-bg*f;if(lh*(lines.length-1)>room)f*=room/(lh*(lines.length-1));
 C_kin(t,spec,lines,{cy:H*0.46,small:sm*f,big:bg*f,famB:FAM.bodoni,lh:(sm*0.95+bg*0.55)*f});grain(t,0.04)};
// gen_title: the title over the card backdrop, letters dropping line by line; optional subtitle (speaker / source)
SCENES.gen_title=(t,c)=>{const a=c.a||{},s=a.title||TEXT_TITLE||PRJ.title||'',ink=C_inkFor(t);C_cardBg(t);
 const words=s.split(' ');let lines=[s];if(mw(s,96,FAM.bodoni,'700')>W*0.84&&words.length>1){let best=null;for(let i=1;i<words.length;i++){const A=words.slice(0,i).join(' '),B=words.slice(i).join(' '),m=Math.max(mw(A,96,FAM.bodoni,'700'),mw(B,96,FAM.bodoni,'700'));if(!best||m<best[0])best=[m,[A,B]]}lines=best[1]}
 const size=Math.min(...lines.map(L=>ST_fit(L,Math.min(110,H*0.09),W*0.84))),y0=H*0.42-(lines.length-1)*size*0.55;
 lines.forEach((L,i)=>C_dropIn(L,W/2,y0+i*size*1.1,size,ink.keyCol,c.t0+0.05+i*0.22,t,{fam:FAM.bodoni,grad:ink.key,stroke:ink.kst,shadow:ink.sh,fall:size*0.6}));
 const sub=a.sub??(PRJ.speaker?'with '+PRJ.speaker:'');if(sub)C_T(sub,W/2,y0+lines.length*size*1.1+18,Math.max(26,H*0.024),ink.fg,{fam:FAM.text,wt:'600',st:'italic',stroke:ink.st,a:cl((t-c.t0-0.5)/0.3)});
 grain(t,0.04)};
// gen_chap: the template step card (pastel gradient, giant faded numeral, letters drop in one per frame, push)
SCENES.gen_chap=(t,c)=>{const a=c.a||{};Wchap(t,c,String(a.num??1),a.word||'',a.seal)};
