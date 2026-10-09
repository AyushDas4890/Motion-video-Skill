// fontcheck.mjs — which font families does headless Chromium actually have? (a missing family silently falls back, and a
// malformed canvas font string falls back to 10 px). Run before choosing type for a new world.
//   node fontcheck.mjs ["Family A" "Family B" ...]
import {launch} from './pw.mjs';
const extra=process.argv.slice(2);const b=await launch();const p=await b.newPage();
const r=await p.evaluate(extra=>{const c=document.createElement('canvas').getContext('2d');const f=['Sitka Display','Sitka Banner','Sitka Text','Sitka Small','Sitka Heading','Palatino Linotype','Book Antiqua','Constantia','Cambria','Gabriola','Segoe Script','Ink Free','Bahnschrift','Segoe UI Variable Display','Segoe UI','Georgia','Times New Roman','Garamond','Bodoni MT','Didot','Playfair Display','Cormorant Garamond','Edwardian Script ITC','Monotype Corsiva','Lucida Calligraphy','Nirmala UI','Mangal','Noto Sans','Noto Serif',...extra];
 const s='Hamburgefonstiv 0123 क ক';return f.map(n=>{c.font='40px monospace';const a=c.measureText(s).width;c.font=`40px "${n}",monospace`;const b2=c.measureText(s).width;return (a!==b2?'OK      ':'MISSING ')+n})},extra);
console.log(r.join('\n'));await b.close();
