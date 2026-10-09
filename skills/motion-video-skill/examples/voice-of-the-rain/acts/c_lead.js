// acts/c_lead.js — lead's colour-world versions of the scenes the subject artists did not reach (loaded last).
// a4_pour (X top panel): raining cartoon clouds pour onto the land, grass greens, brown roots drink (water core climbs).
// a4_village (C): a sleepy cartoon village in the rain at first light (wether_image mood): coloured houses, warm windows, round trees, puddles.
// a5_fame (C, cold overcast): a silver spotlight cone on a little stage; a cold silver ring flares on 'fame' (it becomes the crown).
{const S=SCENES;
const CL_cache={};
function CL_canvas(key,w,h,fn){if(CL_cache[key])return CL_cache[key];const c=mkC(Math.ceil(w*SC),Math.ceil(h*SC)),x=c.getContext('2d'),pg=g;g=x;try{x.setTransform(SC,0,0,SC,0,0);x.lineCap='round';x.lineJoin='round';fn()}finally{g=pg}return CL_cache[key]=c}

S.a4_pour=(t,c)=>{const tr=WT('pouring',126.2),k=eo(cl(c.k/0.9)),gr=eo(cl((t-tr+0.3)/0.8));
 Wbg(t,0.9,{moon:false,hills:false,ly:560});
 // two raining cartoon clouds pouring over the field
 C_cloud(230+6*Math.sin(t*0.7),345,300,{seed:3,rain:0.9,t});C_cloud(500-5*Math.sin(t*0.6),320,260,{seed:8,rain:0.9,t});
 B_rain(t,120,59,1100,90,0.75,0);
 // the land: dry tan grass turning green as the rain lands; soil cross-section with roots below
 const GY=600;Wground(t,GY);g.save();g.globalAlpha*=0.55*(1-gr);g.fillStyle='#C9A86A';g.fillRect(0,GY-14,W,22);g.restore();
 for(let i=0;i<7;i++)C_ripples(60+i*100,GY-4,t,c.t0+0.12+i*0.13,{n:2,sc:0.45,flat:0.3,a:0.6});
 C_roots(360,GY+10,0.62,1,{seed:12,t,lit:k*0.9});
 for(let i=0;i<5;i++){const x=110+i*125,p=cl((t-tr-0.05*i)/0.5);if(p>0)C_flower(x,GY-6,13,{p,col:i%2?'#B07CE0':'#F28CB8',stem:16})}
 grain(t,0.04)};

const CL_HOUSES=[[40,92,120,'#F2B35E','#C2463A'],[150,84,104,'#8EC5E8','#3E6FA8'],[248,104,136,'#F6E2A6','#B5533A'],[366,88,112,'#B9D98A','#6A4A8C'],[468,98,128,'#F4A5A0','#2F6E8E'],[580,104,116,'#E9C78E','#A33B3B']];
function CL_village(){return CL_canvas('village',720,420,()=>{const base=330;
 for(const [x,w,h,wall,roof] of CL_HOUSES){const y=base-h;
  g.fillStyle='rgba(30,40,60,0.18)';g.fillRect(x+6,y+8,w,h);
  g.fillStyle=wall;g.fillRect(x,y,w,h);g.strokeStyle='rgba(40,40,60,0.55)';g.lineWidth=2.5;g.strokeRect(x,y,w,h);
  g.fillStyle=roof;g.beginPath();g.moveTo(x-12,y+4);g.lineTo(x+w/2,y-w*0.55);g.lineTo(x+w+12,y+4);g.closePath();g.fill();g.stroke();
  g.fillStyle='rgba(255,255,255,0.18)';g.beginPath();g.moveTo(x-6,y);g.lineTo(x+w/2,y-w*0.5);g.lineTo(x+w/2,y-w*0.38);g.lineTo(x+4,y);g.fill();
  const dw=w*0.24;g.fillStyle='#6B4430';g.fillRect(x+w*0.58,base-h*0.42,dw,h*0.42);
  g.fillStyle='#FFE7A0';for(const [wx,wy] of [[x+w*0.16,y+h*0.22],[x+w*0.16,y+h*0.58]]){g.fillRect(wx,wy,w*0.26,h*0.2);g.strokeRect(wx,wy,w*0.26,h*0.2)}}})}
S.a4_village=(t,c)=>{const td=WT('duty',138.6);
 Wbg(t,1,{moon:false,hills:false,ly:520,la:0.25});
 C_hills(t,640,{n:2,amp:60,seed:21,trees:true});
 // houses with warm lamp glow in the windows; a soft morning light pool
 g.save();g.globalCompositeOperation='lighter';glow(360,640,420,'255,214,150',0.18,0.4);g.restore();
 g.drawImage(CL_village(),0,370,720,420);
 for(const [x,w,h] of CL_HOUSES){const k=0.55+0.45*Math.sin(t*1.7+x);g.save();g.globalCompositeOperation='lighter';glow(x+w*0.29,700-h+h*0.32,26,'255,210,120',0.25*k,0.6);g.restore()}
 for(let i=0;i<5;i++)C_miniTree(20+i*170,710,1.5+0.3*(i%2),t,30+i);
 // wet street with puddles (kept calm and low; the caption sits at y~806)
 g.fillStyle='#9AA3AE';g.fillRect(0,704,W,26);g.fillStyle='rgba(255,255,255,0.25)';g.fillRect(0,704,W,3);
 g.fillStyle='#C9B58E';g.beginPath();g.moveTo(300,730);g.bezierCurveTo(280,860,420,940,330,1280);g.lineTo(520,1280);g.bezierCurveTo(560,940,420,860,400,730);g.closePath();g.fill();
 C_puddle(380,1010,150,24,t,{drops:3,seed:2});C_puddle(150,960,150,22,t,{drops:2,seed:5});
 C_bush(40,1290,260,{t,seed:3,n:6});C_bush(690,1280,250,{t,seed:6,n:6});for(let i=0;i<9;i++)if(i<3||i>5)C_flower(40+i*80,960+((i*37)%70),15,{p:1,col:i%2?'#B07CE0':'#F28CB8',stem:22});
 C_cloud(170,290,320,{seed:4,rain:0.8,t});C_cloud(520,250,300,{seed:9,rain:0.8,t});
 B_rain(t,110,67,900,80,0.6,1.0);
 const s=eo(cl((t-td)/0.4));if(s>0)C_sparkle(360,540,22*s,0.9*s,{col:'255,226,150',edge:'#8a6a2a'});
 grain(t,0.04)};

S.a5_fame=(t,c)=>{const tf=WT('fame',148.46),u=eo(cl((t-tf+0.15)/0.45)),b=cl((t-tf-0.2)/0.6);
 Wbg(t,0.9,{moon:false,hills:false,la:0.05});C_hills(t,1060,{n:2,amp:50,seed:44});
 // spotlight cone from above onto a small round stage
 g.save();const cg=g.createLinearGradient(0,150,0,980);cg.addColorStop(0,'rgba(236,240,246,0.75)');cg.addColorStop(1,'rgba(236,240,246,0.12)');g.fillStyle=cg;
 g.beginPath();g.moveTo(330,150);g.lineTo(390,150);g.lineTo(560,1012);g.lineTo(160,1012);g.closePath();g.globalAlpha*=0.35+0.55*u;g.fill();g.restore();
 g.fillStyle='#8A93A6';g.beginPath();g.ellipse(360,1027,230,36,0,0,7);g.fill();g.fillStyle='#B7BDC8';g.beginPath();g.ellipse(360,1014,230,34,0,0,7);g.fill();
 g.strokeStyle='rgba(60,66,80,0.6)';g.lineWidth=3;g.beginPath();g.ellipse(360,1014,230,34,0,0,7);g.stroke();
 {const x=360,y=1010,k=u;g.save();g.fillStyle='rgba(30,36,50,0.25)';g.beginPath();g.ellipse(x,y+4,46,9,0,0,7);g.fill();g.lineCap='round';g.strokeStyle='#2E3A55';g.lineWidth=13;
  g.beginPath();g.moveTo(x-12,y);g.lineTo(x-8,y-62);g.moveTo(x+12,y);g.lineTo(x+8,y-62);g.stroke();g.fillStyle='#4A5A7C';g.beginPath();g.roundRect(x-24,y-128,48,72,14);g.fill();
  g.strokeStyle='#4A5A7C';g.lineWidth=11;g.beginPath();g.moveTo(x-20,y-118);g.lineTo(x-46,y-118-60*k);g.moveTo(x+20,y-118);g.lineTo(x+46,y-118-60*k);g.stroke();
  g.fillStyle='#E8C4A0';g.beginPath();g.arc(x,y-150,24,0,7);g.fill();g.fillStyle='#3A2A22';g.beginPath();g.arc(x,y-158,24,Math.PI,0);g.fill();g.restore()}
 // the cold silver ring flares on 'fame' (no warm tint: pride is cold)
 const R=150*(0.6+0.4*u);g.save();g.globalAlpha*=u;g.lineWidth=18;const rg=g.createLinearGradient(360-R,500-R,360+R,500+R);rg.addColorStop(0,'#E9EDF3');rg.addColorStop(0.5,'#8A93A6');rg.addColorStop(1,'#C9CED8');
 g.strokeStyle='rgba(40,46,60,0.55)';g.lineWidth=24;g.beginPath();g.ellipse(360,500,R,R*0.32,0,0,7);g.stroke();g.strokeStyle=rg;g.lineWidth=16;g.beginPath();g.ellipse(360,500,R,R*0.32,0,0,7);g.stroke();g.restore();
 if(b>0){const r=RNG(41);for(let i=0;i<14;i++){const a=r()*6.28,d=(R+20+r()*120)*eo(b);C_sparkle(360+Math.cos(a)*d,500+Math.sin(a)*d*0.45,6+r()*8,(1-b*0.6),{col:'226,232,242',edge:'#5a6274'})}}
 grain(t,0.05)};
}
