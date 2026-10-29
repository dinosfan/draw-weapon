Craft.exampleStrokes = type => {
  const line = points => ({ width: 5, points });
  const ellipse = (x,y,rx,ry,rotation=0) => line(Array.from({length:65},(_,i) => {
    const a=i/64*Math.PI*2, dx=Math.cos(a)*rx, dy=Math.sin(a)*ry;
    return [x+dx*Math.cos(rotation)-dy*Math.sin(rotation), y+dx*Math.sin(rotation)+dy*Math.cos(rotation)];
  }));
  if (type === 'clock') return [ellipse(350,230,140,140),line([[350,125],[350,230],[425,260]]),...Array.from({length:12},(_,i)=>{const a=i*Math.PI/6;return line([[350+Math.sin(a)*118,230-Math.cos(a)*118],[350+Math.sin(a)*127,230-Math.cos(a)*127]]);})];
  return [line([[350,235],[350,405]]),line([[350,345],[305,300],[280,300],[300,335],[350,345]]),...Array.from({length:6},(_,i)=>{const a=i*Math.PI/3;return ellipse(350+Math.cos(a)*62,190+Math.sin(a)*62,43,30,a);}),ellipse(350,190,30,30)];
};
