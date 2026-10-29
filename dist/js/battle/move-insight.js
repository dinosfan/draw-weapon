(function(root){
 const Types=typeof module!=='undefined'&&module.exports?require('../weapons/types.js'):root.Craft.Types,Rules=typeof module!=='undefined'&&module.exports?require('../weapons/move-rules.js'):root.Craft.MoveRules;
 function inspect(move,state,encounter){
  const affinity=Types.multiplier(move.element,encounter.types||['normal']),kind=move.rule?.kind;
  let damage=move.damage||0;if(['protect','recover','charge','field','rewind'].includes(kind))damage=0;
  if(damage&&state){const ultimate=typeof module!=='undefined'&&module.exports?require('../weapons/ultimate.js'):root.Craft.Ultimate;damage=Math.round(damage*(move.ultimate?ultimate.multiplier(affinity,state):affinity*(state.playerStatus==='burn'?.75:1)*Rules.scale(state.playerStages?.attack||0)/Rules.scale(state.enemyStages?.defense||0)));if(affinity>0)damage=Math.max(1,damage);}
  const label=move.damage?(affinity===0?'효과 없음':affinity>1?'유리 ×'+affinity:affinity<1?'불리 ×'+affinity:'보통 ×1'):Rules.labels[kind]||'보조 기술';
  if(move.mechanic||['release','rewind'].includes(kind))damage=null;
  return{affinity,damage,label,accuracy:move.rule?.accuracy||100,kind:affinity===0&&move.damage?'immune':affinity>1&&move.damage?'strong':'neutral'};
 }
 const api={inspect};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.BattleMoveInsight=api;
})(typeof window!=='undefined'?window:globalThis);
