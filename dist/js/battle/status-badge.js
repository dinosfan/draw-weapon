(function(root){
  const Conditions=typeof module!=='undefined'&&module.exports?require('../weapons/conditions.js'):root.Craft.Conditions;
  const Types=typeof module!=='undefined'&&module.exports?require('../weapons/types.js'):root.Craft.Types;
  const states=Conditions.definitions;
  function markup(status){
    if(Array.isArray(status))return status.map(markup).join('');
    if(typeof status!=='string'||!Object.hasOwn(states,status))return '';
    const state=states[status];return '<span class="condition-badge" style="--condition-color:var(--color-'+state.color+');--condition-ink:'+Types.ink(state.color)+'" aria-label="상태이상: '+state.label+'" title="'+state.description+'">'+state.label+'</span>';
  }
  const api={states,markup};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.BattleStatusBadge=api;
})(typeof window!=='undefined'?window:globalThis);
