window.ExhibitPresentation = (() => {
  const atlasId = '1dcdd76ce69068f2bccb4375d50c6478a6206070a2a5130bc9b861514d45aa0d';
  const atlasUrl = 'assets/presentation/fish-atlas.png';
  const formulaAtlasId = '0a882169340388c6be5172489c6b4c23b7747f79ce41aabde534b0d35e2ffa2a';
  let prepared, formula, atlasReady;

  function loadAtlas() {
    if (atlasReady) return atlasReady;
    const atlas = new Image();
    atlas.src = atlasUrl;
    atlasReady = atlas.decode().catch(error => { atlasReady = null; throw error; });
    return atlasReady;
  }

  async function loadWeapon(file, expectedAtlas) {
    const response = await fetch(`assets/presentation/${file}.json`, {signal:AbortSignal.timeout(12000)});
    if (!response.ok) throw Error('발표용 무기를 불러오지 못했어.');
    const {weapon} = await response.json();
    if (weapon?.rarity !== 'mythic' || weapon.moves?.length !== 4 || weapon.effectAtlas?.id !== expectedAtlas ||
        weapon.effectAtlas.rarity !== 'mythic' || weapon.effectAtlas.layout !== 'skill-2x2-v1') {
      throw Error('발표용 무기 자료를 확인해 줘.');
    }
    return weapon;
  }

  function load() {
    return prepared ??= loadWeapon('fish', atlasId).then(weapon => {
      loadAtlas().catch(() => {});
      return weapon;
    }).catch(error => { prepared = null; throw error; });
  }

  function loadFormula() {
    return formula ??= loadWeapon('f-ma', formulaAtlasId).catch(error => { formula = null; throw error; });
  }

  function atlasSource(variant) {
    if (!Craft.Exhibit?.presentation && !Craft.Exhibit?.active) return null;
    if (variant === 'generated:' + atlasId) return atlasUrl;
    return variant === 'generated:' + formulaAtlasId ?
      'assets/presentation/f-ma-atlas.png' : null;
  }

  const usesTravelFrame = id => Craft.Exhibit?.presentation === true && id === atlasId;

  return { load, loadAtlas, loadFormula, atlasSource, usesTravelFrame };
})();
