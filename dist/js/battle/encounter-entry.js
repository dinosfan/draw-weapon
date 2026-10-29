(function(root){
 function mount(arena,{reduced=()=>root.matchMedia?.('(prefers-reduced-motion: reduce)').matches,clock={setTimeout:(...args)=>root.setTimeout(...args),clearTimeout:id=>root.clearTimeout(id)}}={}){
  let active=null;const banner=arena.ownerDocument.createElement('div');banner.className='encounter-banner';banner.hidden=true;banner.setAttribute('aria-hidden','true');arena.append(banner);
  function finish(run,result){if(active!==run)return;active=null;clock.clearTimeout(run.timer);for(const animation of run.animations)try{animation.cancel();}catch{}banner.hidden=true;arena.classList.remove('entry-playing');run.resolve(result);}
  function cancel(){if(active)finish(active,false);}
  function play({stage=0,location=''}={}){
   cancel();if(reduced())return Promise.resolve(true);
   return new Promise(resolve=>{const run={animations:[],resolve,timer:null};active=run;arena.classList.add('entry-playing');banner.textContent='STAGE '+(stage+1)+' · '+location;banner.hidden=false;
    const width=arena.clientWidth||480;
    const slide=(element,distance,duration,delay=0)=>{if(!element?.animate)return;const animation=element.animate([{transform:'translateX('+distance+'px)',opacity:0},{transform:'translateX(0px)',opacity:1}],{duration,delay,easing:'cubic-bezier(.18,.65,.26,1)',fill:'both'});run.animations.push(animation);Promise.resolve(animation.finished).catch(()=>{});};
    try{slide(arena.querySelector('.player-fighter'),-width,1000);slide(arena.querySelector('.enemy-fighter'),width,1000,70);slide(arena.querySelector('.enemy-card'),-width*.35,450,570);slide(arena.querySelector('.player-status'),width*.35,450,620);
     if(banner.animate){const animation=banner.animate([{opacity:0,offset:0},{opacity:1,offset:.18},{opacity:1,offset:.72},{opacity:0,offset:1}],{duration:1250,fill:'both'});run.animations.push(animation);Promise.resolve(animation.finished).catch(()=>{});}
    }catch{finish(run,false);return;}
    // A browser animation may be interrupted; it must never strand the command menu.
    run.timer=clock.setTimeout(()=>finish(run,false),1800);
    Promise.allSettled(run.animations.map(animation=>animation.finished)).then(()=>finish(run,true));
   });
  }
  return{play,cancel};
 }
 const api={mount};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.BattleEncounterEntry=api;
})(typeof window!=='undefined'?window:globalThis);
