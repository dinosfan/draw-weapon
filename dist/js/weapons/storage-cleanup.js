(function(root){
 const prefix='draw-weapon:',activeKey=prefix+'active-weapon',offerKey=prefix+'active-evolution';
 const params=url=>new URLSearchParams(String(url||'').split('#').pop());
 function create(storage){
  let lastWarning='';
  function collect({reset=false}={}){
   // Fail closed if the collection is corrupt: never guess which saved art to delete.
   const entries=JSON.parse(storage.getItem(prefix+'library:v1')||'[]');
   if(!Array.isArray(entries)||entries.some(e=>typeof e.hash!=='string'))throw Error('진열장 기록을 확인하지 못해 임시 정리를 멈췄어.');
   const keys=Array.from({length:storage.length},(_,i)=>storage.key(i)),keep=new Set();
   const active=reset?'':storage.getItem(activeKey)||'',current=params(active),journey=current.get('journey');if(active)keep.add(prefix+'run:'+(journey||current.get('build')||'legacy'));
   function markJob(id){if(!id||keep.has(prefix+'effect-job:'+id))return;keep.add(prefix+'effect-job:'+id);keep.add(prefix+'effect-wait:'+id);try{const job=JSON.parse(storage.getItem(prefix+'effect-job:'+id)||'null');if(job?.status==='retrying')markJob(job.id);}catch{}}
   function mark(url){const p=params(url),build=p.get('build'),art=p.get('art');if(art)keep.add(prefix+'art:'+art);if(build){for(const kind of ['build:','build-backup:']){const key=prefix+kind+build;keep.add(key);try{markJob(JSON.parse(storage.getItem(key)||'null')?.effectJob);}catch{}}}else try{markJob(JSON.parse(p.get('data')||'null')?.effectJob);}catch{}}
   entries.forEach(e=>{mark(e.hash);if(e.art)keep.add(prefix+'art:'+e.art);});if(active)mark(active);
   for(const key of keys){if(!key?.startsWith(prefix+'evolution-offer:')||reset||!active)continue;try{const offer=JSON.parse(storage.getItem(key)),p=params(offer.sourceHash);if(key===prefix+'evolution-offer:'+storage.getItem(offerKey)||(journey&&p.get('journey')===journey)||(!journey&&p.get('build')===current.get('build'))){keep.add(key);mark(offer.sourceHash);if(offer.resultUrl)mark(offer.resultUrl);}}catch{}}
   for(const key of keys){if(!key?.startsWith(prefix+'battle-save:')||!active)continue;try{const p=new URLSearchParams(JSON.parse(key.slice((prefix+'battle-save:').length)));if(['build','art','journey','stage','data'].every(k=>(p.get(k)||'')===(current.get(k)||'')))keep.add(key);}catch{}}
   const temporary=/^draw-weapon:(?:art:|build:|build-backup:|effect-job:|effect-wait:|evolution-offer:|battle-save:|run:)/;
   let removed=0;for(const key of keys)if(temporary.test(key)&&!keep.has(key)){storage.removeItem(key);removed++;}
   if(reset){storage.removeItem(activeKey);storage.removeItem(offerKey);}
   const equipped=storage.getItem(prefix+'equipped');if(equipped){try{if(reset||JSON.parse(equipped).id!==current.get('art'))storage.removeItem(prefix+'equipped');}catch{storage.removeItem(prefix+'equipped');}}
   return removed;
  }
  function activate(url,{offerId}={}){
   storage.setItem(activeKey,url);if(offerId)storage.setItem(offerKey,offerId);else storage.removeItem(offerKey);
   try{const removed=collect();lastWarning='';return{removed,deferred:false};}
   catch(error){const warning='진열장 기록을 보호하려고 임시 정리를 보류했어. 무기 제작과 전투는 계속할 수 있어.';if(lastWarning!==warning){lastWarning=warning;try{root.console?.warn?.(warning);}catch{}}return{removed:0,deferred:true,warning};}
  }
  return{collect,activate};
 }
 if(typeof module!=='undefined'&&module.exports)module.exports={create};else root.Craft.StorageCleanup=create(root.localStorage);
})(typeof window!=='undefined'?window:globalThis);
