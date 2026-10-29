const fs=require('node:fs'),path=require('node:path'),{createHash,randomBytes}=require('node:crypto'),{validateInput}=require('../analyze.cjs'),{validateCreative}=require('../weapon.cjs'),Rarity=require('../../dist/js/weapons/rarity.js'),Plan=require('./plan.cjs');
function createService(config={}){
 const root=config.root||path.resolve(__dirname,'../..'),assets=path.join(root,'dist/assets/evolutions'),cache=path.join(root,'.local-ai/evolution/cache'),jobs=new Map(),pending=new Map();
 const meter=config.meter||(()=>{}),planner=config.planner||require('./planner.cjs').plan,renderer=config.renderer||require('./local.cjs').render,evolver=config.evolver||require('./weapon.cjs').evolve;
 function read(file){try{return JSON.parse(fs.readFileSync(file,'utf8'));}catch{return null;}}
 function write(file,data){fs.mkdirSync(cache,{recursive:true});fs.writeFileSync(file,JSON.stringify(data));}
 function publicJob(id){const job=jobs.get(id);if(!job)return null;return{id,status:job.status,phase:job.phase,message:job.message,...(job.data?{data:job.data}:{}),...(job.error?{error:job.error}:{})};}
 function start(key,work){for(const[id,j]of jobs)if(['done','failed','cancelled'].includes(j.status)&&Date.now()-j.updated>3600000)jobs.delete(id);if(pending.has(key))return{id:pending.get(key)};if([...jobs.values()].filter(j=>j.status==='running').length>=8){const e=Error('다른 진화를 준비하고 있습니다. 잠시 후 다시 시도해 주세요.');e.status=429;throw e;}
  const id=randomBytes(16).toString('hex'),job={status:'running',phase:'planning',message:'원본 그림에서 두 진화 방향을 찾고 있어…',updated:Date.now(),controller:new AbortController()};jobs.set(id,job);pending.set(key,id);
  const progress=p=>{if(!job.controller.signal.aborted)Object.assign(job,p,{updated:Date.now()});};job.ready=Promise.resolve().then(()=>work(progress,job,job.controller.signal)).then(data=>job.controller.signal.aborted?job:Object.assign(job,{status:'done',data,updated:Date.now()}),error=>job.controller.signal.aborted?job:Object.assign(job,{status:'failed',error:error.name==='TimeoutError'?'진화 AI의 응답이 지연됐어. 같은 무기로 진화를 다시 준비해 줘.':error.message,updated:Date.now()})).finally(()=>{if(pending.get(key)===id)pending.delete(key);});return{id};
 }
 function submit(input){if(!input||typeof input.image!=='string'||!input.weapon){const e=Error('진화할 무기와 원본 그림이 필요합니다.');e.status=400;throw e;}if(!config.test&&!config.key){const e=Error('그림 분석 AI 연결을 확인해 주세요.');e.status=503;throw e;}
  const {image:drawing}=validateInput({image:input.image,description:'무기 진화'}),weapon=validateCreative(input.weapon);weapon.rarity=Rarity.valid(input.weapon.rarity)?input.weapon.rarity:'common';
  if(input.weapon.evolution){const e=input.weapon.evolution;if(!Number.isInteger(e.stage)||e.stage<1||e.stage>50||typeof e.rootName!=='string'||e.rootName.length>40)throw Error('진화 계보 형식 오류');weapon.evolution={stage:e.stage,rootName:e.rootName,previousName:String(e.previousName||'').slice(0,40)};}
  const fingerprint=createHash('sha256').update(JSON.stringify({version:2,weapon,drawing})).digest('hex');
  const submitted=start('plan:'+fingerprint,async(progress,job,signal)=>{job.input={weapon,drawing,fingerprint,atlas:input.weapon.effectAtlas};const file=path.join(cache,fingerprint+'.json');let plan=read(file);
   if(plan&&plan.options?.every((o,i)=>fs.existsSync(path.join(assets,fingerprint+'-'+i+'.png')))){plan=Plan.validate(plan,weapon);return{...plan,options:plan.options.map((o,i)=>({...o,image:'assets/evolutions/'+fingerprint+'-'+i+'.png'})),sourceName:weapon.name,stage:(weapon.evolution?.stage||0)+1};}
   plan=await planner({weapon,drawing,...config,meter,signal});signal.throwIfAborted();plan=Plan.validate(plan,weapon);progress({phase:'queued',message:'두 진화 외형을 만들 차례를 기다리고 있어…'});
   const files=await renderer({weapon,drawing,options:plan.options,id:fingerprint,assets,onProgress:progress,signal});signal.throwIfAborted();plan.options=plan.options.map((o,i)=>({...o,image:files[i].image}));write(file,plan);return{...plan,sourceName:weapon.name,stage:(weapon.evolution?.stage||0)+1};
  });return submitted;
 }
 function choose(id,index){const parent=jobs.get(id);if(parent?.status!=='done'||!parent.input){const e=Error('준비된 진화형을 찾을 수 없습니다. 진화 방향부터 다시 불러와 주세요.');e.status=409;throw e;}if(index!==0&&index!==1)throw Error('진화 선택 형식 오류');
  const {weapon,drawing,fingerprint,atlas}=parent.input,option=parent.data.options[index];return start('choose:'+fingerprint+':'+index,async(progress,job,signal)=>{
   const file=path.join(cache,fingerprint+'-chosen-'+index+'.json'),stored=read(file);if(stored){if(!stored.weapon.effectInheritance){const token=require('../images/inheritance.cjs').create(root).issue(weapon,atlas,stored.weapon,stored.changes);if(token){stored.weapon.effectInheritance=token;write(file,stored);}}return stored;}
   progress({phase:'skills',message:'선택한 진화 기술을 정리하고, GPU 도트도 동시에 만들고 있어…'});const bytes=fs.readFileSync(path.join(assets,fingerprint+'-'+index+'.png')),artwork=bytes.toString('base64');
   // Start GPU artwork as soon as the player selects an evolution, alongside skill design.
   const preview=require('./merge.cjs').merge(weapon,option,weapon);preview.artwork='data:image/png;base64,'+artwork;

   for(const change of option.changes){const move=preview.moves[change.index];delete move.effectGlyph;if(move.motionPlan)for(const layer of move.motionPlan.layers)if(layer.source==='effect')delete layer.glyph;}
   const previewInheritance=require('../images/inheritance.cjs').create(root).issue(weapon,atlas,preview,option.changes.map(c=>c.index));if(previewInheritance)preview.effectInheritance=previewInheritance;
   const prepareEffects=config.effectPreparer|| (async({weapon:preview,onProgress})=>{if(config.test)return null;try{
    const effectService=require('../images/service.cjs').createService({provider:process.env.AI_IMAGE_PROVIDER==='chatkhu'?'chatkhu':'local',root:path.join(root,'dist/assets/vfx/generated'),vision:config.endpoint&&config.key?{endpoint:config.endpoint,model:config.model,key:config.key,fallbackModel:config.fallbackModel,fetchImpl:config.fetchImpl,meter:(status,usage,actualModel=model)=>meter(status,usage,actualModel)}:undefined,onUsage:entry=>meter(entry.status,entry.usage,entry.model)});
    const meta=await effectService.create({weapon:preview,image:preview.artwork},{onProgress:p=>onProgress({...p,message:'GPU · '+p.message}),signal});return meta?.id?{id:meta.id,rarity:preview.rarity,layout:meta.local?.layout,inheritedRows:meta.local?.skills?.flatMap((skill,index)=>skill.inherited?[index]:[])||[]}:null;
   }catch{return null;}});
   const effectTask=Promise.resolve().then(()=>prepareEffects({weapon:preview,drawing:artwork,option,onProgress:progress,signal})).catch(()=>null);
   const evolveTask=evolver({weapon,option,drawing:artwork,...config,meter,signal}),[evolved,effectAtlas]=await Promise.all([evolveTask,effectTask]);signal.throwIfAborted();
   // Always construct lineage and rarity here, never trust a model or client to reroll them.
   evolved.rarity=weapon.rarity;evolved.evolution={stage:(weapon.evolution?.stage||0)+1,rootName:weapon.evolution?.rootName||weapon.name,previousName:weapon.name};delete evolved.effectAtlas;delete evolved.effectJob;
   const changes=option.changes.map(c=>c.index),inheritance=require('../images/inheritance.cjs').create(root).issue(weapon,atlas,evolved,changes);if(inheritance)evolved.effectInheritance=inheritance;if(effectAtlas)evolved.effectAtlas=effectAtlas;const data={weapon:evolved,image:option.image,changes,reusedSlots:effectAtlas?.inheritedRows||[]};write(file,data);return data;
  });
 }
 function reset(){let cancelled=0;for(const job of jobs.values())if(job.status==='running'){job.controller.abort();Object.assign(job,{status:'cancelled',phase:'cancelled',message:'새 게임을 시작해 진화 작업을 종료했어.',updated:Date.now()});cancelled++;}pending.clear();return{cancelled};}
 return{submit,choose,get:publicJob,reset};
}
module.exports={createService};
