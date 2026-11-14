(() => {
  const ui = id => document.getElementById('exhibit-' + id);
  const canvas = ui('canvas');
  const drawing = ui('drawing');
  const reveal = ui('reveal');
  const battle = ui('battle');
  const demo = {name:'빗방울 스톰 우산', rarity:'legendary', types:['water'], reason:'둥근 우산 천은 빗물을 모으고, 뾰족한 끝은 찌르기에 쓰여.'};
  const demoMoves = [
    { name:'빗물 폭포 분사', type:'water', description:'빗물을 모아 한꺼번에 뿜어내.', damage:32 },
    { name:'우산 가드', type:'water', description:'펼친 우산으로 이번 공격을 막아.', damage:0, guard:true },
    { name:'낙뢰 선단 찌르기', type:'normal', description:'우산 끝으로 빠르게 찔러.', damage:24 },
    { name:'회전 회오리 치기', type:'water', description:'우산을 돌려 방어를 올려.', damage:0, defense:true },
  ];
  let strokes = 0, busy = false, result = null, waitingWeapon = null, encounter, revealPainted = false, blocked = '';
  const {offline, presentation} = Craft.Exhibit;
  const poster = !offline && !presentation;
  let checkingAvailability = poster;
  const birth = Craft.mountRarityReveal();
  const settings = ExhibitSettings.mount(ui, {fixedRarity:presentation ? 'mythic' : undefined, randomBoss:poster});
  let demoPicker;
  async function openDemoPicker(selectedId, bossOverride) {
    try {
      await ExhibitResources.load('demos');
      if (!demoPicker) {
        demoPicker = ExhibitDemoPicker.mount({boss:settings.boss, bossPreference:settings.bossPreference, preserveDrawing:() => busy || strokes > 0});
        demoPicker.onClose(() => {
          if (waitingWeapon && !guide.isOpen() && !drawing.hidden) returnToDrawing();
        });
      }
      demoPicker.open(selectedId, bossOverride);
    } catch {
      say('analysis-status', '예시 무기 목록을 불러오지 못했어. 다시 눌러 줘.');
    }
  }
  const guide = ExhibitGuide.mount(() => {
    if (!guide.isOpen() && waitingWeapon && !drawing.hidden) returnToDrawing();
  });
  const ink = Craft.mountDrawing(canvas, count => {
    if (strokes === count) return;
    strokes = count;
    ui('placeholder').hidden = count > 0;
    controls();
  }, {batch:true});
  ink.setWidth(6);
  GameScenery.paint(ui('workshop-art'), 'workshop');
  TrainerStudy.draw(ui('trainer'));
  if (offline) {
    ui('mode').textContent = '전시 체험 목업';
    ui('privacy').textContent = '그림 제작은 온라인에서 할 수 있어. 이 파일에서는 예시 무기로 체험할 수 있어.';
  } else if (presentation) ExhibitPresentation.load().catch(() => {});
  if (poster) {
    ui('footer-actions').hidden = false;
    ExhibitNotice.availability().then(message => {
      checkingAvailability = false;
      if (message) blockCreation(message);
      else controls();
    });
  }

  for (const tier of Object.values(Craft.Rarity.tiers)) {
    const label = document.createElement('th');
    label.scope = 'col';
    label.textContent = tier.label;
    const chance = document.createElement('td');
    chance.textContent = tier.chance + '%';
    ui('odds-labels').append(label);
    ui('odds-values').append(chance);
  }

  function controls() {
    ui('create').disabled = offline || checkingAvailability || busy || !strokes || Boolean(blocked);
    for (const id of ['undo', 'clear']) ui(id).disabled = busy || !strokes;
    ui('settings-trigger').disabled = busy;
    const example = ui('example');
    example.disabled = presentation && (busy || strokes > 0);
    if (!offline) example.textContent = busy && !presentation ? '기다리는 동안 예시 무기로 도전' : '예시 무기로 보스 체험';
    drawing.classList.toggle('exhibit-drawing-busy', busy);
    drawing.setAttribute('aria-busy', String(busy));
  }
  function say(id, text) {
    ui(id).textContent = text;
    ui(id).hidden = !text;
    syncGuideStatus();
  }

  function blockCreation(message) {
    blocked = message;
    ui('privacy').textContent = message + ' 예시 무기로 보스전에 도전해 보세요.';
    controls();
  }

  function syncGuideStatus() {
    const message = waitingWeapon ? '무기 제작 완료! 열어 둔 창을 닫고 내 무기를 확인해 봐.' :
      drawing.hidden && !busy ? result?.effectStatus : ui('analysis-status').textContent;
    guide.setStatus(message || '');
  }

  function show(section, focus) {
    for (const page of [drawing, reveal, battle]) page.hidden = page !== section;
    syncGuideStatus();
    ui(focus).focus({preventScroll:true});
    window.scrollTo(0, 0);
  }
  function showWeapon(record) {
    result = record;
    if (!revealPainted) {
      GameScenery.paint(ui('reveal-world'), 'workshop');
      revealPainted = true;
    }
    const {weapon} = record;
    const art = ui('art');
    art.getContext('2d').clearRect(0, 0, art.width, art.height);
    Craft.drawHeldArtwork(art, weapon.artwork).catch(() => {});
    ui('name').textContent = weapon.name;
    ui('equipped-name').textContent = weapon.name;
    ui('result-source').textContent = record.sample ? '예시 결과' : 'ChatKHU';
    const tier = Craft.Rarity.get(weapon.rarity);
    const badge = ui('rarity');
    badge.hidden = false;
    reveal.style.setProperty('--exhibit-rarity', GamePalette.tokens[tier.color]);
    badge.style.setProperty('--exhibit-rarity-ink', GamePalette.tokens[tier.color === 'ghost' ? 'surface' : 'ink']);
    badge.textContent = tier.label + ' 등급';
    ui('types').textContent = Craft.Types.summary(weapon.types);
    ui('types').style.setProperty('--type-color', Craft.Types.color(weapon.types[0]));
    ui('types').style.setProperty('--type-ink', Craft.Types.ink(weapon.types[0]));
    ui('reason').textContent = weapon.reason;
    ui('moves').replaceChildren(...(record.sample ? demoMoves : Craft.Moves.forWeapon(weapon)).map(move => {
      const item = document.createElement('li');
      item.style.setProperty('--type-color', Craft.Types.color(move.element || move.type));
      const title = document.createElement('strong');
      title.textContent = move.name;
      const description = document.createElement('p');
      description.textContent = move.description;
      item.append(title, description);
      return item;
    }));
    ui('edit').textContent = record.sample && !offline ? '내 낙서로 돌아가기' : '낙서 수정하기';
    say('effect-status', record.effectStatus || '');
    show(reveal, 'name');
    if (!record.sample && !document.querySelector('link[data-exhibit-battle]')) {
      const hint = document.createElement('link');
      hint.rel = 'prefetch';
      hint.href = Craft.Exhibit.battleUrl;
      hint.dataset.exhibitBattle = '';
      document.head.append(hint);
    }
    birth.play(weapon, {showBonus: !record.sample}).catch(error => console.error(error));
  }

  function publish(record) {
    if (drawing.hidden || guide.isOpen() || demoPicker?.isOpen()) {
      waitingWeapon = record;
      syncGuideStatus();
    } else showWeapon(record);
  }

  function prepareEffects(record) {
    const status = text => {
      record.effectStatus = text;
      if (result === record) say('effect-status', text);
    };
    status('전용 도트 준비 중 · 지금 전투에 들어갈 수 있어.');
    if (presentation) {
      ExhibitPresentation.loadAtlas().then(
        () => status('전용 도트 완성!'),
        () => status('전용 도트를 불러오지 못했어. 기술은 바로 쓸 수 있어.'),
      );
      return;
    }
    record.resumeEffects = true;
    const ticket = ExhibitResources.load('effects').then(() =>
      Craft.EffectJobs.submit({weapon:record.weapon, image:record.image, requestId:record.effectRequestId})
    ).then(id => {
      record.resumeEffects = false;
      return id;
    }, error => {
      record.resumeEffects = error.connectionOnly || ['TimeoutError', 'TypeError'].includes(error.name);
      status('전용 도트를 불러오지 못했어. 기술은 바로 쓸 수 있어.');
      return null;
    });
    ticket.then(async id => {
      if (id) await Craft.EffectJobs.watch(record.weapon);
      if (record.weapon.effectAtlas) status('전용 도트 완성!');
    }).catch(() => {
      const rows = record.weapon.effectAtlas?.readyRows?.length;
      status(rows ? rows + '/4 기술 도트 완성 · 나머지는 기본 연출로 쓸 수 있어.' : '기본 연출로 모든 기술을 쓸 수 있어.');
    });
  }

  async function prepareSample() {
    await ExhibitResources.load('enemies', 'sample');
    return encounter ??= ExhibitMockBattle.mount(ui, demoMoves);
  }
  function sampleArtwork() {
    const example = document.createElement('canvas');
    example.width = canvas.width;
    example.height = canvas.height;
    Craft.mountDrawing(example, () => {}).replace([
      { width:6, points:[[102,195],[116,159],[149,128],[198,105],[256,97],[311,106],[361,130],[397,161],[412,195],[363,178],[309,191],[256,178],[204,191],[151,178],[102,195]] },
      { width:6, points:[[256,89],[256,272],[250,289],[236,296],[220,291],[213,276]] },
    ]);
    return example.toDataURL('image/png');
  }
  function startSampleBattle(ready, artwork) {
    ui('equipped-name').textContent = demo.name;
    ui('new').textContent = !offline && strokes ? '내 낙서로 돌아가기' : '새 낙서 그리기';
    show(battle, 'battle-title');
    ready.start(artwork, settings.boss());
  }
  ui('undo').addEventListener('click', () => ink.undo());
  ui('clear').addEventListener('click', () => ink.clear());
  ui('example').addEventListener('click', () => {
    if (ui('example').disabled) return;
    if (poster) { openDemoPicker(); return; }
    prepareSample().catch(() => {});
    showWeapon({sample:true, weapon:{...demo, artwork:sampleArtwork()}});
  });
  async function makeWeapon() {
    if (presentation) {
      const artwork = canvas.toDataURL('image/png');
      const [saved] = await Promise.all([ExhibitPresentation.load(), new Promise(resolve => setTimeout(resolve, 15_000))]);
      return {weapon:{...saved, artwork}};
    }
    ExhibitResources.load('effects').catch(() => {});
    const weapon = await Craft.analyzeDrawing({canvas, description:'', rarity:settings.rarity(), preferJobs:true, onProgress:text => say('analysis-status', text)});
    if (!Craft.Rarity.valid(weapon.rarity)) weapon.rarity = Craft.Rarity.roll();
    return {weapon, image:Craft.captureDrawing(canvas), effectRequestId:weapon.exhibitAnalysisId};
  }
  ui('create').addEventListener('click', async () => {
    if (ui('create').disabled) return;
    busy = true;
    controls();
    try {
      say('analysis-status', '네 무기와 기술 4개를 준비하고 있어…');
      const record = await makeWeapon();
      say('analysis-status', '');
      prepareEffects(record);
      publish(record);
    } catch (error) {
      if (error.name !== 'AbortError') {
        const message = poster ? ExhibitNotice.blockedMessage(error.code) : '';
        if (message) blockCreation(message);
        say('analysis-status', message ? '그림은 이 화면에 남아 있어요.' : '무기 제작을 마치지 못했어. 그림은 그대로야. 다시 제작하거나 예시로 체험할 수 있어.');
      }
    } finally {
      busy = false;
      controls();
      syncGuideStatus();
    }
  });
  function returnToDrawing() {
    if (waitingWeapon) {
      const ready = waitingWeapon;
      waitingWeapon = null;
      showWeapon(ready);
    } else show(drawing, 'draw-title');
  }
  ui('edit').addEventListener('click', returnToDrawing);
  ui('play').addEventListener('click', async () => {
    const record = result;
    if (!record || ui('play').disabled) return;
    ui('play').disabled = true;
    if (record.sample) {
      try {
        if (!encounter) say('effect-status', '예시 전투를 준비 중이야…');
        const ready = await prepareSample();
        if (result !== record || reveal.hidden) return;
        say('effect-status', '');
        startSampleBattle(ready, record.weapon.artwork);
      } catch { if (result === record) say('effect-status', '예시 전투를 불러오지 못했어. 다시 눌러 줘.'); }
      finally { ui('play').disabled = false; }
      return;
    }
    try {
      Craft.Exhibit.save({...record, boss:settings.boss()});
      location.assign(Craft.Exhibit.battleUrl);
    } catch {
      say('effect-status', '브라우저에서 전투로 그림을 넘기지 못했어. 기본 브라우저에서 이 주소를 열어 줘.');
      ui('play').disabled = false;
    }
  });
  ui('new').addEventListener('click', () => {
    if (!offline && strokes) { returnToDrawing(); return; }
    ink.clear();
    show(drawing, 'draw-title');
  });
  window.addEventListener('pagehide', () => Craft.cancelAnalysis());
  window.addEventListener('pageshow', event => { if (event.persisted) ui('play').disabled = false; });
  const url = new URL(location.href);
  if (poster && url.searchParams.get('example') === '1') {
    const selectedId = url.searchParams.get('weapon');
    const bossOverride = url.searchParams.get('boss');
    url.searchParams.delete('example');
    url.searchParams.delete('weapon');
    url.searchParams.delete('boss');
    history.replaceState(null, '', url);
    openDemoPicker(selectedId, bossOverride);
  }
})();
