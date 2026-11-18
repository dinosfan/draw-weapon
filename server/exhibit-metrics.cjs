const {timingSafeEqual} = require('node:crypto');

const events = new Set(['visit','workshop','connection_failed','craft_started','craft_ready','craft_failed',
  'sample_play','created_play','boss_phase_two','boss_won','dots_all','dots_some','dots_failed']);
const exhibitDay = new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul'});

function createMetrics({url=process.env.EXHIBIT_ISSUES_WEBHOOK_URL, secret=process.env.EXHIBIT_ISSUES_WEBHOOK_SECRET,
  accessKey=process.env.EXHIBIT_METRICS_KEY, startAt=process.env.EXHIBIT_METRICS_START_AT,
  now=Date.now, fetchImpl=fetch, log=console.warn}={}) {
  const starts = startAt ? Date.parse(startAt) : NaN;
  const firstDay = Number.isFinite(starts) ? exhibitDay.format(starts) : '';
  async function google(payload) {
    if (!/^https:\/\/script\.google\.com\/macros\/s\/[a-zA-Z0-9_-]+\/exec$/.test(url || '') || !/^[a-f0-9]{64}$/.test(secret || '')) throw Error('Metrics storage is unavailable');
    const signal = AbortSignal.timeout(10000);
    let response = await fetchImpl(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...payload,secret}),redirect:'manual',signal});
    if ([301,302,303].includes(response.status)) {
      const next = new URL(response.headers.get('location') || '');
      await response.body?.cancel();
      if (next.origin !== 'https://script.googleusercontent.com' || next.username || next.password) throw Error('Invalid metrics redirect');
      response = await fetchImpl(next,{redirect:'error',signal});
    }
    if (!response.ok) throw Error('Metrics storage did not respond');
    return response.json();
  }

  async function readBody(req) {
    const chunks = [];
    let bytes = 0;
    for await (const chunk of req) {
      bytes += chunk.length;
      if (bytes > 512) { req.resume(); return null; }
      chunks.push(chunk);
    }
    try { return JSON.parse(Buffer.concat(chunks)); } catch { return null; }
  }

  async function collect(req,res,json) {
    const receivedAt = now();
    const input = await readBody(req);
    if (!/^[a-f0-9]{32}$/.test(input?.visitor || '') || !events.has(input?.event)) return json(400,{error:'집계 입력 형식 오류'});
    if (receivedAt < starts) return json(202,{saved:false});
    const payload = {action:'metrics_event',visitor:input.visitor,event:input.event};
    try {
      const data = await google(payload);
      return data.saved === true ? json(200,{saved:true}) : json(503,{saved:false});
    } catch {
      log(JSON.stringify({event:'exhibit-metrics-unavailable',kind:input.event}));
      return json(503,{saved:false});
    }
  }

  async function dashboard(req,res,json) {
    if (!accessKey) return json(503,{error:'운영자 키가 설정되지 않았어요.'});
    const supplied = Buffer.from(req.headers.authorization || '');
    const expected = Buffer.from('Bearer ' + accessKey);
    if (supplied.length !== expected.length || !timingSafeEqual(supplied,expected)) return json(401,{error:'운영자 키를 확인해 주세요.'});
    try {
      const beforeOpening = now() < starts;
      const data = await google({action:'metrics_summary'});
      if (!Array.isArray(data.days)) throw Error('Invalid metrics summary');
      const days = data.days.map(day => {
        if (!beforeOpening && day.date >= firstDay) return day;
        return Object.fromEntries(Object.keys(day).map(key => [key,key === 'date' ? day.date : 0]));
      });
      return json(200,{days});
    } catch { return json(503,{error:'집계에 잠시 연결할 수 없어요.'}); }
  }
  return {collect,dashboard};
}

module.exports = {createMetrics};
