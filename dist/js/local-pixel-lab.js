(async()=>{
 const $=id=>document.getElementById(id),P=GamePalette.tokens,names={heart:'하트 파열',slash:'초승달 참격',electric:'전기 방전'},phases=['준비','타격','파열','소멸'],cache=new Map(),buttons=[],frameButtons=[];
 const ctx=$('pixel-stage').getContext('2d');let selected='heart',image,frame=-1,raf=0,revision=0,dark=false;
 BattlePreview.drawSprites();
 function paint(){ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,960,430);ctx.fillStyle=dark?P.dark:P.paper;ctx.fillRect(0,0,960,430);ctx.drawImage($('player-sprite'),115,175,196,224);ctx.drawImage($('enemy-sprite'),680+(frame===1?5:0),65,160,160);
  if(image&&frame>=0)ctx.drawImage(image,frame*96,0,96,96,654,39,216,216);
  $('pixel-hp').style.width=frame>=1?'72%':'100%';$('pixel-phase').textContent=frame>=0?phases[frame]:'기술을 골라 봐.';frameButtons.forEach((b,i)=>b.setAttribute('aria-pressed',String(frame===i)));
 }
 function cancel(){revision++;cancelAnimationFrame(raf);}
 function play(){if(!image)return;cancel();const token=revision;let start;
  function tick(now){if(token!==revision)return;if(start===undefined)start=now;const t=now-start;frame=t<180?0:t<280?1:t<410?2:t<630?3:-1;paint();if(t<1100)raf=requestAnimationFrame(tick);}
  raf=requestAnimationFrame(tick);
 }
 async function select(id){cancel();const token=revision;selected=id;image=undefined;frame=-1;buttons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.id===id)));$('effect-title').textContent=names[id];$('pixel-raw').href='assets/studies/local-pixel-animation/'+id+'-raw.png';paint();
  try{if(!cache.has(id)){const img=new Image();img.src='assets/studies/local-pixel-animation/'+id+'-sheet.png';await img.decode();cache.set(id,img);}if(token!==revision)return;image=cache.get(id);
   frameButtons.forEach((b,i)=>{const c=b.querySelector('canvas').getContext('2d');c.clearRect(0,0,96,96);c.drawImage(image,i*96,0,96,96,0,0,96,96);});play();
  }catch{$('pixel-note').textContent='이 결과를 불러오지 못했어요.';}
 }
 for(const [id,label]of Object.entries(names)){const b=document.createElement('button');b.type='button';b.dataset.id=id;b.textContent=label;b.addEventListener('click',()=>select(id));buttons.push(b);$('effect-tabs').append(b);}
 for(let i=0;i<4;i++){const b=document.createElement('button');b.type='button';b.className='pixel-frame';const canvas=document.createElement('canvas');canvas.width=canvas.height=96;canvas.setAttribute('aria-hidden','true');const label=document.createElement('span');label.textContent=(i+1)+' / '+phases[i];b.append(canvas,label);b.addEventListener('click',()=>{cancel();frame=i;paint();});frameButtons.push(b);$('pixel-frames').append(b);}
 $('play-effect').addEventListener('click',play);$('background-effect').addEventListener('click',()=>{dark=!dark;document.body.classList.toggle('pixel-dark',dark);$('background-effect').textContent=dark?'밝은 배경':'어두운 배경';paint();});document.addEventListener('visibilitychange',()=>{if(document.hidden)cancel();});
 try{const reports=await(await fetch('assets/studies/local-pixel-animation/inspection.json')).json();$('pixel-note').textContent='실제 생성 프레임 · 색표 정리 외 수작업 대체 없음'+(reports.some(r=>!r.formatCheck)?' · 일부 프레임 배치 보완 필요':'');}catch{$('pixel-note').textContent='실제 생성 프레임 · 자동 생성 품질 비교용';}
 await select(selected);
})();

