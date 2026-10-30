(function(root){
 const width=480,height=300,duration=60,catchY=238,groundY=278;
 const rewards=Object.freeze([
  {id:'potion',name:'포션',icon:'🧪',at:120,color:'nature',effect:'체력 40 회복'},
  {id:'charge',name:'기술 충전제',icon:'⚡',at:260,color:'electric',effect:'선택한 기술 PP 5 회복'},
  {id:'cleanse',name:'상태 회복약',icon:'💧',at:420,color:'water',effect:'상태이상 해제'}
 ]);
 function create(random=Math.random){return{status:'ready',elapsed:0,score:0,caught:0,bombs:0,combo:0,bestCombo:0,player:{x:240,facing:1,invulnerable:0},entities:[],spawnIn:.15,nextId:1,random};}
 function start(s){if(s.status==='ready')s.status='running';return s;}
 function pause(s){if(s.status==='running')s.status='paused';}
 function resume(s){if(s.status==='paused')s.status='running';}
 const earned=score=>rewards.filter(r=>score>=r.at);
 const remaining=s=>Math.max(0,duration-s.elapsed);
 function spawn(s){const random=s.random,roll=random(),kind=roll<.2?'bomb':['leaf','crystal','bottle'][Math.min(2,Math.floor(random()*3))];s.entities.push({id:s.nextId++,kind,x:36+random()*408,y:23,speed:83+random()*27+s.elapsed*.75,phase:random()*6.28});}
 function tick(s,dt,input,events){
  s.elapsed=Math.min(duration,s.elapsed+dt);const p=s.player;p.invulnerable=Math.max(0,p.invulnerable-dt);
  const axis=Math.max(-1,Math.min(1,input.axis||0)),target=Number.isFinite(input.target)?Math.max(40,Math.min(440,input.target)):p.x;
  const delta=axis?axis*310*dt:Math.sign(target-p.x)*Math.min(Math.abs(target-p.x),310*dt);if(delta)p.facing=Math.sign(delta);p.x=Math.max(40,Math.min(440,p.x+delta));
  s.spawnIn-=dt;const interval=s.elapsed<20?.58:s.elapsed<45?.46:.34;
  while(s.spawnIn<=0&&s.elapsed<duration-2.3){spawn(s);s.spawnIn+=interval;}
  const active=[];
  for(const item of s.entities){const oldY=item.y;item.y+=item.speed*dt;const near=Math.abs(item.x-p.x)<26,crossed=oldY<=catchY+8&&item.y>=catchY-7;
   if(near&&crossed){
    if(item.kind==='bomb'){
     if(!p.invulnerable){s.bombs++;s.combo=0;s.score=Math.max(0,s.score-20);p.invulnerable=.7;events.push({kind:'bomb',x:item.x,y:catchY});}else events.push({kind:'deflect',x:item.x,y:catchY});
    }else{const before=s.score;s.caught++;s.combo++;s.bestCombo=Math.max(s.bestCombo,s.combo);const points=10+Math.min(10,Math.floor(s.combo/5)*2);s.score+=points;events.push({kind:'catch',material:item.kind,points,x:item.x,y:catchY});for(const reward of rewards)if(before<reward.at&&s.score>=reward.at)events.push({kind:'reward',reward});}
    continue;
   }
   if(item.y>groundY){if(item.kind!=='bomb')s.combo=0;events.push({kind:'miss',x:item.x,y:groundY});continue;}active.push(item);
  }s.entities=active;
 }
 function step(s,seconds,input={}){
  const events=[];if(s.status!=='running'||!Number.isFinite(seconds)||seconds<=0)return events;
  let left=Math.min(seconds,remaining(s));while(left>1e-8){const dt=Math.min(1/60,left);tick(s,dt,input,events);left-=dt;}
  if(remaining(s)<1e-7){s.elapsed=duration;s.status='finished';s.entities=[];events.push({kind:'finish'});}return events;
 }
 const api={width,height,duration,catchY,groundY,rewards,create,start,pause,resume,step,earned,remaining};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.WorkshopCatchModel=api;
})(typeof window!=='undefined'?window:globalThis);
