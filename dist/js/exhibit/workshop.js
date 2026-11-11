(() => {
  const ui = id => document.getElementById('exhibit-' + id);
  const canvas = ui('canvas');
  const drawing = ui('drawing');
  const reveal = ui('reveal');
  const battle = ui('battle');
  const demo = {name:'빗방울 스톰 우산', types:['water'], reason:'둥근 우산 천은 빗물을 모으고, 뾰족한 끝은 찌르기에 쓰여.'};
  const demoMoves = [
    { name:'빗물 폭포 분사', type:'water', description:'빗물을 모아 한꺼번에 뿜어내.', damage:32 },
    { name:'우산 가드', type:'water', description:'펼친 우산으로 방어 자세를 잡아.', damage:0 },
    { name:'낙뢰 선단 찌르기', type:'normal', description:'우산 끝으로 빠르게 찔러.', damage:24 },
    { name:'회전 회오리 치기', type:'water', description:'우산을 돌려 물방울을 흩뿌려.', damage:18 },
  ];
  let strokes = 0, busy = false, result = null, waitingWeapon = null;
  const offline = Craft.Exhibit.offline;
  const ink = Craft.mountDrawing(canvas, count => {
    strokes = count;
    ui('placeholder').hidden = count > 0;
    controls();
  });
  ink.setWidth(6);
  GameScenery.paint(ui('workshop-art'), 'workshop');
  GameScenery.paint(ui('reveal-world'), 'workshop');
  TrainerStudy.draw(ui('trainer'));
  if (offline) {
    ui('mode').textContent = '전시 체험 목업';
    ui('privacy').hidden = true;
  } else ui('example').textContent = 'AI 연결 없이 예시로 체험';

  function controls() {
    for (const id of ['create', 'undo', 'clear']) ui(id).disabled = busy || !strokes;
    if (!offline) ui('example').textContent = busy ? '기다리는 동안 예시로 체험' : 'AI 연결 없이 예시로 체험';
    drawing.classList.toggle('exhibit-drawing-busy', busy);
    drawing.setAttribute('aria-busy', String(busy));
  }
  function say(id, text) {
    ui(id).textContent = text;
    ui(id).hidden = !text;
  }

  function show(section, focus) {
    for (const page of [drawing, reveal, battle]) page.hidden = page !== section;
    ui(focus).focus({preventScroll:true});
    window.scrollTo(0, 0);
  }
  function showWeapon(record) {
    result = record;
    const {weapon} = record;
    const art = ui('art');
    art.getContext('2d').clearRect(0, 0, art.width, art.height);
    Craft.drawHeldArtwork(art, weapon.artwork).catch(() => {});
    ui('name').textContent = weapon.name;
    ui('equipped-name').textContent = weapon.name;
    ui('result-source').textContent = record.sample ? '예시 결과' : 'ChatKHU';
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
  }

  function prepareEffects(record) {
    const status = text => {
      record.effectStatus = text;
      if (result === record) say('effect-status', text);
    };
    status('전용 도트 준비 중 · 지금 전투에 들어갈 수 있어.');
    record.resumeEffects = true;
    record.ticket = Craft.EffectJobs.submit({weapon:record.weapon, image:record.image}).then(id => {
      record.resumeEffects = false;
      return id;
    }, error => {
      record.resumeEffects = error.connectionOnly || ['TimeoutError', 'TypeError'].includes(error.name);
      status('전용 도트를 불러오지 못했어. 기술은 바로 쓸 수 있어.');
      return null;
    });
    record.ticket.then(async id => {
      if (id) await Craft.EffectJobs.watch(record.weapon);
      if (record.weapon.effectAtlas) status('전용 도트 완성!');
    }).catch(() => status('전용 도트가 늦어지고 있어. 기본 연출로 기술을 쓸 수 있어.'));
  }

  function sample(artwork) { showWeapon({sample:true, weapon:{...demo, artwork}}); }
  const encounter = ExhibitMockBattle.mount(ui, demoMoves);
  ui('undo').addEventListener('click', () => ink.undo());
  ui('clear').addEventListener('click', () => ink.clear());
  ui('example').addEventListener('click', () => {
    const example = document.createElement('canvas');
    example.width = canvas.width;
    example.height = canvas.height;
    Craft.mountDrawing(example, () => {}).replace([
      { width:6, points:[[102,195],[116,159],[149,128],[198,105],[256,97],[311,106],[361,130],[397,161],[412,195],[363,178],[309,191],[256,178],[204,191],[151,178],[102,195]] },
      { width:6, points:[[256,89],[256,272],[250,289],[236,296],[220,291],[213,276]] },
    ]);
    sample(example.toDataURL('image/png'));
  });
  ui('create').addEventListener('click', async () => {
    if (busy || !strokes) return;
    if (offline) { sample(canvas.toDataURL('image/png')); return; }
    busy = true;
    controls();
    say('analysis-status', '네 낙서에서 이름과 기술 4개를 만들고 있어…');
    try {
      const weapon = await Craft.analyzeDrawing({canvas, description:'', onProgress:text => say('analysis-status', text)});
      const record = {weapon, image:Craft.captureDrawing(canvas)};
      say('analysis-status', '');
      if (drawing.hidden) waitingWeapon = record;
      else showWeapon(record);
      prepareEffects(record);
    } catch (error) {
      if (error.name !== 'AbortError') say('analysis-status', 'AI 제작을 마치지 못했어. 그림은 그대로야. 다시 제작하거나 예시로 체험할 수 있어.');
    } finally {
      busy = false;
      controls();
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
    if (record.sample) {
      ui('new').textContent = !offline && strokes ? '내 낙서로 돌아가기' : '새 낙서 그리기';
      show(battle, 'battle-title');
      encounter.start(record.weapon.artwork);
      return;
    }
    ui('play').disabled = true;
    try {
      await Promise.race([record.ticket, new Promise(resolve => setTimeout(resolve, 650))]);
      Craft.Exhibit.save(record);
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
})();
