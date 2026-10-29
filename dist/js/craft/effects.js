Craft.generateWeaponEffects=async({weapon,canvas,regenerate=false,onProgress=()=>{}})=>{
 if(Craft.EffectJobs){const id=await Craft.EffectJobs.submit({weapon,image:Craft.captureDrawing(canvas),regenerate,...(weapon.effectRetryRows?.length?{retryRows:weapon.effectRetryRows}:{})});return id?Craft.EffectJobs.watch(weapon,{onProgress}):weapon.effectAtlas;}
 const signal=AbortSignal.timeout(480000);
 const response=await fetch('/api/ai/effects',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({weapon,image:Craft.captureDrawing(canvas),regenerate}),signal});
 let body=await response.json();if(!response.ok)throw Error(body.error||'전용 연출을 만들지 못했습니다.');
 if(response.status===202){
  if(!/^[a-f0-9]{32}$/.test(body.id))throw Error('연출 작업 정보 오류');const id=body.id;
  while(true){
   const poll=await fetch('/api/ai/effects/jobs/'+id,{signal});body=await poll.json();
   if(!poll.ok||body.status==='failed'||body.status==='cancelled')throw Error(body.error||body.message||'전용 연출을 만들지 못했습니다.');
   if(body.status==='done')break;
   onProgress(body.message||'PC에서 전용 연출을 만들고 있어…');
   await new Promise((resolve,reject)=>{const stop=()=>{clearTimeout(timer);reject(signal.reason);};const timer=setTimeout(()=>{signal.removeEventListener('abort',stop);resolve();},1200);if(signal.aborted)stop();else signal.addEventListener('abort',stop,{once:true});});
  }
 }
 if(!/^[a-f0-9]{64}$/.test(body.data?.id))throw Error('연출 저장 정보 오류');
 await BattleSpriteAtlas.loadGenerated(body.data.id,weapon.moves[0].element,{allowFadeEmpty:body.data.local?.layout==='skill-2x2-v1'});
 weapon.effectAtlas={id:body.data.id,...(body.data.local?.layout==='skill-2x2-v1'?{layout:body.data.local.layout}:{})};return body.data;
};
