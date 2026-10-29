// Motion-lab fixtures only. Actual crafted moves are designed by the AI from the drawing.
(function(root){
  function moves(sample,story,random=Math.random){
    const emit={mode:sample.mode,payload:sample.payload,count:sample.mode==='spray'?6:1,spread:sample.mode==='spray'?20:0,path:sample.mode==='throw'?'arc':'straight'};
    const base={element:sample.element,description:'작동 확인용 기술',damage:0,heal:0,skipCounter:false,pp:8,feel:sample.feel,story};
    const attack=(name,damage,accuracy,pp,delivery={})=>({...base,name,damage,pp,rule:{kind:'attack',accuracy,chance:0,amount:1},delivery:{...emit,...delivery}});
    const effect=(name,kind,{damage=0,accuracy=100,chance=100,amount=1,heal=0,delivery={}}={})=>({...base,name,damage,heal,rule:{kind,accuracy,chance,amount},delivery:{...emit,...delivery}});
    const block=name=>({...effect(name,'protect',{accuracy:85,delivery:{mode:'ward',payload:'none'}}),pp:3,feel:'soft'});
    const pools={
      rocket:[attack('직격 로켓',28,100,12),attack('곡사 포격',36,85,6,{path:'arc'}),attack('연속 로켓',38,80,5,{count:3,spread:18}),attack('관통 로켓',44,75,3),attack('확산 포격',32,90,8,{count:4,spread:28})],
      gun:[attack('정밀 단발',24,100,15),attack('연속 사격',30,90,8,{count:3,spread:8}),attack('산탄 발사',36,80,5,{payload:'pellet',count:6,spread:26}),attack('관통 사격',40,75,4),effect('견제 사격','attackDown',{accuracy:95,delivery:{count:2,spread:12}})],
      bow:[attack('정조준 화살',25,100,12),attack('곡사 화살',32,90,8,{path:'arc'}),attack('연속 화살',36,85,5,{count:3,spread:12}),attack('강궁 일격',42,75,3),effect('빈틈 겨누기','defenseDown',{accuracy:95})],
      blade:[attack('빠른 베기',22,100,15),attack('크게 가르기',36,85,6),attack('끝으로 찌르기',28,95,10,{mode:'thrust'}),attack('연속 베기',32,90,7),effect('무기 쳐내기','attackDown',{accuracy:90})],
      hammer:[attack('짧은 내려치기',26,100,12),attack('머리 위 강타',44,75,3),attack('옆으로 휘두르기',34,85,7,{mode:'swing'}),effect('장갑 파쇄','defenseDown',{accuracy:90,amount:2}),attack('묵직한 밀어치기',30,95,8)],
      needle:[attack('정확한 찌르기',22,100,15),attack('깊이 찌르기',38,80,5),attack('빠른 연속 찌르기',30,95,8),effect('이음새 벌리기','defenseDown',{accuracy:95}),attack('비껴 찌르기',28,95,10)],
      hose:[attack('곧은 물줄기',24,100,15),attack('넓게 뿌리기',30,95,8,{spread:30}),attack('압축 물줄기',40,80,4,{mode:'beam'}),effect('물에 젖은 무기','attackDown',{accuracy:95}),attack('연속 물방울',28,95,10,{mode:'shot',count:5,spread:16})],
      flower:[attack('씨앗 쏘기',22,100,15),attack('뿌리 뻗기',30,90,8,{mode:'grow'}),effect('꽃잎의 생명력','recover',{heal:25,delivery:{mode:'mend',payload:'spore'}}),effect('흩날리는 꽃가루','attackDown',{delivery:{mode:'spray',payload:'spore',count:6,spread:25}}),effect('덩굴로 양분 흡수','drain',{damage:24,accuracy:95,delivery:{mode:'bind'}}),attack('터지는 씨앗',38,80,4,{count:3,spread:18})],
      whip:[attack('끝으로 후려치기',24,100,15),attack('크게 휘감기',34,90,6),effect('무기 감아 당기기','attackDown',{accuracy:95}),effect('균형 무너뜨리기','defenseDown',{accuracy:90}),attack('날카로운 채찍 끝',40,75,4)],
      boomerang:[attack('직선 투척',24,100,15,{path:'straight'}),attack('높은 곡선 투척',32,90,8,{path:'arc'}),attack('휘어 돌아오기',36,85,5,{path:'spiral'}),attack('낮게 날려 맞히기',28,95,10),effect('무기 걸어 당기기','attackDown',{accuracy:90})],
      shield:[block('정면으로 막기'),block('몸을 감싸 막기'),effect('방패 단단히 고정','defenseUp',{amount:2,delivery:{mode:'ward',payload:'none'}}),effect('압박하며 밀기','attackDown',{accuracy:95,delivery:{mode:'smash',payload:'none'}}),attack('방패 모서리 강타',28,95,10,{mode:'smash'}),attack('방패 돌진',36,85,6,{mode:'thrust'})]
    };
    const pool=[...(pools[sample.id]||pools.blade)];
    for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.max(0,Math.min(.999999,random()))*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
    return pool.slice(0,4);
  }
  const api={moves};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Craft.MotionExamples=api;
})(typeof window!=='undefined'?window:globalThis);
