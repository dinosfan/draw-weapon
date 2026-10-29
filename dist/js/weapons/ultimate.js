(function(root){
 function apply(moves,weapon){
  const result=moves.map(move=>({...move,rule:move.rule?{...move.rule}:undefined,ultimate:false}));
  if(weapon.rarity!=='mythic'||weapon.study==='dragon-scythe')return result;
  const offensive=move=>move.damage>0||move.mechanic?.kind==='release',hasOffense=moves.some(offensive);
  let index=moves.findIndex(move=>move.ultimate===true&&(!hasOffense||offensive(move)));
  if(index<0)index=moves.reduce((best,move,i)=>{const score=m=>offensive(m)?1000+(m.damage||0):(m.heal||0);return score(move)>=score(moves[best])?i:best;},0);
  const move=result[index];if(!move)return result;move.ultimate=true;move.pp=1;move.signature=true;
  if(offensive(move))move.damage=Math.min(220,Math.max(140,Math.round(move.damage*2.8),Math.round(weapon.attack*5)));
  if(move.heal>0)move.heal=Math.min(100,Math.max(60,move.heal*2));
  if(move.rule){move.rule.accuracy=100;if(move.rule.chance>0)move.rule.chance=100;if(['attackUp','defenseUp','attackDown','defenseDown'].includes(move.rule.kind))move.rule.amount=2;}
  return result;
 }
 // Immunity still holds; a one-use mythic strike overpowers ordinary debuffs and resistance stacking.
 const affinity=value=>value<=0?0:Math.max(.5,value);
 const scale=stage=>stage>=0?(2+stage)/2:2/(2-stage);
 const multiplier=(value,state={})=>affinity(value)*Math.max(1,scale(state.playerStages?.attack||0))*Math.max(1,1/scale(state.enemyStages?.defense||0));
 const api={apply,affinity,multiplier};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Craft.Ultimate=api;
})(typeof window!=='undefined'?window:globalThis);
