(function(root){
 function mount(){let frame=null,overlay=null,resolve=null,currentHash='',claimed=false,epoch=0,priorFocus;
  function cancel(){epoch++;if(overlay){overlay.remove();overlay=null;frame=null;document.body.style.overflow='';root.GameAudio?.setVisible(!document.hidden);}if(resolve){resolve(false);resolve=null;}priorFocus?.focus?.({preventScroll:true});}
  function play(hash){if(Craft.Supplies.read(hash).claimed)return Promise.resolve(true);cancel();const token=epoch;currentHash=hash;claimed=false;priorFocus=document.activeElement;
   overlay=document.createElement('section');overlay.className='craft-minigame';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','전투 준비 · 1분 재료 줍기');const back=document.createElement('button');back.type='button';back.className='craft-minigame-back';back.textContent='공방으로 돌아가기';back.addEventListener('click',cancel);frame=document.createElement('iframe');frame.title='공방 재료 줍기 · 60초';frame.src='workshop-catch.html?embedded=1';overlay.append(back,frame);document.body.append(overlay);document.body.style.overflow='hidden';root.GameAudio?.setVisible(false);frame.focus();return new Promise(r=>{if(token===epoch)resolve=r;else r(false);});
  }
  root.addEventListener('message',event=>{if(!frame||event.source!==frame.contentWindow||event.origin!==location.origin)return;const data=event.data;if(data?.type==='workshop-catch:finish'){
   try{const record=Craft.Supplies.claim(currentHash,data.score);claimed=true;frame.contentWindow.postMessage({type:'workshop-catch:claimed',items:record.items},location.origin);}catch(error){frame.contentWindow.postMessage({type:'workshop-catch:error',message:error.message||'보상을 저장하지 못했어. 다시 눌러 줘.'},location.origin);}
  }else if(data?.type==='workshop-catch:continue'&&claimed){const done=resolve;resolve=null;cancel();done?.(true);}});
  root.addEventListener('game:new-game',cancel);root.addEventListener('pagehide',cancel);return{play,cancel};
 }
 root.Craft.Minigame={mount};
})(window);
