(() => {
  let dialog, form, comment, send, status;
  let screen;

  function currentScreen() {
    const page = location.pathname.split('/').pop();
    if (page === 'start.html') return 'start';
    if (page === 'battle.html' || document.querySelector('#exhibit-battle:not([hidden])')) return 'battle';
    return document.querySelector('#exhibit-reveal:not([hidden])') ? 'reveal' : 'workshop';
  }

  function mount() {
    dialog = document.createElement('dialog');
    dialog.className = 'exhibit-feedback';
    dialog.setAttribute('aria-labelledby', 'exhibit-feedback-title');
    dialog.innerHTML = `
      <header>
        <h2 id="exhibit-feedback-title">오류 제보</h2>
        <button type="button" data-close>닫기</button>
      </header>
      <form>
        <label for="exhibit-feedback-comment">어떤 문제가 있었나요?</label>
        <p id="exhibit-feedback-help">멈춘 화면과 직전에 누른 버튼을 알려 주세요. 이름이나 연락처는 필요 없어요.</p>
        <textarea id="exhibit-feedback-comment" aria-describedby="exhibit-feedback-help" required maxlength="800" rows="4" placeholder="예를 들어 무기로 만들기를 눌렀는데 계속 준비 중이었어요."></textarea>
        <button type="submit">제보 보내기</button>
        <p role="status"></p>
      </form>`;
    document.body.append(dialog);
    form = dialog.querySelector('form');
    comment = dialog.querySelector('textarea');
    send = form.querySelector('button');
    status = form.querySelector('[role="status"]');
    dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
    form.addEventListener('submit', submit);
  }

  async function submit(event) {
    event.preventDefault();
    if (send.disabled) return;
    const text = comment.value.trim();
    if (!text) {
      status.textContent = '제보 내용을 적어 주세요.';
      comment.focus();
      return;
    }

    send.disabled = true;
    comment.readOnly = true;
    status.textContent = '제보를 보내고 있어요…';
    try {
      const response = await fetch('/api/exhibit/issues', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({screen, comment:text}),
        signal:AbortSignal.timeout(12_000),
      });
      const data = await response.json();
      if (!response.ok || !data.saved) {
        status.textContent = data.error || '제보를 보내지 못했어요. 잠시 후 다시 시도해 주세요.';
        return;
      }
      form.reset();
      status.textContent = '제보를 받았어요. 알려 주셔서 고마워요!';
    } catch {
      status.textContent = '제보를 보내지 못했어요. 잠시 후 다시 시도해 주세요.';
    } finally {
      send.disabled = false;
      comment.readOnly = false;
    }
  }

  function open() {
    if (!dialog) mount();
    if (dialog.open) return;
    screen = currentScreen();
    if (!send.disabled) status.textContent = '';
    dialog.showModal();
  }

  document.addEventListener('click', event => {
    if (event.target.closest?.('[data-exhibit-feedback]')) open();
  });
  window.ExhibitFeedback = {open};
})();
