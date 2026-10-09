// acts/c_sky.js (colour world) — THE SKY, WEATHER & CYCLE artist. Loaded after every act file and color.js; reassigns
// SCENES.<name> for act III's cycle (vapour, clouds, melt, rain, enso, the cycle diagram, heaven, the roller coaster, the
// valley) and act IV's weather shots (pour, tree rings, thousand years, duty, village).
// Look (references wether_image / raindrop4 / raindrop3 / tree_root_2): bright friendly 2D illustration. Puffy cartoon
// cumulus lit from above with a thin same-hue outline, vapour as friendly white wisps with a soft blue edge, cartoon teardrop
// rain, a glossy water ring for the cycle, a red/yellow coaster over green hills with happy riders, a rainy cartoon village.
// Every frame is pure in t (RNG / hash / vnoise only); static art is cached in canvases. Every top-level name starts CS_.
'use strict';
{const S=SCENES;

// =====================================================================================================================
// 0. helpers
// =====================================================================================================================
const CS_C={};
// a cached canvas drawn in logical units (x1.5), with the global g pointed at it while the painter runs
function CS_cache(key,w,h,fn){if(CS_C[key])return CS_C[key];const c=mkC(Math.ceil(w*1.5),Math.ceil(h*1.5)),x=c.getContext('2d');x.scale(1.5,1.5);const pg=g;g=x;try{fn(x,w,h)}finally{g=pg}return CS_C[key]=c}
const CS_up=(t,t0,d)=>eo(cl((t-t0)/d));
const CS_NAVY='#13204E';

// cartoon teardrop (raindrop4): flat friendly blue, soft gradient, darker same-hue edge, white highlight
function CS_tear(x,y,s,a=1,col='#5B8FEA'){if(a<=0.01||s<=0.3)return;const c=C_col(col);g.save();g.globalAlpha*=a;
 g.beginPath();g.moveTo(x,y-s*1.3);g.bezierCurveTo(x+s*.95,y-s*.12,x+s*.82,y+s*.85,x,y+s*.85);g.bezierCurveTo(x-s*.82,y+s*.85,x-s*.95,y-s*.12,x,y-s*1.3);g.closePath();
 const gr=g.createLinearGradient(x-s,y-s,x+s,y+s);gr.addColorStop(0,C_c(C_mx(c,C_WH,0.38)));gr.addColorStop(1,C_c(C_mx(c,[10,30,90],0.22)));g.fillStyle=gr;g.fill();
 g.strokeStyle=C_c(C_mx(c,[10,30,90],0.5),0.75);g.lineWidth=Math.max(0.8,s*0.12);g.stroke();
 g.fillStyle='rgba(255,255,255,0.85)';g.beginPath();g.ellipse(x-s*0.32,y+s*0.06,s*0.13,s*0.3,0.35,0,7);g.fill();g.restore()}
// a field of falling cartoon teardrops between y0 and y1
function CS_tearRain(t,x0,x1,y0,y1,n,seed,o={}){const r=RNG(seed),L=Math.max(40,y1-y0),sl=o.slant??0.08,col=o.col||'#5B8FEA';
 for(let i=0;i<n;i++){const px=x0+r()*(x1-x0),ph=r(),v=(o.speed??520)*(0.8+r()*0.45),s=(o.s??6)*(0.7+r()*0.6),yy=(t*v+ph*L)%L,al=cl(Math.min(yy/50,(L-yy)/70))*(o.a??1);CS_tear(px+yy*sl,y0+yy,s,al,col)}}

// =====================================================================================================================
// 1. puffy cumulus: a union of puffs (one outline), shade body, mid and lit layers offset up-left, watercolour grain,
//    white rim on the top puffs, flat base. Puff sets can be merged (clouds combining) because it is one union.
// =====================================================================================================================
const CS_CLR={day:{lit:'#FFFFFF',mid:'#E4EDF9',shade:'#B3C3DE',edge:'#7C91BA'},rain:{lit:'#E8EEF7',mid:'#BBC8DD',shade:'#8395B8',edge:'#4C5E88'},
 warm:{lit:'#FFFDF6',mid:'#FFEBD2',shade:'#E9C3B4',edge:'#B98B8B'},dusk:{lit:'#FFE9EF',mid:'#F4CFE0',shade:'#B9A6D6',edge:'#7D6BA8'}};
function CS_puffCloud(P,base,o={}){const a=o.a??1;if(a<=0.01||!P.length)return;const lit=C_col(o.lit||'#FFFFFF'),mid=C_col(o.mid||'#E4EDF9'),sh=C_col(o.shade||'#B3C3DE'),ed=C_col(o.edge||'#7C91BA'),ow=o.ow??3;
 let x0=1e9,x1=-1e9,top=1e9,bx0=1e9,bx1=-1e9,rb=0,nb=0;const U=new Path2D(),O=new Path2D();
 for(const [x,y,R] of P){C_circ(U,x,y,R);C_circ(O,x,y,R+ow);x0=Math.min(x0,x-R);x1=Math.max(x1,x+R);top=Math.min(top,y-R);if(y+R>base-4){bx0=Math.min(bx0,x);bx1=Math.max(bx1,x);rb+=R;nb++}}
 const flat=o.flat!==false&&nb>1;if(flat){const h=rb/nb*0.9;U.rect(bx0,base-h,bx1-bx0,h);O.rect(bx0,base-h-ow,bx1-bx0,h+ow)}
 g.save();g.globalAlpha*=a;if(flat){g.beginPath();g.rect(-W*2,-H*2,W*5,base+H*2);g.clip()}
 g.fillStyle=C_c(ed);g.fill(O);g.fillStyle=C_c(sh);g.fill(U);
 g.save();g.clip(U);const ht=Math.max(20,(flat?base:top+400)-top);
 const dt=o.detail??1,mp=new Path2D(),lp=new Path2D();for(const [x,y,R] of P){C_circ(mp,x-R*0.05,y-R*0.11,R*0.9);C_circ(lp,x-R*0.13*dt,y-R*(0.08+0.14*dt),R*(0.86-0.14*dt))}
 if(dt>0.3){g.fillStyle=C_c(mid);g.fill(mp)}
 const lg=g.createLinearGradient(0,top,0,top+ht);lg.addColorStop(0,C_c(lit));lg.addColorStop(0.7,C_c(lit));lg.addColorStop(1,C_c(C_mx(lit,mid,0.6)));g.fillStyle=lg;g.fill(lp);
 if(flat){const bg=g.createLinearGradient(0,base-ht*0.32,0,base);bg.addColorStop(0,C_c(sh,0));bg.addColorStop(1,C_c(C_mx(sh,ed,0.25),0.85));g.fillStyle=bg;g.fillRect(x0-10,base-ht*0.32,x1-x0+20,ht*0.32+2)}
 g.globalCompositeOperation='soft-light';g.globalAlpha*=o.wash??0.35;g.drawImage(C_WASH,x0-30,top-30,x1-x0+60,ht+60);g.restore();
 g.strokeStyle=`rgba(255,255,255,${0.75*(o.rim??1)})`;g.lineWidth=2.4;g.lineCap='round';g.beginPath();for(const [x,y,R] of P)if(y<top+ht*(o.detail??1)*0.55){g.moveTo(x+Math.cos(3.55)*R*0.9,y+Math.sin(3.55)*R*0.9);g.arc(x,y,R*0.9,3.55,4.35)}g.stroke();
 g.fillStyle=`rgba(255,255,255,${0.45*(o.rim??1)})`;g.beginPath();for(const [x,y,R] of P)if(y<top+ht*0.4){g.moveTo(x-R*0.3+R*0.16,y-R*0.48);g.ellipse(x-R*0.3,y-R*0.48,R*0.16,R*0.08,-0.5,0,7)}g.fill();
 if(flat){g.strokeStyle=C_c(ed);g.lineWidth=ow;g.beginPath();g.moveTo(bx0,base-ow/2);g.lineTo(bx1,base-ow/2);g.stroke()}
 g.restore()}
const CS_CG={};
function CS_cumGeo(seed){if(CS_CG[seed])return CS_CG[seed];const r=RNG(seed*733+11),P=[];
 const lean=(r()-0.5)*0.16,row=(n,y,xa,xb,R0,R1,tier)=>{for(let i=0;i<n;i++){const u=n===1?0.5:i/(n-1);P.push({x:lerp(xa,xb,u)+(r()-0.5)*0.07+lean*tier,y:y+(r()-0.5)*0.05,R:lerp(R0,R1,r()),ph:r()*6.28,f:0.5+r()*0.7,tier})}};
 row(2,-1.0,-0.14,0.2,0.2,0.25,3);row(4,-0.74,-0.42,0.44,0.21,0.28,2);row(6,-0.44,-0.68,0.66,0.21,0.29,1);row(8,-0.15,-0.86,0.86,0.16,0.23,0);
 return CS_CG[seed]=P}
// puffs of a cumulus whose flat base sits at (x,y), about w wide; bill = billow (puffs swell, towers lift); morph = shape drift
function CS_cumPuffs(x,y,w,t,o={}){const G=CS_cumGeo(o.seed||1),k=w/2,bill=o.bill||0,sy=o.sy??1,mo=o.morph??1;
 return G.map((p,i)=>{const lift=bill*0.1*p.tier,R=p.R*k*(1+0.045*mo*Math.sin(t*p.f*1.3+p.ph)+bill*(0.06+0.04*Math.sin(i*2.1)));
  return [x+(p.x+0.02*mo*Math.sin(t*0.5*p.f+p.ph))*k,y+(p.y-lift)*k*sy+0.015*mo*k*Math.cos(t*0.7*p.f+p.ph),R]})}
function CS_cumulus(x,y,w,t,o={}){CS_puffCloud(CS_cumPuffs(x,y,w,t,o),y,{...(CS_CLR[o.pal||'day']),...o})}
// melting base: rounded drips hang from the base and let go of cartoon drops
function CS_drips(x,base,w,t,m,o={}){if(m<=0.01)return;const r=RNG(o.seed||5),n=o.n||9,k=w/2,sh=C_col(o.shade||'#8395B8'),ed=C_col(o.edge||'#4C5E88');g.save();g.lineJoin='round';
 for(let i=0;i<n;i++){const px=x+lerp(-0.72,0.72,i/(n-1))*k+(r()-0.5)*24,len=m*(14+r()*40),wd=11+r()*8,ph=r(),fall=o.fall??360;
  const P=new Path2D(),bw=wd*0.62,by=base+len;P.moveTo(px-wd*1.25,base-8);P.bezierCurveTo(px-wd*0.7,base-2,px-bw*0.6,by-len*0.45,px-bw,by);P.arc(px,by,bw,Math.PI,0,true);P.bezierCurveTo(px+bw*0.6,by-len*0.45,px+wd*0.7,base-2,px+wd*1.25,base-8);P.closePath();
  g.lineWidth=2.5;g.strokeStyle=C_c(ed);g.stroke(P);g.fillStyle=C_c(sh);g.fill(P);
  g.fillStyle='rgba(255,255,255,0.4)';g.beginPath();g.ellipse(px-bw*0.35,by-bw*0.25,bw*0.22,bw*0.32,0.3,0,7);g.fill();
  if(m>0.35){const sp=1.25+r()*0.5;for(let j=0;j<2;j++){const u=(t*sp+ph+j*0.5)%1;CS_tear(px+u*fall*0.06,base+len+12+u*fall,8.5+r()*2.5,cl((m-0.35)/0.3)*cl(Math.min(u*12,(1-u)*5)),o.dropCol||'#5B8FEA')}}}
 g.restore()}

// =====================================================================================================================
// 2. vapour: friendly white wisps (tapered wavy ribbons with a soft blue edge so they read on a day sky) and soft puffs
// =====================================================================================================================
function CS_wisp(x,y,L,t,o={}){const a=o.a??1;if(a<=0.01||L<6)return;const ph=o.ph||0,wd=(o.w??0.1)*L,N=18,amp=(o.amp??0.12)*L,dir=o.dir||1,sp=o.sp??1.7;
 const pts=[];for(let i=0;i<=N;i++){const u=i/N;pts.push([x+Math.sin(u*4.4+t*sp+ph)*amp*(0.2+u)*dir+(o.lean||0)*u*L,y-u*L])}
 const Lf=[],Rt=[];for(let i=0;i<=N;i++){const u=i/N,p=pts[i],q=pts[Math.min(N,i+1)],s=pts[Math.max(0,i-1)],dx=q[0]-s[0],dy=q[1]-s[1],l=Math.hypot(dx,dy)||1,w=wd*Math.pow(Math.sin(Math.PI*Math.min(0.999,0.03+u*0.97)),0.75)*(1-0.3*u);Lf.push([p[0]-dy/l*w,p[1]+dx/l*w]);Rt.push([p[0]+dy/l*w,p[1]-dx/l*w])}
 const P=new Path2D();Lf.forEach(([px,py],i)=>i?P.lineTo(px,py):P.moveTo(px,py));for(let i=N;i>=0;i--)P.lineTo(Rt[i][0],Rt[i][1]);P.closePath();
 const ea=a*(o.edge??1),gr=g.createLinearGradient(0,y,0,y-L);gr.addColorStop(0,'rgba(255,255,255,0)');gr.addColorStop(0.2,`rgba(255,255,255,${0.95*a})`);gr.addColorStop(0.72,`rgba(242,249,255,${0.85*a})`);gr.addColorStop(1,'rgba(242,249,255,0)');
 const eg=g.createLinearGradient(0,y,0,y-L);eg.addColorStop(0,'rgba(84,134,212,0)');eg.addColorStop(0.22,`rgba(84,134,212,${0.42*ea})`);eg.addColorStop(0.75,`rgba(84,134,212,${0.28*ea})`);eg.addColorStop(1,'rgba(84,134,212,0)');
 g.save();glow(x+(o.lean||0)*L*0.5,y-L*0.5,L*0.42,'255,255,255',0.3*a,0.5);g.lineJoin='round';g.strokeStyle=eg;g.lineWidth=1.7;g.stroke(P);g.fillStyle=gr;g.fill(P);
 // a soft inner sheen down one side
 g.strokeStyle=`rgba(255,255,255,${0.5*a})`;g.lineWidth=Math.max(1,wd*0.25);g.lineCap='round';g.beginPath();for(let i=3;i<=N-4;i++){const p=Lf[i],q=pts[i];i===3?g.moveTo(lerp(q[0],p[0],0.5),lerp(q[1],p[1],0.5)):g.lineTo(lerp(q[0],p[0],0.5),lerp(q[1],p[1],0.5))}g.stroke();
 // the curl at the top
 if(o.curl===true||(o.curl!==false&&hash(ph*3.7+1.3)>0.55)){const tp=pts[N-2],cr=wd*0.62,cd=dir*(Math.sin(t*sp+ph+4.4)>0?1:-1);g.strokeStyle=`rgba(255,255,255,${0.55*a})`;g.lineWidth=wd*0.42;g.beginPath();g.arc(tp[0]+cr*cd,tp[1],cr,cd>0?Math.PI:0,cd>0?Math.PI*2.2:-Math.PI*1.2,cd<0);g.stroke()}
 g.restore()}
function CS_puff(x,y,r,a=1){if(a<=0.01||r<=1)return;g.save();g.globalAlpha*=a;const gr=g.createRadialGradient(x-r*0.3,y-r*0.35,r*0.1,x,y,r);gr.addColorStop(0,'rgba(255,255,255,0.98)');gr.addColorStop(0.7,'rgba(236,245,255,0.9)');gr.addColorStop(1,'rgba(176,204,240,0.75)');
 g.fillStyle=gr;g.beginPath();g.arc(x,y,r,0,7);g.fill();g.strokeStyle='rgba(84,134,212,0.45)';g.lineWidth=1.6;g.stroke();g.restore()}
// a band of wisps rising forever from y=yb over a height hgt
function CS_vapRise(t,x0,x1,yb,hgt,n,seed,a=1,o={}){if(a<=0.01)return;const r=RNG(seed);for(let i=0;i<n;i++){const x=x0+(i+0.1+r()*0.8)/n*(x1-x0),sp=(o.sp??0.24)*(0.75+r()*0.5),ph=r(),u=(t*sp+ph)%1,L=hgt*(0.28+0.3*r())*(0.55+0.7*u),y=yb-u*hgt*0.62;
 CS_wisp(x+Math.sin(t*0.5+i*1.3)*12,y,L,t,{a:a*Math.pow(Math.sin(Math.PI*u),0.8),ph:i*1.7,w:o.w??0.1,amp:o.amp??0.13,dir:i%2?1:-1,edge:o.edge})}}

// =====================================================================================================================
// 3. the sea with a tilting camera (the colour world's sky + painterly hills + GL water, no vignette so it can be moved)
// =====================================================================================================================
function CS_sea(t,o={}){const S=CSKY(t),HZ=452+(o.off??320),L=C_lightPos(t,o);
 C_sky(t,{hz:HZ,m:o.m??1,moon:false,sun:!!o.sun,raysA:0.8,clouds:o.clouds,rain:o.rain});if(o.ext){g.save();g.globalCompositeOperation='soft-light';g.globalAlpha=0.5;g.save();g.scale(1,-1);g.drawImage(C_WASH,-90,90,W+180,H+180);g.restore();g.restore()}
 const hp={n:2,amp:30,peak:false,seed:o.hseed||2,gap:12,trees:0,haze:0.5,bot:HZ+40,cols:C_HILLCOL};C_hills(t,HZ+2,hp);
 g.drawImage(GL.run('C_sea',C_SEA_FS,{T:t,HZ,RAIN:cl(S.rain*0.7+0.1,0,0.9),LA:Math.max(S.sun,0.28)*0.6,AMP:o.amp??1,RING:o.rings??1,SKT:C_n3(S.top),SKM:C_n3(S.mid),SKH:C_n3(S.hz),DEEP:C_n3(S.deep),SURF:C_n3(S.surf),LC:C_n3(C_mx(S.lc,C_WH,0.3)),LP:[L.x,L.y]},{},PW,PH),0,0,W,H);
 C_hills(t,HZ+2,{...hp,mirror:HZ,a:0.3});g.save();g.globalAlpha*=0.5;g.drawImage(sprite(C_s(C_mx(S.hz,C_WH,0.5)),0.3),-200,HZ-26,W+400,52);g.restore();return HZ}

// =====================================================================================================================
// 4. SCENES: vapour rises, the card of rising, clouds form, the cloud melts
// =====================================================================================================================
// b046 C "it goes UPWARD": the camera tilts up off the sea; friendly wisps lift off the water; a glossy drop rides up with them
S.a3_upward=(t,c)=>{const tu=WT('upward',57.7),k=eio(cl((t-tu+0.25)/1.35)),dy=k*540;
 g.save();g.translate(0,dy);const HZ=CS_sea(t,{off:320,ext:true});
 // high clouds that the vapour is going to feed (they swell as the wisps arrive)
 const sw=CS_up(t,tu+0.4,1.0);CS_cumulus(250,-150,300*(0.8+0.25*sw),t,{seed:3,bill:sw*0.6});CS_cumulus(560,-330,250*(0.8+0.2*sw),t,{seed:5,bill:sw*0.5});C_cloud(80,-430,170,{t,seed:9,a:0.9});
 CS_vapRise(t,-10,730,HZ+6,520,8,58,0.55+0.45*CS_up(t,tu-0.1,0.5),{sp:0.3});
 const r=RNG(61);for(let i=0;i<5;i++){const st=tu-0.1+i*0.09,u=t-st;if(u<=0)continue;const x=120+i*95+(r()-0.5)*40;CS_wisp(x,HZ+4-u*230,Math.min(320,60+u*260),t,{a:cl(u/0.25)*cl(1-(u-1.6)/0.6),ph:i*2.1,dir:i%2?1:-1,w:0.11})}
 const du=eo(cl((t-c.t0)/1.9));B_drop(360,lerp(HZ-30,HZ-470,du),26,1);
 g.restore();vignette(0.22,'20,50,110');grain(t,0.04)};

// b047 F card L4 over the sea: on "vapour" the glossy drop under the card breaks into wisps that rise past the card
S.a3_card_l4=(t,c)=>{const tv=WT('vapour',59.5);Wcard(t,c,{lines:[3],cy:300,bg:(t)=>{const HZ=CS_sea(t,{off:720});CS_vapRise(t,-20,740,HZ+4,420,10,47,0.75,{sp:0.22});C_vig(0.4,CSKY(t))},
 under:(t)=>{const u=t-tv,x=360,y=830;if(u<0){B_drop(x,y+Math.sin(t*2.2)*5,40,1);return}
  B_drop(x,y-u*30,40*(1-cl(u/0.45)),1-cl(u/0.45));
  for(let i=0;i<7;i++){const a0=(i-3)/3,uu=u-i*0.04;if(uu<=0)continue;CS_wisp(x+a0*(30+uu*70),y+20-uu*(150+40*Math.abs(a0)),Math.min(260,50+uu*190),t,{a:cl(uu/0.2),ph:i*1.9,dir:i%2?1:-1,w:0.12,lean:a0*0.15})}
  for(let i=0;i<9;i++){const uu=u-0.05*i;if(uu<=0||uu>1.4)continue;const a=i/9*6.28+0.3,d=40+uu*110;C_sparkle(x+Math.cos(a)*d,y-20+Math.sin(a)*d*0.7-uu*60,7+4*hash(i),Math.sin(Math.PI*uu/1.4),{col:'210,236,255',edge:'rgba(50,100,190,0.55)'})}},
 gloss:[['impalpable',tv-0.08]],glossW:['impalpable']})};

// b049 F card L5 "vaguely form'd": loose clouds keep re-forming round the card; on "loose" they drift apart, on "combination"
// the three come together into one cloud (one union of puffs, so they truly merge)
S.a3_card_l5=(t,c)=>{const tl=WT('loose',65),tc=WT('combination',65.4);Wcard(t,c,{lines:[4],cy:520,bg:(t)=>{Wbg(t,0.95,{moon:false,clouds:false});C_corners(t)},under:(t)=>{
  const lo=CS_up(t,tl,0.45),mg=eio(cl((t-tc)/0.9)),base=930;let P=[];
  [[150,0.95,11],[370,0.8,12],[590,1,13]].forEach(([x,s,sd],i)=>{const xx=lerp(x+(i-1)*30*lo,360+(i-1)*95,mg),w=lerp(250*s,230,mg)*(1-0.12*lo*(1-mg));P=P.concat(CS_cumPuffs(xx,base-(1-mg)*20*Math.sin(i*2+t),w,t,{seed:sd,morph:1.6+1.6*lo*(1-mg),bill:0.5*mg}))});
  CS_puffCloud(P,base,{...CS_CLR.day,detail:0.35});
  CS_puffCloud(CS_cumPuffs(140+Math.sin(t*0.4)*14,300,190,t,{seed:14,morph:2}),300,{...CS_CLR.day,a:0.92,detail:0.3});
  CS_puffCloud(CS_cumPuffs(600-Math.sin(t*0.35)*12,250,150,t,{seed:15,morph:2}),250,{...CS_CLR.day,a:0.85,detail:0.3});
  CS_vapRise(t,60,660,1180,300,6,49,0.6,{sp:0.2})}})};

// b050 C "it CLOUDS": one big cumulus lit from above (the sun behind its top), billowing up on "clouds"; vapour feeds its base
const CS_cloudSky=(t,dark=0)=>{Wbg(t,1+dark*0.35,{moon:false,clouds:false,la:0.08,ly:300});const S=CSKY(t);
 if(dark<0.9){C_sun(470,165,40,t,{a:0.9*(1-dark)});C_rays(470,165,{a:0.32*(1-dark),ang:Math.PI/2,spread:1.6,n:8,len:1300,t,col:C_s(C_mx(S.lc,C_WH,0.5)),w:0.05})}};
const CS_bigCloud=(t,bill,dark,melt)=>{const pal=dark>0?{lit:C_mx('#FFFFFF','#DCE3EF',dark),mid:C_mx('#E4EDF9','#AEBBD2',dark),shade:C_mx('#B3C3DE','#7486AA',dark),edge:C_mx('#7C91BA','#44567F',dark)}:CS_CLR.day;
 const P=CS_cumPuffs(360,640,690,t,{seed:21,bill,morph:1.2});CS_puffCloud(P,640,{...pal,rim:1-dark*0.6,detail:0.75});
 if(melt>0)CS_drips(360,640,690,t,melt,{n:7,seed:23,shade:pal.shade,edge:pal.edge,fall:430,dropCol:C_mx('#5B8FEA','#3F6FD0',dark)});return pal};
S.a3_clouds=(t,c)=>{const tc=WT('clouds',67.5),b=t-tc,bill=b>0?eo(cl(b/0.6))*0.75+0.25*Math.exp(-b*3)*Math.sin(b*14):0;
 CS_cloudSky(t,0);C_cloud(90+t*4%60,860,150,{t,seed:41,a:0.8});C_cloud(640-t*3%50,900,120,{t,seed:43,a:0.7});
 g.save();const z=1+0.03*cl(b/1.2);g.translate(360,520);g.scale(z,z);g.translate(-360,-520);
 CS_vapRise(t,170,550,1050,420,6,52,0.85,{sp:0.3});CS_bigCloud(t,bill,0,0);g.restore();grain(t,0.04)};
// b051 C "it MELTS": the same cloud darkens to a rain cloud; its base sags into drips that let go of drops; rain begins
S.a3_melt=(t,c)=>{const tm=WT('melts',69),m=eo(cl((t-tm+0.25)/0.8)),dark=0.35+0.65*eo(cl((t-c.t0)/0.9));
 CS_cloudSky(t,dark);if(m>0)B_rain(t,Math.round(10+70*m),41,900,80,0.5*m,0);
 g.save();g.translate(360,520);g.scale(1.03,1.03);g.translate(-360,-520);CS_bigCloud(t,1,dark,m);g.restore();
 CS_tearRain(t,80,640,690,1150,Math.round(26*m),77,{s:7,a:m,speed:560});grain(t,0.04)};

// =====================================================================================================================
// 5. rain on the dry earth (L6), the enso, ups and downs, the L10-11 card, the eternal ring
// =====================================================================================================================
// cracked earth seen in perspective (plates with gaps), dry (ochre, dark cracks) or wet (rich brown, sky-blue water in cracks)
const CS_EG=(()=>{const r=RNG(8083),NR=8,NC=8,G=[];for(let j=0;j<=NR;j++){const v=j/NR,row=[];for(let i=0;i<=NC;i++){const u=i/NC;
 row.push([360+(u-0.5)*720*(1.15+1.6*v)+(i>0&&i<NC?(r()-0.5)*90*(0.4+v):0)+(j%2)*40*(0.4+v),460*Math.pow(v,1.45)+(j>0&&j<NR?(r()-0.5)*30*(0.3+v):0)])}G.push(row)}
 const cells=[];for(let j=0;j<NR;j++)for(let i=0;i<NC;i++)cells.push({p:[G[j][i],G[j][i+1],G[j+1][i+1],G[j+1][i]],v:(j+0.5)/NR,h:r()});return cells})();
function CS_earthTex(wet){return CS_cache('earth'+(wet?'W':'D'),720,460,(x)=>{
 x.fillStyle=wet?'#3E7FC4':'#5A3518';x.fillRect(0,0,720,460);
 if(wet){const wg=x.createLinearGradient(0,0,0,460);wg.addColorStop(0,'#A9CDE6');wg.addColorStop(1,'#3E6E9E');x.fillStyle=wg;x.fillRect(0,0,720,460)}
 for(const c of CS_EG){const cx=c.p.reduce((a,q)=>a+q[0],0)/4,cy=c.p.reduce((a,q)=>a+q[1],0)/4,sh=wet?0.9:0.9;const P=new Path2D();c.p.forEach(([px,py],i)=>{const qx=cx+(px-cx)*sh,qy=cy+(py-cy)*sh;i?P.lineTo(qx,qy):P.moveTo(qx,qy)});P.closePath();
  let top,bot;if(wet){top=C_mx('#9A6A44','#7E5134',c.h);bot=C_mx('#5E3A22','#4A2C19',c.h)}else{top=C_mx('#F4C982','#E6AE62',c.h);bot=C_mx('#D2924C','#BD7C3C',c.h)}
  const y0=Math.min(...c.p.map(q=>q[1])),y1=Math.max(...c.p.map(q=>q[1])),gr=x.createLinearGradient(0,y0,0,y1);gr.addColorStop(0,C_c(top));gr.addColorStop(1,C_c(bot));x.fillStyle=gr;x.fill(P);
  x.strokeStyle=wet?'rgba(255,240,220,0.18)':'rgba(255,240,205,0.45)';x.lineWidth=1+1.5*c.v;x.stroke(P);
  if(wet){x.save();x.clip(P);x.fillStyle='rgba(200,230,255,0.18)';x.beginPath();x.ellipse(cx-10,cy-(y1-y0)*0.12,(y1-y0)*0.9,(y1-y0)*0.12,-0.05,0,7);x.fill();x.restore()}
  const r=RNG(Math.floor(c.h*9999));x.fillStyle=wet?'rgba(30,16,8,0.25)':'rgba(120,70,30,0.25)';for(let i=0;i<8;i++){x.beginPath();x.arc(cx+(r()-0.5)*(y1-y0)*2,cy+(r()-0.5)*(y1-y0)*0.6,0.8+r()*1.6*c.v+0.5,0,7);x.fill()}}
 const hz=x.createLinearGradient(0,0,0,70);hz.addColorStop(0,wet?'rgba(120,150,170,0.55)':'rgba(240,214,170,0.6)');hz.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=hz;x.fillRect(0,0,720,70)})}
// a little two-leaf sprout popping up (p 0..1)
function CS_sprout(x,y,s,p,t){if(p<=0.01)return;const k=spr(p*1.2,12,0.5),h=s*1.6*k;g.save();g.strokeStyle=C_c(C_tint('#3E9A3A',t));g.lineWidth=Math.max(1.4,s*0.14);g.lineCap='round';g.beginPath();g.moveTo(x,y);g.quadraticCurveTo(x+s*0.2,y-h*0.5,x,y-h);g.stroke();
 C_leaf(x,y-h,s*1.1*k,-Math.PI*0.82+Math.sin(t*2+x)*0.06,{t,w:0.42,col:'#6CCB4E',col2:'#2F8A3A'});C_leaf(x,y-h,s*1.0*k,-Math.PI*0.18+Math.sin(t*2.3+x)*0.06,{t,w:0.42,col:'#6CCB4E',col2:'#2F8A3A'});g.restore()}
// b052 F card L6: "lave the droughts" — rain bathes cracked ochre earth until it is rich and wet and sprouts; "atomies" — tiny
// motes glint and lift; on "rain" a big drop lands in the new puddle and rings out
S.a3_card_l6=(t,c)=>{const tl=70.38,ta=70.78,tr=WT('rain',72),EY=840;Wcard(t,c,{lines:[5],cy:350,bg:(t)=>{Wbg(t,1.02,{moon:false,hills:false,clouds:false,ly:300});C_cloud(130,250,230,{t,seed:61,rain:0.8,fall:160,outline:true,ow:2});C_cloud(600,205,190,{t,seed:62,rain:0.8,fall:150,outline:true,ow:2});C_hills(t,EY+10,{n:2,amp:44,trees:5,seed:6,gap:16})},
 under:(t,c)=>{const wet=eo(cl((t-tl+0.1)/1.3));
  g.drawImage(CS_earthTex(false),0,EY,720,460);if(wet>0){g.save();g.globalAlpha=wet;g.drawImage(CS_earthTex(true),0,EY,720,460);g.restore()}
  // the new puddle
  if(wet>0.05){g.save();g.globalAlpha=wet;C_puddle(360,1000,300*(0.5+0.5*wet),56*(0.5+0.5*wet),t,{drops:3,seed:12});g.restore()}
  const r=RNG(91);for(let i=0;i<9;i++){const x=40+i*80+r()*30,y=EY+50+r()*360;if(Math.abs(x-360)<170&&Math.abs(y-1000)<50)continue;CS_sprout(x,y,9+(y-EY)*0.035,cl((t-tl-0.5-r()*0.9)/0.6),t)}
  B_rain(t,Math.round(28+60*wet),43,820,80,0.5,0);CS_tearRain(t,30,690,300,EY+300,Math.round(10+14*wet),71,{s:6.5,speed:520});
  // rain bathing: little splashes on the plates
  for(let i=0;i<10;i++){const per=0.7+hash(i*3.1)*0.5,ph=hash(i*7.7)*per,age=(t+ph)%per,t0=t-age,x=40+hash(i*11.3+Math.floor((t+ph)/per))*640,y=EY+40+hash(i*5.9+Math.floor((t+ph)/per))*380;C_ripples(x,y,t,t0,{n:2,sc:0.35+0.6*(y-EY)/460,flat:0.28,life:0.7,a:0.5+0.5*wet,light:'255,250,235',dark:'90,60,30'})}
  // atomies: tiny motes glint and lift off the earth
  const u=t-ta;if(u>0){const r2=RNG(73);for(let i=0;i<34;i++){const x=20+r2()*680,y0=EY+20+r2()*300,life=1.4+r2()*1.2,d=r2()*0.5,uu=u-d;if(uu<=0||uu>life)continue;const k=Math.sin(Math.PI*uu/life),y=y0-uu*(40+r2()*90),xx=x+Math.sin(uu*3+i)*10;
   if(i%3)C_sparkle(xx,y,3+r2()*4,k,{col:'255,244,214',edge:'rgba(120,72,20,0.6)',rot:uu*2});else{g.fillStyle=`rgba(214,160,92,${0.8*k})`;g.beginPath();g.arc(xx,y,2+r2()*2,0,7);g.fill();g.strokeStyle=`rgba(110,64,24,${0.6*k})`;g.lineWidth=1;g.stroke()}}}
  // the drop that lands on "rain"
  const fy=1000;if(t<tr){const f=cl((t-(tr-0.7))/0.7);if(f>0)Wfall(360,lerp(560,fy,f*f),16,1)}else{C_splash(360,fy,t,tr,1.2);C_ripples(360,fy+4,t,tr,{n:4,sc:1.3,flat:0.2})}},
 gloss:[['lave',tl],['atomies',ta]],glossW:['lave','atomies']})};

// tapered glossy brush arc (water colours), from th1 to th2; thick in the middle, tapered tips, inner highlight, thin edge
const CS_WATER=[['#1B5FD0',0],['#2E9BEA',0.22],['#3CCBDA',0.45],['#56CFA2',0.62],['#2E9BEA',0.82],['#1B5FD0',1]];
function CS_brushArc(cx,cy,R,th1,th2,wd,o={}){const span=th2-th1;if(Math.abs(span)<0.02)return;const n=Math.max(8,Math.ceil(Math.abs(span)*R/7)),Lp=[],Rp=[],Mp=[],sd=o.seed||1,taper=o.taper??[1,1];
 for(let i=0;i<=n;i++){const u=i/n,a=th1+span*u,tp=Math.min(1,u/0.18*(taper[0]?1:99),(1-u)/0.18*(taper[1]?1:99)),w=wd*(0.3+0.7*Math.pow(Math.max(0,tp),0.5))*(1+0.07*Math.sin(u*19+sd)),rr=R+(vnoise(u*5+sd,sd)-0.5)*R*0.03;
  Lp.push([cx+Math.cos(a)*(rr+w/2),cy+Math.sin(a)*(rr+w/2)]);Rp.push([cx+Math.cos(a)*(rr-w/2),cy+Math.sin(a)*(rr-w/2)]);Mp.push([cx+Math.cos(a)*(rr-w*0.18),cy+Math.sin(a)*(rr-w*0.18),w])}
 const P=new Path2D();Lp.forEach(([x,y],i)=>i?P.lineTo(x,y):P.moveTo(x,y));for(let i=n;i>=0;i--)P.lineTo(Rp[i][0],Rp[i][1]);P.closePath();
 g.save();g.lineJoin='round';g.lineCap='round';g.save();g.translate(4,7);g.fillStyle='rgba(12,40,110,0.2)';g.fill(P);g.restore();
 const cg=g.createConicGradient(o.rot||0,cx,cy);(o.cols||CS_WATER).forEach(([col,s])=>cg.addColorStop(s,col));g.fillStyle=cg;g.fill(P);
 g.strokeStyle='rgba(10,36,100,0.55)';g.lineWidth=1.8;g.stroke(P);
 g.strokeStyle='rgba(255,255,255,0.6)';g.lineWidth=Math.max(1.5,wd*0.13);g.beginPath();for(let i=Math.floor(n*0.08);i<=Math.ceil(n*0.92);i++){const [x,y]=Mp[i];i===Math.floor(n*0.08)?g.moveTo(x,y):g.lineTo(x,y)}g.stroke();
 g.fillStyle='rgba(255,255,255,0.85)';for(let i=1;i<4;i++){const q=Mp[Math.floor(n*i/4)];g.beginPath();g.ellipse(q[0],q[1],q[2]*0.09,q[2]*0.05,Math.atan2(q[1]-cy,q[0]-cx)+Math.PI/2,0,7);g.fill()}
 g.restore()}
// the enso as two "parentheses" that swing round and join at the top; the gap at the bottom stays open
const CS_ENSO={cx:360,cy:540,R:350,gap:0.34};
function CS_enso(t,p,rot){const {cx,cy,R,gap}=CS_ENSO,a=0.5,ths=Math.PI/2+gap/2,J=Math.PI*1.5,the=ths+Math.PI*2-gap,k=eio(cl(p));if(p<=0)return;
 const l1=lerp(Math.PI-a,ths,k),l2=lerp(Math.PI+a,J+0.04,k),r1=lerp(Math.PI*2-a,J-0.04,k),r2=lerp(Math.PI*2+a,the,k),wd=lerp(22,34,k);
 const sw=cl(p*3);g.save();g.globalAlpha*=sw;CS_brushArc(cx,cy,R,l1,l2,wd,{seed:3,rot});CS_brushArc(cx,cy,R,r1,r2,wd,{seed:7,rot});g.restore();
 if(k>0.97){const j=cl((p-1)/0.4);if(j>0&&j<1){C_sparkle(cx,cy-R,22*Math.sin(Math.PI*j),1,{col:'210,240,255',edge:'rgba(30,80,170,0.6)'})}}
 return [the,ths]}
// b053 F card L10-L11: on "circular" the two brackets swing round the card and join into the enso; it closes through "journey"
S.a3_enso=(t,c)=>{const tc=WT('circular',73.5),tj=WT('journey',73.9);Wcard(t,c,{lines:[9,10],cy:540});
 const p=cl((t-(tc-0.35))/(tj+0.25-(tc-0.35)));CS_enso(t,t<tc-0.35?0.001+0.0:p,c.k*0.25);
 if(t<tc-0.35){g.save();g.globalAlpha*=cl(c.k/0.25);CS_brushArc(CS_ENSO.cx,CS_ENSO.cy,CS_ENSO.R,Math.PI-0.5,Math.PI+0.5,22,{seed:3});CS_brushArc(CS_ENSO.cx,CS_ENSO.cy,CS_ENSO.R,Math.PI*2-0.5,Math.PI*2+0.5,22,{seed:7});g.restore()}
 if(p>=1){const u=t-(tj+0.25);B_drop(CS_ENSO.cx+Math.cos(Math.PI*0.5+0.17)*CS_ENSO.R,CS_ENSO.cy+Math.sin(Math.PI*0.5+0.17)*CS_ENSO.R+Math.min(40,u*u*300),12,cl(1-u/0.8),false)}};

// b055 F card L10-L11: the enso stays round the card; a drop runs the ring and arrives back where it began on "origin"
S.a3_card_l1011=(t,c)=>{const to=WT('origin',77.4),{cx,cy,R,gap}=CS_ENSO;Wcard(t,c,{lines:[9,10],cy:540,over:(t,c,res)=>{const b=res.bounds['9:5'];if(!b)return;const u=t-to;if(u<0||u>1.2)return;const k=Math.sin(Math.PI*cl(u/1.2));
   g.save();g.globalCompositeOperation='screen';glow((b[0]+b[2])/2,(b[1]+b[3])/2,90,'150,210,255',0.5*k,0.35);g.restore();for(let i=0;i<5;i++){const a=i/5*6.28+u*2,d=(b[2]-b[0])*0.55+10;C_sparkle((b[0]+b[2])/2+Math.cos(a)*d,(b[1]+b[3])/2+Math.sin(a)*24,6+3*hash(i),k,{col:'200,236,255',edge:'rgba(30,80,170,0.6)'})}}});
 CS_enso(t,1.2,0.25+c.k*0.25);
 const ths=Math.PI/2+gap/2,the=ths+Math.PI*2-gap,u=cl((t-c.t0)/(to-c.t0)),a=lerp(ths,ths+Math.PI*2,eio(u));
 if(t<to+0.05)B_drop(cx+Math.cos(a)*R,cy+Math.sin(a)*R,15,1,false);else{const v=t-to;C_ripples(cx+Math.cos(ths)*R,cy+Math.sin(ths)*R+6,t,to,{n:3,sc:0.8,flat:0.3});for(let i=0;i<8;i++){const aa=i/8*6.28,d=20+v*120;C_sparkle(cx+Math.cos(ths)*R+Math.cos(aa)*d,cy+Math.sin(ths)*R+Math.sin(aa)*d*0.6,8,cl(1-v/0.8),{col:'200,236,255',edge:'rgba(30,80,170,0.6)'})}B_drop(cx+Math.cos(ths)*R,cy+Math.sin(ths)*R,15,1,false)}};

// b054 X "Ups and downs": the rain's path unrolls left to right as a wave; going up it is white vapour, coming down it is
// blue rain; clouds sit on the crests, a pool lies in the trough; a drop rides the tip
const CS_wy=x=>540-190*Math.cos(2*Math.PI*(x-150)/440);
S.a3_updown=(t,c)=>{Wbg(t,1,{moon:false,clouds:false,la:0.15,ly:540});const p=eio(cl((t-c.t0+0.05)/1.05)),xt=lerp(-90,820,p);
 // the pool in the trough and the crest clouds (they arrive as the curve reaches them)
 const pk=CS_up(t,c.t0+0.25,0.3);g.save();g.globalAlpha*=pk;const pg=g.createLinearGradient(0,742,0,800);pg.addColorStop(0,'#7EC3F2');pg.addColorStop(1,'#2C74CE');g.fillStyle=pg;g.beginPath();g.ellipse(370,768,150,30,0,0,7);g.fill();g.strokeStyle='rgba(16,60,140,0.5)';g.lineWidth=2;g.stroke();g.restore();
 C_ripples(370,768,t,c.t0+0.3,{n:3,sc:0.8,flat:0.2,a:pk});C_ripples(330,772,t,c.t0+0.75,{n:2,sc:0.6,flat:0.2,a:pk});
 [[150,c.t0+0.2,71],[590,c.t0+0.75,72]].forEach(([x,tt,sd])=>{const k=spr(t-tt,12,0.55);if(k>0)C_cloud(x,318,200*k,{t,seed:sd,outline:true,ow:2.2})});
 // the curve: white where it rises, blue where it falls
 g.save();g.lineCap='round';const N=120;let prev=null;for(let i=0;i<=N;i++){const x=lerp(-90,820,i/N);if(x>xt)break;const y=CS_wy(x),d=Math.sin(2*Math.PI*(x-150)/440),col=C_mx('#F7FBFF','#3D86E8',cl(0.5+0.5*d*1.4));if(prev){g.strokeStyle='rgba(16,48,120,0.35)';g.lineWidth=17;g.beginPath();g.moveTo(prev[0],prev[1]+3);g.lineTo(x,y+3);g.stroke();g.strokeStyle=C_c(col);g.lineWidth=13;g.beginPath();g.moveTo(prev[0],prev[1]);g.lineTo(x,y);g.stroke()}prev=[x,y]}
 g.strokeStyle='rgba(255,255,255,0.7)';g.lineWidth=3;g.beginPath();for(let x=-90;x<=xt;x+=8){const y=CS_wy(x)-3;x===-90?g.moveTo(x,y):g.lineTo(x,y)}g.stroke();g.restore();
 // vapour lifting off the rising parts, rain falling beside the falling parts
 for(let i=0;i<8;i++){const x=-60+i*110+((i*37)%50);if(x>xt-20)continue;const d=Math.sin(2*Math.PI*(x-150)/440),y=CS_wy(x);if(d<0)CS_wisp(x-14,y-18,60+20*hash(i),t,{a:0.9,ph:i,w:0.13,dir:i%2?1:-1});else CS_tearRain(t,x-10,x+30,y+10,y+120,2,90+i,{s:5.5,speed:300})}
 B_drop(xt,CS_wy(xt)-22,20,1,false);
 const ink=C_inkFor(t);C_T('up · vapour',548,700,36,ink.fg,{fam:FAM.display,wt:'600',st:'italic',stroke:ink.st,shadow:ink.sh,a:CS_up(t,c.t0+0.45,0.3)});C_T('down · rain',182,700,36,ink.fg,{fam:FAM.display,wt:'600',st:'italic',stroke:ink.st,shadow:ink.sh,a:CS_up(t,c.t0+0.2,0.3)});
 grain(t,0.04)};

// the glossy water ring (same look as color.js a3_eternal_word), drawn on from the top through p of a turn
function CS_glossRing(cx,cy,R,p,rot,o={}){if(p<=0)return;const wd=o.w||30,a0=o.a0??-Math.PI/2,a1=a0+Math.PI*2*cl(p);g.save();g.lineCap='round';
 g.strokeStyle='rgba(10,40,110,0.22)';g.lineWidth=wd+4;g.beginPath();g.arc(cx+4,cy+8,R,a0,a1);g.stroke();
 const cg=g.createConicGradient(rot,cx,cy);(o.cols||[['#2F7FE0',0],['#2FC6D8',0.25],['#5ACB6A',0.5],['#F2C14E',0.72],['#2F7FE0',1]]).forEach(([col,s])=>cg.addColorStop(s,col));g.strokeStyle=cg;g.lineWidth=wd;g.beginPath();g.arc(cx,cy,R,a0,a1);g.stroke();
 g.strokeStyle='rgba(255,255,255,0.65)';g.lineWidth=wd/6;g.beginPath();g.arc(cx,cy,R-wd*0.23,a0+0.05,a1-0.05);g.stroke();
 g.strokeStyle='rgba(10,40,110,0.35)';g.lineWidth=2;g.beginPath();g.arc(cx,cy,R+wd/2,a0,a1);g.stroke();g.beginPath();g.arc(cx,cy,R-wd/2,a0,a1);g.stroke();g.restore()}
// b056 C "it's ETERNAL": the water ring draws itself (a drop paints it), then "Eternal" drops in; matches a3_eternal_word next
S.a3_eternal=(t,c)=>{Wbg(t,0.95,{moon:false,la:0.18});const te=WT('eternal',78.5),ink=C_inkFor(t),p=eo(cl(c.k/0.62)),a=-Math.PI/2+Math.PI*2*p;
 CS_glossRing(360,540,220,p,c.k*0.35);B_drop(360+Math.cos(a)*220,540+Math.sin(a)*220,p<1?18:16,1,false);
 if(p>=1){const u=c.k-0.62;for(let i=0;i<6;i++){const aa=-Math.PI/2+i/6*6.28;C_sparkle(360+Math.cos(aa)*(220+u*60),540+Math.sin(aa)*(220+u*60),8,cl(1-u/0.5),{col:'200,236,255',edge:'rgba(30,80,170,0.6)'})}}
 C_dropIn('Eternal',W/2,550,96,ink.keyCol,te,t,{grad:ink.key,stroke:ink.kst,shadow:ink.sh,stag:0.03});grain(t,0.04)};

// =====================================================================================================================
// 6. the water cycle as a bright illustrated diagram; heaven above the clouds; the moving loop
// =====================================================================================================================
// static landscape for the diagram (sea, beach, mountain, green land, river, trees), cached once in rainy-day colours
const CS_DT=81;
const CS_cycLand=()=>CS_cache('cycLand',720,1280,(x)=>{const t=CS_DT,tc=c=>C_c(C_tint(c,t));
 const sg=x.createLinearGradient(0,890,0,1280);sg.addColorStop(0,'#9AD7F4');sg.addColorStop(0.35,'#4FA6E4');sg.addColorStop(1,'#1D5FBF');x.fillStyle=sg;x.fillRect(-10,890,740,400);
 x.strokeStyle='rgba(255,255,255,0.75)';x.lineWidth=3;x.lineCap='round';const r=RNG(31);for(let i=0;i<16;i++){const wx=10+r()*330,wy=930+r()*330,ww=18+r()*26*(1+(wy-900)/300);x.beginPath();x.arc(wx,wy+ww*0.6,ww*0.7,Math.PI*1.25,Math.PI*1.75);x.stroke()}
 // mountain behind the land
 x.fillStyle='#6FA6C9';x.beginPath();x.moveTo(400,960);x.lineTo(520,770);x.quadraticCurveTo(560,712,600,760);x.lineTo(660,820);x.quadraticCurveTo(700,780,740,800);x.lineTo(740,960);x.closePath();x.fill();
 x.fillStyle='#8FC0DD';x.beginPath();x.moveTo(520,770);x.quadraticCurveTo(560,712,600,760);x.lineTo(560,790);x.lineTo(540,775);x.closePath();x.fill();
 // beach and land
 x.fillStyle='#F2D9A0';x.beginPath();x.moveTo(300,1280);x.bezierCurveTo(300,1060,330,980,420,930);x.lineTo(740,880);x.lineTo(740,1280);x.closePath();x.fill();
 const lg=x.createLinearGradient(0,840,0,1280);lg.addColorStop(0,'#7DD05C');lg.addColorStop(0.5,'#45A845');lg.addColorStop(1,'#2C7D38');x.fillStyle=lg;x.beginPath();x.moveTo(345,1280);x.bezierCurveTo(345,1080,370,990,450,945);x.bezierCurveTo(520,905,600,850,740,835);x.lineTo(740,1280);x.closePath();x.fill();
 x.strokeStyle='rgba(255,255,255,0.45)';x.lineWidth=2.5;x.beginPath();x.moveTo(345,1200);x.bezierCurveTo(345,1080,370,990,450,945);x.bezierCurveTo(520,905,600,850,740,835);x.stroke();
 // the river runs from the mountain down across the land into the sea
 const rv=[[600,800],[620,860],[560,910],[600,980],[520,1040],[420,1060],[330,1080]];x.lineCap='round';x.lineJoin='round';
 for(const [w,col] of [[22,'#2E74C9'],[15,'#5FB2EE'],[4,'rgba(255,255,255,0.75)']]){x.strokeStyle=col;x.beginPath();rv.forEach(([px,py],i)=>{const ww=w*(0.5+i/rv.length);x.lineWidth=ww;i?x.lineTo(px,py):x.moveTo(px,py)});x.stroke()}
 for(const [tx,ty,s,sd] of [[680,880,46,1],[470,970,40,2],[660,1010,52,3],[560,1120,58,4],[430,1180,44,5],[700,1180,50,6]])C_miniTree(tx,ty,s,t,sd);
 for(let i=0;i<10;i++)C_flower(380+r()*330,960+r()*300,5+r()*3,{t,col:['#C58BEA','#F49AC6','#FFE36A','#FFFFFF'][i%4]})});
// the loop the drop travels: sea -> up (vapour) -> cloud -> down (rain) -> land -> river -> sea; an ellipse, clockwise
const CS_LP={cx:370,cy:640,rx:280,ry:300,a0:Math.PI*0.75};
const CS_lp=a=>[CS_LP.cx+Math.cos(a)*CS_LP.rx,CS_LP.cy+Math.sin(a)*CS_LP.ry];
function CS_loopArrow(p,a=1){if(p<=0)return;const {a0}=CS_LP,a1=a0+Math.PI*2*0.94*cl(p);g.save();g.globalAlpha*=a;g.lineCap='round';g.lineJoin='round';
 const path=()=>{g.beginPath();for(let i=0;i<=90;i++){const [x,y]=CS_lp(lerp(a0,a1,i/90));i?g.lineTo(x,y):g.moveTo(x,y)}};
 path();g.strokeStyle='rgba(16,38,96,0.55)';g.lineWidth=13;g.stroke();path();g.strokeStyle='#FFFFFF';g.lineWidth=8;g.setLineDash([20,12]);g.lineDashOffset=-CUR_T*40;g.stroke();g.setLineDash([]);
 for(const ah of [Math.PI*1.12,Math.PI*1.62,Math.PI*2.1,Math.PI*2.55]){if(ah>a1-0.05)continue;const [x,y]=CS_lp(ah),[x2,y2]=CS_lp(ah+0.02),an=Math.atan2(y2-y,x2-x);g.save();g.translate(x,y);g.rotate(an);g.beginPath();g.moveTo(16,0);g.lineTo(-12,-15);g.lineTo(-5,0);g.lineTo(-12,15);g.closePath();g.fillStyle='#FFFFFF';g.strokeStyle='rgba(16,38,96,0.8)';g.lineWidth=3;g.stroke();g.fill();g.restore()}
 g.restore()}
// b058 F "it again starts its journey": the water cycle, bright and labelled (labels >= 40 px), a drop running the loop
S.a3_cycle_diagram=(t,c)=>{const k=c.k,ink=C_inkFor(t);Wbg(t,0.9,{moon:false,clouds:false,hills:false,rain:false,la:0.1});
 C_sun(105,250,34,t,{a:0.95});g.drawImage(CS_cycLand(),0,0,720,1280);
 CS_vapRise(t,20,250,900,460,5,66,1,{sp:0.38,w:0.12});
 CS_tearRain(t,505,670,460,800,14,67,{s:6.5,speed:520});
 const sc=spr(k+0.25,10,0.6);CS_cumulus(330,375,280*sc,t,{seed:31,morph:1.2,detail:0.5});CS_cumulus(590,440,215*sc,t,{seed:33,pal:'rain',morph:1.2,detail:0.5});
 CS_loopArrow(eo(cl((k-0.05)/0.55)));
 const da=CS_LP.a0+Math.PI*2*eio(cl(k/1.25)),[dx,dy]=CS_lp(da);B_drop(dx,dy,15,cl(k/0.1),false);
 const lab=(s,x,y,t0,col,st)=>{const u=k-t0;if(u<=0)return;const z=0.6+0.4*spr(u,14,0.5);g.save();g.translate(x,y);g.scale(z,z);C_T(s,0,0,44,col,{fam:FAM.sansB,wt:'800',stroke:[st,7],shadow:[10,0.25,3],a:cl(u/0.08)});g.restore()};
 lab('cloud',330,322,0.15,'#1B3A93','#FFFFFF');lab('vapour',212,600,0.25,'#1B3A93','#FFFFFF');lab('rain',528,600,0.35,'#1B3A93','#FFFFFF');lab('sea',130,1000,0.45,'#FFFFFF','#123E8C');lab('land',600,990,0.55,'#FFFFFF','#1F5E26');
 grain(t,0.03)};

// heaven: above the clouds. A bright clear sky, the sun with a ring of rays, and a sea of cloud tops below; `alt` lifts the
// camera from inside the cloud (0) to above it (1)
function CS_heavenSky(t,burst=0){const S=CSKY(t),top=C_mx(S.top,'#2C6AD8',0.5),mid=C_mx(S.mid,'#79C0F2',0.5);
 const gr=g.createLinearGradient(0,-60,0,980);gr.addColorStop(0,C_c(top));gr.addColorStop(0.55,C_c(mid));gr.addColorStop(1,'#FFF2D6');g.fillStyle=gr;g.fillRect(-W,-H,3*W,3*H);
 g.save();g.globalCompositeOperation='soft-light';g.globalAlpha=0.4;g.drawImage(C_WASH,-90,-90,W+180,H+180);g.restore();
 const sx=360,sy=300;g.save();g.globalCompositeOperation='screen';glow(sx,sy,560,'255,236,190',0.55+0.3*burst,0.25);g.restore();
 C_rays(sx,sy,{a:0.3+0.35*burst,ang:Math.PI/2,spread:Math.PI*2,n:16,len:1300,t,col:'255,246,214',w:0.05});
 C_sun(sx,sy,52*(1+0.12*burst),t,{a:1});}
const CS_SEA_ROWS=[{R:26,y:880,d:560,sd:1},{R:40,y:930,d:760,sd:2},{R:62,y:1010,d:980,sd:3},{R:92,y:1140,d:1250,sd:4}];
function CS_cloudSea(t,alt){CS_SEA_ROWS.forEach((rw,j)=>{const by=rw.y-(1-alt)*rw.d,r=RNG(rw.sd*41+7),P=[];if(by-rw.R*2>H+20)return;
 for(let x=-rw.R;x<W+rw.R*2;x+=rw.R*1.25){const R=rw.R*(0.8+r()*0.45),dx=(t*(6+j*5))%(rw.R*1.25);P.push([x-dx,by-R*0.35+(r()-0.5)*rw.R*0.5,R])}
 for(let x=-rw.R;x<W+rw.R*2;x+=rw.R*1.7){const R=rw.R*(0.9+r()*0.4),dx=(t*(6+j*5))%(rw.R*1.25);P.push([x-dx+rw.R*0.6,by+R*0.6,R])}
 const fog=[0.45,0.3,0.15,0][j];CS_puffCloud(P,by+rw.R*3,{lit:C_mx('#FFFCF2','#FFE9C8',0.3),mid:C_mx('#F3F1FA','#E9E4F6',fog),shade:C_mx('#C9CDEA','#E6E8F6',fog),edge:C_mx('#9AA6D2','#DADFF2',fog),flat:false,detail:0.6,rim:0.8});
 const fy=by+rw.R*2.8,fg=g.createLinearGradient(0,fy,0,fy+700);fg.addColorStop(0,C_c(C_mx('#C9CDEA','#E6E8F6',fog)));fg.addColorStop(0.5,C_c(C_mx('#DCDDF2','#EEF0FA',fog)));fg.addColorStop(1,'#F6F3FA');g.fillStyle=fg;g.fillRect(-W,fy,3*W,3*H);
  if(fy<H){const r2=RNG(rw.sd*13);for(let i=0;i<7;i++){const px=(r2()*900+t*(20+i*6))%900-90,py=fy+80+r2()*600;CS_puff(px,py,50+r2()*70,0.55)}}})}
// b060 C "goes up there to HEAVEN": the camera rises through the cloud deck into the bright sky above; on "heaven" the sun
// flares and its rays open out
S.a3_heaven=(t,c)=>{const th=WT('heaven',83.5),alt=eo(cl((t-c.t0)/(th-c.t0+0.1))),b=t-th,burst=b>0?Math.exp(-b*2.2)*eo(cl(b/0.15)):0;
 CS_heavenSky(t,burst);if(b>0){for(let i=0;i<10;i++){const a=i/10*6.28+0.2,d=80+b*260*(0.8+0.4*hash(i));C_sparkle(360+Math.cos(a)*d,300+Math.sin(a)*d,8+5*hash(i*3),cl(1-b/1.0),{col:'255,248,220',edge:'rgba(170,110,30,0.45)'})}}
 C_cloud(120+c.k*20,560-alt*60,160,{t,seed:81,a:0.7*alt,lit:'#FFFFFF',shade:'#D6DCF0'});C_cloud(610-c.k*15,640-alt*50,130,{t,seed:82,a:0.6*alt,lit:'#FFFFFF',shade:'#D6DCF0'});
 CS_cloudSea(t,alt);B_drop(360,lerp(1100,720,eo(cl(c.k/1.4))),24,1,false);grain(t,0.035)};

// b061 X card L5 in the top panel over heaven; "heaven" flares on its word
S.a3_card_l5x=(t,c)=>{const th=WT('heaven',84.6);Wcard(t,{...c,k:c.k+1},{lines:[4],cy:540,a:84.4,b:86.7,bg:(t)=>{const b=t-th;CS_heavenSky(t,b>0?Math.exp(-b*2)*eo(cl(b/0.15))*0.6:0);CS_cloudSea(t,1.08)},
 over:(t,c,res)=>{const b=res.bounds['4:2'],u=t-th;if(!b||u<0||u>1.4)return;const k=Math.sin(Math.PI*cl(u/1.4)),cx=(b[0]+b[2])/2,cy=(b[1]+b[3])/2;
  g.save();g.globalCompositeOperation='multiply';glow(cx,cy,80,'255,226,160',0.35*k,0.5);g.restore();for(let i=0;i<6;i++){const a=i/6*6.28+u*1.5,d=(b[2]-b[0])*0.6+8;C_sparkle(cx+Math.cos(a)*d,cy+Math.sin(a)*22,7+3*hash(i),k,{col:'255,236,170',edge:'rgba(150,100,20,0.6)'})}}})};

// a glossy water ribbon along a curve y=f(x) (the cycle's path), with a white highlight and a soft cast shadow
function CS_ribbon(f,x0,x1,wd,o={}){g.save();g.lineCap='round';g.lineJoin='round';const pth=(dy)=>{g.beginPath();for(let x=x0;x<=x1;x+=6){const y=f(x)+dy;x===x0?g.moveTo(x,y):g.lineTo(x,y)}};
 pth(8);g.strokeStyle='rgba(12,40,110,0.18)';g.lineWidth=wd+6;g.stroke();
 pth(0);g.strokeStyle='rgba(12,44,120,0.6)';g.lineWidth=wd+4;g.stroke();
 const gr=g.createLinearGradient(x0,0,x1,0);(o.cols||[['#2F7FE0',0],['#36C2DE',0.35],['#5ED0A8',0.65],['#2F7FE0',1]]).forEach(([c,s])=>gr.addColorStop(s,c));pth(0);g.strokeStyle=gr;g.lineWidth=wd;g.stroke();
 pth(-wd*0.22);g.strokeStyle='rgba(255,255,255,0.7)';g.lineWidth=wd*0.18;g.stroke();g.restore()}
// b064 X "when you look into its motion": the cycle's path flows as a glossy water ribbon; a drop rides it; towards the end
// red rails and yellow ties settle onto it (it becomes the coaster track)
S.a3_motion=(t,c)=>{Wbg(t,1,{moon:false,la:0.12,ly:540,hy:1000});const ph=-c.k*2.2,A=150+20*Math.sin(c.k*1.5),f=x=>540-A*Math.sin(x*0.0105+ph),tk=eio(cl((t-(c.t1-0.75))/0.7));
 for(let i=0;i<6;i++){const x=(i*140+((-ph/0.0105)%140)+700)%840-60,y=f(x),d=Math.cos(x*0.0105+ph);if(d>0.2)CS_wisp(x,y-20,55,t,{a:0.8,ph:i,w:0.13});else if(d<-0.2)CS_tearRain(t,x-10,x+20,y+16,y+110,2,95+i,{s:5,speed:300})}
 if(tk>0){g.save();g.globalAlpha*=tk;g.strokeStyle='#F2F5FA';g.lineWidth=5;for(let x=-40;x<=760;x+=48){const y=f(x);g.beginPath();g.moveTo(x,y+12);g.lineTo(x,900);g.stroke()}g.restore()}
 CS_ribbon(f,-40,760,lerp(16,12,tk));
 if(tk>0){g.save();g.globalAlpha*=tk;g.fillStyle='#FFC93C';for(let x=-36;x<=760;x+=16){const y=f(x),an=Math.atan(-A*0.0105*Math.cos(x*0.0105+ph));g.save();g.translate(x,y);g.rotate(an);g.fillRect(-2.5,-11,5,22);g.restore()}
  g.lineCap='round';for(const [dy,col,lw] of [[-9,'#E8333D',5],[9,'#C3242E',5]]){g.strokeStyle=col;g.lineWidth=lw;g.beginPath();for(let x=-40;x<=760;x+=6){const y=f(x)+dy;x===-40?g.moveTo(x,y):g.lineTo(x,y)}g.stroke()}g.restore()}
 B_drop(360,f(360)-26,20,1,false);grain(t,0.04)};

// =====================================================================================================================
// 7. the roller coaster: red rails, yellow ties, white steel supports over green hills; a blue car with two happy riders
// =====================================================================================================================
const CS_TA=260,CS_TY=700,CS_TF=0.008,CS_CX=Math.PI/2/CS_TF;
const CS_ty=x=>CS_TY-CS_TA*(1+0.12*Math.exp(-Math.pow((x-CS_CX)/420,2)))*Math.sin(x*CS_TF);
const CS_tang=x=>Math.atan2(CS_ty(x+1)-CS_ty(x-1),2);
const CS_gy=x=>1030+18*Math.sin(x*0.0047+1.3)+8*Math.sin(x*0.013);
// one rider (local car coords; the car points +x). kind 0: boy, orange shirt; 1: girl, purple top, ponytail
function CS_rider(dx,kind,arms,t,sc){const skin=kind?'#E3A57A':'#C68559',shirt=kind?'#9B5DE5':'#FF7A3D',hair='#2A1A12',hy=-66,ol='rgba(40,20,10,0.75)';g.save();g.lineCap='round';g.lineJoin='round';
 // arms (behind the torso when holding the bar; up and waving when excited)
 const wv=Math.sin(t*14+dx)*0.12;const arm=(sx,ex,ey)=>{g.strokeStyle=ol;g.lineWidth=8.5;g.beginPath();g.moveTo(dx+sx,-46);g.quadraticCurveTo(dx+(sx+ex)/2+3,(-46+ey)/2-4,dx+ex,ey);g.stroke();g.strokeStyle=shirt;g.lineWidth=6;g.stroke();g.fillStyle=skin;g.beginPath();g.arc(dx+ex,ey,4.2,0,7);g.fill();g.strokeStyle=ol;g.lineWidth=1.2;g.stroke()};
 if(arms>0.5){arm(-7,-16+Math.sin(t*12+dx)*4,-92);arm(7,16+wv*30,-94)}else{arm(-6,14,-34);arm(6,18,-36)}
 g.fillStyle=shirt;g.strokeStyle=ol;g.lineWidth=1.6;g.beginPath();g.roundRect(dx-11,-52,22,26,8);g.fill();g.stroke();
 g.fillStyle='rgba(255,255,255,0.25)';g.beginPath();g.roundRect(dx-8,-49,6,18,3);g.fill();
 // head
 if(kind){g.fillStyle=hair;g.beginPath();const fl=Math.sin(t*9)*3;g.moveTo(dx-8,hy-8);g.quadraticCurveTo(dx-24,hy-12+fl,dx-30,hy+2+fl);g.quadraticCurveTo(dx-20,hy+0,dx-9,hy+2);g.closePath();g.fill();g.fillStyle='#FF6FA8';g.beginPath();g.arc(dx-10,hy-6,3,0,7);g.fill()}
 g.fillStyle=skin;g.strokeStyle=ol;g.lineWidth=1.6;g.beginPath();g.arc(dx,hy,13,0,7);g.fill();g.stroke();
 g.fillStyle=hair;g.beginPath();g.arc(dx-1,hy-2,13.4,Math.PI*1.02,Math.PI*1.98);g.quadraticCurveTo(dx+8,hy-9,dx+2,hy-7);g.quadraticCurveTo(dx-4,hy-6,dx-12,hy-1);g.closePath();g.fill();
 g.fillStyle='#1A1A22';g.beginPath();g.ellipse(dx+3,hy+1,1.7,2.3,0,0,7);g.ellipse(dx+9.5,hy+1,1.7,2.3,0,0,7);g.fill();
 g.fillStyle='rgba(255,120,120,0.45)';g.beginPath();g.arc(dx+1,hy+6,2.6,0,7);g.arc(dx+11,hy+6,2.6,0,7);g.fill();
 if(arms>0.5){g.fillStyle='#8E2D2D';g.beginPath();g.arc(dx+6.5,hy+6,4,0,Math.PI);g.fill()}else{g.strokeStyle='#5A2A1A';g.lineWidth=1.6;g.beginPath();g.arc(dx+6.5,hy+4,4,0.25,Math.PI-0.25);g.stroke()}
 g.restore()}
function CS_car(x,y,ang,arms,s,t){g.save();g.translate(x,y);g.rotate(ang);g.scale(s,s);
 CS_rider(-15,1,arms,t);CS_rider(17,0,arms,t);
 g.lineJoin='round';const bp=new Path2D();bp.moveTo(-44,-4);bp.lineTo(-44,-26);bp.quadraticCurveTo(-44,-32,-37,-32);bp.lineTo(30,-32);bp.quadraticCurveTo(50,-30,52,-10);bp.quadraticCurveTo(52,-2,44,-2);bp.lineTo(-40,-2);bp.closePath();
 const gr=g.createLinearGradient(0,-32,0,0);gr.addColorStop(0,'#5AB0FF');gr.addColorStop(1,'#1E5FD0');g.fillStyle=gr;g.fill(bp);g.strokeStyle='#0F2E6E';g.lineWidth=2.4;g.stroke(bp);
 g.fillStyle='#FFD23F';g.fillRect(-42,-19,90,6);g.fillStyle='rgba(255,255,255,0.45)';g.beginPath();g.roundRect(-38,-29,60,4,2);g.fill();
 g.fillStyle='#FFD23F';g.strokeStyle='#0F2E6E';g.lineWidth=1.5;g.beginPath();g.arc(47,-20,4,0,7);g.fill();g.stroke();
 for(const wx of [-28,28]){g.fillStyle='#2A2F45';g.beginPath();g.arc(wx,1,7.5,0,7);g.fill();g.fillStyle='#C8D2E6';g.beginPath();g.arc(wx,1,3,0,7);g.fill()}
 g.restore()}
function CS_flag(x,y,t,s=1){g.save();g.translate(x,y);g.scale(s,s);g.strokeStyle='#5B6378';g.lineWidth=4;g.lineCap='round';g.beginPath();g.moveTo(0,0);g.lineTo(0,-96);g.stroke();g.fillStyle='#FFD23F';g.beginPath();g.arc(0,-98,4.5,0,7);g.fill();
 g.beginPath();g.moveTo(0,-92);for(let i=0;i<=10;i++){const u=i/10;g.lineTo(u*62,-92+Math.sin(u*5-t*9)*5*u+u*8)}for(let i=10;i>=0;i--){const u=i/10;g.lineTo(u*62,-56+Math.sin(u*5-t*9+0.4)*5*u-u*8)}g.closePath();
 const fg=g.createLinearGradient(0,-92,0,-56);fg.addColorStop(0,'#FF6A5A');fg.addColorStop(1,'#E0303C');g.fillStyle=fg;g.fill();g.strokeStyle='#8E1C24';g.lineWidth=2;g.stroke();
 g.fillStyle='#FFFFFF';g.save();g.translate(24,-74+Math.sin(2-t*9)*2);C_starPath(9,0.4);g.fill();g.restore();g.restore()}
// the coaster world between x0 and x1 (world coords); xmax cuts the track while it is being built
function CS_coasterWorld(t,x0,x1,o={}){const xm=o.xmax??1e9,grow=x=>cl((xm-x)/120);
 // white steel supports with light-blue bracing
 g.save();g.lineCap='round';const Pp=new Path2D(),Pb=new Path2D();for(let x=Math.ceil(x0/44)*44;x<=x1;x+=44){const gw=grow(x);if(gw<=0)continue;const top=CS_ty(x)+14,bot=CS_gy(x),yy=lerp(bot,top,eo(gw));Pp.moveTo(x,bot);Pp.lineTo(x,yy);
  for(let y=top+50;y<bot-40;y+=90){const y2=Math.min(bot,y+80);if(y<yy)continue;Pb.moveTo(x,y);Pb.lineTo(x+44,Math.min(CS_gy(x+44),y2));Pb.moveTo(x+44,Math.max(CS_ty(x+44)+14,y));Pb.lineTo(x,y2)}}
 g.strokeStyle='#A9BBDA';g.lineWidth=3;g.stroke(Pb);g.strokeStyle='#7E92BC';g.lineWidth=8;g.stroke(Pp);g.strokeStyle='#F6F8FD';g.lineWidth=5;g.stroke(Pp);g.restore();
 // the green ground under it, grass, small trees and flowers
 const G=new Path2D();G.moveTo(x0-60,CS_gy(x0-60));for(let x=x0-60;x<=x1+60;x+=12)G.lineTo(x,CS_gy(x));G.lineTo(x1+60,2600);G.lineTo(x0-60,2600);G.closePath();
 const gg=g.createLinearGradient(0,980,0,1400);gg.addColorStop(0,C_c(C_tint('#76C94F',t)));gg.addColorStop(1,C_c(C_tint('#2E7D33',t)));g.fillStyle=gg;g.fill(G);
 g.strokeStyle='rgba(255,255,255,0.4)';g.lineWidth=2;g.beginPath();for(let x=x0-60;x<=x1+60;x+=12)x===x0-60?g.moveTo(x,CS_gy(x)+1):g.lineTo(x,CS_gy(x)+1);g.stroke();
 C_grass(x0-60,1000,x1-x0+120,{t,base:CS_gy,h:16,dens:0.9,seed:8});
 for(let b=Math.floor(x0/130);b<=Math.ceil(x1/130);b++){const h1=hash(b*3.7+1),x=b*130+h1*90;if(h1<0.5)C_miniTree(x,CS_gy(x)+40,34+h1*20,t,b+50);else C_flower(x,CS_gy(x)+30+h1*60,6+h1*4,{t,col:h1<0.75?'#C58BEA':'#F49AC6'})}
 // the track: spine, yellow ties, two red rails with a bright top highlight
 const xe=Math.min(x1,xm),seg=(dy)=>{g.beginPath();for(let x=x0;x<=xe;x+=6){const y=CS_ty(x)+dy;x===x0?g.moveTo(x,y):g.lineTo(x,y)}};
 if(xe>x0){g.save();g.lineCap='round';g.lineJoin='round';seg(10);g.strokeStyle='rgba(20,30,70,0.25)';g.lineWidth=14;g.stroke();
  g.fillStyle='#FFC93C';g.strokeStyle='#B07A12';g.lineWidth=1;for(let x=Math.ceil(x0/14)*14;x<=xe;x+=14){g.save();g.translate(x,CS_ty(x)+5);g.rotate(CS_tang(x));g.beginPath();g.rect(-2.6,-4,5.2,16);g.fill();g.stroke();g.restore()}
  seg(12);g.strokeStyle='#A81F2A';g.lineWidth=6;g.stroke();seg(0);g.strokeStyle='#8E1822';g.lineWidth=8;g.stroke();seg(0);g.strokeStyle='#EE3B43';g.lineWidth=5.5;g.stroke();seg(-1.6);g.strokeStyle='rgba(255,200,190,0.9)';g.lineWidth=1.6;g.stroke();g.restore()}
 if(o.flag)CS_flag(CS_CX+6,CS_ty(CS_CX)-6,t,1.2)}
// one coaster shot: the painted sky and far hills in screen space (rolled with the camera), the world under the camera
function CS_coaster(t,cam,car,o={}){const z=cam.z||1,rot=cam.r||0;C_sky(t,{hz:1060,moon:false,raysA:0.6});
 g.save();g.translate(360,560);g.rotate(rot*0.85);g.translate(-360,-560);const hy=cl(560+(1010-cam.y)*z*0.55+40,700,1160);g.save();g.translate(-((cam.x*0.12)%400),0);C_hills(t,hy,{n:2,amp:70,trees:7,seed:5,flowers:0,x0:-W,x1:W*2.4});g.restore();g.restore();
 g.save();g.translate(360,560);g.rotate(rot);g.scale(z,z);g.translate(-cam.x,-cam.y);const span=520/z+80;CS_coasterWorld(t,cam.x-span,cam.x+span,o);
 if(car)CS_car(car.x,CS_ty(car.x)-4,CS_tang(car.x),car.arms||0,car.s||1.3,t);if(o.post)o.post();g.restore();
 vignette(0.18,'20,50,110');grain(t,0.035)}
// b066 C "a ROLLER coaster ride": the track builds itself across the hills and snaps red on "roller"; the car rolls in
S.a3_coaster=(t,c)=>{const tr=WT('roller',93.2),b=eo(cl((t-c.t0)/(tr-c.t0+0.05))),xc=lerp(CS_CX-420,CS_CX-110,eio(cl((t-tr+0.2)/1.1)));
 CS_coaster(t,{x:CS_CX+20,y:CS_ty(CS_CX)+150,z:0.72+0.03*c.k},t>tr-0.2?{x:xc,arms:0}:null,{xmax:lerp(CS_CX-720,CS_CX+900,b),flag:t>tr,post:()=>{const u=t-tr;if(u>0&&u<0.5){g.save();g.globalCompositeOperation='screen';g.strokeStyle=`rgba(255,240,200,${0.8*(1-u/0.5)})`;g.lineWidth=14;g.beginPath();for(let x=CS_CX-700;x<=CS_CX+700;x+=8)x===CS_CX-700?g.moveTo(x,CS_ty(x)):g.lineTo(x,CS_ty(x));g.stroke();g.restore()}}})};
// b067 X "as we HUMAN beings feel": close on the car climbing; the riders wave
S.a3_human=(t,c)=>{const x=CS_CX-430+c.k*120;CS_coaster(t,{x:x+20,y:CS_ty(x)-50,z:1.75},{x,arms:c.k>0.4?1:0,s:1.3})};
// b069 C "We can never be": the slow climb to the crest, tilted camera
S.a3_climb=(t,c)=>{const x=lerp(CS_CX-230,CS_CX-70,eio(cl(c.k/0.94)));CS_coaster(t,{x:x+30,y:CS_ty(x)-40,z:1.45,r:0.12},{x,arms:0,s:1.3},{flag:true})};
// b070 C "at the TOP": the summit, the flag flying, arms up, sparkles
S.a3_top=(t,c)=>{const x=CS_CX-12+c.k*10;CS_coaster(t,{x:x+10,y:CS_ty(x)-60,z:1.9},{x,arms:1,s:1.3},{flag:true,post:()=>{for(let i=0;i<7;i++){const a=i/7*6.28+c.k*0.6,d=120+12*Math.sin(t*3+i);C_sparkle(x+Math.cos(a)*d,CS_ty(x)-80+Math.sin(a)*d*0.55,7+4*hash(i),0.5+0.5*Math.sin(t*5+i*1.3),{col:'255,236,170',edge:'rgba(150,100,20,0.55)'})}}})};
// b071 C "There has to be some bounds": the plunge
S.a3_down=(t,c)=>{const x=lerp(CS_CX+30,CS_CX+330,eio(cl(c.k/0.92)));CS_coaster(t,{x:x+40,y:CS_ty(x)-10,z:1.2,r:-0.18},{x,arms:1,s:1.3},{flag:true})};

// the valley at the bottom of the plunge: far mountains, the track dipping behind, two green slopes meeting, rain running
// down them into a bright stream that winds toward us. dy shifts it up for the split panel.
function CS_valley(t,o={}){const dy=o.dy||0,S=CSKY(t);C_sky(t,{hz:900-dy,moon:false,raysA:0.5});
 if(o.mauve){g.save();g.globalCompositeOperation='screen';glow(360,820-dy,420,'230,170,200',0.28*o.mauve,0.3);g.restore()}
 g.save();g.translate(0,-dy);
 C_cloud(140+t*6%40,250,250,{t,seed:91,rain:0.9,fall:260,outline:true,ow:2});C_cloud(560-t*5%40,200,220,{t,seed:92,rain:0.9,fall:240,outline:true,ow:2});
 C_hills(t,800,{n:2,amp:170,peak:true,cols:C_MTNCOL,seed:9,gap:40,trees:0,haze:0.5});
 // the track crossing the valley behind, small and far
 g.save();g.translate(360,700);g.scale(0.42,0.42);g.translate(-(CS_CX+392),-860);const tx0=CS_CX-500,tx1=CS_CX+1300;
 g.save();g.lineCap='round';const Pp=new Path2D();for(let x=Math.ceil(tx0/44)*44;x<=tx1;x+=44){Pp.moveTo(x,CS_ty(x)+14);Pp.lineTo(x,1100)}g.strokeStyle='#E8EEF8';g.lineWidth=6;g.stroke(Pp);
 g.beginPath();for(let x=tx0;x<=tx1;x+=8)x===tx0?g.moveTo(x,CS_ty(x)):g.lineTo(x,CS_ty(x));g.strokeStyle='#D9363F';g.lineWidth=9;g.stroke();g.restore();g.restore();
 // the two slopes
 const hl=new Path2D();hl.moveTo(-60,640);hl.bezierCurveTo(120,660,250,780,350,935);hl.lineTo(350,1500);hl.lineTo(-60,1500);hl.closePath();
 const hr=new Path2D();hr.moveTo(780,600);hr.bezierCurveTo(600,640,470,790,380,935);hr.lineTo(380,1500);hr.lineTo(780,1500);hr.closePath();
 for(const [P,c1,c2] of [[hr,'#5DBB4C','#2E8A3A'],[hl,'#79CC57','#3A9641']]){const gr=g.createLinearGradient(0,600,0,1100);gr.addColorStop(0,C_c(C_tint(c1,t)));gr.addColorStop(1,C_c(C_tint(c2,t)));g.fillStyle=gr;g.fill(P);g.strokeStyle='rgba(255,255,255,0.4)';g.lineWidth=2;g.stroke(P)}
 for(const [tx,ty,s,sd] of [[60,700,44,11],[170,760,40,12],[640,690,46,13],[540,770,38,14],[250,850,34,15],[470,860,32,16]])C_miniTree(tx,ty,s,t,sd);
 // rivulets running down the slopes into the stream
 g.save();g.lineCap='round';g.setLineDash([16,14]);g.lineDashOffset=-t*90;g.strokeStyle='rgba(120,200,255,0.9)';g.lineWidth=4;
 for(const [a,b,cx,cy,d,e] of [[60,690,200,780,330,925],[150,700,260,830,345,930],[660,650,520,770,395,925],[580,680,470,830,385,930]]){g.beginPath();g.moveTo(a,b);g.quadraticCurveTo(cx,cy,d,e);g.stroke()}g.setLineDash([]);g.restore();
 // the valley floor and the stream
 const fl=g.createLinearGradient(0,920,0,1300);fl.addColorStop(0,C_c(C_tint('#8AD263',t)));fl.addColorStop(1,C_c(C_tint('#3E9A45',t)));g.fillStyle=fl;g.beginPath();g.moveTo(-60,1500);g.lineTo(-60,1010);g.quadraticCurveTo(200,930,365,930);g.quadraticCurveTo(540,930,780,1010);g.lineTo(780,1500);g.closePath();g.fill();
 const st=new Path2D(),sw=y=>6+(y-930)*0.32,sx=y=>365+Math.sin((y-930)*0.016)*60*((y-930)/350);st.moveTo(sx(930)-sw(930),930);for(let y=930;y<=1320;y+=10)st.lineTo(sx(y)-sw(y),y);for(let y=1320;y>=930;y-=10)st.lineTo(sx(y)+sw(y),y);st.closePath();
 const sg=g.createLinearGradient(0,930,0,1300);sg.addColorStop(0,C_c(C_mx(S.hz,'#9ED8F8',0.5)));sg.addColorStop(1,C_c(S.surf));g.fillStyle=sg;g.fill(st);g.strokeStyle='rgba(255,255,255,0.75)';g.lineWidth=2.5;g.stroke(st);
 g.save();g.clip(st);g.strokeStyle='rgba(255,255,255,0.6)';g.lineWidth=2;for(let i=0;i<9;i++){const y=940+((i*47+t*70)%380);g.beginPath();g.moveTo(sx(y)-sw(y)*0.5,y);g.quadraticCurveTo(sx(y),y-4,sx(y)+sw(y)*0.4,y+2);g.stroke()}
 for(let i=0;i<6;i++){const per=0.9+hash(i)*0.5,age=(t+hash(i*3)*per)%per,y=980+hash(i*7+Math.floor((t+hash(i*3)*per)/per))*300;C_ripples(sx(y)+(hash(i*9)-0.5)*sw(y),y,t,t-age,{n:2,sc:0.4+(y-930)/500,flat:0.25,life:0.9})}g.restore();
 C_grass(-60,1000,840,{t,base:y=>y<365?1010-((y+60)/425)*80:930+((y-365)/415)*80,h:14,dens:0.6,seed:17});
 g.restore();
 B_rain(t,70,47,900,80,0.5,0);CS_tearRain(t,0,720,280-dy,1100-dy,18,48,{s:6,speed:540});
 vignette(0.18,'20,50,110');grain(t,0.035)}
// b072 C "bounds.": the valley floor at the bottom of the plunge; rain gathering into a stream
S.a3_valley=(t,c)=>{g.save();const z=1.06-0.04*c.k;g.translate(360,700);g.scale(z,z);g.translate(-360,-700);CS_valley(t);g.restore()};
// b074 X "nature is also like that": the same valley, framed for the split panel, first mauve on the horizon
S.a3_nature=(t,c)=>{CS_valley(t,{dy:250-c.k*20,mauve:1})};

}
