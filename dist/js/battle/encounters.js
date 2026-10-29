// Encounters are data only; combat and UI consume the same values.
BattlePreview.encounters = [
  { name:'낙서 수호자',types:['nature'], level:7, maxHp:110, location:'낙서의 숲', subtitle:'첫 번째 만남', moves:[{name:'몸통박치기',damage:14},{name:'잉크 강타',element:'illusion',damage:25},{name:'휴식',damage:0}] },
  { name:'종이 갑옷 기사',types:['metal'], level:9, maxHp:135, location:'접힌 종이 성문', subtitle:'두 번째 관문', moves:[{name:'종이 베기',element:'metal',damage:17},{name:'접이식 돌진',element:'metal',damage:30},{name:'갑옷 정비',damage:0}] },
  { name:'지우개 거인',types:['normal'], level:12, maxHp:165, location:'빈 페이지의 끝', subtitle:'마지막 수호자', moves:[{name:'지우개 주먹',damage:20},{name:'낙서 지우기',damage:36},{name:'충전',damage:0}] }
];
if(Craft.Journey)BattlePreview.encounters=Craft.Journey.route(new URLSearchParams(location.hash.slice(1)).get('journey'),BattlePreview.encounters);
if(typeof BattleBosses!=='undefined')BattlePreview.encounters=BattlePreview.encounters.map((enemy,index)=>index===2?BattleBosses.decorate(enemy):enemy);
BattlePreview.getEncounter = (stage,state) => typeof BattleBosses!=='undefined'?BattleBosses.encounter(BattlePreview.encounters[Math.max(0,Math.min(BattlePreview.encounters.length-1,Math.trunc(stage)||0))],state):BattlePreview.encounters[Math.max(0,Math.min(BattlePreview.encounters.length-1,Math.trunc(stage)||0))];
BattlePreview.enemyIntent=state=>Craft.Journey?Craft.Journey.intent(BattlePreview.getEncounter(state.stage,state),state):BattlePreview.getEncounter(state.stage,state).moves[state.turn%BattlePreview.getEncounter(state.stage,state).moves.length];
