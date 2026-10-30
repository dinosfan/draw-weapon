const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const tick=()=>new Promise(r=>setImmediate(r));
function fixture(){
 const base=structuredClone(require('./fixtures/launcher.cjs'));Object.assign(base,{kind:'custom',rarity:'common',artwork:'original'});
 const options=[0,1].map(index=>({index,changes:[{index:index+1}]})),record={sourceHash:'#weapon=custom',nextStage:1},nodes=new Map(),events=new Map(),calls={prepare:0,choose:[],wait:[],submit:0,urls:0,completed:0,cancel:0,saves:0};let select;
 const node=id=>{if(!nodes.has(id))nodes.set(id,{addEventListener(type,fn){this[type]=fn;},textContent:''});return nodes.get(id);};
 const result=index=>{const weapon=structuredClone(base);weapon.name='진화 '+index;weapon.moves[index+1].name='새 기술 '+index;weapon.evolution={stage:1,previousName:base.name};weapon.effectAtlas={id:'complete'};return{weapon,image:'drawing',changes:[index+1]};};
 const api={cancel(){calls.cancel++;},prepare:async()=>{calls.prepare++;return{id:'plan'};},choose:async(id,index)=>{calls.choose.push(index);return{id:'choice'+index};},wait:async id=>{calls.wait.push(id);return id==='plan'?{options}:result(Number(id.slice(-1)));},artwork:async()=> 'evolved-art'};
 const c={URLSearchParams,Set,addEventListener:(name,fn)=>events.set(name,fn),location:{hash:'#offer=abcdefgh'},document:{getElementById:node},EvolutionReveal:{mount:({onComplete})=>({play:()=>onComplete()})},Craft:{normalizeCreative:w=>w,readBattleWeapon:()=>base,StorageCleanup:{activate(){}},Evolution:{get:()=>record,save(){calls.saves++;},battleUrl:w=>{calls.urls++;return'battle.html#'+w.name;}},EvolutionScreen:{message(){},busy(){},source(){},options:(b,p,fn)=>select=fn,changes(){},completed(){calls.completed++;}},EvolutionAPI:api,EffectJobs:{apply:async()=>{},submit:async()=>{calls.submit++;}}}};
 return{base,options,record,c,calls,api,node,events,start(){vm.runInNewContext(fs.readFileSync('dist/js/evolution/live.js','utf8'),c);},select:index=>select(options[index])};
}
test('switching evolution after a connection failure starts the newly selected route instead of reusing the old job',async()=>{
 const f=fixture(),wait=f.api.wait;let fail=true;f.api.wait=async id=>{if(id==='choice0'&&fail){fail=false;const e=Error('connection');e.resumable=true;throw e;}return wait(id);};f.start();await tick();f.select(0);f.node('evolution-confirm').click();await tick();assert.equal(f.record.choiceJob,'choice0');f.select(1);f.node('evolution-confirm').click();await tick();assert.deepEqual(f.calls.choose,[0,1]);assert.deepEqual(f.record.changedSlots,[2]);assert.match(f.record.resultUrl,/진화 1/);assert.equal(f.calls.completed,1);
});
test('new game suppresses a late evolution preparation result before it can be saved or polled',async()=>{
 const f=fixture();let finish;f.api.prepare=()=>new Promise(r=>finish=r);f.start();await tick();f.events.get('game:new-game')();finish({id:'late'});await tick();assert.equal(f.calls.cancel,1);assert.equal(f.calls.saves,0);assert.equal(f.record.planJob,undefined);assert.deepEqual(f.calls.wait,[]);assert.equal(f.calls.submit,0);
});
test('new game suppresses late evolution artwork and cannot restart effects or publish a result',async()=>{
 const f=fixture();let finish;f.api.artwork=()=>new Promise(r=>finish=r);f.start();await tick();f.select(0);f.node('evolution-confirm').click();await tick();const saved=f.calls.saves;f.events.get('game:new-game')();finish('late artwork');await tick();assert.equal(f.calls.cancel,1);assert.equal(f.calls.saves,saved);assert.equal(f.calls.submit,0);assert.equal(f.calls.urls,0);assert.equal(f.calls.completed,0);assert.notEqual(f.record.consumed,true);
});
test('evolution API cancellation aborts in-flight transport and forbids a fresh paid submission',async()=>{
 let calls=0,signal;const c={Craft:{},AbortController,AbortSignal,Date,setTimeout,clearTimeout,fetch:async(url,options)=>{calls++;signal=options.signal;return new Promise((resolve,reject)=>signal.addEventListener('abort',()=>reject(signal.reason),{once:true}));}};vm.runInNewContext(fs.readFileSync('dist/js/evolution/api.js','utf8'),c);const pending=c.Craft.EvolutionAPI.prepare({weapon:'same'});c.Craft.EvolutionAPI.cancel();await assert.rejects(pending,e=>e.cancelled===true);assert.equal(signal.aborted,true);await assert.rejects(c.Craft.EvolutionAPI.prepare({weapon:'same'}),e=>e.cancelled===true);assert.equal(calls,1);
});
test('new game is single-flight and still returns to start if temporary save cleanup fails',async()=>{
 const buttons=[0,1].map(()=>({addEventListener(type,fn){this[type]=fn;},setAttribute(){},lastChild:{}})),calls={reset:0,event:0,cancel:0,navigate:0};let finish;
 const c={AbortSignal,Date,Event,document:{querySelectorAll:()=>buttons},location:{hash:'#same',replace(){calls.navigate++;}},console:{error(){}},fetch:async()=>({ok:true}),window:{dispatchEvent(){calls.event++;},Craft:{EvolutionAPI:{cancel(){calls.cancel++;}},EffectJobs:{reset(){calls.reset++;return new Promise(r=>finish=r);}},StorageCleanup:{collect(){throw Error('storage unavailable');}}},BattleSave:{clear(){throw Error('save unavailable');}}}};
 vm.runInNewContext(fs.readFileSync('dist/js/game/new-game.js','utf8'),c);const first=buttons[0].click();await buttons[1].click();assert.equal(calls.reset,1);finish();await first;assert.deepEqual(calls,{reset:1,event:1,cancel:1,navigate:1});
});

