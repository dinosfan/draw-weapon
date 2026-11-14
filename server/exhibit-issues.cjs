const fs = require('node:fs/promises');
const path = require('node:path');

const screens = new Set(['start', 'workshop', 'reveal', 'battle']);
const maxBytes = 6000;
const maxComment = 800;
const maxPerMinute = 40;

async function sendToSheet(record, {url, secret, fetchImpl}) {
  if (!/^https:\/\/script\.google\.com\/macros\/s\/[a-zA-Z0-9_-]+\/exec$/.test(url || '') ||
      !/^[a-f0-9]{64}$/.test(secret || '')) throw Error('Invalid issue storage configuration');

  const signal = AbortSignal.timeout(8000);
  let response = await fetchImpl(url, {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({...record, secret}),
    redirect:'manual',
    signal,
  });
  if ([301, 302, 303].includes(response.status)) {
    const location = response.headers.get('location');
    await response.body?.cancel();
    const next = new URL(location || '');
    if (next.origin !== 'https://script.googleusercontent.com' || next.username || next.password) {
      throw Error('Invalid issue storage redirect');
    }
    response = await fetchImpl(next, {redirect:'error', signal});
  }
  if (!response.ok) {
    await response.body?.cancel();
    throw Error('Issue storage refused the report');
  }
  if ((await response.json()).saved !== true) throw Error('Issue storage did not save the report');
}

function createHandler({
  file,
  render = process.env.RENDER === 'true',
  webhookUrl = process.env.EXHIBIT_ISSUES_WEBHOOK_URL,
  webhookSecret = process.env.EXHIBIT_ISSUES_WEBHOOK_SECRET,
  fetchImpl = fetch,
  log = console.info,
} = {}) {
  let period = 0;
  let accepted = 0;

  async function save(record) {
    if (!file && (webhookUrl || webhookSecret)) {
      try {
        await sendToSheet(record, {url:webhookUrl, secret:webhookSecret, fetchImpl});
        return;
      } catch (error) {
        if (!render) throw error;
      }
    }
    if (render && !file) {
      log(JSON.stringify({event:'exhibit-issue', ...record}));
      return;
    }
    const target = file || path.join(process.env.DATA_DIR || path.join(__dirname, '../output'), 'exhibit-issues.jsonl');
    await fs.mkdir(path.dirname(target), {recursive:true});
    await fs.appendFile(target, JSON.stringify(record) + '\n');
  }

  return async (req, res, json) => {
    if (Number(req.headers['content-length']) > maxBytes) {
      req.resume();
      return json(413, {error:'제보 내용을 조금만 줄여 주세요.'});
    }

    let report;
    try {
      let size = 0;
      const chunks = [];
      for await (const chunk of req.iterator({destroyOnReturn:false})) {
        size += chunk.length;
        if (size > maxBytes) {
          req.resume();
          return json(413, {error:'제보 내용을 조금만 줄여 주세요.'});
        }
        chunks.push(chunk);
      }
      report = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    } catch {
      if (!res.destroyed) return json(400, {error:'제보 내용을 다시 확인해 주세요.'});
      return;
    }

    const screen = report?.screen;
    const comment = typeof report?.comment === 'string' ? report.comment.trim() : '';
    if (!screens.has(screen) || !comment || comment.length > maxComment) {
      return json(400, {error:'제보 내용을 800자 이내로 적어 주세요.'});
    }

    const now = Date.now();
    if (now - period >= 60_000) {
      period = now;
      accepted = 0;
    }
    if (accepted >= maxPerMinute) return json(429, {error:'제보가 몰리고 있어요. 잠시 후 다시 보내 주세요.'});
    accepted++;
    const acceptedPeriod = period;
    try {
      await save({time:new Date(now).toISOString(), screen, comment});
    } catch {
      if (acceptedPeriod === period) accepted--;
      return json(503, {error:'제보를 저장하지 못했어요. 잠시 후 다시 보내 주세요.'});
    }
    return json(200, {saved:true});
  };
}

module.exports = {createHandler};
