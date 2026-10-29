// Executes bounded AI keyframes. No weapon names or object-specific branches.
window.BattleMotion={mount(arena){
 const canvas=document.createElement('canvas');canvas.className='battle-effect-canvas';canvas.setAttribute('aria-hidden','true');arena.append(canvas);const ctx=canvas.getContext('2d'),pose=BattleWeaponPose.mount(arena);
 const source=document.createElement('canvas');source.width=source.height=192;const ready=Promise.resolve().then(()=>Craft.drawHeldArtwork(source,BattlePreview.weapon.artwork)).catch(()=>false),glyphs=new Map();
 function glyphImage(glyph,element){const key=glyph+element;if(glyphs.has(key))return glyphs.get(key);const material=MotionMaterial.glyphPixels(glyph),image=document.createElement('canvas');image.width=material.width;image.height=material.height;const c=image.getContext('2d'),p=GamePalette.tokens,colors={'1':p.ink,'2':p.dark,'3':Craft.Types.color(element),'4':p.paper};for(const pixel of material.pixels){c.fillStyle=colors[pixel.color];c.fillRect(pixel.x,pixel.y,1,1);}glyphs.set(key,image);return image;}
 const title=document.createElement('div');title.className='rarity-skill-title';title.hidden=true;title.setAttribute('aria-hidden','true');arena.append(title);
 let revision=0,raf=0,finish;
 function cancel(){title.hidden=true;revision++;cancelAnimationFrame(raf);finish?.();finish=undefined;pose.reset();ctx.clearRect(0,0,canvas.width,canvas.height);}
 async function play(move,before,after,options={}){
  cancel();const token=revision,plan=Craft.MotionPlan.normalize(move.motionPlan),director=typeof RarityDirector!=='undefined'?RarityDirector:null,profile=director?.profile(BattlePreview.weapon.rarity,!!move.ultimate)||{lead:0,tail:0,scale:1,trails:0,impactCap:.6};
  const art=await ready;if(token!==revision)return;
  if(!art){const held=document.getElementById('held-battle-weapon');if(held)try{source.getContext('2d').drawImage(held,0,0,192,192);}catch{}}
  const atlasInfo=BattlePreview.weapon.effectAtlas,skillLayout=atlasInfo?.layout==='skill-2x2-v1',emitted=['shot','spray','beam','wave'].includes(move.delivery?.mode);
  let atlas;if(Number.isInteger(move.atlasRow)&&atlasInfo&&(!atlasInfo.readyRows||atlasInfo.readyRows.includes(move.atlasRow))&&(skillLayout||plan.layers.some(l=>l.source==='effect'))){try{const candidate=await BattleSpriteAtlas.loadGenerated(atlasInfo.id,move.element,{allowFadeEmpty:skillLayout,...(atlasInfo.readyRows?{readyRows:atlasInfo.readyRows}:{})});if(MotionMaterial.safeAtlasRow(candidate,move.atlasRow))atlas=candidate;}catch{}if(token!==revision)return;}
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){await options.onContact?.();return;}
  const box=arena.getBoundingClientRect(),center=selector=>{const r=arena.querySelector(selector).getBoundingClientRect();return{x:r.left-box.left+r.width/2,y:r.top-box.top+r.height*.45};};
  const positions={enemy:center('.enemy-fighter'),self:center('.player-fighter'),center:{x:box.width*.5,y:box.height*.5}};
  if(after.feedback?.miss){positions.enemy.y=Math.max(20,positions.enemy.y-70);positions.enemy.x=Math.min(box.width-20,positions.enemy.x+20);}const p=pose.configure(Craft.WeaponRig.normalize(BattlePreview.weapon.rig,BattlePreview.weapon),positions.enemy,source.artworkBounds);positions.hand=p.tip;
  if(profile.title){title.replaceChildren();const tier=document.createElement('small'),name=document.createElement('strong');tier.textContent=profile.label+(profile.ultimate?' · 궁극기':'');name.textContent=move.name;title.append(tier,name);title.style.setProperty('--type-color',Craft.Types.color(move.element));}
  const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.ceil(box.width*dpr);canvas.height=Math.ceil(box.height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
  return new Promise((resolve,reject)=>{finish=resolve;let start,pausedAt,contacted=false;
   const frame=now=>{if(token!==revision)return;try{
    if(start===undefined)start=now;if(pausedAt!==undefined){start+=now-pausedAt;pausedAt=undefined;}
    const elapsed=(now-start)*(Number.isFinite(options.playbackRate)?Math.max(.25,Math.min(1,options.playbackRate)):1),timing=director?director.timeline(profile,plan,elapsed):{t:Math.min(1,elapsed/plan.duration),done:elapsed>=plan.duration,preparing:false},t=timing.t;ctx.clearRect(0,0,canvas.width,canvas.height);
    title.hidden=!profile.title||elapsed>profile.lead+300;
    director?.backdrop(ctx,{w:box.width,h:box.height},profile,elapsed,plan);
    const effectLayer=plan.layers.find(layer=>layer.source==='effect'&&layer.glyph),drawAsset=(context,col,x,y,size,settings={})=>{if(atlas){if(skillLayout)BattleSpriteAtlas.drawFrame(context,atlas,move.atlasRow,col,x,y,size,settings);else BattleSpriteAtlas.draw(context,atlas,move.atlasRow,col/3,x,y,size,settings);}else if(effectLayer){const image=glyphImage(effectLayer.glyph,move.element),fit=MotionMaterial.size(image.width,image.height,size,box.height,3.5*profile.scale);context.save();context.imageSmoothingEnabled=false;context.globalAlpha=settings.alpha??1;context.translate(Math.round(x),Math.round(y));context.rotate(settings.angle||0);context.drawImage(image,-fit.w/2,-fit.h/2,fit.w,fit.h);context.restore();}};
    if(timing.preparing){const layer=effectLayer||plan.layers[0],first=Craft.MotionPlan.sample(layer,layer.frames[0].t,positions,box.width,box.height),q=elapsed/Math.max(1,profile.lead);if(first)drawAsset(ctx,0,first.x,first.y,Math.min(box.height*.22,layer.size*box.width)*(.3+q*.4),{alpha:q*.8});}
    const activeDrawing=plan.layers.some(l=>l.source==='drawing'&&t>=l.frames[0].t&&t<=l.frames.at(-1).t);pose.update({hidden:plan.carrier==='hide'&&activeDrawing&&!emitted});
    for(const layer of plan.layers){const state=Craft.MotionPlan.sample(layer,t,positions,box.width,box.height);if(!state||state.alpha<=0)continue;
     const miss=false,sz=Math.min(layer.size*box.width*state.scale*(layer.source==='drawing'?1:profile.scale),box.height*.55);
     if(t<plan.contact)for(let i=profile.trails;i>0;i--){const previous=Craft.MotionPlan.sample(layer,t-i*.018,positions,box.width,box.height);if(!previous||previous.alpha<=0)continue;const alpha=previous.alpha*.2*(1-i/(profile.trails+1));if(layer.source==='effect'||atlas&&emitted)drawAsset(ctx,0,previous.x,previous.y,Math.min(sz,box.height*.3),{angle:previous.angle,alpha});else cctx(layer,{...previous,alpha},sz,false,layer.crop);}
     if(layer.source==='effect'){
      if(director&&t>=plan.contact&&!miss)continue;
      if(atlas&&skillLayout){if(t<plan.contact)BattleSpriteAtlas.drawFrame(ctx,atlas,move.atlasRow,0,state.x,state.y,Math.min(sz,box.height*.3),{angle:state.angle,alpha:state.alpha});}
      else if(atlas&&t>=plan.contact)BattleSpriteAtlas.draw(ctx,atlas,move.atlasRow??0,.5+(t-plan.contact)/(1-plan.contact)*.49,state.x,state.y-(miss?55:0),sz,{angle:state.angle,alpha:state.alpha});
      else if(layer.glyph){const image=glyphImage(layer.glyph,move.element),fit=MotionMaterial.size(image.width,image.height,sz,box.height,3.5*profile.scale);ctx.save();ctx.imageSmoothingEnabled=false;ctx.globalAlpha=state.alpha;ctx.translate(state.x,state.y-(miss?55:0));ctx.rotate(state.angle);ctx.drawImage(image,-fit.w/2,-fit.h/2,fit.w,fit.h);ctx.restore();}
      continue;
     }
     if(atlas&&emitted){if(t<plan.contact)drawAsset(ctx,0,state.x,state.y,Math.min(sz,box.height*.32),{angle:state.angle,alpha:state.alpha});continue;}
     const crop=layer.crop;cctx(layer,state,sz,miss,crop);
    }
    if(!director&&atlas&&skillLayout&&t>=plan.contact&&!after.feedback?.miss){const layer=plan.layers.find(l=>l.source==='effect')||plan.layers[0],contact=Craft.MotionPlan.sample(layer,plan.contact,positions,box.width,box.height),target=contact||((move.damage||0)>0?positions.enemy:positions.self),q=(t-plan.contact)/(1-plan.contact),col=q<.25?1:q<.65?2:3,size=Math.min(layer.size*box.width*(contact?.scale||1)*1.3,box.height*.6);BattleSpriteAtlas.drawFrame(ctx,atlas,move.atlasRow,col,target.x,target.y,size,{alpha:1});}
    if(director&&t>=plan.contact&&!after.feedback?.miss){const layer=effectLayer||plan.layers[0],contact=Craft.MotionPlan.sample(layer,plan.contact,positions,box.width,box.height),target=contact||((move.damage||0)>0?positions.enemy:positions.self),size=Math.min(layer.size*box.width*(contact?.scale||1)*1.3*profile.scale,box.height*profile.impactCap),margin=size*.55,scene={x:Math.max(margin,Math.min(box.width-margin,target.x)),y:Math.max(margin,Math.min(box.height-margin,target.y)),size,self:!(move.damage>0),miss:false};
     const fragment=(context,index,x,y,sz,settings)=>{const image=atlas?atlas.canvas:effectLayer?glyphImage(effectLayer.glyph,move.element):null;if(!image)return;const tile=atlas?atlas.tile:image.width,tileH=atlas?atlas.tile:image.height,sx=atlas?2*tile:0,sy=atlas?move.atlasRow*tile:0,cx=Math.floor((index%3)*tile/3),cy=Math.floor((Math.floor(index/3)%3)*tileH/3),cw=Math.floor((index%3+1)*tile/3)-cx,ch=Math.floor((Math.floor(index/3)%3+1)*tileH/3)-cy;context.save();context.imageSmoothingEnabled=false;context.globalAlpha=settings.alpha;context.translate(Math.round(x),Math.round(y));context.rotate(settings.angle);context.drawImage(image,sx+cx,sy+cy,cw,ch,-sz/2,-sz/2,sz,sz);context.restore();};
     const previous=Craft.MotionPlan.sample(layer,Math.max(layer.frames[0].t,plan.contact-.035),positions,box.width,box.height);scene.mode=move.delivery?.mode;scene.angle=previous?Math.atan2(target.y-previous.y,target.x-previous.x):0;
     director.impact(ctx,drawAsset,fragment,director.fit(scene,profile,box.width,box.height),profile,timing.impact,plan.duration*(1-plan.contact)+profile.tail);}
    options.onVisualFrame?.({canvas,progress:t,impactMs:timing.impact,impactDuration:plan.duration*(1-plan.contact)+profile.tail});if(token!==revision)return;
    if(!contacted&&t>=plan.contact){if(options.finisher)title.hidden=true;contacted=true;pausedAt=now;Promise.resolve().then(()=>token===revision?options.onContact?.():undefined).then(()=>{if(token!==revision)return;if(options.finisher){finish=undefined;title.hidden=true;pose.reset();ctx.clearRect(0,0,canvas.width,canvas.height);resolve();}else raf=requestAnimationFrame(frame);},error=>{finish=undefined;cancel();reject(error);});return;}
    if(!timing.done)raf=requestAnimationFrame(frame);else{finish=undefined;title.hidden=true;pose.reset();ctx.clearRect(0,0,canvas.width,canvas.height);resolve();}
   }catch(error){finish=undefined;cancel();reject(error);}};
   const cctx=(layer,state,sz,miss,crop)=>{const rect=MotionMaterial.drawingRect(source.artworkBounds,crop,source.width,source.height),scale=sz/Math.max(rect.w,rect.h),w=rect.w*scale,h=rect.h*scale;ctx.save();ctx.imageSmoothingEnabled=true;ctx.globalAlpha=state.alpha;ctx.translate(state.x,state.y-(miss?55:0));ctx.rotate(state.angle);ctx.drawImage(source,rect.x,rect.y,rect.w,rect.h,-w/2,-h/2,w,h);ctx.restore();};
   raf=requestAnimationFrame(frame);
  });
 }
 return{play,cancel};
}};
