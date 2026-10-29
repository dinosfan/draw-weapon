window.BattleStories={};
BattleStories.mount=arena=>{
  const canvas=document.createElement('canvas');canvas.className='battle-effect-canvas';canvas.setAttribute('aria-hidden','true');arena.append(canvas);
  const caption=document.createElement('div');caption.className='story-caption';caption.hidden=true;
  const step=document.createElement('small'),title=document.createElement('strong');caption.append(step,title);arena.append(caption);
  const ctx=canvas.getContext('2d'),source=document.createElement('canvas');source.width=source.height=192;
  const ready=(async()=>{try{if(await Craft.drawHeldArtwork(source,BattlePreview.weapon.artwork))return;}catch{}const held=document.getElementById('held-battle-weapon');if(held)source.getContext('2d').drawImage(held,0,0,192,192);})();
  let raf=0,finish=null,revision=0;
  const enemyActor=arena.querySelector('.enemy-fighter');
  function clear(){ctx.clearRect(0,0,canvas.width,canvas.height);}
  function cancel(){revision++;cancelAnimationFrame(raf);clear();caption.hidden=true;enemyActor.classList.remove('story-frozen');if(finish){const resolve=finish;finish=null;resolve();}}
  function draw(part,x,y,size,angle=0,alpha=1){
    ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.globalAlpha*=alpha;
    const crops={whole:[0,0,192,192],core:[48,48,96,96],upper:[0,0,192,116],lower:[0,76,192,116],rim:[0,0,192,192]};
    if(part==='rim'){ctx.beginPath();ctx.rect(-size/2,-size/2,size,size);ctx.arc(0,0,size*.24,0,Math.PI*2,true);ctx.clip('evenodd');}
    ctx.drawImage(source,...crops[part],-size/2,-size/2,size,size);ctx.restore();
  }
  function ring(x,y,r,alpha=1){ctx.save();ctx.globalAlpha=alpha;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.stroke();ctx.restore();}
  function marks(x,y,r,t,motif){
    const count=motif==='dial'?12:6;ctx.save();ctx.fillStyle=GamePalette.tokens.ink;ctx.font='800 15px Pretendard';ctx.textAlign='center';ctx.textBaseline='middle';
    for(let i=1;i<=count;i++){const a=i/count*Math.PI*2+t;const px=x+Math.sin(a)*r,py=y-Math.cos(a)*r;if(motif==='dial')ctx.fillText(String(i),px,py);else ctx.fillRect(px-3,py-3,6,6);}
    ctx.restore();
  }
  async function play(move,before={},after={},onContact){
    cancel();const token=revision;
    if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    await ready;if(token!==revision)return;
    const scenes=Craft.Story.normalize(move.story),box=arena.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);
    const attacking=after.feedback?(after.feedback.hit>0||after.feedback.miss):move.damage>0;
    const contacts=scenes.map((scene,index)=>({scene,index})).filter(({scene})=>scene.target==='enemy'&&['sweep','fracture','pulse'].includes(scene.action));
    const contactIndex=attacking&&contacts.length?contacts[0].index:scenes.length-1;
    canvas.width=Math.ceil(box.width*dpr);canvas.height=Math.ceil(box.height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
    const position=selector=>{const r=arena.querySelector(selector).getBoundingClientRect();return{x:r.left-box.left+r.width/2,y:r.top-box.top+r.height/2,rect:r};};
    const points={caster:position('#player-sprite'),enemy:position('.enemy-fighter canvas'),center:{x:box.width*.5,y:box.height*.43}};
    const hand=position('#held-battle-weapon'),size=Math.min(170,box.width*.26),color=GamePalette.tokens[move.element]||GamePalette.tokens.normal;
    const total=scenes.reduce((sum,scene)=>sum+scene.duration,0),speed=Math.min(1,2800/total),duration=total*speed;
    caption.hidden=false;
    return new Promise(resolve=>{
      finish=resolve;let start,pausedAt=null,contacted=false;
      const frame=now=>{
        if(token!==revision)return;if(start===undefined)start=now;
        if(pausedAt!==null){start+=now-pausedAt;pausedAt=null;}
        const elapsed=Math.min(duration,now-start);let relative=elapsed/speed,index=0;
        while(index<scenes.length-1&&relative>=scenes[index].duration){relative-=scenes[index].duration;index++;}
        const scene=scenes[index],t=Math.min(1,relative/scene.duration),p=points[scene.target],previous=index?points[scenes[index-1].target]:hand;
        clear();ctx.lineWidth=3;ctx.strokeStyle=color;ctx.fillStyle=color;
        step.textContent=move.name+' · '+(index+1)+' / '+scenes.length;title.textContent=scene.label;
        enemyActor.classList.toggle('story-frozen',scene.action==='freeze');
        const x=p.x,y=p.y,r=size/2,motif=scene.motif||'none';
        if(scene.action==='reveal'){
          const q=1-(1-t)**3;draw(scene.part,previous.x+(x-previous.x)*q,previous.y+(y-previous.y)*q,35+(size-35)*q,Math.sin(t*Math.PI)*.15);
          ring(x,y,r*(.4+.7*t),1-t);
        }
        if(scene.action==='wind'){
          draw('rim',x,y,size);draw('core',x,y,size*.7,t*t*Math.PI*10);
          for(let i=0;i<4;i++){ctx.beginPath();const a=i*Math.PI/2+t*7;ctx.arc(x,y,r+9,a,a+.4);ctx.stroke();}
          marks(x,y,r+24,t*3,motif);
        }
        if(scene.action==='orbit'){
          draw(scene.part,x,y,size*.7,0,.4);ring(x,y,r,Math.sin(t*Math.PI));
          for(let i=0;i<4;i++){const a=i*Math.PI/2+t*5;draw(scene.part,x+Math.cos(a)*r,y+Math.sin(a)*r*.6,size*.35,a,.8);}
          marks(x,y,r+16,-t,motif);
        }
        if(scene.action==='seal'){
          ring(x,y,r*(.3+.9*t));ring(x,y,r*(.2+.7*t));marks(x,y,r*(.4+.7*t),(1-t)*Math.PI,motif);draw(scene.part,x,y,size*.6,0,1-t*.6);
        }
        if(scene.action==='echo'){
          draw(scene.part,points.center.x,points.center.y,size,-t*9);
          const sprite=document.getElementById('player-sprite'),bounds=points.caster.rect;
          for(let i=0;i<3;i++){ctx.save();ctx.globalAlpha=.25-i*.05;ctx.drawImage(sprite,bounds.left-box.left+(1-t)*(i+1)*34,bounds.top-box.top,bounds.width,bounds.height);ctx.restore();}
        }
        if(scene.action==='freeze'){
          draw(scene.part,x,y,size,0,.85);ring(x,y,r+12);marks(x,y,r+26,0,motif);
          ctx.fillStyle=GamePalette.tokens.ink;ctx.fillRect(x-38,y-13,76,26);ctx.fillStyle=GamePalette.tokens.paper;ctx.font='800 14px Pretendard';ctx.textAlign='center';ctx.fillText(motif==='dial'?'12:00':'정지',x,y+5);
        }
        if(scene.action==='fracture'){
          const count=motif==='petals'?6:12;
          for(let i=0;i<count;i++){
            const a=i/count*Math.PI*2;ctx.save();ctx.translate(x+Math.cos(a)*t*125,y+Math.sin(a)*t*90);ctx.rotate((i%2?1:-1)*t*.8);ctx.globalAlpha=1-t;
            ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,r,a,a+Math.PI*2/count);ctx.closePath();ctx.clip();draw('whole',0,0,size);ctx.restore();
          }
          ring(x,y,20+t*115,1-t);marks(x,y,25+t*90,t,motif);
        }
        if(scene.action==='sweep'){
          const angle=-1.4+t*2.6;ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.beginPath();ctx.arc(0,0,r+17,-.7,.7);ctx.stroke();draw(scene.part,r*.3,0,size*.85,Math.PI/4);ctx.restore();
        }
        if(scene.action==='bloom'){
          draw('lower',x,y+30,size*.7,0,.75);
          for(let i=0;i<6;i++){const a=i*Math.PI/3-Math.PI/2,spread=12+t*48;draw(scene.part,x+Math.cos(a)*spread,y+Math.sin(a)*spread,size*(.22+.16*t),a+t*.2);}
          draw('core',x,y,size*.48,0);ring(x,y,15+t*75,1-t);
        }
        if(scene.action==='converge'){
          const count=Math.max(3,before.resource||3);
          for(let i=0;i<count;i++){const a=i/count*Math.PI*2+t;draw(scene.part,x+Math.cos(a)*(1-t)*120,y+Math.sin(a)*(1-t)*85,size*.3,a);}
          draw('core',x,y,20+t*size*.7,t*2);ring(x,y,12+(1-t)*95);
        }
        if(scene.action==='pulse'){
          draw(scene.part,x,y,size*(.6+Math.sin(t*Math.PI)*.3));
          for(let i=0;i<3;i++)ring(x,y,15+((t+i/3)%1)*100,1-((t+i/3)%1));
          if(motif==='rain')for(let i=0;i<14;i++){const px=x-r+(i*31)%size,py=y-r+((t*200+i*17)%size);ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px-4,py+16);ctx.stroke();}
        }
        if(onContact&&!contacted&&(index>contactIndex||index===contactIndex&&t>=.28)){contacted=true;pausedAt=now;Promise.resolve().then(onContact).catch(()=>{}).then(()=>{if(token===revision)raf=requestAnimationFrame(frame);});return;}
        if(elapsed<duration)raf=requestAnimationFrame(frame);else{clear();caption.hidden=true;enemyActor.classList.remove('story-frozen');finish=null;resolve();}
      };raf=requestAnimationFrame(frame);
    });
  }
  return{play,cancel};
};
