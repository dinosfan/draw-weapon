(function(root){
 const roster=[
 {id:'inkking',name:'왕관 쓴 잉크왕',types:['ghost','dark'],sprite:'inkking',moves:[['잉크 손아귀',18,'ghost'],['왕관의 압력',30,'dark'],['잉크 모으기',0],['검은 속삭임',12,'ghost','confusion',30]],second:{name:'범람하는 잉크왕',types:['ghost','dark'],maxHp:120,moves:[['범람하는 잉크',23,'ghost'],['왕관 낙하',33,'dark'],['왕좌 재정비',0],['심연의 속삭임',15,'ghost','confusion',35]]}},
 {id:'gearjudge',name:'태엽 심판관',types:['metal'],sprite:'gearjudge',moves:[['기어 펀치',19,'metal'],['분침 관통',29,'metal'],['태엽 조정',0],['전류 방출',12,'electric','paralysis',30]],second:{name:'과부하 태엽 심판관',types:['metal','electric'],maxHp:115,moves:[['과전류 타격',22,'electric'],['종말의 시침',34,'metal'],['과열 냉각',0],['방전 충돌',16,'electric','paralysis',35]]}},
 {id:'voideye',name:'공백의 관측자',types:['illusion','ice'],sprite:'voideye',moves:[['시선 조각',18,'illusion'],['얼어붙은 시선',29,'ice'],['눈 감기',0],['차가운 눈물',12,'ice','freeze',15]],second:{name:'깨어난 공백의 눈',types:['illusion','ice'],maxHp:110,moves:[['균열 광선',23,'illusion'],['백야의 파열',33,'ice'],['눈 고르기',0],['어지러운 시선',14,'illusion','confusion',30]]}},
 {id:'hydra',name:'접힌 종이 히드라',types:['dragon'],sprite:'hydra',moves:[['종이 송곳니',19,'dragon'],['겹날개 내려치기',30,'flying'],['목 접기',0],['불씨 숨결',13,'fire','burn',25]],second:{name:'세 겹의 화염 히드라',types:['dragon','fire'],maxHp:125,moves:[['세 갈래 숨결',24,'dragon'],['화염 접어치기',34,'fire'],['잿빛 호흡',0],['불붙은 송곳니',16,'fire','burn',30]]}}
 ];
 const moves=list=>list.map(([name,damage,element='normal',status,chance])=>({name,damage,element,...(status?{status,chance}:{})}));
 const titles={dragon:['여백의 파멸룡','깨어난 여백의 파멸룡'],moon:['월식의 사냥꾼','검은 달의 집행자'],raven:['밤을 삼킨 까마귀','종말의 먹빛 까마귀'],mind:['균열의 관측문','열린 심연의 눈']};
 function decorate(enemy){
  if(enemy.boss)return enemy;
  const title=titles[enemy.id],name=title?.[0]||enemy.name;
  const second=enemy.second||{name:title?.[1]||name+' · 각성',types:enemy.types,maxHp:115,moves:enemy.moves.map(m=>({...m,damage:m.damage?Math.min(34,m.damage+4):0}))};
  return{...enemy,name,boss:true,phaseCount:2,second:{...second,moves:Array.isArray(second.moves[0])?moves(second.moves):second.moves}};
 }
 function encounter(enemy,state){return enemy.boss&&state?.bossPhase===1?{...enemy,...enemy.second,boss:true,phaseCount:2,phase:1}:enemy;}
 function advance(state,enemy){if(!enemy?.boss||state.bossPhase===1||state.enemyHp!==0||state.hp<=0)return false;state.bossPhase=1;state.enemyHp=enemy.second.maxHp;state.phaseTurn=0;state.enemyStatus=null;state.enemyStatusTurns=0;state.enemyVolatile={};state.enemyStages={attack:0,defense:0};state.feedback.phaseChange={name:enemy.second.name,message:enemy.name+'의 진짜 모습이 드러났다!'};state.message=state.feedback.phaseChange.message+'\n'+enemy.second.name+' · 2페이즈';return true;}
 const api={roster,moves,decorate,encounter,advance};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.BattleBosses=api;
})(typeof window!=='undefined'?window:globalThis);
