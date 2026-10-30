(function(root){
 function create({loading,play,minimum=500,clock={setTimeout:(...a)=>root.setTimeout(...a),clearTimeout:id=>root.clearTimeout(id)},now=()=>Date.now()}){
  let ready=null,waiting=false,stopped=false,timer=null,notBefore=0,index=1,message='선택한 진화를 준비하고 있어…';
  function advance(){if(stopped||!waiting||!ready)return;clock.clearTimeout(timer);const delay=Math.max(0,notBefore-now());if(delay){timer=clock.setTimeout(advance,delay);return;}waiting=false;const result=ready;ready=null;loading?.hide();play(result);}
  function request(base,option){if(stopped||waiting)return;waiting=true;notBefore=now()+minimum;loading?.begin(base,option);loading?.step(index,message);advance();}
  function progress(step,text){index=step;if(text)message=text;if(waiting)loading?.step(index,message);}
  function prepared(result){if(stopped)return;ready=result;progress(3,'진화 준비 완료!');advance();}
  function fail(){if(stopped)return;waiting=false;ready=null;clock.clearTimeout(timer);loading?.fail();}
  function stop(){stopped=true;waiting=false;ready=null;clock.clearTimeout(timer);loading?.hide();}
  return{request,progress,prepared,fail,stop};
 }
 const api={create};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Craft.EvolutionDeparture=api;
})(typeof window!=='undefined'?window:globalThis);
