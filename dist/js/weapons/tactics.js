(function(root){
  const kinds=['strike','charge','field','rewind','release','drain'];
  const roles={strike:'타격',charge:'축적',field:'설치',rewind:'복원',release:'해방',drain:'흡수'};
  const clean=(value,max)=>typeof value==='string'?value.replace(/[\u0000-\u001f\u007f]/g,'').trim().slice(0,max):'';
  function engine(data){
    if(!data||typeof data!=='object')throw Error('무기 운용법 형식 오류');
    const name=clean(data.name,16),rule=clean(data.rule,180);
    if(!name||!rule)throw Error('고유 자원 설명 형식 오류');
    return{name,rule,max:6,initial:2};
  }
  function mechanic(data){
    if(!data||!kinds.includes(data.kind))throw Error('기술 운용 형식 오류');
    const num=(key,min,max)=>{if(!Number.isFinite(data[key]))throw Error('기술 운용 수치 형식 오류');return Math.round(Math.max(min,Math.min(max,data[key])));};
    const result={kind:data.kind,cost:num('cost',0,3),gain:num('gain',0,3),power:num('power',0,16),turns:num('turns',0,3),recoil:num('recoil',0,12),fieldEffect:['guard','regen','burn'].includes(data.fieldEffect)?data.fieldEffect:'guard'};
    if(result.kind==='charge'){result.cost=0;result.gain=Math.max(1,result.gain);}
    if(['field','rewind','drain'].includes(result.kind)){result.cost=Math.max(1,result.cost);result.gain=0;}
    if(result.kind==='field'){result.turns=Math.max(2,result.turns);result.power=Math.max(6,Math.min(12,result.power));}
    if(result.kind==='release'){result.cost=0;result.gain=0;result.power=Math.max(8,result.power);}
    if(result.kind==='drain')result.power=0;
    return result;
  }
  function reason(state,move,weapon){
    if(!weapon.engine||!move.mechanic)return '';
    const m=move.mechanic,n=weapon.engine.name;
    if(state.hp<=m.recoil)return '체력이 부족합니다';
    if(m.kind==='release'&&state.resource<1)return n+' 필요';
    if(state.resource<m.cost)return n+' '+m.cost+'칸 필요';
    if(m.kind==='charge'&&state.resource>=6)return n+' 가득 참';
    if(m.kind==='field'&&state.field)return '기존 설치 효과가 남아 있습니다';
    if(m.kind==='rewind'&&(!state.lastDamage||state.hp>=100))return '되돌릴 피해 없음';
    return '';
  }
  function describe(move,weapon){
    const m=move.mechanic;if(!m||!weapon.engine)return '';
    const name=weapon.engine.name;
    const base=m.kind==='charge'?name+' +'+m.gain:m.kind==='release'?name+' 전부 · 피해 '+move.damage+' + 저장량×'+m.power:[m.cost?name+' −'+m.cost:'소모 없음',m.gain?name+' +'+m.gain:''].filter(Boolean).join(' · ');
    const field=m.kind==='field'?' · '+m.turns+'회 '+({guard:'받는 피해 절반',regen:'체력 '+m.power+'씩 회복',burn:m.power+'씩 추가 피해'}[m.fieldEffect]):m.kind==='rewind'?' · 직전 실제 피해 복원':m.kind==='drain'?' · 실제 타격 피해의 절반 회복':'';
    return roles[m.kind]+' · '+base+field+(m.recoil?' · 체력 −'+m.recoil:'');
  }
  function cast(state,move,affinity){
    const m=move.mechanic,saved=state.resource;state.resource-=m.cost;
    let base=move.damage,heal=move.heal,extra='';
    if(m.kind==='charge'){base=0;heal=0;}
    if(m.kind==='field'){base=0;heal=0;state.field={name:move.name,effect:m.fieldEffect,power:m.power,remaining:m.turns,element:move.element};extra=move.name+' 설치!';}
    if(m.kind==='rewind'){base=0;heal=state.lastDamage;extra='직전 실제 피해 '+state.lastDamage+' 복원!';}
    if(m.kind==='release'){base=Math.min(move.ultimate?300:110,base+saved*m.power);state.resource=0;extra=saved+'칸을 전부 해방!';}
    state.resource=Math.min(6,state.resource+m.gain);
    if(m.gain)extra+=(extra?'\n':'')+'고유 자원 '+m.gain+'칸 축적!';
    const ultimate=typeof module!=='undefined'&&module.exports?require('./ultimate.js'):root.Craft.Ultimate;
    const damage=base&&affinity>0?Math.max(1,Math.round(base*(move.ultimate?ultimate.multiplier(affinity,state):affinity))):0;
    if(m.kind==='drain')heal=Math.min(25,Math.floor(Math.min(state.enemyHp,damage)/2));
    const restored=Math.min(100-state.hp,heal);state.hp+=restored;state.hp-=m.recoil;
    if(restored)extra+=(extra?'\n':'')+'체력 '+restored+' 회복!';
    if(m.recoil)extra+=(extra?'\n':'')+'대가로 체력 '+m.recoil+' 소모.';
    return{damage,skip:move.skipCounter,extra};
  }
  const api={kinds,roles,engine,mechanic,reason,describe,cast};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Craft.Tactics=api;
})(typeof window!=='undefined'?window:globalThis);
