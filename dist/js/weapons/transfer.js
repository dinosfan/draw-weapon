// Mechanics travel in the URL; original PNG artwork stays in same-origin local storage.
// All restored stats and text pass through normalization.
Craft.weaponBattleUrl = weapon => {
  const params = new URLSearchParams({ weapon:weapon.kind, attack:String(weapon.attack), name:weapon.name, source:'crafted' });
  if(Craft.Journey)params.set('journey',Craft.Journey.seed());
  if(Craft.Rarity?.valid(weapon.rarity))params.set('rarity',weapon.rarity);
  if (weapon.kind === 'custom') {
    const build=JSON.stringify(Craft.normalizeCreative(weapon));
    if(weapon.engine||weapon.moves?.some(move=>move.rule||move.story)||build.length>4500){
      const id=Date.now().toString(36)+Math.random().toString(36).slice(2,8);
      try{localStorage.setItem('draw-weapon:build:'+id,build);try{localStorage.setItem('draw-weapon:build-backup:'+id,build);}catch{}}catch{throw Error('무기 운용법을 저장하지 못했어요. 브라우저 저장 공간을 확인해 주세요.');}
      params.set('build',id);
    }else params.set('data',build);
  }
  if (Craft.validArtwork(weapon.artwork)) {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2,8);
    try {
      const previous=JSON.parse(localStorage.getItem('draw-weapon:equipped') || 'null');
      if(previous?.id && Craft.validArtwork(previous.image)) localStorage.setItem('draw-weapon:art:'+previous.id,previous.image);
      localStorage.setItem('draw-weapon:art:'+id,weapon.artwork);
      localStorage.setItem('draw-weapon:equipped',JSON.stringify({id,image:weapon.artwork}));
    }
    catch { throw Error('그림을 저장할 공간이 없어. 브라우저의 로컬 저장을 허용한 후 다시 제작해 줘.'); }
    params.set('art',id);
  }
  return 'battle.html#' + params;
};
Craft.attachArtwork = (weapon,params) => {
  if (!params.get('art')) return weapon;
  try {
    const cached=localStorage.getItem('draw-weapon:art:'+params.get('art'));
    if(Craft.validArtwork(cached)){weapon.artwork=cached;return weapon;}
    const saved=JSON.parse(localStorage.getItem('draw-weapon:equipped'));
    if(saved?.id === params.get('art') && Craft.validArtwork(saved.image)) weapon.artwork=saved.image;
  } catch {}
  return weapon;
};
Craft.readBattleWeapon = hash => {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  const kind = params.get('weapon');
  if (kind === 'custom') {
    const id=params.get('build');let restored;
    for(const source of ['primary','backup']){try{const raw=params.get('data')||(id?localStorage.getItem('draw-weapon:'+(source==='primary'?'build:':'build-backup:')+id):null);if(!raw||raw.length>60000)continue;restored=Craft.normalizeCreative(JSON.parse(raw));if(id)try{localStorage.setItem('draw-weapon:'+(source==='backup'?'build:':'build-backup:')+id,raw);}catch{}break;}catch{}}
    if(!restored)throw Error('저장된 무기 기술을 불러오지 못했어. 원래 기록은 지우지 않았어. 진열장에서 같은 무기를 다시 열거나 저장된 브라우저에서 확인해 줘.');
    restored=Craft.attachArtwork(restored,params);if(params.get('art')&&!restored.artwork)throw Error('무기 기술은 남아 있지만 원본 그림을 찾지 못했어. 그림이 저장된 브라우저에서 다시 열어 줘.');return restored;
  }
  const descriptions = { flower: '꽃', clock: '시계', sword: '검' };
  if (!Object.hasOwn(descriptions, kind)) return Craft.createWeapon({ description: '꽃', points: 0 });
  const weapon = Craft.createWeapon({ description: descriptions[kind], points: 0 });
  const attack = Number(params.get('attack'));
  if ((kind === 'sword' || params.get('source') === 'crafted') && Number.isInteger(attack) && attack >= 18 && attack <= 28) weapon.attack = attack;
  if (params.get('source') === 'crafted') weapon.name = Craft.cleanText(params.get('name'), 40) || weapon.name;
  if(Craft.Rarity?.valid(params.get('rarity')))weapon.rarity=params.get('rarity');
  return Craft.attachArtwork(weapon,params);
};

