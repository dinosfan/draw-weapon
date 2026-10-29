(function(root){
 const clamp=n=>Math.max(0,Math.min(1,n));
 function position(path,q,a,b,offset=0){
  q=clamp(q);let x=a.x+(b.x-a.x)*q,y=a.y+(b.y-a.y)*q;
  if(path==='curve')y-=Math.sin(q*Math.PI)*(125+offset);
  if(path==='bounce'){const floor=330;if(q<.25)y=a.y+(floor-a.y)*Math.pow(q/.25,2);else if(q<.65)y=floor-Math.sin((q-.25)/.4*Math.PI)*130;else y=floor+(b.y-floor)*Math.pow((q-.65)/.35,.8);}
  if(path==='drop'){const top={x:b.x,y:-90};if(q<.55){const p=q/.55;x=a.x+(top.x-a.x)*p;y=a.y+(top.y-a.y)*p;}else{x=b.x;y=top.y+(b.y-top.y)*Math.pow((q-.55)/.45,2);}}
  if(path==='ricochet'){const c={x:(a.x+b.x)*.6,y:345};if(q<.58){const p=q/.58;x=a.x+(c.x-a.x)*p;y=a.y+(c.y-a.y)*p;}else{const p=(q-.58)/.42;x=c.x+(b.x-c.x)*p;y=c.y+(b.y-c.y)*p;}}
  if(path==='glide')y-=Math.sin(q*Math.PI)*100;
  if(path==='spiral'){x+=Math.sin(q*Math.PI*2)*55*Math.sin(q*Math.PI);y-=Math.sin(q*Math.PI)*160+Math.sin(q*Math.PI*2)*40;}
  if(path==='pierce'&&q>.85)x+=(q-.85)*220;
  return{x,y:y+offset*Math.sin(q*Math.PI)};
 }
 function sample(move,elapsed,index=0){const start=260+index*(move.spacing||0),q=(elapsed-start)/move.flight;return{q,visible:q>=0&&q<=1,hitAt:start+move.flight,angle:q*(move.spin||0)*Math.PI};}
 const api={clamp,position,sample};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.IdentityLab.Motion=api;
})(typeof window!=='undefined'?window:globalThis);
