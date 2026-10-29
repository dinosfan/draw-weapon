(function(root){
  const Types=typeof module!=='undefined'&&module.exports?require('./types.js'):root.Craft.Types;
  const definitions=Object.freeze({
    poison:{label:'독',color:'poison',description:'매 턴 체력 8 감소',immune:['poison','metal']},
    burn:{label:'화상',color:'fire',description:'매 턴 체력 6 감소 · 공격 피해 25% 감소',immune:['fire']},
    paralysis:{label:'마비',color:'electric',description:'매 행동 25% 확률로 행동 불가',immune:['electric']},
    sleep:{label:'잠듦',color:'normal',description:'1~3회 행동 불가 후 깨어남',immune:[]},
    freeze:{label:'얼음',color:'ice',description:'행동 불가 · 매 행동 20% 확률 또는 불꽃 기술 사용/피격으로 해동',immune:['ice']},
    confusion:{label:'혼란',color:'illusion',description:'2~5회 행동 동안 1/3 확률로 자신에게 20 피해',volatile:true,immune:[]},
    flinch:{label:'풀죽음',color:'fighting',description:'다음 행동 1회 불가 후 해제',volatile:true,immune:[]},
    recharge:{label:'반동',color:'rock',description:'강한 기술 사용 후 다음 행동 1회 휴식',volatile:true,immune:[]}
  });
  const key=side=>side==='player'?'playerStatus':'enemyStatus';
  const actor=side=>side==='player'?'내 무기':'상대';
  function clear(state,side){const field=key(side);state[field]=null;state[field+'Turns']=0;}
  function list(state,side){const status=state[key(side)],volatile=state[side+'Volatile']||{};return[...(definitions[status]&&!definitions[status].volatile?[status]:[]),...Object.keys(volatile).filter(value=>definitions[value]?.volatile&&volatile[value]>0)];}
  function apply(state,side,status,types=[],random=Math.random,element='normal'){
    const def=definitions[status];if(!def)throw Error('상태이상 형식 오류');
    const field=key(side),targets=types.map(Types.resolve);
    if(def.volatile){const effects=state[side+'Volatile']??(state[side+'Volatile']={});if(effects[status]>0)return actor(side)+'에게 이미 '+def.label+' 효과가 있다.';effects[status]=status==='confusion'?2+Math.floor(Math.max(0,Math.min(.999999,random()))*4):1;return actor(side)+'에게 '+def.label+'!';}
    if(state[field])return actor(side)+'에게 이미 상태이상이 있다.';
    if(targets.some(type=>def.immune.includes(type))||status==='paralysis'&&Types.resolve(element)==='electric'&&targets.includes('ground'))return actor(side)+'에게 '+def.label+' 상태가 통하지 않는다!';
    state[field]=status;state[field+'Turns']=status==='sleep'?1+Math.floor(Math.max(0,Math.min(.999999,random()))*3):0;
    return actor(side)+'에게 '+def.label+'!';
  }
  function beforeAction(state,side,random=Math.random,element='normal'){
    const field=key(side),status=state[field],name=actor(side);
    let notice='';
    const effects=state[side+'Volatile']||{};
    for(const effect of ['recharge','flinch'])if(effects[effect]>0){delete effects[effect];return{allowed:false,message:name+(effect==='recharge'?'는 반동으로 한 번 쉬었다!':'는 풀죽어서 움직이지 못했다!')};}
    if(status==='sleep'){
      const remaining=state[field+'Turns']??1;
      if(remaining>0){state[field+'Turns']=remaining-1;return{allowed:false,message:name+'는 잠들어 움직이지 못했다!'};}
      clear(state,side);notice=name+'가 잠에서 깨어났다!';
    }
    if(status==='freeze'){
      if(Types.resolve(element)==='fire'||random()<.2){clear(state,side);notice=name+'의 얼음이 녹았다!';}
      else return{allowed:false,message:name+'는 얼어서 움직이지 못했다!'};
    }
    if(status==='paralysis'&&random()<.25)return{allowed:false,message:name+'는 마비되어 움직이지 못했다!'};
    if(effects.confusion>0){effects.confusion--;const hurt=random()<1/3;if(effects.confusion===0)delete effects.confusion;if(hurt){const hp=side==='player'?'hp':'enemyHp',hit=Math.min(20,state[hp]);state[hp]-=hit;return{allowed:false,selfDamage:hit,message:name+'는 혼란으로 자신에게 '+hit+' 피해!'};}}
    return{allowed:true,message:notice};
  }
  function afterHit(state,side,element,damage){if(damage>0&&Types.resolve(element)==='fire'&&state[key(side)]==='freeze'){clear(state,side);return actor(side)+'의 얼음이 불꽃에 녹았다!';}return '';}
  function endTurn(state,side){
    const status=state[key(side)],hp=side==='player'?'hp':'enemyHp',amount=status==='poison'?8:status==='burn'?6:0;
    if(!amount||state[hp]<=0)return '';const hit=Math.min(amount,state[hp]);state[hp]-=hit;return actor(side)+'가 '+definitions[status].label+'으로 '+hit+' 피해!';
  }
  const api={definitions,clear,list,apply,beforeAction,afterHit,endTurn};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Craft.Conditions=api;
})(typeof window!=='undefined'?window:globalThis);
