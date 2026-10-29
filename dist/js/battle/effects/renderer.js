// Route physical weapons through separate carrier/ammunition animation.
BattleEffects.mount=arena=>{
  const actions=BattleActions.mount(arena),stories=BattleStories.mount(arena);
  const rarity=window.BattleRarity?.mount(arena);
  const dragon=window.DragonCinematic?.mount(arena);
  const generated=window.GeneratedOverlay?.mount(arena);
  const motion=window.BattleMotion?.mount(arena);
  function cancel(){actions.cancel();stories.cancel();rarity?.cancel();dragon?.cancel();generated?.cancel();motion?.cancel();}
  async function play(move,before={},after={},options={}){
    cancel();const originalContact=options.onContact;if(originalContact)options={...options,onContact:()=>{if(!move.motionPlan&&!BattlePreview.weapon.effectAtlas&&after.feedback?.hit>0)rarity?.pulse(move);return originalContact();}};const plan=Craft.WeaponRig.forMove(move,BattlePreview.weapon);
    if(motion&&move.motionPlan)return motion.play(move,before,after,options);
    if(generated&&BattlePreview.weapon.effectAtlas&&Number.isInteger(move.atlasRow)){const run=opts=>plan.rig.family==='clock'&&plan.mode==='time'&&move.story?stories.play(move,before,after,opts.onContact):actions.play(move,before,after,opts);return generated.play(move,before,after,options,run);}
    if(dragon&&BattlePreview.weapon.study==='dragon-scythe'&&move.cinematic)return dragon.play(move,before,after,options);
    if(plan.rig.family==='clock'&&plan.mode==='time'&&move.story)return stories.play(move,before,after,options.onContact);
    return actions.play(move,before,after,options);
  }
  document.addEventListener('visibilitychange',()=>{if(document.hidden)cancel();});
  return{play,cancel};
};
