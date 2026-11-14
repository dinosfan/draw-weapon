const {EventEmitter} = require('node:events');
const {Readable} = require('node:stream');

async function submit(req, session, send, availability) {
  try {
    let bytes = 0;
    const parts = [];
    for await (const chunk of req) {
      bytes += chunk.length;
      if (bytes > 1_500_000) return send(413, {error:'이미지 입력 용량 초과'});
      parts.push(chunk);
    }
    const input = JSON.parse(Buffer.concat(parts).toString());
    const id = input?.requestId;
    const source = typeof id === 'string' && session.analyses.effectSource(id);
    if (!source) return send(409, {error:'완료된 전시 무기 제작을 찾지 못했어. 기본 연출로 전투할 수 있어.'});
    const previous = session.exhibitEffects.get(id);
    if (previous) {
      const {status, body} = await previous;
      return send(status, body);
    }
    if (availability().code === 'EXHIBIT_CREDITS') return send(429, {code:'EXHIBIT_CREDITS',error:'전시 제작용 AI 크레딧이 부족해. 기본 연출로 전투할 수 있어.'});
    if (session.inflight >= 3) return send(429, {error:'요청이 많아. 진행 중인 작업을 기다려 줘.'});
    const {promise, resolve} = Promise.withResolvers();
    session.exhibitEffects.set(id, promise);
    const internal = Readable.from([Buffer.from(JSON.stringify({
      ...source, requestId:id, epoch:0,
    }))]);
    Object.assign(internal, {
      method:'POST', url:'/api/ai/effects',
      headers:{host:'127.0.0.1:' + (process.env.PORT || 4174), 'content-type':'application/json'},
    });
    const response = new EventEmitter();
    let status = 200;
    response.writeHead = value => { status = value; };
    response.end = raw => {
      try { resolve({status, body:JSON.parse(raw)}); }
      catch { resolve({status:502, body:{error:'전시 도트를 시작하지 못했어. 기본 연출로 전투할 수 있어.'}}); }
    };
    session.inflight++;
    try { session.server.emit('request', internal, response); }
    catch { response.end(); }
    const result = await promise;
    session.inflight--;
    return send(result.status, result.body);
  } catch {
    return send(400, {error:'도트 생성 입력을 확인하지 못했어.'});
  }
}

module.exports = {submit};
