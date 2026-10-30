// All interface icons use locally bundled Microsoft Fluent Emoji Flat SVGs.
BattlePreview.icons = { attack: '⚔️', skill: '🌸', guard: '🛡️', bag: '🎒', reset: '🔄' };
BattlePreview.icon = name => {
  const element = document.createElement('span');
  element.className = 'fluent-emoji';
  element.setAttribute('aria-hidden', 'true');
  element.textContent = BattlePreview.icons[name];
  return element;
};
