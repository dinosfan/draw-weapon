const fs=require('node:fs'),path=require('node:path');
const BASE='https://factchat-cloud.mindlogic.ai/v1/gateway',MODEL='gemini-nano-banana-2.1';
let creditBlockedUntil=0;
async function image({prompt,reference,key=process.env.BAZE_API_KEY,model=process.env.AI_IMAGE_MODEL||MODEL,fetchImpl=fetch,signal,onUsage=require('./usage.cjs').recordUsage,fallbackModel=process.env.AI_IMAGE_FALLBACK_MODEL||'gemini-3.1-flash-image-preview'}){
 if(!key)throw Error('ChatKHU 이미지 API 키가 없습니다.');
 if(Date.now()<creditBlockedUntil&&fetchImpl===fetch){const e=Error('ChatKHU 크레딧이 부족해 도트 생성이 대기 중이야. 완성된 도트는 보존돼. 크레딧을 보충한 뒤 다시 만들 수 있어.');e.status=402;throw e;}
 const transportSignal=signal?AbortSignal.any([signal,AbortSignal.timeout(180000)]):AbortSignal.timeout(180000);
 const started=Date.now();
 let response=await fetchImpl(BASE+'/images/generate/',{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json','User-Agent':'DrawWeapon/1.0'},body:JSON.stringify({model,prompt,aspect_ratio:'1:1',image_size:'1K',number_of_images:1,...(reference?{input_images:['data:image/png;base64,'+reference.toString('base64')]}:{})}),signal:transportSignal});
 let data;try{data=await response.json();}catch{data={detail:{code:'non_json_upstream',message:'Image provider returned a non-JSON response'}};response={ok:false,status:response.status>=400?response.status:502};}onUsage({model,status:response.status,usage:data.usage});
 if(!response.ok){const reason=JSON.stringify(data).replace(/baze_[A-Za-z0-9]+/g,'[redacted]').slice(0,3000);console.warn(JSON.stringify({event:'chatkhu-image-error',status:response.status,model,elapsedMs:Date.now()-started,reason}));const classification=reason.toLowerCase(),blocked=/safety|content.?filter|blocked|policy|prohibited|invalid.?api|permission|credit|quota|validation|invalid.?parameter|input.?image|unsupported.?parameter/.test(classification);
  if(fallbackModel&&fallbackModel!==model&&!signal?.aborted&&!blocked&&[400,500,502,503,504].includes(response.status)){console.warn(JSON.stringify({event:'chatkhu-image-failover',from:model,to:fallbackModel}));return image({prompt,reference,key,model:fallbackModel,fetchImpl,signal,onUsage,fallbackModel:null});}
  if(response.status===402&&fetchImpl===fetch)creditBlockedUntil=Date.now()+30000;
  const e=Error('ChatKHU 이미지 생성 실패 ('+response.status+') · '+(response.status===402?'크레딧이 부족해. 완성된 도트는 보존돼. 크레딧을 보충한 뒤 다시 만들 수 있어.':response.status===401?'API 키를 확인해 줘.':response.status===403?'모델 사용 권한을 확인해 줘.':blocked?'이미지 요청이 거절됐어. 원인을 확인해야 해.':'Nano Banana 응답을 완료하지 못했어. 완성된 도트는 보존돼.'));e.status=response.status;throw e;}
 const url=data.data?.[0]?.url;if(!/^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(url||''))throw Error('ChatKHU 이미지 응답 형식 오류');
 let bytes=Buffer.from(url.split(',')[1],'base64');if(bytes.length>12*1024*1024)throw Error('ChatKHU 이미지 용량 초과');
 if(bytes.subarray(0,8).toString('hex')!=='89504e470d0a1a0a'){const converted=require('node:child_process').spawnSync(require('./images/local/client.cjs').paths().python,['-c',"from PIL import Image; import sys,io; im=Image.open(io.BytesIO(sys.stdin.buffer.read())); assert max(im.size)<=4096; im.convert('RGBA').save(sys.stdout.buffer,format='PNG')"],{input:bytes,maxBuffer:16*1024*1024,timeout:30000,windowsHide:true});if(converted.status!==0)throw Error('ChatKHU 이미지 PNG 변환 실패');bytes=converted.stdout;}return bytes;
}
function runner({key,model,fetchImpl,signal}={}){return async(exe,args,options={})=>{
 if(path.basename(exe).toLowerCase()!=='sd-cli.exe')return require('./images/local/process.cjs').run(exe,args,{...options,signal:signal||options.signal});
 const arg=flag=>args[args.indexOf(flag)+1];const bytes=await image({prompt:fs.readFileSync(arg('--prompt-file'),'utf8'),reference:fs.readFileSync(arg('-r')),key,model,fetchImpl,signal});
 // Existing pixel validation consumes the same 512px source layout as the local model.
 fs.writeFileSync(arg('--output'),bytes);await require('./images/local/process.cjs').run(require('./images/local/client.cjs').paths().python,['-c',"from PIL import Image; import sys; p=sys.argv[1]; im=Image.open(p).convert('RGBA'); im.resize((512,512),Image.Resampling.NEAREST).save(p)",arg('--output')],{timeout:30000,signal});options.onEngine?.('ChatKHU/'+(model||MODEL));return'';
};}
async function generate(input){const result=await require('./images/local/client.cjs').generate({...input,checkAvailability:false,runCommand:runner({signal:input.signal}),cacheModel:'chatkhu/'+(process.env.AI_IMAGE_MODEL||MODEL)});return{...result,model:process.env.AI_IMAGE_MODEL||MODEL};}
function evolution(input){return require('./evolution/local.cjs').render({...input,checkAvailability:false,runCommand:runner({signal:input.signal})});}
module.exports={BASE,MODEL,image,runner,generate,evolution};
