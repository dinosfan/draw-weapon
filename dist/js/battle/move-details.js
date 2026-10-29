(function(root){
 const server=typeof module!=='undefined'&&module.exports,Insight=server?require('./move-insight.js'):root.BattleMoveInsight,Tactics=server?require('../weapons/tactics.js'):root.Craft.Tactics;
 function inspect(move,state,weapon,encounter,index){const info=Insight.inspect(move,state,encounter),pp=state.pp[index],reason=state.ended?'전투 종료':pp<=0?(move.ultimate?'궁극기 사용 완료':'PP 부족'):Tactics.reason(state,move,weapon)||'';return{...info,pp,maxPp:move.pp,reason,damageLabel:info.damage===null?'조건에 따라 변화':info.damage>0?'예상 피해 '+info.damage:move.damage&&info.affinity===0?'피해 0 · 효과 없음':'보조 기술'};}
 const api={inspect};if(server)module.exports=api;else root.BattleMoveDetails=api;
})(typeof window!=='undefined'?window:globalThis);
