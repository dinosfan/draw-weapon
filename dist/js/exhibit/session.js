(() => {
  const key = 'draw-weapon:exhibit:v1';
  const active = new URLSearchParams(location.search).get('mode') === 'exhibit';
  const scoped = active || location.pathname.endsWith('/exhibit.html');
  const offline = location.protocol === 'file:';

  function save({weapon, image, resumeEffects}) {
    sessionStorage.setItem(key, JSON.stringify({weapon, image, resumeEffects}));
  }

  function load() {
    const record = JSON.parse(sessionStorage.getItem(key) || 'null');
    if (!Craft.validArtwork(record?.weapon?.artwork)) throw Error('전시 무기를 찾지 못했어.');
    const weapon = { ...Craft.normalizeWeapon(record.weapon), artwork: record.weapon.artwork };
    return { weapon, image: record.image, resumeEffects: record.resumeEffects === true };
  }

  const request = scoped ? (url, options = {}) => {
    const headers = new Headers(options.headers);
    headers.set('X-Draw-Weapon-Mode', 'exhibit');
    return fetch(url, {...options, headers});
  } : null;
  Craft.Exhibit = { active, offline, request, save, load, battleUrl:'battle.html?mode=exhibit' };
})();
