window.ExhibitNotice = (() => {
  const seenKey = 'draw-weapon:exhibit:notice-seen';
  const blockedMessages = {
    EXHIBIT_LIMIT: '전시에 준비한 실시간 제작 횟수가 모두 끝났어요.',
    EXHIBIT_CREDITS: '실시간 제작에 사용할 AI 크레딧이 소진됐어요.',
    EXHIBIT_UNAVAILABLE: '지금은 실시간 제작을 열 수 없어요.',
    EXHIBIT_OFFLINE: '실시간 제작 서버에 연결할 수 없어요.',
  };

  function blockedMessage(code) {
    return blockedMessages[code] || '';
  }

  async function availability() {
    try {
      const response = await fetch('/api/exhibit/availability', {signal:AbortSignal.timeout(4500), cache:'no-store'});
      const info = await response.json();
      if (response.ok && info.available === true) return '';
      return blockedMessage(info.code || info.reason) || blockedMessages.EXHIBIT_OFFLINE;
    } catch { return blockedMessages.EXHIBIT_OFFLINE; }
  }

  function mount({enter, example, onAvailabilityChange}) {
    const dialog = document.createElement('dialog');
    dialog.className = 'exhibit-notice-dialog';
    dialog.setAttribute('aria-labelledby', 'exhibit-notice-title');
    dialog.innerHTML = `
      <h2 id="exhibit-notice-title">전시 체험 안내</h2>
      <p>그림 한 장으로 무기와 기술 4개를 만들고, 3단계 보스에게 도전해 보세요.</p>
      <ul>
        <li>더 많은 분이 체험할 수 있도록 <strong>실시간 제작은 한 사람당 한 번씩</strong> 부탁드려요.</li>
        <li>제작을 기다리는 동안 <strong>도감 · 안내</strong>에서 적과 무기를 구경할 수 있어요.</li>
        <li>실시간 제작이 닫혀도 <strong>예시 무기</strong>로 보스전에 도전할 수 있어요.</li>
      </ul>
      <p class="exhibit-notice-availability" role="status" hidden></p>
      <div class="exhibit-notice-actions">
        <button type="button" data-draw disabled>그리러 가기</button>
        <button type="button" data-example autofocus>예시 무기로 체험</button>
      </div>
      <p class="exhibit-notice-help">게임에 배경음악(BGM)이 있어요. 소리를 켜고 즐겨 보세요.</p>
      <button type="button" class="exhibit-notice-report" data-music>BGM 켜기</button>
      <details class="exhibit-notice-faq">
        <summary>자주 묻는 질문</summary>
        <dl>
          <dt>어떤 그림을 그리면 되나요?</dt>
          <dd>시계, 과일, 글씨처럼 알아볼 수 있는 모양을 자유롭게 그려 보세요.</dd>
          <dt>제작이 오래 걸리면요?</dt>
          <dd>도감에서 적과 무기를 구경하거나 예시 무기로 보스전을 먼저 해볼 수 있어요.</dd>
          <dt>실시간 제작이 닫혀 있으면요?</dt>
          <dd>예시 무기 8종 중 하나를 골라 바로 도전할 수 있어요.</dd>
          <dt>음악이 안 들리면요?</dt>
          <dd>위의 ‘BGM 켜기’를 누르고 기기 음량을 확인해 주세요. 게임 화면의 소리 버튼으로도 조절할 수 있어요.</dd>
        </dl>
      </details>
      <p class="exhibit-notice-help">화면이 멈췄다면 어느 화면에서 어떤 버튼을 눌렀는지 알려 주세요.</p>
      <button type="button" class="exhibit-notice-report" data-exhibit-feedback aria-haspopup="dialog">오류 제보</button>
    `;
    document.body.append(dialog);
    const draw = dialog.querySelector('[data-draw]');
    const sample = dialog.querySelector('[data-example]');
    const music = dialog.querySelector('[data-music]');
    const status = dialog.querySelector('[role="status"]');
    let lastCheck = 0;
    async function refresh() {
      const check = ++lastCheck;
      draw.disabled = true;
      onAvailabilityChange(null);
      const message = await availability();
      if (check !== lastCheck) return;
      draw.disabled = Boolean(message);
      status.hidden = !message;
      status.textContent = message ? message + ' 예시 무기 8종으로 보스전을 체험할 수 있어요.' : '';
      onAvailabilityChange(message);
    }
    function dismiss() {
      try { sessionStorage.setItem(seenKey, '1'); } catch {}
      dialog.close();
    }
    function show() {
      if (!dialog.open) dialog.showModal();
      refresh();
    }
    draw.addEventListener('click', () => { dismiss(); enter(); });
    sample.addEventListener('click', () => { dismiss(); example(); });
    music.addEventListener('click', () => {
      window.GameAudio?.setEnabled(true);
      if (window.GameAudio?.read().volume === 0) window.GameAudio.setVolume(.35);
      window.GameAudio?.unlock();
      music.textContent = 'BGM 켜짐';
    });
    dialog.addEventListener('cancel', dismiss);
    const reopen = document.createElement('button');
    reopen.type = 'button';
    reopen.className = 'exhibit-notice-reopen';
    reopen.textContent = '전시 안내';
    reopen.setAttribute('aria-haspopup', 'dialog');
    reopen.addEventListener('click', show);
    document.getElementById('preview-note').replaceWith(reopen);
    let seen = false;
    try { seen = sessionStorage.getItem(seenKey) === '1'; } catch {}
    if (!seen) show();
    else refresh();
    window.addEventListener('pageshow', event => { if (event.persisted) refresh(); });
  }
  return {availability, blockedMessage, mount};
})();
