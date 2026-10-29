(function(root){
 function label(job,elapsed=0){
  if(job.status==='queued'){const seconds=Math.max(0,Math.floor(elapsed/1000)),time=Math.floor(seconds/60)+'분 '+String(seconds%60).padStart(2,'0')+'초';return(job.finishingCancelled?'이전 게임의 마지막 생성 장면을 정리하고 있어':'로컬 생성기 차례를 기다리고 있어')+' · 대기 '+time+' · 곧 자동 시작';}
  if(job.status==='running'&&job.phase==='queued'&&job.message==='로컬 도트 생성 차례를 기다리고 있어…')return'내 무기의 로컬 생성기를 준비하고 있어…';
  return job.message||'로컬 도트를 생성하고 있어…';
 }
 const api={label};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Craft.EffectProgress=api;
})(typeof window!=='undefined'?window:globalThis);
