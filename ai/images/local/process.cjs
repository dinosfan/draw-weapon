const {spawn}=require('node:child_process');
function run(exe,args,{timeout=180000,onText=()=>{},signal}={}){
 return new Promise((resolve,reject)=>{
  if(signal?.aborted){reject(signal.reason||new DOMException('Aborted','AbortError'));return;}
  const child=spawn(exe,args,{windowsHide:true,stdio:['ignore','pipe','pipe']});let stdout='',settled=false,timedOut=false;
  const timer=setTimeout(()=>{timedOut=true;child.kill();},timeout);
  const abort=()=>child.kill();signal?.addEventListener('abort',abort,{once:true});
  child.stdout.on('data',chunk=>{if(stdout.length<1000000)stdout+=chunk.toString();onText(chunk.toString());});
  child.stderr.on('data',chunk=>onText(chunk.toString()));
  child.on('error',()=>{if(settled)return;settled=true;clearTimeout(timer);signal?.removeEventListener('abort',abort);const error=Error('로컬 연출 실행기를 시작하지 못했습니다.');error.status=503;reject(error);});
  child.on('close',code=>{if(settled)return;settled=true;clearTimeout(timer);signal?.removeEventListener('abort',abort);if(signal?.aborted){reject(signal.reason||new DOMException('Aborted','AbortError'));return;}if(code!==0||timedOut){const error=Error(timedOut?'로컬 연출 생성 시간이 초과됐습니다.':'로컬 연출 생성에 실패했습니다. 무기는 그대로 유지됩니다.');error.status=timedOut?504:502;reject(error);}else resolve(stdout);});
 });
}
module.exports={run};
