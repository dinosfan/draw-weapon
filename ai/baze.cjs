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
 if(!response.ok){const reason=JSON.stringify(data).replace(/baze_[A-Za-z0-9]+/g,'[redacted]').slice(0,3000),diagnosis=require('./image-errors.cjs').classify(response.status,data),blocked=diagnosis.blocked;console.warn(JSON.stringify({event:'chatkhu-image-error',status:response.status,model,elapsedMs:Date.now()-started,cause:diagnosis.code,upstreamCode:diagnosis.upstreamCode,reason}));
  if(fallbackModel&&fallbackModel!==model&&!signal?.aborted&&!blocked&&[400,500,502,503,504].includes(response.status)){console.warn(JSON.stringify({event:'chatkhu-image-failover',from:model,to:fallbackModel}));return image({prompt,reference,key,model:fallbackModel,fetchImpl,signal,onUsage,fallbackModel:null});}
  if(response.status===402&&fetchImpl===fetch)creditBlockedUntil=Date.now()+30000;
  const e=Error(diagnosis.message);e.status=response.status;e.code=diagnosis.code;e.upstreamCode=diagnosis.upstreamCode;throw e;}
 const url=data.data?.[0]?.url;if(!/^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(url||''))throw Error('ChatKHU 이미지 응답 형식 오류');
 let bytes=Buffer.from(url.split(',')[1],'base64');if(bytes.length>12*1024*1024)throw Error('ChatKHU 이미지 용량 초과');
 if(bytes.subarray(0,8).toString('hex')!=='89504e470d0a1a0a'){const converted=require('node:child_process').spawnSync(require('./images/local/client.cjs').paths().python,['-c',"from PIL import Image; import sys,io; im=Image.open(io.BytesIO(sys.stdin.buffer.read())); assert max(im.size)<=4096; im.convert('RGBA').save(sys.stdout.buffer,format='PNG')"],{input:bytes,maxBuffer:16*1024*1024,timeout:30000,windowsHide:true});if(converted.status!==0)throw Error('ChatKHU 이미지 PNG 변환 실패');bytes=converted.stdout;}return bytes;
}
function runner({key,model,fetchImpl,signal}={}){return async(exe,args,options={})=>{
 if(path.basename(exe).toLowerCase()!=='sd-cli.exe')return require('./images/local/process.cjs').run(exe,args,{...options,signal:signal||options.signal});
 const arg=flag=>args[args.indexOf(flag)+1];const bytes=await image({prompt:fs.readFileSync(arg('--prompt-file'),'utf8'),reference:fs.readFileSync(arg('-r')),key,model,fetchImpl,signal,...(arg('--width')==='1024'?{fallbackModel:null}:{})});
 // Existing pixel validation consumes the same 512px source layout as the local model.
 fs.writeFileSync(arg('--output'),bytes);await require('./images/local/process.cjs').run(require('./images/local/client.cjs').paths().python,['-c',"from PIL import Image; import sys; p=sys.argv[1]; n=int(sys.argv[2]); im=Image.open(p).convert('RGBA'); assert im.width==im.height and max(im.size)<=4096; assert n!=1024 or im.width>=1024; im.resize((n,n),Image.Resampling.NEAREST).save(p)",arg('--output'),arg('--width')==='1024'?'1024':'512'],{timeout:30000,signal});options.onEngine?.('ChatKHU/'+(model||MODEL));return'';
};}
async function generate(input){
 const model=process.env.AI_IMAGE_MODEL||MODEL;
 // Fresh four-skill sets use the validated 4x4 layout; unchanged/inherited rows
 // and rejected cells retain the individually validated recovery path.
 const onePass=model===MODEL&&(input.onePass===undefined||input.onePass==='auto')?'glyph':input.onePass;
 const singleSheet=model===MODEL&&onePass!=='off'&&input.singleSheet!==false;
 const result=await require('./images/local/client.cjs').generate({...input,onePass,singleSheet,concurrency:4,checkAvailability:false,runCommand:runner({signal:input.signal}),cacheModel:'chatkhu/'+model});return{...result,model};
}
function evolution(input){return require('./evolution/api.cjs').render({...input,provider:'ChatKHU API',generateImage:options=>image({...options,key:input.key,model:input.model||process.env.AI_IMAGE_MODEL||MODEL,fetchImpl:input.fetchImpl,onUsage:input.onUsage})});}
module.exports={BASE,MODEL,image,runner,generate,evolution};
