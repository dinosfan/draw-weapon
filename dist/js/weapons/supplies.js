(function(root){
 const prefix='draw-weapon:supplies:',ids=['potion','charge','cleanse'],thresholds=[120,260,420],empty=()=>({potion:0,charge:0,cleanse:0});
 function key(hash){const p=new URLSearchParams(String(hash||'').split('#').pop()),id=p.get('journey')||p.get('build');return /^[a-z0-9-]{6,100}$/.test(id||'')?prefix+id:null;}
 function normalize(items){return Object.fromEntries(ids.map(id=>[id,Number.isInteger(items?.[id])&&items[id]>=0&&items[id]<=1?items[id]:0]));}
 function create(storage){
  function read(hash){const k=key(hash);if(!k)return{claimed:false,items:empty()};try{const saved=JSON.parse(storage.getItem(k)||'null');if(saved?.version===1&&saved.claimed===true)return{claimed:true,items:normalize(saved.items)};}catch{}return{claimed:false,items:empty()};}
  function claim(hash,score){const k=key(hash);if(!k||!Number.isInteger(score)||score<0||score>4000)throw Error('미니게임 보상 정보를 확인하지 못했어.');const previous=read(hash);if(previous.claimed)return previous;const record={version:1,claimed:true,items:Object.fromEntries(ids.map((id,i)=>[id,score>=thresholds[i]?1:0]))};storage.setItem(k,JSON.stringify(record));return record;}
  function commit(hash,items){const k=key(hash),record=read(hash);if(!k||!record.claimed)return;const next=normalize(items);for(const id of ids)next[id]=Math.min(record.items[id],next[id]);storage.setItem(k,JSON.stringify({version:1,claimed:true,items:next}));}
  function sync(hash,state){const record=read(hash);if(!record.claimed)return{...state,items:empty()};const items=normalize(state.items);return{...state,items:Object.fromEntries(ids.map(id=>[id,Math.min(items[id],record.items[id])]))};}
  return{read,claim,commit,sync};
 }
 const api={create,key,normalize,empty};if(typeof module!=='undefined'&&module.exports)module.exports=api;else{try{Object.assign(api,create(root.localStorage));}catch{Object.assign(api,create({getItem(){},setItem(){throw Error('가방을 저장할 공간이 없어.');}}));}root.Craft.Supplies=api;}
})(typeof window!=='undefined'?window:globalThis);
