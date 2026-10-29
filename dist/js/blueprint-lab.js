(async()=>{
 const parent=document.getElementById('studies');
 for(const id of ['evolution-live','pixel-umbrella','key','umbrella','spring-hand']){
  const section=document.createElement('section');section.className='blueprint-card';parent.append(section);
  try{const r=await fetch('assets/studies/blueprints/'+id+'.json');if(!r.ok)throw Error('시험 결과를 불러오지 못했어요.');const data=await r.json(),weapon=Craft.normalizeCreative(data.weapon);weapon.artwork=data.artwork||data.image;weapon.rarity=Craft.Rarity.valid(data.weapon.rarity)?data.weapon.rarity:'common';
   const image=document.createElement('img');image.src=data.image;image.alt='분석에 사용한 원본 낙서';const body=document.createElement('div'),title=document.createElement('h2'),reason=document.createElement('p'),list=document.createElement('ul'),link=document.createElement('a');title.textContent=weapon.name;reason.textContent=weapon.reason;
   for(const move of weapon.moves){const li=document.createElement('li');li.textContent=move.name+' · '+(weapon.effectAtlas?.layout==='skill-2x2-v1'?'로컬 AI가 생성한 기술별 도트':move.motionPlan.layers.map(l=>l.source==='drawing'?'원본 활용':'AI 픽셀 소재').join(' + '));list.append(li);}
   link.textContent='이 그림으로 전투하기';link.href=Craft.weaponBattleUrl(weapon);link.className='battle-study-link';body.append(title,reason,list,link);section.append(image,body);
  }catch(error){section.textContent=error.message;}
 }
})();
