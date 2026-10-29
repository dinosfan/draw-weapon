(function(root){
 function create(clock={setTimeout,clearTimeout}){
  let timer=null,resolvePending=null;
  function cancel(){if(timer!==null)clock.clearTimeout(timer);timer=null;if(resolvePending){const resolve=resolvePending;resolvePending=null;resolve(false);}}
  function pause(ms){cancel();return new Promise(resolve=>{resolvePending=resolve;timer=clock.setTimeout(()=>{timer=null;resolvePending=null;resolve(true);},ms);});}
  return{pause,cancel};
 }
 const api={create};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.BattleTurnFlow=api;
})(typeof window!=='undefined'?window:globalThis);
