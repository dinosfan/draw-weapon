Craft.mountRarityReveal=()=>{
 const dialog=document.createElement('dialog');dialog.className='rarity-reveal';
 dialog.innerHTML='<div class="birth-stage"><div class="birth-orbit" aria-hidden="true"></div><div class="birth-rays" aria-hidden="true"></div><span class="birth-eyebrow">당신의 상상이 깨어나는 순간</span><div class="birth-art"></div><div class="birth-copy" aria-live="polite"><span class="birth-grade"></span><h2></h2><p class="birth-announcement"></p><p class="birth-bonus"></p></div><button class="birth-continue" type="button">기술 4개 확인하기</button></div>';
 document.body.append(dialog);
 let settle;
 function close(){if(!dialog.classList.contains('revealed'))return;dialog.close();settle?.();settle=null;}
 dialog.querySelector('button').onclick=close;
 dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
 return{async play(weapon){
  const tier=Craft.Rarity.get(weapon.rarity),art=dialog.querySelector('.birth-art');
  dialog.classList.remove('revealed');dialog.dataset.rank=tier.rank;dialog.style.setProperty('--rarity-color',GamePalette.tokens[tier.color]);
  art.replaceChildren();const image=document.createElement(Craft.validArtwork(weapon.artwork)?'img':'span');
  if(image.tagName==='IMG'){image.src=weapon.artwork;image.alt='직접 그린 '+weapon.name;}else{image.className='tossface';image.textContent=weapon.icon;}
  art.append(image);dialog.querySelector('.birth-grade').textContent=tier.label;
  dialog.querySelector('h2').textContent=weapon.name;
  dialog.querySelector('.birth-announcement').textContent=tier.label+' 등급 무기 탄생!';
  dialog.querySelector('.birth-bonus').textContent=Craft.Rarity.summary(weapon.rarity);
  const button=dialog.querySelector('button');button.disabled=true;dialog.showModal();
  const done=new Promise(resolve=>settle=resolve);
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  await new Promise(resolve=>setTimeout(resolve,reduce?0:1000+tier.rank*160));
  dialog.classList.add('revealed');button.disabled=false;button.focus();await done;
 }};
};
