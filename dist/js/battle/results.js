BattlePreview.mountResults = ({ retry, next, save }) => {
  const panel = document.getElementById('battle-result');
  const retryButton = document.getElementById('result-retry');
  const nextButton = document.getElementById('next-encounter');
  const evolutionLink=document.getElementById('evolve-weapon');
  const saveWeapon=document.getElementById('save-current-weapon');
  const trophy=window.BattleVictoryCard?.mount(panel);
  const memory=document.createElement('p');memory.className='result-memory';memory.hidden=true;document.getElementById('result-note').after(memory);
  retryButton.addEventListener('click', retry);
  nextButton.addEventListener('click', next);
  saveWeapon?.addEventListener('click',()=>{try{if(!save?.()){saveWeapon.textContent='그림 저장 정보를 찾지 못했어';return;}saveWeapon.textContent='진열장에 저장됨';saveWeapon.disabled=true;}catch(error){saveWeapon.textContent=error.message;}});
  let wasEnded = false;
  return (state,weaponRecord,run) => {
    trophy?.update(state,run);
    panel.hidden = !state.ended;
    if (!state.ended) { wasEnded = false; return; }
    if(saveWeapon){const saved=Craft.Library.lookup(BattlePreview.weapon,location.hash);saveWeapon.hidden=false;saveWeapon.disabled=!!saved;saveWeapon.textContent=saved?'진열장에 저장됨':'무기 저장';}
    const won = state.enemyHp === 0;
    const complete = won && state.stage === BattlePreview.encounters.length - 1;
    document.getElementById('result-icon').textContent = won ? '🏆' : '🩹';
    document.getElementById('result-title').textContent = complete ? '모든 수호자를 물리쳤다!' : won ? '승리! 다음 길이 열렸다.' : '아직 모험은 끝나지 않았어.';
    document.getElementById('result-summary').textContent = `${state.turn}턴 · 남은 체력 ${state.hp}/100`;
    document.getElementById('result-note').textContent = complete ? '네가 그린 무기로 낙서 세계를 지켜냈다.' : won ? '다음 전투는 체력·기술·물약을 모두 회복하고 시작해.' : '강공격 전에는 방어, 체력이 부족할 때는 물약을 써보자.';
    const earned=weaponRecord&&Craft.Chronicle?.deeds(weaponRecord).filter(d=>weaponRecord.lastEarned?.includes(d.id)).sort((a,b)=>b.priority-a.priority),deed=earned?.[0]||Craft.Chronicle?.highlight(weaponRecord);memory.hidden=!won||!deed;memory.textContent=deed?(earned?.length?'새로 새긴 기록':'무기에 남은 기록')+' · 「'+deed.title+'」\n'+deed.detail:'';
    nextButton.hidden = !won || complete;
    const journey=document.getElementById('new-journey');if(journey){journey.hidden=!complete;if(complete&&Craft.Journey){const params=new URLSearchParams(location.hash.slice(1));params.set('journey',Craft.Journey.seed());params.set('stage','0');journey.href='battle.html#'+params;}}
    if(evolutionLink){evolutionLink.hidden=true;if(won){try{const url=Craft.Evolution.offer(BattlePreview.weapon,state,location.hash,BattlePreview.encounters.length);if(url){evolutionLink.href=url;evolutionLink.hidden=false;}}catch(error){console.error('Evolution offer could not be saved:',error);}}}
    retryButton.textContent = won ? '같은 상대와 재대결' : '다시 도전';
    if (!wasEnded) { wasEnded = true; (nextButton.hidden ? retryButton : nextButton).focus({preventScroll:true}); }
  };
};
