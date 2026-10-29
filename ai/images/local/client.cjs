const fs=require('node:fs'),path=require('node:path');
const {run}=require('./resident.cjs'),prompts=require('./skill-prompts.cjs');
const ROOT=path.resolve(__dirname,'../../..'),MODEL='local/flux2-klein-4b-per-skill-v14';
function paths(root=ROOT){return{exe:path.join(root,'.local-ai/tools/sd-vulkan/sd-cli.exe'),python:process.env.PYTHON_BIN||(process.platform==='win32'?path.join(root,'.local-ai/venv/Scripts/python.exe'):'python3'),models:path.join(root,'.local-ai/models/flux2-klein'),work:process.env.AI_WORK_DIR||path.join(root,'.local-ai/jobs'),style:path.join(root,'references/vfx/nyknck-fx062/LightFX/FX003/FX003_03.png'),helper:path.join(__dirname,'skill-images.py')};}
function available(root){const p=paths(root);return[p.exe,p.python,p.style,...['diffusion.gguf','text-encoder.gguf','vae.safetensors'].map(f=>path.join(p.models,f))].every(file=>fs.existsSync(file));}
function imageResult(file){const bytes=fs.readFileSync(file);if(bytes.length<33||bytes.length>12*1024*1024||bytes.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')throw Error('로컬 연출 이미지 형식 오류');const width=bytes.readUInt32BE(16),height=bytes.readUInt32BE(20);if(width<512||width>4096||height!==width)throw Error('로컬 연출 이미지 격자 크기 오류');return{bytes,width,height};}
async function generateNow({weapon,drawing,onProgress=()=>{},onPartial,runCommand=run,root=ROOT,checkAvailability=true,bypassCache=false,materials,signal,retryRows=[],inheritance,onePass='auto',reviewSkill,rowCorrections={},cacheModel=MODEL}){
 const check=()=>signal?.throwIfAborted();check();const p=paths(root);if(checkAvailability&&!available(root)){const error=Error('로컬 이미지 모델이 준비되지 않았습니다. 로컬 설치 상태를 확인해 주세요.');error.status=503;throw error;}
 const started=Date.now(),engines=new Set();let queuedMs=0,nativeCalls=0,firstReadyMs=null;const cacheModule=require('./frame-cache.cjs'),cache=cacheModule.create(root),subjectCache=cacheModule.create(root,'effect-subjects');fs.mkdirSync(p.work,{recursive:true});const folder=fs.mkdtempSync(path.join(p.work,'vfx-'));
 const notify=(phase,message)=>onProgress({phase,message});
 const helper=async(mode,extra)=>{check();const result=await runCommand(p.python,[p.helper,mode,folder,...extra],{timeout:30000});check();return result;};
 try{
  fs.writeFileSync(path.join(folder,'drawing.png'),Buffer.from(drawing,'base64'));
  notify('preparing','각 기술의 이름과 설명으로 도트 연출을 준비하고 있어…');
  await helper('prepare',['--style',p.style]);
  const render=async(stem,prompt,reference)=>{check();
   const promptFile=path.join(folder,stem+'.txt'),file=path.join(folder,stem+'.png');fs.writeFileSync(promptFile,prompt);
   const args=['--diffusion-model',path.join(p.models,'diffusion.gguf'),'--llm',path.join(p.models,'text-encoder.gguf'),'--vae',path.join(p.models,'vae.safetensors'),'--backend','diffusion=Vulkan0,te=Vulkan0,vae=Vulkan0','--offload-to-cpu','--max-vram','12','--mmap','--flash-attn','on',...require('../../../scripts/local-ai/klein-profiles.cjs').direct.extra,'-r',reference,'--prompt-file',promptFile,'--steps','4','--cfg-scale','1','--sampling-method','euler','--width','512','--height','512','--seed',String(require('node:crypto').randomInt(1,2147483647)),'--disable-image-metadata','--output',file];
   nativeCalls++;await runCommand(p.exe,args,{timeout:180000,onEngine:engine=>engines.add(engine)});check();return file;
  };
  const skills=[],ready=new Set(),failures=[],order=require('./schedule.cjs').order(weapon);
  const inspect=async(index,file)=>require('./runtime-check.cjs').check(JSON.parse(await helper('inspect',['--index',String(index),'--image',file])),index,weapon.moves[index].element);
  const publish=async()=>{if(!onPartial||!ready.size||ready.size===4)return;try{const rows=[...ready].sort();await helper('pack',['--rows',rows.join(',')]);await onPartial({...imageResult(path.join(folder,'atlas.png')),rows,elapsedMs:Date.now()-started});if(firstReadyMs===null)firstReadyMs=Date.now()-started;}catch{}};
  // Reuse all verified inherited/cached rows before occupying the GPU for new rows.
  for(const index of order){check();const originalMove=weapon.moves[index],material=materials?.find(m=>m.index===index&&m.name===originalMove.name),move=material?{...originalMove,renderMaterial:material.visible,excludeCarrier:material.forbidden,effectGlyph:material.glyph}:originalMove,subjectPrompt=prompts.subject(weapon,move),animationPrompt=prompts.animation(weapon,move),cacheKey=cacheModule.key({model:cacheModel,drawing,subject:subjectPrompt,animation:animationPrompt}),skillStarted=Date.now();
   const cachedFile=path.join(folder,index+'-cached.png');let inspection,reused=false,repaired=false,inherited=false;
   if(!retryRows.includes(index)&&(!bypassCache||retryRows.length)&&cache.restore(cacheKey,cachedFile)){notify('validating',(index+1)+'/4 · '+move.name+'의 완성된 도트를 다시 검사하고 있어…');try{inspection=await inspect(index,cachedFile);reused=inspection.valid===true;}catch{reused=false;}}
   if(!reused&&!retryRows.includes(index)&&(!bypassCache||retryRows.length)&&inheritance?.rows.includes(index)){try{notify('validating',(index+1)+'/4 · '+move.name+'은 계승한 도트를 그대로 사용해');inspection=require('./runtime-check.cjs').check(JSON.parse(await helper('inherit',['--index',String(index),'--image',inheritance.file])),index,move.element);reused=inspection.valid===true;inherited=reused;}catch{}}

   if(reused){skills[index]={name:move.name,repaired:false,reused:true,inherited,runtimeChecked:inspection.runtimeChecked===true,coverage:inspection.coverage,transparencyChecked:inspection.transparencyChecked,elapsedMs:Date.now()-skillStarted};ready.add(index);}
  }
  await publish();
  for(const index of order){check();if(ready.has(index))continue;
   try{
   const originalMove=weapon.moves[index],material=materials?.find(m=>m.index===index&&m.name===originalMove.name),move=material?{...originalMove,renderMaterial:material.visible,excludeCarrier:material.forbidden,effectGlyph:material.glyph}:originalMove,skillStarted=Date.now(),subjectPrompt=prompts.subject(weapon,move),animationPrompt=prompts.animation(weapon,move),cacheKey=cacheModule.key({model:cacheModel,drawing,subject:subjectPrompt,animation:animationPrompt});
   let inspection,reused=false,repaired=false,file,semantic;let fastAccepted=false;
   const correction=typeof rowCorrections[index]==='string'?rowCorrections[index].slice(0,400):'';
   const corrected=prompt=>correction?prompt+'\nVisual QA correction (appearance only, never change the skill): '+correction:prompt;
   if(!reused){notify('queued',(ready.size+1)+'/4 · '+move.name+' 도트 생성 차례를 기다리고 있어…');
   await require('./gpu-queue.cjs').exclusive(async()=>{check();
   const fast=correction||retryRows.includes(index)?null:require('./fast-path.cjs').select({root,move,mode:onePass});
   if(fast){const tokens=require('../../../dist/js/palette.js').tokens,colors=(material?.glyph?['ink','dragon','paper','metal']:['ink','dark','dragon','paper']).map(k=>[1,3,5].map(i=>parseInt(tokens[k].slice(i,i+2),16)));fs.writeFileSync(path.join(folder,index+'-glyph.json'),JSON.stringify({glyph:fast.glyph,colors}));await helper('glyph-guide',['--index',String(index)]);notify('animating',(ready.size+1)+'/4 · '+move.name+'의 소재와 동작을 한 번에 만들고 있어…');file=await render(index+'-direct',prompts.direct(weapon,move),path.join(folder,index+'-guide.png'));inspection=await inspect(index,file);fastAccepted=inspection.valid===true;}
   if(!fast||!inspection?.valid){notify('generating',(ready.size+1)+'/4 · '+move.name+' 도트 소재를 만들고 있어…');const subjectKey=cacheModule.key({model:cacheModel,drawing,subject:subjectPrompt,animation:'validated-subject-v1'}),cachedSubject=path.join(folder,index+'-subject-cached.png');let guideReady=false;if(!correction&&(!bypassCache||retryRows.length)&&subjectCache.restore(subjectKey,cachedSubject)){try{await helper('guide',['--index',String(index),'--image',cachedSubject]);guideReady=true;}catch{}}if(!guideReady){const subject=await render(index+'-subject',corrected(subjectPrompt),path.join(folder,'style-ref.png'));await helper('guide',['--index',String(index),'--image',subject]);subjectCache.save(subjectKey,subject,{valid:true});}notify('animating',(ready.size+1)+'/4 · '+move.name+'의 동작 네 장면을 만들고 있어…');file=await render(index+'-animation',corrected(animationPrompt),path.join(folder,index+'-guide.png'));inspection=await inspect(index,file);}
   if(!inspection.valid){notify('repairing',(ready.size+1)+'/4 · '+move.name+'의 잘린 장면을 보완하고 있어…');file=await render(index+'-repair',corrected(prompts.repair(weapon,move,inspection.issues)),file);inspection=await inspect(index,file);repaired=true;}
   if(!inspection.valid){const error=Error(move.name+'의 도트 프레임을 완성하지 못했습니다. 기본 기술과 공격은 계속 사용할 수 있습니다.');error.failedRows=[index];throw error;}
   },{onStart:info=>queuedMs+=info.queuedMs});}
   if(reviewSkill){notify('reviewing',(index+1)+'/4 · '+move.name+'의 그림과 기술 컨셉을 확인하고 있어…');semantic=await reviewSkill({file,index,signal});check();if(semantic?.verdict==='mismatch'){const error=Error(move.name+'의 도트가 기술 컨셉과 달라 다시 준비합니다.');error.failedRows=[index];error.correction=semantic.correction;throw error;}}
   cache.save(cacheKey,file,inspection);
   skills[index]={semantic:semantic?.verdict||'unverified',name:move.name,method:fastAccepted?'one-pass':'two-pass',runtimeChecked:inspection.runtimeChecked===true,repaired,reused,coverage:inspection.coverage,transparencyChecked:inspection.transparencyChecked,elapsedMs:Date.now()-skillStarted};ready.add(index);
   await publish();
   }catch(error){check();if(!error.failedRows&&[400,500,502,503,504].includes(error.status))error.failedRows=[index];if(!error.failedRows)throw error;failures.push({index,message:error.message,correction:error.correction});notify('skill-failed',(index+1)+'/4 기술은 다시 준비하고, 다른 기술의 도트를 먼저 만들고 있어…');}
  }
  if(failures.length){const error=Error('일부 기술 도트 프레임을 완성하지 못했습니다. 완성된 기술은 보존됩니다.');error.failedRows=failures.map(f=>f.index);error.rowCorrections=Object.fromEntries(failures.filter(f=>f.correction).map(f=>[f.index,f.correction]));throw error;}
  notify('validating','네 기술 16개 장면의 투명 배경을 검사하고 있어…');
  await helper('pack',[]);
  return{...imageResult(path.join(folder,'atlas.png')),elapsedMs:Date.now()-started,model:MODEL,usage:null,local:{layout:'skill-2x2-v1',repaired:skills.some(s=>s.repaired),coverage:skills.map(s=>s.coverage),transparencyChecked:skills.reduce((count,s)=>count+(s.transparencyChecked||0),0),queuedMs,nativeCalls,engines:[...engines],firstReadyMs,reusedSkills:skills.filter(s=>s.reused).length,inheritedSkills:skills.filter(s=>s.inherited).length,generationOrder:order,skills}};
 }finally{
  // Only flat files in this private, freshly-created job directory are removed.
  for(const name of fs.readdirSync(folder)){const file=path.join(folder,name);if(fs.lstatSync(file).isFile())fs.unlinkSync(file);}try{fs.rmdirSync(folder);}catch{}
 }
}
const generate=generateNow;
module.exports={generate,MODEL,available,paths,imageResult};
