BattlePreview.mountCommands = (target, onAction) => {
  let selected = 0;
  const order=BattlePreview.presentationOrder,commands=order?BattlePreview.data.commands.slice().sort((a,b)=>order.indexOf(a.id)-order.indexOf(b.id)):BattlePreview.data.commands;
  const buttons = commands.map((command, index) => {
    const button = document.createElement('button');
    button.className = 'command'; button.dataset.action = command.id;
    button.innerHTML = `<span>${command.label}<small>${command.hint}</small></span>`;
    button.prepend(BattlePreview.icon(command.id));
    button.addEventListener('focus', () => select(index));
    button.addEventListener('click', () => { select(index); onAction(command.id); });
    target.append(button); return button;
  });
  function select(index) { selected = index; buttons.forEach((button, i) => button.classList.toggle('selected', i === index)); }
  target.addEventListener('keydown', event => {
    const offsets = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 2, ArrowUp: -2 };
    if (!(event.key in offsets)) return;
    event.preventDefault();
    let index = selected;
    for (let count = 0; count < 4; count++) { index = (index + offsets[event.key] + 4) % 4; if (!buttons[index].disabled) { buttons[index].focus(); break; } }
  });
  select(0);
  return state => {
    const itemCount=(state.potions||0)+Object.values(state.items||{}).reduce((sum,n)=>sum+n,0);
    buttons.forEach(button => { button.disabled = state.ended||(button.dataset.action==='bag'&&!itemCount);if(button.dataset.action==='bag')button.title=itemCount?'':'가방의 아이템을 모두 사용했어.'; });
    buttons.find(button=>button.dataset.action==='skill').querySelector('small').textContent = '기술 4개 · 능력 확인';
    buttons.find(button=>button.dataset.action==='bag').querySelector('small').textContent = `아이템 · ${itemCount}개`;
  };
};
