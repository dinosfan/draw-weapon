// Exercise the real screen and transports with saved artwork; no paid model calls.
const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('../output/dom-check/node_modules/playwright');
(async()=>{
 const server=require('../public-server.cjs').createPublicServer({factory:()=>{throw Error('Live AI calls forbidden in UI QA');}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const isPublic=process.argv.includes('--public'),base=isPublic?'https://draw-weapon-khu-2026.onrender.com':'http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}),report=[];
 const pack=JSON.parse(fs.readFileSync('dist/assets/demo/ball.json')),art=fs.readFileSync('output/evolution-api-replay/assets/'+'f'.repeat(64)+'-0.png'),atlasId='d'.repeat(64),planId='a'.repeat(32),choiceId='b'.repeat(32),effectId='c'.repeat(32),image='assets/evolutions/'+'f'.repeat(64)+'-0.png';
 try{for(const width of [1440,390]){const readyWhileReading=width===390;
  const page=await browser.newPage({viewport:{width,height:1000}}),errors=[];let weapon,options,evolved,choiceReady=false,dotsReady=false,choices=0,dotSubmissions=0,dotPolls=0;
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/'+image,r=>r.fulfill({status:200,contentType:'image/png',body:art}));
  await page.route('**/assets/vfx/generated/'+atlasId+'.png',r=>r.fulfill({status:200,contentType:'image/png',body:Buffer.from(pack.atlas.split(',')[1],'base64')}));
  await page.route('**/api/**',route=>{
   const path=new URL(route.request().url()).pathname;let status=200,data={};
   if(path==='/api/status')data={configured:true,provider:'ChatKHU',effectsProvider:'chatkhu',evolutionProvider:'chatkhu',evolutionModel:'gemini-nano-banana-2.1',evolutionConfigured:true};
   else if(path==='/api/public-info')data={cloud:true};
   else if(path.endsWith('/reset'))data={ok:true};
   else if(path==='/api/evolution'){status=202;data={id:planId};}
   else if(path==='/api/evolution/jobs/'+planId)data={status:'done',data:{options}};
   else if(path==='/api/evolution/jobs/'+planId+'/choose'){choices++;status=202;data={id:choiceId};}
   else if(path==='/api/evolution/jobs/'+choiceId)data=choiceReady?{status:'done',data:{weapon:{...evolved,...(readyWhileReading?{effectAtlas:{id:atlasId,rarity:'common',layout:pack.layout}}:{})},image,changes:[1],reusedSlots:[0,2,3]}}:{status:'running',message:'선택한 진화의 기술을 준비하고 있어…'};
   else if(path==='/api/ai/effects'){dotSubmissions++;status=202;data={id:effectId};}
   else if(path==='/api/ai/effects/jobs/'+effectId){dotPolls++;data=dotsReady?{status:'done',data:{id:atlasId,rarity:'common',local:{layout:pack.layout}}}:{status:'running',message:'진화 전용 도트를 준비하고 있어…'};}
   else errors.push('Unexpected API '+path);
   return route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)});
  });
  await page.goto(base+'/craft.html',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.Craft?.weaponBattleUrl&&Craft.readBattleWeapon);
  const seed=await page.evaluate(w=>{w.rarity='common';const url=Craft.weaponBattleUrl(w),hash='#'+url.split('#')[1],base=Craft.readBattleWeapon(hash),id='evolution-flow-qa';localStorage.setItem('draw-weapon:evolution-offer:'+id,JSON.stringify({sourceHash:hash,nextStage:1,consumed:false,createdAt:Date.now()}));return{base,next:'evolve.html#offer='+id};},pack.weapon);
  weapon=seed.base;evolved=structuredClone(weapon);evolved.name='회오리 궤도의 야구공';evolved.moves[1].name='진화한 탑스핀 스파이크';evolved.evolution={stage:1,previousName:weapon.name};delete evolved.effectAtlas;delete evolved.effectJob;
  options=[0,1].map(index=>({index,name:index?'폭풍 회전의 야구공':evolved.name,route:index?'강한 회전':'날카로운 궤도',line:'원래 그림의 야구공이 새로운 궤도를 그린다.',story:'원래의 둥근 선과 움직임이 진화한다.',types:weapon.types,image,changes:[{...evolved.moves[1],index:1}]}));
  await page.goto(base+'/'+seed.next,{waitUntil:'domcontentloaded'});await page.locator('.evolution-choice').first().waitFor();
  await page.evaluate(()=>{const original=GameAudio.evolution;window.evolutionCues=[];GameAudio.evolution=active=>{window.evolutionCues.push(active);original(active);};});
  await page.locator('.evolution-choice').first().click();assert.equal(await page.locator('#evolution-skills').isVisible(),true);assert.equal(await page.locator('.evolution-loading').isVisible(),false);assert.equal(choices,0);
  assert.equal(await page.locator('#evolution-battle').isVisible(),false);assert.equal(await page.locator('#evolution-skill-changes li').count(),4);
  await page.getByRole('button',{name:'이 진화로 선택',exact:true}).click();await page.locator('#evolution-reading').waitFor({state:'visible'});
  assert.equal(await page.locator('.evolution-loading').isVisible(),false);assert.equal(await page.getByRole('button',{name:'전투로',exact:true}).isEnabled(),true);
  assert.deepEqual(await page.evaluate(()=>evolutionCues),[]);assert.equal(await page.locator('#evolution-battle').isVisible(),false);
  await page.screenshot({path:'output/evolution-reading-'+width+(isPublic?'-public':'')+'.png'});
  choiceReady=true;
  if(readyWhileReading){
   await page.waitForFunction(()=>document.getElementById('evolution-phase').textContent.includes('준비 완료'));assert.equal(await page.locator('.evolution-loading').isVisible(),false);assert.deepEqual(await page.evaluate(()=>evolutionCues),[]);
   await page.reload({waitUntil:'domcontentloaded'});await page.locator('#evolution-reading').waitFor({state:'visible'});await page.waitForFunction(()=>document.getElementById('evolution-phase').textContent.includes('준비 완료'));
   await page.evaluate(()=>{const original=GameAudio.evolution;window.evolutionCues=[];GameAudio.evolution=active=>{window.evolutionCues.push(active);original(active);};});assert.equal(await page.locator('.evolution-loading').isVisible(),false);assert.equal(choices,1);
  }else{await page.waitForFunction(()=>document.getElementById('evolution-dot-status').textContent.includes('전용 도트'));assert.equal(dotSubmissions,1);assert.ok(dotPolls>0);assert.equal(await page.locator('.evolution-loading').isVisible(),false);}
  await page.getByRole('button',{name:'전투로',exact:true}).click();await page.locator('.evolution-loading').waitFor({state:'visible'});
  assert.deepEqual(await page.evaluate(()=>evolutionCues),[]);assert.equal(await page.locator('.evolution-loading').isVisible(),true);
  await page.screenshot({path:'output/evolution-loading-'+width+(isPublic?'-public':'')+'.png',animations:'disabled'});
  dotsReady=true;await page.locator('#evolution-stage.evolving').waitFor();assert.equal(await page.locator('.evolution-loading').isVisible(),false);assert.equal(await page.locator('#evolution-battle').isVisible(),false);assert.deepEqual(await page.evaluate(()=>evolutionCues),[true]);
  await page.locator('#evolution-battle').waitFor({state:'visible'});assert.deepEqual(await page.evaluate(()=>evolutionCues),[true,false]);assert.equal(choices,1);assert.equal(dotSubmissions,readyWhileReading?0:1);assert.equal(await page.locator('#evolution-stage.evolved').count(),1);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  const next=await page.locator('#evolution-battle').getAttribute('href');assert.ok(next.includes('stage=1'));assert.ok(page.url().includes('/evolve.html'));
  await page.locator('#evolution-battle').scrollIntoViewIfNeeded();await page.screenshot({path:'output/evolution-complete-'+width+(isPublic?'-public':'')+'.png'});
  const restored=await page.evaluate(url=>{const w=Craft.readBattleWeapon(url.split('#')[1]);return{name:w.name,moves:w.moves.map(m=>m.name),atlas:w.effectAtlas};},next);
  assert.equal(restored.name,evolved.name);assert.deepEqual(restored.moves,evolved.moves.map(m=>m.name));assert.equal(restored.atlas.id,atlasId);assert.deepEqual(errors,[]);
  report.push({width,sequence:'choose evolution -> background preparation while reading -> battle departure click -> loading -> evolution cues/reveal -> battle button',readyWhileReading,reloadResumesReading:readyWhileReading,automaticNavigation:false,choices,dotSubmissions,paidModelRequests:0,errors});await page.close();
 }}finally{await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
 fs.writeFileSync('output/evolution-flow'+(isPublic?'-public':'')+'.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
})().catch(error=>{console.error(error);process.exitCode=1;});
