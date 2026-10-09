// gpucheck.mjs — can headless Chromium render this engine here? Prints one JSON line:
// {ok, webgl (renderer string), gpu (true if hardware), fontsMissing[]}. Used by new_project.py's environment check.
//   node gpucheck.mjs      (env GROOT optional; the npx cache is searched)
import {launch} from './pw.mjs';
let b;
try{b=await launch();const p=await b.newPage();
 const r=await p.evaluate(()=>{const c=document.createElement('canvas');const gl=c.getContext('webgl2');let ren='none';if(gl){const e=gl.getExtension('WEBGL_debug_renderer_info');ren=e?gl.getParameter(e.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER)}
  const x=document.createElement('canvas').getContext('2d');const fams=['Sitka Banner','Sitka Display','Sitka Text','Sitka Small','Sitka Heading','Edwardian Script ITC','Segoe UI Variable Display','Bodoni MT'];const bad=[];
  for(const f of fams){x.font='40px monospace';const a=x.measureText('Hamburgefonstiv 0123').width;x.font=`40px "${f}",monospace`;if(x.measureText('Hamburgefonstiv 0123').width===a)bad.push(f)}return {webgl:ren,fontsMissing:bad}});
 r.gpu=!/swiftshader|software|llvmpipe|none/i.test(r.webgl);r.ok=r.gpu;console.log(JSON.stringify(r))}
catch(e){console.log(JSON.stringify({ok:false,error:String(e.message||e).split('\n')[0]}))}
finally{if(b)await b.close()}
