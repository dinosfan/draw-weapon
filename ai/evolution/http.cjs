function createHandler(config){const service=require('./service.cjs').createService(config);return async(req,res)=>{
 const send=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
 if(req.headers.origin){let o;try{o=new URL(req.headers.origin);}catch{return send(403,{error:'허용되지 않은 출처'});}if(!['127.0.0.1','localhost'].includes(o.hostname)||o.host!==req.headers.host)return send(403,{error:'허용되지 않은 출처'});}
 const match=/^\/api\/evolution\/jobs\/([a-f0-9]{32})(\/choose)?$/.exec(req.url||'');
 if(req.method==='POST'&&req.url==='/api/evolution/reset')return send(200,service.reset());
 if(req.method==='GET'&&match&&!match[2]){const job=service.get(match[1]);return job?send(200,job):send(404,{error:'진화 준비 기록이 만료되었습니다. 같은 그림으로 다시 불러와 주세요.'});}
 if(req.method!=='POST')return send(405,{error:'POST 요청이 필요합니다.'});
 try{let size=0,chunks=[];for await(const chunk of req){size+=chunk.length;if(size>1500000)return send(413,{error:'진화 입력 용량 초과'});chunks.push(chunk);}let input;try{input=JSON.parse(Buffer.concat(chunks).toString());}catch{return send(400,{error:'진화 입력 형식 오류'});}
  if(req.url==='/api/evolution')return send(202,service.submit(input));if(match?.[2])return send(202,service.choose(match[1],input.index));return send(404,{error:'없는 진화 기능'});
 }catch(error){send(error.status||(/형식|용량|입력/.test(error.message)?400:502),{error:error.message});}
 };}
module.exports={createHandler};
