// Ammunition and emitted matter are geometry, never copies of the weapon image.
window.BattlePayloads={};
BattlePayloads.draw=(ctx,kind,x,y,angle,size,color)=>{
  ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.fillStyle=color;ctx.strokeStyle=color;ctx.lineWidth=2;
  if(kind==='bullet'){
    ctx.beginPath();ctx.moveTo(-size,-size*.26);ctx.lineTo(size*.5,-size*.26);ctx.lineTo(size,0);ctx.lineTo(size*.5,size*.26);ctx.lineTo(-size,size*.26);ctx.closePath();ctx.fill();ctx.strokeStyle=GamePalette.tokens.ink;ctx.stroke();ctx.strokeStyle=color;
    ctx.beginPath();ctx.moveTo(-size*2,0);ctx.lineTo(-size,0);ctx.stroke();
  }else if(kind==='rocket'){
    ctx.beginPath();ctx.moveTo(size*2,0);ctx.lineTo(size,-size*.5);ctx.lineTo(-size,-size*.5);ctx.lineTo(-size*1.6,-size*.9);ctx.lineTo(-size*1.3,0);ctx.lineTo(-size*1.6,size*.9);ctx.lineTo(-size,size*.5);ctx.lineTo(size,size*.5);ctx.closePath();ctx.fill();ctx.strokeStyle=GamePalette.tokens.ink;ctx.stroke();
    ctx.fillStyle=GamePalette.tokens.fire;ctx.beginPath();ctx.moveTo(-size*1.3,-size*.3);ctx.lineTo(-size*2.5,0);ctx.lineTo(-size*1.3,size*.3);ctx.closePath();ctx.fill();
  }else if(kind==='arrow'){
    ctx.beginPath();ctx.moveTo(-size*2,0);ctx.lineTo(size*1.5,0);ctx.stroke();
    ctx.beginPath();ctx.moveTo(size*1.8,0);ctx.lineTo(size*.8,-size*.5);ctx.lineTo(size*.8,size*.5);ctx.closePath();ctx.fill();
    for(const sign of [-1,1]){ctx.beginPath();ctx.moveTo(-size*1.7,0);ctx.lineTo(-size*2.2,sign*size*.5);ctx.lineTo(-size,0);ctx.stroke();}
  }else if(kind==='water'||kind==='flame'){
    ctx.beginPath();ctx.moveTo(-size*1.4,0);ctx.quadraticCurveTo(size*.8,-size,size,0);ctx.quadraticCurveTo(size*.8,size,-size*1.4,0);ctx.fill();
    if(kind==='flame'){ctx.beginPath();ctx.moveTo(-size*2,-size*.6);ctx.lineTo(size*.3,0);ctx.lineTo(-size*1.8,size*.5);ctx.stroke();}
  }else if(kind==='bolt'){
    ctx.beginPath();ctx.moveTo(-size*2,0);ctx.lineTo(-size*.3,-size*.45);ctx.lineTo(0,size*.35);ctx.lineTo(size*2,0);ctx.stroke();
  }else if(kind==='shard'){
    ctx.beginPath();ctx.moveTo(size*1.3,0);ctx.lineTo(-size*.5,-size*.55);ctx.lineTo(-size,size*.4);ctx.closePath();ctx.fill();
  }else if(kind==='seed'){
    ctx.beginPath();ctx.ellipse(0,0,size*.75,size*.45,-.3,0,Math.PI*2);ctx.fill();ctx.strokeStyle=GamePalette.tokens.ink;ctx.beginPath();ctx.moveTo(-size*.3,0);ctx.lineTo(size*.3,0);ctx.stroke();
  }else if(kind!=='none'){
    ctx.beginPath();ctx.arc(0,0,kind==='pellet'?size*.35:kind==='spore'?size*.4:size*.7,0,Math.PI*2);ctx.fill();
    if(kind==='orb'){ctx.beginPath();ctx.arc(0,0,size*1.1,0,Math.PI*2);ctx.stroke();}
  }
  ctx.restore();
};
BattlePayloads.flash=(ctx,p,color,t)=>{
  if(t<0||t>1)return;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle||0);ctx.strokeStyle=color;ctx.lineWidth=2;ctx.globalAlpha=1-t;
  for(let i=-1;i<=1;i++){ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(16+12*t,i*14);ctx.stroke();}ctx.restore();
};
