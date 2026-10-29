BattlePreview.mountMoves = ({ use, close }) => {
  let enemyTypes=['normal'],currentState;
  const menu=document.getElementById('move-menu'), buttons=[];
  const moves=Craft.Moves.forWeapon(BattlePreview.weapon);
  const hasOffense=moves.some(Craft.Moves.canDamage);
  const grid=document.createElement('div');grid.className='move-grid';
  moves.forEach((move,index)=>{
    const button=document.createElement('button');button.type='button';button.className='move-button';
    button.style.setProperty('--type-color',Craft.Types.color(move.element));
    if(move.signature)button.classList.add('signature-move');if(move.ultimate)button.classList.add('ultimate-move');
    const name=document.createElement('strong'),pp=document.createElement('small');name.textContent=(move.ultimate?'궁극기 · ':'')+move.name;
    const matchup=document.createElement('span');matchup.className='move-matchup';
    const unavailable=document.createElement('span');unavailable.className='move-unavailable';button.append(name,pp,matchup,unavailable);button.addEventListener('click',()=>{if(button.getAttribute('aria-disabled')==='true'){describe();return;}use(index);});
    const describe=()=>{if(!currentState)return;const info=BattleMoveDetails.inspect(move,currentState,BattlePreview.weapon,BattlePreview.getEncounter(currentState.stage,currentState),index),panel=document.getElementById('move-description'),heading=document.createElement('strong'),stats=document.createElement('div'),effect=document.createElement('p'),reason=document.createElement('p');heading.textContent=move.name;stats.className='move-detail-stats';for(const text of [Craft.Types.label(move.element),info.damageLabel,'명중 '+info.accuracy+'%','PP '+info.pp+' / '+info.maxPp]){const chip=document.createElement('span');chip.textContent=text;stats.append(chip);}effect.textContent=move.rule?Craft.Moves.Rules.explain(move):Craft.Tactics.describe(move,BattlePreview.weapon)||move.description;reason.textContent=info.reason||(move.ultimate?'전투당 1회 · 화상·공격 저하·상대 방어 상승 관통':info.label);panel.replaceChildren(heading,stats,effect,reason);};
    button.addEventListener('focus',describe);button.addEventListener('pointerenter',describe);
    button.addEventListener('keydown',event=>{const delta={ArrowRight:1,ArrowLeft:-1,ArrowDown:2,ArrowUp:-2}[event.key];if(delta){event.preventDefault();buttons[(index+delta+4)%4].focus();}});
    button.insight=matchup;button.unavailable=unavailable;buttons.push(button);grid.append(button);
  });
  const back=document.createElement('button');back.type='button';back.className='move-back';back.textContent='돌아가기';back.addEventListener('click',close);
  const fallback=document.createElement('button');fallback.type='button';fallback.className='move-back';fallback.textContent=hasOffense?'기본 공격 (사용 가능한 기술 없음)':'기본 공격 (보조 무기)';fallback.hidden=true;fallback.addEventListener('click',()=>use(-1));
  menu.append(grid,fallback,back);menu.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();close();}});
  return {
    update(state){currentState=state;enemyTypes=BattlePreview.getEncounter(state.stage,state).types||['normal'];fallback.hidden=state.pp.some(pp=>pp>0)||state.ended;buttons.forEach((button,i)=>{const reason=BattleMoveDetails.inspect(moves[i],state,BattlePreview.weapon,BattlePreview.getEncounter(state.stage,state),i).reason;button.disabled=state.ended;button.setAttribute('aria-disabled',String(!!reason));button.unavailable.textContent=reason;button.querySelector('small').textContent=Craft.Types.label(moves[i].element)+(moves[i].ultimate?' · 남은 횟수 ':' · PP ')+state.pp[i]+' / '+moves[i].pp;button.title=Craft.Tactics.reason(state,moves[i],BattlePreview.weapon);});if(typeof BattleMoveInsight!=='undefined')buttons.forEach((button,i)=>{const info=BattleMoveInsight.inspect(moves[i],state,BattlePreview.getEncounter(state.stage,state));button.insight.textContent=info.label+(info.damage?' · 예상 '+info.damage+' 피해':'');});fallback.hidden=state.ended||!BattlePreview.weapon.engine&&hasOffense&&buttons.some((button,i)=>button.getAttribute('aria-disabled')!=='true'&&Craft.Moves.canDamage(moves[i])&&Craft.Types.multiplier(moves[i].element,enemyTypes)>0);fallback.textContent=BattlePreview.weapon.engine?'기본 공격 · '+BattlePreview.weapon.engine.name+' +1':hasOffense?'기본 공격 · PP 소모 없음':'기본 공격 (보조 무기)';},
    focus(){const first=buttons.find(button=>!button.disabled&&button.getAttribute('aria-disabled')!=='true');(first||(!fallback.hidden?fallback:back)).focus({preventScroll:true});}
  };
};

