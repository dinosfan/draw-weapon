// Original sprites on a 40×48 grid. All rectangles align to whole pixels.
Trainers.draw = (canvas, trainer) => {
  const ctx=canvas.getContext('2d'), p=Trainers.palette;
  ctx.clearRect(0,0,40,48);
  const r=(color,x,y,w,h)=>{ctx.fillStyle=p[color]||color;ctx.fillRect(x,y,w,h);};
  const outlined=(color,x,y,w,h)=>{r('ink',x,y,w,h);r(color,x+1,y+1,w-2,h-2);};
  // Backpack / cloak silhouette.
  if(trainer.style==='hood') {outlined('greenDark',8,22,8,14);r('pale',9,24,3,7);}
  if(trainer.style==='cloak'){r('ink',9,22,20,19);r('dark',10,24,18,15);r('gray',11,26,2,9);}
  // Legs and boots.
  outlined('dark',13,34,6,9);outlined('dark',21,34,6,9);
  r('ink',11,41,8,4);r('ink',21,41,9,4);r('gray',12,42,4,1);r('gray',23,42,4,1);
  // Body and sleeves, arm on right extended to hold the drawing.
  outlined(trainer.outfit,12,23,16,14);r(trainer.accent,14,24,4,10);
  outlined(trainer.outfit,9,25,5,9);outlined('skin',10,32,4,5);
  outlined(trainer.outfit,26,24,5,7);outlined('skin',29,28,6,4);
  r('skin',32,27,3,3);r('shade',30,30,3,1);
  r('ink',13,35,14,2);r(trainer.accent,18,35,4,2);
  // Neck and hair behind the face.
  outlined('skin',17,19,7,6);r('ink',12,7,16,14);r(trainer.hair,13,7,14,14);
  outlined('skin',13,10,14,11);r('shade',14,18,12,2);
  r('skin',12,14,2,4);r('skin',26,14,2,4);
  r(trainer.hair,14,8,13,4);r(trainer.hair,13,11,3,5);r(trainer.hair,25,11,2,4);
  // Face is slightly turned toward the held weapon.
  r('ink',19,14,2,3);r('ink',24,14,2,3);r('paper',19,14,1,1);r('paper',24,14,1,1);r('shade',22,17,2,1);r('ink',21,19,3,1);
  if(trainer.style==='cap') {r('ink',11,6,17,6);r('red',12,6,15,5);r('redDark',12,9,5,2);r('ink',9,10,20,3);r('red',10,10,18,2);r('paper',22,7,3,3);}
  if(trainer.style==='hood') {r('ink',11,5,18,10);r('green',12,6,16,7);r('greenDark',12,10,3,7);r('pale',16,7,8,2);r('ink',12,12,2,7);r('green',26,10,3,10);r('pale',16,23,9,2);}
  if(trainer.style==='goggles') {r('ink',12,5,16,6);r('dark',13,5,14,5);r('ink',12,7,17,4);outlined('paper',14,6,5,5);outlined('paper',22,6,5,5);r('yellow',19,8,3,1);r('gray',19,24,5,11);r('yellow',19,27,4,5);}
  if(trainer.style==='cloak'){r('gray',12,7,15,4);r('gray',13,10,6,3);r('gray',25,9,3,5);r('ink',14,22,13,4);r('red',15,22,12,3);r('redDark',12,24,6,7);r('red',10,29,5,2);}
  if(trainer.style==='beret'){r('ink',10,5,19,6);r('green',11,5,17,5);r('ink',14,4,11,2);r('greenDark',11,9,17,2);r('green',20,3,3,3);r('green',15,25,2,10);r('green',24,25,2,10);r('greenDark',15,29,11,6);r('skin',20,26,2,3);}
  if(trainer.style==='band'){r('ink',13,4,4,5);r('ink',19,3,4,6);r('ink',25,5,4,5);r('red',13,10,15,2);r('red',10,11,4,6);r('redDark',8,15,4,2);r('skin',10,25,3,8);r('skin',27,25,3,5);r('red',14,34,13,2);r('red',21,36,2,4);}
};
