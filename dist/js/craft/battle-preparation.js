(function(root){
 // Generation starts in the workshop. Only an explicit departure opens loading.
 function create({loading,startEffects,onUpdate=()=>{},onReady=()=>{},onError=()=>{},enter,clock={setTimeout:(...args)=>root.setTimeout(...args),clearTimeout:id=>root.clearTimeout(id)},minimum=500}){
  let epoch=0,weapon=null,status='idle',error=null,waiting=false,registered=false,early=false,timer=null,notBefore=0,lastMessage='';
  function reset(){epoch++;waiting=false;weapon=null;status='idle';error=null;registered=false;early=false;clock.clearTimeout(timer);timer=null;loading.hide();}
  function depart(){if(!waiting||!registered||status!=='ready'&&!early)return;clock.clearTimeout(timer);const delay=Math.max(0,notBefore-Date.now());if(delay){timer=clock.setTimeout(depart,delay);return;}waiting=false;enter(weapon);}
  function run(regenerate=false){const token=epoch,current=weapon;status='generating';error=null;registered=false;lastMessage='기술 도트를 준비하고 있어…';
   const valid=()=>token===epoch&&weapon===current;
   return Promise.resolve().then(()=>startEffects(current,{regenerate,onRegistered(){if(!valid())return;registered=true;onUpdate(current);depart();},onProgress(message){if(!valid())return;lastMessage=message;onUpdate(current,message);if(waiting)loading.update(message,current);}})).then(()=>{
    if(!valid())return;registered=true;status='ready';onReady(current);if(waiting){loading.done(current);depart();}
   }).catch(failure=>{if(!valid())return;registered=true;status='failed';error=failure;onError(failure,current);if(waiting){loading.fail(failure);depart();}});
  }
  function prepare(current,{effects=true}={}){reset();weapon=current;if(!effects){status='ready';registered=true;return Promise.resolve();}return run();}
  function request(){if(!weapon)return;waiting=true;early=false;notBefore=Date.now()+minimum;
   loading.beginBattle(weapon,{enter:()=>{early=true;depart();},back:()=>{waiting=false;early=false;clock.clearTimeout(timer);},retry:()=>retry()});
   if(status==='ready'){loading.done(weapon);depart();}else if(status==='failed')loading.fail(error);else loading.update(lastMessage,weapon);
  }
  function retry(){if(!weapon||status==='generating')return;const task=run(true);if(waiting)loading.update('완성된 기술은 유지하고 도트만 다시 준비하고 있어…',weapon);return task;}
  return{prepare,request,retry,reset,read:()=>({status,waiting,registered})};
 }
 const api={create};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Craft.BattlePreparation=api;
})(typeof window!=='undefined'?window:globalThis);
