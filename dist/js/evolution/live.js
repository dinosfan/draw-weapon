(async()=>{
 const $=id=>document.getElementById(id),UI=Craft.EvolutionScreen,API=Craft.EvolutionAPI,id=new URLSearchParams(location.hash.slice(1)).get('offer');let record,base,plan,selected=null,busy=false,done=false,retired=false;
 const loading=Craft.EvolutionLoading?.mount();let reveal,reading=false,departing=false;
 const departure=Craft.EvolutionDeparture.create({loading,play:unveil});
 const retire=()=>{retired=true;departure.stop();reveal?.reset();API.cancel?.();};globalThis.addEventListener?.('game:new-game',retire);globalThis.addEventListener?.('pagehide',retire);
 const save=()=>{if(!retired)Craft.Evolution.save(id,record);},progress=text=>{if(retired)return;if(reading){$('evolution-dot-status').textContent=text;departure.progress(1,text);}else{UI.message(text);$('evolution-phase').textContent='진화를 준비하고 있어…';}};
 function unveil({weapon,url,image}){if(retired||done)return;record.consumed=true;record.resultUrl=url;save();Craft.StorageCleanup?.activate(url,{offerId:id});done=true;$('evolution-depart').hidden=true;
  const after=$('evolution-after');$('evolution-before').src=base.artwork;reveal=EvolutionReveal.mount({stage:$('evolution-stage'),before:$('evolution-before'),after,onComplete:()=>{if(!retired)UI.completed(weapon,url);}});UI.message('네가 그린 선에, 새로운 힘이 깃들고 있어…');$('evolution-phase').textContent='진화 중…';$('evolution-stage').scrollIntoView?.({block:'center',behavior:'instant'});reveal.play(image);
 }
 async function finish(data){if(retired)return;const weapon=Craft.normalizeCreative(data.weapon);if(weapon.rarity!==base.rarity||weapon.evolution?.stage!==(base.evolution?.stage||0)+1)throw Error('진화 계승 정보 형식 오류');const changed=new Set(data.changes);if(!Array.isArray(data.changes)||changed.size!==data.changes.length||changed.size<1||changed.size>3||data.changes.some(i=>!Number.isInteger(i)||i<0||i>3))throw Error('진화 교체 기술 형식 오류');
  for(let i=0;i<4;i++)if(!changed.has(i)&&JSON.stringify(weapon.moves[i])!==JSON.stringify(base.moves[i]))throw Error('계승 기술이 달라졌습니다. 기존 무기는 유지됩니다.');
  departure.progress(1,'진화한 외형과 기술을 확인하고 있어…');weapon.artwork=await API.artwork(data.image);if(retired)return;
  departure.progress(2,'계승 기술과 새 기술의 도트를 준비하고 있어…');
  try{
   if(weapon.effectAtlas){const atlas=weapon.effectAtlas;await Craft.EffectJobs.apply(weapon,{...atlas,local:{layout:atlas.layout,...(atlas.readyRows?{readyRows:atlas.readyRows}:{})}});if(retired)return;$('evolution-dot-status').textContent=(data.reusedSlots?.length?'계승 기술 '+data.reusedSlots.length+'개 도트 재사용 · 새 기술 '+(4-data.reusedSlots.length)+'개 도트 완성':'진화 전용 도트 완성');}
   else{
    if(record.effectJob)weapon.effectJob=record.effectJob;
    else{await Craft.EffectJobs.submit({weapon,image:weapon.artwork});if(retired)return;if(weapon.effectJob){record.effectJob=weapon.effectJob;save();}}
    if(weapon.effectJob)await Craft.EffectJobs.watch(weapon,{onProgress:text=>{if(!retired){$('evolution-dot-status').textContent=text;departure.progress(2,text);}}});if(retired)return;
    $('evolution-dot-status').textContent='진화 전용 도트 완성';
   }
   delete record.effectJob;
  }catch(error){if(retired||error.cancelled)return;if(!error.connectionOnly)delete record.effectJob;save();const retry=Error('진화 도트를 완성하지 못했어. 같은 진화의 도트만 다시 준비해 줘. · '+error.message);retry.resumable=true;throw retry;}

  const after=$('evolution-after');after.src=data.image;if(typeof after.decode==='function')await after.decode();if(retired)return;
  const url=Craft.Evolution.battleUrl(weapon,record.nextStage,record.complete?undefined:record.sourceHash);record.changedSlots=data.changes;save();UI.changes(base,selected,weapon);if(!departing){$('evolution-phase').textContent='준비 완료 · 무기와 기술을 읽어 봐.';UI.message('준비가 끝났어. 무기와 기술을 천천히 읽고 전투로 출발해.');}departure.prepared({weapon,url,image:data.image});
 }
 async function choose(existing){if(retired||busy||done||!selected)return;busy=true;reading=true;UI.busy(true,'전용 기술을 준비하는 중…');UI.reading?.(base,selected);try{if(!existing||record.selected!==selected.index){delete record.effectJob;const job=await API.choose(record.planJob,selected.index);if(retired)return;record.choiceJob=job.id;record.selected=selected.index;save();}const data=await API.wait(record.choiceJob,progress);if(retired)return;await finish(data);}catch(error){if(retired||error.cancelled){departure.stop();return;}departure.fail();departing=false;reading=false;if(!error.resumable)delete record.choiceJob;if(error.status===404||error.status===409){delete record.planJob;plan=null;}save();UI.message(error.message+'\n현재 무기와 기술은 그대로야.');$('evolution-confirm').hidden=false;$('evolution-depart').hidden=true;UI.busy(false,error.resumable?'같은 진화 진행 확인':'선택한 진화 다시 준비');}finally{busy=false;}}
 async function load(){if(retired)return;busy=true;UI.busy(true,'두 진화형을 찾고 있어…');try{
  record=Craft.Evolution.get(id);base=Craft.readBattleWeapon(record.sourceHash);if(base.kind!=='custom'||!base.artwork||!base.moves)throw Error('진화할 원본 무기를 찾지 못했어요.');const originalNext=new URLSearchParams(record.sourceHash.slice(1));originalNext.set('stage',String(record.nextStage));UI.source(base,'battle.html#'+originalNext);
  if(record.consumed&&record.resultUrl){const weapon=Craft.readBattleWeapon(record.resultUrl.split('#')[1]);done=true;UI.changes(base,{changes:Array.isArray(record.changedSlots)?record.changedSlots.filter(i=>Number.isInteger(i)&&i>=0&&i<4).map(index=>({index})):base.moves.flatMap((m,i)=>m.name!==weapon.moves[i].name?[{index:i}]:[])},weapon);UI.completed(weapon,record.resultUrl);return;}
  if(record.planJob){try{plan=await API.wait(record.planJob,progress);if(retired)return;}catch(error){if(error.status!==404)throw error;delete record.planJob;}}
  if(!plan){const job=await API.prepare({weapon:base,image:base.artwork});if(retired)return;record.planJob=job.id;save();plan=await API.wait(job.id,progress);if(retired)return;}
  UI.options(base,plan,option=>{if(retired||busy||reading)return;selected=option;if(record.selected!==option.index){delete record.choiceJob;delete record.effectJob;delete record.selected;save();}$('evolution-confirm').disabled=false;$('evolution-confirm').textContent='이 진화로 선택';});$('evolution-phase').textContent='가능성을 골라 봐.';UI.message('어느 모습으로 진화할까?\n선택하면 계승할 기술과 바뀔 기술을 볼 수 있어.');UI.busy(false);$('evolution-confirm').disabled=true;$('evolution-confirm').textContent='진화형을 선택해 줘';
  if(record.choiceJob&&Number.isInteger(record.selected)){selected=plan.options[record.selected];UI.changes(base,selected);busy=false;await choose(true);}
 }catch(error){if(retired||error.cancelled)return;if(record&&!error.resumable){delete record.planJob;delete record.choiceJob;save();}plan=null;UI.message(error.message+'\n현재 무기와 기술은 그대로야.');$('evolution-confirm').disabled=false;$('evolution-confirm').textContent='진화 준비 다시 시도';}finally{busy=false;}}
 $('evolution-save-weapon').addEventListener('click',()=>{if(retired)return;try{const hash=record.resultUrl.split('#')[1],id=Craft.Library.record(Craft.readBattleWeapon(hash),new URLSearchParams(hash));if(!id){UI.message('무기 그림 저장 정보를 찾지 못했어. 무기는 그대로야.');return;}Craft.Library.inherit(base,record.sourceHash,Craft.readBattleWeapon(hash),hash);$('evolution-save-weapon').textContent='진열장에 저장됨';$('evolution-save-weapon').disabled=true;}catch(error){UI.message(error.message);}});
 $('evolution-confirm').addEventListener('click',()=>{if(retired)return;if(!record?.planJob||!plan){plan=null;load();}else choose(!!record.choiceJob);});
 $('evolution-depart').addEventListener('click',()=>{if(retired||done||departing||!reading)return;departing=true;$('evolution-depart').disabled=true;departure.request(base,selected);});await load();
})();
