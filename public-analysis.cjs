// Each visitor owns these jobs. A reset closes the internal response so the
// existing analysis handler aborts its upstream request as well.
const {randomBytes,createHash}=require('node:crypto'),{Readable}=require('node:stream'),{EventEmitter}=require('node:events');
function createJobs({dispatch,onActive=()=>{},host=()=> '127.0.0.1:'+(process.env.PORT||4174)}={}){
 const jobs=new Map(),fingerprints=new Map(),work=new Map();let epoch=0;
 const failure=(status,message)=>{const error=Error(message);error.status=status;return error;};
 function submit(chunks,{generation=epoch,admit=()=>{}}={}){
  if(generation!==epoch)throw failure(409,'새 게임을 시작해 이전 그림 분석을 종료했어.');
  const bytes=Buffer.concat(chunks),fingerprint=createHash('sha256').update(String(epoch)).update(bytes).digest('hex'),existing=fingerprints.get(fingerprint);
  if(existing&&jobs.has(existing))return{id:existing};
  if(jobs.size>=20)throw failure(429,'이번 테스트의 제작 횟수를 모두 사용했어.');
  admit();
  const id=randomBytes(16).toString('hex'),job={id,status:'running'},result=new EventEmitter(),internal=Readable.from(chunks);let settled=false;
  jobs.set(id,job);fingerprints.set(fingerprint,id);Object.assign(internal,{method:'POST',url:'/api/ai/analyze',headers:{host:host(),'content-type':'application/json'}});
  result.writableEnded=false;result.status=200;result.writeHead=status=>{result.status=status;};
  const finish=outcome=>{if(settled)return;settled=true;Object.assign(job,outcome);result.writableEnded=true;work.delete(id);onActive(-1);};
  result.end=body=>{if(settled||job.status==='cancelled')return;try{const data=JSON.parse(body);finish(result.status===200?{status:'done',data:data.data}:{status:'failed',error:data.error||'분석을 완료하지 못했어.'});}catch{finish({status:'failed',error:'분석 서버 응답을 확인하지 못했어.'});}};
  work.set(id,()=>{if(settled)return;const message='새 게임을 시작해 이전 그림 분석을 종료했어.';const outcome={status:'cancelled',message,error:message};Object.assign(job,outcome);try{result.emit('close');}catch{}finally{internal.destroy();finish(outcome);}});
  onActive(1);try{dispatch(internal,result);}catch{finish({status:'failed',error:'분석을 시작하지 못했어. 그림은 그대로야.'});}
  return{id};
 }
 function reset(){epoch++;fingerprints.clear();const count=work.size;for(const cancel of [...work.values()])cancel();return{cancelled:count};}
 return{submit,reset,epoch:()=>epoch,get:id=>{const job=jobs.get(id);return job?{...job}:null;}};
}
module.exports={createJobs};
