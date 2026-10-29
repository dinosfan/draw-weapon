const{randomBytes,createHash}=require('node:crypto');
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
function identity(input){const weapon={...input.weapon};for(const key of ['effectJob','effectAtlas','artwork'])delete weapon[key];try{const normalized=require('../weapon.cjs').validateCreative(weapon);normalized.rarity=weapon.rarity||'common';return hash(normalized);}catch{return hash(input.weapon?weapon:input);}}
function createJobs(service,{latestOnly:initialLatest=false}={}){
 const jobs=new Map(),queue=[],pending=new Map();let active=false,activeId=null,currentIdentity=null,latestOnly=initialLatest,latestEpoch=0;
 function cancelled(job){job.controller.abort();Object.assign(job,{status:'cancelled',phase:'cancelled',message:'새 게임을 시작해 이전 무기의 미완성 도트 작업을 종료했어.',updated:Date.now()});if(pending.get(job.fingerprint)===job.id)pending.delete(job.fingerprint);}
 function cancelAll(except){let count=0;for(const job of jobs.values())if(['queued','running'].includes(job.status)&&job.fingerprint!==except){cancelled(job);count++;}return count;}
 function reset(epoch=0){if(!Number.isSafeInteger(epoch)||epoch<latestEpoch)return{cancelled:0};latestEpoch=epoch;latestOnly=true;currentIdentity=null;return{cancelled:cancelAll()};}
 function drain(){if(active)return;let item;while(queue.length){const candidate=queue.shift();if(jobs.get(candidate.id)?.status!=='cancelled'){item=candidate;break;}}if(!item)return;active=true;const{id,input,fingerprint}=item,job=jobs.get(id);activeId=id;job.status='running';
  const progress=p=>{if(!job.controller.signal.aborted)Object.assign(job,{phase:p.phase,message:(job.attempt>1?'자동 재시도 · ':'')+p.message,...(p.partial?{partial:p.partial}:{}),updated:Date.now()});};
  (async()=>{let nextInput=input;for(let attempt=1;attempt<=2;attempt++){job.controller.signal.throwIfAborted();job.attempt=attempt;try{return await service.create(nextInput,{onProgress:progress,signal:job.controller.signal,rowCorrections:job.rowCorrections});}catch(error){if(job.controller.signal.aborted||attempt===2||[400,401,402,403,413].includes(error.status)||/입력 용량|원본 그림|무기와 원본/.test(error.message))throw error;if(error.failedRows?.length)nextInput={...input,regenerate:false,retry:true,retryRows:error.failedRows};else if(input.regenerate===true)nextInput={...input,regenerate:false,retry:true};job.rowCorrections={...(job.rowCorrections||{}),...(error.rowCorrections||{})};progress({phase:'retrying',message:'도트 생성을 마치지 못해 같은 기술로 다시 만들고 있어…'});}}})().then(data=>{if(!job.controller.signal.aborted)Object.assign(job,{status:'done',data,updated:Date.now()});},error=>{if(!job.controller.signal.aborted)Object.assign(job,{status:'failed',retryExhausted:true,error:error.message,errorStatus:error.status||502,...(error.failedRows?{failedRows:error.failedRows}:{}),updated:Date.now()});}).finally(()=>{if(pending.get(fingerprint)===id)pending.delete(fingerprint);active=false;activeId=null;drain();});
 }
 function sweep(){for(const[id,job]of jobs)if(['done','failed','cancelled'].includes(job.status)&&Date.now()-job.updated>600000)jobs.delete(id);}
 function submit(input){
  sweep();const epoch=Number.isSafeInteger(input.epoch)?input.epoch:0,stale=epoch<latestEpoch,owner=identity(input),fingerprint=hash({...input,replace:undefined,weapon:input.weapon?{...input.weapon,effectJob:undefined,effectAtlas:undefined}:undefined});
  if(input.replace===true&&!stale){latestEpoch=epoch;latestOnly=true;currentIdentity=owner;cancelAll(fingerprint);}
  if(pending.has(fingerprint))return{id:pending.get(fingerprint)};
  if([...jobs.values()].filter(job=>['queued','running'].includes(job.status)).length>=32){const error=Error('잠시 후 연출 생성을 다시 시도해 주세요.');error.status=429;throw error;}
  const id=randomBytes(16).toString('hex'),job={id,status:'queued',phase:'queued',message:'로컬 도트 생성 차례를 기다리고 있어…',createdAt:Date.now(),updated:Date.now(),controller:new AbortController(),fingerprint};jobs.set(id,job);
  if(stale||latestOnly&&currentIdentity!==owner){cancelled(job);return{id};}
  pending.set(fingerprint,id);queue.push({id,input,fingerprint});drain();return{id};
 }
 function get(id){sweep();const job=jobs.get(id);if(!job)return null;const{updated,controller,fingerprint,rowCorrections,...visible}=job;if(job.status==='queued'){visible.ahead=queue.filter(q=>jobs.get(q.id)?.status==='queued').findIndex(q=>q.id===id)+(active?1:0);visible.finishingCancelled=jobs.get(activeId)?.status==='cancelled';}return visible;}
 return{submit,get,reset};
}
module.exports={createJobs};
