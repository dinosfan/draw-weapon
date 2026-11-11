const{test}=require('node:test'),assert=require('node:assert/strict'),{createJobs}=require('../public-analysis.cjs');
test('analysis retries reuse the same job and reset aborts upstream without accepting late completion',()=>{let active=0,calls=0,closes=0,finish;const jobs=createJobs({onActive:n=>active+=n,dispatch:(req,res)=>{calls++;res.once('close',()=>{closes++;res.end(JSON.stringify({data:{name:'late'}}));});finish=()=>res.end(JSON.stringify({data:{name:'original'}}));}}),input=[Buffer.from('{"image":"same"}')],a=jobs.submit(input);assert.equal(jobs.submit(input).id,a.id);assert.equal(calls,1);assert.equal(active,1);assert.equal(jobs.reset().cancelled,1);assert.equal(closes,1);assert.equal(active,0);finish();assert.equal(jobs.get(a.id).status,'cancelled');const b=jobs.submit(input);assert.notEqual(a.id,b.id);finish();assert.equal(jobs.get(b.id).status,'done');assert.equal(active,0);assert.equal(jobs.submit(input).id,b.id);assert.equal(calls,2);});
test('reset prevents an older streamed submission from starting generation',()=>{let calls=0;const jobs=createJobs({dispatch:()=>calls++}),generation=jobs.epoch();jobs.reset();assert.throws(()=>jobs.submit([Buffer.from('{}')],{generation}),e=>e.status===409);assert.equal(calls,0);});
test('identical analyses are isolated by visitor and do not share reset or outcome',()=>{let a,b;const first=createJobs({dispatch:(_,res)=>a=res}),second=createJobs({dispatch:(_,res)=>b=res}),input=[Buffer.from('{}')],x=first.submit(input),y=second.submit(input);first.reset();b.end(JSON.stringify({data:{name:'second'}}));assert.equal(first.get(x.id).status,'cancelled');assert.equal(second.get(y.id).status,'done');assert.equal(second.get(y.id).data.name,'second');});

test('a failed analysis can be retried with the same drawing', () => {
  let response;
  const jobs = createJobs({dispatch:(_, res) => { response = res; }});
  const drawing = [Buffer.from('{"image":"same"}')];
  const first = jobs.submit(drawing);
  response.writeHead(503);
  response.end('{"error":"provider unavailable"}');
  assert.equal(jobs.get(first.id).status, 'failed');
  const retry = jobs.submit(drawing);
  assert.notEqual(retry.id, first.id);
  assert.equal(jobs.submit(drawing).id, retry.id);
});
