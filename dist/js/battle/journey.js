(function(root){
 const roster=[
  {id:'spark',name:'번개 낙서쥐',types:['electric'],sprite:'spark',moves:[['정전기 꼬리',12,'electric'],['번개 도약',24,'electric'],['숨 고르기',0],['찌릿한 발톱',10,'normal','paralysis',35]]},
  {id:'beetle',name:'종이접기 풍뎅이',types:['bug'],sprite:'beetle',moves:[['접힌 뿔',13,'bug'],['날개 돌진',23,'flying'],['날개 쉬기',0],['뿔 연타',17,'bug']]},
  {id:'ember',name:'불씨 도깨비',types:['fire'],sprite:'ember',moves:[['불씨 던지기',12,'fire'],['화르륵',25,'fire'],['재 모으기',0],['뜨거운 손바닥',11,'fire','burn',35]]},
  {id:'jelly',name:'물방울 해파리',types:['water'],sprite:'jelly',moves:[['물방울',12,'water'],['파도 밀치기',24,'water'],['잔물결',0],['촉수 감기',16,'water']]},
  {id:'ghost',name:'지워진 유령',types:['ghost'],sprite:'ghost',moves:[['종이 그림자',15,'ghost'],['그림자 습격',28,'ghost'],['실체 흐리기',0],['뒤섞인 속삭임',10,'illusion','confusion',40]]},
  {id:'crystal',name:'서리 결정체',types:['ice'],sprite:'crystal',moves:[['얼음 파편',16,'ice'],['고드름 낙하',29,'ice'],['서리 고르기',0],['차가운 숨결',12,'ice','freeze',20]]},
  {id:'toxin',name:'독잉크 버섯',types:['poison','nature'],sprite:'sprout',moves:[['잉크 방울',14,'poison'],['포자 폭발',27,'nature'],['포자 흩뜨리기',0],['독잉크 분사',10,'poison','poison',50]]},
  {id:'golem',name:'흑연 바위골렘',types:['rock','ground'],sprite:'crystal',moves:[['돌가루 펀치',17,'rock'],['바위 내려치기',30,'ground'],['금 간 틈 정리',0],['자갈 쏟기',19,'rock']]},
  {id:'dragon',name:'여백의 꼬마용',types:['dragon'],sprite:'dragon',moves:[['꼬리 휘두르기',19,'dragon'],['용의 숨결',32,'dragon'],['날개 접기',0],['공중 강타',23,'flying']]},
  {id:'moon',name:'달빛 종이토끼',types:['fairy'],sprite:'beetle',moves:[['달빛 조각',18,'fairy'],['별빛 도약',30,'fairy'],['달 바라보기',0],['꿈결 울림',12,'fairy','sleep',35]]},
  {id:'raven',name:'먹빛 종이까마귀',types:['dark','flying'],sprite:'ghost',moves:[['먹빛 깃털',18,'dark'],['급강하',31,'flying'],['깃털 고르기',0],['놀래키기',15,'dark','flinch',30]]},
  {id:'mind',name:'접힌 차원문',types:['illusion'],sprite:'jelly',moves:[['접힌 공간',19,'illusion'],['차원 파동',32,'illusion'],['문 닫기',0],['어지러운 잔상',12,'illusion','confusion',40]]}
 ];
 const Bosses=typeof module!=='undefined'&&module.exports?require('./bosses.js'):root.BattleBosses;if(Bosses)roster.push(...Bosses.roster); const locations=['낙서의 샛길','구겨진 페이지','여백의 문턱'];
 const hash=text=>{let h=2166136261;for(const c of text)h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;};
 const valid=seed=>typeof seed==='string'&&/^[a-z0-9]{6,32}$/.test(seed);
 const seed=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,8);
 function route(value,classic){
  if(!valid(value))return classic;
  let n=hash(value);const random=()=>{n^=n<<13;n^=n>>>17;n^=n<<5;return(n>>>0)/4294967296;},used=new Set();
  return [0,1,2].map(stage=>{const pool=stage===0?[0,1,2,3]:stage===1?[4,5,6,7]:Array.from({length:roster.length-8},(_,i)=>i+8);let index=pool[Math.floor(random()*pool.length)];while(used.has(index))index=pool[(pool.indexOf(index)+1)%pool.length];used.add(index);const data=roster[index];const encounter={...data,level:7+stage*3,maxHp:[110,135,165][stage],location:locations[stage],subtitle:stage===2?'마지막 수호자':stage===0?'새로운 만남':'두 번째 관문',moves:data.moves.map(([name,damage,element='normal',status,chance])=>({name,damage,element,...(status?{status,chance}:{})}))};return stage===2&&Bosses?Bosses.decorate(encounter):encounter;});
 }
 function intent(encounter,state){return encounter.moves[Math.max(0,state.phaseTurn??state.turn??0)%encounter.moves.length];}
 function note(encounter,state){const move=intent(encounter,state);return{move,strong:move.damage>=25,rest:move.damage===0,status:move.status||null};}
 function carry(url,sourceHash){if(typeof sourceHash!=='string')return url;const params=new URLSearchParams(url.split('#')[1]),source=new URLSearchParams((sourceHash||'').replace(/^#/,''));if(valid(source.get('journey')))params.set('journey',source.get('journey'));else params.delete('journey');return'battle.html#'+params;}
 const api={roster,valid,seed,route,intent,note,carry};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Craft.Journey=api;
})(typeof window!=='undefined'?window:globalThis);
