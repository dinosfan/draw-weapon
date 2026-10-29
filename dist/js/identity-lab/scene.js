IdentityLab.mountScene=(canvas,onFrame)=>{
 const c=canvas.getContext('2d'),P=GamePalette.tokens,M=IdentityLab.Motion,A=IdentityLab.assets;
 let raf=0,revision=0,subject,move,elapsed=0,paused=false,lastNow,settle;
 const origin={x:290,y:272},target={x:762,y:153};
 function stamp(asset,x,y,size,angle=0,alpha=1){c.save();c.globalAlpha=alpha;c.translate(Math.round(x),Math.round(y));c.rotate(angle);c.drawImage(A[asset],-size/2,-size/2,size,size);c.restore();}
 function line(x,y,x2,y2,width,color){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(x,y);c.lineTo(x2,y2);c.stroke();}
 function mark(x,y,q,kind,color){
  if(q<0||q>1)return;c.save();c.translate(x,y);c.globalAlpha=1-q;
  if(kind==='pierce'){
   line(-26-q*30,7,34+q*40,-7,5,P.paper);line(-20,8,28,-6,2,P.ink);
   for(let i=0;i<8;i++){const a=i*2.399,r=9+q*(18+i*4);line(Math.cos(a)*r,Math.sin(a)*r,Math.cos(a)*(r+8),Math.sin(a)*(r+8),2,color);}
  }else if(kind==='paper'){
   for(let i=0;i<12;i++){const a=i*2.399,r=q*(30+i*5);c.save();c.translate(Math.cos(a)*r,Math.sin(a)*r+q*q*45);c.rotate(a+q*5);c.fillStyle=i%3?color:P.paper;c.fillRect(-4,-2,10-i%4,4);c.strokeStyle=P.ink;c.lineWidth=1;c.strokeRect(-4,-2,10-i%4,4);c.restore();}
  }else{
   for(let i=0;i<10;i++){const a=i*Math.PI/5,r=13+q*55;line(Math.cos(a)*r,Math.sin(a)*r,Math.cos(a)*(r+16*(1-q)),Math.sin(a)*(r+16*(1-q)),i%2?3:5,i%2?color:P.ink);}
   if(q<.18){c.fillStyle=P.paper;c.fillRect(-10,-10,20,20);}
   for(let i=0;i<7;i++){c.fillStyle=i%2?P.metal:color;c.fillRect((i-3)*13*q,28+q*q*30-Math.sin(i)*q*32,5,4);}
  }c.restore();
 }
 function render(){
  c.imageSmoothingEnabled=false;c.clearRect(0,0,960,430);c.fillStyle=P.paper;c.fillRect(0,0,960,430);
  if(!subject)return;const count=move?.count||1,color=P[move?.element]||P.normal,held=subject.hold||{...origin,angle:0},launch=subject.muzzle||origin;
  const contacts=move?Array.from({length:count},(_,i)=>M.sample(move,elapsed,i).hitAt):[];
  const since=contacts.length?Math.min(...contacts.filter(t=>elapsed>=t).map(t=>elapsed-t)):Infinity;
  const shake=since<180?Math.sin(since*.15)*7*(1-since/180):0;
  c.save();c.translate(shake*.25,0);
  c.fillStyle=P.subtle;c.beginPath();c.ellipse(220,397,100,11,0,0,Math.PI*2);c.fill();c.beginPath();c.ellipse(762,227,80,9,0,0,Math.PI*2);c.fill();
  c.fillStyle=P.subtle;for(const [x,y]of [[94,415],[340,406],[460,350],[642,245],[870,238]])c.fillRect(x,y,12,3);
  c.save();c.translate(target.x+shake,target.y);if(since<55)c.globalAlpha=.35;c.drawImage(document.getElementById('enemy-sprite'),-80,-80,160,160);c.restore();
  const firing=move&&elapsed>=260&&elapsed<contacts.at(-1)+90;
  let recoil=0;if(move?.emission)for(const t of contacts){const shot=t-move.flight;recoil+=Math.max(0,1-(elapsed-shot)/100)*(elapsed>=shot?1:0);}
  c.drawImage(document.getElementById('player-sprite'),112-recoil*4,174,196,224);
  const throwActive=move&&!move.emission&&elapsed>=260&&elapsed<move.duration-110;
  if(!throwActive)stamp(subject.asset,held.x-recoil*11,held.y,subject.size,held.angle-recoil*.1);
  if(move){
   for(let i=0;i<count;i++){
    const s=M.sample(move,elapsed,i),offset=(i-(count-1)/2)*(move.spread||0),size=(move.emission==='bullet'?36:move.emission==='paper'?52:subject.size)*(move.scale||1),asset=move.emission||subject.asset;
    const b={x:target.x,y:target.y+offset*.35};
    if(s.visible){
     const pos=M.position(move.path,s.q,launch,b,offset),prev=M.position(move.path,Math.max(0,s.q-.015),launch,b,offset),angle=move.spin?s.angle:Math.atan2(pos.y-prev.y,pos.x-prev.x);
     c.fillStyle=P.subtle;if(!move.emission){c.beginPath();c.ellipse(pos.x,move.path==='drop'?222:Math.max(pos.y+45,290),Math.max(5,22-Math.max(0,220-pos.y)*.05),4,0,0,Math.PI*2);c.fill();}
     for(let j=4;j>=1;j--){const q=s.q-j*.025;if(q<0)continue;const tail=M.position(move.path,q,launch,b,offset);stamp(asset,tail.x,tail.y,size,move.spin?q*move.spin*Math.PI:angle,(1-j/5)*.16);}
     if(move.emission==='bullet')line(pos.x-45*Math.cos(angle),pos.y-45*Math.sin(angle),pos.x,pos.y,2,P.metal);
     stamp(asset,pos.x,pos.y,size,angle);
     if(move.path==='bounce')for(const bounce of [.25,.65]){const at=M.position(move.path,bounce,launch,b);mark(at.x,at.y+30,(s.q-bounce)*5,'dust',P.ground);}
     if(move.path==='ricochet'&&s.q>.58){const at=M.position(move.path,.58,launch,b);mark(at.x,at.y,(s.q-.58)*4,'pierce',color);}
    }
    if(move.emission==='bullet'){
     const shot=s.hitAt-move.flight,u=(elapsed-shot)/300;if(u>=0&&u<1){c.save();c.translate(origin.x-20-u*75,origin.y+u*u*100-20);c.rotate(u*10);c.fillStyle=P.metal;c.fillRect(-3,-6,6,12);c.restore();}
     const flash=(elapsed-shot)/70;if(flash>=0&&flash<1){line(launch.x,launch.y,launch.x+29,launch.y-8,5,color);line(launch.x,launch.y,launch.x+20,launch.y+14,4,P.paper);}
    }
    mark(b.x,b.y,(elapsed-s.hitAt)/340,move.impact,color);
   }
   if(!move.emission){const start=contacts.at(-1)+210,q=(elapsed-start)/(move.duration-110-start);if(q>=0&&q<1){const p=M.position('curve',q,target,origin);stamp(subject.asset,p.x,p.y,subject.size,-q*3);}}
  }
  c.restore();
  const first=contacts[0],last=contacts.at(-1),phase=!move?'준비 완료':elapsed<260?'자세 잡기':elapsed<first?'발사체 이동':elapsed<last+110?'타격':elapsed<move.duration-100?'회수 · 잔광':'준비 완료';
  const hits=contacts.filter(t=>elapsed>=t).length;onFrame({phase,hit:hits>0,hp:move?100-Math.round(move.damage*hits/count):100,progress:move?Math.min(100,elapsed/move.duration*100):0,finished:!move||elapsed>=move.duration});
 }
 function cancel(){revision++;cancelAnimationFrame(raf);settle?.();settle=undefined;lastNow=undefined;paused=false;}
 function select(next){cancel();subject=next;move=undefined;elapsed=0;render();}
 function play(next){cancel();move=next;elapsed=0;const token=revision,reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  return new Promise(resolve=>{settle=resolve;
   const tick=now=>{if(token!==revision)return;if(lastNow!==undefined&&!paused)elapsed+=Math.min(40,now-lastNow);lastNow=now;if(reduced)elapsed=move.duration;render();if(elapsed<move.duration)raf=requestAnimationFrame(tick);else{settle=undefined;resolve();}};
   raf=requestAnimationFrame(tick);
  });
 }
 function pause(){paused=!paused;return paused;}
 function seek(percent){if(!move)return;cancel();elapsed=M.clamp(percent/100)*move.duration;render();}
 return{select,play,cancel,pause,seek};
};

