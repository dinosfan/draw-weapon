window.ExhibitPresentation = (() => {
  const atlasId = '0a882169340388c6be5172489c6b4c23b7747f79ce41aabde534b0d35e2ffa2a';
  const atlasUrl = 'assets/presentation/f-ma-atlas.png';
  let prepared, atlasReady;

  function loadAtlas() {
    if (atlasReady) return atlasReady;
    const atlas = new Image();
    atlas.src = atlasUrl;
    atlasReady = atlas.decode().catch(error => { atlasReady = null; throw error; });
    return atlasReady;
  }

  function load() {
    return prepared ??= fetch('assets/presentation/f-ma.json', {signal:AbortSignal.timeout(12000)}).then(async response => {
      if (!response.ok) throw Error('발표용 무기를 불러오지 못했어.');
      const {weapon} = await response.json();
      if (weapon?.rarity !== 'mythic' || weapon.moves?.length !== 4 || weapon.effectAtlas?.id !== atlasId ||
          weapon.effectAtlas.rarity !== 'mythic' || weapon.effectAtlas.layout !== 'skill-2x2-v1') {
        throw Error('발표용 무기 자료를 확인해 줘.');
      }
      loadAtlas().catch(() => {});
      return weapon;
    }).catch(error => { prepared = null; throw error; });
  }

  function atlasSource(variant) {
    return (Craft.Exhibit?.presentation || Craft.Exhibit?.active) && variant === 'generated:' + atlasId ? atlasUrl : null;
  }

  return { load, loadAtlas, atlasSource };
})();
