(()=>{
 const $=id=>document.getElementById(id),L=IdentityLab,P=GamePalette.tokens;let subject=L.fixtures[0],revision=0;
 BattlePreview.drawSprites();
 const scene=L.mountScene($('stage'),state=>{$('phase').textContent=state.phase;$('hp-bar').style.width=state.hp+'%';$('scrubber').value=state.progress;});
 function select(next){revision++;subject=next;scene.select(next);$('scrubber').disabled=true;$('subject-label').textContent=next.note;$('weapon-label').textContent=next.name;$('move-label').textContent='기술을 골라 봐.';$('description').textContent=next.moves[0].detail;$('caption').textContent='무기를 고르고 기술을 눌러 봐.';
  document.querySelectorAll('#subjects button').forEach((b,i)=>b.setAttribute('aria-pressed',String(L.fixtures[i]===next)));$('moves').replaceChildren();
  next.moves.forEach(move=>{const b=document.createElement('button');b.type='button';b.style.setProperty('--skill-color',P[move.element]);b.setAttribute('aria-pressed','false');const title=document.createElement('strong'),meta=document.createElement('small');title.textContent=move.name;meta.textContent=(move.emission?'별도 발사체':'원본 투척')+' · '+({line:'직선',curve:'곡선',bounce:'바운드',drop:'수직 낙하',pierce:'관통',ricochet:'도탄',glide:'활공',spiral:'나선'}[move.path]);b.append(title,meta);b.addEventListener('click',async()=>{const token=++revision;document.querySelectorAll('#moves button').forEach(item=>item.setAttribute('aria-pressed',String(item===b)));$('move-label').textContent=move.name;$('description').textContent=move.detail;$('caption').textContent=subject.name+'의 '+move.name+'!';await scene.play(move);if(token===revision)$('caption').textContent='다른 기술과 비교해 봐.';});$('moves').append(b);});
 }
 for(const item of L.fixtures){const b=document.createElement('button');b.type='button';const thumb=document.createElement('canvas');thumb.width=thumb.height=96;thumb.setAttribute('aria-hidden','true');thumb.getContext('2d').drawImage(L.assets[item.asset],0,0);const copy=document.createElement('span'),name=document.createElement('strong'),detail=document.createElement('small');name.textContent={ball:'야구공',gun:'권총',bird:'자유 낙서'}[item.id];detail.textContent=item.note;copy.append(name,detail);b.append(thumb,copy);b.addEventListener('click',()=>select(item));$('subjects').append(b);}
 $('scrubber').addEventListener('input',()=>scene.seek(Number($('scrubber').value)));$('moves').addEventListener('click',()=>{$('scrubber').disabled=false;});$('reset').addEventListener('click',()=>select(subject));document.addEventListener('visibilitychange',()=>{if(document.hidden)scene.cancel();});select(subject);
})();


