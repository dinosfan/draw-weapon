window.BattleWeaponPose={};
BattleWeaponPose.mount=arena=>{
  const held=document.getElementById('held-battle-weapon'),player=arena.querySelector('.player-fighter');let base,restore=null;
  function reset(){if(!restore)return;held.style.transform=restore.transform;held.style.transformOrigin=restore.origin;held.style.opacity=restore.opacity;player.style.transform=restore.player;restore=null;}
  function configure(rig,target,bounds={x:0,y:0,width:1,height:1}){
    reset();if(Craft.attachToHand)Craft.attachToHand(held,rig);
    bounds=held.artworkBounds||bounds;
    restore={transform:held.style.transform||'',origin:held.style.transformOrigin||'',opacity:held.style.opacity||'',player:player.style.transform||''};
    const box=arena.getBoundingClientRect(),rect=player.getBoundingClientRect(),h=held.getBoundingClientRect();
    const w=held.clientWidth||h.width,height=held.clientHeight||h.height;
    const gx=(bounds.x+rig.gripX*bounds.width)*w,gy=(bounds.y+rig.gripY*bounds.height)*height;
    const tx=(bounds.x+rig.tipX*bounds.width)*w,ty=(bounds.y+rig.tipY*bounds.height)*height;
    const grip={x:rect.left-box.left+(held.offsetLeft??0)+gx,y:rect.top-box.top+(held.offsetTop??0)+gy};
    const aim=Math.atan2(target.y-grip.y,target.x-grip.x),local=Math.atan2(ty-gy,tx-gx);
    base={grip,target,gx,gy,dx:tx-gx,dy:ty-gy,angle:aim-local,aim};held.style.transformOrigin=gx+'px '+gy+'px';return update({});
  }
  function update({angle=0,reach=0,recoil=0,hidden=false}={}){
    const b=base,a=b.angle+angle,shift={x:(b.target.x-b.grip.x)*reach*.72,y:(b.target.y-b.grip.y)*reach*.72};
    const rx=-Math.cos(b.aim)*recoil,ry=-Math.sin(b.aim)*recoil;
    player.style.transform='translate('+shift.x+'px,'+shift.y+'px)';
    held.style.transform='translate('+rx+'px,'+ry+'px) rotate('+(a*180/Math.PI)+'deg)';held.style.opacity=hidden?'0':'1';
    return{grip:{x:b.grip.x+shift.x+rx,y:b.grip.y+shift.y+ry},tip:{x:b.grip.x+shift.x+rx+b.dx*Math.cos(a)-b.dy*Math.sin(a),y:b.grip.y+shift.y+ry+b.dx*Math.sin(a)+b.dy*Math.cos(a)},angle:b.aim};
  }
  return{configure,update,reset};
};
