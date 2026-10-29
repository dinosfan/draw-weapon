// A job belongs to the weapon and survives navigation from crafting to battle.
Craft.EffectJobs=(()=>{
 const key=id=>'draw-weapon:effect-job:'+id;
 const activeKey='draw-weapon:active-effect-job',epochKey='draw-weapon:effect-epoch';
 function currentEpoch(){try{return Number(localStorage.getItem(epochKey))||0;}catch{return 0;}}
 function ended(id,message='새 게임을 시작해 이전 무기의 도트 작업을 종료했어.'){try{localStorage.setItem(key(id),JSON.stringify({status:'cancelled'}));}catch{}const error=Error(message);error.cancelled=true;return error;}
 function owns(id){try{const active=localStorage.getItem(activeKey);return!active||active===id;}catch{return true;}}
 let resetting=null;
 function reset(){if(resetting)return resetting;const epoch=Math.max(Date.now(),currentEpoch()+1);try{localStorage.setItem(epochKey,String(epoch));localStorage.setItem(activeKey,'new-game-'+epoch);}catch{}const task=(async()=>{if(location.protocol==='file:')return;const response=await fetch('/api/ai/effects/reset',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({epoch}),signal:AbortSignal.timeout(20000)});if(!response.ok)throw Error('이전 도트 작업을 정리하지 못했어.');return response.json();})();resetting=task;task.finally(()=>{if(resetting===task)resetting=null;}).catch(()=>{});return task;}
 async function readJob(id,onProgress){
  for(let attempt=0;attempt<3;attempt++)try{const response=await fetch('/api/ai/effects/jobs/'+id,{signal:AbortSignal.timeout(20000)});if(response.status>=500)throw Error('진행 조회 서버 응답 지연');const body=await (Craft.Http?Craft.Http.json(response):response.json());return{response,body};}catch(error){if(attempt===2){error.connectionOnly=true;throw error;}onProgress('진행 조회에 다시 연결하고 있어 · 같은 도트 작업을 계속 확인 중');await new Promise(resolve=>setTimeout(resolve,1800));}
 }
 async function apply(weapon,meta,{partial=false}={}){if(!/^[a-f0-9]{64}$/.test(meta?.id||''))throw Error('도트 결과 형식 오류');if(meta.rarity!==undefined&&meta.rarity!==(weapon.rarity||'common'))throw Error('무기 등급과 도트 등급이 달라. 같은 등급의 도트만 적용할 수 있어.');const rows=meta.local?.readyRows;if(rows!==undefined&&(!Array.isArray(rows)||!rows.length||rows.length>4||new Set(rows).size!==rows.length||rows.some(r=>!Number.isInteger(r)||r<0||r>3)))throw Error('완성된 도트 기술 위치 형식 오류');if(!partial&&rows&&rows.length<4)throw Error('부분 도트를 완성된 결과로 처리할 수 없습니다.');await BattleSpriteAtlas.loadGenerated(meta.id,weapon.moves[0].element,{allowFadeEmpty:meta.local?.layout==='skill-2x2-v1',...(rows?{readyRows:rows}:{})});weapon.effectAtlas={id:meta.id,...(meta.rarity?{rarity:meta.rarity}:{}),...(meta.local?.layout==='skill-2x2-v1'?{layout:meta.local.layout}:{}),...(rows?{readyRows:[...rows]}:{})};if(!partial){delete weapon.effectJob;delete weapon.effectRetryRows;}return meta;}
 async function submit({weapon,image,regenerate=false,retry=false,retryRows}){if(resetting)await resetting;const epoch=currentEpoch();const response=await fetch('/api/ai/effects',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({weapon,image,regenerate,...(retryRows?.length?{retryRows}:{}),replace:true,epoch,...(retry?{retry:true}:{})}),signal:AbortSignal.timeout(20000)}),body=await (Craft.Http?Craft.Http.json(response):response.json());if(epoch!==currentEpoch())throw ended(body.id||'stale-submit');if(!response.ok)throw Error(body.error||'도트 생성을 시작하지 못했어요.');if(response.status!==202){await apply(weapon,body.data);return null;}if(!/^[a-f0-9]{32}$/.test(body.id||''))throw Error('도트 작업 형식 오류');weapon.effectJob=body.id;try{localStorage.setItem(activeKey,body.id);}catch{}return body.id;}
 async function watch(weapon,{onProgress=()=>{},recoveryUsed=false}={}){
  const id=weapon.effectJob;if(!/^[a-f0-9]{32}$/.test(id||''))return null;
  let cached,rejectedResult=false;try{cached=JSON.parse(localStorage.getItem(key(id))||'null');}catch{}
  recoveryUsed=recoveryUsed||cached?.recoveryUsed===true;
  if(cached?.status==='retrying'&&/^[a-f0-9]{32}$/.test(cached.id||'')){weapon.effectJob=cached.id;return watch(weapon,{onProgress,recoveryUsed:true});}
  try{
  if(cached?.status==='cancelled'){const error=Error('새 게임을 시작해 이전 무기의 도트 작업을 종료했어.');error.cancelled=true;delete weapon.effectJob;throw error;}
  if(cached?.status==='done'){rejectedResult=true;return await apply(weapon,cached.data);}if(!owns(id)){delete weapon.effectJob;persistBattle(weapon);throw ended(id);}
  const waitingKey='draw-weapon:effect-wait:'+id;let waitingSince;try{const value=Number(localStorage.getItem(waitingKey));if(value>0&&value<=Date.now())waitingSince=value;}catch{}
  while(true){if(!owns(id)){delete weapon.effectJob;persistBattle(weapon);throw ended(id);}const{response,body}=await readJob(id,onProgress);if(!owns(id)){delete weapon.effectJob;persistBattle(weapon);throw ended(id);}if(body.status==='cancelled'){try{localStorage.setItem(key(id),JSON.stringify({status:'cancelled'}));}catch{}delete weapon.effectJob;persistBattle(weapon);const error=Error(body.message||'이전 게임 도트 작업 종료');error.cancelled=true;throw error;}if(body.status==='failed'&&body.partial){const current=weapon.effectAtlas?(weapon.effectAtlas.readyRows?.length||4):0;const rows=body.partial.local?.readyRows||[];if(current<4&&rows.length>=current){try{await apply(weapon,body.partial,{partial:true});persistBattle(weapon);}catch{}}}if(!response.ok||body.status==='failed'){const error=Error(body.error||'추가 도트 생성을 마치지 못했어요.');if(body.failedRows)error.failedRows=body.failedRows;error.retryExhausted=body.retryExhausted===true;throw error;}
   if(body.status==='done'){rejectedResult=true;const meta=await apply(weapon,body.data);try{localStorage.setItem(key(id),JSON.stringify({status:'done',data:meta,recoveryUsed}));}catch{}return meta;}
   const currentRows=weapon.effectAtlas?(weapon.effectAtlas.readyRows?.length||4):0,nextRows=body.partial?.local?.readyRows?.length||0;
   if(body.partial&&body.partial.id!==weapon.effectAtlas?.id&&currentRows<4&&nextRows>=currentRows){try{await apply(weapon,body.partial,{partial:true});persistBattle(weapon);}catch{/* Never expose an unverified partial frame. The final result remains strictly checked. */}}
   if(body.status==='queued'&&!waitingSince){waitingSince=Date.now();try{localStorage.setItem(waitingKey,String(waitingSince));}catch{}}
   onProgress(Craft.EffectProgress?Craft.EffectProgress.label(body,waitingSince?Date.now()-waitingSince:0):body.message||'로컬 도트 생성 중…');await new Promise(resolve=>setTimeout(resolve,1800));
  }
  }catch(error){
   if(Array.isArray(error.failedRows)&&error.failedRows.length&&error.failedRows.every(i=>Number.isInteger(i)&&i>=0&&i<4)){weapon.effectRetryRows=[...new Set(error.failedRows)];persistBattle(weapon);}
   if(error.cancelled||error.connectionOnly||error.retryExhausted||recoveryUsed||!weapon.artwork)throw error;if(!owns(id)){delete weapon.effectJob;persistBattle(weapon);throw ended(id);}
   onProgress(Array.isArray(error.failedRows)&&error.failedRows.length?'완성된 도트는 보존하고 '+error.failedRows.map(i=>(i+1)+'번').join('·')+' 기술 도트만 다시 만들고 있어…':'완성된 기술 도트는 재사용하며 남은 도트를 다시 준비하고 있어…');
   const next=await submit({weapon,image:weapon.artwork,regenerate:rejectedResult,retry:!rejectedResult,...(Array.isArray(error.failedRows)&&error.failedRows.length?{retryRows:error.failedRows}:{})});
   if(!next)return weapon.effectAtlas;
   try{localStorage.setItem(key(id),JSON.stringify({status:'retrying',id:next,recoveryUsed:true}));localStorage.setItem(key(next),JSON.stringify({recoveryUsed:true}));}catch{}
   persistBattle(weapon);
   return watch(weapon,{onProgress,recoveryUsed:true});
  }
 }
 function persistBattle(weapon){try{const params=new URLSearchParams(location.hash.slice(1)),id=params.get('build');if(id){const saved=JSON.stringify(Craft.normalizeCreative(weapon));localStorage.setItem('draw-weapon:build:'+id,saved);try{localStorage.setItem('draw-weapon:build-backup:'+id,saved);}catch{}}}catch{}}
 return{submit,watch,apply,persistBattle,reset};
})();
