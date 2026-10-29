(function(root){
 const clamp=n=>Math.max(0,Math.min(1,n));
 function plan(rank,ultimate=false){return{duration:ultimate?3200:[850,1050,1350,1850,2050][rank],contact:ultimate?.66:.58,rank,ultimate};}
 function sample(plan,t){
  const {ultimate,contact}=plan,launch=ultimate?.3:.2,cutEnd=ultimate?.53:contact;
  return{phase:t<launch?'prepare':t<cutEnd?'strike':t<contact?'hold':'impact',prepare:clamp(t/launch),strike:clamp((t-launch)/(cutEnd-launch)),impact:clamp((t-contact)/(1-contact)),summon:clamp((t-(ultimate?.08:.19))/(ultimate?.38:.38)),active:t>=launch&&t<contact,contact:t>=contact};
 }
 const api={clamp,plan,sample};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.DragonTimeline=api;
})(typeof window!=='undefined'?window:globalThis);
