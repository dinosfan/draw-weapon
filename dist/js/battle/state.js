// Pure state transitions; no DOM or network dependencies.
BattlePreview.createState = (stage = 0) => {
  const encounter = BattlePreview.getEncounter ? BattlePreview.getEncounter(stage) : BattlePreview.data.enemy;
  return { resource:BattlePreview.weapon.engine?.initial??2,lastDamage:0,field:null,stage, hp:100, enemyHp:encounter.maxHp, turn:0, skills:2, pp:Craft.Moves.forWeapon(BattlePreview.weapon).map(move=>move.pp), potions:1, ended:false, message:encounter.name + ' 등장!\n' + BattlePreview.weapon.name + '로 무엇을 할까?' };
};
BattlePreview.reduce = (state, action, random = Math.random) => {
  const moveIndex = typeof action === 'string' && /^move:[0-3]$/.test(action) ? Number(action.slice(5)) : -1;
  if (state.ended || (moveIndex < 0 && !['attack','skill','guard','bag'].includes(action))) return state;
  const weapon = BattlePreview.weapon;
  const rules=Craft.Moves.Rules;
  const next = rules?rules.setup({ ...state, field:state.field?{...state.field}:null, pp:[...state.pp] }):{ ...state, field:state.field?{...state.field}:null, pp:[...state.pp] };
  const chosen = moveIndex >= 0 ? Craft.Moves.forWeapon(weapon)[moveIndex] : null;
  if(chosen&&weapon.engine&&chosen.mechanic){const blocked=Craft.Tactics.reason(state,chosen,weapon);if(blocked)return {...state,message:blocked};}
  if (chosen && !next.pp[moveIndex]) return {...state,message:chosen.name+'의 PP가 부족하다. 다른 기술을 골라보자!'};
  if (action === 'skill' && !next.skills) return { ...state, message: weapon.skill + ' 기술을 모두 사용했다.\n다른 명령을 선택하자!' };
  if (action === 'bag' && !next.potions) return { ...state, message: '가방이 비어 있다.\n다른 명령을 선택하자!' };
  const encounter=BattlePreview.getEncounter?BattlePreview.getEncounter(state.stage,state):BattlePreview.data.enemy;
  const playerTypes=weapon.types||['normal'];
  const conditions=rules.Conditions;
  const gate=action==='bag'?{allowed:true,message:''}:conditions.beforeAction(next,'player',random,chosen?.element||'normal');
  let damage = 0, skip = false, protect=false,missed=false;
  if (chosen&&gate.allowed) {
    next.pp[moveIndex]--;
    const affinity=Craft.Types.multiplier(chosen.element,encounter.types||['normal']);
    let extra='';
    const hit=!chosen.rule||chosen.rule.accuracy===100||random()*100<chosen.rule.accuracy;
    if(!hit){missed=true;extra='공격이 빗나갔다!';}
    else if(weapon.engine&&chosen.mechanic){const result=Craft.Tactics.cast(next,chosen,affinity);damage=result.damage;skip=result.skip;extra=result.extra;}
    else if(chosen.rule){const result=rules.cast(next,chosen,affinity,random,encounter.types||['normal']);damage=result.damage;skip=result.skip;extra=result.extra;protect=result.protect;}
    else{
      damage=chosen.damage&&affinity>0?Math.max(1,Math.round(chosen.damage*(chosen.ultimate?Craft.Ultimate.multiplier(affinity,next):affinity))):0;skip=chosen.skipCounter;
      if(chosen.heal){const healed=Math.min(chosen.heal,100-next.hp);next.hp+=healed;extra='체력을 '+healed+' 회복했다.';}
    }
    next.message=weapon.name+'의 '+chosen.name+'!';
    if(chosen.damage&&affinity===0)next.message+='\n상대에게 효과가 없다!';
    if(damage){next.message+='\n'+damage+' 피해!';if(affinity!==1)next.message+=' '+(affinity>1?'효과가 굉장하다!':'효과가 약하다…')+' (×'+affinity+')';}
    if(extra)next.message+='\n'+extra;
    if(skip)next.message+='\n상대의 반격을 멈췄다!';
  }
  if (action === 'attack'&&gate.allowed) { if(weapon.engine)next.resource=Math.min(6,next.resource+1);damage = Craft.Rarity?Craft.Rarity.attack(weapon):weapon.attack; next.message = weapon.name + '의 공격!\n수호자에게 ' + damage + ' 피해를 입혔다.'; }
  if (action === 'skill'&&gate.allowed) {
    next.skills--;
    damage = weapon.kind === 'custom' ? weapon.skillDamage : weapon.kind === 'flower' ? 26 : weapon.kind === 'clock' ? 28 : weapon.attack * 2;
    skip = weapon.kind === 'clock' || weapon.skipCounter === true;
    next.message = weapon.name + '의 ' + weapon.skill + '!\n' + damage + ' 피해!';
    if (weapon.kind === 'flower' || weapon.skillHeal > 0) {
      const healed = Math.min(weapon.kind === 'flower' ? 14 : weapon.skillHeal, 100 - next.hp); next.hp += healed;
      next.message += ' 체력을 ' + healed + ' 회복했다.';
    }
    if (skip) next.message += ' 상대의 반격을 멈췄다!';
  }
  if (action === 'guard'&&gate.allowed) next.message = weapon.name + '로 방어했다!';
  if (action === 'bag') {
    next.potions--; const healed = Math.min(30, 100 - next.hp); next.hp += healed;
    next.message = '잉크 물약을 사용했다!\n체력을 ' + healed + ' 회복했다.';
  }
  const actionMessage=gate.allowed?next.message.split('\n')[0]:null;
  if(!gate.allowed)next.message=gate.message;else if(gate.message)next.message=gate.message+'\n'+next.message;
  const thawEnemy=conditions.afterHit(next,'enemy',chosen?.element||'normal',damage);if(thawEnemy)next.message+='\n'+thawEnemy;
  next.feedback={hit:Math.min(next.enemyHp,damage),heal:Math.max(0,next.hp-state.hp),playerAfter:next.hp,miss:missed,counter:0,blocked:false,prevented:!gate.allowed,preventionMessage:gate.message,selfDamage:gate.selfDamage||0,playerStatusAfter:conditions.list(next,'player'),enemyStatusAfter:conditions.list(next,'enemy')};
  next.enemyHp = Math.max(0, next.enemyHp - damage);
  if(next.field&&next.enemyHp>0){
    const field=next.field;
    if(field.effect==='regen'){const healed=Math.min(field.power,100-next.hp);next.hp+=healed;next.message+='\n'+field.name+': 체력 '+healed+' 회복.';}
    if(field.effect==='burn'){const affinity=Craft.Types.multiplier(field.element,encounter.types||['normal']),hit=affinity>0?Math.max(1,Math.round(field.power*affinity)):0;next.enemyHp=Math.max(0,next.enemyHp-hit);next.message+='\n'+field.name+': 추가 '+hit+' 피해.';}
  }
  next.feedback.playerMessages=next.message.split('\n').filter(Boolean);
  next.feedback.actionMessage=actionMessage;
  next.feedback.playerAfter=next.hp;next.feedback.enemyAfterAction=next.enemyHp;
  next.feedback.enemyMessages=[];
  const moves = BattlePreview.getEncounter ? BattlePreview.getEncounter(state.stage,state).moves : BattlePreview.data.enemyMoves;
  const move = BattlePreview.enemyIntent?BattlePreview.enemyIntent(state):moves[next.turn % moves.length];
  const enemyAffinity=Craft.Types.multiplier(move.element||'normal',playerTypes);
  const stages=chosen?.rule||weapon.moves?.some(m=>m.rule);
  const enemyPower=stages?rules.scale(next.enemyStages.attack)/rules.scale(next.playerStages.defense)*(next.enemyStatus==='burn'?.75:1):1;
  const typedIncoming=move.damage&&enemyAffinity>0?Math.max(1,Math.round(move.damage*enemyAffinity*enemyPower)):0;
  const fieldIncoming=next.field?.effect==='guard'?Math.ceil(typedIncoming/2):typedIncoming;
  const preview=typeof BattleCombatMath!=='undefined'?BattleCombatMath.incoming(next,weapon,move):{hit:fieldIncoming,guard:Math.ceil(fieldIncoming/4)};
  const incoming = protect?0:action === 'guard'&&gate.allowed ? preview.guard : preview.hit;
  if(next.enemyHp>0&&next.hp>0&&!skip){const enemyGate=conditions.beforeAction(next,'enemy',random,move.element||'normal');if(enemyGate.message)next.message+='\n'+enemyGate.message;if(enemyGate.selfDamage)next.feedback.enemySelfDamage=enemyGate.selfDamage;if(!enemyGate.allowed){skip=true;next.feedback.enemyPrevented=true;next.feedback.enemyPreventionMessage=enemyGate.message;}}
  if(skip&&next.enemyHp>0&&next.hp>0&&!next.feedback.enemyPrevented){next.feedback.enemyPrevented=true;next.feedback.enemyPreventionMessage='상대의 행동을 막았다!';}
  next.lastDamage=0;
  if (next.enemyHp > 0 && next.hp>0 && !skip) {
    next.lastDamage=Math.min(next.hp,incoming);
    next.feedback.counter=next.lastDamage;next.feedback.blocked=protect&&move.damage>0;
    next.hp = Math.max(0, next.hp - incoming);
    next.feedback.enemyActed=true;next.feedback.enemyMoveName=move.name;next.feedback.playerAfterCounter=next.hp;
    if(incoming>0&&move.status&&random()*100<(move.chance||0)){const notice=conditions.apply(next,'player',move.status,playerTypes,random,move.element);if(notice){next.message+='\n'+notice;next.feedback.enemyMessages.push(notice);}}
    const thawPlayer=conditions.afterHit(next,'player',move.element||'normal',incoming);if(thawPlayer){next.message+='\n'+thawPlayer;next.feedback.enemyMessages.push(thawPlayer);}
    next.message += move.damage ? '\n수호자의 ' + move.name + '! ' + incoming + ' 피해!'+(enemyAffinity!==1?' (상성 ×'+enemyAffinity+')':'') : '\n수호자는 잠시 숨을 고르고 있다.';
  }
  if(next.field&&next.enemyHp>0){next.field.remaining--;if(next.field.remaining<=0){next.message+='\n'+next.field.name+' 효과가 끝났다.';next.field=null;}}
  next.feedback.playerStatusAfterCounter=conditions.list(next,'player');next.feedback.enemyStatusAfterCounter=conditions.list(next,'enemy');next.feedback.enemyAfterCounter=next.enemyHp;
  next.feedback.endTurn=[];
  if(next.hp>0&&next.enemyHp>0){for(const side of ['enemy','player']){const field=side==='enemy'?'enemyHp':'hp',before=next[field],status=next[side+'Status'],message=conditions.endTurn(next,side);if(message){next.message+='\n'+message;next.feedback.endTurn.push({side,status,damage:before-next[field],hp:next[field],message});}}}
  next.turn++;if(next.bossPhase===1)next.phaseTurn=(next.phaseTurn||0)+1;if(typeof BattleBosses!=='undefined')BattleBosses.advance(next,encounter);
  next.ended = next.hp === 0 || next.enemyHp === 0;
  if (next.ended) next.message = next.feedback.endTurn.map(e=>e.message+'\n').join('')+(next.enemyHp === 0 ? '수호자에게 승리했다!\n당신의 낙서가 멋진 무기가 되었다.' : weapon.name + '의 힘이 다했다…\n다시 시작해서 도전해 보자!');
  return next;
};
