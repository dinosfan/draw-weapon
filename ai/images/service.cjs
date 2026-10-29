const fs=require('node:fs'),path=require('node:path'),{createHash,randomBytes}=require('node:crypto');
const{generate,MODEL}=require('./client.cjs');
const{validateInput}=require('../analyze.cjs'),{validateCreative}=require('../weapon.cjs');
const{recordUsage}=require('../usage.cjs');
function createService({key,provider='gemini',model,fetchImpl,root=path.join(__dirname,'../../dist/assets/vfx/generated'),onUsage=recordUsage,test=false,generator,vision,materialPlanner=require('./materials.cjs').plan}={}){
 if(!['gemini','local','chatkhu'].includes(provider))throw Error('지원하지 않는 연출 생성 방식');
 const local=provider==='local'||provider==='chatkhu';model=model||(local?require('./local/client.cjs').MODEL:MODEL);
 const generateImage=generator||(provider==='chatkhu'?require('../baze.cjs').generate:local?require('./local/client.cjs').generate:generate);
 const pending=new Map();let running=0,quotaUntil=0;
 async function create(input,{onProgress,signal,rowCorrections={}}={}){
  signal?.throwIfAborted();
  if(!local&&!key){const error=Error('이미지 생성 키가 설정되지 않았습니다.');error.status=503;throw error;}
  const{image:drawing}=validateInput({image:input.image,description:'무기 연출'});
  const weapon=validateCreative(input.weapon);weapon.rarity=require('../../dist/js/weapons/rarity.js').valid(input.weapon.rarity)?input.weapon.rarity:'common';
  const retryRows=input.retryRows||[];if(!Array.isArray(retryRows)||retryRows.length>4||new Set(retryRows).size!==retryRows.length||retryRows.some(i=>!Number.isInteger(i)||i<0||i>3)){const error=Error('기술 재시도 위치 형식 오류');error.status=400;throw error;}
  const inheritance=local?require('./inheritance.cjs').create(path.resolve(root,'../../../..')).resolve(input.weapon.effectInheritance,weapon):null;
  const id=createHash('sha256').update(JSON.stringify({version:2,provider,model,weapon,drawing,...(input.regenerate===true||input.retry===true||retryRows.length?{nonce:randomBytes(8).toString('hex')}:{})})).digest('hex');
  const file=path.join(root,id+'.png'),metadata=path.join(root,id+'.json');
  if(fs.existsSync(file)&&fs.existsSync(metadata)){const cached=JSON.parse(fs.readFileSync(metadata,'utf8'));if(cached.rarity!==undefined&&cached.rarity!==weapon.rarity){const error=Error('저장된 도트의 등급이 다릅니다. 같은 무기의 도트만 다시 만들어주세요.');error.status=409;throw error;}return{...cached,rarity:weapon.rarity,cached:true};}
  if(pending.has(id))return pending.get(id);
  if(Date.now()<quotaUntil){const error=Error('이미지 생성 할당량을 사용할 수 없습니다. 무기는 유지되며 연출만 나중에 다시 만들 수 있습니다.');error.status=429;throw error;}
  if(running>=1){const error=Error('다른 연출을 만들고 있습니다. 잠시 후 다시 눌러주세요.');error.status=429;throw error;}
  const task=(async()=>{running++;try{
   const onPartial=local?async partial=>{const meta=require('./partial.cjs').publish({root,owner:id,model,rarity:weapon.rarity,bytes:partial.bytes,rows:partial.rows,elapsedMs:partial.elapsedMs});if(meta){meta.local.skills=weapon.moves.map(move=>({name:move.name}));fs.writeFileSync(path.join(root,meta.id+'.json'),JSON.stringify(meta));}if(meta)onProgress?.({phase:'partial',message:meta.local.readyRows.length+'/4 기술 도트 준비 · 완성된 기술부터 사용할 수 있어',partial:meta});}:undefined;
   // Live analysis already authored the four visual briefs and glyphs from this drawing.
   // Keep using a cached refinement, but do not run another vision call for the same complete design.
   const authored=weapon.moves.every(move=>move.effectBrief&&move.delivery&&move.motionPlan);
   let materials=null;if(local&&vision){onProgress?.({phase:'materials',message:authored?'AI가 설계한 네 기술의 전용 도트 소재를 준비하고 있어…':'그림과 네 기술에서 실제로 보일 소재를 분리하고 있어…'});try{materials=await materialPlanner({weapon,drawing,config:vision,signal,cacheOnly:authored});}catch{/* Optional planning never changes the four moves. */}}
   signal?.throwIfAborted();
   const result=await generateImage({weapon,drawing,key:local?undefined:key,model,fetchImpl,onProgress,onPartial,materials,bypassCache:input.regenerate===true,retryRows,inheritance,rowCorrections,reviewSkill:local?require('./semantic-review.cjs').create({weapon,drawing,config:vision,root:path.resolve(root,'../../../..')}):undefined,onePass:['auto','glyph','off'].includes(input.onePass)?input.onePass:'auto',signal});
   signal?.throwIfAborted();
   if(result.local)result.local.materialsPrepared=!!materials;
   if(!test||onUsage!==recordUsage)onUsage({model,status:200,usage:result.usage});
   const inputCost=model===MODEL&&Number.isFinite(result.usage?.promptTokenCount)?result.usage.promptTokenCount*.5/1e6:null;
   const meta={id,provider,model,rarity:weapon.rarity,width:result.width,height:result.height,elapsedMs:result.elapsedMs,usage:result.usage||null,...(result.local?{local:result.local}:{}),estimateUSD:{imageOutput:local?0:model===MODEL?.0672:null,input:local?0:inputCost,note:local?'Local generation: no image API charge; hardware and electricity excluded':'1K image output estimate; text/thinking charges may be additional'},cached:false};
   fs.mkdirSync(root,{recursive:true});fs.writeFileSync(file,result.bytes);fs.writeFileSync(metadata,JSON.stringify(meta));return meta;
  }catch(error){if([402,429].includes(error.status))quotaUntil=Date.now()+30000;if(!test||onUsage!==recordUsage)onUsage({model,status:error.status||'failed',usage:null});throw error;}finally{running--;pending.delete(id);}})();
  pending.set(id,task);return task;
 }
 return{create,model,provider};
}
module.exports={createService};
