window.BattleRarity={mount(arena){
 const nodes=new Set();
 function cancel(){for(const node of nodes){node.remove();}nodes.clear();}
 function pulse(move){
  cancel();const tier=Craft.Rarity.get(BattlePreview.weapon.rarity);
  if(!tier.rank||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const actor=arena.querySelector('.enemy-fighter'),box=arena.getBoundingClientRect(),target=actor.getBoundingClientRect();
  for(let i=0;i<tier.rank;i++){
   const ring=document.createElement('span');ring.className='rarity-contact';ring.setAttribute('aria-hidden','true');
   Object.assign(ring.style,{left:(target.left-box.left+target.width/2)+'px',top:(target.top-box.top+target.height/2)+'px',borderColor:Craft.Types.color(move.element),animationDelay:i*60+'ms',width:(42+i*22)+'px',height:(42+i*22)+'px'});
   if(tier.rank===4&&i%2)ring.classList.add('rarity-contact-square');
   nodes.add(ring);ring.addEventListener('animationend',()=>{nodes.delete(ring);ring.remove();},{once:true});arena.append(ring);
  }
 }
 return{pulse,cancel};
}};
