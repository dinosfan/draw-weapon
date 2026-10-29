window.BattleConditionFeedback={mount(arena){
 const icons={poison:'☠️',burn:'🔥',paralysis:'⚡',sleep:'💤',freeze:'❄️',confusion:'💫',flinch:'💥',recharge:'💨'},actors={};
 for(const side of ['player','enemy']){const actor=arena.querySelector('.'+side+'-fighter'),aura=document.createElement('div'),notice=document.createElement('span');aura.className='condition-aura';aura.setAttribute('aria-hidden','true');notice.className='condition-notice';notice.hidden=true;actor.append(aura,notice);actors[side]={actor,aura,notice,states:[],timer:null};}
 function update(side,states=[],announce=true){const item=actors[side],next=states.filter(s=>Craft.Conditions.definitions[s]);if(item.states.join()===next.join())return;
  const added=next.filter(s=>!item.states.includes(s)),removed=item.states.filter(s=>!next.includes(s));item.aura.replaceChildren();item.actor.dataset.condition=next.includes('freeze')?'freeze':next.includes('sleep')?'sleep':next[0]||'';
  for(const state of next){const chip=document.createElement('span'),icon=document.createElement('span');chip.className='condition-chip';chip.style.setProperty('--condition-color',GamePalette.tokens[Craft.Conditions.definitions[state].color]);icon.className='tossface';icon.textContent=icons[state];chip.append(icon,document.createTextNode(Craft.Conditions.definitions[state].label));item.aura.append(chip);}
  if(announce&&(added.length||removed.length)){clearTimeout(item.timer);item.notice.textContent=[...added.map(s=>Craft.Conditions.definitions[s].label+'!'),...removed.map(s=>Craft.Conditions.definitions[s].label+' 해제')].join(' · ');item.notice.hidden=false;item.timer=setTimeout(()=>item.notice.hidden=true,1200);}item.states=next;
 }
 function blocked(side){const item=actors[side];if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;item.aura.animate?.([{transform:'translateX(0)'},{transform:'translateX(-5px)'},{transform:'translateX(5px)'},{transform:'translateX(0)'}],{duration:420,iterations:2});}
 function reset(){for(const side of ['player','enemy']){clearTimeout(actors[side].timer);actors[side].notice.hidden=true;update(side,[],false);}}
 return{update,blocked,reset};
}};
