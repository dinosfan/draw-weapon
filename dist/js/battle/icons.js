// All interface icons come from the Tossface emoji font.
BattlePreview.icons = { attack: '⚔️', skill: '🌸', guard: '🛡️', bag: '🎒', reset: '🔄' };
BattlePreview.icon = name => {
  const element = document.createElement('span');
  element.className = 'tossface';
  element.setAttribute('aria-hidden', 'true');
  element.textContent = BattlePreview.icons[name];
  return element;
};
