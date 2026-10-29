(()=>{
 const ui=id=>document.getElementById(id),reveal=Craft.mountRarityReveal();let selected='legendary',busy=false;
 const base=Craft.DragonScythe.create();
 function render(id){selected=id;const weapon={...base,rarity:id};Craft.renderWeapon(ui('weapon-preview'),ui('weapon-result'),weapon);document.querySelectorAll('[data-rarity]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.rarity===id)));ui('lab-grade').textContent=Craft.Rarity.get(id).label+' 등급 공개';return weapon;}
 for(const[id,tier]of Object.entries(Craft.Rarity.tiers)){const button=document.createElement('button');button.type='button';button.dataset.rarity=id;button.textContent=tier.label+' '+tier.chance+'%';button.style.borderColor=GamePalette.tokens[tier.color];button.onclick=()=>{if(!busy)render(id);};ui('rarity-choices').append(button);}
 ui('birth-test').onclick=async()=>{if(busy)return;busy=true;const buttons=[...document.querySelectorAll('.rarity-lab button')];buttons.forEach(button=>button.disabled=true);await reveal.play(render(selected));buttons.forEach(button=>button.disabled=false);busy=false;};
 ui('random-test').onclick=async()=>{if(busy)return;render(Craft.Rarity.roll());ui('birth-test').click();};
 ui('try-battle').onclick=event=>{event.currentTarget.href=Craft.weaponBattleUrl({...base,rarity:selected});};render(selected);
})();
