const {test}=require('node:test'),assert=require('node:assert/strict');
const Plan=require('../ai/evolution/plan.cjs'),{plan}=require('../ai/evolution/planner.cjs'),{evolve}=require('../ai/evolution/weapon.cjs');
const base=require('../ai/weapon.cjs').validateCreative(structuredClone(require('../dist/assets/studies/blueprints/umbrella.json').weapon));
function options(){return{options:[0,1].map(index=>({name:'진화 무기 '+index,route:'그림의 윤곽을 계승',line:'원래 모양이 성장한다.',story:'원본의 힘을 이어간다.',trait:'진화한 힘',types:['water'],typeReason:'기존 물의 힘을 이어간다.',artBrief:'Keep the original silhouette and grip while adding compact layered details.',changes:[{index:index+1,name:'진화 전용 기술 '+index,description:'고유한 바람으로 공격한다.',element:'flying',damage:30,heal:0,pp:8,rule:{kind:'attack',accuracy:95,chance:0,amount:1},effectBrief:'Distinct curved wind blades travel forward and scatter at contact.',delivery:base.moves[index+1].delivery}]}))};}
const config={weapon:base,drawing:'same-original-image',endpoint:'https://factchat-cloud.mindlogic.ai/v1/gateway/chat/completions/',key:'offline-test-only',model:'analysis-test',meter(){}};
const response=content=>({ok:true,status:200,json:async()=>({choices:[{message:{content}}],usage:{total_tokens:100}})});

test('evolution repairs a missing comma between array elements locally and keeps both planned identities',async()=>{
 const intended=options(),raw=JSON.stringify(intended).replace('},{','} {');assert.throws(()=>JSON.parse(raw),SyntaxError);let calls=0;
 const result=await plan({...config,fetchImpl:async(url,opts)=>{calls++;const request=JSON.parse(opts.body);assert.equal(request.messages[1].content[1].image_url.url,'data:image/png;base64,same-original-image');return response(raw);}});
 assert.equal(calls,1);assert.deepEqual(result,Plan.validate(intended,base));
});

test('evolution accepts fenced JSON with harmless punctuation drift without another model call',async()=>{
 const intended=options(),raw='```json\n'+JSON.stringify(intended).replace('"options":',"'options':")+'\n```';let calls=0;
 const result=await plan({...config,fetchImpl:async()=>{calls++;return response(raw);}});assert.equal(calls,1);assert.deepEqual(result,Plan.validate(intended,base));
});

test('truncated evolution content is rejected and a complete response is requested before any plan can be published',async()=>{
 let calls=0;const prompts=[],intended=options(),snapshot=structuredClone(base);
 const result=await plan({...config,fetchImpl:async(url,opts)=>{calls++;prompts.push(JSON.parse(opts.body).messages[1].content[0].text);return response(calls===1?'{"options":[{"name":"unfinished':JSON.stringify(intended));}});
 assert.equal(calls,2);assert.match(prompts[1],/이전 출력/);assert.deepEqual(result,Plan.validate(intended,base));assert.deepEqual(base,snapshot);
});

test('repairing JSON never bypasses validation of both evolution routes and their changed skill slots',async()=>{
 let calls=0;const invalid=options();invalid.options[0].changes[0].index=9;
 const result=await plan({...config,fetchImpl:async()=>{calls++;return response(JSON.stringify(calls===1?invalid:options()));}});assert.equal(calls,2);assert.equal(result.options[0].changes[0].index,1);
});

test('malformed provider response JSON is retried and unsuccessful recovery returns a clear error after a bounded three calls',async()=>{
 let calls=0,usage=0;
 await assert.rejects(plan({...config,meter:()=>usage++,fetchImpl:async()=>{calls++;return{ok:true,status:200,json:async()=>{throw new SyntaxError("Expected ',' or ']' after array element in JSON at position 3216");}};}}),error=>{assert.match(error.message,/진화 방향 응답 형식/);assert.doesNotMatch(error.message,/Expected|position/);assert.ok(error.cause instanceof SyntaxError);return true;});
 assert.equal(calls,3);assert.equal(usage,3);
});

test('unrecoverable evolution content stays bounded, preserves the base weapon, and never invents missing routes',async()=>{
 let calls=0;const snapshot=structuredClone(base);
 await assert.rejects(plan({...config,fetchImpl:async()=>{calls++;return response('{"options":[]}');}}),/진화 방향 응답 형식/);
 assert.equal(calls,3);assert.deepEqual(base,snapshot);
});

test('selected evolution skill generation retains its locked plan and inherited moves after a repaired JSON response',async()=>{
 const option=Plan.validate(options(),base).options[0],snapshot=structuredClone(base);let calls=0;
 const raw=JSON.stringify(base).replace('},{','} {');assert.throws(()=>JSON.parse(raw),SyntaxError);
 const result=await evolve({...config,option,fetchImpl:async()=>{calls++;return response(raw);}});
 assert.equal(calls,1);assert.equal(result.name,option.name);assert.equal(result.moves[1].name,option.changes[0].name);for(const i of [0,2,3])assert.deepEqual(result.moves[i],base.moves[i]);assert.deepEqual(base,snapshot);
});

test('an unexpected JSON exception in an evolution provider cannot leak a raw parser error or start image generation',async()=>{
 const service=require('../ai/evolution/service.cjs').createService({test:true,planner:async()=>{throw new SyntaxError("Expected ',' or ']' after array element in JSON at position 3216");},renderer:async()=>assert.fail('Invalid plans must not start images')});
 const job=service.submit({weapon:base,image:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII='});await new Promise(r=>setImmediate(r));
 const result=service.get(job.id);assert.equal(result.status,'failed');assert.equal(result.data,undefined);assert.match(result.error,/현재 무기와 기술은 그대로/);assert.doesNotMatch(result.error,/Expected|position/);
});
