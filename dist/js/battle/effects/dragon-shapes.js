// Procedural battle motifs, not UI icons. Original weapon artwork stays in hand.
window.DragonShapes={
 polygon(ctx,points,fill,stroke){ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.stroke();}},
 jaw(ctx,x,y,size,opening,color,alpha=1){
  ctx.save();ctx.translate(x,y);ctx.scale(size,size);ctx.globalAlpha=alpha;ctx.lineWidth=2.5;
  for(const side of [-1,1]){ctx.save();ctx.scale(1,side);ctx.rotate(opening*.34);
   this.polygon(ctx,[[-110,-22],[-94,-56],[-65,-70],[-76,-103],[-43,-78],[-17,-88],[-26,-57],[25,-49],[72,-38],[105,-17],[95,-7],[60,-8],[35,-4],[0,-9],[-40,-5],[-70,4]],color,GamePalette.tokens.ink);
   for(let i=0;i<5;i++){const tx=15+i*16;this.polygon(ctx,[[tx,-15],[tx+8,4+i%2*8],[tx+12,-13]],GamePalette.tokens.paper,GamePalette.tokens.ink);}
   if(side===-1)this.polygon(ctx,[[-40,-48],[-9,-38],[-31,-27]],GamePalette.tokens.paper);
   ctx.restore();
  }ctx.restore();
 },
 crescent(ctx,x,y,r,angle,color,alpha=1,width=8){ctx.save();ctx.globalAlpha=alpha;ctx.translate(x,y);ctx.rotate(angle);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.arc(0,0,r,-2.3,.8);ctx.stroke();ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,r+9,-2.1,.5);ctx.stroke();ctx.restore();},
 scales(ctx,x,y,count,spread,color,progress){ctx.save();ctx.strokeStyle=color;ctx.lineWidth=2;for(let i=0;i<count;i++){const q=i/Math.max(1,count-1),a=q*Math.PI*1.7+progress*2,r=spread*(.3+q*.7);ctx.save();ctx.translate(x+Math.cos(a)*r,y+Math.sin(a)*r);ctx.rotate(a);this.polygon(ctx,[[0,-9],[7,0],[0,12],[-7,0]],null,color);ctx.restore();}ctx.restore();}
};
