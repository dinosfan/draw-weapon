window.Craft = {};
Craft.createWeapon = ({ description, points }) => {
  if (/꽃|flower|회복/i.test(description)) return { kind: 'flower', name: '꽃잎 지팡이', icon: '🌸', type: '회복형', attack: 19, trait: '생명력', skill: '만개', effect: '26 피해를 주고 내 체력을 14 회복합니다.', reason: '꽃의 생명력을 담아, 상처를 치유하는 지팡이가 탄생했어요.' };
  if (/시계|시간|clock/i.test(description)) return { kind: 'clock', name: '시간의 고리', icon: '🕒', type: '제어형', attack: 21, trait: '시간 정지', skill: '멈춰버린 순간', effect: '28 피해를 주고 상대의 반격을 한 번 취소합니다.', reason: '시간을 붙잡는 상상에서, 상대의 움직임을 멈추는 고리가 태어났어요.' };
  return { kind: 'sword', name: '낙서 블레이드', icon: '⚔️', type: '공격형', attack: Math.min(28, 18 + Math.floor(points / 35)), trait: '잉크의 힘', skill: '잉크 폭발', effect: '응축된 잉크를 터뜨려 기본 공격의 2배 피해를 줍니다.', reason: '자유롭게 이어진 선에서, 잉크의 힘을 품은 블레이드가 탄생했어요.' };
};

Craft.cleanText = (text, max) => typeof text === 'string' ? text.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, max) : '';
Craft.escapeHTML = text => String(text).replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
Craft.normalizeWeapon = data => {
  if (data?.kind === 'custom') return Craft.normalizeCreative(data);
  if (!data || !['flower', 'clock', 'sword'].includes(data.kind) || !Number.isFinite(data.attack)) throw Error('무기 응답 형식 오류');
  const descriptions = { flower: '꽃', clock: '시계', sword: '검' };
  const weapon = Craft.createWeapon({ description: descriptions[data.kind], points: 0 });
  weapon.name = Craft.cleanText(data.name, 40) || weapon.name;
  weapon.reason = Craft.cleanText(data.reason, 600) || weapon.reason;
  weapon.attack = Math.round(Math.max(18, Math.min(28, data.attack)));
  if(Craft.Rarity?.valid(data.rarity))weapon.rarity=data.rarity;
  return weapon;
};

Craft.normalizeCreative = data => {
  if (data.moves) { const moves=Craft.Moves.normalize(data.moves); data={...data,moves,skill:moves[0].name,skillDamage:moves[0].damage,skillHeal:moves[0].heal,skipCounter:moves[0].skipCounter}; }
  const clean = (key,max) => { const text = Craft.cleanText(data[key],max); if (!text) throw Error('무기 응답 형식 오류'); return text; };
  const number = (key,min,max) => { if (!Number.isFinite(data[key])) throw Error('무기 응답 형식 오류'); return Math.round(Math.max(min,Math.min(max,data[key]))); };
  const weapon = { kind:'custom', icon:'✨', name:clean('name',40), type:clean('type',16), trait:clean('trait',20), skill:clean('skill',30), reason:clean('reason',600), attack:number('attack',18,28), skillDamage:number('skillDamage',data.moves?0:20,48), skillHeal:number('skillHeal',0,data.moves?30:18), skipCounter:data.skipCounter === true };
  if (weapon.skipCounter) { weapon.skillDamage=Math.min(28,weapon.skillDamage);weapon.skillHeal=0; }
  if (weapon.skillHeal) weapon.skillDamage=Math.min(30,weapon.skillDamage);
  weapon.effect = weapon.skillDamage + ' 피해' + (weapon.skillHeal ? ' · 체력 ' + weapon.skillHeal + ' 회복' : '') + (weapon.skipCounter ? ' · 상대 반격 취소' : '');
  if(data.moves) weapon.moves=data.moves;
  weapon.rig=Craft.WeaponRig.normalize(data.rig,weapon);
  if(data.concept)weapon.concept={defense:Craft.cleanText(data.concept.defense,180),healing:Craft.cleanText(data.concept.healing,180)};
  if(data.engine)weapon.engine=Craft.Tactics.engine(data.engine);
  if(Craft.Rarity?.valid(data.rarity))weapon.rarity=data.rarity;
  if(/^[a-f0-9]{64}$/.test(data.effectInheritance||''))weapon.effectInheritance=data.effectInheritance;
  if(data.study==='dragon-scythe'){weapon.study=data.study;if(['fang','storm'].includes(data.studyVariant))weapon.studyVariant=data.studyVariant;}
  if(/^[a-f0-9]{64}$/.test(data.effectAtlas?.id||''))weapon.effectAtlas={id:data.effectAtlas.id,...(data.effectAtlas.layout==='skill-2x2-v1'?{layout:data.effectAtlas.layout}:{})};
  if(weapon.effectAtlas&&data.effectAtlas.rarity!==undefined){if(data.effectAtlas.rarity===(weapon.rarity||'common'))weapon.effectAtlas.rarity=data.effectAtlas.rarity;else delete weapon.effectAtlas;}
  if(weapon.effectAtlas&&data.effectAtlas.readyRows!==undefined){const rows=data.effectAtlas.readyRows;if(Array.isArray(rows)&&rows.length&&rows.length<=4&&new Set(rows).size===rows.length&&rows.every(r=>Number.isInteger(r)&&r>=0&&r<4))weapon.effectAtlas.readyRows=[...rows].sort();else delete weapon.effectAtlas;}
  if(/^[a-f0-9]{32}$/.test(data.effectJob||''))weapon.effectJob=data.effectJob;
  if(Array.isArray(data.effectRetryRows)&&data.effectRetryRows.length&&data.effectRetryRows.every(i=>Number.isInteger(i)&&i>=0&&i<4))weapon.effectRetryRows=[...new Set(data.effectRetryRows)];
  if(data.evolution){const e=data.evolution;if(!Number.isInteger(e.stage)||e.stage<1||e.stage>50)throw Error('진화 계보 형식 오류');weapon.evolution={stage:e.stage,rootName:Craft.cleanText(e.rootName,40)||weapon.name,previousName:Craft.cleanText(e.previousName,40)||weapon.name};}
  weapon.types=data.types?Craft.Types.normalize(data.types):['normal'];
  weapon.typeReason=Craft.cleanText(data.typeReason,180)||'이전에 제작한 무기입니다. 새로 제작하면 AI가 그림에서 타입을 판단합니다.';
  return weapon;
};
Craft.validArtwork = image => typeof image === 'string' && image.length <= 1400000 && /^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(image);
