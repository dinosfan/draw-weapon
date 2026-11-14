const base=require('./weapon.cjs');
module.exports={...base,name:'낙서 로켓 런처',type:'로켓 발사기',types:['fire','metal'],typeReason:'로켓 추진 화염과 발사관의 강철 구조',trait:'추진 화약',reason:'긴 발사관에서 꼬리 불꽃이 달린 로켓을 발사하는 그림입니다.',moves:[
 {name:'직선 로켓',description:'발사관에서 로켓 한 발을 쏘아 적에게 충돌시킵니다.',effectBrief:'A small pointed rocket streaks forward with a white exhaust trail, strikes in a compact flash and scatters tiny metal fragments.',damage:30,pp:10},
 {name:'산탄 로켓',description:'작은 로켓 세 발이 퍼져 나가 적에게 충돌합니다.',effectBrief:'Three tiny finned rockets fan outward along diverging exhaust trails and burst into three separate clusters of sparks.',damage:24,pp:8},
 {name:'관통 탄두',description:'뾰족한 탄두가 적을 꿰뚫고 작은 파편을 남깁니다.',effectBrief:'A narrow pointed warhead pierces straight through a white needle-shaped impact, leaving a thin contrail and sharp fragments.',damage:37,pp:5},
 {name:'고폭 탄두',description:'큰 로켓이 적에게 닿아 폭발과 화염을 일으킵니다.',effectBrief:'A heavy finned rocket detonates into a broad jagged white blast ring, followed by outward metal shards and fading hot sparks.',damage:48,pp:3}
].map(m=>({...base.moves[0],...m,element:'fire',heal:0,skipCounter:false,delivery:{mode:'shot',payload:'rocket',path:'straight',count:m.name==='산탄 로켓'?3:1,spread:m.name==='산탄 로켓'?12:0}}))};
