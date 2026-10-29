const fs=require('node:fs'),path=require('node:path');
function select({root,move,mode='auto'}){
 if(mode==='off')return null;
 if(mode==='auto'){try{if(JSON.parse(fs.readFileSync(path.join(root,'.local-ai/cache/one-pass-policy.json'),'utf8')).approved!==true)return null;}catch{return null;}}
 const glyph=move.effectGlyph||move.motionPlan?.layers?.find(layer=>layer.source==='effect'&&typeof layer.glyph==='string')?.glyph;
 if(!glyph)return null;const rows=glyph.split('/');if(rows.length<4||rows.length>24||rows[0].length<4||rows[0].length>24||rows.some(row=>row.length!==rows[0].length||!/^[.1234]+$/.test(row)))return null;
 return{glyph};
}
module.exports={select};
