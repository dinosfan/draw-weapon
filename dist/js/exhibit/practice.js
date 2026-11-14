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
        await Craft.EffectJobs.submit({weapon, image, requestId:record.effectRequestId});
        persist();
      }
      if (weapon.effectJob) await Craft.EffectJobs.watch(weapon);
      note.textContent = weapon.effectAtlas ? '전용 도트 완성 · 다음 기술부터 적용돼.' : '기본 연출로 기술을 쓸 수 있어.';
    } catch {
      const rows = weapon.effectAtlas?.readyRows?.length || 0;
      note.textContent = rows ? '전용 도트 ' + rows + '/4 완성 · 나머지 기술에는 기본 연출을 써.' :
        '전용 도트를 불러오지 못했어. 기본 연출로 기술을 쓸 수 있어.';
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
    again.textContent = '보스 다시 도전';
    again.addEventListener('click', retry);
    const draw = document.createElement('a');
    draw.href = Craft.Exhibit.workshopUrl;
    draw.textContent = '새 낙서 그리기';
    actions.append(again);
    if (BattlePreview.exhibit.sample) {
      const examples = document.createElement('a');
      examples.href = Craft.Exhibit.workshopUrl + '&example=1';
      examples.textContent = '다른 예시 무기';
      actions.append(examples);
    }
    actions.append(draw);
    panel.append(title, detail, actions);
    document.querySelector('.battle-console').after(panel);
    if (!Craft.Exhibit.presentation) {
      const report = document.createElement('button');
      report.type = 'button';
      report.textContent = '오류 제보';
      report.className = 'exhibit-battle-report';
      report.dataset.exhibitFeedback = '';
      report.setAttribute('aria-haspopup', 'dialog');
      panel.after(report);
    }

    return state => {
      const completed = state.ended;
      const justCompleted = completed && panel.hidden;
      panel.hidden = !completed;
      if (justCompleted) {
        title.textContent = state.enemyHp === 0 ? '3단계 보스 격파!' : '보스에게 패배했어';
        detail.textContent = state.enemyHp === 0 ? state.turn + '턴 만에 두 페이즈를 돌파했어.' : '같은 무기로 1페이즈부터 다시 도전할 수 있어.';
        title.focus();
        panel.scrollIntoView({block:'nearest'});
      }
    };
  };
})();
