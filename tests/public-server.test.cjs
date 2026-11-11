const{test}=require('node:test'),assert=require('node:assert/strict'),http=require('node:http'),{createPublicServer}=require('../public-server.cjs');

test('the exhibit opens without a session and its API requests get a separate visitor session', async () => {
  let instances = 0;
  const server = createPublicServer({secure:false, factory:() => {
    const id = ++instances;
    return http.createServer((_, res) => res.end(String(id)));
  }});
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  try {
    const page = await fetch(base + '/exhibit.html');
    assert.equal(page.status, 200);
    assert.equal(page.headers.get('set-cookie'), null);
    await page.text();
    const game = await fetch(base + '/api/status');
    const gameCookie = game.headers.get('set-cookie').split(';')[0];
    assert.equal(await game.text(), '1');
    const headers = {Cookie:gameCookie, 'X-Draw-Weapon-Mode':'exhibit'};
    const exhibit = await fetch(base + '/api/status', {headers});
    assert.equal(await exhibit.text(), '2');
    const exhibitCookie = exhibit.headers.get('set-cookie').split(';')[0];
    assert.match(exhibitCookie, /^dw_exhibit=/);
    headers.Cookie += '; ' + exhibitCookie;
    assert.equal(await (await fetch(base + '/api/status', {headers})).text(), '2');
    assert.equal(await (await fetch(base + '/api/status', {headers:{Cookie:headers.Cookie}})).text(), '1');
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
});
test('public game isolates visitor resets, blocks secrets and rejects cross-origin requests',async()=>{let instances=0;const server=createPublicServer({secure:false,factory:()=>{const id=++instances;return http.createServer((req,res)=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify({instance:id,host:req.headers.host}));});}});await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;try{const first=await fetch(base+'/api/status'),cookie=first.headers.get('set-cookie').split(';')[0],a=await first.json();const second=await(await fetch(base+'/api/status')).json();assert.notEqual(a.instance,second.instance);const own=await(await fetch(base+'/api/ai/effects/reset',{method:'POST',headers:{Cookie:cookie}})).json();assert.equal(own.instance,a.instance);assert.equal(own.host,'127.0.0.1:'+(process.env.PORT||4174));for(const path of ['/.env','/serve.cjs','/output/public-launch.json','/api/unknown'])assert.equal((await fetch(base+path)).status,404);assert.equal((await fetch(base+'/api/ai/effects/reset',{method:'POST',headers:{Origin:'https://another.example'}})).status,403);assert.equal((await fetch(base+'/',{redirect:'manual'})).headers.get('location'),'/start.html');}finally{server.closeAllConnections();await new Promise(r=>server.close(r));}});
test('the minigame mockup and scripts are public without enabling API sessions or private pages',async()=>{
 let sessions=0;const server=createPublicServer({factory:()=>{sessions++;return http.createServer();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 try{const page=await fetch(base+'/workshop-catch.html');assert.equal(page.status,200);assert.match(await page.text(),/1분 줍기 시작/);assert.equal(page.headers.get('set-cookie'),null);for(const file of ['model','renderer','app']){const response=await fetch(base+'/js/workshop-catch/'+file+'.js');assert.equal(response.status,200);assert.match(response.headers.get('content-type'),/javascript/);}for(const file of ['/.env','/ai/baze.cjs','/output/workshop-catch-qa.json','/private.html'])assert.equal((await fetch(base+file)).status,404);assert.equal(sessions,0);}finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
});
