const assert = require('node:assert/strict');
const http = require('node:http');
const {test} = require('node:test');
const {createPosterRelay} = require('../deployment/poster-relay.cjs');

const origin = 'https://node.example.ts.net';
const job = 'a'.repeat(32);
const cookie = 'b'.repeat(48);
const analysis = '/api/ai/analyze-jobs';
const effects = '/api/ai/effects';
const availability = '/api/exhibit/availability';
const atlas = '/assets/vfx/generated/' + 'c'.repeat(64) + '.png';
const exhibit = {'X-Draw-Weapon-Mode':'exhibit'};
const post = (headers = {}, body = '{}') => ({
  method:'POST', headers:{...exhibit, 'Content-Type':'application/json', ...headers}, body,
});

async function withServer(options, callback) {
  const relay = createPosterRelay(options);
  const server = http.createServer(async (req, res) => {
    const json = (status, body) => {
      res.writeHead(status, {'Content-Type':'application/json'});
      res.end(JSON.stringify(body));
    };
    if (!await relay(req, res, new URL(req.url, 'http://localhost'), json)) json(404, {local:true});
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    await callback('http://127.0.0.1:' + server.address().port);
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
}

test('poster relay forwards only fixed exhibit API routes and scopes the visitor session to this origin', async () => {
  const calls = [];
  const fetchImpl = async (url, options) => {
    const chunks = [];
    if (options.body) for await (const chunk of options.body) chunks.push(chunk);
    calls.push({url, method:options.method, headers:Object.fromEntries(options.headers), body:Buffer.concat(chunks).toString(), redirect:options.redirect});
    return new Response(JSON.stringify({id:job}), {
      status:202,
      headers:[
        ['Content-Type','application/json'],
        ['Set-Cookie','dw_session=unrelated; Path=/'],
        ['Set-Cookie','dw_exhibit=' + cookie + '; Domain=node.example.ts.net; Path=/'],
        ['Location','https://unrelated.example'],
      ],
    });
  };
  await withServer({origin,fetchImpl}, async base => {
    const response = await fetch(base + analysis + '?ignored=1', post({
      Cookie:'dw_session=unrelated; dw_exhibit=' + cookie,
      Origin:base, Authorization:'Bearer unrelated', 'X-Forwarded-For':'203.0.113.1',
    }, '{"image":"test"}'));
    assert.equal(response.status,202);
    assert.deepEqual(await response.json(),{id:job});
    assert.equal(response.headers.get('location'),null);
    assert.equal(response.headers.get('set-cookie'),'dw_exhibit=' + cookie + '; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=3600');
    assert.deepEqual(calls[0],{
      url:origin+analysis, method:'POST',
      headers:{accept:'application/json', 'content-type':'application/json', cookie:'dw_exhibit='+cookie, 'x-draw-weapon-mode':'exhibit'},
      body:'{"image":"test"}', redirect:'manual',
    });
    for (const route of [analysis+'/'+job,effects+'/jobs/'+job]) {
      assert.equal((await fetch(base+route,{headers:exhibit})).status,202);
    }
    assert.equal((await fetch(base+effects,post())).status,202);
    for (const [route, opts] of [
      [analysis,post({'X-Draw-Weapon-Mode':'main'})],
      [analysis+'/1234',{headers:exhibit}],
      ['/api/evolution',post()],
      ['/api/exhibit/issues',post()],
      ['/api/ai/effects/reset',post()],
      ['/exhibit.html',{headers:exhibit}],
    ]) {
      assert.deepEqual(await (await fetch(base+route,opts)).json(),{local:true});
    }
    assert.deepEqual(calls.map(x=>x.url),[origin+analysis,origin+analysis+'/'+job,origin+effects+'/jobs/'+job,origin+effects]);
  });
});

test('poster availability falls back to sample-only when the host is down or replies unexpectedly', async () => {
  let mode = 'online';
  const fetchImpl = async (_url, options) => {
    if (mode === 'offline') throw Error('host unavailable');
    if (mode === 'html') return new Response('<html>unavailable</html>',{status:502,headers:{'Content-Type':'text/html'}});
    if (mode === 'redirect') return new Response(null,{status:302,headers:{Location:'https://other.example'}});
    if (mode === 'malformed') return new Response('{"available":true}',{headers:{'Content-Type':'application/json'}});
    assert.equal(options.headers.get('cookie'),null);
    const state = {available:false,remaining:0,limit:40,code:'EXHIBIT_LIMIT'};
    return new Response(JSON.stringify(state),{headers:{'Content-Type':'application/json'}});
  };
  await withServer({origin,fetchImpl}, async base => {
    assert.deepEqual(await (await fetch(base+availability,{headers:{Cookie:'dw_exhibit='+cookie}})).json(),
      {available:false,remaining:0,limit:40,code:'EXHIBIT_LIMIT'});
    for (mode of ['offline','html','redirect','malformed']) {
      const response = await fetch(base+availability);
      assert.equal(response.status,200);
      assert.deepEqual(await response.json(),{available:false,remaining:0,limit:0,code:'EXHIBIT_OFFLINE'});
    }
    mode = 'offline';
    const submit = await fetch(base+analysis,post());
    assert.equal(submit.status,503);
    assert.equal((await submit.json()).code,'EXHIBIT_OFFLINE');
  });
  assert.throws(() => createPosterRelay({origin:'http://node.example.ts.net'}),/HTTPS Tailscale/);
  assert.throws(() => createPosterRelay({origin:'https://node.example.ts.net/path'}),/HTTPS Tailscale/);
});

test('generated poster images use local files first, relay exact PNGs and preserve offline fallbacks', async () => {
  let mode = 'local';
  const serveLocal = (_req, res) => {
    if (mode !== 'local') return false;
    res.end('local');
    return true;
  };
  let requests = 0;
  const fetchImpl = async (url, options) => {
    requests++;
    assert.equal(url,origin+atlas);
    assert.equal(options.headers.get('cookie'),null);
    if (mode === 'offline') throw Error('host unavailable');
    return new Response(options.method === 'HEAD' ? null : 'image', {headers:{'Content-Type':'image/png'}});
  };
  await withServer({origin,serveLocal,fetchImpl}, async base => {
    assert.equal(await (await fetch(base+atlas)).text(),'local');
    assert.equal(requests,0);
    mode = 'relay';
    const image = await fetch(base+atlas,{headers:{Cookie:'dw_exhibit='+cookie}});
    assert.equal(image.headers.get('content-type'),'image/png');
    assert.equal(await image.text(),'image');
    const head = await fetch(base+atlas,{method:'HEAD'});
    assert.equal(head.status,200);
    assert.equal(await head.text(),'');
    assert.equal((await fetch(base+atlas.replace('.png','.json'))).status,404);
    assert.equal(requests,2);
    mode = 'offline';
    assert.equal((await fetch(base+atlas)).status,404);
  });
});

test('poster relay rejects invalid or oversized uploads and does not retry', async () => {
  let requests = 0;
  const fetchImpl = async (_url, options) => {
    requests++;
    for await (const chunk of options.body) void chunk;
    throw Error('Unexpected accepted upload');
  };
  await withServer({origin,fetchImpl}, async base => {
    assert.equal((await fetch(base+analysis,post({'Content-Type':'text/plain'}))).status,415);
    assert.equal((await fetch(base+analysis,post({},'a'.repeat(1_450_001)))).status,413);
    assert.equal(requests,0);
    const oversizedBody = (async function* () {
      yield Buffer.alloc(1_400_000);
      yield Buffer.alloc(60_000);
    })();
    const response = await fetch(base+analysis,{...post({},oversizedBody), duplex:'half'});
    assert.equal(response.status,413);
    assert.equal(requests,1);
  });
});
