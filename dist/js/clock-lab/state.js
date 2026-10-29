ClockLab.initial=()=>({hp:76,enemyHp:100,time:2,field:0,memory:24,turn:0,ended:false,message:'시간을 모아둘까, 지금 써버릴까?\n이번에는 네 기술의 쓰임새부터 달라.'});
ClockLab.available=(state,id)=>!state.ended&&(id==='wind'?state.time<6:id==='field'?state.time>=2&&!state.field:id==='rewind'?state.time>=2&&state.memory>0&&state.hp<100:id==='release'?state.time>0&&state.hp>8:false);
ClockLab.reduce=(state,id)=>{
  if(!ClockLab.available(state,id))return state;
  const next={...state};let message='',damage=0;
  if(id==='wind'){const gained=Math.min(2,6-next.time);next.time+=gained;message='초침을 감아 시간 '+gained+'칸을 저장했다.';}
  if(id==='field'){next.time-=2;next.field=3;message='적 주위에 시간장을 설치했다.\n적의 공격 3회 동안 피해가 절반이 된다.';}
  if(id==='rewind'){next.time-=2;const restored=Math.min(next.memory,100-next.hp);next.hp+=restored;message='직전에 받은 '+state.memory+' 피해를 되감았다!\n실제 회복 '+restored+'.';next.memory=0;}
  if(id==='release'){damage=16+next.time*14;message='저장 시간 '+next.time+'칸을 모두 해방했다!\n'+damage+' 피해 · 미래의 대가로 체력 8 소모.';next.time=0;next.hp-=8;}
  next.enemyHp=Math.max(0,next.enemyHp-damage);
  if(next.enemyHp>0){
    const raw=ClockLab.enemyDamage[state.turn%3],incoming=next.field?Math.ceil(raw/2):raw;
    next.hp=Math.max(0,next.hp-incoming);next.memory=incoming;
    message+='\n'+(next.field?'시간장이 공격을 늦췄다! ':'')+'받은 피해 '+incoming+'.';
    if(next.field)next.field--;
  }
  next.turn++;next.ended=next.hp===0||next.enemyHp===0;
  next.message=message+(next.ended?(next.enemyHp===0?'\n승리! 네가 선택한 순간이 맞아떨어졌다.':'\n시간이 다했다… 처음 상태로 다시 실험해보자.'):'');
  return next;
};
