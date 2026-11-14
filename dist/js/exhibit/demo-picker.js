window.ExhibitDemoPicker = (() => {
  const formula = {id:'f-ma', name:'F=ma 법칙서', types:['normal','fighting']};

  async function formulaArtwork() {
    const response = await fetch('assets/presentation/f-ma-artwork.png');
    if (!response.ok) throw Error('예시 무기 그림을 불러오지 못했어.');
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.addEventListener('load', () => resolve(reader.result), {once:true});
      reader.addEventListener('error', () => reject(reader.error), {once:true});
      reader.readAsDataURL(blob);
    });
  }

  async function loadWeapon(id) {
    if (id === formula.id) {
      const [weapon, artwork] = await Promise.all([ExhibitPresentation.load(), formulaArtwork()]);
      return {...weapon, artwork};
    }
    const pack = await GameDemo.pack(id);
    const weapon = structuredClone(pack.weapon);
    weapon.rarity = Craft.Rarity.valid(weapon.rarity) ? weapon.rarity : 'legendary';
    if (pack.atlasId) weapon.effectAtlas = {id:pack.atlasId, ...(pack.layout ? {layout:pack.layout} : {})};
    return weapon;
  }

  function mount({boss, bossPreference, preserveDrawing}) {
    const entries = [...GameDemo.entries, formula];
    const dialog = document.createElement('dialog');
    dialog.className = 'exhibit-demo-picker';
    dialog.setAttribute('aria-labelledby', 'exhibit-demo-title');
    dialog.innerHTML = `
      <header><h2 id="exhibit-demo-title">예시 무기 선택</h2><form method="dialog"><button autofocus>닫기</button></form></header>
      <p>무기를 골라 3단계 보스에게 도전해 봐.</p>
      <p class="exhibit-demo-preserve" hidden>그림을 남겨 두고 예시 전투를 새 탭에서 열어.</p>
      <div class="exhibit-demo-options"></div>
      <p role="status" hidden></p>
    `;
    document.body.append(dialog);
    const options = dialog.querySelector('.exhibit-demo-options');
    const preserve = dialog.querySelector('.exhibit-demo-preserve');
    const status = dialog.querySelector('[role="status"]');
    let launching = false;

    async function launch(id, bossOverride) {
      if (launching) return;
      launching = true;
      options.inert = true;
      status.hidden = false;
      status.textContent = '예시 무기를 꺼내는 중이야…';
      try {
        const weapon = await loadWeapon(id);
        if (!dialog.open) return;
        if (!Craft.validArtwork(weapon.artwork)) throw Error('예시 무기 그림이 없어.');
        const bossId = ExhibitEncounter.valid(bossOverride) ? bossOverride : boss();
        Craft.Exhibit.save({weapon, boss:bossId, sample:true});
        location.assign(Craft.Exhibit.battleUrl);
      } catch {
        status.textContent = '예시 무기를 열지 못했어. 다시 골라 줘.';
      } finally {
        launching = false;
        options.inert = false;
      }
    }

    function open(selectedId, bossOverride) {
      const newTab = preserveDrawing();
      preserve.hidden = !newTab;
      options.replaceChildren(...entries.map(entry => {
        const choice = document.createElement(newTab ? 'a' : 'button');
        if (newTab) {
          const params = new URLSearchParams({example:'1', weapon:entry.id});
          const fixedBoss = bossPreference();
          if (ExhibitEncounter.valid(fixedBoss)) params.set('boss', fixedBoss);
          choice.href = Craft.Exhibit.workshopUrl + '&' + params;
          choice.target = '_blank';
          choice.rel = 'noopener';
        } else {
          choice.type = 'button';
          choice.addEventListener('click', () => launch(entry.id));
        }
        const name = document.createElement('strong');
        name.textContent = entry.name;
        const type = document.createElement('small');
        type.textContent = Craft.Types.summary(entry.types) + (entry.id === formula.id ? ' · 신화' : '');
        choice.append(name, type);
        return choice;
      }));
      status.hidden = true;
      if (!dialog.open) dialog.showModal();
      if (selectedId && entries.some(entry => entry.id === selectedId)) launch(selectedId, bossOverride);
    }
    window.addEventListener('pageshow', event => {
      if (!event.persisted) return;
      status.hidden = true;
      options.inert = false;
    });
    return {open, isOpen:() => dialog.open, onClose:listener => dialog.addEventListener('close', listener)};
  }

  return {mount};
})();
