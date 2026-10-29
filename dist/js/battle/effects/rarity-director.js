(function(root){
 const Profiles=typeof module!=='undefined'&&module.exports?require('../../weapons/rarity-effects.js'):root.Craft.RarityEffects;
 const clamp=n=>Math.max(0,Math.min(1,n));
 function timeline(profile,plan,elapsed){const t=clamp((elapsed-profile.lead)/plan.duration),impact=elapsed-profile.lead-plan.duration*plan.contact,total=profile.lead+plan.duration+profile.tail;return{t,impact,total,preparing:elapsed<profile.lead,done:elapsed>=total};}
 function backdrop(ctx,scene,profile,elapsed,plan){if(!profile.dim)return;const lead=clamp(elapsed/Math.max(1,profile.lead)),out=1-clamp((elapsed-profile.lead-plan.duration)/Math.max(1,profile.tail));ctx.save();ctx.globalAlpha=profile.dim*lead*out;ctx.fillStyle=root.GamePalette.tokens.ink;ctx.fillRect(0,0,scene.w,scene.h);ctx.restore();}
 function fit(scene,profile,w,h){const spread=(profile.echoes?8+profile.rank*4:0)+(scene.self?16:0),radius=.57*(1+profile.echoes*.045),size=Math.min(scene.size,Math.max(12,(Math.min(w,h)/2-8-spread)/radius)),margin=radius*size+spread;return{...scene,size,x:Math.max(margin,Math.min(w-margin,scene.x)),y:Math.max(margin,Math.min(h-margin,scene.y))};}
 function scatter(scene,index,progress,profile){const turn=index*2.399963,travel=(22+profile.rank*8+(index%3)*10)*progress,bearing=Number.isFinite(scene.angle)?scene.angle:0;
  if(scene.self)return{x:Math.cos(turn)*travel*.5,y:-progress*(24+profile.rank*7)+Math.sin(turn)*travel*.2};
  if(['shot','spray','beam','thrust'].includes(scene.mode)){const angle=bearing+(index%5-2)*.24;return{x:Math.cos(angle)*travel,y:Math.sin(angle)*travel+progress*progress*10};}
  if(scene.mode==='swing'){const angle=bearing-1.1+(index%7)*.34;return{x:Math.cos(angle)*travel,y:Math.sin(angle)*travel*.8};}
  return{x:Math.cos(turn)*travel,y:Math.sin(turn)*travel*.7+progress*progress*(scene.mode==='smash'?30:15)};
 }
 // Every extra layer is a copy or a fragment of the selected skill's actual artwork.
 function impact(ctx,draw,fragment,scene,profile,elapsed,duration){
  if(elapsed<0||elapsed>=duration||scene.miss)return;
  const q=clamp(elapsed/duration),fade=1-q*q,col=q<profile.peak?1:q<.76?2:3,burst=1-(1-clamp(q/profile.peak))**3,size=scene.size*(.72+burst*.42);
  for(let i=profile.echoes;i>0;i--){const phase=q-i*.065;if(phase<0)continue;const angle=i*2.399963,spread=(8+profile.rank*4)*Math.sin(clamp(phase)*Math.PI);draw(ctx,col,scene.x+Math.cos(angle)*spread,scene.y+Math.sin(angle)*spread*.65,size*(1+i*.045),{alpha:fade*.09,angle:0});}
  draw(ctx,col,scene.x,scene.y+(scene.self?-q*16:0),size,{alpha:fade,angle:0});
  if(q>.12&&q<.92)for(let i=0;i<profile.fragments;i++){const angle=i*2.399963+profile.rank*.2,flight=clamp((q-.12)/.8),offset=scatter(scene,i,flight,profile);fragment?.(ctx,i,scene.x+offset.x,scene.y+offset.y,scene.size*(.11+(i%3)*.025),{alpha:(1-flight)*.62,angle:angle*.2});}
 }
 const api={profile:Profiles.profile,timeline,backdrop,fit,scatter,impact};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.RarityDirector=api;
})(typeof window!=='undefined'?window:globalThis);
