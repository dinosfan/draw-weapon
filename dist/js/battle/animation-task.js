(function(root){
 // Optional visual work has a deadline; it must never own the combat turn.
 function create(clock={setTimeout:(...args)=>root.setTimeout(...args),clearTimeout:id=>root.clearTimeout(id)}){
  const active=new Set();
  function run(task,{timeout=6000,cancel=()=>{}}={}){return new Promise(resolve=>{
   let timer,done=false;
   const finish=result=>{if(done)return;done=true;clock.clearTimeout(timer);active.delete(abort);resolve(result);};
   const abort=()=>{if(done)return;try{cancel();}catch{}finish(false);};active.add(abort);
   timer=clock.setTimeout(abort,timeout);
   Promise.resolve().then(()=>{if(!done)return task();}).then(()=>finish(true),()=>abort());
  });}
  return{run,cancel(){for(const abort of [...active])abort();}};
 }
 const api={create};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.BattleAnimationTask=api;
})(typeof window!=='undefined'?window:globalThis);
