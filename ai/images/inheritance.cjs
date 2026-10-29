const fs=require('node:fs'),path=require('node:path'),{createHash,randomBytes}=require('node:crypto');
const signature=weapon=>createHash('sha256').update(JSON.stringify({name:weapon.name,rarity:weapon.rarity||'common',moves:require('../../dist/js/weapons/moves.js').normalize(weapon.moves)})).digest('hex');
function create(root=path.resolve(__dirname,'../..')){
 const directory=path.join(root,'.local-ai/cache/effect-inheritance'),assets=path.join(root,'dist/assets/vfx/generated');
 function issue(base,atlas,child,changes){try{
  if(!/^[a-f0-9]{64}$/.test(atlas?.id||''))return null;const meta=JSON.parse(fs.readFileSync(path.join(assets,atlas.id+'.json'),'utf8'));
  if(meta.rarity!==(base.rarity||'common')||meta.rarity!==(child.rarity||'common')||!fs.existsSync(path.join(assets,atlas.id+'.png')))return null;
  const ready=meta.local?.readyRows||[0,1,2,3],rows=base.moves.flatMap((m,i)=>!changes.includes(i)&&ready.includes(i)&&meta.local?.skills?.[i]?.name===m.name&&JSON.stringify(m)===JSON.stringify(child.moves[i])?[i]:[]);if(!rows.length)return null;
  const id=randomBytes(32).toString('hex');fs.mkdirSync(directory,{recursive:true});fs.writeFileSync(path.join(directory,id+'.json'),JSON.stringify({signature:signature(child),source:atlas.id,rows}));return id;
 }catch{return null;}}
 function resolve(id,weapon){try{if(!/^[a-f0-9]{64}$/.test(id||''))return null;const value=JSON.parse(fs.readFileSync(path.join(directory,id+'.json'),'utf8'));if(value.signature!==signature(weapon)||!/^[a-f0-9]{64}$/.test(value.source)||!Array.isArray(value.rows)||value.rows.some(i=>!Number.isInteger(i)||i<0||i>3))return null;const file=path.join(assets,value.source+'.png');return fs.existsSync(file)?{file,rows:value.rows}:null;}catch{return null;}}
 return{issue,resolve};
}
module.exports={create};
