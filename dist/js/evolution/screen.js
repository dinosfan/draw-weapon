Craft.EvolutionScreen=(()=>{
 const $=id=>document.getElementById(id);let buttons=[];
 function source(weapon,next){$('evolution-source-name').textContent=weapon.name;$('evolution-source-types').innerHTML=weapon.types.map(Craft.Types.badge).join('');$('evolution-original').src=weapon.artwork;$('evolution-before').src=weapon.artwork;$('evolution-grade').textContent=Craft.Rarity.get(weapon.rarity).label+' 등급 · '+((weapon.evolution?.stage||0)+1)+'차 진화';$('evolution-chapter').textContent=((weapon.evolution?.stage||0)+1)+'차 진화';$('evolution-return').href=next;}
 function message(text){$('evolution-message').textContent=text;}
 function busy(value,label){buttons.forEach(b=>b.disabled=value);$('evolution-confirm').disabled=value;if(label)$('evolution-confirm').textContent=label;}
 function reading(base,option){$('evolution-reading').hidden=false;$('evolution-reading-image').src=option.image;$('evolution-reading-name').textContent=option.name;$('evolution-reading-types').innerHTML=option.types.map(Craft.Types.badge).join('');$('evolution-reading-story').textContent=option.story;changes(base,option);$('evolution-confirm').hidden=true;$('evolution-depart').hidden=false;$('evolution-depart').disabled=false;$('evolution-return').hidden=true;$('evolution-phase').textContent='선택 완료 · 무기와 기술을 읽어 봐.';message('선택한 진화 무기를 확인해 봐.\n읽는 동안 뒤에서 준비할게. 전투로를 누르면 준비 로딩이 시작돼.');$('evolution-reading').scrollIntoView?.({block:'start',behavior:'instant'});}
 function previewWeapon(base,option){
  const changes=option.changes||[];
  return{...base,name:option.name||base.name,types:option.types||base.types,moves:base.moves.map((old,index)=>{
   const change=changes.find(c=>c.index===index);if(!change)return old;
   const next={...old,...change,skipCounter:false};delete next.mechanic;delete next.story;return next;
  })};
 }
 function value(number,{percent=false,power=false}={}){return Number.isFinite(number)&&(!power||number>0)?String(number)+(percent?'%':''):'—';}
 function stats(before,after,changed){
  const grid=document.createElement('div');grid.className='evolution-move-stats';
  const metrics=[['위력',before.damage,after.damage,{power:true}],['명중',before.rule?.accuracy,after.rule?.accuracy,{percent:true}],['PP',before.pp,after.pp,{}]];
  if(before.heal>0||after.heal>0)metrics.push(['회복',before.heal,after.heal,{power:true}]);
  for(const[label,old,next,format]of metrics){const metric=document.createElement('span'),title=document.createElement('small'),numbers=document.createElement('b');
   title.textContent=label;const previous=value(old,format),current=value(next,format);numbers.textContent=changed?previous+' → '+current:current;
   metric.dataset.change=previous===current?'same':Number(next)>Number(old)?'up':'down';metric.append(title,numbers);grid.append(metric);
  }
  return grid;
 }
 function changes(base,option,actual){
  const list=$('evolution-skill-changes'),before=Craft.Moves.forWeapon(base),after=Craft.Moves.forWeapon(actual||previewWeapon(base,option));list.replaceChildren();
  $('evolution-skills').querySelector('h2').textContent=actual?'진화 전후 기술 · 최종 수치':'진화 전후 기술 · 등급 반영 미리보기';
  base.moves.forEach((old,i)=>{
   const change=option.changes.find(c=>c.index===i),previous=before[i],display=after[i];
   const rankedChange=!change&&(previous.damage!==display.damage||previous.heal!==display.heal||previous.pp!==display.pp||previous.rule?.accuracy!==display.rule?.accuracy||previous.ultimate!==display.ultimate);
   const item=document.createElement('li'),tag=document.createElement('small'),name=document.createElement('strong'),description=document.createElement('span');
   tag.textContent=change?'전용 기술로 교체 · 새 도트 생성':rankedChange?'계승 기술 · 등급 효과 변경':'그대로 계승 · 완성된 도트 재사용';
   name.textContent=change||previous.name!==display.name?previous.name+' → '+display.name:display.name;
   description.textContent=display.rule?Craft.MoveRules.explain(display):display.description;
   item.style.setProperty('--move-type',Craft.Types.color(display.element));
   item.append(tag,name,description,stats(previous,display,!!change||rankedChange));
   if(previous.ultimate||display.ultimate){const ultimate=document.createElement('span');ultimate.className='evolution-ultimate-note';ultimate.textContent=previous.ultimate===display.ultimate?'궁극기 · 전투당 1회':display.ultimate?'진화 후 궁극기 · 전투당 1회':'궁극기는 다른 기술로 이어져';item.append(ultimate);}
   list.append(item);
  });$('evolution-skills').hidden=false;
 }

 function options(base,data,onSelect){buttons=[];$('evolution-choices').replaceChildren();for(const option of data.options){const button=document.createElement('button');button.type='button';button.className='evolution-choice';button.style.setProperty('--evolution-type',Craft.Types.color(option.types[0]));button.setAttribute('aria-pressed','false');const image=document.createElement('img');image.src=option.image;image.alt=option.name+' 진화 외형';const content=document.createElement('div'),route=document.createElement('small'),name=document.createElement('strong'),types=document.createElement('div'),line=document.createElement('p');route.textContent=option.route;name.textContent=option.name;types.className='choice-types';types.innerHTML=option.types.map(Craft.Types.badge).join('');line.textContent=option.line;content.append(route,name,types,line);button.append(image,content);button.addEventListener('click',()=>{buttons.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));$('evolution-stage-name').textContent=option.name;$('evolution-stage-note').textContent=option.line;message(option.story);changes(base,option);onSelect(option);});buttons.push(button);$('evolution-choices').append(button);}}
 function completed(weapon,url){$('evolution-after').src=weapon.artwork;$('evolution-before').hidden=true;$('evolution-after').hidden=false;$('evolution-phase').textContent='진화했다!';$('evolution-stage-name').textContent=weapon.name;$('evolution-stage-note').textContent=Craft.Types.summary(weapon.types);message(weapon.evolution.previousName+'의 진화가 완성됐다!\n'+weapon.name+'!');busy(true);$('evolution-confirm').hidden=true;$('evolution-save-weapon').hidden=false;$('evolution-battle').href=url;$('evolution-battle').hidden=false;$('evolution-battle').focus({preventScroll:true});}
 return{source,message,busy,changes,options,completed,reading};
})();
