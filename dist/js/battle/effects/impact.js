// Contact response only: never calculates damage, consumes PP or calls the API.
window.BattleImpact={};
BattleImpact.mount=arena=>{
  const canvas=document.createElement('canvas');canvas.className='battle-impact-canvas';canvas.setAttribute('aria-hidden','true');arena.append(canvas);
  const number=document.createElement('div');number.className='impact-number';number.hidden=true;number.setAttribute('aria-live','off');arena.append(number);
  const ctx=canvas.getContext('2d'),enemy=arena.querySelector('.enemy-fighter'),player=arena.querySelector('.player-fighter');
  let raf=0,resolvePending=null,revision=0;
  function clear(){ctx.clearRect(0,0,canvas.width,canvas.height);number.hidden=true;arena.style.translate='';for(const actor of [enemy,player]){actor.style.translate='';actor.style.scale='';}}
  function cancel(){revision++;cancelAnimationFrame(raf);clear();if(resolvePending){const resolve=resolvePending;resolvePending=null;resolve();}}
  function play(move,feedback={},counter=false){
    cancel();const token=revision;
    const hit=counter?feedback.counter:feedback.hit,heal=counter?0:feedback.heal,miss=!counter&&feedback.miss,blocked=counter&&feedback.blocked;
    if(!hit&&!heal&&!miss&&!blocked)return Promise.resolve();
    const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(reduced||document.hidden)return Promise.resolve();
    const kind=counter?'pulse':Craft.HitFeel.normalize(move.feel,move),profile=Craft.HitFeel.profiles[kind];
    const actor=counter||heal&&!hit?player:enemy,box=arena.getBoundingClientRect(),rect=actor.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);
    canvas.width=Math.ceil(box.width*dpr);canvas.height=Math.ceil(box.height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
    const x=rect.left-box.left+rect.width/2,y=rect.top-box.top+rect.height*.45,sign=actor===enemy?1:-1;
    const color=Craft.Types?.color(move.element)||GamePalette.tokens[move.element]||GamePalette.tokens.normal;
    const intensity=Math.min(1.2,.65+(hit||heal||0)/80),duration=miss?300:profile.duration+(move.ultimate?120:hit>=45?70:0),hold=profile.hold+(hit>=45?45:0);
    number.textContent=(feedback.label?feedback.label+' ':'')+(miss?'빗나감':blocked?'방어':heal&&!hit?'+'+heal:'−'+hit+(heal?' / +'+heal:''));
    number.hidden=false;number.style.left=x+'px';number.style.top=Math.max(40,y-65)+'px';number.style.setProperty('--impact-color',color);
    return new Promise((resolve,reject)=>{
      resolvePending=resolve;let start;
      const frame=now=>{try{
        if(token!==revision)return;if(start===undefined)start=now;
        const elapsed=now-start,t=Math.min(1,elapsed/duration),held=elapsed<hold;
        const release=Math.max(0,(elapsed-hold)/Math.max(1,duration-hold));
        const envelope=(1-release)**2;
        ctx.clearRect(0,0,box.width,box.height);ctx.strokeStyle=color;ctx.fillStyle=color;ctx.lineWidth=kind==='pierce'?2:4;
        if(miss){actor.style.translate=(sign*Math.sin(t*Math.PI)*18)+'px 0px';}
        else if(hit){
          let push=profile.push*intensity*envelope;
          if(kind==='temporal')push=profile.push*intensity*[0,1,.35,.75,0][Math.min(4,Math.floor(t*5))];
          actor.style.translate=sign*push+'px '+(kind==='slash'?-push*.4:0)+'px';
          actor.style.scale=held&&kind==='heavy'?'.92 1.06':kind==='pulse'?(1+Math.sin(t*Math.PI)*.06)+'':'1';
          arena.style.translate=(profile.shake*Math.sin(t*45)*envelope)+'px 0px';
          if(kind==='heavy'){
            for(let i=0;i<8;i++){const a=i*Math.PI/4,r=16+release*65;ctx.beginPath();ctx.moveTo(x+Math.cos(a)*r,y+Math.sin(a)*r*.7);ctx.lineTo(x+Math.cos(a)*(r+18*envelope),y+Math.sin(a)*(r+18*envelope)*.7);ctx.stroke();}
          }else if(kind==='pierce'||kind==='slash'){
            for(let i=0;i<3;i++){const offset=(i-1)*9;ctx.globalAlpha=envelope;ctx.beginPath();ctx.moveTo(x-65,y+offset+(kind==='slash'?40:0));ctx.lineTo(x+70,y+offset-(kind==='slash'?40:0));ctx.stroke();}ctx.globalAlpha=1;
          }else if(kind==='temporal'){
            const r=48;for(let i=0;i<12;i++){const a=i*Math.PI/6;ctx.beginPath();ctx.moveTo(x+Math.cos(a)*r,y+Math.sin(a)*r);ctx.lineTo(x+Math.cos(a)*(r+8),y+Math.sin(a)*(r+8));ctx.stroke();}
            ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y-r*.7);ctx.moveTo(x,y);ctx.lineTo(x+r*.5,y);ctx.stroke();
          }else{ctx.beginPath();ctx.arc(x,y,12+t*65,0,Math.PI*2);ctx.stroke();}
        }else if(heal||blocked){ctx.globalAlpha=1-t;ctx.beginPath();ctx.arc(x,y,20+t*55,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;}
        number.style.translate='0px '+(-t*26)+'px';number.style.opacity=String(t<.65?1:(1-t)/.35);
        if(t<1)raf=requestAnimationFrame(frame);else{resolvePending=null;clear();resolve();}
      }catch(error){resolvePending=null;cancel();reject(error);}};raf=requestAnimationFrame(frame);
    });
  }
  document.addEventListener('visibilitychange',()=>{if(document.hidden)cancel();});
  return{play,cancel};
};
