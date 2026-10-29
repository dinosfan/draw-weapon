(function(root){
  const profiles=Object.freeze({heavy:{label:'묵직한 타격',duration:460,hold:90,push:32,shake:3},pierce:{label:'빠른 관통',duration:270,hold:22,push:14,shake:0},temporal:{label:'시간 단절',duration:620,hold:150,push:19,shake:0},slash:{label:'날카로운 베기',duration:340,hold:42,push:23,shake:1},pulse:{label:'파동 충격',duration:420,hold:45,push:17,shake:1},soft:{label:'부드러운 반응',duration:320,hold:0,push:0,shake:0}});
  function normalize(value,move={}){
    if(value!==undefined){if(!Object.hasOwn(profiles,value))throw Error('타격감 형식 오류');return value;}
    if(!move.damage)return 'soft';
    const actions=move.story?.map(scene=>scene.action)||[];
    if(move.story?.some(scene=>scene.motif==='dial')&&(actions.includes('freeze')||actions.includes('wind')))return 'temporal';
    if(actions.includes('sweep'))return 'heavy';
    if(move.vfx?.motion==='beam')return 'pierce';
    if(move.vfx?.motion==='slash')return 'slash';
    return actions.includes('fracture')?'heavy':'pulse';
  }
  const api={profiles,normalize};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Craft.HitFeel=api;
})(typeof window!=='undefined'?window:globalThis);
