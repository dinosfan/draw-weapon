window.DragonCinematic={mount(arena){
 const canvas=document.createElement('canvas');canvas.className='dragon-cinematic';canvas.setAttribute('aria-hidden','true');arena.append(canvas);
 const caption=document.createElement('div');caption.className='dragon-cinematic-caption';caption.hidden=true;arena.append(caption);
 const ctx=canvas.getContext('2d'),pose=BattleWeaponPose.mount(arena);let revision=0,raf=0,resolvePending;
 const clamp=n=>Math.max(0,Math.min(1,n));
 function clear(){ctx.clearRect(0,0,canvas.width,canvas.height);}
 function cancel(){revision++;cancelAnimationFrame(raf);clear();caption.hidden=true;arena.classList.remove('dragon-domain');pose.reset();if(resolvePending){resolvePending();resolvePending=null;}}
 function play(move,before,after,options={}){
  cancel();const token=revision;
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return Promise.resolve();
  const rank=Craft.Rarity.get(BattlePreview.weapon.rarity).rank,ultimate=!!move.ultimate;
  const box=arena.getBoundingClientRect(),enemy=arena.querySelector('.enemy-fighter').getBoundingClientRect();
  const target={x:enemy.left-box.left+enemy.width/2,y:enemy.top-box.top+enemy.height*.5};
  const color=Craft.Types.color(move.element),dpr=Math.min(devicePixelRatio||1,2),w=box.width,h=box.height;
  canvas.width=Math.ceil(w*dpr);canvas.height=Math.ceil(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
  pose.configure(BattlePreview.weapon.rig,target);caption.hidden=false;caption.style.setProperty('--dragon-color',color);
  const duration=ultimate?5100:[1150,1500,2150,3100,3300][rank],contactAt=ultimate?.8:.64;
  return new Promise(resolve=>{
   resolvePending=resolve;let start,pausedAt=null,contacted=false;
   function frame(now){
    if(token!==revision)return;if(start===undefined)start=now;if(pausedAt!==null){start+=now-pausedAt;pausedAt=null;}
    const t=clamp((now-start)/duration),prep=clamp(t/.26),strike=clamp((t-(ultimate?.48:.26))/(ultimate?.18:.38)),tail=clamp((t-contactAt)/(1-contactAt));
    clear();ctx.lineWidth=3;const shapes=DragonShapes,miss=after.feedback?.miss;
    const domain=rank>=3&&t>.12&&t<.94;
    if(domain){ctx.save();ctx.globalAlpha=Math.min(ultimate?.92:.72,clamp((t-.12)*5))*(1-clamp((t-.88)*10));ctx.fillStyle=GamePalette.tokens.ink;ctx.fillRect(0,0,w,h);ctx.restore();}
    const label=ultimate?(t<.2?'용왕의 눈이 뜬다':t<.48?'용의 턱이 전장을 봉쇄한다':t<.68?'공간을 가르는 일섬':t<.8?'…':t<.93?'종언':'용왕의 귀환'):(t<.26?['칼날을 세운다','기운이 날에 감긴다','비늘이 깨어난다','용왕의 위압','용의 영역 전개'][rank]:t<.64?['베기','겹쳐지는 잔상','용아 전개','용왕의 참격','공간을 찢는 궤적'][rank]:miss?'빗나갔다':t<.85?'절단':'칼날을 거둔다');
    caption.textContent=(ultimate?'궁극기 · ':move.signature?'고유 기술 · ':'')+move.name+' / '+label;
    const reach=t<contactAt?Math.sin(strike*Math.PI/2):1-tail;
    const point=pose.update({angle:t<.26?-prep*1.1:(-1.1+strike*2.4)*(1-tail),reach:reach*(ultimate?.95:.75)});
    if(rank>0&&t<contactAt)shapes.scales(ctx,point.tip.x,point.tip.y,rank*3,28+rank*9,color,t);
    if(ultimate&&t<.24){
     ctx.save();ctx.globalAlpha=prep;ctx.translate(w*.52,h*.43);ctx.scale(w/450,h/330);
     shapes.polygon(ctx,[[-115,-15],[-30,-35],[40,-15],[-30,12]],color);shapes.polygon(ctx,[[115,-15],[30,-35],[-40,-15],[30,12]],color);
     ctx.fillStyle=GamePalette.tokens.paper;ctx.fillRect(-37,-28,5,28);ctx.fillRect(32,-28,5,28);ctx.restore();
    }
    if(rank>=2&&t>.24&&t<.9){
     const jawScale=(ultimate?Math.min(w/285,h/210):rank===4?1.6:rank===3?1.3:.85);
     const opening=t<contactAt?1-strike*.85:0;
     shapes.jaw(ctx,target.x-(ultimate?55:0),target.y+10,jawScale,opening,color,Math.min(1,(t-.24)*8)*(1-tail));
    }
    if(t>.26&&t<(ultimate?.68:.84)){
     const n=rank+1,scale=30+rank*19;
     for(let i=0;i<n;i++){
      const q=clamp(strike-i*.07),x=point.tip.x+(target.x-point.tip.x)*q,y=point.tip.y+(target.y-point.tip.y)*q;
      const motif=move.cinematic;
      if(motif==='fang'){shapes.crescent(ctx,x-8,y-10,scale,.35+q*2,color,(1-i/n)*.9,4+rank*2);shapes.crescent(ctx,x+8,y+10,scale,-.35+q*2,color,.6,3+rank);}
      else if(motif==='crescent'){shapes.crescent(ctx,target.x,target.y,scale*1.3,-2+q*5,color,(1-i/n)*.9,5+rank*3);}
      else shapes.crescent(ctx,x,y,scale,-1.8+q*2.7,color,(1-i/n)*.9,3+rank*3);
     }
    }
    // A single held blade creates a cut across the field; the weapon itself is never fired.
    if(ultimate&&t>.48&&t<.8){const cut=clamp((t-.48)/.15);ctx.save();ctx.strokeStyle=GamePalette.tokens.paper;ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(w*.08,h*.9);ctx.lineTo(w*.08+w*.84*cut,h*.9-h*.8*cut);ctx.stroke();ctx.strokeStyle=color;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(w*.08+12,h*.9);ctx.lineTo(w*.08+w*.84*cut+12,h*.9-h*.8*cut);ctx.stroke();ctx.restore();}
    if(t>=contactAt&&!miss){
     const alpha=1-tail;ctx.save();ctx.globalAlpha=alpha;ctx.strokeStyle=color;ctx.lineWidth=ultimate?7:3;
     const rays=ultimate?18:4+rank*2;
     for(let i=0;i<rays;i++){const a=i/rays*Math.PI*2,r=15+tail*(ultimate?210:65+rank*20);ctx.beginPath();ctx.moveTo(target.x+Math.cos(a)*r,target.y+Math.sin(a)*r);ctx.lineTo(target.x+Math.cos(a)*(r+15+rank*7),target.y+Math.sin(a)*(r+15+rank*7));ctx.stroke();}ctx.restore();
     if(ultimate&&tail<.45){ctx.save();ctx.globalAlpha=1-tail*2;ctx.fillStyle=GamePalette.tokens.paper;ctx.font='900 32px Pretendard';ctx.textAlign='center';ctx.fillText('종언',w*.48,h*.53);ctx.restore();}
    }
    if(!contacted&&t>=contactAt&&options.onContact){contacted=true;pausedAt=now;Promise.resolve().then(options.onContact).catch(()=>{}).then(()=>{if(token===revision)raf=requestAnimationFrame(frame);});return;}
    if(t<1)raf=requestAnimationFrame(frame);else{resolvePending=null;clear();caption.hidden=true;pose.reset();resolve();}
   }raf=requestAnimationFrame(frame);
  });
 }
 document.addEventListener('visibilitychange',()=>{if(document.hidden)cancel();});return{play,cancel};
}};
