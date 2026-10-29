(function(root){
 const anchors=['hand','enemy','self','center'];
 function number(n,min,max){if(!Number.isFinite(n)||n<min||n>max)throw Error('연출 설계도 수치 형식 오류: '+String(n)+' (허용 '+min+'~'+max+')');return n;}
 function bounded(n,min,max){if(!Number.isFinite(n))return number(n,min,max);return Math.max(min,Math.min(max,n));}
 // Recover formatting drift without replacing the AI-authored silhouette or accepting code.
 function normalizeGlyph(input){
  if(typeof input!=='string'&&!Array.isArray(input))throw Error('연출 픽셀 소재 형식 오류');
  if(JSON.stringify(input).length>16384)throw Error('연출 픽셀 소재 용량 오류');
  const rows=(Array.isArray(input)?input:String(input).trim().split(/\/|\r?\n|\\n/)).map(row=>{
   if(typeof row!=='string')throw Error('연출 픽셀 소재 형식 오류');
   return row.replace(/\s/g,'').replace(/0/g,'.');
  }).filter(Boolean);
  const width=Math.max(0,...rows.map(r=>r.length));
  if(!rows.length||rows.length>128||width>128||rows.some(r=>!/^[.1234]+$/.test(r))||!rows.some(r=>/[1234]/.test(r)))throw Error('연출 픽셀 소재 형식 오류');
  const scale=Math.min(1,24/Math.max(width,rows.length)),w=Math.max(4,Math.ceil(width*scale)),h=Math.max(4,Math.ceil(rows.length*scale)),grid=Array.from({length:h},()=>Array(w).fill('.'));
  // Map every authored pixel so thin features do not disappear when an oversized grid is reduced.
  rows.forEach((row,y)=>[...row].forEach((pixel,x)=>{const yy=Math.min(h-1,Math.floor(y*scale)),xx=Math.min(w-1,Math.floor(x*scale));if(pixel!=='.')grid[yy][xx]=pixel;}));
  return grid.map(row=>row.join('')).join('/');
 }
 function normalize(value){
  if(typeof value==='string'){if(value.length>14000)throw Error('연출 설계도 용량 오류');try{value=JSON.parse(value);}catch{throw Error('연출 설계도 JSON 형식 오류');}}
  if(!value||!['keep','hide'].includes(value.carrier)||!Array.isArray(value.layers)||value.layers.length<1||value.layers.length>3)throw Error('연출 설계도 형식 오류');
  const duration=bounded(value.duration,700,4000),contact=bounded(value.contact,.25,.85);
  const layers=value.layers.map(layer=>{
   if(!['drawing','effect'].includes(layer.source)||!Array.isArray(layer.frames)||layer.frames.length<2||layer.frames.length>6)throw Error('연출 소재 형식 오류');
   const rawCrop=layer.crop||{x:0,y:0,w:1,h:1},crop={};for(const key of ['x','y','w','h'])crop[key]=number(rawCrop[key],0,1);
   if(crop.w<.05||crop.h<.05||crop.x+crop.w>1.001||crop.y+crop.h>1.001)throw Error('연출 그림 영역 형식 오류');
   let previous=-1;
   const frames=layer.frames.map(f=>{const ease=f.ease||'linear';if(!anchors.includes(f.a)||!['linear','smooth','in','out'].includes(ease))throw Error('연출 기준점 형식 오류');const t=number(f.t,0,1);if(t<=previous)throw Error('연출 시점 순서 형식 오류');previous=t;return{t,a:f.a,x:number(f.x??0,-.7,.7),y:number(f.y??0,-.7,.7),r:number(f.r??0,-25,25),s:number(f.s??1,.1,3),o:number(f.o??1,0,1),ease};});
   const inputGlyph=layer.glyph||layer.glyphs||(layer.source==='effect'&&value.layers.filter(l=>l.source==='effect').length===1?(value.glyph||value.glyphs):'');
   let glyph='';if(inputGlyph)glyph=normalizeGlyph(inputGlyph);
   return{source:layer.source,crop,size:bounded(layer.size??.12,.025,.4),frames,...(glyph?{glyph}:{})};
  });return{duration,contact,carrier:value.carrier,layers};
 }
 function sample(layer,t,positions,w,h){
  const frames=layer.frames;if(t<frames[0].t||t>frames.at(-1).t)return null;
  let a=frames[0],b=a;for(let i=1;i<frames.length;i++){b=frames[i];if(t<=b.t)break;a=b;}
  let q=b.t===a.t?0:(t-a.t)/(b.t-a.t);q=Math.max(0,Math.min(1,q));if(b.ease==='smooth')q=q*q*(3-2*q);if(b.ease==='in')q*=q;if(b.ease==='out')q=1-(1-q)**2;
  const pos=f=>({x:positions[f.a].x+f.x*w,y:positions[f.a].y+f.y*h}),p=pos(a),r=pos(b),lerp=(x,y)=>x+(y-x)*q;
  return{x:lerp(p.x,r.x),y:lerp(p.y,r.y),angle:lerp(a.r,b.r),scale:lerp(a.s,b.s),alpha:lerp(a.o,b.o)};
 }
 const api={normalize,sample,normalizeGlyph};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Craft.MotionPlan=api;
})(typeof window!=='undefined'?window:globalThis);
