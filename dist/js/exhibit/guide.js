window.ExhibitGuide = {
  mount(onClose) {
    const dialog = document.getElementById('exhibit-guide');
    const status = document.getElementById('exhibit-guide-status');
    const content = document.getElementById('exhibit-guide-content');
    const sections = [...dialog.querySelectorAll('[data-guide-section]')];
    const {Types, Conditions, Journey, Rarity} = Craft;
    const built = new Map();

    function element(tag, text, className) {
      const node = document.createElement(tag);
      if (text) node.textContent = text;
      if (className) node.className = className;
      return node;
    }

    function enemyForm(enemy) {
      const figure = element('figure', '', 'guide-enemy-form');
      const sprite = document.createElement('canvas');
      sprite.width = sprite.height = 32;
      BattleEnemySprites.draw(sprite, enemy);
      sprite.setAttribute('aria-hidden', 'true');
      const caption = element('figcaption');
      if (enemy.boss) caption.append(element('small', enemy.phase === 1 ? '2페이즈' : '1페이즈'));
      caption.append(element('strong', enemy.name));
      const types = element('div');
      types.innerHTML = Types.badges(enemy.types);
      caption.append(types, element('small', 'HP ' + enemy.maxHp));
      figure.append(sprite, caption);
      return figure;
    }

    function enemies() {
      const panel = element('div');
      const filters = element('div', '', 'guide-options');
      const list = element('div', '', 'guide-enemies');
      const location = element('h3');
      const stages = [0, 1, 2].map(Journey.encountersForStage);
      const buttons = stages.map((_, stage) => {
        const button = element('button', (stage + 1) + '구역');
        button.type = 'button';
        button.addEventListener('click', () => selectStage(stage));
        filters.append(button);
        return button;
      });
      function selectStage(stage) {
        buttons.forEach((button, index) => button.setAttribute('aria-pressed', String(index === stage)));
        const entries = stages[stage];
        location.textContent = entries[0].location + ' · ' + entries.length + '종';
        list.replaceChildren(...entries.map(enemy => {
          const card = element('article', '', 'guide-enemy');
          card.append(enemyForm(enemy));
          if (enemy.boss) card.append(enemyForm(BattleBosses.encounter(enemy, {bossPhase: 1})));
          return card;
        }));
      }
      panel.append(filters, location, list);
      selectStage(0);
      return panel;
    }

    function rules() {
      const panel = element('div');
      const label = element('label', '공격 기술 타입 ', 'guide-type-label');
      const select = element('select');
      for (const [id, name] of Object.entries(Types.labels)) {
        const option = element('option', name);
        option.value = id;
        select.append(option);
      }
      select.value = 'water';
      label.append(select);
      const matchups = element('dl', '', 'guide-facts');
      const update = () => {
        const type = select.value;
        const rows = [
          ['유리 ×1.5', Types.strong[type]],
          ['불리 ×0.75', Types.weak[type]],
          ['무효 ×0', Types.immune[type] || []],
        ];
        matchups.replaceChildren(...rows.flatMap(([name, targets]) => {
          const row = element('dd');
          row.innerHTML = targets.length ? Types.badges(targets) : '해당 타입 없음';
          return [element('dt', name), row];
        }));
      };
      select.addEventListener('change', update);
      update();
      const conditions = element('dl', '', 'guide-facts');
      for (const condition of Object.values(Conditions.definitions)) {
        const term = element('dt', condition.label);
        conditions.append(term, element('dd', condition.description));
      }
      panel.append(element('h3', '타입 상성'), label, matchups,
        element('p', '복합 타입은 유리와 불리가 상쇄돼. 무효가 있으면 피해는 0이야.'),
        element('h3', '상태 이상'), conditions);
      return panel;
    }

    function rarity() {
      const panel = element('div');
      const list = element('ul', '', 'guide-rarity');
      for (const [id, tier] of Object.entries(Rarity.tiers)) {
        const card = element('li');
        const badge = element('strong', tier.label);
        badge.style.setProperty('--guide-tier', GamePalette.tokens[tier.color]);
        badge.style.setProperty('--guide-tier-ink', GamePalette.tokens[tier.color === 'ghost' ? 'surface' : 'ink']);
        card.append(badge, element('strong', tier.chance + '%'), element('small', Rarity.summary(id)));
        list.append(card);
      }
      panel.append(element('p', '랜덤 제작에서는 등급을 추첨해. 등급에 따라 성능과 탄생 연출이 달라져.'), list);
      return panel;
    }

    function adventure() {
      const panel = element('div', '', 'guide-adventure');
      panel.append(element('h3', '낙서로 무기 만들기'),
        element('p', '실시간 제작에서는 ChatKHU가 그림을 보고 이름, 타입, 기술 4개와 기술 도트를 만들어.'),
        element('h3', '기술과 도트'),
        element('p', '기술은 위력, 명중률, 남은 사용 횟수(PP)와 타입을 보고 골라. 도트가 준비 중이어도 기술을 쓸 수 있어.'));
      const sheet = element('img', '', 'guide-atlas');
      sheet.src = 'assets/demo/umbrella-exhibit.png';
      sheet.alt = '빗방울 스톰 우산의 기술 4개와 각 기술의 4프레임 도트';
      panel.append(sheet, element('h3', '전시 보스전'),
        element('p', '만든 무기로 3단계 보스에 바로 도전해. 두 페이즈를 모두 쓰러뜨리면 승리야.'),
        element('h3', '본편 모험'),
        element('p', '본편에서는 1분 재료 줍기로 보급품을 얻고, 전투 중 가방에서 체력 회복, PP 충전, 상태 해제에 써.'),
        element('p', '세 구역을 탐험하고, 승리 후에는 원래 무기의 형태를 바탕으로 진화 방향을 골라. 마지막 수호자는 두 페이즈로 싸워.'));
      const evolution = element('div', '', 'guide-evolution');
      for (const [id, name] of [['original', '초심의 낙서 검'], ['vanguard', '철갑의 선봉검'], ['phantom', '유령의 잔상검']]) {
        const figure = element('figure');
        const art = element('img');
        art.src = 'assets/studies/evolution/' + id + '.png';
        art.alt = '';
        figure.append(art, element('figcaption', name));
        evolution.append(figure);
      }
      panel.append(evolution);
      return panel;
    }

    const views = {enemies, weapons: () => ExhibitWeaponCodex.mount(), rules, rarity, adventure};
    let selection = 0;
    async function select(section) {
      const token = ++selection;
      sections.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.guideSection === section)));
      if (!built.has(section) && ['enemies', 'weapons'].includes(section)) {
        const loading = element('p', '도감 자료를 불러오는 중…');
        loading.setAttribute('role', 'status');
        content.replaceChildren(loading);
        try { await ExhibitResources.load(section); }
        catch {
          if (token === selection) content.replaceChildren(element('p', '도감 자료를 불러오지 못했어. 메뉴를 다시 눌러 줘.'));
          return;
        }
      }
      if (token !== selection) return;
      if (!built.has(section)) built.set(section, views[section]());
      content.replaceChildren(built.get(section));
      content.scrollTop = 0;
    }
    sections.forEach(button => button.addEventListener('click', () => select(button.dataset.guideSection)));
    document.getElementById('exhibit-guide-open').addEventListener('click', () => {
      dialog.showModal();
      if (!selection) select('enemies');
    });
    dialog.addEventListener('close', onClose);
    return {
      isOpen: () => dialog.open,
      setStatus(message) {
        if (status.textContent === message) return;
        status.textContent = message;
        status.hidden = !message;
      },
    };
  },
};
