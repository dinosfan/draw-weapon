(() => {
  if(BattlePreview.loadError){Craft.mountBattleRecovery(BattlePreview.loadError);return;}
  const ui = id => document.getElementById(id);try{Craft.StorageCleanup?.activate(location.hash);}catch(error){console.error(error.message);}
  BattlePreview.icons.skill = BattlePreview.weapon.icon;
  let state = BattlePreview.createState(Craft.Evolution.stage(location.hash,BattlePreview.encounters.length));
  let animating=false,revision=0,recordedRevision=-1;
  let battleId=Craft.Chronicle?.session(),lastFinisher='',lastStrike='',weaponRecord=null;
  let runRecord;try{runRecord=BattleRunRecord.create(localStorage,BattlePreview.weapon,location.hash);}catch{runRecord={read:()=>({victories:[]}),record(){}};}
  const restored=window.BattleSave?.load(BattlePreview.weapon,location.hash,state);
  if(restored){state=restored.state;battleId=restored.battleId;revision=restored.revision;lastFinisher=restored.lastFinisher||'';lastStrike=restored.lastStrike||'';recordedRevision=-1;}
  function saveBattle(){if(!window.BattleSave)return;const ok=BattleSave.save(BattlePreview.weapon,location.hash,{state,battleId,revision,lastFinisher,lastStrike});if(!ok){let note=document.getElementById('battle-save-warning');if(!note){note=document.createElement('p');note.id='battle-save-warning';note.setAttribute('role','status');document.querySelector('.game-shell').after(note);}note.textContent='전투 진행을 저장할 공간이 부족해. 현재 전투는 계속할 수 있어.';}}
  const updateIntent=BattlePreview.mountIntent?BattlePreview.mountIntent():()=>{};
  const effects=BattleEffects.mount(ui('arena'));
  const entry=BattleEncounterEntry.mount(ui('arena'));
  const impact=BattleImpact.mount(ui('arena'));
  const finisher=BattleFinisher.mount(ui('arena'));
  const turnFlow=BattleTurnFlow.create(),visualTasks=BattleAnimationTask.create();
  const conditionFeedback=BattleConditionFeedback.mount(ui('arena')),combatSound=BattleCombatSound.mount();
  const shell=document.querySelector('.game-shell');
  const dialogue=BattleDialogue.mount(ui('dialogue'));
  const presentation=BattleTurnPresentation.create({visual:visualTasks,dialogue,effects,impact,finisher,sound:combatSound,conditions:conditionFeedback,pause:ms=>turnFlow.pause(ms),encounter:(stage,s)=>BattlePreview.getEncounter(stage,s),enemyIntent:s=>BattlePreview.enemyIntent(s),weapon:BattlePreview.weapon,player:BattlePreview.data.player,conditionList:Craft.Conditions.list,conditionName:key=>Craft.Conditions.definitions[key]?.label||'',status:(side,character,hp,conditions,note)=>visualTasks.run(()=>BattlePreview.renderStatus(ui(side+'-status'),character,hp,note,side==='player',conditions),{timeout:2400,cancel:()=>BattleHP.cancelAll()}),acting:(side,on)=>document.querySelector('.'+side+'-fighter').classList.toggle('acting',on),phaseStart:next=>{document.querySelector('.enemy-fighter').classList.add('boss-awakening');BattlePreview.drawSprites(next.stage,next);window.GameAudio?.battle(next);},phaseEnd:()=>document.querySelector('.enemy-fighter').classList.remove('boss-awakening')});
  const updateTactics=BattlePreview.mountTactics(ui('arena'));
  const updateCommands = BattlePreview.mountCommands(ui('commands'), action => {
    if(animating)return;
    if (action === 'attack') { setMoveMenu(true); return; }
    if (action === 'skill') { dialogue.idle(BattlePreview.weapon.name+'\n'+BattlePreview.weapon.trait+' · '+Craft.Types.summary(BattlePreview.weapon.types)+'\n'+(BattlePreview.weapon.engine?.rule||'싸운다에서 기술 4개를 선택하세요.')); return; }
    act(action);
  });
  let movesOpen = false;
  const moveMenu = BattlePreview.mountMoves({use:index=>act(index<0?'attack':'move:'+index),close:()=>setMoveMenu(false)});
  function setMoveMenu(open) {
    movesOpen=open && !state.ended && !animating;
    ui('commands').hidden=movesOpen;ui('move-menu').hidden=!movesOpen;ui('move-description').hidden=!movesOpen;
    if(movesOpen){moveMenu.update(state);moveMenu.focus();}
    else if(!state.ended && !animating)ui('commands').querySelector('[data-action="attack"]').focus({preventScroll:true});
  }
  async function act(action) {
    if(animating)return;
    const previous=state,next=BattlePreview.reduce(state,action);
    if(previous.turn===next.turn){state=next;render();if(next!==previous)dialogue.idle(next.message);return;}
    const token=++revision;animating=true;dialogue.cancel();setMoveMenu(false);lockCommands();
    const index=action.startsWith('move:')?Number(action.slice(5)):-1;
    const move=next.feedback?.prevented?null:index>=0?Craft.Moves.forWeapon(BattlePreview.weapon)[index]:action==='attack'?{damage:BattlePreview.weapon.attack,heal:0}:null;
    const finalBlow=BattleFinisher.eligible(BattlePreview.weapon,move,previous,next,BattlePreview.encounters.length-1);
    if(finalBlow)lastFinisher=move.name;
    if(next.enemyHp===0){const ending=next.feedback?.endTurn?.find(e=>e.side==='enemy'&&e.hp===0);lastStrike=ending?Craft.Conditions.definitions[ending.status].label+' 피해':next.feedback?.enemySelfDamage?'혼란 피해':move?.name||'기본 공격';}
    if(window.BattleSave)BattleSave.save(BattlePreview.weapon,location.hash,{state:next,battleId,revision,lastFinisher,lastStrike});
    try {
      await presentation.play(previous,next,move,action,finalBlow,()=>token===revision);
    } catch(error) { console.error('Battle animation failed:',error); /* Keep the accepted combat action. */ }
    finally {
      if(token===revision){
        if(finalBlow)lastFinisher=move.name;
        animating=false;state=next;
        render();
        if(!state.ended)ui('commands').querySelector('[data-action="attack"]').focus({preventScroll:true});
      }
    }
  }
  function lockCommands(){
    shell.setAttribute('aria-busy',String(animating));
    shell.classList.toggle('turn-busy',animating);
    if(animating)document.querySelectorAll('#commands button,.move-button').forEach(button=>{button.disabled=true;});
  }
  const updateResults = BattlePreview.mountResults({ retry: () => startEncounter(state.stage), next: () => {
    if (state.ended && state.enemyHp === 0 && state.stage < BattlePreview.encounters.length - 1) startEncounter(state.stage + 1);
  }, save: () => {
    const id=Craft.Library?.record(BattlePreview.weapon,new URLSearchParams(location.hash.slice(1)));if(!id)return false;
    weaponRecord=Craft.Library.finish(BattlePreview.weapon,location.hash,{id:battleId,won:state.enemyHp===0,stage:state.stage,lastStage:BattlePreview.encounters.length-1,turns:state.turn,hp:state.hp,enemy:BattlePreview.getEncounter(state.stage,state),finisher:lastFinisher});render();return true;
  } });
  function startEncounter(stage) {
    revision++;entry.cancel();dialogue.cancel();visualTasks.cancel();BattleHP.cancelAll();turnFlow.cancel();effects.cancel();impact.cancel();finisher.cancel();conditionFeedback.reset();combatSound.stop();animating=false;
    battleId=Craft.Chronicle?.session();lastFinisher='';lastStrike='';
    state = BattlePreview.createState(stage);
    const params=new URLSearchParams(location.hash.slice(1));params.set("stage",String(stage));history.replaceState(null,"",location.pathname+location.search+"#"+params);
    setMoveMenu(false);
    document.querySelectorAll('.fighter').forEach(element => element.classList.remove('hit','strike','defeated','boss-awakening','acting'));
    render();
    BattlePreview.drawSprites(state.stage,state);
    const attack = ui('commands').querySelector('[data-action="attack"]');
    attack.focus({preventScroll:true});
    encounterIntro();
  }
  async function encounterIntro(){
    const token=++revision;animating=true;dialogue.cancel();dialogue.idle('전장에 들어서고 있어…');lockCommands();
    try{const encounter=BattlePreview.getEncounter(state.stage,state);await entry.play({stage:state.stage,location:encounter.location});if(token!==revision)return;await dialogue.say(BattlePreview.getEncounter(state.stage,state).name+' 등장!');}finally{if(token===revision){animating=false;render();if(!state.ended)ui('commands').querySelector('[data-action="attack"]').focus({preventScroll:true});}}
  }
  function render() {
    const data = BattlePreview.data;
    const encounter = BattlePreview.getEncounter(state.stage,state);
    updateIntent(state);
    conditionFeedback.update('player',Craft.Conditions.list(state,'player'));conditionFeedback.update('enemy',Craft.Conditions.list(state,'enemy'));
    const rarityPreview=ui("rarity-preview");if(rarityPreview&&BattlePreview.weapon.moves?.every(move=>move.motionPlan))rarityPreview.href="rarity-effects-lab.html"+location.hash;
    if(state.ended&&recordedRevision!==revision){runRecord.record(state,lastStrike);recordedRevision=revision;try{weaponRecord=Craft.Library?.finish(BattlePreview.weapon,location.hash,{id:battleId,won:state.enemyHp===0,stage:state.stage,lastStage:BattlePreview.encounters.length-1,turns:state.turn,hp:state.hp,enemy:encounter,finisher:lastFinisher});}catch{if(weaponRecord)weaponRecord={...weaponRecord,lastEarned:[]};}}
    const memory=ui('weapon-memory');if(memory)memory.textContent=weaponRecord&&Craft.Chronicle?.tag(weaponRecord)?' · 「'+Craft.Chronicle.tag(weaponRecord)+'」':'';
    ui('stage-counter').textContent = 'STAGE ' + (state.stage + 1) + ' / ' + BattlePreview.encounters.length;
    ui('encounter-label').textContent = encounter.location + ' · ' + (encounter.boss ? ((state.bossPhase||0)+1)+'페이즈 / 2' : encounter.subtitle);
    BattlePreview.renderStatus(ui('enemy-status'), encounter, state.enemyHp, state.ended ? '전투 종료' : '전투 중', false,Craft.Conditions.list(state,'enemy'));
    BattlePreview.renderStatus(ui('player-status'), data.player, state.hp,undefined,true,Craft.Conditions.list(state,'player'));
    dialogue.idle(state.ended?state.message:BattlePreview.weapon.name+'로 무엇을 할까?');
    window.GameAudio?.battle(state);
    updateCommands(state);
    moveMenu.update(state);
    updateTactics(state);
    lockCommands();
    document.querySelector('.enemy-fighter').classList.toggle('defeated',state.enemyHp === 0);
    document.querySelector('.player-fighter').classList.toggle('defeated',state.hp === 0);
    updateResults(state,weaponRecord,runRecord.read());
    ui('turn-counter').textContent = `TURN ${String(state.turn + 1).padStart(2, '0')}`;
    ui('turn-counter').title='전투 진행은 자동 저장돼. 재대결은 처음부터 시작해.';
    saveBattle();
  }
  ui('retry-battle').addEventListener('click', () => startEncounter(state.stage));
  const equipped = ui('equipped-weapon');
  equipped.replaceChildren();
  const icon = document.createElement('span');
  icon.className = 'tossface'; icon.setAttribute('aria-hidden', 'true');
  icon.textContent = BattlePreview.weapon.icon;
  equipped.append(icon, ' ' + BattlePreview.weapon.name + ' 장착 중');
  const memory=document.createElement('span');memory.id='weapon-memory';equipped.append(memory);
  try{weaponRecord=Craft.Library?.lookup(BattlePreview.weapon,location.hash);}catch{}
  BattlePreview.drawSprites(state.stage,state); BattlePreview.renderArtwork(); render();
  if(!restored&&!state.ended)encounterIntro();
  function stopPresentation(){revision++;entry.cancel();dialogue.cancel();visualTasks.cancel();BattleHP.cancelAll();turnFlow.cancel();effects.cancel();impact.cancel();finisher.cancel();combatSound.stop();animating=true;lockCommands();}
  window.addEventListener('game:new-game',stopPresentation);window.addEventListener('pagehide',stopPresentation);
})();