test('new game prevents a late fallback dot completion from publishing the evolved weapon',async()=>{
 const f=fixture(),wait=f.api.wait;let finish;f.api.wait=async id=>{const data=await wait(id);if(id!=='plan')delete data.weapon.effectAtlas;return data;};f.c.Craft.EffectJobs.submit=async({weapon})=>{f.calls.submit++;weapon.effectJob='pending-dots';};f.c.Craft.EffectJobs.watch=async weapon=>{await new Promise(r=>finish=r);weapon.effectAtlas={id:'late-atlas'};};f.start();await tick();f.select(0);f.node('evolution-confirm').click();await tick();assert.equal(f.record.effectJob,'pending-dots');assert.equal(f.calls.submit,1);const saved=f.calls.saves;f.events.get('game:new-game')();finish();await tick();assert.equal(f.calls.saves,saved);assert.equal(f.calls.urls,0);assert.equal(f.calls.completed,0);assert.notEqual(f.record.consumed,true);
});

function flowFixture(){
 const f=fixture(),flow=[];let complete;
 f.c.Craft.EvolutionLoading={mount:()=>({begin(){flow.push('loading');},step(i){flow.push('step:'+i);},update(){},hide(){flow.push('hide');},fail(){flow.push('error');}})};
 f.c.EvolutionReveal={mount:({onComplete})=>{complete=onComplete;return{play(){flow.push('reveal');},reset(){flow.push('reset');}};}};
 const completed=f.c.Craft.EvolutionScreen.completed;f.c.Craft.EvolutionScreen.completed=(...args)=>{flow.push('battle');completed(...args);};
 return Object.assign(f,{flow,complete:()=>complete()});
}

test('evolution waits for explicit skill confirmation, then hides loading before reveal and unlocks battle only after the reveal',async()=>{
 const f=flowFixture(),wait=f.api.wait;let resolveChoice;
 f.api.wait=id=>id==='plan'?wait(id):new Promise(resolve=>{resolveChoice=async()=>resolve(await wait(id));});
 f.start();await tick();f.select(0);assert.deepEqual(f.flow,[]);assert.deepEqual(f.calls.choose,[]);
 f.node('evolution-confirm').click();await tick();assert.deepEqual(f.flow,['loading']);assert.equal(f.calls.completed,0);assert.notEqual(f.record.consumed,true);
 await resolveChoice();await tick();assert.deepEqual(f.flow,['loading','step:1','step:2','step:3','hide','reveal']);assert.equal(f.calls.completed,0);
 f.complete();assert.equal(f.flow.at(-1),'battle');assert.equal(f.calls.completed,1);assert.equal(f.record.consumed,true);
});

test('evolution keeps loading through new skill dot preparation without playing a premature reveal',async()=>{
 const f=flowFixture(),wait=f.api.wait;let finishDots;
 f.api.wait=async id=>{const data=await wait(id);if(id!=='plan')delete data.weapon.effectAtlas;return data;};
 f.c.Craft.EffectJobs.submit=async({weapon})=>{weapon.effectJob='pending-dots';};f.c.Craft.EffectJobs.watch=()=>new Promise(r=>finishDots=r);
 f.start();await tick();f.select(0);f.node('evolution-confirm').click();await tick();assert.deepEqual(f.flow,['loading','step:1','step:2']);assert.equal(f.calls.completed,0);
 finishDots();await tick();assert.deepEqual(f.flow.slice(-3),['step:3','hide','reveal']);f.complete();assert.equal(f.calls.completed,1);
});

test('evolution failure closes loading and permits a retry of the same selected evolution without revealing it',async()=>{
 const f=flowFixture(),wait=f.api.wait;let failed=false;
 f.api.wait=async id=>{if(id!=='plan'&&!failed){failed=true;const error=Error('network');error.resumable=true;throw error;}return wait(id);};
 f.start();await tick();f.select(0);f.node('evolution-confirm').click();await tick();assert.deepEqual(f.flow,['loading','error']);assert.equal(f.calls.completed,0);assert.equal(f.node('evolution-confirm').disabled,false);
 f.node('evolution-confirm').click();await tick();assert.deepEqual(f.calls.choose,[0]);assert.equal(f.flow.at(-1),'reveal');f.complete();assert.equal(f.calls.completed,1);
});

test('leaving during evolution loading closes it and rejects a late completion',async()=>{
 const f=flowFixture(),wait=f.api.wait;let finish;
 f.api.wait=id=>id==='plan'?wait(id):new Promise(resolve=>{finish=async()=>resolve(await wait(id));});
 f.start();await tick();f.select(0);f.node('evolution-confirm').click();await tick();f.events.get('pagehide')();await finish();await tick();
 assert.deepEqual(f.flow,['loading','hide']);assert.equal(f.calls.completed,0);assert.equal(f.calls.urls,0);
});

test('leaving during the evolution reveal resets its sound and animation and never unlocks battle',async()=>{
 const f=flowFixture();f.start();await tick();f.select(0);f.node('evolution-confirm').click();await tick();assert.equal(f.flow.at(-1),'reveal');
 f.events.get('game:new-game')();f.complete();assert.deepEqual(f.flow.slice(-2),['hide','reset']);assert.equal(f.calls.completed,0);
});
