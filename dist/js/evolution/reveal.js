window.EvolutionReveal=(()=>{
 function mount({stage,before,after,onComplete}){let revision=0,timer;
  function reset(){window.GameAudio?.stopCues();revision++;clearTimeout(timer);stage.classList.remove('evolving','evolved');before.hidden=false;after.hidden=true;}
  function play(src){reset();window.GameAudio?.evolution(true);const token=revision;after.src=src;stage.classList.add('evolving');timer=setTimeout(()=>{if(token!==revision)return;before.hidden=true;after.hidden=false;stage.classList.remove('evolving');stage.classList.add('evolved');window.GameAudio?.evolution(false);onComplete();},matchMedia('(prefers-reduced-motion:reduce)').matches?0:2200);}
  return{play,reset};
 }
 return{mount};
})();
