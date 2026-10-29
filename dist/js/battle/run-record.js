(function(root){
 const prefix='draw-weapon:run:',parse=hash=>new URLSearchParams(String(hash||'').split('#').pop());
 function create(storage,weapon,hash){const params=parse(hash),id=params.get('journey')||params.get('build')||'legacy',key=prefix+id;
  function read(){try{const data=JSON.parse(storage.getItem(key)||'null');if(data&&Array.isArray(data.victories))return data;}catch{}return{originalName:weapon.evolution?.rootName||weapon.name,originalImage:weapon.evolution?null:weapon.artwork,victories:[]};}
  function write(data){try{storage.setItem(key,JSON.stringify(data));}catch{}}
  write(read());
  function record(state,finisher){if(!state.ended||state.enemyHp!==0)return;const data=read();data.victories=data.victories.filter(v=>v.stage!==state.stage);data.victories.push({stage:state.stage,turns:state.turn,finisher:String(finisher||'마지막 공격').slice(0,100)});data.victories.sort((a,b)=>a.stage-b.stage);write(data);}
  return{read,record};
 }
 if(typeof module!=='undefined'&&module.exports)module.exports={create};else root.BattleRunRecord={create};
})(typeof window!=='undefined'?window:globalThis);
