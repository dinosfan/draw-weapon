(function(root){
 const clamp=n=>Math.max(0,Math.min(1,n));
 // Rarity changes staging, never damage, move identity or the type palette.
 function plan(rank,ultimate=false){
  rank=Math.max(0,Math.min(4,rank||0));
  return {rank,ultimate:rank===4&&ultimate,tail:[330,410,500,660,780][rank]+(rank===4&&ultimate?260:0),
   particles:[0,7,13,21,28][rank],echoes:[0,0,1,2,3][rank],dim:rank>=3?(rank===4&&ultimate?.66:.35):0};
 }
 function paint(ctx,atlas,move,scene,elapsed,settings,draw){
  const {x,y,w,h,self,miss}=scene,{rank}=settings,p=clamp(elapsed/settings.tail),frame=q=>scene.delivered?.5+q*.49:q;
  if(elapsed<0||p>=1||miss)return;
  const fade=1-Math.pow(p,2),burst=1-Math.pow(1-clamp(p*3),3),size=Math.min(w*.57,(self?125:145)+rank*24);
  const color=root.Craft.Types.color(move.element),tokens=root.GamePalette.tokens;
  ctx.save();
  if(settings.dim){ctx.globalAlpha=settings.dim*(1-p);ctx.fillStyle=tokens.ink;ctx.fillRect(0,0,w,h);}
  // A two-frame contact flash is brief enough to leave the authored sprite legible.
  if(!self&&rank>=2&&elapsed<50){ctx.globalAlpha=(1-elapsed/50)*.24;ctx.fillStyle=tokens.paper;ctx.fillRect(0,0,w,h);}
  for(let i=settings.echoes;i>0;i--){
   const delay=i*.095,q=p-delay;if(q<0)continue;
   draw(ctx,atlas,move.atlasRow,frame(Math.min(.96,q)),x-(self?0:i*9),y+(self?i*7:0),size*(.5+burst*.8+i*.12),{alpha:fade*.13});
  }
  draw(ctx,atlas,move.atlasRow,frame(Math.min(.99,p)),x,y-(self?p*24:0),size*(self?.7+burst*.3:.48+burst*.65),{alpha:fade});
  // Deterministic ballistic fragments support the generated subject, without adding another motif.
  for(let i=0;i<settings.particles;i++){
   const angle=i*2.399963,spread=(18+(i%5)*8+rank*5),travel=Math.pow(p,.65)*spread;
   const px=x+Math.cos(angle)*travel,py=y+Math.sin(angle)*travel*(self?.6:.75)+(self?-p*45:p*p*32);
   ctx.globalAlpha=fade*(self?.55:.85);ctx.fillStyle=i%4===0?tokens.paper:color;
   ctx.save();ctx.translate(Math.round(px),Math.round(py));ctx.rotate(self?angle:angle+p);
   ctx.fillRect(-2,-2,self?3:3+(1-p)*7,3);ctx.restore();
  }
  ctx.restore();
 }
 const api={plan,paint};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.GeneratedStaging=api;
})(typeof window!=='undefined'?window:globalThis);
