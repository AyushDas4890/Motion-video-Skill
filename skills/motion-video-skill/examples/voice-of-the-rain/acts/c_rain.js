// acts/c_rain.js (colour world) — THE RAIN & WATER artist. Loaded after every act file; reassigns SCENES.<name> for the
// macro-water shots. Look: glossy, near-realistic water (raindrop1/2/3 references): refractive lens drops that show the
// world upside down, crisp specular highlights, caustics, crown splashes, concentric ripple rings on deep-to-light blue water,
// rain beading on glass over blurred leaves / bokeh. Everything is pure in t (RNG / hash / vnoise only); static art is cached.
'use strict';
{const S=SCENES;

// =====================================================================================================================
// 1. GL macro water: perspective plane, physical ring wave packets (raindrop2), ambient rain rings, sky reflection by
//    elevation (light far -> deep near), body colour, rim light on ring slopes, moon/sun specular.
// =====================================================================================================================
const CR_WFS=`#version 300 es
precision highp float;
in vec2 uv;out vec4 o;uniform vec2 res;
${GLSL_NOISE}
uniform float T,HZ,FL,AMP,WS,RAIN,RSC,RSP,E0,E1,LA,REFL,RIM,MOT,CLD;
uniform vec3 CHI,CMID,CLO,BODY,LC;
uniform vec2 LP;
uniform vec4 R0,R1,R2,R3,R4,R5,R6,R7,Q0,Q1,Q2,Q3,Q4,Q5,Q6,Q7;
float ringH(vec2 w,vec4 r,vec4 q){float age=T-r.z;if(age<=0.||r.w<=0.)return 0.;
 float d=length(w-r.xy),k=6.2831/q.y,R=q.x*age,x=R-d,sig=q.w*(1.+age*0.9);
 float env=exp(-pow((x-sig*0.8)/sig,2.))*exp(-age*q.z)*smoothstep(-q.y,q.y*0.3,x);
 float h=r.w/k*env*sin(k*x)/(1.+R/(q.y*9.));
 h+=r.w/k*1.4*exp(-d*d/(q.y*q.y*0.9))*cos(age*17.)*exp(-age*3.2);
 return h;}
float rainH(vec2 w){if(RAIN<=0.)return 0.;float h=0.;vec2 c0=floor(w/RSC);
 for(int i=-1;i<=1;i++)for(int j=-1;j<=1;j++){vec2 c=c0+vec2(float(i),float(j));float a=h21(c),b=h21(c+17.31),q=h21(c+41.7);if(q>RAIN)continue;
  vec2 p=(c+vec2(0.2+0.6*a,0.2+0.6*b))*RSC;float per=1.5+q*1.4,age=mod(T*RSP+a*7.3+b*3.1,per);
  float lam=RSC*0.075,k=6.2831/lam,d=length(w-p),R=RSC*0.36*age,x=R-d,sig=lam*(1.+age*1.3);
  float env=exp(-pow((x-sig*0.8)/sig,2.))*exp(-age*1.5)*smoothstep(0.,0.04,age)*(1.-smoothstep(RSC*0.42,RSC*0.62,R));
  h+=(0.42/k)*env*sin(k*x);h+=(0.42/k)*0.9*exp(-d*d/(lam*lam*0.8))*cos(age*20.)*exp(-age*4.);}
 return h;}
float Hf(vec2 w){float h=AMP/WS*(0.5*sin(w.x*WS*0.9+w.y*WS*0.4+T*1.1)+0.35*sin(-w.x*WS*0.55+w.y*WS*1.1+T*1.45)+0.6*(vn(w*WS*1.6+vec2(T*0.35,T*0.22))-0.5)+0.3*(vn(w*WS*4.1-vec2(T*0.6,0.))-0.5));
 h+=rainH(w);h+=ringH(w,R0,Q0)+ringH(w,R1,Q1)+ringH(w,R2,Q2)+ringH(w,R3,Q3)+ringH(w,R4,Q4)+ringH(w,R5,Q5)+ringH(w,R6,Q6)+ringH(w,R7,Q7);return h;}
void main(){vec2 P=vec2(uv.x*720.,(1.-uv.y)*1280.);float dy=P.y-HZ;if(dy<=0.5){o=vec4(0.);return;}
 vec2 w=vec2((P.x-360.)/dy,FL/dy);float e=0.75/dy;
 float h0=Hf(w),hx=(Hf(w+vec2(e,0.))-h0)/e,hz=(Hf(w+vec2(0.,e))-h0)/e;
 float far=smoothstep(14.,90.,dy)*1.;hx*=far;hz*=far;
 vec3 n=normalize(vec3(-hx,1.,-hz));
 vec3 V=normalize(vec3((P.x-360.)/FL,-dy/FL,1.));
 vec3 R=reflect(V,n);float el=asin(clamp(R.y,-1.,1.));
 float s=clamp((el-E0)/(E1-E0),0.,1.);
 vec3 refl=s<0.5?mix(CHI,CMID,smoothstep(0.,1.,s*2.)):mix(CMID,CLO,smoothstep(0.,1.,(s-0.5)*2.));
 vec2 rp=R.xz/max(R.y,0.06);refl*=1.+CLD*(vn(rp*1.3+vec2(T*0.02,0.))-0.5);
 float cosi=clamp(dot(-V,n),0.,1.),fr=clamp(REFL*(0.6+0.4*pow(1.-cosi,1.5)),0.,1.);
 vec3 col=mix(BODY,refl,fr);
 float sl=length(vec2(hx,hz));col+=mix(CHI,vec3(1.),0.5)*smoothstep(0.05,0.45,sl)*RIM*clamp(-hz*4.+0.3,0.,1.);
 vec3 Vl=normalize(vec3((LP.x-360.)/FL,-(LP.y-HZ)/FL,1.)),L=reflect(Vl,vec3(0.,1.,0.));
 float rl=max(dot(R,L),0.);col+=LC*(pow(rl,1400.)*1.8+pow(rl,90.)*0.3+pow(rl,10.)*0.07)*LA;
 o=vec4(col,1.);}`;
const CR_c3=c=>C_n3(C_col(c));
// water palette taken from the sky clock so the macro water matches the world's sky
function CR_palSky(t,o={}){const S=CSKY(t);return {hi:C_mx(S.hz,C_WH,o.wh??0.3),mid:C_mx(S.mid,S.surf,0.4),lo:C_mx(S.deep,S.top,0.25),body:C_mx(S.deep,C_BK,0.15),lc:C_mx(S.lc,C_WH,0.5)}}
// palettes: hi = far reflection, mid, lo = near reflection, body = water colour, lc = light colour
const CR_PAL={
 night:{hi:'#A6D2FF',mid:'#3B78DA',lo:'#0E2D88',body:'#0A2260',lc:'#EAF2FF'},
 blue :{hi:'#B9EAF2',mid:'#3E8AD2',lo:'#123C92',body:'#0C3070',lc:'#F2FAFF'},
 day  :{hi:'#E2F5FF',mid:'#72B9EA',lo:'#1D63B8',body:'#11489A',lc:'#FFFFFF'},
 over :{hi:'#DCE6F0',mid:'#8AA6C6',lo:'#2E5486',body:'#24476F',lc:'#F4F8FF'}};
// screen -> plane helpers (camera height 1, horizon HZ, focal FL)
function CR_water(t,o={}){const HZ=o.hz??-500,FL=o.fl??640,P=o.pal||CR_PAL.night;
 const E0=o.e0??Math.atan(Math.max(1,-HZ)/FL)*0.92,E1=o.e1??Math.atan((H-HZ)/FL)*1.04;
 const U={T:t,HZ,FL,AMP:o.amp??0.05,WS:o.ws??40,RAIN:o.rain??0.25,RSC:o.rsc??0.22,RSP:o.rsp??1,E0,E1,LA:o.la??0.7,REFL:o.refl??0.9,RIM:o.rim??0.22,MOT:0,CLD:o.cld??0.18,
  CHI:CR_c3(P.hi),CMID:CR_c3(P.mid),CLO:CR_c3(P.lo),BODY:CR_c3(P.body),LC:CR_c3(P.lc),LP:o.lp||[360,90]};
 const rs=o.rings||[];for(let i=0;i<8;i++){const r=rs[i];if(r&&r.t0<t+0.001&&r.t0>t-(r.life??6)){const dy=Math.max(2,r.y-HZ);U['R'+i]=[(r.x-360)/dy,FL/dy,r.t0,r.s??0.4];U['Q'+i]=[(r.sp??260)/dy,(r.lam??22)/dy,r.dec??1.0,(r.wid??(r.lam??22)*1.5)/dy]}else{U['R'+i]=[0,0,1e9,0];U['Q'+i]=[1,1,1,1]}}
 const cv=GL.run('CR_water',CR_WFS,U,{},PW,PH);if(o.draw!==false)g.drawImage(cv,0,0,W,H);return cv}

// =====================================================================================================================
// 2. The lens drop: the world seen upside down inside it (refraction), dark rim, caustic glow, hard specular, window glint.
// =====================================================================================================================
function CR_dropPath(x,y,r,o={}){const P=new Path2D(),sh=o.shape||'tear',sx=o.sx||1,sy=o.sy||1;
 if(sh==='ball'){P.ellipse(x,y,r*sx,r*sy,o.rot||0,0,Math.PI*2);return P}
 if(sh==='tear'){const tp=o.tip??1,top=y-r*sy*(1+1.0*tp);P.moveTo(x,top);P.bezierCurveTo(x+r*sx*0.1,top+r*sy*0.45*tp,x+r*sx,y-r*sy*0.7,x+r*sx,y);P.ellipse(x,y,r*sx,r*sy,0,0,Math.PI);P.bezierCurveTo(x-r*sx,y-r*sy*0.7,x-r*sx*0.1,top+r*sy*0.45*tp,x,top);P.closePath();return P}
 if(sh==='hang'){const ay=o.ay??y-r*1.7,nw=o.nw??r*0.32;P.moveTo(x-nw,ay);P.bezierCurveTo(x-nw*0.9,ay+(y-ay)*0.5,x-r*sx,y-r*sy*0.85,x-r*sx,y);P.ellipse(x,y,r*sx,r*sy,0,Math.PI,0,true);P.bezierCurveTo(x+r*sx,y-r*sy*0.85,x+nw*0.9,ay+(y-ay)*0.5,x+nw,ay);P.closePath();return P}
 if(sh==='dome'){const h=r*(o.hk??0.8);P.moveTo(x-r,y);P.bezierCurveTo(x-r*1.02,y-h*0.7,x-r*0.62,y-h,x,y-h);P.bezierCurveTo(x+r*0.62,y-h,x+r*1.02,y-h*0.7,x+r,y);P.quadraticCurveTo(x,y+r*0.06,x-r,y);P.closePath();return P}
 if(sh==='blob'){const n=72,m=o.mods||[];P.moveTo(x+r*sx,y);for(let i=0;i<=n;i++){const a=i/n*Math.PI*2;let k=1;for(const [f,amp,ph] of m)k+=amp*Math.sin(f*a+ph);const yy=y+Math.sin(a)*r*sy*k*(Math.sin(a)>0?(o.flat??1):1);P.lineTo(x+Math.cos(a)*r*sx*k,yy)}P.closePath();return P}
 return P}
// o: shape opts + refr(fn: draws the background in logical coords), mag, cx/cy (background point seen at the centre),
//    la (light angle), rim colour, a (alpha), spec (0..1), tint ([r,g,b] wash), caus (bottom caustic strength)
function CR_drop(x,y,r,o={}){if(r<=0.5||(o.a??1)<=0.01)return;const P=CR_dropPath(x,y,r,o),la=o.la??-2.25,lx=Math.cos(la),ly=Math.sin(la),sx=o.sx||1,sy=o.sy||1,rim=o.rim||'6,24,80';
 g.save();g.globalAlpha*=o.a??1;
 if(o.glow!==false&&r>=8){g.save();g.globalCompositeOperation='screen';glow(x,y,r*2.4,o.glowc||'160,210,255',0.18,0.3);g.restore()}
 g.save();g.clip(P);
 g.fillStyle=o.base||'#3D7FD0';g.fillRect(x-r*3,y-r*4,r*6,r*7);
 if(o.refr){g.save();const m=o.mag??0.38;g.translate(x+(o.ox||0),y+(o.oy||0));g.scale(-m,-m);g.translate(-(o.cx??x),-(o.cy??y));o.refr();g.restore()}
 if(o.raw)o.raw();
 if(o.tint){g.fillStyle=C_c(o.tint,o.tintA??0.25);g.fillRect(x-r*3,y-r*4,r*6,r*7)}
 // volume: dark rim (total internal reflection), brighter core opposite the light
 let gr=g.createRadialGradient(x-lx*r*0.18,y-ly*r*0.18+r*0.05,r*0.25,x,y,r*1.08*Math.max(sx,sy));gr.addColorStop(0,`rgba(${rim},0)`);gr.addColorStop(0.62,`rgba(${rim},${0.12*(o.vol??1)})`);gr.addColorStop(0.9,`rgba(${rim},${0.5*(o.vol??1)})`);gr.addColorStop(1,`rgba(${rim},${0.78*(o.vol??1)})`);g.fillStyle=gr;g.fillRect(x-r*3,y-r*4,r*6,r*7);
 // caustic: the light focused on the far (shadow) side
 g.globalCompositeOperation='screen';const cx=x-lx*r*0.48,cy=y-ly*r*0.5;gr=g.createRadialGradient(cx,cy,0,cx,cy,r*0.62);gr.addColorStop(0,`rgba(255,255,255,${0.75*(o.caus??1)})`);gr.addColorStop(0.45,`rgba(200,240,255,${0.32*(o.caus??1)})`);gr.addColorStop(1,'rgba(200,240,255,0)');g.fillStyle=gr;g.fillRect(x-r*3,y-r*4,r*6,r*7);
 // fresnel sheen near the lit edge
 g.globalCompositeOperation='source-over';g.strokeStyle='rgba(255,255,255,0.22)';g.lineWidth=r*0.16;g.beginPath();g.ellipse(x,y,r*0.86*sx,r*0.86*sy,0,la-0.75,la+0.75);g.stroke();
 g.restore();
 // crisp edge: dark on the lit side, bright on the caustic side
 g.lineWidth=Math.max(0.8,r*0.035);g.strokeStyle=`rgba(${rim},0.55)`;g.stroke(P);
 g.save();g.clip(P);g.strokeStyle='rgba(235,250,255,0.75)';g.lineWidth=Math.max(0.8,r*0.05);g.beginPath();g.ellipse(x,y,r*0.95*sx,r*0.95*sy,0,la+Math.PI-0.95,la+Math.PI+0.95);g.stroke();g.restore();
 // speculars: the window glint and a hard sun/moon dot
 const sp=o.spec??1;if(sp>0){const hx=x+lx*r*0.5*sx,hy=y+ly*r*0.5*sy;g.save();g.globalAlpha*=sp;glow(hx,hy,r*0.55,'255,255,255',0.5,0.35);g.translate(hx,hy);g.rotate(la+Math.PI/2);g.fillStyle='rgba(255,255,255,0.97)';g.beginPath();g.ellipse(0,0,r*0.2,r*0.1,0,0,7);g.fill();
  g.fillStyle='rgba(255,255,255,0.9)';g.beginPath();g.arc(r*0.3,r*0.12,r*0.045,0,7);g.fill();g.restore();
  g.fillStyle=`rgba(255,255,255,${0.55*sp})`;g.beginPath();g.ellipse(x-lx*r*0.62*sx,y-ly*r*0.62*sy,r*0.07,r*0.035,la+Math.PI/2,0,7);g.fill()}
 g.restore()}
// cheap sessile bead (glass / leaf): colour of what is behind it, dark top edge, caustic glow below, specular dot
const CR_BS={};
function CR_beadSprite(col){const k=C_s(col);if(CR_BS[k])return CR_BS[k];const c=mkC(96,96),x=c.getContext('2d'),C=C_col(col),r=40,cx=48,cy=48;
 x.fillStyle='rgba(0,10,30,0.18)';x.beginPath();x.ellipse(cx+3,cy+5,r,r,0,0,7);x.fill();
 const gr=x.createRadialGradient(cx+r*0.15,cy+r*0.35,r*0.05,cx,cy,r);gr.addColorStop(0,C_c(C_mx(C,C_WH,0.62)));gr.addColorStop(0.45,C_c(C_mx(C,C_WH,0.2)));gr.addColorStop(0.85,C_c(C_mx(C,C_BK,0.35)));gr.addColorStop(1,C_c(C_mx(C,C_BK,0.62)));
 x.fillStyle=gr;x.beginPath();x.arc(cx,cy,r,0,7);x.fill();x.strokeStyle=C_c(C_mx(C,C_BK,0.6),0.6);x.lineWidth=2;x.stroke();
 x.strokeStyle='rgba(255,255,255,0.55)';x.lineWidth=3;x.beginPath();x.arc(cx,cy,r*0.86,0.35,Math.PI-0.35);x.stroke();
 x.fillStyle='rgba(255,255,255,0.97)';x.beginPath();x.ellipse(cx-r*0.36,cy-r*0.4,r*0.2,r*0.12,-0.7,0,7);x.fill();x.beginPath();x.arc(cx-r*0.08,cy-r*0.55,r*0.06,0,7);x.fill();
 return CR_BS[k]=c}
function CR_bead(x,y,r,col,a=1,sx=1,sy=1){if(r<0.6||a<=0.01)return;const sp=CR_beadSprite(col),pa=g.globalAlpha;g.globalAlpha=pa*a;g.drawImage(sp,x-r*1.2*sx,y-r*1.2*sy,r*2.4*sx,r*2.4*sy);g.globalAlpha=pa}

// =====================================================================================================================
// 3. Cached bokeh backgrounds (blurred foliage / dusk lights / overcast), drawn at half size and scaled up.
// =====================================================================================================================
function CR_bokeh(kind){return B_canvas('CRbk_'+kind,360,640,(x,w,h)=>{const r=RNG(kind.length*911+kind.charCodeAt(0));
 const K={leaf:{top:'#CFE9F6',bot:'#2F7D3E',sky:['#F4FBFF','#DDF0FA','#BFE3F2'],leaf:['#1E6A2E','#2E8A3A','#46A848','#6DC25A','#9AD86E','#1A5A34'],fl:['#F59AC8','#C58BEA','#FFFFFF'],n:70},
  blue:{top:'#3E6FC4',bot:'#14445E',sky:['#9FD6F0','#7FC1EA','#C8ECF6'],leaf:['#0F4A4E','#1A6A5E','#26846A','#3FA27A','#62B88A','#123C52'],fl:['#B58BF0','#F09AC8','#BFEFFF'],n:70},
  dusk:{top:'#1C2F7E',bot:'#22406E',sky:['#5E7FD8','#8FA8EE','#76D0E4'],leaf:['#10244E','#162F62','#1E3C70','#213F6A','#0D1C40'],fl:['#FFB46E','#FF8FB0','#8EE0F0','#FFE29A','#C9A2FF'],n:40},
  over:{top:'#B9C6D6',bot:'#3E6A58',sky:['#E6ECF2','#D2DCE6','#C4D0DC'],leaf:['#2E5E4A','#3C7458','#4F8A66','#6AA07A','#86B48E','#28503F'],fl:['#C9A6E8','#F2B0CE','#FFFFFF'],n:65}}[kind];
 let gr=x.createLinearGradient(0,0,0,h);gr.addColorStop(0,K.top);gr.addColorStop(1,K.bot);x.fillStyle=gr;x.fillRect(0,0,w,h);
 x.filter='blur(14px)';for(let i=0;i<14;i++){x.fillStyle=K.sky[i%3];x.beginPath();x.ellipse(r()*w,r()*h*0.75,30+r()*60,30+r()*70,r()*3,0,7);x.fill()}
 x.filter='blur(9px)';for(let i=0;i<K.n;i++){const px=r()*w,py=r()*h,s=12+r()*34,a=r()*6.28;x.fillStyle=K.leaf[Math.floor(r()*K.leaf.length)];x.save();x.translate(px,py);x.rotate(a);x.beginPath();x.ellipse(0,0,s,s*0.42,0,0,7);x.fill();x.restore()}
 x.filter='blur(4px)';for(let i=0;i<26;i++){const px=r()*w,py=r()*h,s=6+r()*16;x.globalAlpha=0.25+r()*0.35;x.fillStyle=K.sky[i%3];x.beginPath();x.arc(px,py,s,0,7);x.fill()}
 x.globalAlpha=1;x.filter='blur(3px)';for(let i=0;i<(kind==='dusk'?34:10);i++){const px=r()*w,py=(kind==='dusk'?0.35+r()*0.65:r())*h,s=(kind==='dusk'?6:3)+r()*(kind==='dusk'?14:7);const c=K.fl[Math.floor(r()*K.fl.length)];x.globalAlpha=0.55+r()*0.4;x.fillStyle=c;x.beginPath();x.arc(px,py,s,0,7);x.fill();x.globalAlpha*=0.6;x.strokeStyle='rgba(255,255,255,0.7)';x.lineWidth=1.2;x.stroke()}
 x.globalAlpha=1;x.filter='none'})}
function CR_bk(kind,dx=0,dy=0,z=1){const c=CR_bokeh(kind);g.save();g.translate(W/2+dx,H/2+dy);g.scale(z,z);g.drawImage(c,-W/2-40,-H/2-60,W+80,H+120);g.restore()}

// =====================================================================================================================
// 4. Small helpers
// =====================================================================================================================
// soft out-of-focus foreground drops drifting down (depth)
function CR_fgBokeh(t,n,seed,a=1,col='210,235,255'){const r=RNG(seed);g.save();g.globalCompositeOperation='screen';for(let i=0;i<n;i++){const x=r()*W,sp=40+r()*70,ph=r()*1600,y=((ph+t*sp)%1600)-160,s=18+r()*40;glow(x,y,s,col,(0.1+r()*0.12)*a,0.75);
 g.strokeStyle=`rgba(${col},${0.12*a})`;g.lineWidth=1.5;g.beginPath();g.arc(x,y,s*0.62,0,7);g.stroke()}g.restore()}
// a motion streak above a falling drop
function CR_streak(x,y,r,len,a=1){if(len<2)return;g.save();const gr=g.createLinearGradient(x,y-len,x,y-r);gr.addColorStop(0,'rgba(220,240,255,0)');gr.addColorStop(1,`rgba(220,240,255,${0.45*a})`);g.strokeStyle=gr;g.lineWidth=r*0.55;g.lineCap='round';g.beginPath();g.moveTo(x,y-len);g.lineTo(x,y-r*1.2);g.stroke();g.restore()}
const CR_vig=(a,col)=>vignette(a,col);

// =====================================================================================================================
// 5. More shared art: environment refraction, glass beads, the macro leaf, bubbles, underwater + caustic floor shaders,
//    the little world inside the big drop (lens-distorted once, cached).
// =====================================================================================================================
// what a drop in the open air shows (CR_drop flips it): sky above the horizon hy, land or sea below, the light source
function CR_envR(t,hy,o={}){const S=CSKY(t),L=C_lightPos(t),gc=o.ground||C_tint('#3E9A48',t);
 return ()=>{let gr=g.createLinearGradient(0,hy-900,0,hy);gr.addColorStop(0,C_c(S.top));gr.addColorStop(0.55,C_c(S.mid));gr.addColorStop(1,C_c(C_mx(S.hz,C_WH,0.3)));g.fillStyle=gr;g.fillRect(-3*W,hy-4*H,7*W,4*H);
  gr=g.createLinearGradient(0,hy-160,0,hy+700);gr.addColorStop(0,C_c(C_mx(S.hz,C_WH,0.3),0));gr.addColorStop(0.2,C_c(C_mx(gc,S.hz,0.55),0.85));gr.addColorStop(0.45,C_c(C_mx(gc,S.mid,0.25)));gr.addColorStop(1,C_c(C_mx(gc,C_BK,0.4)));g.fillStyle=gr;g.fillRect(-3*W,hy-160,7*W,4*H);
  if(o.light!==false)glow(o.lx??L.x,Math.min(o.ly??L.y,hy-60),o.lr??220,C_s(C_mx(S.lc,C_WH,0.5)),0.8,0.3)}}
// a clear bead of water on glass: see-through body, dark rim, bright refracted crescent below, specular dot
const CR_GB={};
function CR_glassSprite(k){if(CR_GB[k])return CR_GB[k];const c=mkC(96,96),x=c.getContext('2d'),cx=48,cy=48,r=40;
 let gr=x.createRadialGradient(cx,cy+r*0.15,r*0.2,cx,cy,r);gr.addColorStop(0,'rgba(255,255,255,0.06)');gr.addColorStop(0.68,'rgba(12,30,70,0.1)');gr.addColorStop(0.9,'rgba(6,16,44,0.5)');gr.addColorStop(1,'rgba(6,16,44,0.72)');
 x.fillStyle=gr;x.beginPath();x.arc(cx,cy,r,0,7);x.fill();
 gr=x.createRadialGradient(cx,cy+r*0.55,0,cx,cy+r*0.55,r*0.7);gr.addColorStop(0,k?'rgba(255,206,150,0.75)':'rgba(215,245,255,0.7)');gr.addColorStop(1,'rgba(215,245,255,0)');x.fillStyle=gr;x.beginPath();x.arc(cx,cy,r*0.92,0,7);x.fill();
 x.strokeStyle=k?'rgba(255,224,186,0.95)':'rgba(232,250,255,0.95)';x.lineWidth=4;x.lineCap='round';x.beginPath();x.arc(cx,cy,r*0.8,0.5,Math.PI-0.5);x.stroke();
 x.fillStyle='rgba(255,255,255,0.97)';x.beginPath();x.ellipse(cx-r*0.36,cy-r*0.42,r*0.18,r*0.1,-0.7,0,7);x.fill();x.beginPath();x.arc(cx-r*0.05,cy-r*0.6,r*0.05,0,7);x.fill();
 return CR_GB[k]=c}
function CR_gbead(x,y,r,a=1,k=0,sx=1,sy=1){if(r<0.8||a<=0.01)return;const pa=g.globalAlpha;g.globalAlpha=pa*a;g.drawImage(CR_glassSprite(k),x-r*1.2*sx,y-r*1.2*sy,r*2.4*sx,r*2.4*sy);g.globalAlpha=pa}
// a rising air bubble (underwater)
const CR_BUB=(()=>{let c=null;return ()=>{if(c)return c;c=mkC(64,64);const x=c.getContext('2d');const gr=x.createRadialGradient(32,36,4,32,32,28);gr.addColorStop(0,'rgba(200,245,255,0.05)');gr.addColorStop(0.8,'rgba(200,245,255,0.18)');gr.addColorStop(1,'rgba(235,252,255,0.9)');x.fillStyle=gr;x.beginPath();x.arc(32,32,28,0,7);x.fill();
 x.fillStyle='rgba(255,255,255,0.95)';x.beginPath();x.ellipse(23,22,6,3.5,-0.7,0,7);x.fill();x.strokeStyle='rgba(255,255,255,0.6)';x.lineWidth=2;x.beginPath();x.arc(32,32,22,0.6,1.6);x.stroke();return c}})();
function CR_bubbles(t,n,seed,sp,a=1,y0=-100,y1=H+100){const r=RNG(seed),c=CR_BUB(),span=y1-y0;g.save();for(let i=0;i<n;i++){const s=3+r()*r()*14,v=sp*(0.6+r()*0.8)*(0.6+s/14),ph=r()*span,y=y1-((ph+t*v)%span),x=r()*W+Math.sin(t*2.2+i*1.7)*6*(s/8);g.globalAlpha=a*(0.55+0.45*r());g.drawImage(c,x-s,y-s,2*s,2*s)}g.restore()}

// the macro leaf: glossy green, midrib, veins, sheen, water beads. tip at (w-14, h*0.56) in canvas pixels
function CR_leafArt(v){if(v)return B_canvas('CRleaf_'+v,1200,520,(x)=>{x.filter=v==='blue'?'hue-rotate(14deg) brightness(0.86) saturate(1.05)':v==='over'?'hue-rotate(6deg) brightness(0.92) saturate(0.85)':'none';x.drawImage(CR_leafArt(),0,0);x.filter='none'});
 return B_canvas('CRleaf',1200,520,(x,w,h)=>{const r=RNG(77),bx=24,by=h*0.5,tx=w-14,ty=h*0.56;
 const P=new Path2D();P.moveTo(bx,by);P.bezierCurveTo(w*0.22,by-h*0.6,w*0.7,by-h*0.46,tx,ty);P.bezierCurveTo(w*0.7,by+h*0.42,w*0.25,by+h*0.52,bx,by);P.closePath();
 x.save();x.filter='blur(12px)';x.fillStyle='rgba(0,24,14,0.32)';x.translate(8,18);x.fill(P);x.restore();
 let gr=x.createLinearGradient(0,by-h*0.44,0,by+h*0.46);gr.addColorStop(0,'#2A8C3C');gr.addColorStop(0.4,'#6ACB4C');gr.addColorStop(0.52,'#55BC45');gr.addColorStop(1,'#145A2A');x.fillStyle=gr;x.fill(P);
 x.save();x.clip(P);gr=x.createLinearGradient(0,0,w,0);gr.addColorStop(0,'rgba(8,56,30,0.4)');gr.addColorStop(0.55,'rgba(255,255,190,0.06)');gr.addColorStop(1,'rgba(8,56,30,0.2)');x.fillStyle=gr;x.fillRect(0,0,w,h);
 for(let i=0;i<70;i++){x.fillStyle=r()<0.5?'rgba(170,236,120,0.08)':'rgba(8,64,30,0.1)';x.beginPath();x.ellipse(r()*w,r()*h,20+r()*60,8+r()*26,r()*3,0,7);x.fill()}
 const mid=u=>[bx+(tx-bx)*u,by+(ty-by)*u-Math.sin(Math.PI*u)*h*0.06];x.lineCap='round';
 for(let i=1;i<13;i++){const u=i/13.6,[mx,my]=mid(u);for(const sd of [-1,1]){const len=h*0.44*Math.sin(Math.PI*(u*0.86+0.07));
  x.strokeStyle='rgba(196,244,146,0.42)';x.lineWidth=3;x.beginPath();x.moveTo(mx,my);x.quadraticCurveTo(mx+len*0.32,my+sd*len*0.42,mx+len*0.8,my+sd*len*0.9);x.stroke();
  x.strokeStyle='rgba(8,56,24,0.28)';x.lineWidth=2;x.beginPath();x.moveTo(mx+2,my+sd*4);x.quadraticCurveTo(mx+len*0.32+2,my+sd*len*0.42+4,mx+len*0.8+2,my+sd*len*0.9+4);x.stroke()}}
 x.strokeStyle='#D2F4A4';x.lineWidth=8;x.beginPath();for(let i=0;i<=40;i++){const [mx,my]=mid(i/40*0.97);i?x.lineTo(mx,my):x.moveTo(mx,my)}x.stroke();
 x.strokeStyle='rgba(16,76,30,0.5)';x.lineWidth=2.5;x.beginPath();for(let i=0;i<=40;i++){const [mx,my]=mid(i/40*0.97);i?x.lineTo(mx,my+6):x.moveTo(mx,my+6)}x.stroke();
 x.filter='blur(16px)';x.fillStyle='rgba(255,255,255,0.24)';x.beginPath();x.ellipse(w*0.46,by-h*0.18,w*0.3,h*0.075,-0.05,0,7);x.fill();
 x.filter='blur(3px)';x.fillStyle='rgba(255,255,255,0.45)';x.beginPath();x.ellipse(w*0.4,by-h*0.25,w*0.17,h*0.02,-0.08,0,7);x.fill();x.filter='none';x.restore();
 x.strokeStyle='rgba(10,58,24,0.9)';x.lineWidth=3;x.stroke(P);
 x.save();x.clip(P);x.strokeStyle='rgba(220,255,180,0.55)';x.lineWidth=3;x.beginPath();x.moveTo(bx+40,by-h*0.2);x.bezierCurveTo(w*0.25,by-h*0.56,w*0.68,by-h*0.44,tx-6,ty-3);x.stroke();x.restore();
 const pg=g;g=x;try{x.setTransform(1,0,0,1,0,0);for(let i=0;i<60;i++){const px=60+r()*(w-160),py=r()*h,rr=4+r()*r()*17;if(!x.isPointInPath(P,px,py)||!x.isPointInPath(P,px+rr,py+rr)||!x.isPointInPath(P,px-rr,py-rr))continue;CR_bead(px,py,rr,r()<0.5?'#5CC24A':'#3FA63E',0.95)}}finally{g=pg}})}
// place the leaf with its tip at (tx,ty), pointing along ang (base -> tip), L logical px long
function CR_leaf(tx,ty,L,ang,v,a=1){const c=CR_leafArt(v),k=L/(c.width-38);g.save();g.globalAlpha*=a;g.translate(tx,ty);g.rotate(ang);g.scale(k,k);g.drawImage(c,-(c.width-14),-c.height*0.56);g.restore()}

// underwater, looking up and through the water column: Snell surface with caustics at the top, light shafts, depth colour
const CR_UWFS=`#version 300 es
precision highp float;
in vec2 uv;out vec4 o;uniform vec2 res;
${GLSL_NOISE}
uniform float T,SY,DEP,CALM;
uniform vec3 C0,C1,C2,C3,LC;
vec2 h22(vec2 p){return vec2(h21(p),h21(p+19.19));}
float cellE(vec2 p,float t){vec2 i=floor(p),f=fract(p);float d1=9.,d2=9.;
 for(int yy=-1;yy<=1;yy++)for(int xx=-1;xx<=1;xx++){vec2 b=vec2(float(xx),float(yy)),hh=h22(i+b);vec2 q=b+0.5+0.4*sin(t*(0.7+hh*0.9)+hh*6.2831)-f;float d=dot(q,q);if(d<d1){d2=d1;d1=d;}else if(d<d2){d2=d;}}
 return sqrt(d2)-sqrt(d1);}
float caus(vec2 p,float t){p+=0.5*vec2(vn(p*0.7+vec2(t*0.15,0.)),vn(p*0.7+vec2(4.1,t*0.12)))-0.25;return pow(1.-smoothstep(0.,0.34,cellE(p,t)),2.6);}
void main(){vec2 P=vec2(uv.x*720.,(1.-uv.y)*1280.);float y=P.y;
 float d=clamp((y-SY)/1300.+DEP,0.,1.);
 vec3 col=mix(mix(C0,C1,smoothstep(0.,0.35,d)),mix(C2,C3,smoothstep(0.55,1.,d)),smoothstep(0.25,0.7,d));
 if(y<SY){float dy=SY-y+4.;vec2 w=vec2((P.x-360.)/dy,260./dy)*3.2;float c=caus(w,T*0.9);float fr=smoothstep(0.,170.,dy);
  col=mix(C1*1.05,mix(C0,LC,0.4),0.45+0.55*fr)+LC*c*0.6*fr;}
 else{vec2 src=vec2(360.+sin(T*0.17)*60.,SY-560.);vec2 v=P-src;float ang=atan(v.x,v.y);
  float r=pow(0.5+0.5*sin(ang*19.+T*0.45+3.*vn(vec2(ang*5.,T*0.25))),5.)+0.7*pow(0.5+0.5*sin(ang*33.-T*0.35+1.7),9.);
  float f=exp(-(y-SY)/620.)*smoothstep(0.,70.,y-SY);float calm=1.-CALM*smoothstep(690.,770.,y)*(1.-smoothstep(840.,930.,y));
  col+=LC*r*0.2*f*calm+LC*0.06*caus(P*0.012+vec2(0.,T*0.05),T*0.6)*f*calm;}
 o=vec4(col,1.);}`;
function CR_under(t,sy,dep,o={}){const U={T:t,SY:sy,DEP:dep,CALM:o.calm??0.7,C0:CR_c3(o.c0||'#7FE6F2'),C1:CR_c3(o.c1||'#1FA9C9'),C2:CR_c3(o.c2||'#1E5DB4'),C3:CR_c3(o.c3||'#1C1C6A'),LC:CR_c3(o.lc||'#EAFBFF')};
 const cv=GL.run('CR_under',CR_UWFS,U,{},PW,PH);g.drawImage(cv,0,0,W,H);return cv}
// seagrass ribbons swaying at the frame edges (colour at depth)
function CR_weed(t,yb,a=1){const r=RNG(61);g.save();g.globalAlpha*=a;g.lineCap='round';for(let i=0;i<14;i++){const side=i%2,x=side?W-r()*150:r()*150,h=180+r()*260,w=8+r()*10,c=['#1E8C78','#2BA486','#3BB98C','#177066'][i%4];
 g.strokeStyle=c;g.lineWidth=w;g.beginPath();g.moveTo(x,yb+40);for(let k=1;k<=8;k++){const u=k/8;g.lineTo(x+Math.sin(t*1.1+i*1.3+u*3)*22*u+(side?-1:1)*u*30,yb+40-h*u)}g.stroke()}g.restore()}

// the floor seen from above under a thin sheet of water: aqua tiles of light (caustic web, RGB split = rainbow fringes)
const CR_CFFS=`#version 300 es
precision highp float;
in vec2 uv;out vec4 o;uniform vec2 res;
${GLSL_NOISE}
uniform float T,CALM;uniform vec3 B0,B1,LC;
vec2 h22(vec2 p){return vec2(h21(p),h21(p+19.19));}
float cellE(vec2 p,float t){vec2 i=floor(p),f=fract(p);float d1=9.,d2=9.;
 for(int yy=-1;yy<=1;yy++)for(int xx=-1;xx<=1;xx++){vec2 b=vec2(float(xx),float(yy)),hh=h22(i+b);vec2 q=b+0.5+0.4*sin(t*(0.7+hh*0.9)+hh*6.2831)-f;float d=dot(q,q);if(d<d1){d2=d1;d1=d;}else if(d<d2){d2=d;}}
 return sqrt(d2)-sqrt(d1);}
float caus(vec2 p,float t){p+=0.8*vec2(vn(p*0.45+vec2(t*0.12,0.)),vn(p*0.45+vec2(4.1,t*0.1)))-0.4;p+=0.25*vec2(vn(p*1.3+9.),vn(p*1.3+2.))-0.12;return pow(1.-smoothstep(0.,0.17,cellE(p,t)),2.2);}
float cw(vec2 p,float t){vec2 i=p;float c=1.;for(int n=0;n<5;n++){float tt=t*(1.-3.5/float(n+1));i=p+vec2(cos(tt-i.x)+sin(tt+i.y),sin(tt-i.y)+cos(tt+i.x));c+=1./length(vec2(p.x/(sin(i.x+tt)/0.006),p.y/(cos(i.y+tt)/0.006)));}
 c/=5.;c=1.17-pow(c,1.4);return clamp(pow(abs(c),8.),0.,1.2);}
void main(){vec2 P=vec2(uv.x*720.,(1.-uv.y)*1280.);vec2 q=P/86.;
 vec3 base=mix(B0,B1,smoothstep(0.,1280.,P.y+120.*(vn(P*0.004)-0.5)));base*=0.92+0.16*fbm(P*0.01);
 float calm=1.-CALM*smoothstep(640.,770.,P.y)*(1.-smoothstep(845.,975.,P.y));
 vec2 w=P*0.0085-vec2(250.);float tt=T*0.55+23.;float r=cw(w,tt),gg=cw(w+vec2(0.007,0.005),tt),b=cw(w+vec2(0.014,0.01),tt);float r2=caus(q*0.9+7.,T*0.8);
 vec3 c=vec3(r,gg,b)*0.75+vec3(r2)*0.12;o=vec4(base+LC*c*0.62*calm,1.);}`;
function CR_floor(t,o={}){const cv=GL.run('CR_floor',CR_CFFS,{T:t,CALM:o.calm??0.4,B0:CR_c3(o.b0||'#7DDCE0'),B1:CR_c3(o.b1||'#2E9FB8'),LC:CR_c3(o.lc||'#F4FFFF')},{},PW,PH);g.drawImage(cv,0,0,W,H);return cv}
// keep a copy of a GL result (GL.run reuses one canvas)
const CR_CP={};function CR_copy(key,cv){let c=CR_CP[key];if(!c){c=mkC(PW,PH);CR_CP[key]=c}const x=c.getContext('2d');x.setTransform(1,0,0,1,0,0);x.clearRect(0,0,PW,PH);x.drawImage(cv,0,0);return c}

// the small bright world seen inside the big drop: painted once, then bent through a lens (fisheye) into a disc
function CR_worldFlat(){return B_canvas('CRworldF',512,512,(x,w,h)=>{const pg=g;g=x;try{x.setTransform(w/720,0,0,h/720,0,0);const T0=80;
 let gr=x.createLinearGradient(0,0,0,420);gr.addColorStop(0,'#2F7FE6');gr.addColorStop(0.55,'#7EC6F6');gr.addColorStop(1,'#FFE7BE');x.fillStyle=gr;x.fillRect(0,0,720,720);
 C_sun(470,250,46,0,{rays:true});C_rays(470,250,{a:0.3,ang:2.2,spread:2.4,n:8,len:600,t:0});
 C_cloud(170,215,230,{seed:3,lit:'#FFFFFF',shade:'#C9DAF2',t:T0});C_cloud(600,150,170,{seed:5,lit:'#FFFFFF',shade:'#CFDDF4',t:T0});
 C_rainbow(330,470,190,1,{a:0.5});
 C_hills(T0,430,{n:3,amp:46,gap:34,seed:5,trees:7,treeS:34,flowers:0,x0:-40,x1:760,bot:760,tint:false,cols:[['#9ED9B2','#7CC197'],['#78CE5C','#45A04A'],['#4FB548','#2E8538']]});
 // a winding river
 const R=new Path2D();R.moveTo(330,452);R.bezierCurveTo(300,520,440,560,380,620);R.bezierCurveTo(330,670,420,700,400,760);R.lineTo(520,760);R.bezierCurveTo(520,700,430,660,470,610);R.bezierCurveTo(520,550,360,510,350,452);R.closePath();
 gr=x.createLinearGradient(0,450,0,760);gr.addColorStop(0,'#BFEAFF');gr.addColorStop(1,'#3E98E6');x.fillStyle=gr;x.fill(R);x.strokeStyle='rgba(255,255,255,0.6)';x.lineWidth=3;x.stroke(R);
 const rr=RNG(19),FC=['#C58BEA','#F49AC6','#FFE36A','#FFFFFF','#FF9E7A'];for(let i=0;i<26;i++){C_flower(20+rr()*680,560+rr()*160,5+rr()*5,{t:T0,tint:false,col:FC[i%5],petals:5})}
 C_tree(120,640,0.42,{p:1,seed:4,t:T0,tint:false,flowers:4});
 }finally{g=pg}})}
function CR_world(){return B_canvas('CRworld',420,420,(x,w,h)=>{const src=CR_worldFlat().getContext('2d').getImageData(0,0,512,512).data,img=x.createImageData(w,h),d=img.data,R=w/2;
 for(let j=0;j<h;j++)for(let i=0;i<w;i++){const dx=(i+0.5-R)/R,dy=(j+0.5-R)/R,rn=Math.hypot(dx,dy),k=(j*w+i)*4;if(rn>1.04){d[k+3]=0;continue}const rc=Math.min(rn,1),s=rc*(0.5+0.5*rc*rc)/Math.max(rc,1e-6);
  let sx=256+dx*s*250,sy=256+dy*s*250;sx=Math.max(0,Math.min(510.99,sx));sy=Math.max(0,Math.min(510.99,sy));const x0=Math.floor(sx),y0=Math.floor(sy),fx=sx-x0,fy=sy-y0;
  for(let ch=0;ch<3;ch++){const a=src[(y0*512+x0)*4+ch],b=src[(y0*512+x0+1)*4+ch],c=src[((y0+1)*512+x0)*4+ch],e=src[((y0+1)*512+x0+1)*4+ch];d[k+ch]=(a*(1-fx)+b*fx)*(1-fy)+(c*(1-fx)+e*fx)*fy}d[k+3]=255}
 x.putImageData(img,0,0)})}
// speech envelope (0..1) from the word timings: the drop "speaks" while the teacher does
function CR_talk(t){let a=0;for(const d of [-0.08,-0.04,0,0.04])if(wordAt(t+d,0.25))a+=0.25;return a}


// a crown splash seen from above at any tilt (flat = ellipse ratio of the water's rings): translucent wall with a beaded rim,
// the dark cavity inside, fingers that throw beads, then the Worthington jet with its drop. ~1.2 s
function CR_crown(x,y,t,t0,s=1,o={}){const u=t-t0;if(u<0||u>1.3)return;const fy=o.flat??0.5,sd=(o.seed||7)%97,N=o.n||13,grow=eo(cl(u/0.42)),R0=(12+u*40)*s,R1=R0*1.32+10*s*grow,Hc=50*s*Math.sin(Math.PI*cl(u/0.6))*(1-0.4*fy),fade=cl(1-(u-0.45)/0.3);
 g.save();g.lineJoin='round';g.lineCap='round';
 const hh=a=>Hc*(0.85+0.1*Math.sin(3*a+sd)+0.08*Math.sin(7*a+sd*2.1)),top=a=>[x+Math.cos(a)*R1,y+Math.sin(a)*R1*fy-hh(a)];
 // cavity
 if(fade>0){const cg=g.createRadialGradient(x,y-R0*fy*0.2,0,x,y,R0);cg.addColorStop(0,`rgba(6,26,80,${0.55*fade})`);cg.addColorStop(0.8,`rgba(20,70,160,${0.4*fade})`);cg.addColorStop(1,`rgba(160,220,255,${0.5*fade})`);g.fillStyle=cg;g.beginPath();g.ellipse(x,y,R0,R0*fy,0,0,7);g.fill()}
 const wall=(front)=>{if(Hc<1.5||fade<=0)return;const a0=front?0:Math.PI,st=24;g.beginPath();for(let i=0;i<=st;i++){const [px,py]=top(a0+Math.PI*i/st);i?g.lineTo(px,py):g.moveTo(px,py)}for(let i=st;i>=0;i--){const a=a0+Math.PI*i/st;g.lineTo(x+Math.cos(a)*R0,y+Math.sin(a)*R0*fy)}g.closePath();
  const gr=g.createLinearGradient(0,y-Hc-R1*fy,0,y+R0*fy);gr.addColorStop(0,`rgba(245,253,255,${(front?0.78:0.5)*fade})`);gr.addColorStop(0.45,`rgba(160,222,255,${(front?0.42:0.26)*fade})`);gr.addColorStop(1,`rgba(60,140,225,${(front?0.6:0.36)*fade})`);g.fillStyle=gr;g.fill();
  g.strokeStyle=`rgba(255,255,255,${(front?0.9:0.55)*fade})`;g.lineWidth=1.8*s;g.beginPath();for(let i=0;i<=st;i++){const [px,py]=top(a0+Math.PI*i/st);i?g.lineTo(px,py):g.moveTo(px,py)}g.stroke();
  if(front){g.strokeStyle=`rgba(255,255,255,${0.35*fade})`;g.lineWidth=3*s;g.beginPath();for(let i=2;i<=st*0.45;i++){const a=a0+Math.PI*i/st;g.lineTo(x+Math.cos(a)*lerp(R0,R1,0.5),y+Math.sin(a)*lerp(R0,R1,0.5)*fy-hh(a)*0.55)}g.stroke()}};
 const fingers=(front)=>{if(Hc<2||fade<=0)return;for(let i=0;i<N;i++){const a=i/N*Math.PI*2+sd*0.37+0.3*hash(i+sd),sa=Math.sin(a);if((sa>0)!==front)continue;const [bx,by]=top(a),fl=Hc*(0.25+0.4*hash(i*1.7+sd)),tx=bx+Math.cos(a)*fl*0.45,ty=by-fl+Math.sin(a)*fl*0.2*fy,w0=4*s;
  g.beginPath();g.moveTo(bx-w0,by+2*s);g.quadraticCurveTo(bx+(tx-bx)*0.35-w0*0.25,by-fl*0.55,tx,ty);g.quadraticCurveTo(bx+(tx-bx)*0.35+w0*0.25,by-fl*0.5,bx+w0,by+2*s);g.closePath();g.fillStyle=`rgba(236,250,255,${0.85*fade})`;g.fill();
  if(u<0.48)B_drop(tx,ty-2*s,(2.2+1.5*hash(i*5.3+sd))*s,fade,true)}};
 wall(false);fingers(false);
 if(u>0.3){const ju=cl((u-0.3)/0.8),hj=78*s*Math.sin(Math.PI*ju);if(hj>2){g.beginPath();g.moveTo(x-6.5*s,y);g.bezierCurveTo(x-3*s,y-hj*0.45,x-1.6*s,y-hj*0.8,x,y-hj);g.bezierCurveTo(x+1.6*s,y-hj*0.8,x+3*s,y-hj*0.45,x+6.5*s,y);g.closePath();const jg=g.createLinearGradient(0,y-hj,0,y);jg.addColorStop(0,'rgba(246,253,255,0.95)');jg.addColorStop(1,'rgba(110,190,245,0.45)');g.fillStyle=jg;g.fill();
  g.strokeStyle='rgba(255,255,255,0.7)';g.lineWidth=1.2*s;g.beginPath();g.moveTo(x-2.4*s,y-hj*0.2);g.quadraticCurveTo(x-1.2*s,y-hj*0.7,x-0.3*s,y-hj*0.95);g.stroke();B_drop(x,y-hj-7*s,5*s,1,true)}}
 wall(true);fingers(true);
 if(u>0.42){const v=u-0.42;for(let i=0;i<N;i++){const a=i/N*Math.PI*2+sd*0.37+0.3*hash(i+sd),sp=(70+80*hash(i*9.1+sd))*s,px=x+Math.cos(a)*(R1+sp*v),py=y+Math.sin(a)*(R1+sp*v)*fy-Hc*0.9-(140*s)*v+520*v*v*(1-fy*0.5);B_drop(px,py,(1.9+1.6*hash(i*3.7+sd))*s,cl(1-v/0.7),true)}}
 g.restore()}
// =====================================================================================================================
// HOOK 0-1.76: a glossy drop falls into calm blue water; crown splash, rings, tiny jets; "And who / art thou?" on it
// =====================================================================================================================
const CR_HOOKW=[['And',0.06,0],['who',0.18,0],['art',0.32,0],['thou?',0.46,1]];
const CR_HK={hit:0.20,x:360,y:540,hz:-520};
const CR_HKPAL={hi:'#DCE0FF',mid:'#4C9AE8',lo:'#0F3E9C',body:'#0A2B72',lc:'#F6F9FF'};
const CR_HKAMB=[[150,330,-0.7,0.4,150,16],[590,250,-0.25,0.38,130,14],[600,930,-1.0,0.45,230,28],[110,1010,0.5,0.42,240,28],[520,400,0.95,0.35,150,16],[230,700,0.62,0.36,190,20]];
// a Worthington jet: a thin column with a bead on top, rising and falling back (raindrop2)
function CR_jet(x,y,t,t0,s,a=1){const u=t-t0-0.05;if(u<=0||u>0.8)return;const k=Math.sin(Math.PI*cl(u/0.62)),h=36*s*k;if(h<1.2)return;g.save();g.globalAlpha*=a;
 const jg=g.createLinearGradient(0,y-h,0,y);jg.addColorStop(0,'rgba(242,252,255,0.95)');jg.addColorStop(1,'rgba(120,190,245,0.3)');g.fillStyle=jg;
 g.beginPath();g.moveTo(x-3.4*s,y);g.bezierCurveTo(x-1.6*s,y-h*0.5,x-0.9*s,y-h*0.86,x,y-h);g.bezierCurveTo(x+0.9*s,y-h*0.86,x+1.6*s,y-h*0.5,x+3.4*s,y);g.closePath();g.fill();
 const bu=cl((u-0.12)/0.55);B_drop(x,y-h-4*s-bu*16*s*(1-bu)*2,2.8*s,1,true);g.restore()}
function CR_hookWorld(t){const {hit,x:ix,y:iy,hz}=CR_HK;
 const rings=[{x:ix,y:iy,t0:hit,s:0.66,sp:300,lam:30,dec:0.72,wid:46},{x:ix,y:iy,t0:hit+0.16,s:0.38,sp:250,lam:24,dec:0.9},{x:ix,y:iy,t0:hit+1.1,s:0.42,sp:210,lam:20,dec:1.1},
  ...CR_HKAMB.slice(0,5).map(([x,y,t0,s,sp,lam])=>({x,y,t0,s,sp,lam}))];
 const cv=CR_water(t,{hz,pal:CR_HKPAL,rings,rain:0.26,rsc:0.2,lp:[372,40],la:0.95,amp:0.032,ws:46,rim:0.3});
 // moon-silver sheen far away, a violet breath across the top, deep blue near
 g.save();g.globalCompositeOperation='screen';glow(372,-60,560,'170,200,255',0.34,0.25);glow(80,120,360,'170,140,255',0.16,0.3);glow(660,200,300,'120,220,255',0.12,0.3);g.restore();
 let gr=g.createLinearGradient(0,H*0.55,0,H);gr.addColorStop(0,'rgba(4,14,52,0)');gr.addColorStop(1,'rgba(4,14,52,0.42)');g.fillStyle=gr;g.fillRect(0,H*0.55,W,H*0.45);
 for(const [x,y,t0] of CR_HKAMB){const s=(y-hz)/(iy-hz);CR_jet(x,y,t,t0,s*1.1,0.95)}
 const refr=()=>g.drawImage(cv,0,0,W,H);
 if(t<hit){const f=t/hit,y=lerp(250,iy,Math.pow(f,1.12)),r=54;
  g.save();g.globalAlpha=0.3*(0.4+0.6*f);g.translate(ix,iy);g.scale(1,-0.9);g.translate(-ix,-iy);CR_drop(ix,y,r,{shape:'tear',tip:0.5,refr,spec:0.6,glow:false});g.restore();
  CR_streak(ix,y,r,190,0.85);CR_drop(ix,y,r,{shape:'tear',tip:0.6,sy:1.06,refr,mag:0.24,cx:ix,cy:iy+180,tint:[150,200,255],tintA:0.1})}
 else{const u=t-hit;g.save();g.globalCompositeOperation='screen';glow(ix,iy,300,'140,200,255',0.4*cl(1-u/0.9),0.3);g.restore();CR_crown(ix,iy,t,hit,2.5,{flat:0.62,seed:31})}
 B_rain(t,24,5,560,46,0.3,1.4);CR_fgBokeh(t,7,12,1,'190,215,255');
 CR_vig(0.42,'4,12,44')}
function CR_hookText(t){C_kin(t,CR_HOOKW,[[0,1],[2,3]],{cy:836,small:84,big:160,famB:FAM.bodoni});
 // the '?' carries a tiny glossy drop (it becomes the title's drop mark)
 const u=t-0.46;if(u>0.2){const a=cl((u-0.2)/0.25);g.save();g.globalCompositeOperation='screen';glow(560,962,26+4*Math.sin(t*6),'170,225,255',0.5*a,0.3);g.restore()}}
S.a1_hookdrop=(t,c)=>{CR_hookWorld(t);CR_hookText(t);grain(t,0.035)};
S.a1_hookq=(t,c)=>{CR_hookWorld(t);CR_hookText(t);grain(t,0.035)};

// =====================================================================================================================
// a1_mote (X, 21.16-22.5) 'the importance of': coloured motes with dark edges spiral in and become one glowing drop
// =====================================================================================================================
const CR_MOTEC=['120,226,255','150,186,255','200,160,255','255,168,214','140,250,222','255,226,150'];
S.a1_mote=(t,c)=>{const k=c.k,fy=538;Wbg(t,1.12,{moon:false,la:0.06});
 g.save();g.globalCompositeOperation='screen';glow(360,fy,330*eo(cl(k/1.2)),'90,130,255',0.22,0.3);g.restore();
 const r=RNG(3);for(let i=0;i<64;i++){const a0=r()*6.28,d0=120+r()*300,del=r()*0.3,f=eio(cl((k-del)/(1.25-del))),sd=r()<0.5?1:-1,ang=a0+f*1.9*sd,d=d0*(1-f),x=360+Math.cos(ang)*d,y=fy+Math.sin(ang)*d*0.82,s=(6+r()*9)*(1-0.55*f),tw=0.75+0.25*Math.sin(t*6+i);
  if(f<0.985)C_sparkle(x,y,s,tw,{col:CR_MOTEC[i%6],edge:'rgba(16,30,96,0.75)',rot:t*0.6+i})}
 const dr=44*eo(cl((k-0.7)/0.5));if(dr>1){g.save();g.globalCompositeOperation='screen';glow(360,fy,dr*4.4,'140,210,255',0.45,0.3);g.restore();
  CR_drop(360,fy,dr,{shape:'tear',tip:0.55,refr:CR_envR(t,fy+40),mag:0.16,cx:360,cy:fy+40,glowc:'150,220,255'});C_sparkle(360+dr*0.42,fy-dr*0.5,dr*0.42,cl((k-0.9)/0.2),{col:'200,240,255',edge:'rgba(16,30,96,0.6)'})}
 grain(t,0.04)};

// =====================================================================================================================
// a2_delve (C) / a2_deeper (C): dive through the poem page into luminous water; sinking past light shafts and bubbles
// =====================================================================================================================
function CR_page(){return B_canvas('CRpage',720,1000,(x,w,h)=>{const pg=g;g=x;try{x.setTransform(1,0,0,1,0,0);
 let gr=x.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#FFF9EC');gr.addColorStop(1,'#F2E6CF');x.fillStyle=gr;x.fillRect(0,0,w,h);
 const rf=RNG(5);for(let i=0;i<260;i++){x.strokeStyle=`rgba(${rf()<0.5?'180,150,110':'255,255,255'},${0.05+rf()*0.08})`;x.lineWidth=1;const fx=rf()*w,fy=rf()*h,fl=6+rf()*16,fa=rf()*3;x.beginPath();x.moveTo(fx,fy);x.lineTo(fx+Math.cos(fa)*fl,fy+Math.sin(fa)*fl);x.stroke()}
 x.save();x.beginPath();x.rect(40,0,w-80,h);x.clip();for(let i=0;i<11;i++){const y=150+i*68;g.font=F(27,FAM.text,'400','italic');g.fillStyle=i===0?'#1F4FB0':'#2A4E8E';g.textAlign='left';g.textBaseline='middle';g.fillText(POEM[i],70,y)}x.restore();
 x.strokeStyle='rgba(60,110,200,0.35)';x.lineWidth=2;for(let i=0;i<11;i++){x.beginPath();x.moveTo(60,172+i*68);x.lineTo(w-60,172+i*68);x.stroke()}
 x.fillStyle='rgba(120,150,210,0.25)';x.fillRect(0,0,w,8)}finally{g=pg}})}
S.a2_delve=(t,c)=>{const k=c.k,u=cl(k/1.04),z=1+3.4*Math.pow(eio(u),1.6),hole=cl((k-0.42)/0.55),S=CSKY(t);
 // beneath: the water the page opens onto
 CR_under(t,lerp(420,230,u),0.02,{calm:0.7});CR_bubbles(t,18,7,140,0.8);
 // the page, zooming in, with a liquid hole opening in its middle
 g.save();const hx=360,hy=600,HR=eo(hole)*900;
 if(HR>1){const P=new Path2D();P.rect(-W,-H,3*W,3*H);P.arc(hx,hy,HR,0,Math.PI*2,true);g.clip(P,'evenodd')}
 Wbg(t,1,{moon:false,hills:false,la:0.06});
 g.translate(hx,hy);g.scale(z,z);g.rotate(-0.04*(1-u));g.translate(-hx,-hy-k*30);
 g.save();g.shadowColor='rgba(10,20,60,0.45)';g.shadowBlur=40*SC;g.shadowOffsetY=16*SC;g.drawImage(CR_page(),40,180,640,890);g.restore();
 g.restore();
 if(HR>1){g.save();g.strokeStyle=`rgba(230,250,255,${0.9*(1-hole*0.6)})`;g.lineWidth=5;g.beginPath();g.arc(hx,hy,HR,0,7);g.stroke();g.strokeStyle='rgba(60,170,230,0.6)';g.lineWidth=12;g.beginPath();g.arc(hx,hy,HR+9,0,7);g.stroke();
  for(let j=1;j<4;j++){const R=HR+j*26+((t*90)%26);g.strokeStyle=`rgba(40,110,200,${0.28/j})`;g.lineWidth=2;g.beginPath();g.arc(hx,hy,R,0,7);g.stroke()}g.restore()}
 if(hole<=0){const pk=cl((k-0.3)/0.12);if(pk>0){C_ripples(hx,hy,t,c.t0+0.3,{n:3,sc:1.4,flat:0.9,life:0.6,speed:220,dark:'40,90,190'});B_drop(hx,hy-30*(1-pk),10,1-pk,false)}}
 grain(t,0.04)};
S.a2_deeper=(t,c)=>{const k=c.k,u=cl(k/1.02),sy=lerp(240,-280,eio(u)),dep=lerp(0.05,0.3,u);
 CR_under(t,sy,dep,{calm:0.8});
 // motes of light drifting, bubbles streaming up past the sinking camera, seagrass at the edges far below
 const r=RNG(8),cols=['150,240,255','190,170,255','140,255,220','255,200,230'];for(let i=0;i<34;i++){const x=r()*W,sp=40+r()*90,y=(r()*1500-((t*sp+k*400)%1500)+1500)%1500-100,s=2+r()*4;C_sparkle(x,y,s,0.6+0.3*Math.sin(t*3+i),{col:cols[i%4],edge:'rgba(10,40,100,0.5)',small:false,rot:i})}
 CR_bubbles(t,26,9,260,0.85);CR_weed(t,H+260-u*220,0.9);
 g.save();g.globalCompositeOperation='screen';glow(360,sy-40,420,'190,245,255',0.25,0.25);g.restore();
 CR_vig(0.3,'8,16,60');grain(t,0.04)};

// =====================================================================================================================
// a2_feel / a2_hang: a glossy green leaf in blue-hour rain, its tip swelling into a drop that hangs, trembles, lets go
// =====================================================================================================================
// pendant drop under a leaf tip at (x,ay): neck nw, ball of radius r centred at y; refracts the bokeh behind it, inverted
function CR_pend(x,ay,y,r,o={}){const bk=o.bk||'blue';CR_drop(x,y,r,{shape:'hang',ay,nw:o.nw??r*0.3,sx:o.sx||1,sy:o.sy||1,refr:()=>CR_bk(bk,o.dx||0,o.dy||0,o.z||1),mag:o.mag??0.3,cx:x,cy:y-40,la:-2.3,rim:o.rim||'8,30,70',caus:1.1,glowc:'170,230,255'})}
S.a2_feel=(t,c)=>{const k=c.k,z=1.04+0.03*k;CR_bk('blue',-10*k,0,z);B_rain(t,40,41,700,70,0.32,1.6);
 const tx=468,ty=452+Math.sin(t*1.6)*3,ang=0.52;CR_leaf(tx,ty,780,ang,'blue');
 const r=10+28*eo(cl(k/0.95));CR_pend(tx-4,ty-2,ty+r*1.15,r,{z,dx:-10*k});
 CR_fgBokeh(t,6,23,0.8,'170,230,255');CR_vig(0.32,'6,20,60');grain(t,0.04)};
S.a2_hang=(t,c)=>{const k=c.k,tr=WT('rain',28),pre=cl(1-(tr-t)/0.55),z=1.12+0.04*k;CR_bk('blue',8*k,-6*k,z);B_rain(t,30,43,620,80,0.25,2);
 const tx=372,ty=250,ang=0.66;CR_leaf(tx,ty,1300,ang,'blue');
 const tremble=Math.sin(t*31)*(1.2+2.6*pre),r=104+5*k,stretch=46*eio(pre),sx=1+0.035*Math.sin(t*23)*(0.4+pre),sy=1/sx;
 CR_pend(tx-6+tremble*0.4,ty-2,ty+r*1.22+stretch,r,{nw:r*(0.3-0.14*pre),sx,sy,z,dx:8*k,dy:-6*k,mag:0.26});
 CR_fgBokeh(t,5,29,0.7,'170,230,255');CR_vig(0.32,'6,20,60');grain(t,0.04)};

// =====================================================================================================================
// a2_fall / a2_goldcatch: the drop falls (camera rides with it), rain begins everywhere; a gold glint on 'gratitude'
// =====================================================================================================================
function CR_rainDrops(t,n,seed,a=1,s0=4,s1=12){const r=RNG(seed);for(let i=0;i<n;i++){const s=s0+r()*(s1-s0),sp=500+s*70,x=r()*W,y=((r()*1500+t*sp)%1500)-120;CR_streak(x,y,s,s*9,0.7*a);B_drop(x,y,s,a,true)}}
S.a2_fall=(t,c)=>{const k=c.k,u=cl(k/1.5),off=190*eio(u),ra=cl(k/0.45);
 g.save();g.translate(0,-off);Wbg(t,1.02,{la:0.08});g.restore();
 CR_leaf(300,250-760*eo(cl(k/0.5)),1220,0.66,'blue');
 B_rain(t,110,17,950,90,0.55*ra,1.2);B_rain(t,50,19,1300,60,0.7*ra,0);CR_rainDrops(t,10,71,ra,4,10);
 const y=lerp(380,470,eo(u)),r=44,w=Math.sin(t*19)*0.06;CR_streak(360,y,r,220*ra+60,0.9);
 CR_drop(360,y,r,{shape:'tear',tip:0.45,sx:1+w,sy:1-w,refr:CR_envR(t,1108-off),mag:0.12,cx:360,cy:1108-off,glowc:'170,220,255'});
 CR_fgBokeh(t,6,31,ra,'200,230,255');grain(t,0.04)};
S.a2_goldcatch=(t,c)=>{const k=c.k,off=190+120*eio(cl(k/1.44)),tg=WT('gratitude',30);
 g.save();g.translate(0,-off);Wbg(t,1.02,{moon:false,la:0.08});g.restore();
 B_rain(t,100,17,1000,100,0.5,1.4);B_rain(t,40,19,1400,70,0.65,0);CR_rainDrops(t,8,73,1,5,11);
 const x=360+Math.sin(t*0.9)*10,y=500+Math.sin(t*1.3)*8,r=64,w=Math.sin(t*17)*0.05;CR_streak(x,y,r,300,0.8);
 const gk=cl((t-tg)/0.12)*cl(1-(t-tg-0.45)/0.35);
 CR_drop(x,y,r,{shape:'tear',tip:0.45,sx:1+w,sy:1-w,refr:CR_envR(t,1108-off),mag:0.1,cx:360,cy:1108-off,tint:[255,196,90],tintA:0.22*gk,glowc:'170,220,255'});
 if(gk>0){const hx=x+Math.cos(-2.25)*r*0.5,hy=y+Math.sin(-2.25)*r*0.5;g.save();g.globalCompositeOperation='screen';glow(hx,hy,90,'255,200,90',0.5*gk,0.3);g.restore();C_sparkle(hx,hy,24*gk,gk,{col:'255,206,96',edge:'rgba(110,60,0,0.7)',rot:(t-tg)*0.8})}
 CR_fgBokeh(t,6,37,1,'200,230,255');grain(t,0.04)};

// =====================================================================================================================
// a2_creator (C) 'towards its creator': the drop lands on the round green Earth; a ring of light runs along its surface and
// flowers bloom behind it
// =====================================================================================================================
const CR_EC={cx:360,R:620,top:640};
function CR_earthArc(t,p){const {cx,R,top}=CR_EC,cy=top+R,S=CSKY(t);
 // atmosphere glow
 g.save();g.globalCompositeOperation='screen';glow(cx,top+40,560,C_s(C_mx(S.hz,C_WH,0.4)),0.5,0.35);g.restore();
 // the planet: lit green meadow, a blue sea crescent, soft terminator
 g.save();g.beginPath();g.arc(cx,cy,R,0,7);g.clip();
 let gr=g.createLinearGradient(0,top,0,top+520);gr.addColorStop(0,C_c(C_tint('#7FD35A',t)));gr.addColorStop(0.18,C_c(C_tint('#4DB046',t)));gr.addColorStop(0.6,C_c(C_tint('#2C8A3E',t)));gr.addColorStop(1,C_c(C_tint('#1E5E3A',t)));g.fillStyle=gr;g.fillRect(cx-R,top,2*R,2*R);
 const rq=RNG(17);for(let i=0;i<26;i++){const px=cx-R+rq()*2*R,py=top+30+rq()*520;g.fillStyle=rq()<0.5?C_c(C_tint('#9BE07A',t),0.16):C_c(C_tint('#1C6A34',t),0.18);g.beginPath();g.ellipse(px,py,60+rq()*120,14+rq()*26,0,0,7);g.fill()}
 gr=g.createRadialGradient(cx-200,top+80,40,cx,cy,R*1.05);gr.addColorStop(0,'rgba(255,255,230,0.18)');gr.addColorStop(0.6,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(4,20,40,0.35)');g.fillStyle=gr;g.fillRect(cx-R,top,2*R,2*R);
 g.restore();
 // rim light and grass along the crest; trees and flowers that bloom as the light ring passes
 g.save();g.strokeStyle=C_c(C_mx(S.lc,C_WH,0.5),0.7);g.lineWidth=3;g.beginPath();g.arc(cx,cy,R,Math.PI*1.12,Math.PI*1.88);g.stroke();g.restore();
 const yAt=x=>cy-Math.sqrt(Math.max(0,R*R-(x-cx)*(x-cx)));
 C_grass(-20,0,760,{t,base:x=>yAt(x)+3,h:22,dens:1.2,seed:13});
 const r=RNG(41),FC=['#C58BEA','#F49AC6','#FFE36A','#FFFFFF','#FF9E7A'];
 for(let i=0;i<7;i++){const tx=40+i*104+r()*30;if(Math.abs(tx-cx)<70)continue;const s=34+r()*14;C_miniTree(tx,yAt(tx)+6,s,t,300+i)}
 for(let i=0;i<22;i++){const fx=10+(i+r())*700/22,d=Math.abs(fx-cx),pp=cl((p*520-d)/60);C_flower(fx,yAt(fx)+2-r()*4,5+r()*4,{t,p:pp,col:FC[i%5],petals:5})}}
S.a2_creator=(t,c)=>{const tc=WT('creator',31.4),{cx,top}=CR_EC,u=t-tc,k=c.k;
 Wbg(t,1,{hills:false,la:0.1,ly:640});
 CR_earthArc(t,u>0?eo(cl(u/0.55)):0);
 if(u<0){const f=cl((t-c.t0)/(tc-c.t0)),y=lerp(150,top-60,f*f),r=56;CR_streak(cx,y,r,160,0.85);CR_drop(cx,y,r,{shape:'tear',tip:0.5,refr:CR_envR(t,top),mag:0.14,cx,cy:top,glowc:'170,220,255'})}
 else{// ring of light running along the surface both ways
  const p=eo(cl(u/0.55)),d=p*520,a=cl(1-u/0.6);g.save();g.globalCompositeOperation='screen';glow(cx,top,240,'170,230,255',0.55*cl(1-u/0.5),0.3);
  for(const sd of [-1,1]){const x=cx+sd*d,y=top+CR_EC.R-Math.sqrt(Math.max(0,CR_EC.R**2-(x-cx)**2));glow(x,y,70,'200,245,255',0.7*a,0.3);C_sparkle(x,y-6,14*a,a,{col:'180,240,255',edge:'rgba(20,70,120,0.6)'})}g.restore();
  C_ripples(cx,top+2,t,tc,{n:3,sc:1.3,flat:0.28,life:1.1,speed:180});CR_crown(cx,top,t,tc,2.5,{flat:0.3,seed:17})}
 grain(t,0.04)};

// =====================================================================================================================
// a2_voice / a2_creation: a big drop resting on a broad leaf speaks (its skin ripples with the teacher's words);
// the L2 card stays above. On 'creation of' a tiny world starts to glow inside it.
// =====================================================================================================================
function CR_leafFlat(t,y){// the broad leaf seen at a low angle, spanning the frame
 const c=CR_leafArt('blue');g.save();g.translate(360,y);g.rotate(-0.06);g.scale(1.05,0.42);g.drawImage(c,-c.width/2-90,-c.height/2,c.width+180,c.height);g.restore()}
function CR_talkDrop(t,x,by,r,o={}){const sp=CR_talk(t),wob=sp*(0.05*Math.sin(t*29)+0.03*Math.sin(t*47+1));
 // contact shadow and the bright caustic it throws on the leaf in front
 g.save();g.fillStyle='rgba(6,30,24,0.4)';g.beginPath();g.ellipse(x+r*0.12,by+r*0.04,r*1.05,r*0.16,0,0,7);g.fill();
 g.globalCompositeOperation='screen';glow(x+r*0.38,by+r*0.1,r*0.8,'210,255,220',0.55,0.3);glow(x+r*0.42,by+r*0.08,r*0.22,'255,255,240',0.8,0.4);g.restore();
 const hk=0.82+wob;CR_drop(x,by,r,{shape:'dome',hk,refr:()=>CR_bk('blue'),mag:0.32,cx:x,cy:by-r*1.4,la:-2.4,rim:'8,40,60',caus:1.2,glow:false,
  raw:o.world>0?()=>{g.save();g.globalAlpha*=o.world;const wc=CR_world(),s=r*1.5;g.translate(x,by-r*hk*0.5);g.scale(1,0.62);g.drawImage(wc,-s/2,-s/2,s,s);g.restore()}:null});
 // surface ripples: rings of light on the skin that pulse with the speech
 if(sp>0.01){g.save();g.beginPath();g.ellipse(x,by-r*hk*0.5,r*0.92,r*hk*0.5,0,0,7);g.clip();for(let j=0;j<3;j++){const ph=((t*2.4+j/3)%1),R=r*(0.2+0.7*ph);g.strokeStyle=`rgba(235,252,255,${0.4*sp*(1-ph)})`;g.lineWidth=2.2;g.beginPath();g.ellipse(x,by-r*hk*0.62,R,R*0.32,0,0,7);g.stroke()}g.restore()}}
S.a2_voice=(t,c)=>{const k=c.k;CR_bk('blue',0,-20,1.08);B_rain(t,30,47,650,70,0.25,1.6);
 CR_leafFlat(t,730);CR_talkDrop(t,360,700,150,{});
 C_ripples(360,712,t,c.t0,{n:3,sc:1.6,flat:0.16,life:1.3,speed:140,dark:'20,80,60',light:'230,255,240',a:0.7});
 Wcard(t,c,{lines:[1],bg:()=>{},cy:290,size:30,a:c.t0-0.2,b:c.t1+0.4})};
S.a2_creation=(t,c)=>{const k=c.k,tw=WT('the',38.3),wk=cl((t-tw)/0.35);CR_bk('blue',0,-30,1.16);B_rain(t,26,49,650,70,0.22,1.6);
 const z=1+0.06*k;g.save();g.translate(360,640);g.scale(z,z);g.translate(-360,-640);CR_leafFlat(t,760);CR_talkDrop(t,360,720,190,{world:0.85*wk});g.restore();
 // light gathering above the drop where the word will appear
 const r=RNG(52);for(let i=0;i<16;i++){const a=r()*6.28,d=(1-wk)*(120+r()*120)+20+r()*30,x=360+Math.cos(a)*d*1.6,y=400+Math.sin(a)*d*0.5;C_sparkle(x,y,(5+r()*6)*wk,wk*(0.7+0.3*Math.sin(t*8+i)),{col:CR_MOTEC[i%6],edge:'rgba(16,40,96,0.6)'})}
 CR_vig(0.28,'6,20,60');grain(t,0.04)};

// =====================================================================================================================
// a2_lyrical (C): rain-beaded glass in front of dusk lights; a running drop writes 'said the voice of the rain,' in light
// =====================================================================================================================
const CR_GLASS=(()=>{const r=RNG(808),B=[];for(let i=0;i<150;i++){const rr=2+r()*r()*13;B.push([r()*W,r()*H,rr,r()<0.25?1:0,0.9+r()*0.25])}return B})();
const CR_DRIP=(()=>{const r=RNG(909),D=[];for(let i=0;i<7;i++)D.push({x:30+r()*660,ph:r()*9,sp:60+r()*80,len:180+r()*260,w:3+r()*3,seed:i*13});return D})();
function CR_glass(t,a=1){for(const [x,y,r,k,sx] of CR_GLASS)CR_gbead(x,y,r,a,k,sx,1/sx);
 g.save();g.lineCap='round';for(const d of CR_DRIP){const y=((d.ph*140+t*d.sp)%(H+d.len+200))-d.len;g.strokeStyle='rgba(225,245,255,0.28)';g.lineWidth=d.w;g.beginPath();for(let j=0;j<=12;j++){const yy=y+d.len*j/12,xx=d.x+Math.sin(yy*0.03+d.seed)*5;j?g.lineTo(xx,yy):g.moveTo(xx,yy)}g.stroke();
  g.strokeStyle='rgba(6,16,44,0.3)';g.lineWidth=1.2;g.stroke();CR_gbead(d.x+Math.sin((y+d.len)*0.03+d.seed)*5,y+d.len+d.w,d.w*1.9,a,0,0.9,1.15)}g.restore()}
S.a2_lyrical=(t,c)=>{const k=c.k,z=1.05+0.03*k;CR_bk('dusk',0,0,z);
 g.save();g.globalCompositeOperation='screen';glow(360,470,330,'120,170,255',0.18,0.3);g.restore();CR_glass(t,1);
 const s='said the voice of the rain,',sz=50,p=eio(cl(k/0.85)),tw=mw(s,sz,FAM.display,'600','italic'),x0=W/2-tw/2,y=470;
 // a calm dark breath behind the words so they read
 g.save();g.globalAlpha=0.55*cl(p*3);g.drawImage(sprite('10,18,60',0.5),x0-60,y-90,tw+120,180);g.restore();
 g.save();g.beginPath();g.rect(x0-20,y-80,(tw+40)*p,160);g.clip();C_T(s,W/2,y,sz,'#FFF8EA',{fam:FAM.display,wt:'600',st:'italic',stroke:['#13204E',4],shadow:[18,0.5,3]});g.restore();
 if(p>0&&p<1){const hx=x0-20+(tw+40)*p,hy=y+10+Math.sin(p*40)*6;g.save();g.globalCompositeOperation='screen';glow(hx,hy,60,'170,225,255',0.6,0.3);g.restore();B_drop(hx,hy,10,1,true)}
 const ul=eo(cl((k-0.55)/0.4));if(ul>0){g.save();g.strokeStyle='rgba(180,236,255,0.95)';g.lineWidth=2.4;g.shadowColor='rgba(120,200,255,0.9)';g.shadowBlur=10*SC;g.beginPath();g.moveTo(x0,y+40);g.lineTo(x0+tw*ul,y+40);g.stroke();g.restore();B_drop(x0+tw*ul+8,y+36,7,ul,true)}
 CR_vig(0.3,'10,10,40');grain(t,0.04)};

// =====================================================================================================================
// a2_believes / a2_jewel / a2_caustics: the drop seen whole with a bright little world inside it; then as a turning jewel
// with prism sparks; then lying on bright water-lit floor throwing its focused light and rainbow fringe
// =====================================================================================================================
function CR_blade(t,x1,y1){// a curved glossy grass blade from the upper left to the drop's stem
 g.save();const P=new Path2D();P.moveTo(-60,120);P.bezierCurveTo(140,60,x1-120,y1-150,x1+8,y1-6);P.bezierCurveTo(x1-110,y1-120,150,110,-60,170);P.closePath();
 const gr=g.createLinearGradient(0,60,0,y1);gr.addColorStop(0,'#2F9A42');gr.addColorStop(0.5,'#6CCB4E');gr.addColorStop(1,'#2C8A3A');g.fillStyle=gr;g.fill(P);g.strokeStyle='rgba(10,60,24,0.8)';g.lineWidth=2;g.stroke(P);
 g.strokeStyle='rgba(225,255,190,0.6)';g.lineWidth=2.5;g.beginPath();g.moveTo(-40,128);g.bezierCurveTo(150,72,x1-130,y1-140,x1-6,y1-12);g.stroke();
 for(let i=0;i<5;i++){const u=0.15+i*0.17,bx=lerp(-40,x1-30,u),by=lerp(140,y1-40,u*u)+8;CR_bead(bx,by,4+i%3*2,'#55BC45',0.95)}g.restore()}
function CR_bigDrop(t,x,y,r,o={}){const rot=o.rot||0,hy=y-r*1.38;
 // the stem the drop hangs from
 CR_blade(t,x,hy);
 CR_drop(x,y,r,{shape:'tear',tip:0.38,sx:o.sx||1,sy:o.sy||1,refr:()=>CR_bk(o.bk||'blue'),mag:0.3,cx:x,cy:y,la:-2.3,rim:'10,34,80',vol:0.85,caus:0.9,glowc:'170,225,255',
  raw:()=>{const wc=CR_world(),s=r*2.06;g.save();g.translate(x,y+r*0.04);g.rotate(rot);g.drawImage(wc,-s/2,-s/2,s,s);g.restore();
   // sky-bright top edge, dark limb: the lens reads as a sphere
   const gr=g.createRadialGradient(x-r*0.2,y-r*0.25,r*0.3,x,y,r*1.02);gr.addColorStop(0,'rgba(255,255,255,0.06)');gr.addColorStop(0.75,'rgba(10,30,80,0.05)');gr.addColorStop(1,'rgba(10,30,80,0.5)');g.fillStyle=gr;g.fillRect(x-r*1.2,y-r*1.6,r*2.4,r*2.8)}});
 // rainbow fringe along the lower limb (dispersion)
 if(o.prism>0){g.save();g.globalCompositeOperation='screen';const C=['255,90,90','255,170,60','255,236,90','110,230,110','80,180,255','150,110,255'];for(let i=0;i<6;i++){g.strokeStyle=`rgba(${C[i]},${0.35*o.prism})`;g.lineWidth=3;g.beginPath();g.ellipse(x,y,r*(0.9-i*0.022),r*(0.9-i*0.022),0,0.3+Math.sin(t)*0.1,Math.PI-0.5);g.stroke()}g.restore()}}
S.a2_believes=(t,c)=>{const k=c.k,z=1+0.05*k;CR_bk('blue',0,0,1.1+0.03*k);B_rain(t,26,53,600,70,0.2,1.8);
 g.save();g.translate(360,600);g.scale(z,z);g.translate(-360,-600);CR_bigDrop(t,360,600,186+6*Math.sin(t*1.2),{rot:Math.sin(t*0.5)*0.05});g.restore();
 CR_fgBokeh(t,6,57,0.8,'190,235,255');CR_vig(0.3,'6,20,60');grain(t,0.04)};
S.a2_jewel=(t,c)=>{const k=c.k,z=1.12+0.06*k;CR_bk('blue',0,0,1.2);
 g.save();g.fillStyle='rgba(8,20,70,0.3)';g.fillRect(-W,-H,3*W,3*H);g.restore();
 g.save();g.translate(360,600);g.scale(z,z);g.translate(-360,-600);CR_bigDrop(t,360,600,190,{rot:k*0.5,prism:1});g.restore();
 // prism sparks turning around the jewel (coloured, with edges so they read anywhere)
 const r=RNG(31),PC=['255,120,140','255,200,90','150,240,140','110,200,255','190,150,255','255,255,255'];
 for(let i=0;i<14;i++){const a=r()*6.28+t*0.8,d=(150+r()*90)*z,x=360+Math.cos(a)*d,y=600+Math.sin(a)*d*0.9,tw=0.5+0.5*Math.sin(t*7+i*2.1);C_sparkle(x,y,(6+r()*10)*tw,tw,{col:PC[i%6],edge:'rgba(16,30,90,0.6)',rot:a})}
 CR_vig(0.36,'6,14,50');grain(t,0.04)};
S.a2_caustics=(t,c)=>{const k=c.k,x=380,y=520,r=118;
 const cv=CR_copy('caus',CR_floor(t,{calm:0.4}));
 // shadow of the drop with its focused caustic and rainbow fringe (light from the top left)
 const sx=x+r*0.62,sy=y+r*0.72;g.save();g.fillStyle='rgba(10,60,80,0.32)';g.beginPath();g.ellipse(sx,sy,r*1.05,r*0.95,0.3,0,7);g.fill();
 g.globalCompositeOperation='screen';const C=['255,80,80','255,180,60','240,255,90','90,240,140','80,180,255','170,110,255'];for(let i=0;i<6;i++){g.strokeStyle=`rgba(${C[i]},0.45)`;g.lineWidth=5;g.beginPath();g.ellipse(sx,sy,r*(0.62+i*0.05),r*(0.56+i*0.045),0.3,0,7);g.stroke()}
 glow(sx,sy,r*0.8,'235,255,250',0.9,0.25);glow(sx,sy,r*0.34,'255,255,240',1,0.45);glow(sx,sy,r*0.16,'255,255,255',1,0.6);g.restore();
 // the drop itself: a lens magnifying the floor (upright), dark limb, sky window glint
 CR_drop(x,y,r,{shape:'ball',raw:()=>{g.save();g.translate(x,y);g.scale(1.35,1.35);g.translate(-x,-y);g.drawImage(cv,0,0,W,H);g.restore()},spec:1,la:-2.4,rim:'10,60,90',vol:0.9,caus:0.8,glow:false});
 // second, smaller drop for scale
 CR_drop(150,300,44,{shape:'ball',raw:()=>{g.save();g.translate(150,300);g.scale(1.3,1.3);g.translate(-150,-300);g.drawImage(cv,0,0,W,H);g.restore()},spec:0.9,la:-2.4,rim:'10,60,90',vol:0.9,glow:false});
 g.save();g.globalCompositeOperation='screen';glow(150+28,300+34,30,'240,255,250',0.8,0.3);g.restore();
 CR_vig(0.25,'8,40,60');grain(t,0.035)};

// =====================================================================================================================
// Act III: the sea gives the drop back to the sky (a3_generate X, a3_lift C, a3_again C) and takes it again
// (a3_comeback C, a3_comeback2 C: the sea rushes up, impact on 'rain' 88.68 with a crown and rings; rain begins)
// =====================================================================================================================
// a liquid neck pulled up from the surface (bx,by) to a drop bottom at y1; w0 base half-width, w1 top half-width
function CR_neck(bx,by,y1,w0,w1,a=1){if(by-y1<2||a<=0.01)return;g.save();g.globalAlpha*=a;const P=new Path2D();P.moveTo(bx-w0*2.2,by+2);P.bezierCurveTo(bx-w0,by,bx-w1*1.1,lerp(by,y1,0.55),bx-w1,y1);P.lineTo(bx+w1,y1);P.bezierCurveTo(bx+w1*1.1,lerp(by,y1,0.55),bx+w0,by,bx+w0*2.2,by+2);P.closePath();
 const gr=g.createLinearGradient(0,y1,0,by);gr.addColorStop(0,'rgba(236,250,255,0.85)');gr.addColorStop(0.6,'rgba(150,215,250,0.55)');gr.addColorStop(1,'rgba(70,150,220,0.5)');g.fillStyle=gr;g.fill(P);
 g.strokeStyle='rgba(255,255,255,0.75)';g.lineWidth=1.6;g.beginPath();g.moveTo(bx-w1*0.5,y1+4);g.bezierCurveTo(bx-w1*0.7,lerp(by,y1,0.5),bx-w0*0.7,by-6,bx-w0*1.4,by);g.stroke();g.restore()}
// a drop lifting off the water: neck until the pinch, then free; rings go out at the base
function CR_rise(t,bx,by,t0,top,r,o={}){const u=t-t0;if(u<0)return;const pinch=o.pinch??0.32,y=by-r*1.05-(by-r*1.05-top)*eo(cl(u/(o.dur??0.9)));
 if(u<pinch)CR_neck(bx,by,y+r*0.7,r*0.55,r*0.28*(1-u/pinch)+2);else{const v=cl((u-pinch)/0.35);CR_neck(bx,by,by-r*1.4*(1-v),r*0.5*(1-v),3,1-v);if(v<1)B_drop(bx,by-r*1.4*(1-v)-6,r*0.14,1-v,true)}
 CR_drop(bx,y,r,{shape:'tear',tip:0.35,sy:1.02,refr:o.refr,mag:o.mag??0.2,cx:bx,cy:o.cy??by,glowc:'170,225,255'})}
S.a3_generate=(t,c)=>{const tg=WT('generates',55.6),px=360,py=700,u=t-tg;Wsea(t,{off:120});
 if(u<0){C_ripples(px,py,tg-t,0,{n:3,sc:1.4,flat:0.22,life:0.9,speed:170,a:0.9});g.save();g.globalCompositeOperation='screen';glow(px,py,90,'180,235,255',0.4*cl(1+u/0.4),0.3);g.restore()}
 else{C_ripples(px,py,t,tg,{n:4,sc:1.3,flat:0.22,life:1.4,speed:150})}
 // motes lifting with it (water becoming air)
 const r=RNG(61);for(let i=0;i<12;i++){const d=r()*0.6,v=cl((u-d*0.4)/0.8),x=px+(r()-0.5)*160*v,y=py-v*(160+r()*260);if(v>0&&v<1)C_sparkle(x,y,(4+r()*5)*(1-v*0.5),Math.sin(Math.PI*v),{col:CR_MOTEC[i%6],edge:'rgba(20,50,110,0.55)',small:false})}
 CR_rise(t,px,py,tg,330,34,{refr:CR_envR(t,572,{ground:CSKY(t).deep}),cy:572,dur:0.75});
 grain(t,0.04)};
S.a3_lift=(t,c)=>{const HZ=330,k=c.k,bx=360,by=720,S=CSKY(t),L=C_lightPos(t);
 C_sky(t,{hz:HZ+20,raysA:0.8});C_hills(t,HZ+2,{n:2,amp:26,gap:10,trees:0,haze:0.5,bot:HZ+40});
 const rings=[{x:bx,y:by,t0:c.t0-0.12,s:0.55,sp:230,lam:30,dec:0.8,wid:40},{x:bx,y:by,t0:c.t0+0.3,s:0.36,sp:200,lam:24,dec:1},{x:150,y:900,t0:c.t0-0.6,s:0.4,sp:200,lam:24},{x:600,y:560,t0:c.t0+0.1,s:0.35,sp:150,lam:18}];
 const cv=CR_copy('lift',CR_water(t,{hz:HZ,fl:700,pal:CR_palSky(t),rings,rain:0.14,rsc:0.32,lp:[L.x,L.y],la:0.7,amp:0.03,ws:38,rim:0.26}));
 C_hills(t,HZ+2,{n:2,amp:26,gap:10,trees:0,haze:0.5,mirror:HZ,a:0.25});
 g.save();g.globalAlpha*=0.5;g.drawImage(sprite(C_s(C_mx(S.hz,C_WH,0.5)),0.3),-200,HZ-22,W+400,44);g.restore();
 CR_rise(t,bx,by,c.t0-0.05,380,62,{refr:()=>g.drawImage(cv,0,0,W,H),mag:0.24,cy:by+120,dur:1.0,pinch:0.42});
 CR_fgBokeh(t,5,63,0.6,'230,245,255');grain(t,0.035)};
S.a3_again=(t,c)=>{const k=c.k,off=450,HZ=452+off,S=CSKY(t);Wsea(t,{off,vap:0.8});
 C_cloud(360,250,520,{seed:4,a:0.9*eo(cl(k/0.5)),t});
 const env=CR_envR(t,HZ,{ground:S.deep});
 const R=[[150,0.15,14],[560,0.05,16],[250,0.4,10],[470,0.3,12],[620,0.55,9],[90,0.6,8]];
 for(const [x,d,r] of R){const t0=c.t0+d;CR_rise(t,x,HZ+30+r*2,t0,HZ-420-r*8,r,{refr:env,mag:0.2,cy:HZ,dur:1.2,pinch:0.2});C_ripples(x,HZ+30+r*2,t,t0,{n:2,sc:0.6,flat:0.2,life:1,speed:90})}
 CR_rise(t,360,1010,c.t0-0.05,430,44,{refr:env,mag:0.16,cy:HZ,dur:1.15,pinch:0.3});C_ripples(360,1010,t,c.t0,{n:3,sc:1.4,flat:0.2,life:1.4,speed:150});
 grain(t,0.04)};
S.a3_comeback=(t,c)=>{const k=c.k,off=430,HZ=452+off,S=CSKY(t),tt=WT('there',86.9);Wsea(t,{off});
 C_cloud(360,330,600,{seed:6,rain:0.35,t,lit:C_mx(S.cl,C_WH,0.3)});
 const u=t-tt;if(u>-0.25){const f=cl(u/0.75),y=lerp(330,700,f*f),r=lerp(14,30,cl((u+0.25)/0.4));if(u>0)CR_streak(360,y,r,90*f+20,0.8);CR_drop(360,y,r,{shape:'tear',tip:0.5,refr:CR_envR(t,HZ,{ground:S.deep}),mag:0.14,cx:360,cy:HZ,glowc:'170,225,255'})}
 grain(t,0.04)};
S.a3_comeback2=(t,c)=>{const tr=WT('rain',88.2),f=cl((t-c.t0)/(tr-c.t0)),u=t-tr,S=CSKY(t),L=C_lightPos(t);
 const HZ=u<0?lerp(760,130,eio(f)):130,ix=360,iy=760;
 if(HZ>0){C_sky(t,{hz:HZ+20,raysA:0.8});C_hills(t,HZ+2,{n:2,amp:24,gap:10,trees:0,haze:0.5,bot:HZ+40})}
 const rings=u<0?[]:[{x:ix,y:iy,t0:tr,s:0.66,sp:290,lam:30,dec:0.72,wid:46},{x:ix,y:iy,t0:tr+0.16,s:0.38,sp:240,lam:24,dec:0.9},{x:ix,y:iy,t0:tr+1.1,s:0.42,sp:200,lam:20,dec:1.1}];
 const cv=CR_copy('cb2',CR_water(t,{hz:HZ,fl:680,pal:CR_palSky(t),rings,rain:u<0?0.1:0.1+0.4*cl(u/0.5),rsc:0.26,rsp:1.2,lp:[L.x,L.y],la:0.7,amp:0.035,ws:42,rim:0.28}));
 if(HZ>0){C_hills(t,HZ+2,{n:2,amp:24,gap:10,trees:0,haze:0.5,mirror:HZ,a:0.25})}
 if(u<0){const y=lerp(330,iy-60,f*f),r=60;g.save();g.globalAlpha=0.25*f;g.translate(ix,iy);g.scale(1,-0.85);g.translate(-ix,-iy);CR_drop(ix,y,r,{shape:'tear',tip:0.5,refr:()=>g.drawImage(cv,0,0,W,H),glow:false,spec:0.5});g.restore();
  CR_streak(ix,y,r,240,0.85);CR_drop(ix,y,r,{shape:'tear',tip:0.55,sy:1.05,refr:()=>g.drawImage(cv,0,0,W,H),mag:0.22,cx:ix,cy:iy+160,glowc:'170,225,255'})}
 else{g.save();g.globalCompositeOperation='screen';glow(ix,iy,300,'170,220,255',0.4*cl(1-u/0.9),0.3);g.restore();CR_crown(ix,iy,t,tr,2.4,{flat:0.42,seed:23});
  B_rain(t,70*cl(u/0.4)+1,61,900,70,0.5,1.2);CR_rainDrops(t,8,67,cl(u/0.4),4,9)}
 grain(t,0.035)};

// =====================================================================================================================
// Act V: 'Because life is very short' (a5_short) - one drop's brief fall from a leaf into a puddle;
// 'Within that period' (a5_period) - a drop falling in slow motion beside a glowing ruler of time
// =====================================================================================================================
S.a5_short=(t,c)=>{const tl=WT('life',144.7),ts=WT('short',145.3),S=CSKY(t);Wbg(t,1,{hy:1050,la:0.1,ly:600});Wground(t,1012);
 C_puddle(522,1030,190,40,t,{drops:1,seed:5});
 CR_leaf(530,330+Math.sin(t*1.4)*3,720,0.42,'over');
 B_rain(t,40,73,800,70,0.35,1.2);
 const tip=[524,328];if(t<tl){const r=8+14*cl((t-c.t0)/(tl-c.t0));CR_drop(tip[0],tip[1]+r*1.2,r,{shape:'hang',ay:tip[1]-2,nw:r*0.3,refr:CR_envR(t,1050),mag:0.12,cx:tip[0],cy:1050,glowc:'190,225,255'})}
 else if(t<ts){const f=cl((t-tl)/(ts-tl)),y=lerp(tip[1]+26,1022,f*f),r=22;CR_streak(tip[0],y,r,40+200*f,0.8);CR_drop(tip[0],y,r,{shape:'tear',tip:0.5,refr:CR_envR(t,1050),mag:0.12,cx:tip[0],cy:1050,glowc:'190,225,255'})}
 else{C_ripples(tip[0],1030,t,ts,{n:3,sc:0.8,flat:0.22,life:0.9,speed:120});CR_crown(tip[0],1028,t,ts,0.9,{flat:0.25,seed:9})}
 grain(t,0.04)};
function CR_slowRain(T,n,seed){const r=RNG(seed),P=new Path2D();for(let i=0;i<n;i++){const x0=r()*W*1.2-60,sp=600+r()*400,l=30+r()*40,y=((r()*1500+T*sp)%1500)-100,x=x0+y*0.08;P.moveTo(x,y);P.lineTo(x+l*0.08,y+l)}g.save();g.lineCap='round';g.strokeStyle='rgba(30,60,120,0.35)';g.lineWidth=3.2;g.stroke(P);g.strokeStyle='rgba(240,250,255,0.85)';g.lineWidth=1.6;g.stroke(P);g.restore()}
S.a5_period=(t,c)=>{const k=c.k,tp=WT('period',146.4),S=CSKY(t),lx=150,y0=250,y1=1000;Wbg(t,0.96,{hy:1110,la:0.1,ly:560});
 // slow-motion rain: everything nearly stops
 CR_slowRain(t*0.12,60,77);CR_rainDrops(t*0.1+30,9,79,0.9,4,9);
 // the ruler of time: navy edge, cyan glow line, ticks
 g.save();g.lineCap='round';g.strokeStyle='rgba(16,32,80,0.55)';g.lineWidth=7;g.beginPath();g.moveTo(lx,y0);g.lineTo(lx,y1);g.stroke();
 g.strokeStyle='rgba(225,248,255,0.95)';g.lineWidth=3;g.beginPath();g.moveTo(lx,y0);g.lineTo(lx,y1);g.stroke();
 for(let y=y0,i=0;y<=y1;y+=30,i++){const L=i%5===0?26:12;g.strokeStyle='rgba(16,32,80,0.55)';g.lineWidth=5;g.beginPath();g.moveTo(lx,y);g.lineTo(lx+L,y);g.stroke();g.strokeStyle='rgba(225,248,255,0.95)';g.lineWidth=2;g.beginPath();g.moveTo(lx,y);g.lineTo(lx+L,y);g.stroke()}g.restore();
 // the drop, falling slowly; the span it has fallen lights up; on 'period' the span is bracketed
 const dy=lerp(300,720,k/1.67),dx=400,r=48,wob=0.05*Math.sin(t*3.6);
 g.save();g.globalCompositeOperation='screen';const gr=g.createLinearGradient(0,300,0,dy);gr.addColorStop(0,'rgba(90,200,255,0.2)');gr.addColorStop(1,'rgba(120,230,255,0.9)');g.strokeStyle=gr;g.lineWidth=10;g.lineCap='round';g.beginPath();g.moveTo(lx,300);g.lineTo(lx,dy);g.stroke();glow(lx,dy,46,'140,230,255',0.8,0.3);g.restore();
 g.save();g.setLineDash([6,8]);g.strokeStyle='rgba(16,32,80,0.5)';g.lineWidth=2;g.beginPath();g.moveTo(lx+30,dy);g.lineTo(dx-r-10,dy);g.stroke();g.restore();
 const bk=eo(cl((t-tp)/0.4));if(bk>0){g.save();g.lineCap='round';g.lineJoin='round';const bx=lx-26;for(const [w,col] of [[7,'rgba(16,32,80,0.6)'],[3,'rgba(160,236,255,1)']]){g.strokeStyle=col;g.lineWidth=w;g.beginPath();g.moveTo(bx+14,300);g.lineTo(bx,300);g.lineTo(bx,lerp(300,dy,bk));g.lineTo(bx+14,lerp(300,dy,bk));g.stroke()}g.restore()}
 CR_drop(dx,dy,r,{shape:'tear',tip:0.5,sx:1+wob,sy:1-wob,refr:CR_envR(t,1110),mag:0.13,cx:dx,cy:1110,glowc:'190,225,255'});
 CR_streak(dx,dy,r,70,0.4);grain(t,0.04)};

}
