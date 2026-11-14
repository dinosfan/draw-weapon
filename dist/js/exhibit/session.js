(() => {
  const params = new URLSearchParams(location.search);
  const active = params.get('mode') === 'exhibit';
  const inWorkshop = location.pathname.endsWith('/exhibit.html');
  const scoped = active || inWorkshop;
  const presentation = scoped && params.get('presentation') === 'f-ma';
  const presentationQuery = presentation ? '&presentation=f-ma' : '';
  const key = 'draw-weapon:exhibit:v1' + (presentation ? ':f-ma' : '');
  const offline = location.protocol === 'file:';

  function save({weapon, image, resumeEffects, boss, effectRequestId, sample}) {
    sessionStorage.setItem(key, JSON.stringify({weapon, image, resumeEffects, boss, effectRequestId, sample}));
  }

  function load() {
    const record = JSON.parse(sessionStorage.getItem(key) || 'null');
    if (!Craft.validArtwork(record?.weapon?.artwork)) throw Error('전시 무기를 찾지 못했어.');
    const weapon = { ...Craft.normalizeWeapon(record.weapon), artwork: record.weapon.artwork };
    return { weapon, image: record.image, resumeEffects: record.resumeEffects === true, boss:record.boss, effectRequestId:record.effectRequestId, sample:record.sample === true };
  }

  const request = scoped ? (url, options = {}) => {
    const headers = new Headers(options.headers);
    headers.set('X-Draw-Weapon-Mode', 'exhibit');
    return fetch(url, {...options, headers});
  } : null;
  Craft.Exhibit = {
    active, offline, presentation, request, save, load,
    workshopUrl: 'exhibit.html?screen=workshop' + presentationQuery,
    battleUrl: 'battle.html?mode=exhibit' + presentationQuery,
  };
})();
