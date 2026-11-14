window.ExhibitEncounter = (() => {
  const stage = 2;
  const defaultBoss = 'gearjudge';
  const choices = Craft.Journey.encountersForStage(stage);
  const valid = id => choices.some(enemy => enemy.id === id);
  const resolve = id => valid(id) ? id : defaultBoss;
  const pick = id => id === 'random' ? choices[Math.floor(Math.random() * choices.length)].id : resolve(id);

  function boss(id) {
    const guardian = choices.find(enemy => enemy.id === resolve(id));
    const exhibitionMoves = moves => moves.map(move => ({ ...move, damage: Math.round(move.damage * .45) }));
    return {
      ...guardian,
      maxHp: 72,
      moves: exhibitionMoves(guardian.moves),
      second: { ...guardian.second, maxHp: 78, moves: exhibitionMoves(guardian.second.moves) },
    };
  }

  return { stage, defaultBoss, choices, valid, pick, boss };
})();
