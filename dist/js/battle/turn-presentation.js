(function(root){
 function create(d){
  async function play(before,after,move,action,finalBlow,valid=()=>true){
   const f=after.feedback||{},enemy=d.encounter(before.stage,before),player=d.player;
   const say=async text=>valid()&&await d.dialogue.say(text,{auto:true})&&valid();
   const status=(side,hp,states,note,character)=>d.status(side,character||(side==='enemy'?enemy:player),hp,states,note);
   const visual=(task,cancel,timeout=5000)=>d.visual?d.visual.run(task,{cancel,timeout}):task();
   const lines=f.playerMessages||[d.weapon.name+'의 '+(move?.name||'공격')+'!'];
   const announcement=Math.max(0,f.actionMessage?lines.indexOf(f.actionMessage):0);
   for(const [i,line]of lines.slice(0,announcement+1).entries())if(!await say(line,i===announcement&&!f.prevented))return false;
   let contacted=false,contactTask,hpTask=Promise.resolve();
   function contact(){
    if(contacted||!valid())return contactTask||Promise.resolve();contacted=true;
    d.conditions.update('enemy',f.enemyStatusAfter);d.conditions.update('player',f.playerStatusAfter);d.sound.contact(move,f);
    const strike=visual(()=>finalBlow?d.finisher.play(d.weapon,move,f):d.impact.play(move||{feel:'soft'},f),()=>{d.impact.cancel?.();d.finisher.cancel?.();});
    hpTask=(async()=>{if(!await d.pause(130)||!valid())return;await Promise.all([status('enemy',f.enemyAfterAction??Math.max(0,before.enemyHp-(f.hit||0)),f.enemyStatusAfter),status('player',f.playerAfter??before.hp,f.playerStatusAfter)]);})();contactTask=strike;return contactTask;
   }
   if(move){d.acting?.('player',true);try{d.sound.start(move);await visual(()=>d.effects.play(move,before,after,{onContact:contact,finisher:finalBlow}),()=>d.effects.cancel?.(),Math.min(14000,Math.max(6000,(move.motionPlan?.duration||0)+5000)));if(!valid())return false;await contact();await hpTask;}finally{d.acting?.('player',false);}}
   else{
    if(f.prevented)d.conditions.blocked('player');
    if(f.selfDamage)await visual(()=>d.impact.play({feel:'pulse',element:'normal'},{counter:f.selfDamage},true),()=>d.impact.cancel?.());
    if(!valid())return false;await status('player',f.playerAfter??before.hp,f.playerStatusAfter);
   }
   for(const line of lines.slice(announcement+1)){if(line==='상대의 반격을 멈췄다!'&&f.enemyPrevented)continue;if(!await say(line))return false;}
   if(!valid())return false;
   if(f.enemyActed||f.enemyPrevented){
    const enemyMove=d.enemyIntent(before);
    if(!await say(f.enemyPrevented?f.enemyPreventionMessage:enemy.name+'의 '+f.enemyMoveName+'!',!f.enemyPrevented))return false;
    if(f.enemyPrevented)d.conditions.blocked('enemy');
    if(f.enemySelfDamage){await visual(()=>d.impact.play({feel:'pulse',element:'normal'},{hit:f.enemySelfDamage}),()=>d.impact.cancel?.());if(!valid())return false;await status('enemy',f.enemyAfterCounter??(f.phaseChange?0:after.enemyHp),f.enemyStatusAfterCounter);}
    if(f.enemyImmune){if(!await say('상대에게 효과가 없다!'))return false;}
    else if(f.counter||f.blocked){d.acting?.('enemy',true);try{d.sound.contact(enemyMove,f,true);const strike=visual(()=>d.impact.play({feel:'pulse',element:enemyMove.element},f,true),()=>d.impact.cancel?.());if(!await d.pause(130)||!valid())return false;await Promise.all([strike,status('player',f.playerAfterCounter??after.hp,f.playerStatusAfterCounter)]);}finally{d.acting?.('enemy',false);}
     d.conditions.update('player',f.playerStatusAfterCounter);
     if(!await say(f.blocked?'상대의 공격을 막았다!':f.counter+' 피해를 입었다!'))return false;
    }else if(f.enemyActed&&!await say(enemy.name+'는 잠시 숨을 고르고 있다.'))return false;
    for(const line of f.enemyMessages||[])if(!await say(line))return false;
   }
   for(const event of f.endTurn||[]){
    if(!await say(event.message))return false;
    await visual(()=>d.impact.play({feel:'soft',element:event.status==='burn'?'fire':'poison'},{...(event.side==='player'?{counter:event.damage}:{hit:event.damage}),label:d.conditionName(event.status)},event.side==='player'),()=>d.impact.cancel?.());
    if(!valid())return false;await status(event.side,event.hp,d.conditionList(after,event.side));
   }
   if(f.phaseChange){
    if(!await say(f.phaseChange.message))return false;
    d.phaseStart(after);try{await status('enemy',after.enemyHp,[],'2페이즈',d.encounter(after.stage,after));if(!await d.pause(1000)||!valid())return false;}finally{d.phaseEnd();}
    if(!await say(f.phaseChange.name+' · 2페이즈!'))return false;
   }
   if(after.ended){if(!await say((after.hp===0?d.weapon.name:enemy.name)+'의 힘이 다했다!'))return false;if(after.enemyHp===0&&!await say('수호자에게 승리했다!'))return false;}
   return valid();
  }
  return{play};
 }
 const api={create};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.BattleTurnPresentation=api;
})(typeof window!=='undefined'?window:globalThis);
