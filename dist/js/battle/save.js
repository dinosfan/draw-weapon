(function(root){
 const identity=weapon=>{const copy={...weapon};for(const k of ['effectJob','effectAtlas','artwork','effectRetryRows','effectInheritance'])delete copy[k];return JSON.stringify(copy);};
 function key(hash){const p=new URLSearchParams(hash.replace(/^#/,''));return'draw-weapon:battle-save:'+JSON.stringify(['weapon','build','data','art','journey','stage','rarity'].map(k=>[k,p.get(k)||'']));}
 function create(storage){
  function load(weapon,hash,initial){try{const raw=storage.getItem(key(hash));if(!raw||raw.length>20000)return null;const record=JSON.parse(raw),s=record.state;
   if(record.version!==1||record.weapon!==identity(weapon)||!s||s.stage!==initial.stage)return null;
   const integer=(v,min,max)=>Number.isInteger(v)&&v>=min&&v<=max;
   if(s.bossPhase!==undefined&&(!integer(s.bossPhase,0,1)||s.stage!==2))return null;
   if(s.phaseTurn!==undefined&&(!integer(s.phaseTurn,0,s.turn)||s.bossPhase!==1))return null;
   if(!integer(s.hp,0,100)||!integer(s.enemyHp,0,initial.enemyHp)||!integer(s.turn,0,100000)||!integer(s.potions,0,1)||!integer(s.skills,0,2)||!integer(s.resource,0,6)||!integer(s.lastDamage,0,100))return null;
   if(s.items&&(!['potion','charge','cleanse'].every(k=>integer(s.items[k],0,1))||Object.keys(s.items).some(k=>!['potion','charge','cleanse'].includes(k))))return null;
   if(!Array.isArray(s.pp)||s.pp.length!==4||s.pp.some((pp,i)=>!integer(pp,0,initial.pp[i]))||typeof s.ended!=='boolean'||s.ended!==(s.hp===0||s.enemyHp===0)||typeof s.message!=='string'||s.message.length>4000)return null;
   for(const side of ['player','enemy']){const status=s[side+'Status'];if(status&&!['poison','burn','paralysis','sleep','freeze'].includes(status))return null;const stages=s[side+'Stages'];if(stages&&(!integer(stages.attack,-2,2)||!integer(stages.defense,-2,2)))return null;const effects=s[side+'Volatile'];if(effects&&Object.entries(effects).some(([k,v])=>!['confusion','flinch','recharge'].includes(k)||!integer(v,0,5)))return null;}
   if(s.field&&(!['guard','burn','regen'].includes(s.field.effect)||!integer(s.field.remaining,1,20)||!integer(s.field.power,0,110)))return null;
   if(typeof record.battleId!=='string'||record.battleId.length>120||!integer(record.revision,0,100000))return null;return record;
  }catch{return null;}}
  function save(weapon,hash,record){try{storage.setItem(key(hash),JSON.stringify({version:1,weapon:identity(weapon),...record}));return true;}catch{return false;}}
  function clear(hash){try{return storage.removeItem(key(hash));}catch{return false;}}
  return{load,save,clear};
 }
 if(typeof module!=='undefined'&&module.exports)module.exports={create,key};else{let storage;try{storage=root.localStorage;}catch{storage={getItem(){},setItem(){throw Error();}};}root.BattleSave=create(storage);}
})(typeof window!=='undefined'?window:globalThis);
