(() => {
  const ui=id=>document.getElementById(id);let state=ClockLab.initial(),busy=false,revision=0;
  BattlePreview.drawSprites();
  ClockLab.clock(ui('lab-held').getContext('2d'),48,48,38,0,{numbers:false});
  const sequence=ClockLab.mountSequences(ui('lab-arena'));
  const buttons=ClockLab.moves.map(move=>{
    const button=document.createElement('button');button.type='button';
    const title=document.createElement('strong'),role=document.createElement('small'),cost=document.createElement('em');
    title.textContent=move.name;role.textContent=move.role;cost.textContent=move.cost;button.append(title,role,cost);
    const explain=()=>{ui('explained-name').textContent=move.name+' · '+move.role;ui('explained-text').textContent=move.detail;};
    button.addEventListener('pointerenter',explain);button.addEventListener('focus',explain);button.addEventListener('click',()=>act(move.id));
    ui('lab-moves').append(button);return button;
  });
  async function act(id){
    if(busy||!ClockLab.available(state,id))return;
    const before=state,next=ClockLab.reduce(state,id),token=++revision;
    busy=true;updateButtons();ui('lab-arena').setAttribute('aria-busy','true');
    const move=ClockLab.moves.find(item=>item.id===id);ui('lab-dialogue').textContent=move.name+'!';ui('lab-hint').textContent=move.detail;
    try{await sequence.play(id,before,next);}finally{
      if(token===revision){state=next;busy=false;ui('lab-arena').setAttribute('aria-busy','false');render();}
    }
  }
  function updateButtons(){buttons.forEach((button,i)=>button.disabled=busy||!ClockLab.available(state,ClockLab.moves[i].id));}
  function render(){
    ui('player-hp').textContent=state.hp+' / 100';ui('enemy-hp').textContent=state.enemyHp+' / 100';
    ui('player-bar').style.width=state.hp+'%';ui('enemy-bar').style.width=state.enemyHp/100*100+'%';
    ui('time-count').textContent=state.time+' / 6';ui('time-gauge').replaceChildren();
    for(let i=0;i<6;i++){const mark=document.createElement('i');mark.classList.toggle('filled',i<state.time);ui('time-gauge').append(mark);}
    ui('time-gauge').setAttribute('aria-label','저장 시간 '+state.time+'칸');
    ui('damage-memory').textContent='되감을 수 있는 피해 '+state.memory;
    ui('turn-label').textContent='TURN '+String(state.turn+1).padStart(2,'0');
    const raw=ClockLab.enemyDamage[state.turn%3];ui('enemy-intent').textContent=state.ended?'전투 종료':'다음 공격 '+raw+' 피해'+(state.field?' → 시간장으로 '+Math.ceil(raw/2):'');
    ui('installed-field').hidden=!state.field||state.ended;ui('field-count').textContent='시간장 · 남은 적 공격 '+state.field+'회';
    ui('lab-dialogue').textContent=state.message;
    ui('lab-hint').textContent=state.ended?'처음 상태로 돌아가 다른 선택을 실험해보세요.':state.field?'시간장이 남아 있는 동안 감거나 되감을 수 있어요.':'시간장은 피해를 줄여주지만, 설치에도 시간이 필요해요.';
    updateButtons();
  }
  ui('reset-lab').addEventListener('click',()=>{revision++;sequence.cancel();state=ClockLab.initial();busy=false;ui('explained-name').textContent=ClockLab.moves[0].name;ui('explained-text').textContent=ClockLab.moves[0].detail;ui('lab-arena').setAttribute('aria-busy','false');render();});
  ui('explained-text').textContent=ClockLab.moves[0].detail;render();
})();
