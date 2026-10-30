const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),{randomBytes}=require('node:crypto');
const {createServer}=require('./serve.cjs');
function createPublicServer({factory=()=>createServer(),secure=true,feedbackFile=path.join(__dirname,'output/playtest-feedback.jsonl')}={}){
 const sessions=new Map();
 const server=http.createServer(async(req,res)=>{
  const json=(status,body)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(body));};
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','same-origin');res.setHeader('X-Frame-Options','DENY');
  let url;try{url=new URL(req.url,'http://localhost');}catch{return json(400,{error:'주소 형식 오류'});}
  if(url.pathname==='/workshop-catch.html')res.setHeader('X-Frame-Options','SAMEORIGIN');
  if(url.pathname==='/healthz'&&req.method==='GET')return json(200,{status:'ok'});
  const local=/^(127\.0\.0\.1|localhost):4180$/.test(req.headers.host||'');
  if(req.headers.origin){let origin;try{origin=new URL(req.headers.origin);}catch{return json(403,{error:'허용되지 않은 출처'});}if(origin.host!==req.headers.host)return json(403,{error:'허용되지 않은 출처'});}
  if(url.pathname==='/api/public-info'){let state={};try{state=JSON.parse(fs.readFileSync(path.join(__dirname,'output/public-launch.json'),'utf8'));}catch{}return json(200,{online:true,url:process.env.RENDER_EXTERNAL_URL||process.env.PUBLIC_BASE_URL||state.url||null,local,cloud:process.env.RENDER==='true'});}
  if(url.pathname==='/'||url.pathname==='/index.html'){res.writeHead(302,{Location:'/start.html'});return res.end();}
  const pages=new Set(['/start.html','/craft.html','/battle.html','/evolve.html','/library.html','/rarity-effects-lab.html','/feedback.html','/workshop-catch.html']);
  if(!url.pathname.startsWith('/api/')){if(!pages.has(url.pathname)&&!/^\/(?:css|js|assets)\/[a-zA-Z0-9_./-]+$/.test(url.pathname))return json(404,{error:'없는 페이지'});return require('./static.cjs').serveStatic(req,res)||json(404,{error:'없는 파일'});}
  const now=Date.now();for(const[id,s]of sessions)if(now-s.last>3600000&&s.inflight===0){s.server.close();sessions.delete(id);}
  const cookie=(req.headers.cookie||'').match(/(?:^|;\s*)dw_session=([a-f0-9]{48})(?:;|$)/);let id=cookie?.[1],session=sessions.get(id);
  if(!session){if(sessions.size>=20)return json(429,{error:'공개 테스트 접속이 많아. 잠시 뒤 다시 접속해 줘.'});id=randomBytes(24).toString('hex');session={server:factory(),last:now,inflight:0,minute:now,calls:0,total:0,feedback:0};const owned=session;session.analyses=require('./public-analysis.cjs').createJobs({dispatch:(req,res)=>owned.server.emit('request',req,res),onActive:delta=>owned.inflight+=delta});sessions.set(id,session);res.setHeader('Set-Cookie','dw_session='+id+'; HttpOnly; SameSite=Lax; Path=/; Max-Age=3600'+(secure&&!local?'; Secure':''));}
  session.last=now;
  if(req.method==='GET'&&/^\/api\/ai\/analyze-jobs\/[a-f0-9]{32}$/.test(url.pathname)){const job=session.analyses.get(url.pathname.split('/').pop());return job?json(200,job):json(404,{error:'분석 작업을 찾지 못했어. 그림은 유지돼.'});}
  const reset=req.method==='POST'&&['/api/ai/effects/reset','/api/evolution/reset'].includes(url.pathname),analysisPost=req.method==='POST'&&url.pathname==='/api/ai/analyze-jobs';
  const analysisEpoch=session.analyses.epoch();if(reset)session.analyses.reset();
  if(req.method==='POST'&&!reset){
   if(now-session.minute>=60000){session.minute=now;session.calls=0;}
   if(++session.calls>12||(!analysisPost&&session.inflight>=3))return json(429,{error:'요청이 많아. 진행 중인 작업을 기다려 줘.'});
   if(/\/(?:analyze|effects|evolution)$|\/choose$/.test(url.pathname)&&!url.pathname.endsWith('/reset')&&++session.total>40)return json(429,{error:'이번 테스트의 제작 횟수를 모두 사용했어. 평가를 남겨 줘.'});
  }
  if(analysisPost){
   try{let chunks=[],size=0;for await(const part of req){size+=part.length;if(size>1450000)return json(413,{error:'입력 용량 초과'});chunks.push(part);}
    const job=session.analyses.submit(chunks,{generation:analysisEpoch,admit:()=>{if(session.inflight>=3){const error=Error('요청이 많아. 진행 중인 작업을 기다려 줘.');error.status=429;throw error;}if(session.total>=40){const error=Error('이번 테스트의 제작 횟수를 모두 사용했어.');error.status=429;throw error;}session.total++;}});return json(202,job);
   }catch(error){return json(error.status||400,{error:error.message||'분석 입력을 확인하지 못했어.'});}
  }

  if(url.pathname==='/api/feedback'&&req.method==='POST'){
   if(session.feedback>=3)return json(429,{error:'평가는 세 번까지 남길 수 있어.'});
   try{let raw='';for await(const part of req){raw+=part;if(raw.length>6000)return json(413,{error:'평가가 너무 길어.'});}const input=JSON.parse(raw);if(!Number.isInteger(input.rating)||input.rating<1||input.rating>5||typeof input.comment!=='string'||input.comment.length>2000)return json(400,{error:'평점과 의견을 확인해 줘.'});fs.mkdirSync(path.dirname(feedbackFile),{recursive:true});fs.appendFileSync(feedbackFile,JSON.stringify({time:new Date().toISOString(),rating:input.rating,comment:input.comment.trim()})+'\n');session.feedback++;return json(200,{saved:true});}catch{return json(400,{error:'평가를 저장하지 못했어.'});}
  }
  if(!/^\/api\/(?:status$|ai\/analyze$|ai\/effects(?:\/reset|\/jobs\/[a-f0-9]{32})?$|evolution(?:\/reset|\/jobs\/[a-f0-9]{32}(?:\/choose)?)?$)/.test(url.pathname))return json(404,{error:'없는 기능'});
  // Each visitor owns an independent game service, job queue and reset epoch.
  req.headers.host='127.0.0.1:'+(process.env.PORT||4174);if(req.headers.origin)req.headers.origin='http://'+req.headers.host;
  session.inflight++;res.once('close',()=>session.inflight--);session.server.emit('request',req,res);
 });
 server.once('close',()=>{for(const session of sessions.values()){session.analyses.reset();session.server.close();}});return server;
}
if(require.main===module)createPublicServer().listen(4180,'127.0.0.1',()=>console.log('Public playtest gateway: http://127.0.0.1:4180'));
module.exports={createPublicServer};
