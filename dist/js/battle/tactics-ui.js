BattlePreview.mountTactics = arena => {
  const hud=document.getElementById('tactics-hud'),gauge=document.getElementById('resource-gauge'),field=document.getElementById('tactical-field');
  const conditions=document.createElement('div');conditions.className='battle-conditions';hud.after(conditions);
  return state=>{
    conditions.textContent=Craft.Moves.Rules.condition(state);conditions.hidden=!conditions.textContent;
    const engine=BattlePreview.weapon.engine;hud.hidden=!engine;if(!engine){field.hidden=true;return;}
    document.getElementById('resource-name').textContent=engine.name;
    document.getElementById('resource-count').textContent=state.resource+' / 6';gauge.replaceChildren();
    for(let i=0;i<6;i++){const mark=document.createElement('i');mark.classList.toggle('full',i<state.resource);gauge.append(mark);}
    gauge.setAttribute('aria-label',engine.name+' '+state.resource+'칸');
    document.getElementById('tactics-memory').textContent='직전 피해 '+state.lastDamage+' · '+engine.rule;
    field.hidden=!state.field||state.ended;
    if(state.field){
      const box=arena.getBoundingClientRect(),enemy=arena.querySelector('.enemy-fighter').getBoundingClientRect();
      const size=enemy.width+45;field.style.width=field.style.height=size+'px';field.style.left=enemy.left-box.left-22+'px';field.style.top=enemy.top-box.top-22+'px';
      field.dataset.effect=state.field.effect;
      const label=document.createElement('span');label.textContent=state.field.name+' · '+state.field.remaining+'회 남음';field.replaceChildren(label);
    }
  };
};
