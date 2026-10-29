(function(root){
 const text=(s,max=80)=>typeof s==='string'?s.slice(0,max):'',id=s=>typeof s==='string'&&/^[a-z0-9-]{6,100}$/.test(s),integer=(n,min,max)=>Number.isInteger(n)&&n>=min&&n<=max;
 function event(outcome){if(!id(outcome.id)||!text(outcome.enemy?.name)||!integer(outcome.hp,0,100)||!integer(outcome.turns,1,10000)||!integer(outcome.stage,0,99))return null;return{id:outcome.id,at:Date.now(),won:outcome.won===true,enemy:text(outcome.enemy.name),types:Array.isArray(outcome.enemy.types)?outcome.enemy.types.filter(t=>typeof t==='string').slice(0,2):[],hp:outcome.hp,turns:outcome.turns,stage:outcome.stage,final:outcome.stage===outcome.lastStage,finisher:text(outcome.finisher)};}
 function history(entry){return Array.isArray(entry?.history)?entry.history.filter(e=>id(e.id)&&text(e.enemy)&&integer(e.hp,0,100)&&integer(e.turns,1,10000)).slice(0,12):[];}
 function deeds(entry){return Array.isArray(entry?.deeds)?entry.deeds.filter(d=>text(d.id)&&text(d.title)&&text(d.detail)).slice(0,12):[];}
 function inherited(entry){return Array.isArray(entry?.inheritedDeeds)?entry.inheritedDeeds.filter(d=>text(d.id)&&text(d.title)&&text(d.detail)&&text(d.weaponName)).slice(0,24):[];}
 function duplicate(entry,outcome){return id(outcome.id)&&history(entry).some(e=>e.id===outcome.id);}
 function update(entry,outcome){const e=event(outcome);entry.lastEarned=[];if(!e)return entry;entry.history=[e,...history(entry).filter(h=>h.id!==e.id)].slice(0,12);entry.deeds=deeds(entry);if(!e.won)return entry;
  const add=(key,title,detail,priority)=>{if(entry.deeds.some(d=>d.id===key))return;entry.deeds.push({id:key,title,detail,priority,at:e.at,weaponName:entry.name});entry.lastEarned.push(key);};
  if(entry.wins===1)add('first-win','첫 승리를 새긴',e.enemy+'에게 처음 승리했다.',10);
  if(e.types.includes('dragon'))add('dragon-slayer','용을 꺾은',e.enemy+'을 상대로 승리했다.',70);
  if(e.hp===1)add('last-breath','체력 1로 돌아온',e.enemy+'에게 체력 1을 남기고 승리했다.',90);
  if(e.final)add('last-guardian','마지막 수호자를 넘은','마지막 관문의 '+e.enemy+'에게 승리했다.',40);
  if(entry.rarity==='mythic'&&e.final&&e.finisher)add('mythic-finish','신화의 일격을 남긴',e.enemy+'에게 '+e.finisher+' 기술의 신화 결정타를 명중시켜 승리했다.',80);
  if(entry.wins>=10)add('ten-wins','열 번의 승리를 이끈','이 무기로 승리를 10번 기록했다.',50);
  return entry;
 }
 function highlight(entry){const own=deeds(entry).slice().sort((a,b)=>(b.priority||0)-(a.priority||0));if(own.length)return{...own[0],inherited:false};const old=inherited(entry).slice().sort((a,b)=>(b.priority||0)-(a.priority||0));return old.length?{...old[0],inherited:true}:null;}
 function tag(entry){const d=highlight(entry);return d?(d.inherited?'전신의 기록 · ':'')+d.title:'';}
 function session(){return'battle-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8);}
 const api={event,history,deeds,inherited,duplicate,update,highlight,tag,session};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Craft.Chronicle=api;
})(typeof window!=='undefined'?window:globalThis);
