(function(root){
 function create(canvas){
  const M=root.WorkshopCatchModel,p=root.GamePalette.tokens,c=canvas.getContext('2d');canvas.width=M.width;canvas.height=M.height;c.imageSmoothingEnabled=false;
  const background=document.createElement('canvas');background.width=M.width;background.height=M.height;const b=background.getContext('2d');
  const box=(ctx,color,x,y,w,h)=>{ctx.fillStyle=p[color];ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));},r=(color,x,y,w,h)=>box(c,color,x,y,w,h),q=(color,x,y,w,h)=>box(b,color,x,y,w,h);
  q('dark',0,0,480,300);q('muted',12,13,456,266);q('subtle',20,29,440,183);
  for(let x=20;x<470;x+=44){q('metal',x,29,1,183);q('paper',x+2,30,1,181);}for(let y=52;y<212;y+=40)q('metal',20,y,440,1);
  q('ink',32,48,106,112);q('metal',36,52,98,104);q('flying',40,56,90,96);q('paper',44,61,21,5);q('paper',47,58,14,12);q('paper',99,78,23,4);
  for(const[x,y,h]of [[46,112,26],[73,100,38],[108,118,30]]){q('muted',x,y,3,h);for(let n=0;n<4;n++)q('nature',x-9-n*2,y+n*7,21+n*4,6);}q('ink',81,54,4,102);q('ink',37,103,96,4);q('paper',35,158,100,4);
  q('ink',343,54,92,55);q('dark',347,58,84,47);for(let i=0;i<7;i++){q(i%2?'metal':'electric',353+i*10,69,7,23-i%3*5);q('paper',354+i*10,72,2,5);}q('ink',338,108,101,6);
  q('metal',292,48,8,85);q('paper',294,50,2,81);q('ink',288,131,18,5);q('electric',287,121,20,8);q('ink',286,124,24,3);
  q('dark',20,192,440,19);q('normal',24,194,432,8);q('metal',24,194,432,3);for(let x=30;x<456;x+=46){q('ink',x,207,5,38);q('metal',x+1,208,1,30);}
  q('dark',20,211,440,68);for(let y=223;y<280;y+=18){q('muted',20,y,440,2);for(let x=(y%3)*30;x<470;x+=78)q('muted',x,y,2,18);}q('metal',22,276,436,3);q('ink',0,282,480,18);q('electric',12,286,456,3);for(let x=17;x<464;x+=20)q('dark',x,286,11,3);
  q('ink',0,0,480,29);q('metal',12,7,456,15);q('paper',14,8,452,3);for(let i=0;i<6;i++){const x=26+i*77;q('ink',x,13,47,14);q('dark',x+4,15,39,7);q('electric',x,25,47,3);q('ink',x+7,25,7,3);q('ink',x+26,25,7,3);}
  for(const x of [7,468])for(let y=8;y<280;y+=35){q('ink',x,y,5,5);q('metal',x+1,y+1,2,2);}
  q('ink',23,252,32,22);q('rock',26,255,26,16);q('electric',28,256,22,2);q('ink',37,255,3,18);q('ink',26,262,26,2);
  q('ink',427,242,28,33);q('metal',430,245,22,26);q('paper',432,248,18,2);q('dark',432,254,18,2);q('dark',432,265,18,2);
  const actor=document.createElement('canvas');root.TrainerStudy.draw(actor);
  let particles=[],labels=[],shake=0;const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  function material(kind,x,y){x=Math.round(x);y=Math.round(y);
   if(kind==='leaf'){r('ink',x-2,y-10,7,18);r('ink',x-9,y-6,8,9);r('ink',x+4,y-8,6,10);r('nature',x-1,y-8,4,14);r('nature',x-7,y-4,8,5);r('bug',x+2,y-6,6,5);r('paper',x,y-5,1,9);}
   else if(kind==='crystal'){r('ink',x-3,y-11,7,22);r('ink',x-8,y-5,17,11);r('rock',x-5,y-4,11,10);r('electric',x-2,y-9,5,18);r('electric',x-6,y-3,13,5);r('paper',x-1,y-7,2,7);}
   else if(kind==='bottle'){r('ink',x-4,y-11,9,5);r('metal',x-3,y-10,7,3);r('ink',x-2,y-6,5,5);r('ink',x-7,y-2,15,13);r('water',x-5,y,11,9);r('ice',x-4,y,3,7);r('paper',x+2,y+1,2,3);}
   else{r('ink',x-5,y-7,11,18);r('ink',x-9,y-3,19,10);r('dark',x-5,y-5,11,14);r('dark',x-7,y-2,15,8);r('metal',x-5,y-2,3,4);r('rock',x+1,y-11,3,5);r('electric',x+4,y-13,5,3);r('fire',x+7,y-15,2,7);r('electric',x+5,y-17,5,2);}
  }
  function feedback(events){for(const event of events){if(['catch','bomb','deflect'].includes(event.kind)){const color=event.kind==='bomb'?'danger':event.kind==='deflect'?'metal':event.material==='leaf'?'nature':event.material==='bottle'?'water':'electric';for(let i=0;i<7;i++)particles.push({x:event.x,y:event.y,vx:(i-3)*21,vy:-45-(i%3)*17,life:.45,color});labels.push({x:event.x,y:event.y-16,text:event.kind==='bomb'?'−20':event.kind==='deflect'?'피했다!':'+'+event.points,life:.65,color:event.kind==='bomb'?'danger':'ink'});if(event.kind==='bomb'&&!reduced)shake=.18;}}particles=particles.slice(-100);labels=labels.slice(-8);}
  function draw(s,dt=0){c.clearRect(0,0,480,300);c.save();if(shake>0)c.translate(Math.round(Math.sin(s.elapsed*90)*3),0);shake=Math.max(0,shake-dt);c.drawImage(background,0,0);
   const x=Math.round(s.player.x),moving=Math.abs(x-(draw.lastX??x))>.1,bob=moving&&!reduced?Math.round(Math.sin(s.elapsed*22)):0;draw.lastX=x;
   for(const item of s.entities)material(item.kind,item.x,item.y);
   if(s.status==='ready'){for(const [kind,px,py]of [['leaf',170,104],['crystal',260,79],['bottle',332,133],['bomb',95,198]])material(kind,px,py);}
   r('muted',x-22,274,44,3);c.save();if(s.player.invulnerable&&Math.floor(s.elapsed*16)%2)c.globalAlpha=.4;
   if(s.player.facing<0){c.translate(x+38,0);c.scale(-1,1);c.drawImage(actor,0,207+bob,56,64);}else c.drawImage(actor,x-38,207+bob,56,64);c.restore();
   r('ink',x-19,236+bob,38,22);r('rock',x-16,240+bob,32,15);r('electric',x-16,239+bob,32,3);r('ink',x-12,243+bob,3,12);r('ink',x+9,243+bob,3,12);r('ink',x-15,247+bob,30,2);r('paper',x-14,240+bob,5,1);
   particles=particles.filter(a=>a.life>0);for(const a of particles){a.life-=dt;a.x+=a.vx*dt;a.y+=a.vy*dt;a.vy+=160*dt;r(a.color,a.x,a.y,3,3);}
   labels=labels.filter(a=>a.life>0);c.font='900 10px Pretendard';c.textAlign='center';for(const a of labels){a.life-=dt;a.y-=18*dt;c.fillStyle=p.paper;c.fillText(a.text,Math.round(a.x)+1,Math.round(a.y)+1);c.fillStyle=p[a.color];c.fillText(a.text,Math.round(a.x),Math.round(a.y));}c.restore();
  }
  return{draw,feedback,reset(){particles=[];labels=[];shake=0;draw.lastX=undefined;}};
 }
 root.WorkshopCatchRenderer={create};
})(window);
