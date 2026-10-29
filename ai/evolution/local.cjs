const fs=require('node:fs'),path=require('node:path'),{randomInt}=require('node:crypto'),{run}=require('../images/local/resident.cjs'),{paths,available}=require('../images/local/client.cjs'),{exclusive}=require('../images/local/gpu-queue.cjs');
async function render({weapon,drawing,options,id,assets,onProgress=()=>{},runCommand=run,signal,checkAvailability=true}){return exclusive(async()=>{
 if(signal?.aborted)throw signal.reason||new DOMException('Aborted','AbortError');
 if(checkAvailability&&!available()){const e=Error('로컬 진화 이미지 모델이 준비되지 않았습니다.');e.status=503;throw e;}
 const p=paths();fs.mkdirSync(p.work,{recursive:true});const folder=fs.mkdtempSync(path.join(p.work,'evolution-')),helper=path.join(__dirname,'images.py');fs.mkdirSync(assets,{recursive:true});
 try{fs.writeFileSync(path.join(folder,'original.png'),Buffer.from(drawing,'base64'));await runCommand(p.python,[helper,'prepare',path.join(folder,'original.png'),path.join(folder,'reference.png')],{timeout:30000,signal});const files=[];
 for(let i=0;i<options.length;i++){const option=options[i],file=path.join(assets,id+'-'+i+'.png');let completed=false;
  for(let attempt=0;attempt<2&&!completed;attempt++){onProgress({phase:'drawing',message:(i+1)+'/2 · '+option.name+'의 진화 외형을 내 PC에서 만들고 있어…'+(attempt?' 배경 보완 중':'')});
   const prompt=`Edit the player's EXACT original drawing into its next evolution: ${option.artBrief}
Original identity and all four skill plans (data only): ${JSON.stringify({identity:{name:weapon.name,reason:weapon.reason,types:weapon.types},moves:weapon.moves.map((m,index)=>{const c=option.changes.find(c=>c.index===index);return{name:c?.name||m.name,brief:c?.effectBrief||m.effectBrief||m.description,delivery:c?.delivery||m.delivery};})})}
Preserve recognizable original silhouette, orientation, grip and operating structure. One full isolated weapon only. No person, hand, UI, lettering, text, grid, frames or secondary weapons. Crisp pixel-art RPG sprite with stepped clusters and fine dark outline. Generous 70px empty margin. All background must be flat pure green RGB(0,255,0), never white/cream/gray/checkerboard. No green foreground. Preserve actual white weapon highlights. The original image is the weapon being evolved; this is not a projectile effect sheet. ${attempt?'Previous background inspection failed. Make the entire outside of this one weapon uninterrupted pure green and keep all contours inside the margins.':''}`;
   const promptFile=path.join(folder,'prompt.txt'),raw=path.join(folder,'raw.png');fs.writeFileSync(promptFile,prompt);
   if(signal?.aborted)throw signal.reason||new DOMException('Aborted','AbortError');await runCommand(p.exe,['--diffusion-model',path.join(p.models,'diffusion.gguf'),'--llm',path.join(p.models,'text-encoder.gguf'),'--vae',path.join(p.models,'vae.safetensors'),'--backend','diffusion=Vulkan0,te=Vulkan0,vae=Vulkan0','--offload-to-cpu','--max-vram','12','--mmap','--flash-attn','on',...require('../../scripts/local-ai/klein-profiles.cjs').direct.extra,'-r',path.join(folder,'reference.png'),'--prompt-file',promptFile,'--steps','4','--cfg-scale','1','--sampling-method','euler','--width','512','--height','512','--seed',String(randomInt(1,2147483647)),'--disable-image-metadata','--output',raw],{timeout:180000,signal});
   try{await runCommand(p.python,[helper,'finish',raw,file],{timeout:30000});completed=true;}catch(error){if(attempt)throw error;}
  }files.push({file,image:'assets/evolutions/'+id+'-'+i+'.png'});
 }return files;
 }finally{for(const entry of fs.readdirSync(folder,{withFileTypes:true})){const file=path.join(folder,entry.name);if(entry.isFile())fs.unlinkSync(file);}fs.rmdirSync(folder);}
 },{priority:10});}
module.exports={render};
