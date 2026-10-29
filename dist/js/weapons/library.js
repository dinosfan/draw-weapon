(function(root){
 const Chronicle=typeof module!=='undefined'&&module.exports?require('./chronicle.js'):root.Craft.Chronicle;
 const key='draw-weapon:library:v1',validId=value=>typeof value==='string'&&/^[a-z0-9-]{6,100}$/.test(value);
 function create(storage){
  function read(){const raw=storage.getItem(key);if(!raw)return[];const entries=JSON.parse(raw);if(!Array.isArray(entries)||entries.length>60||entries.some(e=>!validId(e.id)||typeof e.hash!=='string'||e.hash.length>65000||typeof e.fingerprint!=='string'))throw Error('진열장 저장 기록을 읽지 못했어. 기존 기록은 그대로 보관돼.');return entries;}
  const write=entries=>storage.setItem(key,JSON.stringify(entries));
  const fingerprint=weapon=>{const copy={...weapon};for(const field of ['artwork','effectAtlas','effectJob','effectRetryRows','effectInheritance'])delete copy[field];return JSON.stringify(copy);};
  function record(weapon,params){
   const art=params.get('art');if(!validId(art))return null;const image=storage.getItem('draw-weapon:art:'+art);if(typeof image!=='string'||!image.startsWith('data:image/png;base64,'))return null;
   const entries=read(),fp=fingerprint(weapon);let entry=entries.find(e=>e.fingerprint===fp&&storage.getItem('draw-weapon:art:'+e.art)===image);
   if(!entry){if(entries.length>=60)throw Error('진열장이 가득 찼어. 저장한 무기를 선택 삭제한 뒤 다시 저장해 줘. (최대 60개)');entry={id:Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8),createdAt:Date.now(),wins:0,battles:0,bestStage:0};entries.unshift(entry);}
   let hash='#'+params,artRef=art;const complete=atlas=>/^[a-f0-9]{64}$/.test(atlas?.id||'')&&(!atlas.readyRows||atlas.readyRows.length===4);
   if(entry.hash&&!complete(weapon.effectAtlas)){try{const previous=new URLSearchParams(entry.hash.slice(1)),saved=JSON.parse(storage.getItem('draw-weapon:build:'+previous.get('build'))||'null');if(complete(saved?.effectAtlas)){hash=entry.hash;artRef=entry.art;}}catch{}}
   Object.assign(entry,{name:weapon.name,rarity:weapon.rarity||'common',types:weapon.types||['normal'],evolution:weapon.evolution?.stage||0,art:artRef,hash,fingerprint:fp});write(entries);return entry.id;
  }
  function finish(weapon,hash,outcome){const found=lookup(weapon,hash);if(!found)return null;const entries=read(),entry=entries.find(e=>e.id===found.id);if(!entry)return null;if(Chronicle?.duplicate(entry,outcome))return entry;entry.battles=(entry.battles||0)+1;if(outcome.won){entry.wins=(entry.wins||0)+1;entry.bestStage=Math.max(entry.bestStage||0,Math.max(0,Math.min(3,outcome.stage+1)));}entry.lastTurns=outcome.turns;Chronicle?.update(entry,outcome);write(entries);return entry;}
  function lookup(weapon,hash){const params=new URLSearchParams(hash.replace(/^#/,'')),image=storage.getItem('draw-weapon:art:'+params.get('art')),fp=fingerprint(weapon);return read().find(e=>e.fingerprint===fp&&storage.getItem('draw-weapon:art:'+e.art)===image)||null;}
  function inherit(parent,parentHash,child,childHash){const source=lookup(parent,parentHash),found=lookup(child,childHash);if(!source||!found||source.id===found.id||!Chronicle)return;const entries=read(),target=entries.find(e=>e.id===found.id);if(!target)return;const seen=new Set();target.inheritedDeeds=[...Chronicle.inherited(source),...Chronicle.deeds(source),...Chronicle.inherited(target)].filter(d=>{const k=d.id+'|'+d.weaponName+'|'+d.detail;if(seen.has(k))return false;seen.add(k);return true;}).slice(0,24);target.parentName=source.name;write(entries);}
  function resolve(id){const entry=read().find(e=>e.id===id);if(!entry)throw Error('진열장에서 무기를 찾지 못했어.');const params=new URLSearchParams(entry.hash.slice(1)),image=storage.getItem('draw-weapon:art:'+entry.art);if(!image?.startsWith('data:image/png;base64,'))throw Error('무기의 원본 저장 기록을 찾지 못했어. 다른 무기로 바꾸지 않았어.');
   if(params.get('build')){const id=params.get('build');let recovered=false;for(const kind of ['build:','build-backup:']){try{const data=storage.getItem('draw-weapon:'+kind+id),raw=JSON.parse(data||'null');if(raw?.kind!=='custom'||raw.name!==entry.name||(raw.rarity||'common')!==entry.rarity||!Array.isArray(raw.moves)||raw.moves.length!==4)continue;root.Craft?.normalizeCreative?.(raw);if(kind==='build-backup:')try{storage.setItem('draw-weapon:build:'+id,data);}catch{}recovered=true;break;}catch{}}if(!recovered)throw Error('무기 기술의 저장 기록을 확인해 줘. 다른 무기로 바꾸지 않았어.');}
   return{entry,image,hash:entry.hash};}
  function archive(id,value){const entries=read(),entry=entries.find(e=>e.id===id);if(!entry)throw Error('무기를 찾지 못했어.');entry.archived=value===true;write(entries);}
  function remove(ids){if(!Array.isArray(ids)||ids.some(id=>!validId(id)))throw Error('삭제할 무기를 다시 선택해 줘.');const chosen=new Set(ids),entries=read(),remaining=entries.filter(e=>!chosen.has(e.id));write(remaining);return entries.length-remaining.length;}
  return{record,finish,list:read,resolve,archive,lookup,inherit,remove};
 }
 if(typeof module!=='undefined'&&module.exports)module.exports={create};else{let storage;try{storage=root.localStorage;}catch{storage={getItem(){throw Error('브라우저 저장소를 사용할 수 없어.');}};}root.Craft.Library=create(storage);}
})(typeof window!=='undefined'?window:globalThis);
