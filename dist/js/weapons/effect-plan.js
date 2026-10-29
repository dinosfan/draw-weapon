(function(root){
  const choices={motion:['projectile','burst','orbit','wave','slash','beam'],path:['straight','arc','spiral'],impact:['burst','ring','slice'],tone:['ink','ember','leaf','gold','mist']};
  function normalize(plan,move={}){
    if(!plan) return {motion:move.heal&&!move.damage?'orbit':'projectile',path:'arc',impact:'ring',tone:move.heal?'leaf':'ink',count:3,size:1,duration:1000};
    if(typeof plan!=='object'||Array.isArray(plan))throw Error('이펙트 형식 오류');
    const result={};
    for(const [key,values] of Object.entries(choices)){
      if(!values.includes(plan[key]))throw Error('이펙트 '+key+' 형식 오류');result[key]=plan[key];
    }
    for(const [key,min,max] of [['count',1,8],['size',.5,1.5],['duration',650,1500]]){
      if(!Number.isFinite(plan[key]))throw Error('이펙트 수치 형식 오류');
      result[key]=Math.max(min,Math.min(max,plan[key]));
    }
    result.count=Math.round(result.count);result.duration=Math.round(result.duration);
    return result;
  }
  const api={choices,normalize};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Craft.EffectPlan=api;
})(typeof window!=='undefined'?window:globalThis);
