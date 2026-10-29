(function(root){
 function create(view,clock={setTimeout:(...args)=>root.setTimeout(...args),clearTimeout:id=>root.clearTimeout(id)},speed=22){
  let timer=null,pending=null,letters=[],count=0,typing=false,auto=false,hold=450;
  function finish(value){if(timer!==null)clock.clearTimeout(timer);timer=null;typing=false;view.ready(false,false);const resolve=pending;pending=null;resolve?.(value);}
  function reveal(){if(timer!==null)clock.clearTimeout(timer);timer=null;count=letters.length;typing=false;view.draw(letters.join(''));view.ready(true,false);if(auto)timer=clock.setTimeout(()=>finish(true),hold);}
  function tick(){timer=null;if(!pending)return;count++;view.draw(letters.slice(0,count).join(''));if(count>=letters.length)reveal();else timer=clock.setTimeout(tick,speed);}
  function show(message,options={}){finish(false);auto=!!options.auto;hold=Number.isFinite(options.hold)?Math.max(0,options.hold):450;letters=Array.from(String(message));count=0;typing=letters.length>0;return new Promise(resolve=>{pending=resolve;view.draw('');view.ready(true,typing);if(!typing||speed===0)reveal();else timer=clock.setTimeout(tick,speed);});}
  function advance(){if(!pending)return false;if(typing)reveal();else finish(true);return true;}
  return{show,advance,cancel:()=>finish(false),active:()=>!!pending};
 }
 function mount(target){
  let text,announcement;
  target.setAttribute('aria-live','off');target.setAttribute('aria-label','자동으로 진행되는 전투 대사');
  const player=create({draw(value){if(text)text.textContent=value;},ready(active,typing){target.classList.toggle('dialogue-typing',active&&typing);if(active&&!typing&&announcement)announcement.textContent=text.textContent;}},undefined,18);
  function say(message,options={}){player.cancel();BattlePreview.renderDialogue(target,'');text=target.querySelector('.dialogue-text');text.setAttribute('aria-live','off');announcement=document.createElement('span');announcement.className='sr-only';announcement.setAttribute('role','status');target.append(announcement);return player.show(message,{auto:true,hold:options.hold??Math.min(1000,Math.max(450,Array.from(String(message)).length*14))});}
  return{say,idle:message=>say(message,{hold:0}),cancel:player.cancel,active:player.active,destroy:player.cancel};
 }
 const api={create,mount};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.BattleDialogue=api;
})(typeof window!=='undefined'?window:globalThis);
