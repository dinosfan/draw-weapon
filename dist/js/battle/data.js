window.BattlePreview = {};
BattlePreview.data = {
  player: { name: '꽃잎 지팡이', level: 5, maxHp: 100, note: '회복형 · 당신이 그린 무기' },
  enemy: { name: '낙서 수호자', level: 7, maxHp: 110, note: '다음 행동: 공격' },
  enemyMoves: [{ name: '몸통박치기', damage: 14 }, { name: '잉크 강타', damage: 25 }, { name: '휴식', damage: 0 }],
  commands: [{ id: 'attack', label: '싸운다', hint: 'ATTACK' }, { id: 'skill', label: '무기 정보', hint: 'BLOOM · 2/2' }, { id: 'guard', label: '방어', hint: 'GUARD' }, { id: 'bag', label: '가방', hint: 'BAG' }]
};

try{BattlePreview.weapon = Craft.readBattleWeapon(location.hash);}catch(error){BattlePreview.loadError=error;BattlePreview.weapon={kind:'unavailable',name:'저장된 무기 확인 필요',type:'복구 대기',types:['normal'],attack:0};}
BattlePreview.data.player.name = BattlePreview.weapon.name;
BattlePreview.data.player.note = (BattlePreview.weapon.rarity&&Craft.Rarity?Craft.Rarity.get(BattlePreview.weapon.rarity).label+' · ':'')+BattlePreview.weapon.type + ' · 당신이 그린 무기';
if(BattlePreview.weapon.evolution)BattlePreview.data.player.note+=' · '+BattlePreview.weapon.evolution.stage+'차 진화';

BattlePreview.data.player.types=BattlePreview.weapon.types||['normal'];
