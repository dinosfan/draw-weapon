(() => {
  const params = new URLSearchParams(location.search);
  const exhibit = params.get('mode') === 'exhibit';
  const presentation = exhibit && params.get('presentation') === 'f-ma';
  const poster = exhibit && !presentation && location.protocol !== 'file:';
  const workshop = exhibit ? 'exhibit.html?screen=workshop' + (presentation ? '&presentation=f-ma' : '') : 'craft.html';
  const scene = document.querySelector('.title-scene');
  const dots = scene.querySelector('.field-dots');
  const field = document.getElementById('weapon-field');
  const start = document.getElementById('start-preview');
  const titleContent = [...scene.children];

  if (exhibit) {
    document.title += ' · 전시 체험';
    document.querySelector('.console-header nav').hidden = true;
    document.getElementById('preview-note').textContent = '전시 체험';
  }

  const prefetch = document.createElement('link');
  prefetch.rel = 'prefetch';
  prefetch.href = workshop;
  document.head.append(prefetch);

  for (let i = 0; i < 80; i++) {
    const dot = document.createElement('i');
    dot.style.left = ((i * 37 + 11) % 100) + '%';
    dot.style.top = ((i * 53 + 7) % 100) + '%';
    dots.append(dot);
  }

  for (const [index, item] of TitleSprites.items.entries()) {
    const button = document.createElement('button');
    const canvas = document.createElement('canvas');
    const label = document.createElement('span');
    button.type = 'button';
    button.className = 'floating-weapon';
    button.setAttribute('aria-label', item.name);
    if (item.y >= 85) button.dataset.labelSide = 'above';
    const placement = {
      x: item.x + '%', y: item.y + '%',
      'mobile-x': item.mx + '%', 'mobile-y': item.my + '%',
      size: item.size + 'px', angle: item.angle + 'deg',
      speed: (3 + index * .23) + 's', delay: (-index * .7) + 's',
    };
    for (const [key, value] of Object.entries(placement)) button.style.setProperty('--' + key, value);
    canvas.setAttribute('aria-hidden', 'true');
    TitleSprites.draw(canvas, item.id);
    label.className = 'weapon-label';
    label.textContent = item.name;
    button.append(canvas, label);
    button.addEventListener('click', () => {
      button.classList.remove('popped');
      void button.offsetWidth;
      button.classList.add('popped');
    });
    field.append(button);
  }

  let destination = workshop;
  let posterStatus = poster ? null : '';
  const entry = WorkshopEntry.mount(scene, {onComplete: () => location.assign(destination)});
  function enter({example = false} = {}) {
    if (start.disabled) return;
    if (!example && posterStatus === null) return;
    if (posterStatus) example = true;
    destination = example ? workshop + '&example=1' : workshop;
    start.disabled = true;
    start.setAttribute('aria-busy', 'true');
    titleContent.forEach(node => { node.inert = true; });
    entry.play();
  }

  start.addEventListener('click', () => enter());
  if (poster) {
    const label = start.firstElementChild;
    ExhibitNotice.mount({enter, example:() => enter({example:true}), onAvailabilityChange(message) {
      posterStatus = message;
      label.textContent = message === null ? '제작 연결 확인 중…' : message ? '예시 무기로 체험' : '그리러 가기';
    }});
  }
  document.addEventListener('keydown', event => {
    if (event.key === 'Enter' && event.target === document.body) {
      event.preventDefault();
      enter();
    }
  });
  window.addEventListener('pageshow', event => {
    if (!event.persisted || !start.disabled) return;
    entry.reset();
    start.disabled = false;
    start.removeAttribute('aria-busy');
    titleContent.forEach(node => { node.inert = false; });
    window.GameAudio?.scene('title');
    start.focus({preventScroll: true});
  });
})();
