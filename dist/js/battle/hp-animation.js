(function(root){
 const duration=(from,to)=>Math.min(1400,Math.max(600,Math.abs(to-from)*26));
 function create(clock={requestAnimationFrame,cancelAnimationFrame}){
  const jobs=new Map();
  function cancel(key){const job=jobs.get(key);if(!job)return;clock.cancelAnimationFrame(job.raf);jobs.delete(key);job.resolve(false);}
  function play(key,from,to,paint,instant=false){cancel(key);if(instant||from===to){paint(to);return Promise.resolve(true);}paint(from);return new Promise(resolve=>{const job={resolve,raf:0,start:null};jobs.set(key,job);const frame=now=>{if(jobs.get(key)!==job)return;job.start??=now;const t=Math.min(1,(now-job.start)/duration(from,to));paint(from+(to-from)*t);if(t<1)job.raf=clock.requestAnimationFrame(frame);else{jobs.delete(key);paint(to);resolve(true);}};job.raf=clock.requestAnimationFrame(frame);});}
  return{play,cancel,cancelAll(){for(const key of jobs.keys())cancel(key);}};
 }
 let animator;
 function transition(target,character,from,to,showValue){animator??=create();const fill=target.querySelector('.hp-fill'),track=target.querySelector('.hp-track'),value=target.querySelector('.hp-value');fill.style.transition='none';return animator.play(target,from,to,current=>{const hp=Math.max(0,Math.min(character.maxHp,Math.round(current)));fill.style.width=Math.max(0,Math.min(100,hp/character.maxHp*100))+'%';fill.classList.toggle('low',hp<character.maxHp*.3);track.setAttribute('aria-valuenow',hp);if(showValue&&value)value.textContent=hp+' / '+character.maxHp;},root.document.hidden);}
 const api={duration,create,transition,cancelAll(){animator?.cancelAll();}};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.BattleHP=api;
})(typeof window!=='undefined'?window:globalThis);
