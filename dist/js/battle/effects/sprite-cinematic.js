window.DragonCinematic={mount(arena){
 const canvas=document.createElement('canvas');canvas.className='dragon-cinematic';canvas.setAttribute('aria-hidden','true');arena.append(canvas);
 const caption=document.createElement('div');caption.className='dragon-cinematic-caption';caption.hidden=true;arena.append(caption);
 const ctx=canvas.getContext('2d'),pose=BattleWeaponPose.mount(arena),sound=window.BattleVfxSound?.mount();let revision=0,raf=0,resolvePending;
 const {clamp}=DragonTimeline;
 function clear(){ctx.clearRect(0,0,canvas.width,canvas.height);}
 function cancel(){revision++;cancelAnimationFrame(raf);clear();caption.hidden=true;canvas.removeAttribute('data-phase');pose.reset();sound?.stop();if(resolvePending){resolvePending();resolvePending=null;}}
 const variant=BattlePreview.weapon.studyVariant==='storm'?'storm':'fang';
 if(BattlePreview.weapon.study==='dragon-scythe')BattleSpriteAtlas.load(variant,'dragon').catch(()=>{});
 const toggle=document.getElementById('vfx-sound-toggle');
 if(toggle&&sound)toggle.onclick=async()=>{const enabled=await sound.toggle();toggle.textContent=enabled?'효과음 끄기':'효과음 켜기';toggle.setAttribute('aria-pressed',String(enabled));};
 async function play(move,before={},after={},options={}){
  cancel();const token=revision;if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const atlas=await BattleSpriteAtlas.load(variant,move.element);if(token!==revision)return;
  const rank=Craft.Rarity.get(BattlePreview.weapon.rarity).rank,ultimate=!!move.ultimate,plan=DragonTimeline.plan(rank,ultimate);
  const box=arena.getBoundingClientRect(),enemy=arena.querySelector('.enemy-fighter').getBoundingClientRect(),w=box.width,h=box.height;
  const target={x:enemy.left-box.left+enemy.width/2,y:enemy.top-box.top+enemy.height*.5},dpr=Math.min(devicePixelRatio||1,2),color=Craft.Types.color(move.element);
  canvas.width=Math.ceil(w*dpr);canvas.height=Math.ceil(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);ctx.imageSmoothingEnabled=false;
  pose.configure(BattlePreview.weapon.rig,target);caption.style.setProperty('--dragon-color',color);caption.dataset.ultimate=String(ultimate);caption.textContent=(ultimate?'궁극기 / ':move.signature?'고유 기술 / ':'')+move.name;sound?.prepare(ultimate);
  return new Promise(resolve=>{
   resolvePending=resolve;let start,pausedAt=null,contacted=false,swung=false;
   function frame(now){
    if(token!==revision)return;if(start===undefined)start=now;if(pausedAt!==null){start+=now-pausedAt;pausedAt=null;}
    const t=clamp((now-start)/plan.duration),f=DragonTimeline.sample(plan,t),miss=!!after.feedback?.miss,fade=1-f.impact;
    clear();canvas.dataset.phase=f.phase;caption.hidden=rank<3||t>.35;
    const dark=rank>=3?clamp(t*9)*(ultimate?.88:.68)*(1-clamp((f.impact-.5)*2)):0;
    if(dark){ctx.save();ctx.globalAlpha=dark;ctx.fillStyle=GamePalette.tokens.ink;ctx.fillRect(0,0,w,h);ctx.restore();}
    if(ultimate){ctx.fillStyle=GamePalette.tokens.ink;ctx.fillRect(0,0,w,14);ctx.fillRect(0,h-14,w,14);}
    const reach=f.phase==='prepare'?0:f.phase==='impact'?1-f.impact:Math.sin(f.strike*Math.PI/2);
    const p=pose.update({angle:f.phase==='prepare'?-f.prepare*1.35:(-1.35+f.strike*2.65)*fade,reach:reach*(rank>=3?.88:.72)});
    const draw=(row,q,x,y,size,opts)=>BattleSpriteAtlas.draw(ctx,atlas,row,q,x,y,size,opts);
    const size=Math.min(w*.62,[125,165,220,285,330][rank]);
    if(t<(ultimate?.3:.2)&&rank>0)draw(0,f.prepare*.27,p.tip.x,p.tip.y,52+rank*13,{alpha:f.prepare*.8,angle:-.55});
    if(rank>=2&&t>(ultimate?.07:.2)&&t<plan.contact+.07){
     const x=ultimate?w*.55:target.x-size*.15,y=ultimate?h*.49:target.y;
     const q=ultimate?clamp((t-.07)/.53):clamp((t-.2)/.44);
     draw(2,q,x,y,ultimate?Math.min(w*.75,h*1.16):size*1.16,{alpha:Math.min(1,f.summon*5)*fade});
    }
    if(f.active||f.phase==='hold'){
     if(!swung){swung=true;sound?.swing(rank);}
     const x=p.tip.x+(target.x-p.tip.x)*f.strike,y=p.tip.y+(target.y-p.tip.y)*f.strike-(miss?55:0);
     const row=move.cinematic==='fang'?1:0,angle=move.cinematic==='crescent'?-.7+f.strike*1.1:move.cinematic==='scales'?.25:-.25;
     if(rank>0)draw(row,Math.max(0,f.strike-.1),x-22,y+10,size,{alpha:.3*fade,angle:angle-.18});
     draw(row,f.phase==='hold'?.46:f.strike*.7,x,y,ultimate?size*1.35:size,{angle,alpha:fade});
     if(move.cinematic==='crescent'&&rank>=2)draw(0,f.strike*.7,target.x,target.y,size*1.18,{angle:angle+1.2,alpha:.65*fade});
    }
    if(f.phase==='impact'&&!miss){
     const row=ultimate||move.cinematic==='judgment'?3:move.cinematic==='fang'?1:0;
     draw(row,f.impact,target.x,target.y,ultimate?Math.min(w*.75,h*1.25):size*1.1,{alpha:fade});
     if(ultimate&&f.impact<.55)draw(2,.55+f.impact*.8,w*.55,h*.45,h*.95,{alpha:.45*fade});
    }
    if(!contacted&&f.contact&&options.onContact){contacted=true;if(!miss)sound?.hit(rank,ultimate);pausedAt=now;Promise.resolve().then(options.onContact).catch(()=>{}).then(()=>{if(token===revision)raf=requestAnimationFrame(frame);});return;}
    if(t<1)raf=requestAnimationFrame(frame);else{resolvePending=null;clear();caption.hidden=true;canvas.removeAttribute('data-phase');pose.reset();resolve();}
   }raf=requestAnimationFrame(frame);
  });
 }
 document.addEventListener('visibilitychange',()=>{if(document.hidden)cancel();});return{play,cancel};
}};
