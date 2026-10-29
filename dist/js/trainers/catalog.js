window.Trainers = {};
Trainers.palette = { ink:'#000000', paper:'#f7f9f6', skin:'#f4d47d', shade:'#d89848', red:'#ff5838', redDark:'#b83020', yellow:'#ffb000', green:'#58a838', greenDark:'#306820', pale:'#a8d058', gray:'#a8a8a8', dark:'#383838' };
Trainers.roster = [
  {id:'cap',name:'루키',tag:'첫발을 내딛는 모험가',look:'뒤로 쓴 빨간 모자 · 가벼운 조끼',outfit:'red',accent:'paper',hair:'dark',style:'cap'},
  {id:'scout',name:'모리',tag:'숲길을 찾는 탐험가',look:'초록 후드 · 작은 탐험 가방',outfit:'green',accent:'pale',hair:'shade',style:'hood'},
  {id:'mechanic',name:'토리',tag:'뭐든 고치는 발명가',look:'노란 작업복 · 머리 위의 고글',outfit:'yellow',accent:'gray',hair:'dark',style:'goggles'},
  {id:'wanderer',name:'시온',tag:'바람을 따르는 방랑자',look:'짧은 검은 망토 · 빨간 머플러',outfit:'dark',accent:'red',hair:'gray',style:'cloak'},
  {id:'artist',name:'하루',tag:'상상을 그리는 낙서가',look:'초록 베레모 · 흰 멜빵 작업복',outfit:'paper',accent:'green',hair:'redDark',style:'beret'},
  {id:'fighter',name:'단',tag:'겁 없이 나서는 도전자',look:'빨간 머리띠 · 소매 없는 도복',outfit:'paper',accent:'red',hair:'dark',style:'band'}
];

Trainers.withName = name => name + ((name.charCodeAt(name.length-1)-0xac00)%28 ? '과' : '와');
