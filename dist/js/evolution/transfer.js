(function(root){
 const key=id=>'draw-weapon:evolution-offer:'+id,valid=id=>/^[a-z0-9-]{8,100}$/.test(id||'');
 function get(id){if(!valid(id))throw Error('진화 기회 형식 오류');const record=JSON.parse(localStorage.getItem(key(id))||'null');if(!record||typeof record.sourceHash!=='string'||!Number.isInteger(record.nextStage))throw Error('저장된 진화 기회를 찾지 못했어요. 승리 화면에서 다시 열어 줘.');return record;}
 function save(id,value){if(!valid(id))throw Error('진화 기회 형식 오류');localStorage.setItem(key(id),JSON.stringify(value));}
 function offer(weapon,state,hash,total){if(!state.ended||state.enemyHp!==0||weapon.kind!=='custom'||!weapon.artwork)return null;
  const params=new URLSearchParams(hash.slice(1)),build=params.get('build');if(!build)return null;
  const journey=params.get('journey'),run=/^[a-z0-9]{6,32}$/.test(journey||'')?'-'+journey:'';const id=build+'-'+state.stage+'-'+(weapon.evolution?.stage||0)+run;if(!valid(id))throw Error('진화 기회 저장 오류');
  if(!localStorage.getItem(key(id)))save(id,{sourceHash:hash,nextStage:state.stage+1<total?state.stage+1:0,complete:state.stage+1>=total,createdAt:Date.now(),consumed:false});return'evolve.html#offer='+id;
 }
 function stage(hash,total){const value=Number(new URLSearchParams(hash.slice(1)).get('stage'));return Number.isInteger(value)&&value>=0&&value<total?value:0;}
 function battleUrl(weapon,nextStage,sourceHash){const url=root.Craft.weaponBattleUrl(weapon),params=new URLSearchParams(url.split('#')[1]);params.set('stage',String(nextStage));return root.Craft.Journey?root.Craft.Journey.carry('battle.html#'+params,sourceHash):'battle.html#'+params;}
 const api={get,save,offer,stage,battleUrl};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Craft.Evolution=api;
})(typeof window!=='undefined'?window:globalThis);
