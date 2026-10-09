// examples/voice-of-the-rain/acts/vr_color_scenes.js — VotR scenes restyled by the colour-world painter (moved out of the
// generic acts/color.js). Load right after color.js and BEFORE acts/act*.js: C_scene() keeps these against later
// assignments from act files (the old ink versions are kept in C_SCN[name]).
'use strict';
C_scene('a1_title',(t,c)=>{const u=c.k,HZ=880,ink=['#0E1C50',3];Wsea(t,{off:HZ-452,mx:560,my:186});B_rain(t,46,7,640,60,0.45,0);
 const land=c.t0+1.02,dy=932;if(t<land&&u>0.2){const f=cl((u-0.2)/(land-c.t0-0.2));Wfall(W/2,lerp(40,dy,f*f),12,1)}else if(t>=land){C_splash(W/2,dy,t,land,1.1);C_ripples(W/2,dy+4,t,land,{n:4,sc:1.4,flat:0.2})}
 g.save();g.globalCompositeOperation='screen';glow(W/2,590,300,'150,190,255',0.25,0.4);g.restore();
 C_dropIn('The Voice',W/2,520,96,'#FFF6DE',c.t0+0.05,t,{fam:FAM.display,wt:'600',st:'italic',stag:0.035,fall:46,stroke:ink,grad:['#FFFFFF','#FFF4D6','#CDEBFF'],shadow:[18,0.5,4]});
 C_dropIn('of the Rain',W/2,630,96,'#FFF6DE',c.t0+0.3,t,{fam:FAM.display,wt:'600',st:'italic',stag:0.035,fall:46,stroke:ink,grad:['#FFFFFF','#FFF4D6','#CDEBFF'],shadow:[18,0.5,4]});
 rise('WALT WHITMAN',W/2,736,24,'#FFE29A',c.t0+0.6,t,FAM.text,'600',0.02,'center',{ls:6,stroke:['#0E1C50',3]});
 grain(t,0.04)});

// "aspect of a poem": a sheet on the rainy night; blue ink writes the opening line; drops bead on the paper
C_scene('a1_page',(t,c)=>{Wbg(t,1,{ly:520,la:0.16});B_rain(t,40,11,700,60,0.4,0);const p=eio(cl(c.k/1.1));
 g.save();g.translate(360,520);g.rotate(-0.06);g.scale(1.3,1.3);B_sheet(-260,-150,520,300,9,{sa:0.3,sb:40,sy:16});
 g.strokeStyle='rgba(90,150,220,0.28)';g.lineWidth=1;for(let i=0;i<5;i++){g.beginPath();g.moveTo(-235,-92+i*48);g.lineTo(235,-92+i*48);g.stroke()}
 const sz=30,rows=['And who art thou? said I','to the soft-falling shower,'];rows.forEach((r,i)=>{const w=mw(r,sz,FAM.text,'400','italic'),pr=cl(p*2-i);if(pr<=0)return;g.save();g.beginPath();g.rect(-240,-60+i*60-30,(w+20)*pr,60);g.clip();T(r,-230,-60+i*60,sz,'#1C3D93',FAM.text,'400','left',1,{st:'italic',kind:'deco'});g.restore();if(pr<1)C_sparkle(-230+w*pr,-60+i*60+8,11,0.95,{col:'255,214,120',edge:'rgba(150,100,20,0.5)'})});
 const r=RNG(15);for(let i=0;i<6;i++){const td=c.t0+0.15+i*0.17,bx=-220+r()*440,by=-120+r()*240,bs=5+r()*5;if(t<td)continue;const k=eo(cl((t-td)/0.12));g.fillStyle='rgba(90,140,210,0.16)';g.beginPath();g.ellipse(bx,by+bs*0.3,bs*1.6*k,bs*1.1*k,0,0,7);g.fill();B_drop(bx,by,bs*k,1,false)}
 g.restore();grain(t,0.04)});

// "creation": the word forms large over a rainbow and sparkles
C_scene('a2_creation_word',(t,c)=>{Wbg(t,1,{moon:false,la:0.2});const z=1+0.04*c.k;C_rainbow(360,760,330,eo(cl(c.k/1.1)),{a:0.42});
 g.save();g.translate(W/2,540);g.scale(z,z);g.save();g.globalCompositeOperation='screen';glow(0,0,300,'200,230,255',0.35,0.35);g.restore();
 for(let i=0;i<9;i++){const a=i/9*6.28+t*0.3,d=250+40*Math.sin(i*2.3+t),s=7+6*hash(i*7.7);C_sparkle(Math.cos(a)*d,Math.sin(a)*d*0.55,s,cl(c.k*3-i*0.2)*(0.6+0.4*Math.sin(t*4+i)),{col:i%3?'200,236,255':'255,226,150'})}
 rise('creation',0,0,150,'#FFF8E6',c.t0,t,FAM.display,'400',0.04,'center',{st:'italic',stroke:['#14245A',5],shadow:[24,0.4]});g.restore();grain(t,0.04)});

