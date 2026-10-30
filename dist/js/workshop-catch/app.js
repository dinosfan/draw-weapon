(function(root){
 const M=root.WorkshopCatchModel,$=id=>document.getElementById(id),canvas=$('catch-canvas');if(!canvas)return;
 const renderer=root.WorkshopCatchRenderer.create(canvas),keys=new Set(),cards=[];let state=M.create(),frame=null,last=0,target=null,best=0,toastUntil=0,destroyed=false,dragging=false;
 function rewardCard(reward){const card=document.createElement('li'),icon=document.createElement('span'),content=document.createElement('div'),title=document.createElement('strong'),effect=document.createElement('small'),label=document.createElement('span');card.className='catch-reward';card.style.setProperty('--reward-color',GamePalette.tokens[reward.color]);icon.className='fluent-emoji';icon.setAttribute('aria-hidden','true');icon.textContent=reward.icon;title.textContent=reward.name;effect.textContent=reward.effect;content.append(title,effect);label.className='reward-requirement';card.append(icon,content,label);return{card,label,reward};}
 for(const reward of M.rewards){const entry=rewardCard(reward);cards.push(entry);$('catch-rewards').append(entry.card);}
 function controls(){return{axis:(keys.has('right')?1:0)-(keys.has('left')?1:0),target};}
 function update(){
  const remaining=Math.ceil(M.remaining(state)),earned=M.earned(state.score);$('catch-time').textContent=String(Math.floor(remaining/60)).padStart(2,'0')+':'+String(remaining%60).padStart(2,'0');$('catch-clock').dataset.urgent=String(remaining<=10);$('catch-time-fill').style.transform='scaleX('+M.remaining(state)/M.duration+')';$('catch-score').textContent=state.score.toLocaleString('ko-KR');$('catch-count').textContent=state.caught;
  $('catch-combo').textContent=state.combo>=5?state.combo+' 연속 수집':'하나씩, 차곡차곡';$('catch-combo').classList.toggle('active',state.combo>=5);$('catch-bag-count').textContent=earned.length+' / 3';
  for(const {card,label,reward}of cards){const ready=state.score>=reward.at;card.classList.toggle('earned',ready);label.textContent=ready?'획득 ×1':reward.at+'점';}
  const next=M.rewards.find(r=>state.score<r.at);$('catch-goal').textContent=next?'다음 아이템까지 '+(next.at-state.score)+'점':'가방 준비 완료! 최고 기록에 도전해 봐.';$('catch-pause').disabled=!['running','paused'].includes(state.status);$('catch-pause').textContent=state.status==='paused'?'계속하기':'잠깐 쉬기';
 }
 function finish(){best=Math.max(best,state.score);$('catch-result-score').textContent=state.score.toLocaleString('ko-KR');$('catch-result-detail').textContent='재료 '+state.caught+'개 · 최고 연속 '+state.bestCombo+'개 · 폭탄 '+state.bombs+'회';$('catch-best').textContent='이번 방문 최고 기록 '+best.toLocaleString('ko-KR')+'점';$('catch-result-rewards').replaceChildren();const earned=M.earned(state.score);
  $('catch-result-title').textContent=earned.length?'가방이 든든해졌다!':'조금만 더 연습해 볼까?';for(const reward of earned)$('catch-result-rewards').append(rewardCard(reward).card);if(!earned.length){const note=document.createElement('p');note.textContent='120점을 모으면 첫 포션을 받을 수 있어.';$('catch-result-rewards').append(note);}
  $('catch-result').hidden=false;$('catch-again').focus({preventScroll:true});root.dispatchEvent(new CustomEvent('workshop-catch:finished',{detail:{score:state.score}}));
 }
 function animate(now){if(destroyed||state.status!=='running')return;const dt=Math.max(0,(now-last)/1000);last=now;const events=M.step(state,dt,controls());renderer.feedback(events);renderer.draw(state,Math.min(dt,.1));update();
  for(const event of events)if(event.kind==='reward'){$('catch-toast').textContent=event.reward.name+' 보상 도달!';$('catch-toast').hidden=false;toastUntil=now+1700;}
  if(now>toastUntil)$('catch-toast').hidden=true;
  if(state.status==='finished'){frame=null;finish();return;}frame=requestAnimationFrame(animate);
 }
 function start(){cancelAnimationFrame(frame);keys.clear();target=null;state=M.create();M.start(state);renderer.reset();$('catch-ready').hidden=true;$('catch-result').hidden=true;$('catch-paused').hidden=true;$('catch-toast').hidden=true;last=performance.now();update();renderer.draw(state);frame=requestAnimationFrame(animate);canvas.focus({preventScroll:true});root.GameAudio?.cue('confirm');}
 function pause(){if(state.status!=='running')return;M.pause(state);cancelAnimationFrame(frame);frame=null;keys.clear();target=null;dragging=false;$('catch-paused').hidden=false;update();}
 function resume(){if(state.status!=='paused')return;M.resume(state);$('catch-paused').hidden=true;last=performance.now();frame=requestAnimationFrame(animate);update();canvas.focus({preventScroll:true});}
 $('catch-start').addEventListener('click',start);$('catch-again').addEventListener('click',()=>{if(!root.WorkshopCatchIntegration?.embedded)start();});$('catch-resume').addEventListener('click',resume);$('catch-pause').addEventListener('click',()=>state.status==='paused'?resume():pause());
 function direction(key){return['ArrowLeft','a','A'].includes(key)?'left':['ArrowRight','d','D'].includes(key)?'right':null;}
 document.addEventListener('keydown',event=>{const side=direction(event.key);if(side&&state.status==='running'){event.preventDefault();target=null;keys.add(side);}else if((event.key===' '||event.key==='p'||event.key==='P')&&!event.target.closest?.('button,a')){if(['running','paused'].includes(state.status)){event.preventDefault();state.status==='paused'?resume():pause();}}});
 document.addEventListener('keyup',event=>{const side=direction(event.key);if(side)keys.delete(side);});
 const locate=event=>{const box=canvas.getBoundingClientRect();target=(event.clientX-box.left)/box.width*M.width;};
 canvas.addEventListener('pointerdown',event=>{if(state.status!=='running')return;dragging=true;keys.clear();locate(event);canvas.setPointerCapture(event.pointerId);canvas.focus({preventScroll:true});});canvas.addEventListener('pointermove',event=>{if(dragging&&state.status==='running')locate(event);});
 for(const name of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(name,()=>dragging=false);
 for(const side of ['left','right']){const button=$('catch-'+side);button.addEventListener('pointerdown',event=>{if(state.status!=='running')return;event.preventDefault();target=null;keys.add(side);button.setPointerCapture(event.pointerId);});for(const name of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(name,()=>keys.delete(side));button.addEventListener('keydown',event=>{if([' ','Enter'].includes(event.key)&&state.status==='running'){event.preventDefault();target=null;keys.add(side);}});button.addEventListener('keyup',event=>{if([' ','Enter'].includes(event.key))keys.delete(side);});}
 document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});window.addEventListener('blur',pause);window.addEventListener('pagehide',()=>{destroyed=true;cancelAnimationFrame(frame);keys.clear();});
 root.WorkshopCatchApp={read:()=>({status:state.status,elapsed:state.elapsed,score:state.score,caught:state.caught,bombs:state.bombs,combo:state.combo,player:{...state.player},entities:state.entities.map(item=>({...item})),rewards:M.earned(state.score).map(r=>r.id)}),start,pause,resume};
 renderer.draw(state);update();$('catch-start').disabled=false;
})(window);
