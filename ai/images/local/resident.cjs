// Keep the exact native model context between renders; no sampling or resolution shortcuts.
const fs=require('node:fs'),net=require('node:net'),path=require('node:path'),{spawn}=require('node:child_process');
let state=null,idleTimer=null,tail=Promise.resolve();
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function request(exe,args){
 if(path.basename(exe).toLowerCase()!=='sd-cli.exe')return null;
 const value=flag=>args[args.indexOf(flag)+1],required=['--prompt-file','-r','--output','--seed','--width','--height','--steps','--cfg-scale','--sampling-method'];
 if(required.some(flag=>!args.includes(flag)))return null;
 const removed=new Set(['--prompt-file','-r','--output','--seed']),context=[];for(let i=0;i<args.length;i++){if(removed.has(args[i]))i++;else context.push(args[i]);}
 const width=Number(value('--width')),height=Number(value('--height')),steps=Number(value('--steps')),seed=Number(value('--seed')),cfg=Number(value('--cfg-scale'));
 if(![width,height,steps,seed,cfg].every(Number.isFinite)||value('--sampling-method')!=='euler')return null;
 return{exe:path.join(path.dirname(exe),'sd-server.exe'),context,file:value('--output'),body:{prompt:fs.readFileSync(value('--prompt-file'),'utf8'),width,height,seed,ref_images:[fs.readFileSync(value('-r')).toString('base64')],init_image:null,embed_image_metadata:false,sample_params:{sample_method:'euler',sample_steps:steps,guidance:{txt_cfg:cfg,img_cfg:cfg}},preview:'none',cache_mode:'disabled',output_format:'png'}};
}
async function stop(){
 clearTimeout(idleTimer);idleTimer=null;const previous=state;state=null;if(!previous)return;
 if(previous.child.exitCode!==null||previous.child.signalCode!==null)return;
 await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>{const error=Error('로컬 모델 종료를 확인하지 못했습니다.');error.noFallback=true;reject(error);},5000);previous.child.once('close',()=>{clearTimeout(timeout);resolve();});previous.child.kill();});
}
async function port(){return new Promise((resolve,reject)=>{const server=net.createServer();server.on('error',reject);server.listen(0,'127.0.0.1',()=>{const number=server.address().port;server.close(error=>error?reject(error):resolve(number));});});}
async function start(config){
 const signature=JSON.stringify([config.exe,config.context]);
 if(state&&state.signature===signature&&state.child.exitCode===null&&state.child.signalCode===null)return state;
 await stop();const number=await port(),child=spawn(config.exe,[...config.context,'--listen-ip','127.0.0.1','--listen-port',String(number)],{windowsHide:true,stdio:['ignore','ignore','ignore']}),current={child,signature,url:'http://127.0.0.1:'+number};state=current;
 let failure;child.once('error',error=>failure=error);
 for(let i=0;i<120;i++){
  if(failure||child.exitCode!==null||child.signalCode!==null)throw Error('로컬 상주 모델을 시작하지 못했습니다.');
  try{const response=await fetch(current.url+'/v1/models',{signal:AbortSignal.timeout(800)});if(response.ok)return current;}catch{}
  await pause(250);
 }
 throw Error('로컬 상주 모델 준비 시간이 초과됐습니다.');
}
async function render(config,{timeout=180000,signal:externalSignal}={}){
 clearTimeout(idleTimer);idleTimer=null;
 try{
  externalSignal?.throwIfAborted();const current=await start(config);externalSignal?.throwIfAborted();const signal=externalSignal?AbortSignal.any([externalSignal,AbortSignal.timeout(timeout)]):AbortSignal.timeout(timeout),response=await fetch(current.url+'/sdcpp/v1/img_gen',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(config.body),signal});
  if(!response.ok)throw Error('로컬 상주 모델 요청 오류');const submitted=await response.json();if(typeof submitted.id!=='string'||!/^[a-zA-Z0-9_-]+$/.test(submitted.id))throw Error('로컬 모델 작업 형식 오류');
  for(;;){
   const response=await fetch(current.url+'/sdcpp/v1/jobs/'+submitted.id,{signal});if(!response.ok)throw Error('로컬 모델 진행 조회 오류');const job=await response.json();
   if(job.status==='failed'||job.status==='cancelled')throw Error('로컬 상주 모델 생성 오류');
   if(job.status==='completed'){
    const encoded=job.result?.images?.[0]?.b64_json;if(typeof encoded!=='string'||encoded.length>16*1024*1024)throw Error('로컬 상주 이미지 형식 오류');const bytes=Buffer.from(encoded,'base64');
    if(bytes.length<33||bytes.subarray(0,8).toString('hex')!=='89504e470d0a1a0a'||bytes.readUInt32BE(16)!==config.body.width||bytes.readUInt32BE(20)!==config.body.height)throw Error('로컬 상주 이미지 크기 오류');fs.writeFileSync(config.file,bytes);return '';
   }
   await pause(200);
  }
 }catch(error){await stop();throw error;}
 finally{if(state){idleTimer=setTimeout(()=>{const idle=tail.then(stop,stop);tail=idle.catch(()=>{});},60000);idleTimer.unref();}}
}
function run(exe,args,options={}){
 if(process.env.LOCAL_AI_ENGINE==='cli'){if(path.basename(exe).toLowerCase()==='sd-cli.exe')options.onEngine?.('cli');return require('./process.cjs').run(exe,args,options);}
 const config=request(exe,args);if(!config)return require('./process.cjs').run(exe,args,options);
 const operation=tail.then(async()=>{try{const result=await render(config,options);options.onEngine?.('resident');return result;}catch(error){if(error.noFallback||options.signal?.aborted)throw error;options.onEngine?.('cli');options.onText?.('Resident unavailable; using identical CLI settings.\n');return require('./process.cjs').run(exe,args,options);}});tail=operation.catch(()=>{});return operation;
}
process.once('exit',()=>{if(state?.child.exitCode===null)state.child.kill();});
module.exports={run,request,stop};
