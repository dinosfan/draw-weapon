window.ExhibitMockBattle = {
  mount(ui, moves) {
    const enemy = ui('enemy');
    const actor = ui('player');
    const held = ui('held');
    const health = ui('hp');
    const playerHealth = ui('player-hp');
    const commands = ui('commands');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const animator = BattleHP.create();
    const effects = ExhibitMockEffects.mount(ui('effect'));
    const layout = GameStageLayout.attach(ui('stage'), enemy, enemy);
    const say = text => { ui('log').textContent = text; };
    let active, phase, turn, defense, boss, enemyForm;

    TrainerStudy.draw(document.getElementById('player-sprite'));

    function setPhase(index) {
      phase = index;
      turn = 0;
      enemyForm = BattleBosses.encounter(boss, { bossPhase: phase });
      ui('boss-name').textContent = enemyForm.name;
      ui('phase').textContent = (phase + 1) + '페이즈 / 2';
      health.max = enemyForm.maxHp;
      health.value = health.max;
      enemy.classList.remove('exhibit-enemy-defeated');
      BattleEnemySprites.draw(enemy, enemyForm);
      GameScenery.paint(ui('world'), 'battle', { stage: ExhibitEncounter.stage, phase });
      layout.align();
      say(enemyForm.name + ' 등장!');
    }

    function lock(value) {
      active = value;
      for (const button of commands.children) button.disabled = value;
    }

    function reset() {
      defense = 0;
      playerHealth.value = playerHealth.max;
      ui('result').hidden = true;
      commands.hidden = false;
      setPhase(0);
      lock(false);
    }

    function finish(won) {
      commands.hidden = true;
      ui('result-title').textContent = won ? '3단계 보스 격파!' : '보스에게 패배했어';
      enemy.classList.toggle('exhibit-enemy-defeated', won);
      ui('result').hidden = false;
      ui('result-title').focus({preventScroll: true});
    }

    function updateHp(meter, damage) {
      return animator.play(meter, meter.value, Math.max(0, meter.value - damage), value => {
        meter.value = Math.round(value);
      }, reduced.matches || document.hidden);
    }

    function pose(target, frames, duration) {
      if (reduced.matches || !target.animate) return Promise.resolve();
      return target.animate(frames, {duration}).finished.catch(() => {});
    }

    async function use(move, index) {
      if (active || commands.hidden) return;
      lock(true);
      try {
        say(move.name + '!');
        await pose(actor, [{transform:'translateX(0)'}, {transform:'translateX(18px)'}, {transform:'translateX(0)'}], 280);
        const damage = Math.round(move.damage * Craft.Types.multiplier(move.type, enemyForm.types));
        const effect = reduced.matches || document.hidden ? null : effects.play(index, damage ? enemy : actor);
        await Promise.all([effect, updateHp(health, damage)]);
        if (!health.value) {
          if (phase === 0) setPhase(1);
          else { say(move.name + '으로 마지막 페이즈를 끝냈어!'); finish(true); }
          return;
        }

        const counter = enemyForm.moves[turn++ % enemyForm.moves.length];
        if (move.defense) defense = Math.min(3, defense + 1);
        const incoming = Math.ceil(counter.damage * Craft.Types.multiplier(counter.element, ['water']) / (1 + defense * .25) * (move.guard ? .25 : 1));
        const outcome = damage ? damage + ' 피해' : move.guard ? '공격을 막을 자세를 잡았어' : '방어가 올랐어';
        say(outcome + ' · ' + counter.name + (incoming ? '에 ' + incoming + ' 피해를 입었어!' : '!'));
        await Promise.all([incoming ? pose(actor, [{opacity:1}, {opacity:.45}, {opacity:1}], 260) : null, updateHp(playerHealth, incoming)]);
        if (!playerHealth.value) finish(false);
      } finally {
        lock(false);
      }
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
      start(artwork, bossId) {
        boss = ExhibitEncounter.boss(bossId);
        reset();
        Craft.drawHeldArtwork(held, artwork).then(drawn => {
          if (drawn) Craft.attachToHand(held, {gripX:.45,gripY:.85});
        }).catch(() => {});
      },
    };
  },
};
