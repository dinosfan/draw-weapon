// Presentation only. Creation, combat, transfer and saves stay in their existing modules.
(()=>{
 const $=id=>document.getElementById(id),world=$('game-world');if(!world)return;const workshop=!!$('drawing-canvas');GameScenery.paint(world,workshop?'workshop':'battle');
 if(workshop){
  TrainerStudy.draw($('workshop-trainer'));const toggle=$('craft-settings-toggle'),settings=$('craft-settings');const close=()=>{settings.hidden=true;toggle.setAttribute('aria-expanded','false');};toggle.addEventListener('click',()=>{settings.hidden=!settings.hidden;toggle.setAttribute('aria-expanded',String(!settings.hidden));});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!settings.hidden){close();toggle.focus();}});
  const canvas=$('drawing-canvas'),board=canvas.parentElement,fit=()=>{if(!board.clientWidth||!board.clientHeight)return;const size=GameStageLayout.fitDrawing(board.clientWidth,board.clientHeight,canvas.width,canvas.height);canvas.style.width=size.width+'px';canvas.style.height=size.height+'px';};new ResizeObserver(fit).observe(board);fit();
  const reveal=$('reveal-view'),update=()=>{const done=!reveal.hidden;document.querySelector('.live-workshop').classList.toggle('is-revealed',done);$('battle-ready').hidden=!done;$('craft-step-caption').textContent=done?'무기 완성 · 모험을 시작하자':'낙서 준비 · 어떤 그림이든 좋아';};new MutationObserver(update).observe(reveal,{attributes:true,attributeFilter:['hidden']});update();
 }else{
  let sceneryKey='0:0';
  const actor=document.querySelector('.enemy-fighter'),sprite=$('enemy-sprite'),layout=GameStageLayout.attach($('arena'),actor,sprite),original=BattlePreview.drawSprites;BattlePreview.presentationOrder=['attack','guard','bag','skill'];
  BattlePreview.drawSprites=function(stage,state){original(stage,state);const phase=state?.bossPhase||0,key=(stage||0)+':'+phase;if(key!==sceneryKey){GameScenery.paint(world,'battle',{stage:stage||0,phase});sceneryKey=key;}layout.align();document.querySelectorAll('.route-pips i').forEach((pip,index)=>pip.classList.toggle('current',index===(stage||0)));};
 }
})();
