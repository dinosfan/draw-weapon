const {test} = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const {createPublicServer} = require('../public-server.cjs');
const {createHandler} = require('../server/exhibit-issues.cjs');

test('poster issues are anonymous and saved separately without opening a game session', async () => {
  const folder = await fs.mkdtemp(path.join(os.tmpdir(), 'draw-weapon-exhibit-'));
  const file = path.join(folder, 'issues.jsonl');
  const feedbackFile = path.join(folder, 'reviews.jsonl');
  let sessions = 0;
  const server = createPublicServer({
    secure:false, exhibitIssuesFile:file, feedbackFile,
    factory:() => { sessions++; throw Error('unexpected game session'); },
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = 'http://127.0.0.1:' + server.address().port + '/api/exhibit/issues';
  function report(body, origin) {
    return fetch(url, {
      method:'POST',
      headers:{'Content-Type':'application/json', ...(origin ? {Origin:origin} : {})},
      body:JSON.stringify(body),
    });
  }
  try {
    assert.equal((await report({screen:'workshop', comment:'   '})).status, 400);
    assert.equal((await report({screen:'private', comment:'접근 오류'})).status, 400);
    assert.equal((await report({screen:'battle', comment:'가'.repeat(5000)})).status, 413);
    assert.equal((await report({screen:'battle', comment:'로딩 오류'}, 'https://elsewhere.example')).status, 403);
    const sent = await report({screen:'battle', comment:'  공격을 누른 뒤 멈췄어요.  '});
    assert.equal(sent.status, 200);
    assert.equal(sent.headers.get('set-cookie'), null);
    assert.deepEqual(await sent.json(), {saved:true});
    const [{time, ...saved}] = (await fs.readFile(file, 'utf8')).trim().split('\n').map(JSON.parse);
    assert(Number.isFinite(Date.parse(time)));
    assert.deepEqual(saved, {screen:'battle', comment:'공격을 누른 뒤 멈췄어요.'});
    await assert.rejects(fs.access(feedbackFile), {code:'ENOENT'});
    assert.equal(sessions, 0);
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
    await fs.unlink(file).catch(error => { if (error.code !== 'ENOENT') throw error; });
    await fs.rmdir(folder);
  }
});

async function sendReport(options) {
  const receive = createHandler(options);
  const server = http.createServer((req, res) => receive(req, res, (status, body) => {
    res.writeHead(status, {'Content-Type':'application/json'});
    res.end(JSON.stringify(body));
  }));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const response = await fetch('http://127.0.0.1:' + server.address().port, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({screen:'battle', comment:'테스트 제보', email:'unneeded@example.com'}),
    });
    return {status:response.status, body:await response.json()};
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
}

test('cloud issues follow only the expected Apps Script response redirect and keep the shared secret out of logs', async () => {
  const calls = [], logs = [];
  const secret = 'a'.repeat(64);
  const webhookUrl = 'https://script.google.com/macros/s/test-deployment/exec';
  const responseUrl = 'https://script.googleusercontent.com/macros/echo?user_content_key=test';
  const result = await sendReport({
    render:true, webhookUrl, webhookSecret:secret, log:value => logs.push(value),
    fetchImpl:async (url, options) => {
      calls.push({url:String(url), options});
      return calls.length === 1 ? Response.redirect(responseUrl) : Response.json({saved:true});
    },
  });
  assert.deepEqual(result, {status:200, body:{saved:true}});
  assert.deepEqual(logs, []);
  assert.deepEqual(calls.map(call => call.url), [webhookUrl, responseUrl]);
  const {time, ...payload} = JSON.parse(calls[0].options.body);
  assert(Number.isFinite(Date.parse(time)));
  assert.deepEqual(payload, {screen:'battle', comment:'테스트 제보', secret});
  assert.equal(calls[0].options.redirect, 'manual');
  assert.equal(calls[1].options.body, undefined);
  assert.equal(calls[1].options.redirect, 'error');
});

test('cloud issues fall back to Render logs when the webhook is unavailable or redirects outside Google', async () => {
  for (const webhook of [
    {},
    {
      webhookUrl:'https://script.google.com/macros/s/test-deployment/exec',
      webhookSecret:'a'.repeat(64),
      fetchImpl:async () => Response.redirect('https://unrelated.example/response'),
    },
  ]) {
    const logs = [];
    const result = await sendReport({
      render:true, webhookUrl:'', webhookSecret:'', log:value => logs.push(JSON.parse(value)), ...webhook,
    });
    assert.deepEqual(result, {status:200, body:{saved:true}});
    assert.equal(logs.length, 1);
    const {time, ...record} = logs[0];
    assert(Number.isFinite(Date.parse(time)));
    assert.deepEqual(record, {event:'exhibit-issue', screen:'battle', comment:'테스트 제보'});
  }
});

test('the private Sheets destination rejects unauthenticated reports and stores visitor text literally', async () => {
  const script = await fs.readFile(path.join(__dirname, '../deployment/exhibit-issues.gs'), 'utf8');
  const secret = 'a'.repeat(64);
  const rows = [];
  let held = false;
  const settings = {EXHIBIT_ISSUES_WEBHOOK_SECRET:secret, EXHIBIT_ISSUES_SHEET_ID:'private-sheet'};
  const context = vm.createContext({
    PropertiesService:{getScriptProperties:() => ({getProperty:key => settings[key]})},
    LockService:{getScriptLock:() => ({
      tryLock() { assert.equal(held, false); held = true; return true; },
      releaseLock() { assert.equal(held, true); held = false; },
    })},
    SpreadsheetApp:{
      openById(id) {
        assert.equal(id, 'private-sheet');
        assert.equal(held, true);
        return {getSheetByName:name => {
          assert.equal(name, '전시 오류 제보');
          return {appendRow:row => rows.push(Array.from(row))};
        }};
      },
      flush:() => assert.equal(held, true),
    },
    ContentService:{MimeType:{JSON:'application/json'}, createTextOutput:contents => ({setMimeType:() => JSON.parse(contents)})},
  });
  vm.runInContext(script, context);
  const request = {time:'2026-11-14T07:00:00.000Z', screen:'start', comment:'=1+1'};
  const post = input => context.doPost({postData:{contents:JSON.stringify(input)}}).saved;
  assert.equal(post(request), false);
  assert.equal(post({...request, secret, screen:'other'}), false);
  assert.equal(post({...request, secret}), true);
  assert.equal(held, false);
  assert.equal(rows.length, 1);
  assert.deepEqual([rows[0][0].toISOString(), ...rows[0].slice(1)], [request.time, 'start', "'=1+1"]);
});
