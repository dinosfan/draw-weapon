(function(root){
 // Authored comparison fixture. Other drawings never inherit the dragon's skills.
 function moves(base,weapon){
  if(weapon.study!=='dragon-scythe')return base;
  const rank={common:0,rare:1,epic:2,legendary:3,mythic:4}[weapon.rarity]||0;
  return base.map((move,index)=>{
   const next={...move,cinematic:['scales','fang','crescent','judgment'][index]};
   if(index!==3||rank<3)return next;
   next.signature=true;next.rule={...move.rule};
   if(rank===3){next.name='용왕의 참격';next.rule.kind='defenseDown';next.rule.chance=100;next.rule.amount=1;}
   else{next.name='종언 · 용왕의 처형';next.damage=Math.max(140,Math.round(weapon.attack*5));next.pp=1;next.rule={kind:'attack',accuracy:100,chance:0,amount:1};next.ultimate=true;}
   return next;
  });
 }
 const api={moves};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Craft.ScytheAscension=api;
})(typeof window!=='undefined'?window:globalThis);
