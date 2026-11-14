window.ExhibitSettings = {
  mount(ui, {fixedRarity, randomBoss = false} = {}) {
    const storageKey = 'draw-weapon:exhibit:settings' + (fixedRarity ? ':' + fixedRarity : '');
    const trigger = ui('settings-trigger');
    const dialog = ui('settings');
    const rarity = ui('settings-rarity');
    const boss = ui('settings-boss');
    let taps = 0, firstTap = 0;

    Craft.RarityChoice.mount(rarity, ui('settings-hint'));
    if (randomBoss) boss.add(new Option('랜덤 (기본)', 'random'));
    for (const enemy of ExhibitEncounter.choices) {
      boss.add(new Option(enemy.name, enemy.id));
    }
    let saved;
    try { saved = JSON.parse(sessionStorage.getItem(storageKey)); } catch {}
    rarity.value = fixedRarity || (Craft.Rarity.valid(saved?.rarity) ? saved.rarity : 'random');
    rarity.disabled = Boolean(fixedRarity);
    boss.value = ExhibitEncounter.valid(saved?.boss) ? saved.boss : randomBoss ? 'random' : ExhibitEncounter.defaultBoss;
    rarity.dispatchEvent(new Event('change'));

    function save() {
      try { sessionStorage.setItem(storageKey, JSON.stringify({ rarity:rarity.value, boss:boss.value })); } catch {}
    }
    rarity.addEventListener('change', save);
    boss.addEventListener('change', save);

    trigger.addEventListener('click', event => {
      if (!taps || event.timeStamp - firstTap > 2600) {
        taps = 0;
        firstTap = event.timeStamp;
      }
      if (++taps < 5) return;
      taps = 0;
      if (!dialog.open) dialog.showModal();
    });

    return {
      rarity: () => Craft.Rarity.valid(rarity.value) ? rarity.value : undefined,
      bossPreference: () => boss.value,
      boss: () => ExhibitEncounter.pick(boss.value),
    };
  },
};
