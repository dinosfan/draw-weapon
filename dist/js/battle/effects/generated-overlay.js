window.GeneratedOverlay={mount(arena){
 const canvas=document.createElement('canvas');canvas.className='battle-effect-canvas generated-effect-canvas';canvas.setAttribute('aria-hidden','true');arena.append(canvas);const ctx=canvas.getContext('2d');let revision=0,raf=0,finish;
 function cancel(){revision++;cancelAnimationFrame(raf);ctx.clearRect(0,0,canvas.width,canvas.height);finish?.();finish=undefined;}
 async function play(move,before,after,options,run){
  cancel();const token=revision;
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return run(options);
  const atlas=await BattleSpriteAtlas.loadGenerated(BattlePreview.weapon.effectAtlas.id,move.element);if(token!==revision)return;
  const self=['protect','recover','attackUp','defenseUp','charge','rewind'].includes(move.rule?.kind),box=arena.getBoundingClientRect(),rect=arena.querySelector(self?'.player-fighter':'.enemy-fighter').getBoundingClientRect();
  const x=rect.left-box.left+rect.width/2,y=rect.top-box.top+rect.height*.45-(after.feedback?.miss?55:0),rank=Craft.Rarity.get(BattlePreview.weapon.rarity).rank,dpr=Math.min(devicePixelRatio||1,2);
  canvas.width=Math.ceil(box.width*dpr);canvas.height=Math.ceil(box.height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);let hitAt;
  const director=window.RarityDirector,staging=director?director.profile(BattlePreview.weapon.rarity,!!move.ultimate):GeneratedStaging.plan(rank,!!move.ultimate),scene={x,y,w:box.width,h:box.height,self,miss:!!after.feedback?.miss,delivered:['shot','spray','throw'].includes(move.delivery?.mode)},tail=new Promise(resolve=>finish=resolve);
  function paint(now){if(token!==revision)return;ctx.clearRect(0,0,canvas.width,canvas.height);
   if(hitAt!==undefined){const elapsed=now-hitAt;if(director){const draw=(context,col,xx,yy,size,settings)=>BattleSpriteAtlas.draw(context,atlas,move.atlasRow,col/3,xx,yy,size,settings),fragments=(context,i,xx,yy,size,settings)=>{context.save();context.imageSmoothingEnabled=false;context.globalAlpha=settings.alpha;context.translate(xx,yy);context.rotate(settings.angle);const cell=atlas.tile/3;context.drawImage(atlas.canvas,2*atlas.tile+i%3*cell,move.atlasRow*atlas.tile+Math.floor(i/3)%3*cell,cell,cell,-size/2,-size/2,size,size);context.restore();};director.impact(ctx,draw,fragments,director.fit({...scene,size:Math.min(box.height*staging.impactCap,145*staging.scale)},staging,box.width,box.height),staging,elapsed,staging.tail);}else GeneratedStaging.paint(ctx,atlas,move,scene,elapsed,staging,BattleSpriteAtlas.draw);if(elapsed>=staging.tail){finish?.();finish=undefined;return;}}
   raf=requestAnimationFrame(paint);
  }
  raf=requestAnimationFrame(paint);
  const drawPayload=(context,p)=>BattleSpriteAtlas.draw(context,atlas,move.atlasRow,0,p.x,p.y,p.mode==='spray'?28:64+rank*7,{angle:p.angle,alpha:1});
  const drawAction=(context,p)=>{const support=['ward','mend'].includes(p.mode),travels=p.mode==='wave',end=support?p.self:p.target,q=p.progress,pos=travels?{x:p.origin.x+(end.x-p.origin.x)*q,y:p.origin.y+(end.y-p.origin.y)*q}:end;BattleSpriteAtlas.draw(context,atlas,move.atlasRow,q*.4,pos.x,pos.y,100+rank*20,{alpha:Math.min(1,q*6)});};
  try{const result=await run({...options,drawPayload,drawAction,onContact:()=>{if(hitAt!==undefined)return;hitAt=performance.now();return options.onContact?.();}});if(hitAt!==undefined&&token===revision)await tail;return result;}finally{if(token===revision)cancel();}
 }
 return{play,cancel};
}};
