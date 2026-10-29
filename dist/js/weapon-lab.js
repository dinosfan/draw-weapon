(()=>{
  const samples=[
    {id:'gun',name:'총',family:'firearm',element:'metal',mode:'shot',payload:'bullet',feel:'pierce',grip:[.23,.75],tip:[.98,.15],note:'총구 조준 → 탄환 발사 → 탄피 배출 → 반동 복귀'},
    {id:'rocket',name:'로켓런처',family:'firearm',element:'fire',mode:'shot',payload:'rocket',feel:'heavy',grip:[.3,.8],tip:[.98,.25],note:'직격·곡사·연발·관통 로켓 · 공격 중심 구성'},
    {id:'bow',name:'활',family:'bow',element:'nature',mode:'shot',payload:'arrow',feel:'pierce',grip:[.33,.5],tip:[.98,.5],note:'시위 당기기 → 화살 발사 → 관통'},
    {id:'blade',name:'검',family:'blade',element:'metal',mode:'swing',payload:'none',feel:'slash',grip:[.16,.87],tip:[.94,.08],note:'손잡이를 축으로 휘두르기 → 베기 궤적 → 회수'},
    {id:'hammer',name:'망치',family:'blunt',element:'metal',mode:'smash',payload:'none',feel:'heavy',grip:[.43,.8],tip:[.96,.12],note:'들어 올리기 → 몸을 실어 내려치기 → 타격'},
    {id:'needle',name:'바늘',family:'spear',element:'metal',mode:'thrust',payload:'none',feel:'pierce',grip:[.13,.88],tip:[.98,.03],note:'끝을 겨누기 → 앞으로 찌르기 → 끌어오기'},
    {id:'hose',name:'분사기',family:'sprayer',element:'water',mode:'spray',payload:'water',feel:'pulse',grip:[.23,.75],tip:[.98,.15],note:'분사구에서 물방울이 퍼지는 연속 물줄기'},
    {id:'flower',name:'꽃',family:'plant',element:'nature',mode:'shot',payload:'seed',feel:'pulse',grip:[.18,.88],tip:[.8,.2],note:'꽃머리에서 씨앗 발사 · 뿌리 성장 기술'},
    {id:'whip',name:'채찍',family:'flexible',element:'normal',mode:'bind',payload:'none',feel:'slash',grip:[.08,.92],tip:[.98,.05],note:'손잡이는 쥔 채 끈이 뻗어 상대를 휘감기'},
    {id:'boomerang',name:'부메랑',family:'throwable',element:'normal',mode:'throw',payload:'none',feel:'heavy',grip:[.12,.8],tip:[.95,.3],note:'본체 투척 → 회전 비행 → 손으로 회수'},
    {id:'shield',name:'방패',family:'shield',element:'metal',mode:'ward',payload:'none',feel:'soft',grip:[.3,.6],tip:[.92,.25],note:'방패를 쥐고 방어 장막 전개'}
  ];
  function sketch(c,id){
    const x=c.getContext('2d');x.strokeStyle=GamePalette.tokens.ink;x.fillStyle=GamePalette.tokens.paper;x.lineWidth=4;x.lineJoin='round';x.lineCap='round';
    const line=points=>{x.beginPath();points.forEach(([a,b],i)=>i?x.lineTo(a,b):x.moveTo(a,b));x.stroke();};
    if(id==='rocket'){
      line([[22,30],[150,30],[150,65],[22,65],[22,30]]);line([[64,66],[60,95],[77,95],[80,66]]);line([[133,33],[133,62]]);line([[32,33],[32,62]]);
    }else if(id==='gun'||id==='hose'){
      line([[25,30],[145,30],[145,52],[78,52],[63,96],[40,96],[48,54],[25,54],[25,30]]);line([[81,53],[77,69],[64,69]]);line([[126,33],[126,48]]);line([[50,79],[63,82]]);
      if(id==='hose'){x.beginPath();x.moveTo(46,96);x.bezierCurveTo(15,108,18,70,8,76);x.stroke();}
    }else if(id==='bow'){
      x.beginPath();x.arc(95,60,45,-Math.PI/2,Math.PI/2);x.stroke();line([[95,15],[95,105]]);line([[111,55],[121,63]]);
    }else if(id==='blade'){
      line([[35,100],[62,74],[132,18],[148,13],[143,30],[76,88],[47,110],[35,100]]);line([[46,70],[83,105]]);line([[69,84],[139,23]]);
    }else if(id==='hammer'){
      x.strokeRect(55,20,65,35);line([[82,56],[77,106],[90,106],[95,56]]);line([[63,25],[63,48]]);
    }else if(id==='needle'){
      line([[35,90],[145,25],[120,49],[35,90]]);x.beginPath();x.ellipse(47,82,10,4,-.5,0,Math.PI*2);x.stroke();
    }else if(id==='flower'){
      x.beginPath();x.moveTo(48,108);x.quadraticCurveTo(86,74,112,39);x.stroke();for(let i=0;i<6;i++){const a=i*Math.PI/3;x.beginPath();x.ellipse(115+Math.cos(a)*17,33+Math.sin(a)*17,13,8,a,0,Math.PI*2);x.stroke();}x.beginPath();x.arc(115,33,9,0,Math.PI*2);x.stroke();line([[70,86],[65,66],[85,76]]);
    }else if(id==='whip'){
      line([[25,105],[49,85]]);x.beginPath();x.moveTo(49,85);x.bezierCurveTo(50,20,131,110,144,50);x.bezierCurveTo(154,10,113,16,146,12);x.stroke();
    }else if(id==='boomerang')line([[35,105],[65,20],[146,49],[140,66],[77,49],[52,110],[35,105]]);
    else{x.beginPath();x.ellipse(90,60,35,47,0,0,Math.PI*2);x.stroke();line([[90,20],[90,100]]);line([[65,60],[115,60]]);}
  }
  for(const sample of samples){
    const card=document.createElement('article');card.className='swatch weapon-study';card.style.setProperty('--type-color',Craft.Types.color(sample.element));
    const canvas=document.createElement('canvas');canvas.width=180;canvas.height=120;canvas.setAttribute('aria-label',sample.name+' 작동 확인용 낙서');sketch(canvas,sample.id);
    const title=document.createElement('strong');title.textContent=sample.name;const note=document.createElement('p');note.textContent=sample.note;
    const story=['reveal','sweep','pulse'].map(action=>({action,label:sample.name+' 동작',target:'enemy',part:'whole',motif:'none',duration:400}));
    const moves=Craft.MotionExamples.moves(sample,story);
    const weapon={kind:'custom',icon:'✨',name:sample.name+' (작동 예시)',type:'작동 확인용',trait:'원본 보존',reason:sample.note,attack:24,types:[sample.element],typeReason:'작동 확인용 고정 예시',rig:{family:sample.family,gripX:sample.grip[0],gripY:sample.grip[1],tipX:sample.tip[0],tipY:sample.tip[1]},moves,artwork:canvas.toDataURL('image/png')};
    const link=document.createElement('a');link.textContent=sample.name+' 전투에서 확인';link.href=Craft.weaponBattleUrl(weapon);card.append(canvas,title,note,link);document.getElementById('weapon-studies').append(card);
  }
})();
