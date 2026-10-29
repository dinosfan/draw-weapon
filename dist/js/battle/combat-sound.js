window.BattleCombatSound={mount(){
 const sound=window.BattleVfxSound?.mount(),button=document.getElementById('battle-sound');let enabled=false;
 if(button&&sound)button.addEventListener('click',async()=>{try{enabled=await sound.toggle();button.textContent=enabled?'효과음 켜짐':'효과음 꺼짐';button.setAttribute('aria-pressed',String(enabled));}catch{button.textContent='효과음 사용 불가';}});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)sound?.stop();});
 return{start(move){if(!enabled)return;sound.prepare(!!move.ultimate);sound.swing(Math.min(4,Craft.Rarity.get(BattlePreview.weapon.rarity).rank));},contact(move,feedback,counter=false){if(!enabled)return;const hit=counter?feedback.counter:feedback.hit;if(hit>0)sound.hit(Math.min(4,Math.floor(hit/20)),!!move?.ultimate);},stop(){sound?.stop();}};
}};
