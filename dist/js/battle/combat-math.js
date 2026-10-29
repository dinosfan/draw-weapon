(function(root){
 const Types=typeof module!=='undefined'&&module.exports?require('../weapons/types.js'):root.Craft.Types,Rules=typeof module!=='undefined'&&module.exports?require('../weapons/move-rules.js'):root.Craft.MoveRules;
 function incoming(state,weapon,move){
  const affinity=Types.multiplier(move.element||'normal',weapon.types||['normal']),stages=weapon.moves?.some(m=>m.rule),power=stages?Rules.scale(state.enemyStages?.attack||0)/Rules.scale(state.playerStages?.defense||0)*(state.enemyStatus==='burn'?.75:1):1;
  const damage=move.damage&&affinity>0?Math.max(1,Math.round(move.damage*affinity*power)):0,hit=state.field?.effect==='guard'?Math.ceil(damage/2):damage;
  return{affinity,hit,guard:Math.ceil(hit/4)};
 }
 const api={incoming};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.BattleCombatMath=api;
})(typeof window!=='undefined'?window:globalThis);
