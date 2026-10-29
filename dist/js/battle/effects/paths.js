window.BattleEffects = {};
BattleEffects.point = (start,end,t,path,index,count) => {
  const x=start.x+(end.x-start.x)*t,y=start.y+(end.y-start.y)*t;
  const spread=(index-(count-1)/2)*14;
  if(path==='arc')return {x,y:y-Math.sin(t*Math.PI)*(45+index*7)+spread*Math.sin(t*Math.PI)};
  if(path==='spiral')return {x:x+Math.sin(t*Math.PI*4+index)*Math.sin(t*Math.PI)*30,y:y+Math.cos(t*Math.PI*4+index)*Math.sin(t*Math.PI)*30};
  return {x,y:y+spread*Math.sin(t*Math.PI)};
};
BattleEffects.tone = key => ({ink:GamePalette.tokens.ink,ember:GamePalette.tokens.danger,leaf:GamePalette.tokens.nature,gold:GamePalette.tokens.electric,mist:GamePalette.tokens.normal}[key]||GamePalette.tokens.ink);
