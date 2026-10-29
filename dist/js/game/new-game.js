(()=>{let resetting=false;for(const button of document.querySelectorAll('[data-new-game]'))button.addEventListener('click',async()=>{
 if(resetting)return;resetting=true;
 window.dispatchEvent(new Event('game:new-game'));window.Craft?.cancelAnalysis?.();window.Craft?.EvolutionAPI?.cancel?.();button.disabled=true;button.setAttribute('aria-busy','true');if(button.lastChild)button.lastChild.textContent=' 초기화 중…';
 try{await Promise.allSettled([window.Craft?.EffectJobs?.reset(),fetch('/api/evolution/reset',{method:'POST',signal:AbortSignal.timeout(10000)})]);}catch(error){console.error(error.message);}
 finally{try{window.BattleSave?.clear(location.hash);}catch(error){console.error(error.message);}try{window.Craft?.StorageCleanup?.collect({reset:true});}catch(error){console.error(error.message);}location.replace('start.html?newGame='+Date.now());}
});})();
