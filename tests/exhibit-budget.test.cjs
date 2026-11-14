const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const {test} = require('node:test');
const {createPublicServer} = require('../public-server.cjs');
const {callAI} = require('../ai/generate.cjs');

const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=';
const weapon = require('./fixtures/launcher.cjs');
const mode = {'X-Draw-Weapon-Mode':'exhibit'};

async function start(options) {
  const server = createPublicServer({secure:false, ...options});
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  const post = (url, input, cookie) => fetch(base + url, {
    method:'POST', headers:{...mode, 'Content-Type':'application/json', ...(cookie ? {Cookie:cookie} : {})},
    body:JSON.stringify(input),
  });
  const get = (url, cookie) => fetch(base + url, {headers:{...mode, ...(cookie ? {Cookie:cookie} : {})}});
  const close = () => new Promise(resolve => {
    server.closeAllConnections();
    server.close(resolve);
  });
  return {post, get, close};
}

test('exhibit capacity is global and persists; duplicates retain their authorized analysis and effect', async t => {
  const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'draw-weapon-exhibit-'));
  t.after(() => fs.rmSync(folder, {recursive:true, force:true}));
  const file = path.join(folder, 'budget.json');
  let analyses = 0, imageJobs = 0;
  const options = {exhibitBudgetFile:file, exhibitLimit:1, factory:config=>http.createServer(async (req,res) => {
    assert.equal(config.exhibit, true);
    if (req.url === '/api/ai/analyze') {
      analyses++;
      return res.end(JSON.stringify({data:weapon}));
    }
    imageJobs++;
    let body = '';
    for await (const chunk of req) body += chunk;
    const input = JSON.parse(body);
    assert.equal(input.image, png);
    assert.equal(input.weapon.name, weapon.name);
    assert.equal(input.weapon.rarity, 'mythic');
    assert.equal(input.regenerate, undefined);
    assert.equal(input.retryRows, undefined);
    res.writeHead(202);
    res.end(JSON.stringify({id:'a'.repeat(32)}));
  })};
  const first = await start(options);
  try {
    assert.deepEqual(await (await first.get('/api/exhibit/availability')).json(),{available:true,remaining:1,limit:1});
    assert.equal((await first.post('/api/ai/analyze-jobs',{image:'invalid'})).status,400);
    const drawing = {image:png, rarity:'mythic'};
    const accepted = await first.post('/api/ai/analyze-jobs', drawing);
    assert.equal(accepted.status,202);
    const cookie = accepted.headers.get('set-cookie').split(';')[0];
    const job = await accepted.json();
    const same = await first.post('/api/ai/analyze-jobs',drawing,cookie);
    assert.equal(same.status,202);
    assert.deepEqual(await same.json(),job);
    const denied = await first.post('/api/ai/analyze-jobs', drawing);
    assert.equal(denied.status,429);
    assert.equal((await denied.json()).code,'EXHIBIT_LIMIT');
    assert.equal(analyses,1);
    assert.equal((await first.post('/api/ai/effects',{requestId:'f'.repeat(32)},cookie)).status,409);
    assert.equal((await first.post('/api/ai/effects',{requestId:job.id})).status,409);
    const payload = {requestId:job.id, image:'substitute', weapon:{name:'altered'}, regenerate:true, retryRows:[1]};
    const responses = await Promise.all([first.post('/api/ai/effects',payload,cookie),first.post('/api/ai/effects',payload,cookie)]);
    for (const response of responses) {
      assert.equal(response.status,202);
      assert.deepEqual(await response.json(),{id:'a'.repeat(32)});
    }
    assert.equal(imageJobs,1);
  } finally { await first.close(); }
  const restarted = await start(options);
  try {
    assert.deepEqual(await (await restarted.get('/api/exhibit/availability')).json(),{available:false,remaining:0,limit:1,code:'EXHIBIT_LIMIT'});
    assert.equal((await restarted.post('/api/ai/analyze-jobs',{image:png})).status,429);
    assert.equal(analyses,1);
  } finally { await restarted.close(); }
});

test('an exhibit credit rejection reaches the visitor and blocks new requests globally', async t => {
  const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'draw-weapon-exhibit-'));
  t.after(() => fs.rmSync(folder, {recursive:true, force:true}));
  const server = await start({exhibitBudgetFile:path.join(folder,'budget.json'),exhibitLimit:2,factory:()=>http.createServer((_,res)=>{
    res.writeHead(502);
    res.end(JSON.stringify({reason:'credits',providerStatus:402,error:'Insufficient credits'}));
  })});
  try {
    const response = await server.post('/api/ai/analyze-jobs',{image:png});
    const cookie = response.headers.get('set-cookie').split(';')[0];
    const {id} = await response.json();
    const failed = await server.get('/api/ai/analyze-jobs/'+id,cookie);
    assert.equal((await failed.json()).code,'EXHIBIT_CREDITS');
    assert.deepEqual(await (await server.get('/api/exhibit/availability')).json(),{available:false,remaining:1,limit:2,code:'EXHIBIT_CREDITS'});
    assert.equal((await server.post('/api/ai/analyze-jobs',{image:png})).status,429);
  } finally { await server.close(); }
});

test('exhibit analysis uses local validation without paying for a second provider attempt', async () => {
  let calls = 0;
  const endpoint = 'https://factchat-cloud.mindlogic.ai/v1/gateway/chat/completions/';
  const options = {body:JSON.stringify({model:'primary',fallbackModel:'secondary',messages:[{content:'system'},{content:'drawing'}]})};
  const fetchImpl = async () => {
    calls++;
    return Response.json({choices:[{message:{content:'{}'}}]});
  };
  await assert.rejects(callAI(endpoint,options,fetchImpl,()=>{},{singleAttempt:true}));
  assert.equal(calls,1);
});

test('exhibit sheet keeps verified rows and never switches to additional paid images', async t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'draw-weapon-exhibit-'));
  t.after(() => fs.rmSync(root, {recursive:true, force:true}));
  const atlas = fs.readFileSync(path.resolve(__dirname,'../dist/assets/studies/local-pixel-animation/heart-raw.png'));
  let images = 0;
  const partial = [];
  const options = {
    weapon, drawing:'drawing', root, sheetOnly:true, checkAvailability:false, onPartial:result=>partial.push(result.rows),
    runCommand:async (executable,args) => {
      if (executable.endsWith('sd-cli.exe')) {
        images++;
        assert.equal(args[args.indexOf('--width')+1],'1024');
        fs.writeFileSync(args[args.indexOf('--output')+1],atlas);
      }
      if (args[1] === 'inspect') {
        const index = Number(args[args.indexOf('--index')+1]);
        return JSON.stringify({valid:index!==2,issues:[],coverage:[.1,.2,.1,.01],transparencyChecked:4});
      }
      if (args[1] === 'pack') fs.writeFileSync(path.join(args[2],'atlas.png'),atlas);
      return '{}';
    },
  };
  await assert.rejects(require('../ai/images/local/client.cjs').generate(options),error=>{
    assert.deepEqual(error.failedRows,[2]);
    return true;
  });
  assert.equal(images,1);
  assert.deepEqual(partial,[[0,1,3]]);
});
