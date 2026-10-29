window.BattleActions={};
BattleActions.mount=arena=>{
  const canvas=document.createElement('canvas');canvas.className='battle-effect-canvas';canvas.setAttribute('aria-hidden','true');arena.append(canvas);
  const caption=document.createElement('div');caption.className='story-caption';caption.hidden=true;const step=document.createElement('small'),label=document.createElement('strong');caption.append(step,label);arena.append(caption);
  const ctx=canvas.getContext('2d'),source=document.createElement('canvas');source.width=source.height=192;
  const pose=BattleWeaponPose.mount(arena);
  const ready=(async()=>{try{if(await Craft.drawHeldArtwork(source,BattlePreview.weapon.artwork))return;}catch{}const held=document.getElementById('held-battle-weapon');if(held)source.getContext('2d').drawImage(held,0,0,192,192);})();
  let revision=0,raf=0,pending=null;
  function clear(){ctx.clearRect(0,0,canvas.width,canvas.height);}
  function cancel(){revision++;cancelAnimationFrame(raf);clear();caption.hidden=true;pose.reset();if(pending){const resolve=pending;pending=null;resolve();}}
  function ring(x,y,r,color,alpha=1){ctx.save();ctx.globalAlpha=alpha;ctx.strokeStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.stroke();ctx.restore();}
  function point(a,b,t,path,offset=0){return{x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t-(path==='arc'?Math.sin(t*Math.PI)*65:0)+(path==='spiral'?Math.sin(t*Math.PI*5)*12:0)+offset*Math.sin(t*Math.PI)};}
  const phaseNames={shot:['조준','발사','명중','반동 복귀'],swing:['자세 잡기','휘두르기','베기','칼 회수'],thrust:['끝 겨누기','찌르기','관통','끌어오기'],smash:['들어 올리기','내려치기','타격','자세 복귀'],throw:['던질 준비','투척','충돌','회수'],spray:['압력 준비','분사','확산','분사 종료'],beam:['집중','광선 방출','관통','잔광'],wave:['집중','파동 전개','파동 충돌','소멸'],grow:['발아','줄기 뻗기','뿌리 얽힘','잎 흩어짐'],bind:['끝 겨누기','감아 뻗기','휘감기','풀어내기'],ward:['방어 준비','장막 전개','고정','자세 복귀'],mend:['치유 준비','기운 전달','회복','안정'],time:['시계 확대','바늘 감기','시간 고정','파열']};
  async function play(move,before={},after={},options={}){
    cancel();const token=revision;if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    await ready;if(token!==revision)return;
    const plan=Craft.WeaponRig.forMove(move,BattlePreview.weapon),box=arena.getBoundingClientRect(),enemy=arena.querySelector('.enemy-fighter canvas').getBoundingClientRect(),player=arena.querySelector('#player-sprite').getBoundingClientRect();
    const miss=!!after.feedback?.miss,target={x:enemy.left-box.left+enemy.width/2,y:enemy.top-box.top+enemy.height*.45-(miss?65:0)},self={x:player.left-box.left+player.width/2,y:player.top-box.top+player.height*.45};
    const initial=pose.configure(plan.rig,target,source.artworkBounds),color=GamePalette.tokens[move.element]||GamePalette.tokens.normal;
    const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.ceil(box.width*dpr);canvas.height=Math.ceil(box.height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
    const melee=['swing','thrust','smash'].includes(plan.mode),duration=plan.mode==='shot'?(plan.rig.family==='bow'?1450:1150):melee?1350:plan.mode==='time'?2100:1550;
    caption.hidden=false;step.textContent=move.name||'기본 공격';
    return new Promise((resolve,reject)=>{
      pending=resolve;let start,pausedAt=null,contacted=false,launch=null;
      const frame=now=>{try{
        if(token!==revision)return;if(start===undefined)start=now;if(pausedAt!==null){start+=now-pausedAt;pausedAt=null;}
        const t=Math.min(1,(now-start)/duration),prep=Math.min(1,t/.25),flight=Math.max(0,Math.min(1,(t-.25)/.39)),impact=Math.max(0,Math.min(1,(t-.64)/.2)),recover=Math.max(0,Math.min(1,(t-.84)/.16));
        clear();ctx.lineWidth=3;ctx.strokeStyle=color;ctx.fillStyle=color;
        label.textContent=phaseNames[plan.mode][t<.25?0:t<.64?1:t<.84?2:3]+(miss&&t>=.64?' · 빗나감':'');
        const swing=plan.mode==='swing'?-1.1+flight*2.1:plan.mode==='smash'?-1.7+flight*2:0;
        const poseAngle=melee?(t<.25?-prep*(plan.mode==='smash'?1.7:1.1):swing*(1-recover)):0;
        const reach=melee?Math.sin(flight*Math.PI/2)*(1-recover):0;
        const firing=t>=.25&&t<.64,recoil=plan.rig.family==='firearm'&&firing?Math.max(0,1-flight*4)*8:0;
        const p=pose.update({angle:poseAngle,reach,recoil,hidden:plan.mode==='throw'&&t>=.25&&t<.9});
        if(t>=.25&&!launch)launch={...p.tip};const origin=launch||p.tip,angle=Math.atan2(target.y-origin.y,target.x-origin.x);
        if(options.drawAction&&!['shot','spray','throw'].includes(plan.mode)){
          if(firing)options.drawAction(ctx,{origin,target,self,progress:flight,mode:plan.mode});
        }else if(plan.mode==='shot'){
          if(plan.rig.family==='bow'&&t<.3){
            const a=p.angle+Math.PI/2,pull=prep*18;ctx.beginPath();ctx.moveTo(p.grip.x+Math.cos(a)*30,p.grip.y+Math.sin(a)*30);ctx.lineTo(p.grip.x-Math.cos(p.angle)*pull,p.grip.y-Math.sin(p.angle)*pull);ctx.lineTo(p.grip.x-Math.cos(a)*30,p.grip.y-Math.sin(a)*30);ctx.stroke();
            BattlePayloads.draw(ctx,'arrow',p.tip.x-Math.cos(p.angle)*pull,p.tip.y-Math.sin(p.angle)*pull,p.angle,9,color);
          }
          if(firing){
            if(plan.rig.family==='firearm'){
              BattlePayloads.flash(ctx,{...p.tip,angle},color,flight*5);
              ctx.save();ctx.fillStyle=GamePalette.tokens.metal;ctx.translate(p.grip.x-15-flight*24,p.grip.y-16+flight*flight*50);ctx.rotate(flight*8);ctx.fillRect(-2,-4,4,8);ctx.restore();
            }
            for(let i=0;i<plan.count;i++){const q=Math.max(0,Math.min(1,(flight-i*.05)/(1-i*.05)));if(flight<i*.05||q>=1)continue;const end={x:target.x,y:target.y+(i-(plan.count-1)/2)*plan.spread*.6},pos=point(origin,end,q,plan.path),a=Math.atan2(end.y-origin.y,end.x-origin.x);if(options.drawPayload)options.drawPayload(ctx,{...pos,angle:a,progress:q,mode:plan.mode});else BattlePayloads.draw(ctx,plan.payload,pos.x,pos.y,a,plan.payload==='arrow'?10:8,color);}
          }
        }else if(melee){
          if(firing){
            if(plan.mode==='thrust'){ctx.beginPath();ctx.moveTo(p.tip.x,p.tip.y);ctx.lineTo(p.tip.x+(target.x-p.tip.x)*flight,p.tip.y+(target.y-p.tip.y)*flight);ctx.stroke();}
            else{ctx.save();ctx.globalAlpha=.75;ctx.lineWidth=plan.mode==='smash'?8:4;ctx.beginPath();ctx.arc(target.x,target.y,35+flight*12,plan.mode==='smash'?-Math.PI/2:-2.5,(plan.mode==='smash'?-Math.PI/2:-2.5)+flight*2.2);ctx.stroke();ctx.restore();}
          }
        }else if(plan.mode==='throw'){
          if(firing){const pos=point(origin,target,flight,plan.path);ctx.save();ctx.translate(pos.x,pos.y);ctx.rotate(flight*Math.PI*4);ctx.drawImage(source,-27,-27,54,54);ctx.restore();}
          if(t>=.84&&t<.9){const q=(t-.84)/.06,pos=point(target,initial.tip,q,'arc');ctx.save();ctx.translate(pos.x,pos.y);ctx.rotate(q*8);ctx.drawImage(source,-24,-24,48,48);ctx.restore();}
        }else if(plan.mode==='spray'){
          if(firing)for(let i=0;i<18;i++){const q=(flight*2+i/18)%1,pos=point(p.tip,target,q,'straight',Math.sin(i*7)*plan.spread*q);if(options.drawPayload)options.drawPayload(ctx,{...pos,angle,progress:q,mode:plan.mode});else BattlePayloads.draw(ctx,plan.payload,pos.x,pos.y,angle,4+q*7,color);}
        }else if(plan.mode==='beam'){
          if(firing){ctx.save();ctx.globalAlpha=Math.sin(flight*Math.PI);for(const width of [7,2]){ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(p.tip.x,p.tip.y);ctx.lineTo(target.x,target.y);ctx.stroke();}ctx.restore();}
          else if(t<.25)ring(p.tip.x,p.tip.y,5+prep*14,color);
        }else if(plan.mode==='grow'){
          for(let i=0;i<4;i++){const x=target.x+(i-1.5)*20;ctx.beginPath();ctx.moveTo(x,target.y+60);ctx.quadraticCurveTo(x+(i%2?30:-30)*flight,target.y+45-flight*70,x,target.y+60-flight*120);ctx.stroke();BattlePayloads.draw(ctx,'seed',x,target.y+60-flight*120,-1,6,color);}
        }else if(plan.mode==='bind'){
          if(t>=.25){ctx.beginPath();ctx.moveTo(p.tip.x,p.tip.y);const count=30;for(let i=1;i<=count;i++){const q=i/count*flight;ctx.lineTo(p.tip.x+(target.x-p.tip.x)*q,p.tip.y+(target.y-p.tip.y)*q+Math.sin(q*16-flight*8)*14*Math.sin(q*Math.PI));}ctx.stroke();if(flight>.8)for(let i=0;i<3;i++){ctx.beginPath();ctx.ellipse(target.x,target.y+i*12-12,35,10,0,0,Math.PI*2);ctx.stroke();}}
        }else if(plan.mode==='ward'){
          const r=20+prep*45;ring(self.x+35,self.y,r,color,1-recover);ctx.beginPath();ctx.moveTo(self.x+35,self.y-r);ctx.lineTo(self.x+35,self.y+r);ctx.stroke();
        }else if(plan.mode==='mend'){
          for(let i=0;i<8;i++){const a=i*Math.PI/4+t*4,r=55*(1-flight)+10;BattlePayloads.draw(ctx,'spore',self.x+Math.cos(a)*r,self.y+Math.sin(a)*r,0,5,color);}ring(self.x,self.y,20+flight*45,color,1-recover);
        }else if(plan.mode==='time'){
          const x=box.width*.5,y=box.height*.42,r=55+prep*15;ring(x,y,r,color);
          ctx.save();ctx.translate(x,y);ctx.rotate(flight*12);ctx.beginPath();ctx.moveTo(0,-r*.7);ctx.lineTo(0,0);ctx.lineTo(r*.4,0);ctx.stroke();ctx.restore();
        }else{
          if(firing){const pos=point(origin,target,flight,plan.path);for(let i=0;i<3;i++)ring(pos.x,pos.y,10+i*8+flight*20,color,1-i*.2);}
        }
        if(!options.drawAction&&t>=.64&&t<.84&&!miss&&!['mend','ward','time'].includes(plan.mode)){
          for(let i=0;i<6;i++){const a=i*Math.PI/3,r=12+impact*38;ctx.globalAlpha=1-impact;ctx.beginPath();ctx.moveTo(target.x+Math.cos(a)*r,target.y+Math.sin(a)*r);ctx.lineTo(target.x+Math.cos(a)*(r+9),target.y+Math.sin(a)*(r+9));ctx.stroke();}ctx.globalAlpha=1;
        }
        if(options.onContact&&!contacted&&t>=.64){contacted=true;pausedAt=now;Promise.resolve().then(options.onContact).catch(()=>{}).then(()=>{if(token===revision)raf=requestAnimationFrame(frame);});return;}
        if(t<1)raf=requestAnimationFrame(frame);else{pending=null;clear();caption.hidden=true;pose.reset();resolve();}
      }catch(error){pending=null;cancel();reject(error);}};raf=requestAnimationFrame(frame);
    });
  }
  document.addEventListener('visibilitychange',()=>{if(document.hidden)cancel();});
  return{play,cancel};
};
