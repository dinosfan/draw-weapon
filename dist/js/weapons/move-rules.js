(function(root){
  const Conditions=typeof module!=='undefined'&&module.exports?require('./conditions.js'):root.Craft.Conditions;
  const labels={attack:'공격',protect:'방어',recover:'회복',attackUp:'공격 상승',defenseUp:'방어 상승',attackDown:'상대 공격 하락',defenseDown:'상대 방어 하락',...Object.fromEntries(Object.entries(Conditions.definitions).map(([key,value])=>[key,value.label])),drain:'흡수',charge:'축적',field:'설치',rewind:'복원',release:'해방'};
  const resourceKinds=['charge','field','rewind','release'];
  function normalize(data){
    if(!data||!Object.hasOwn(labels,data.kind))throw Error('기술 규칙 형식 오류');
    for(const key of ['accuracy','chance','amount'])if(!Number.isFinite(data[key]))throw Error('기술 규칙 수치 형식 오류');
    return{kind:data.kind,accuracy:Math.round(Math.max(50,Math.min(100,data.accuracy))),chance:data.kind==='recharge'?100:Math.round(Math.max(0,Math.min(100,data.chance))),amount:Math.round(Math.max(1,Math.min(2,data.amount)))};
  }
  const scale=stage=>stage>=0?(2+stage)/2:2/(2-stage);
  const stage=(value,delta)=>Math.max(-2,Math.min(2,(value||0)+delta));
  function setup(state){return{...state,playerStages:{attack:0,defense:0,...state.playerStages},enemyStages:{attack:0,defense:0,...state.enemyStages},playerStatus:state.playerStatus||null,enemyStatus:state.enemyStatus||null,playerVolatile:{...state.playerVolatile},enemyVolatile:{...state.enemyVolatile}};}
  function cast(state,move,affinity,random,defenderTypes=['normal']){
    const ultimate=typeof module!=='undefined'&&module.exports?require('./ultimate.js'):root.Craft.Ultimate;
    const factor=move.ultimate?ultimate.multiplier(affinity,state):affinity*(state.playerStatus==='burn'?.75:1)*scale(state.playerStages.attack)/scale(state.enemyStages.defense);
    const rule=move.rule;let damage=move.damage&&affinity>0?Math.max(1,Math.round(move.damage*factor)):0;
    let extra='',protect=false;
    if(move.damage&&affinity===0)return{damage:0,skip:false,extra:'상대에게 효과가 없다!',protect:false};
    if(rule.kind==='protect'){damage=0;protect=true;extra='이번 공격을 막을 준비를 했다!';}
    if(rule.kind==='recover'){damage=0;const n=Math.min(move.heal,100-state.hp);state.hp+=n;extra='체력 '+n+' 회복!';}
    if(rule.kind==='drain'){const n=Math.min(100-state.hp,Math.floor(Math.min(state.enemyHp,damage)/2));state.hp+=n;extra='체력 '+n+' 흡수!';}
    const stats={attackUp:['playerStages','attack',1],defenseUp:['playerStages','defense',1],attackDown:['enemyStages','attack',-1],defenseDown:['enemyStages','defense',-1]};
    const applies=rule.chance===100||(rule.chance>0&&random()*100<rule.chance);
    if(applies&&stats[rule.kind]){const [side,key,sign]=stats[rule.kind],before=state[side][key];state[side][key]=stage(before,sign*rule.amount);extra=before===state[side][key]?'능력이 더는 변하지 않는다.':labels[rule.kind]+' '+rule.amount+'단계!';}
    if(applies&&Object.hasOwn(Conditions.definitions,rule.kind))extra=Conditions.apply(state,rule.kind==='recharge'?'player':'enemy',rule.kind,defenderTypes,random,move.element);
    return{damage,skip:false,extra,protect};
  }
  function describe(move){if(!move.rule)return '';const r=move.rule;return '위력 '+(move.damage||'—')+' · 명중 '+r.accuracy+'% · '+labels[r.kind]+([...Object.keys(Conditions.definitions),'attackUp','defenseUp','attackDown','defenseDown'].includes(r.kind)?' '+r.chance+'%':'');}
  function explain(move){const r=move.rule,prefix=move.damage?move.damage+' 위력으로 공격한다. ':'';
    if(r.kind==='attack')return prefix.trim();
    if(r.kind==='protect')return '명중 판정에 성공하면 이번 적 공격을 막는다.';
    if(r.kind==='recover')return '내 체력을 '+move.heal+' 회복한다.';
    if(r.kind==='drain')return prefix+'상대가 실제로 잃은 체력의 절반을 회복한다.';
    if(r.kind==='recharge')return prefix+'사용 후 자신이 다음 행동을 한 번 쉰다.';
    if(['attackUp','defenseUp','attackDown','defenseDown'].includes(r.kind))return prefix+r.chance+'% 확률로 '+labels[r.kind]+' '+r.amount+'단계 (최대 ±2단계).';
    if(Object.hasOwn(Conditions.definitions,r.kind))return prefix+r.chance+'% 확률로 상대에게 '+labels[r.kind]+'. '+Conditions.definitions[r.kind].description+'.';
    return {charge:'공격 대신 고유 자원을 2칸 모은다.',field:'자원 2칸을 써서 적 공격 3회 피해를 절반으로 줄인다.',rewind:'자원 2칸을 써서 직전 적 공격에 받은 실제 피해를 복원한다.',release:'자원을 전부 써서 '+move.damage+' + 저장량×14 피해를 준다 (상성 전 최대110).'}[r.kind];
  }
  function condition(state){const stats=state.playerStages||{},enemy=state.enemyStages||{};return[...Conditions.list(state,'enemy').map(status=>'상대 '+labels[status]),...Conditions.list(state,'player').map(status=>'내 '+labels[status]),stats.attack?'내 공격 '+(stats.attack>0?'+':'')+stats.attack:'',stats.defense?'내 방어 '+(stats.defense>0?'+':'')+stats.defense:'',enemy.attack?'상대 공격 '+(enemy.attack>0?'+':'')+enemy.attack:'',enemy.defense?'상대 방어 '+(enemy.defense>0?'+':'')+enemy.defense:''].filter(Boolean).join(' · ');}
  const api={labels,resourceKinds,normalize,scale,setup,cast,describe,explain,condition,Conditions};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Craft.MoveRules=api;
})(typeof window!=='undefined'?window:globalThis);
