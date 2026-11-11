(() => {
  if (!BattlePreview.exhibit) return;
  BattlePreview.watchExhibitEffects = async record => {
    const {weapon, image} = record;
    if (!weapon.effectJob && !record.resumeEffects) return;
    const note = document.createElement('p');
    note.className = 'exhibit-live-effect-note';
    note.setAttribute('role', 'status');
    note.textContent = '전용 도트 준비 중 · 기술은 바로 쓸 수 있어.';
    document.querySelector('.game-shell').after(note);
    function persist() {
      try { Craft.Exhibit.save(record); } catch {}
    }
    try {
      if (!weapon.effectJob && record.resumeEffects) {
        record.resumeEffects = false;
        await Craft.EffectJobs.submit({weapon, image});
        persist();
      }
      if (weapon.effectJob) await Craft.EffectJobs.watch(weapon);
      note.textContent = weapon.effectAtlas ? '전용 도트 완성 · 다음 기술부터 적용돼.' : '기본 연출로 기술을 쓸 수 있어.';
    } catch {
      note.textContent = '전용 도트를 불러오지 못했어. 기본 연출로 기술을 쓸 수 있어.';
    } finally {
      persist();
    }
  };
  BattlePreview.mountExhibitResult = retry => {
    const main = document.querySelector('main');
    main.classList.add('exhibit-live-battle');
    const panel = document.createElement('section');
    panel.className = 'exhibit-practice-result';
    panel.hidden = true;
    const title = document.createElement('h2');
    title.tabIndex = -1;
    const detail = document.createElement('p');
    const actions = document.createElement('div');
    const again = document.createElement('button');
    again.type = 'button';
    again.textContent = '다른 기술 써보기';
    again.addEventListener('click', retry);
    const draw = document.createElement('a');
    draw.href = 'exhibit.html';
    draw.textContent = '새 낙서 그리기';
    const full = document.createElement('a');
    full.href = 'start.html';
    full.textContent = '본편 열기';
    actions.append(again, draw, full);
    panel.append(title, detail, actions);
    document.querySelector('.battle-console').after(panel);

    return state => {
      const completed = state.turn > 0;
      const justCompleted = completed && panel.hidden;
      panel.hidden = !completed;
      if (justCompleted) {
        title.textContent = '네 낙서로 기술을 썼어!';
        const damage = state.feedback?.hit || 0;
        detail.textContent = damage ? '상대에게 ' + damage + ' 피해를 입혔어.' :
          state.feedback?.miss ? '기술이 빗나갔어. 다시 써볼 수 있어.' : '다른 기술도 시험해 볼 수 있어.';
        title.focus();
        panel.scrollIntoView({block:'nearest'});
      }
    };
  };
})();
