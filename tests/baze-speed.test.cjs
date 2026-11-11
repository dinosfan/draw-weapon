const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const Baze=require('../ai/baze.cjs'),client=require('../ai/images/local/client.cjs');

test('only the QA-validated ChatKHU model defaults to glyph one-pass without a desktop policy file',async()=>{
 const original=client.generate,previous=process.env.AI_IMAGE_MODEL,seen=[];
 client.generate=async input=>{seen.push(input);return{local:{}};};
 try{
  process.env.AI_IMAGE_MODEL=Baze.MODEL;await Baze.generate({});await Baze.generate({onePass:'auto'});await Baze.generate({onePass:'off'});
  process.env.AI_IMAGE_MODEL='unreviewed-image-model';await Baze.generate({});await Baze.generate({onePass:'auto'});
  assert.deepEqual(seen.map(input=>input.onePass),['glyph','glyph','off',undefined,'auto']);assert.equal(seen[0].cacheModel,'chatkhu/'+Baze.MODEL);
  assert.deepEqual(seen.map(input=>input.singleSheet),[true,true,false,false,false]);
 }finally{client.generate=original;if(previous===undefined)delete process.env.AI_IMAGE_MODEL;else process.env.AI_IMAGE_MODEL=previous;}
});

test('the ChatKHU effects service sends configured credentials and model through its supplied transport',async t=>{
 const {createService}=require('../ai/images/service.cjs');
 const reference=path.join(__dirname,'../dist/assets/studies/local-pixel-animation/heart-raw.png');
 const prompt=path.join(__dirname,'fixtures/launcher.cjs');
 const model='fixture-transport-model',key='fixture-transport-key',requests=[];
 t.mock.method(globalThis,'fetch',async()=>assert.fail('The default transport must not be used'));
 t.mock.method(require('../ai/usage.cjs'),'recordUsage',()=>{});
 t.mock.method(client,'generate',async options=>options.runCommand('sd-cli.exe',['--prompt-file',prompt,'-r',reference]));
 const service=createService({provider:'chatkhu',key,model,test:true,fetchImpl:async(url,options)=>{
  requests.push({url,key:options.headers.Authorization,model:JSON.parse(options.body).model});
  return Response.json({detail:{message:'fixture rejection'}},{status:403});
 }});
 const image='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=';
 await assert.rejects(service.create({weapon:require('./fixtures/launcher.cjs'),image}),error=>error.status===403);
 assert.deepEqual(requests,[{url:Baze.BASE+'/images/generate/',key:'Bearer '+key,model}]);
});

test('ChatKHU one-pass keeps four separate skill sheets, missing-glyph fallback and failed-frame repair',async()=>{
 const original=client.generate,previous=process.env.AI_IMAGE_MODEL,raw=require('./fixtures/launcher.cjs'),native=fs.readFileSync('dist/assets/studies/local-pixel-animation/heart-raw.png');
 const glyph=Array(12).fill('...133331...').join('/');
 for(const scenario of ['normal','missing-glyph','bad-first-frame']){
  const root=fs.mkdtempSync(path.join(__dirname,'tmp-baze-speed-'));let renders=0,inspectCount=0;
  const weapon={...raw,rarity:'common',moves:raw.moves.map((move,i)=>({...move,...(scenario!=='missing-glyph'||i!==0?{effectGlyph:glyph}:{})}))};
  const run=async(exe,args)=>{const mode=args[1];if(['prepare','guide','glyph-guide'].includes(mode))return'{}';if(mode==='pack'){fs.writeFileSync(path.join(args[2],'atlas.png'),native);return'{}';}if(mode==='inspect'){inspectCount++;return JSON.stringify({valid:scenario!=='bad-first-frame'||inspectCount!==1,issues:[],coverage:[.1,.1,.1,.01],transparencyChecked:4});}renders++;fs.writeFileSync(args[args.indexOf('--output')+1],native);return'';};
  client.generate=input=>original({...input,root,runCommand:run});process.env.AI_IMAGE_MODEL=Baze.MODEL;
  try{const result=await Baze.generate({weapon,drawing:'original drawing',singleSheet:false});assert.equal(renders,scenario==='normal'?4:scenario==='missing-glyph'?5:6);assert.deepEqual(result.local.skills.map(skill=>skill.name),weapon.moves.map(move=>move.name));assert.equal(result.local.transparencyChecked,16);if(scenario==='normal')assert.ok(result.local.skills.every(skill=>skill.method==='one-pass'));else assert.equal(result.local.skills.filter(skill=>skill.method==='two-pass').length,1);
  }finally{client.generate=original;fs.rmSync(root,{recursive:true,force:true});if(previous===undefined)delete process.env.AI_IMAGE_MODEL;else process.env.AI_IMAGE_MODEL=previous;}
 }
});
