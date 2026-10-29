// Scene presentation stays separate from drawing input and weapon generation.
Craft.mountScene = ui => {
  const menu = ui('example-menu');
  function examples(open) {
    menu.hidden = !open;
    ui('examples-command').setAttribute('aria-expanded', String(open));
    if (open) menu.querySelector('button').focus();
  }
  function mode(revealed) {
    ui('drawing-view').hidden = revealed;
    ui('reveal-view').hidden = !revealed;
    ui('reveal-view').classList.toggle('appear', revealed);
    ui('scene-phase').textContent = revealed ? '무기 획득!' : '무기 없는 모험가';
    ui('desk-caption').textContent = revealed ? '낙서에 힘이 깃들었다' : '당신의 첫 번째 무기';
    ui('draw-command').classList.toggle('selected', !revealed);
    ui('create-weapon').classList.toggle('selected', revealed);
    examples(false);
  }
  return {
    examples,
    draw() { mode(false); },
    reveal() { mode(true); ui('reveal-view').focus({ preventScroll: true }); },
    say(message, hint) { ui('drawing-status').textContent = message; ui('dialogue-hint').textContent = hint; }
  };
};
