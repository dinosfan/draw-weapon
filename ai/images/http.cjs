const{createService}=require('./service.cjs');
function createHandler(config){
 const service=createService(config);
 const jobs=require('./jobs.cjs').createJobs(service,{latestOnly:!config.test&&['local','chatkhu'].includes(service.provider)});
 return async(req,res)=>{
  const send=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
  if(req.headers.origin){let origin;try{origin=new URL(req.headers.origin);}catch{return send(403,{error:'허용되지 않은 출처'});}if(!['localhost','127.0.0.1'].includes(origin.hostname)||origin.host!==req.headers.host)return send(403,{error:'허용되지 않은 출처'});}
  if(req.method==='POST'&&req.url==='/api/ai/effects/reset'){try{let body='';for await(const chunk of req){body+=chunk;if(body.length>256)return send(413,{error:'초기화 입력 용량 초과'});}const epoch=body?JSON.parse(body).epoch:0;if(!Number.isSafeInteger(epoch)||epoch<0)return send(400,{error:'게임 순서 형식 오류'});return send(200,jobs.reset(epoch));}catch{return send(400,{error:'초기화 입력 형식 오류'});}}
  if(req.method==='GET'&&req.url?.startsWith('/api/ai/effects/jobs/')){const id=req.url.slice('/api/ai/effects/jobs/'.length);if(!/^[a-f0-9]{32}$/.test(id))return send(404,{error:'연출 작업을 찾을 수 없습니다.'});const job=jobs.get(id);return job?send(200,job):send(404,{error:'연출 작업이 만료됐습니다. 연출만 다시 만들어주세요.'});}
  if(req.method!=='POST')return send(405,{error:'POST 요청이 필요합니다.'});
  try{
   let size=0;const chunks=[];for await(const chunk of req){size+=chunk.length;if(size>1500000)return send(413,{error:'이미지 입력 용량 초과'});chunks.push(chunk);}
   let input;try{input=JSON.parse(Buffer.concat(chunks).toString());}catch{return send(400,{error:'입력 형식 오류'});}
   if(!input||typeof input!=='object'||!input.weapon||!input.image)return send(400,{error:'무기와 원본 그림이 필요합니다.'});
   if(['local','chatkhu'].includes(service.provider)){if(input.replace===true){try{require('../analyze.cjs').validateInput({image:input.image});if(input.retryRows!==undefined)require('./partial.cjs').readyRows(input.retryRows);require('../weapon.cjs').validateCreative(input.weapon);}catch(error){error.status=400;throw error;}}return send(202,jobs.submit(input));}
   const result=await service.create(input);send(200,{data:result});
  }catch(error){const status=error.status||(/형식|크기|입력/.test(error.message)?400:502);send(status,{error:error.name==='TimeoutError'?'이미지 생성 시간이 초과됐습니다. 무기는 그대로 남아 있습니다.':error.message});}
 };
}
module.exports={createHandler};
