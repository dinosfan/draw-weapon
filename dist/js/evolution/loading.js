(function(root){
 function mount(){
  const panel=document.createElement('section');panel.className='api-loading evolution-loading';panel.hidden=true;panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-labelledby','evolution-loading-title');
  panel.innerHTML='<div class="api-loading-panel"><div class="api-loading-top"><span>이딴게 무기?</span><span class="evolution-loading-time">00:00</span></div><h2 id="evolution-loading-title">선택한 진화를<br>준비하고 있어</h2><div class="api-loading-art"><img class="evolution-loading-image" alt="선택한 진화 외형"></div><strong class="evolution-loading-name"></strong><p class="api-loading-status" role="status" aria-live="polite"></p><ol class="api-loading-steps"><li>선택 확인</li><li>기술 정리</li><li>도트 준비</li><li>진화 준비</li></ol><p class="api-loading-tip">읽어본 기술을 그대로 이어서 준비하고 있어.<br>준비가 끝나면 진화의 순간이 시작돼.</p></div>';
  document.body.append(panel);const find=s=>panel.querySelector(s),steps=[...panel.querySelectorAll('.api-loading-steps li')];let timer=null,started=0,previousFocus,previousOverflow='';
  function hide(){if(panel.hidden)return;panel.hidden=true;clearInterval(timer);timer=null;document.body.style.overflow=previousOverflow;root.GameAudio?.loading(false);}
  function step(index,message){steps.forEach((node,i)=>{node.classList.toggle('current',i===index);node.classList.toggle('complete',i<index);});if(message)find('.api-loading-status').textContent=message;}
  function begin(base,option){if(panel.hidden){previousFocus=document.activeElement;previousOverflow=document.body.style.overflow;root.GameAudio?.loading(true);}clearInterval(timer);panel.hidden=false;document.body.style.overflow='hidden';find('.evolution-loading-image').src=option.image||base.artwork;find('.evolution-loading-name').textContent=option.name;step(1,'선택한 진화의 기술과 외형을 준비하고 있어…');started=Date.now();const tick=()=>{const seconds=Math.floor((Date.now()-started)/1000);find('.evolution-loading-time').textContent=String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');};tick();timer=setInterval(tick,1000);panel.tabIndex=-1;panel.focus({preventScroll:true});}
  function update(message){if(!panel.hidden&&message)find('.api-loading-status').textContent=message;}
  function fail(){hide();previousFocus?.focus?.({preventScroll:true});}
  panel.addEventListener('keydown',event=>{if(event.key==='Tab'){event.preventDefault();panel.focus({preventScroll:true});}});
  root.addEventListener('game:new-game',hide);root.addEventListener('pagehide',hide);return{begin,step,update,hide,fail};
 }
 root.Craft.EvolutionLoading={mount};
})(window);
