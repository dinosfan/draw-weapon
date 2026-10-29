(function(root){
  const actions=['reveal','wind','orbit','seal','echo','freeze','fracture','sweep','bloom','converge','pulse'];
  const targets=['caster','enemy','center'],parts=['whole','core','rim','upper','lower'];
  function normalize(story){
    if(!Array.isArray(story)||story.length<3||story.length>5)throw Error('연출 장면 형식 오류');
    return story.map(scene=>{
      if(!scene||!actions.includes(scene.action)||!targets.includes(scene.target)||!parts.includes(scene.part))throw Error('연출 장면 동작 형식 오류');
      const label=typeof scene.label==='string'?scene.label.replace(/[\u0000-\u001f]/g,'').trim().slice(0,32):'';
      if(!label||!Number.isFinite(scene.duration))throw Error('연출 장면 설명 형식 오류');
      return{label,action:scene.action,target:scene.target,part:scene.part,motif:['dial','petals','rain','none'].includes(scene.motif)?scene.motif:'none',duration:Math.round(Math.max(350,Math.min(800,scene.duration)))};
    });
  }
  const api={actions,targets,parts,normalize};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Craft.Story=api;
})(typeof window!=='undefined'?window:globalThis);
