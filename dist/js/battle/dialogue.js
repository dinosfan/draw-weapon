BattlePreview.renderDialogue = (target, message) => {
  target.replaceChildren();
  const label = document.createElement('span');
  label.className = 'dialogue-label'; label.textContent = 'BATTLE LOG';
  const text = document.createElement('p');
  text.className = 'dialogue-text'; text.textContent = message;
  target.append(label, text);
};
