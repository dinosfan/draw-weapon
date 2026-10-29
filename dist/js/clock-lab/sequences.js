ClockLab.mountSequences=arena=>{
  const canvas=document.getElementById('sequence-canvas'),ctx=canvas.getContext('2d');
  const caption=document.getElementById('sequence-caption');
  let raf=0,resolvePending=null,revision=0;
  function cancel(){revision++;cancelAnimationFrame(raf);ctx.clearRect(0,0,canvas.width,canvas.height);caption.hidden=true;if(resolvePending){const resolve=resolvePending;resolvePending=null;resolve();}}
  function ring(x,y,r,color=GamePalette.tokens.electric,alpha=1){ctx.save();ctx.globalAlpha=alpha;ctx.strokeStyle=color;ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.stroke();ctx.restore();}
  function numbers(x,y,r,rotation=0,alpha=1){ctx.save();ctx.globalAlpha=alpha;ctx.font='800 17px Pretendard';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=GamePalette.tokens.ink;for(let i=1;i<=12;i++){const a=i/12*Math.PI*2+rotation;ctx.fillText(String(i),x+Math.sin(a)*r,y-Math.cos(a)*r);}ctx.restore();}
  function play(id,before,after){
    cancel();const token=revision,move=ClockLab.moves.find(item=>item.id===id);
    if(matchMedia('(prefers-reduced-motion: reduce)').matches)return Promise.resolve();
    const box=arena.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);
    canvas.width=Math.ceil(box.width*dpr);canvas.height=Math.ceil(box.height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
    const position=selector=>{const r=arena.querySelector(selector).getBoundingClientRect();return{x:r.left-box.left+r.width/2,y:r.top-box.top+r.height/2,r};};
    const player=position('#player-sprite'),enemy=position('#enemy-sprite');
    const middle={x:box.width*.49,y:box.height*.43},radius=Math.min(84,box.width*.16);
    caption.hidden=false;
    return new Promise(resolve=>{
      resolvePending=resolve;let start;
      const frame=now=>{
        if(token!==revision)return;if(start===undefined)start=now;
        const t=Math.min(1,(now-start)/move.duration),phase=Math.min(2,Math.floor(t*3)),phaseT=(t*3)%1;
        ctx.clearRect(0,0,box.width,box.height);
        document.getElementById('sequence-step').textContent=move.name+' · '+(phase+1)+' / 3';
        document.getElementById('sequence-title').textContent=move.stages[phase];
        if(id==='wind'){
          const size=phase===0?24+(radius-24)*phaseT:phase===1?radius:radius*(1-phaseT*.8);
          const x=phase===0?player.x+(middle.x-player.x)*phaseT:phase===1?middle.x:middle.x+(player.x-middle.x)*phaseT;
          const y=phase===0?player.y+(middle.y-player.y)*phaseT:phase===1?middle.y:middle.y+(player.y-middle.y)*phaseT;
          ClockLab.clock(ctx,x,y,size,t*t*42,{numbers:phase!==0});
          if(phase===1){ctx.strokeStyle=GamePalette.tokens.electric;ctx.lineWidth=4;for(let i=0;i<6;i++){const a=i*Math.PI/3+t*8;ctx.beginPath();ctx.arc(x,y,size+8+i%2*6,a,a+.35);ctx.stroke();}}
          if(phase===2)for(let i=0;i<2;i++){ctx.fillStyle=GamePalette.tokens.electric;ctx.strokeStyle=GamePalette.tokens.ink;const gx=player.x+(i-.5)*24,gy=player.y-75-phaseT*25;ctx.fillRect(gx,gy,13,18);ctx.strokeRect(gx,gy,13,18);}
        }
        if(id==='field'){
          if(phase===0)ClockLab.clock(ctx,middle.x,middle.y,18+radius*phaseT,t*5);
          if(phase>=1){const grow=phase===1?phaseT:1,r=22+80*grow;ring(enemy.x,enemy.y,r);ring(enemy.x,enemy.y,r*.78,GamePalette.tokens.ink);numbers(enemy.x,enemy.y,r*.9,phase===1?(1-phaseT)*Math.PI:0);ClockLab.clock(ctx,enemy.x,enemy.y,r*.45,phase===1?t*8:0,{alpha:phase===2?1-phaseT:.7,numbers:false});}
          if(phase===2){ctx.font='700 14px Pretendard';ctx.fillStyle=GamePalette.tokens.ink;ctx.textAlign='center';ctx.fillText('시간 고정',enemy.x,enemy.y+110);}
        }
        if(id==='rewind'){
          ClockLab.clock(ctx,middle.x,middle.y,radius*.9,-t*26,{alpha:phase===2?1-phaseT:1});
          const source=document.getElementById('player-sprite');
          for(let i=0;i<3;i++){
            ctx.save();ctx.globalAlpha=(.2-i*.04)*Math.sin(t*Math.PI);const offset=(1-t)*(i+1)*35;
            ctx.drawImage(source,player.r.left-box.left+offset,player.r.top-box.top,player.r.width,player.r.height);ctx.restore();
          }
          if(phase>=1){ctx.fillStyle=GamePalette.tokens.ink;ctx.font='800 23px Pretendard';ctx.textAlign='center';ctx.fillText('+'+Math.min(before.memory,100-before.hp),player.x,player.y-80-phaseT*30);}
          for(let i=0;i<5;i++)ring(player.x,player.y,15+(1-t)*i*22,GamePalette.tokens.electric,.35*(1-t));
        }
        if(id==='release'){
          const stop=t>=.48&&t<.64;
          const x=middle.x+(enemy.x-middle.x)*Math.min(1,t*2),y=middle.y+(enemy.y-middle.y)*Math.min(1,t*2);
          if(t<.66){
            ClockLab.clock(ctx,x,y,25+radius*Math.min(1,t*3),stop?0:t*42,{cracks:t>.6});
            if(t>.22)numbers(x,y,radius+30,stop?0:t*10,1);
            if(stop){ctx.fillStyle=GamePalette.tokens.ink;ctx.fillRect(x-36,y-12,72,24);ctx.fillStyle=GamePalette.tokens.paper;ctx.font='800 14px Pretendard';ctx.textAlign='center';ctx.fillText('12:00',x,y+5);}
            for(let i=0;i<before.time;i++){const a=i/Math.max(1,before.time)*Math.PI*2+t*7;ctx.fillStyle=GamePalette.tokens.electric;ctx.fillRect(x+Math.cos(a)*(radius+40)*(1-t)-4,y+Math.sin(a)*(radius+40)*(1-t)-4,8,8);}
          }else{
            const explode=(t-.66)/.34;
            for(let i=0;i<12;i++){
              const a=i/12*Math.PI*2;ctx.save();ctx.translate(enemy.x+Math.cos(a)*explode*140,enemy.y+Math.sin(a)*explode*100);ctx.rotate((i%2?1:-1)*explode*.8);ctx.globalAlpha=1-explode;
              ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,radius,a,a+Math.PI/6);ctx.closePath();ctx.clip();ClockLab.clock(ctx,0,0,radius,0,{cracks:true});ctx.restore();
            }
            ring(enemy.x,enemy.y,25+explode*115,GamePalette.tokens.electric,1-explode);
            ctx.fillStyle=GamePalette.tokens.ink;ctx.font='900 32px Pretendard';ctx.textAlign='center';ctx.fillText('−'+(before.enemyHp-after.enemyHp),enemy.x,enemy.y-80-explode*20);
          }
        }
        if(t<1)raf=requestAnimationFrame(frame);else{ctx.clearRect(0,0,box.width,box.height);caption.hidden=true;resolvePending=null;resolve();}
      };raf=requestAnimationFrame(frame);
    });
  }
  return{play,cancel};
};
