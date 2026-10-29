(()=>{
 const grade=new URLSearchParams(location.search).get('rarity');
 const rarity=Craft.Rarity.valid(grade)?grade:'mythic';
 const variant=new URLSearchParams(location.search).get('variant')==='storm'?'storm':'fang';
 const weapon={...Craft.DragonScythe.create(),rarity,studyVariant:variant};
 const battle=Craft.weaponBattleUrl(weapon);
 history.replaceState(null,'',location.pathname+location.search+'#'+battle.split('#')[1]);
 document.addEventListener('DOMContentLoaded',()=>{
  const choices=document.getElementById('skill-grade-choices');
  for(const[id,tier]of Object.entries(Craft.Rarity.tiers)){
   const link=document.createElement('a');link.href='rarity-skill-lab.html?rarity='+id+'&variant='+variant;link.textContent=tier.label;
   link.setAttribute('aria-current',String(id===rarity));link.style.setProperty('--grade-color',GamePalette.tokens[tier.color]);choices.append(link);
  }
  for(const[id,label]of [['fang','용아 · 생성본 A'],['storm','폭풍 · 생성본 B']]){const link=document.createElement('a');link.href='rarity-skill-lab.html?rarity='+rarity+'&variant='+id;link.textContent=label;link.setAttribute('aria-current',String(id===variant));document.getElementById('vfx-variant-choices').append(link);}
  const rank=Craft.Rarity.get(rarity).rank;
  document.getElementById('skill-grade-note').textContent=rank===4?'신화 · 네 번째 기술이 궁극기로 진화. 위력 84 · 명중 100% · 전투당 1회.':rank===3?'전설 · 네 번째 기술이 용왕의 참격으로 진화. 명중 시 상대 방어 1단계 하락.':'같은 그림, 같은 기술. 등급에 따른 동작과 규모의 차이를 비교해보세요.';
  document.getElementById('reset-preview').href='rarity-lab.html';
 });
})();