// L3 as type: "I am the Poem of Earth, / said the voice of the rain," under a friendly raining cloud
C_scene('a2_lyrical2',(t,c)=>{Wbg(t,1,{moon:false});g.save();g.globalCompositeOperation='screen';glow(W/2,560,340,'200,225,255',0.28,0.3);g.restore();
 C_cloud(360+Math.sin(t*0.5)*8,318,320,{t,seed:7,rain:1,fall:120,outline:true,ow:2.5});
 rise('I am the Poem of Earth,',W/2,500,54,'#FFF8EA',c.t0,t,FAM.display,'400',0.02,'center',{st:'italic',stroke:['#13204E',4],shadow:[16,0.4]});
 rise('said the voice of the rain,',W/2,590,54,'#FFF8EA',c.t0+0.3,t,FAM.display,'400',0.02,'center',{st:'italic',stroke:['#13204E',4],shadow:[16,0.4]});
 logPoem(2,POEM[2],[...Array(10).keys()]);grain(t,0.04)});

// "Eternal": a glossy ring of water (the cycle) with the word written round it; the word drops in at the centre
C_scene('a3_eternal_word',(t,c)=>{Wbg(t,0.95,{moon:false,la:0.18});const te=WT('eternal',79.9),ink=C_inkFor(t),R=220,cx=360,cy=540,rot=c.k*0.35;
 g.save();g.lineCap='round';g.strokeStyle='rgba(10,40,110,0.22)';g.lineWidth=34;g.beginPath();g.arc(cx+4,cy+8,R,0,7);g.stroke();
 const cg=g.createConicGradient(rot,cx,cy);[['#2F7FE0',0],['#2FC6D8',0.25],['#5ACB6A',0.5],['#F2C14E',0.72],['#2F7FE0',1]].forEach(([col,s])=>cg.addColorStop(s,col));g.strokeStyle=cg;g.lineWidth=30;g.beginPath();g.arc(cx,cy,R,0,7);g.stroke();
 g.strokeStyle='rgba(255,255,255,0.65)';g.lineWidth=5;g.beginPath();g.arc(cx,cy,R-7,Math.PI*1.05+rot,Math.PI*1.55+rot);g.stroke();g.strokeStyle='rgba(10,40,110,0.35)';g.lineWidth=2;g.beginPath();g.arc(cx,cy,R+15,0,7);g.arc(cx,cy,R-15,0,7);g.stroke();g.restore();
 const a=-Math.PI/2+t*1.4;B_drop(cx+Math.cos(a)*R,cy+Math.sin(a)*R,16,1,false);
 const s='ETERNAL · ETERNAL · ',p=eio(cl((t-te+0.1)/0.9));g.save();g.translate(cx,cy);g.rotate(-Math.PI/2+c.k*0.3);g.font=F(30,FAM.text,'600','normal');g.textAlign='center';g.textBaseline='middle';g.lineJoin='round';const n=Math.floor(s.length*p);
 for(let i=0;i<n;i++){const aa=i/s.length*Math.PI*2;g.save();g.rotate(aa);if(!QA.hideText){g.lineWidth=4;g.strokeStyle=ink.st[0];g.strokeText(s[i],0,-268);g.fillStyle=ink.fg;g.fillText(s[i],0,-268)}g.restore()}g.restore();
 C_dropIn('Eternal',W/2,550,96,ink.keyCol,te,t,{grad:ink.key,stroke:ink.kst,shadow:ink.sh,stag:0.03});grain(t,0.04)});

// kinetic type: "the most / IMPORTANT / thing"
C_scene('a4_important',(t,c)=>{C_kinBg(t,{ly:590});Wkin(t,c,[['the','the',0],['most','most',0],['IMPORTANT','important',1],['thing','thing',0]],[[0,1],[2],[3]],{big:96,bg:false})});
// "Why?" slams in
C_scene('a5_why',(t,c)=>{C_kinBg(t,{ly:560,seed:12});Wslam(t,c,'Why?','why',{size:230})});
