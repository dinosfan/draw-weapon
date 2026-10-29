ClockLab.clock=(ctx,x,y,r,angle=0,{alpha=1,numbers=true,cracks=false}={})=>{
  ctx.save();ctx.globalAlpha=alpha;ctx.translate(x,y);ctx.strokeStyle=GamePalette.tokens.ink;ctx.fillStyle=GamePalette.tokens.paper;ctx.lineWidth=Math.max(1.5,r/35);
  ctx.beginPath();for(let i=0;i<=100;i++){const a=i/100*Math.PI*2,k=1+Math.sin(a*5)*.012;const px=Math.cos(a)*r*k,py=Math.sin(a)*r*k;i?ctx.lineTo(px,py):ctx.moveTo(px,py);}ctx.closePath();ctx.fill();ctx.stroke();
  for(let i=0;i<12;i++){const a=i/12*Math.PI*2;ctx.beginPath();ctx.moveTo(Math.sin(a)*r*.84,-Math.cos(a)*r*.84);ctx.lineTo(Math.sin(a)*r*.91,-Math.cos(a)*r*.91);ctx.stroke();}
  if(numbers){ctx.fillStyle=GamePalette.tokens.ink;ctx.font='700 '+Math.max(10,r*.21)+'px Pretendard';ctx.textAlign='center';ctx.textBaseline='middle';for(let i=1;i<=12;i++){const a=i/12*Math.PI*2;ctx.fillText(String(i),Math.sin(a)*r*.68,-Math.cos(a)*r*.68);}}
  ctx.rotate(angle);ctx.lineWidth=Math.max(2,r/25);ctx.beginPath();ctx.moveTo(0,-r*.55);ctx.lineTo(0,0);ctx.lineTo(r*.45,r*.18);ctx.stroke();ctx.fillStyle=GamePalette.tokens.electric;ctx.fillRect(-2,-2,4,4);ctx.rotate(-angle);
  if(cracks){ctx.lineWidth=2;for(let i=0;i<6;i++){const a=i*Math.PI/3;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(a+.2)*r*.4,Math.sin(a+.2)*r*.4);ctx.lineTo(Math.cos(a)*r*.9,Math.sin(a)*r*.9);ctx.stroke();}}
  ctx.restore();
};
