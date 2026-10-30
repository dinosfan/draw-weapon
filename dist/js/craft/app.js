(() => {
  const ui = id => document.getElementById(id);
  let currentBattleUrl='',craftEpoch=0;
  const scene = Craft.mountScene(ui);
  const birth=Craft.mountRarityReveal();const loading=GameLoading.mount();
  const minigame=Craft.Minigame.mount();let departing=false;
  const rarityChoice=Craft.RarityChoice.mount(ui('craft-rarity'),ui('craft-rarity-hint'));
  const clearPreviousDots=()=>Craft.EffectJobs.reset().catch(()=>{});
  clearPreviousDots();try{Craft.StorageCleanup?.collect({reset:true});}catch(error){scene.say(error.message,'저장한 무기를 보호하기 위해 정리를 멈췄어.');}
  let points = 0, strokeCount = 0, created = false, busy = false, equippedWeapon=null, effectLocation='외부에서 생성',analysisProvider='Gemini';
  let publishedWeapon,publishedEffect;
  function refreshWeapon(weapon){
    if(equippedWeapon!==weapon)return;
    const stamp=JSON.stringify([weapon.effectJob,weapon.effectAtlas,weapon.effectRetryRows]);if(publishedWeapon===weapon&&publishedEffect===stamp)return;
    const params=new URLSearchParams(currentBattleUrl.split('#')[1]),build=params.get('build');
    if(build&&weapon.kind==='custom'){const data=JSON.stringify(Craft.normalizeCreative(weapon));localStorage.setItem('draw-weapon:build:'+build,data);try{localStorage.setItem('draw-weapon:build-backup:'+build,data);}catch{}}
    else if(currentBattleUrl&&weapon.kind==='custom'){params.set('data',JSON.stringify(Craft.normalizeCreative(weapon)));currentBattleUrl='battle.html#'+params;}
    else if(!currentBattleUrl)currentBattleUrl=Craft.weaponBattleUrl(weapon);
    publishedWeapon=weapon;publishedEffect=stamp;Craft.StorageCleanup?.activate(currentBattleUrl);
    document.querySelectorAll('.battle-exit').forEach(link=>link.href=currentBattleUrl);
  }
  const preparation=Craft.BattlePreparation.create({loading,
    async startEffects(weapon,{regenerate,resume,onRegistered,onProgress}){
      const id=resume&&weapon.effectJob?weapon.effectJob:await Craft.EffectJobs.submit({weapon,image:weapon.artwork,regenerate,...(weapon.effectRetryRows?.length?{retryRows:weapon.effectRetryRows}:{})});
      onRegistered();if(id)await Craft.EffectJobs.watch(weapon,{onProgress});
    },
    onUpdate(weapon,message){refreshWeapon(weapon);if(message)ui('effect-status').textContent=message+' · 기술을 읽어보는 동안에도 계속 준비돼';},
    onReady(weapon){refreshWeapon(weapon);Craft.renderWeapon(ui('weapon-preview'),ui('weapon-result'),weapon);ui('effect-status').textContent='기술 도트 준비 완료 · 전투로 출발해!';ui('retry-effects').hidden=false;ui('retry-effects').disabled=false;ui('retry-effects').textContent='도트만 다시 만들기';},
    onError(error,weapon){refreshWeapon(weapon);ui('effect-status').textContent=error.message+' · 기본 연출로 전투 가능 · 무기와 기술은 그대로야';ui('retry-effects').hidden=false;ui('retry-effects').disabled=false;},
    enter(weapon){refreshWeapon(weapon);location.assign(currentBattleUrl);}
  });
  document.querySelectorAll('.battle-exit').forEach(link=>link.addEventListener('click',async event=>{event.preventDefault();if(!created||!equippedWeapon||departing)return;departing=true;const token=craftEpoch,weapon=equippedWeapon;try{const finished=await minigame.play(currentBattleUrl);if(finished&&token===craftEpoch&&weapon===equippedWeapon)preparation.request();}catch(error){ui('effect-status').textContent=error.message;}finally{departing=false;}}));
  ui('retry-effects').addEventListener('click',()=>{if(busy||!equippedWeapon||preparation.read().status==='generating')return;ui('retry-effects').hidden=true;preparation.retry();});
  function invalidateWeapon(){const hadWeapon=!!equippedWeapon;minigame.cancel();preparation.reset();equippedWeapon=null;currentBattleUrl='';if(hadWeapon)clearPreviousDots();}
  window.addEventListener('game:new-game',()=>{craftEpoch++;Craft.cancelAnalysis?.();invalidateWeapon();});
  function update() {
    ui('drawing-placeholder').hidden = strokeCount > 0;
    ui('undo-drawing').disabled = !strokeCount;
    ui('create-weapon').disabled = busy || created || (ui('analysis-mode').value === 'live' ? !points : (!points && !ui('weapon-description').value.trim()));
  }
  const drawing = Craft.mountDrawing(ui('drawing-canvas'), (count, amount) => {
    strokeCount = count; points = amount;if(!busy)invalidateWeapon(); created = false;ui('save-weapon').hidden=true; update();
  });
  ui('pen-size').addEventListener('input', event => drawing.setWidth(event.target.value));
  ui('undo-drawing').addEventListener('click', () => drawing.undo());
  ui('clear-drawing').addEventListener('click', () => {
    ui('weapon-description').value = '';ui('save-weapon').hidden=true; drawing.clear();
    scene.say('새 종이가 준비됐어!\n다시 한번 그려볼까?', '설명만 입력해도 무기를 만들 수 있어.');
  });
  ui('weapon-description').addEventListener('input', () => { invalidateWeapon();created = false;ui('save-weapon').hidden=true; update(); });
  ui('draw-command').addEventListener('click', () => {
    clearPreviousDots();try{Craft.StorageCleanup?.collect({reset:true});}catch(error){scene.say(error.message,'저장한 무기를 보호하기 위해 정리를 멈췄어.');}
    invalidateWeapon();created = false;ui('save-weapon').hidden=true; scene.draw(); update();
    scene.say('어떤 무기든 좋아.\n네 상상대로 자유롭게 그려봐!', '기존 그림을 고치거나 지우고 새로 그릴 수 있어.');
  });
  ui('examples-command').addEventListener('click', () => scene.examples(ui('example-menu').hidden));
  ui('close-examples').addEventListener('click', () => { scene.examples(false); ui('examples-command').focus(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !ui('example-menu').hidden) { scene.examples(false); ui('examples-command').focus(); } });
  document.querySelectorAll('[data-example]').forEach(button => button.addEventListener('click', () => {
    const type = button.dataset.example;
    invalidateWeapon();created = false;ui('save-weapon').hidden=true; scene.draw();
    ui('weapon-description').value = type === 'flower' ? '체력을 회복시키는 꽃' : '시간을 멈추는 시계';
    const strokes = Craft.exampleStrokes(type).map(stroke => ({ ...stroke, points: stroke.points.map(([x,y]) => [x,y * 380 / 480]) }));
    drawing.replace(strokes);
    scene.say(type === 'flower' ? '작은 꽃에 생명력이 느껴지는걸?\n어떤 무기가 될지 확인해 볼까?' : '시계 속에서 힘이 느껴지는걸?\n어떤 무기가 될지 확인해 볼까?', '준비됐다면 제작을 선택해!');
    ui('create-weapon').focus();
  }));
  ui('analysis-mode').addEventListener('change', () => {
    invalidateWeapon();created = false;ui('save-weapon').hidden=true; scene.draw(); update();
    const live = ui('analysis-mode').value === 'live';
    try { localStorage.setItem('draw-weapon:analysis-mode',live?'live':'mock'); } catch {}
    ui('server-craft-link').hidden = !(live && location.protocol === 'file:');
    ui('analysis-notice').textContent = live ? '그림 분석: '+analysisProvider+' · 연출: '+effectLocation : '모의 제작 · 외부 전송 없음';
    scene.say(live ? '네가 그린 그림을 직접 살펴볼게.\n어떤 모양이든 자유롭게 그려봐!' : '네 상상으로 무기를 만들어보자!', live ? '그림을 그린 뒤 제작을 선택해. 설명은 없어도 괜찮아.' : '그림 설명과 선의 양으로 무기를 만들어.');
    if (live && location.protocol === 'file:') scene.say('그림 분석은 서버에서 사용할 수 있어.\n서버로 공방을 열어줘.', 'README의 Gemini 실행 방법을 확인해 줘.');
  });
  ui('save-weapon').addEventListener('click',()=>{try{const params=new URLSearchParams(currentBattleUrl.split('#')[1]),id=Craft.Library.record(equippedWeapon,params);if(!id){ui('effect-status').textContent='그림 저장 정보를 찾지 못했어. 무기는 그대로야.';return;}ui('save-weapon').textContent='진열장에 저장됨';ui('save-weapon').disabled=true;}catch(error){ui('effect-status').textContent=error.message;}});
  ui('create-weapon').addEventListener('click', async () => {
    const live = ui('analysis-mode').value === 'live';
    if (busy || created || (live ? !points : (!points && !ui('weapon-description').value.trim()))) return;
    const token=++craftEpoch,chosenRarity=rarityChoice.choose();
    const controls = [...document.querySelectorAll('button,input,select')].filter(control=>!control.matches('[data-new-game],[data-loading-action]'));
    const previousDisabled = controls.map(control => control.disabled);let saveBlocked=false;
    preparation.reset();equippedWeapon=null;busy = true;ui('drawing-canvas').inert=true;
    controls.forEach(control => { control.disabled = true; });
    document.querySelector('.workshop').setAttribute('aria-busy', 'true');
    if (live) scene.say('낙서에 숨은 힘을 살펴보는 중이야…', '잠시만 기다려 줘. 실패해도 그림은 그대로 남아 있어.');
    try {
      await Craft.EffectJobs.reset();if(token!==craftEpoch)return;
      const description = ui('weapon-description').value;
      const weapon = live ? await Craft.analyzeDrawing({canvas:ui('drawing-canvas'),description,rarity:chosenRarity,onProgress:message=>{scene.say(message,'그림과 기술을 준비하는 중이야. 새 게임으로 취소할 수 있어.');}}) : Craft.createWeapon({description,points});
      if(token!==craftEpoch)return;
      if (points && !weapon.artwork) weapon.artwork = ui('drawing-canvas').toDataURL('image/png');
      weapon.rarity=chosenRarity;
      equippedWeapon=weapon;
      ui('effect-status').textContent=live?'기술 도트를 만들고 있어 · 먼저 기술을 읽어봐':'모의 제작 · 새 이미지 생성 없음';ui('retry-effects').hidden=true;
      const battleUrl = Craft.weaponBattleUrl(weapon);currentBattleUrl=battleUrl;Craft.StorageCleanup?.activate(battleUrl);
      
      Craft.renderWeapon(ui('weapon-preview'), ui('weapon-result'), weapon);
      created = true;let saved,saveError;try{saved=Craft.Library.lookup(weapon,battleUrl);}catch(error){saveError=error;}saveBlocked=!!saved||!!saveError;ui('save-weapon').hidden=false;ui('save-weapon').disabled=saveBlocked;ui('save-weapon').textContent=saveError?'저장 기록 확인 필요':saved?'진열장에 저장됨':'무기 저장';ui('save-weapon').title=saveError?.message||''; scene.reveal();
      document.querySelectorAll('.battle-exit').forEach(link => { link.href = battleUrl; });
      if(live)preparation.prepare(weapon);else preparation.prepare(weapon,{effects:false});
      await birth.play(weapon);if(token!==craftEpoch)return;
      scene.say(Craft.Rarity.get(weapon.rarity).label+' 등급 '+weapon.name + ' 획득!\n기술을 읽었다면, 모험 가방을 챙겨볼까?', '출발을 누르면 1분 재료 줍기! 그동안 기술 도트도 계속 준비돼.');
      ui('footer-note').textContent = weapon.name + ' 장착 완료 · 나가기: 수호자에게 도전';
    } catch (error) {
      if(token!==craftEpoch)return;
      scene.say(error.name === 'TimeoutError' ? '분석 시간이 너무 오래 걸렸어. 다시 시도해 줘.' : error.message, '그림은 그대로야. 제작을 다시 선택하거나 모의 제작으로 바꿔도 돼.');
    } finally {
      if(token!==craftEpoch)return;
      ui('drawing-canvas').inert=false;busy = false;
      controls.forEach((control,index) => { control.disabled = previousDisabled[index]; });
      if(created)ui('save-weapon').disabled=saveBlocked;
      document.querySelector('.workshop').setAttribute('aria-busy', 'false');
      update();
    }
  });
  if (location.protocol !== 'file:') fetch('/api/status').then(response => response.json()).then(status => {
    analysisProvider=status.provider;effectLocation=status.effectsProvider==='chatkhu'?'ChatKHU에서 생성':status.effectsProvider==='local'?'내 PC에서 생성':'외부에서 생성';
    if (status.configured) {
      ui('analysis-mode').options[1].textContent = analysisProvider+' 그림 분석 · 준비됨';
      let preferred; try { preferred=localStorage.getItem('draw-weapon:analysis-mode'); } catch {}
      if (!busy && !created && preferred !== 'mock') { ui('analysis-mode').value='live'; ui('analysis-mode').dispatchEvent(new Event('change')); }
    }
    else ui('analysis-mode').options[1].textContent = 'Gemini 그림 분석 · 키 필요';
  }).catch(() => {});
  update();
})();
