(() => {
  const ui = id => document.getElementById(id);
  let currentBattleUrl='';
  const scene = Craft.mountScene(ui);
  const birth=Craft.mountRarityReveal();const loading=GameLoading.mount();
  const rarityChoice=Craft.RarityChoice.mount(ui('craft-rarity'),ui('craft-rarity-hint'));
  const clearPreviousDots=()=>Craft.EffectJobs.reset().catch(()=>{});
  clearPreviousDots();try{Craft.StorageCleanup?.collect({reset:true});}catch(error){scene.say(error.message,'저장한 무기를 보호하기 위해 정리를 멈췄어.');}
  let points = 0, strokeCount = 0, created = false, busy = false, equippedWeapon=null, localEffects=false,effectLocation='외부에서 생성',analysisProvider='Gemini';
  async function startLocalDots(weapon){
    try{const job=await Craft.EffectJobs.submit({weapon,image:Craft.captureDrawing(ui('drawing-canvas'))});
      if(!job){ui('effect-status').textContent='기술별 도트 완성';loading.done(weapon);return;}
      ui('effect-status').textContent='전용 도트 생성 시작 · 지금 전투해도 괜찮아';ui('retry-effects').hidden=true;
      Craft.EffectJobs.watch(weapon,{onProgress:message=>{if(equippedWeapon===weapon){ui('effect-status').textContent=message+' · 지금 전투 가능';loading.update(message,weapon);}}}).then(meta=>{if(!meta||equippedWeapon!==weapon)return;loading.done(weapon);ui('effect-status').textContent='네 기술의 도트 완성 · 전투에 적용돼';ui('retry-effects').hidden=false;ui('retry-effects').textContent='도트 연출 다시 만들기';Craft.renderWeapon(ui('weapon-preview'),ui('weapon-result'),weapon);const url=Craft.weaponBattleUrl(weapon);currentBattleUrl=url;Craft.StorageCleanup?.activate(url);document.querySelectorAll('.battle-exit').forEach(link=>link.href=url);}).catch(error=>{if(equippedWeapon===weapon){loading.fail(error);ui('effect-status').textContent='도트 생성 확인 필요 · '+error.message+' · 전투는 가능해';ui('retry-effects').hidden=false;}});
    }catch(error){loading.fail(error);ui('effect-status').textContent='도트 생성 시작 실패 · '+error.message+' · 전투는 가능해';ui('retry-effects').hidden=false;}
  }
  async function makeEffects(weapon,regenerate=false){
    ui('retry-effects').hidden=true;ui('effect-status').textContent='그림에 맞춘 전용 연출을 만드는 중…';
    try{const report=await Craft.generateWeaponEffects({weapon,canvas:ui('drawing-canvas'),regenerate,onProgress:message=>{ui('effect-status').textContent=message;loading.update(message,weapon);scene.say(message,'원본 그림과 완성된 기술은 그대로 유지돼.');}});loading.done(weapon);ui('effect-status').textContent='전용 연출 완성 · '+(report.cached?'저장된 결과':Math.round(report.elapsedMs/1000)+'초');return true;}
    catch(error){loading.fail(error);ui('effect-status').textContent=(weapon.moves?.every(move=>move.motionPlan)?'그림과 기술로 바로 전투할 수 있어. 추가 이미지 연출을 다듬지 못했어. ':'무기는 완성됐어. 전용 연출은 아직 준비되지 않았어. ')+error.message;ui('retry-effects').hidden=false;return false;}
  }
  ui('retry-effects').addEventListener('click',async()=>{
    if(busy||!equippedWeapon)return;loading.begin(equippedWeapon.artwork,{currentWeapon:equippedWeapon});loading.playable();busy=true;const controls=[...document.querySelectorAll('button,input,select')].filter(control=>!control.matches('[data-new-game],[data-loading-action]')),disabled=controls.map(control=>control.disabled);controls.forEach(control=>control.disabled=true);
    try{if(await makeEffects(equippedWeapon,true)){Craft.renderWeapon(ui('weapon-preview'),ui('weapon-result'),equippedWeapon);const url=Craft.weaponBattleUrl(equippedWeapon);currentBattleUrl=url;Craft.StorageCleanup?.activate(url);document.querySelectorAll('.battle-exit').forEach(link=>link.href=url);}}
    catch(error){ui('effect-status').textContent=error.message;}
    finally{busy=false;controls.forEach((control,i)=>control.disabled=disabled[i]);update();}
  });
  function update() {
    ui('drawing-placeholder').hidden = strokeCount > 0;
    ui('undo-drawing').disabled = !strokeCount;
    ui('create-weapon').disabled = busy || created || (ui('analysis-mode').value === 'live' ? !points : (!points && !ui('weapon-description').value.trim()));
  }
  const drawing = Craft.mountDrawing(ui('drawing-canvas'), (count, amount) => {
    strokeCount = count; points = amount; created = false;ui('save-weapon').hidden=true; update();
  });
  ui('pen-size').addEventListener('input', event => drawing.setWidth(event.target.value));
  ui('undo-drawing').addEventListener('click', () => drawing.undo());
  ui('clear-drawing').addEventListener('click', () => {
    ui('weapon-description').value = '';ui('save-weapon').hidden=true; drawing.clear();
    scene.say('새 종이가 준비됐어!\n다시 한번 그려볼까?', '설명만 입력해도 무기를 만들 수 있어.');
  });
  ui('weapon-description').addEventListener('input', () => { created = false;ui('save-weapon').hidden=true; update(); });
  ui('draw-command').addEventListener('click', () => {
    clearPreviousDots();try{Craft.StorageCleanup?.collect({reset:true});}catch(error){scene.say(error.message,'저장한 무기를 보호하기 위해 정리를 멈췄어.');}
    created = false;ui('save-weapon').hidden=true; scene.draw(); update();
    scene.say('어떤 무기든 좋아.\n네 상상대로 자유롭게 그려봐!', '기존 그림을 고치거나 지우고 새로 그릴 수 있어.');
  });
  ui('examples-command').addEventListener('click', () => scene.examples(ui('example-menu').hidden));
  ui('close-examples').addEventListener('click', () => { scene.examples(false); ui('examples-command').focus(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !ui('example-menu').hidden) { scene.examples(false); ui('examples-command').focus(); } });
  document.querySelectorAll('[data-example]').forEach(button => button.addEventListener('click', () => {
    const type = button.dataset.example;
    created = false;ui('save-weapon').hidden=true; scene.draw();
    ui('weapon-description').value = type === 'flower' ? '체력을 회복시키는 꽃' : '시간을 멈추는 시계';
    const strokes = Craft.exampleStrokes(type).map(stroke => ({ ...stroke, points: stroke.points.map(([x,y]) => [x,y * 380 / 480]) }));
    drawing.replace(strokes);
    scene.say(type === 'flower' ? '작은 꽃에 생명력이 느껴지는걸?\n어떤 무기가 될지 확인해 볼까?' : '시계 속에서 힘이 느껴지는걸?\n어떤 무기가 될지 확인해 볼까?', '준비됐다면 제작을 선택해!');
    ui('create-weapon').focus();
  }));
  ui('analysis-mode').addEventListener('change', () => {
    created = false;ui('save-weapon').hidden=true; scene.draw(); update();
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
    const chosenRarity=rarityChoice.choose();
    const controls = [...document.querySelectorAll('button,input,select')].filter(control=>!control.matches('[data-new-game],[data-loading-action]'));
    const previousDisabled = controls.map(control => control.disabled);
    busy = true;if(live)loading.begin(ui('drawing-canvas').toDataURL('image/png'));
    controls.forEach(control => { control.disabled = true; });
    document.querySelector('.workshop').setAttribute('aria-busy', 'true');
    if (live) scene.say('낙서에 숨은 힘을 살펴보는 중이야…', '잠시만 기다려 줘. 실패해도 그림은 그대로 남아 있어.');
    try {
      await Craft.EffectJobs.reset();
      const description = ui('weapon-description').value;
      const weapon = live ? await Craft.analyzeDrawing({canvas:ui('drawing-canvas'),description,rarity:chosenRarity,onProgress:message=>{loading.update(message);scene.say(message,'그림과 기술을 준비하는 중이야. 새 게임으로 취소할 수 있어.');}}) : Craft.createWeapon({description,points});
      if (points && !weapon.artwork) weapon.artwork = ui('drawing-canvas').toDataURL('image/png');
      weapon.rarity=chosenRarity;if(live)loading.setWeapon(weapon);
      equippedWeapon=weapon;
      if(live&&weapon.moves.every(move=>move.motionPlan&&move.motionPlan.layers.every(layer=>layer.source==='drawing'||layer.glyph))){
        ui('effect-status').textContent='그림에 맞춘 기술과 동작 완성 · 바로 전투할 수 있어';ui('retry-effects').hidden=false;ui('retry-effects').textContent='이미지 연출 더 다듬기';
        if(localEffects)await startLocalDots(weapon);
      }else if(live){scene.say('기술이 완성됐어. 이제 그림에 맞는 전용 연출을 만들고 있어…','조금 더 기다려줘. 무기와 그림은 그대로 유지돼.');await makeEffects(weapon);}else{ui('effect-status').textContent='모의 제작 · 새 이미지 생성 없음';ui('retry-effects').hidden=true;}
      equippedWeapon=weapon;
      const battleUrl = Craft.weaponBattleUrl(weapon);currentBattleUrl=battleUrl;Craft.StorageCleanup?.activate(battleUrl);
      
      Craft.renderWeapon(ui('weapon-preview'), ui('weapon-result'), weapon);
      created = true;if(live)loading.playable(()=>birth.play(weapon));const saved=Craft.Library.lookup(weapon,battleUrl);ui('save-weapon').hidden=false;ui('save-weapon').disabled=!!saved;ui('save-weapon').textContent=saved?'진열장에 저장됨':'무기 저장'; scene.reveal();
      document.querySelectorAll('.battle-exit').forEach(link => { link.href = battleUrl; });
      if(!live)await birth.play(weapon);
      scene.say(Craft.Rarity.get(weapon.rarity).label+' 등급 '+weapon.name + ' 획득!\n이제 수호자에게 도전해 볼까?', '나가기를 선택하면 이 무기를 들고 전투를 시작해.');
      ui('footer-note').textContent = weapon.name + ' 장착 완료 · 나가기: 수호자에게 도전';
    } catch (error) {
      loading.fail(error,{canPlay:false});scene.say(error.name === 'TimeoutError' ? '분석 시간이 너무 오래 걸렸어. 다시 시도해 줘.' : error.message, '그림은 그대로야. 제작을 다시 선택하거나 모의 제작으로 바꿔도 돼.');
    } finally {
      busy = false;
      controls.forEach((control,index) => { control.disabled = previousDisabled[index]; });
      document.querySelector('.workshop').setAttribute('aria-busy', 'false');
      update();
    }
  });
  if (location.protocol !== 'file:') fetch('/api/status').then(response => response.json()).then(status => {
    localEffects=['local','chatkhu'].includes(status.effectsProvider);analysisProvider=status.provider;effectLocation=status.effectsProvider==='chatkhu'?'ChatKHU에서 생성':status.effectsProvider==='local'?'내 PC에서 생성':'외부에서 생성';
    if (status.configured) {
      ui('analysis-mode').options[1].textContent = analysisProvider+' 그림 분석 · 준비됨';
      let preferred; try { preferred=localStorage.getItem('draw-weapon:analysis-mode'); } catch {}
      if (!busy && !created && preferred !== 'mock') { ui('analysis-mode').value='live'; ui('analysis-mode').dispatchEvent(new Event('change')); }
    }
    else ui('analysis-mode').options[1].textContent = 'Gemini 그림 분석 · 키 필요';
  }).catch(() => {});
  update();
})();
