(function(root) {
  const Types=typeof module!=='undefined'&&module.exports?require('./types.js'):root.Craft.Types;
  const Effects=typeof module!=='undefined'&&module.exports?require('./effect-plan.js'):root.Craft.EffectPlan;
  const Tactics=typeof module!=='undefined'&&module.exports?require('./tactics.js'):root.Craft.Tactics;
  const Story=typeof module!=='undefined'&&module.exports?require('./story.js'):root.Craft.Story;
  const Rules=typeof module!=='undefined'&&module.exports?require('./move-rules.js'):root.Craft.MoveRules;
  const Feel=typeof module!=='undefined'&&module.exports?require('./hit-feel.js'):root.Craft.HitFeel;
  const Rig=typeof module!=='undefined'&&module.exports?require('./weapon-rig.js'):root.Craft.WeaponRig;
  const Motion=typeof module!=='undefined'&&module.exports?require('./motion-plan.js'):root.Craft.MotionPlan;
  const text=(value,max)=>typeof value==='string'?value.replace(/[\u0000-\u001f\u007f]/g,'').trim().slice(0,max):'';
  function normalize(moves) {
    if(!Array.isArray(moves)||moves.length!==4)throw Error('기술 4개 응답 형식 오류');
    const names=new Set();
    return moves.map(move=>{
      const name=text(move?.name,30),description=text(move?.description,140);
      if(!name||!description||names.has(name))throw Error('기술 이름·설명 형식 오류');names.add(name);
      const number=(key,min,max)=>{if(!Number.isFinite(move[key]))throw Error('기술 수치 형식 오류');return Math.round(Math.max(min,Math.min(max,move[key])));};
      if(typeof move.skipCounter!=='boolean')throw Error('기술 효과 형식 오류');
      if(move.element!==undefined&&!Types.valid(move.element))throw Error('기술 타입 형식 오류');
      const result={name,description,element:Types.resolve(move.element||'normal'),damage:number('damage',0,48),heal:number('heal',0,30),pp:number('pp',2,15),skipCounter:move.skipCounter};
      if(move.ultimate===true)result.ultimate=true;
      if(move.effectBrief!==undefined){const brief=text(move.effectBrief,300);if(!brief)throw Error('기술 이펙트 설명 형식 오류');result.effectBrief=brief;}
      // Optional artwork must never reject an otherwise playable weapon.
      if(typeof move.effectGlyph==='string'){const rows=move.effectGlyph.split('/');if(rows.length>=4&&rows.length<=24&&rows[0].length>=4&&rows[0].length<=24&&rows.every(row=>row.length===rows[0].length&&/^[.1234]+$/.test(row))&&(move.effectGlyph.match(/[1234]/g)||[]).length>=6)result.effectGlyph=move.effectGlyph;}
      if(move.rule){
        result.rule=Rules.normalize(move.rule);result.skipCounter=false;
        if(['protect','recover','attackUp','defenseUp','attackDown','defenseDown','charge','field','rewind'].includes(result.rule.kind))result.damage=0;
        if(result.rule.kind!=='recover')result.heal=0;
        if(result.rule.kind==='recover'&&!result.heal)throw Error('회복 기술 수치 형식 오류');
        if(result.rule.kind==='protect'){result.pp=Math.min(4,result.pp);result.rule.accuracy=Math.min(90,result.rule.accuracy);}
        if(result.damage>32&&result.pp>=10)result.damage=32;
        const kind=result.rule.kind;
        if(Rules.resourceKinds.includes(kind))result.mechanic=Tactics.mechanic({kind,cost:['field','rewind'].includes(kind)?2:0,gain:kind==='charge'?2:0,power:kind==='release'?14:0,turns:kind==='field'?3:0,recoil:0,fieldEffect:'guard'});
      }
      if(move.mechanic)result.mechanic=Tactics.mechanic(move.mechanic);
      if(move.story&&!move.motionPlan)result.story=Story.normalize(move.story);
      if(result.mechanic&&['charge','field','rewind'].includes(result.mechanic.kind)){result.damage=0;result.heal=0;result.skipCounter=false;}
      if(result.mechanic&&['release','drain'].includes(result.mechanic.kind)){result.heal=0;result.skipCounter=false;}
      if(result.skipCounter){result.damage=Math.min(28,result.damage);result.heal=0;}
      if(result.heal)result.damage=Math.min(26,result.damage);
      if(result.rule)result.description=Rules.explain(result);
      if(!result.damage&&!result.heal&&!result.skipCounter&&!result.mechanic&&!result.rule)throw Error('효과 없는 기술 형식 오류');
      result.vfx=Effects.normalize(move.vfx,result);
      result.feel=Feel.normalize(move.feel,result);
      if(move.delivery)result.delivery=Rig.delivery(move.delivery);
      if(move.motionPlan){result.motionPlan=Motion.normalize(move.motionPlan);if(['throw','swing','thrust','smash'].includes(result.delivery?.mode)&&result.motionPlan.layers.some(layer=>layer.source==='drawing'&&layer.crop.w>=.95&&layer.crop.h>=.95))result.motionPlan.carrier='hide';}
      return result;
    });
  }
  function baseMoves(weapon) {
    if(weapon.moves)return normalize(weapon.moves);
    // Old saved weapons and offline mock mode still receive a complete move set.
    const damage=weapon.skillDamage??(weapon.kind==='flower'?26:weapon.kind==='clock'?28:weapon.attack*2);
    return normalize([
      {name:weapon.name+' 휘두르기',description:'그림의 힘으로 상대를 직접 공격합니다.',damage:weapon.attack,heal:0,skipCounter:false,pp:15,feel:weapon.kind==='sword'?'slash':weapon.kind==='clock'?'temporal':'pulse'},
      {name:weapon.skill,description:weapon.effect,damage,heal:weapon.skillHeal??(weapon.kind==='flower'?14:0),skipCounter:weapon.skipCounter??(weapon.kind==='clock'),pp:5,feel:weapon.kind==='clock'?'temporal':weapon.kind==='sword'?'heavy':'pulse'},
      {name:'잉크 숨고르기',description:'흩어진 잉크를 모아 체력을 회복합니다.',damage:0,heal:25,skipCounter:false,pp:3,feel:'soft'},
      {name:'낙서 눈속임',description:'낙서 잔상으로 반격을 피하며 공격합니다.',damage:20,heal:0,skipCounter:true,pp:3,feel:'pierce'}
    ]);
  }
  function forWeapon(weapon){const base=baseMoves(weapon);const rarity=typeof module!=='undefined'&&module.exports?require('./rarity.js'):root.Craft.Rarity;const ascension=typeof module!=='undefined'&&module.exports?require('./scythe-ascension.js'):root.Craft.ScytheAscension;const boosted=rarity?rarity.moves(base,weapon.rarity):base;const ultimate=typeof module!=='undefined'&&module.exports?require('./ultimate.js'):root.Craft.Ultimate;const ranked=ultimate?ultimate.apply(boosted,weapon):boosted;return (ascension?ascension.moves(ranked,weapon):ranked).map((move,index)=>{if(weapon.effectAtlas)move.atlasRow=index;if(move.rule)move.description=Rules.explain(move);return move;});}
  function effect(move){return [move.damage?move.damage+' 피해':null,move.heal?'체력 '+move.heal+' 회복':null,move.skipCounter?'반격 취소':null].filter(Boolean).join(' · ');}
  const canDamage=move=>move.damage>0||move.mechanic?.kind==='release'||move.mechanic?.kind==='field'&&move.mechanic.fieldEffect==='burn';
  const api={normalize,forWeapon,effect,Rules,canDamage};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Craft.Moves=api;
})(typeof window!=='undefined'?window:globalThis);
