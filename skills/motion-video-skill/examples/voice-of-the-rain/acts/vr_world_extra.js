// examples/voice-of-the-rain/acts/vr_world_extra.js — subject-specific pieces moved out of the generic world.js kit.
// Loaded right after acts/world.js (needs B_canvas from style.js and B.* colours). Used by act1.js / act5.js.
'use strict';
// ---------- Whitman as a silver engraving: slouch hat, three-quarter face, full white beard in hatching ----------
const W_WHIT=B_canvas('whit',540,720,(x,w,h)=>{const r=RNG(1855);x.translate(270,330);x.lineCap='round';
 const face=new Path2D();face.ellipse(6,-30,92,118,0.05,0,7);x.fillStyle='rgba(236,229,214,0.92)';x.fill(face);
 x.save();x.clip(face);x.strokeStyle='rgba(21,24,38,0.35)';x.lineWidth=1;for(let i=0;i<70;i++){const yy=-150+i*4;x.beginPath();x.moveTo(-100,yy);x.lineTo(-100+40+30*Math.sin(i*0.3),yy+8);x.stroke()}for(let i=0;i<40;i++){const yy=-150+i*6;x.beginPath();x.moveTo(100,yy);x.lineTo(70-20*Math.sin(i*0.4),yy+6);x.stroke()}x.restore();
 const beard=new Path2D();beard.moveTo(-86,-10);beard.bezierCurveTo(-120,120,-60,250,10,270);beard.bezierCurveTo(80,250,130,120,98,-10);beard.bezierCurveTo(60,40,-50,40,-86,-10);
 x.fillStyle='rgba(205,214,228,0.95)';x.fill(beard);x.save();x.clip(beard);x.strokeStyle='rgba(21,24,38,0.42)';for(let i=0;i<180;i++){const sx=-110+r()*220,sy=-10+r()*270,l=20+r()*40;x.lineWidth=0.6+r()*0.8;x.beginPath();x.moveTo(sx,sy);x.quadraticCurveTo(sx+(r()-0.5)*14,sy+l*0.5,sx+(r()-0.5)*20,sy+l);x.stroke()}x.restore();
 x.strokeStyle='rgba(21,24,38,0.9)';x.lineWidth=3;x.beginPath();x.moveTo(-52,-52);x.quadraticCurveTo(-30,-62,-12,-54);x.moveTo(26,-54);x.quadraticCurveTo(44,-62,64,-52);x.stroke();
 x.lineWidth=2.4;x.beginPath();x.moveTo(-42,-36);x.quadraticCurveTo(-30,-42,-18,-36);x.moveTo(32,-36);x.quadraticCurveTo(44,-42,56,-36);x.moveTo(10,-40);x.lineTo(2,8);x.lineTo(16,12);x.stroke();x.fillStyle='rgba(21,24,38,0.45)';x.beginPath();x.ellipse(-30,-34,18,9,0,0,7);x.ellipse(44,-34,18,9,0,0,7);x.fill();
 const hat=new Path2D();hat.ellipse(0,-118,196,34,-0.06,0,7);x.fillStyle='rgba(12,14,24,1)';x.fill(hat);x.beginPath();x.moveTo(-104,-124);x.bezierCurveTo(-104,-236,104,-246,108,-130);x.closePath();x.fill();
 x.strokeStyle='rgba(207,222,240,0.7)';x.lineWidth=2;x.beginPath();x.ellipse(0,-118,196,34,-0.06,Math.PI*1.05,Math.PI*1.95);x.stroke();x.beginPath();x.moveTo(-100,-132);x.bezierCurveTo(-96,-222,90,-232,104,-136);x.stroke();
 x.strokeStyle='rgba(207,222,240,0.35)';x.lineWidth=1;for(let i=0;i<24;i++){x.beginPath();x.moveTo(-90+i*8,-140);x.lineTo(-80+i*8,-200+Math.abs(i-12)*2);x.stroke()}
 x.fillStyle='rgba(12,14,24,0.95)';x.beginPath();x.moveTo(-200,390);x.bezierCurveTo(-170,250,-100,240,-60,230);x.lineTo(70,230);x.bezierCurveTo(120,240,190,260,210,390);x.fill()});
function Wwhitman(t,c,p=1,name=true){const k=eio(cl(p));g.save();g.beginPath();g.rect(0,0,W,560+k*700);g.clip();g.drawImage(W_WHIT,360-180,300,360,480);g.restore();
 if(name){rise('Walt Whitman',W/2,330,44,B.ivory,c.t0+0.35,t,FAM.script,'400',0.03,'center',{shadow:[12,0.8],stroke:[B.ink,4]});T('1819 – 1892',W/2,386,36,'#DCE0E8',FAM.text,'400','center',cl((t-c.t0-0.6)/0.3),{ls:3,stroke:[B.ink,4]})}}
