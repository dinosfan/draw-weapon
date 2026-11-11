window.ExhibitMockBattle = {
  mount(ui, moves) {
    const enemy = ui('enemy');
    const actor = ui('player');
    const held = ui('held');
    const health = ui('hp');
    const commands = ui('commands');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const animator = BattleHP.create();
    const effects = ExhibitMockEffects.mount(ui('effect'));
    let active = false;
    GameScenery.paint(ui('world'), 'battle');
    TrainerStudy.draw(document.getElementById('player-sprite'));
    BattleEnemySprites.draw(enemy, { sprite:'jelly', name:'물방울 해파리', types:['water'] });
    GameStageLayout.attach(ui('stage'), enemy, enemy);

    function reset() {
      active = false;
      health.value = health.max;
      ui('log').textContent = '네 낙서로 써 볼 기술을 골라 봐.';
      ui('result').hidden = true;
      commands.hidden = false;
      for (const button of commands.children) button.disabled = false;
    }
    async function use(move, index) {
      if (active) return;
      active = true;
      for (const button of commands.children) button.disabled = true;
      ui('log').textContent = move.name + '!';
      let effect = Promise.resolve();
      if (!reduced.matches) {
        await actor.animate([{transform:'translateX(0)'},{transform:'translateX(22px)'},{transform:'translateX(0)'}], {duration:340}).finished;
        if (move.damage) enemy.animate([{opacity:1},{opacity:.35},{opacity:1}], {duration:240});
        effect = effects.play(index, move.damage ? enemy : actor);
      }
      await Promise.all([effect, animator.play(health, 100, 100 - move.damage, value => {
        health.value = Math.round(value);
      }, reduced.matches)]);
      ui('log').textContent = move.name + (move.damage ? ' · 상대에게 ' + move.damage + ' 피해!' : ' · 방어 자세를 잡았어!');
      commands.hidden = true;
      ui('result').hidden = false;
    }
    moves.forEach((move, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'exhibit-move';
      button.style.setProperty('--type-color', Craft.Types.color(move.type));
      const title = document.createElement('strong');
      title.textContent = move.name;
      const type = document.createElement('small');
      type.textContent = Craft.Types.label(move.type);
      button.append(title, type);
      button.addEventListener('click', () => use(move, index));
      commands.append(button);
    });
    ui('again').addEventListener('click', () => {
      reset();
      commands.firstElementChild.focus({preventScroll:true});
    });
    return {
      async start(artwork) {
        reset();
        if (await Craft.drawHeldArtwork(held, artwork)) Craft.attachToHand(held, {gripX:.45,gripY:.85});
      },
    };
  },
};
