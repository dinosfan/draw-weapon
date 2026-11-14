window.ExhibitResources = (() => {
  const groups = {
    effects: ['battle/effects/sprite-atlas.js', 'weapons/effect-progress.js', 'weapons/effect-jobs.js?v=poster'],
    enemies: ['battle/boss-art.js', 'battle/enemy-sprites.js'],
    sample: ['battle/hp-animation.js', 'game/stage-layout.js', 'game/battle-scenery.js', 'exhibit/mock-effects.js?v=2', 'exhibit/mock-battle.js?v=showcase-settings'],
    demos: ['game/demo-catalog.js', 'game/demo-battle.js'],
    weapons: ['game/demo-catalog.js', 'game/demo-battle.js', 'exhibit/weapon-codex.js?v=deferred'],
  };
  const scripts = new Map();

  function script(source) {
    if (scripts.has(source)) return scripts.get(source);
    const node = document.createElement('script');
    node.src = 'js/' + source;
    node.async = false;
    const task = new Promise((resolve, reject) => {
      node.onload = resolve;
      node.onerror = () => {
        scripts.delete(source);
        node.remove();
        const error = Error('전시 자료를 불러오지 못했어.');
        error.connectionOnly = true;
        reject(error);
      };
    });
    scripts.set(source, task);
    document.head.append(node);
    return task;
  }

  return { load: (...names) => Promise.all(names.flatMap(name => groups[name]).map(script)) };
})();
