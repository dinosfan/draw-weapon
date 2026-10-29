const Tactics=require('../dist/js/weapons/tactics.js');
const Types = require('../dist/js/weapons/types.js');
const Moves = require('../dist/js/weapons/moves.js');
const prompt = require('./prompt.cjs');

function validateCreative(data) {
  if (!data || typeof data !== 'object') throw Error('응답 형식 오류');
  Types.normalize(data.types);
  if(typeof data.typeReason!=='string'||!data.typeReason.trim()||data.typeReason.length>180)throw Error('타입 판단 근거 형식 오류');
  if(!Array.isArray(data.moves)||data.moves.some(move=>!Types.valid(move.element)))throw Error('기술 타입 형식 오류');
  const result = { kind:'custom',icon:'✨',types:Types.normalize(data.types),typeReason:data.typeReason.trim() };
  for (const [key, limit] of Object.entries({ name:40, type:16, trait:20, reason:600 })) {
    if (typeof data[key] !== 'string' || !data[key].trim() || data[key].length > limit) throw Error('응답 형식 오류');
    result[key] = data[key].trim();
  }
  if (!Number.isFinite(data.attack)) throw Error('응답 형식 오류');
  result.attack = Math.round(Math.max(18,Math.min(28,data.attack)));
  if(!data.engine&&data.moves.some(move=>!move.vfx&&!move.rule))throw Error('기술 이펙트 형식 오류');
  result.moves = Moves.normalize(data.moves);
  if(data.rig)result.rig=require('../dist/js/weapons/weapon-rig.js').normalize(data.rig,result);
  if(['firearm','bow'].includes(result.rig?.family)&&result.moves.some(move=>['shot','spray','beam'].includes(move.delivery?.mode)&&move.motionPlan?.layers.some(layer=>layer.source==='drawing'&&layer.crop.w>.8&&layer.crop.h>.8)))throw Error('연출 본체·발사체 구분 오류: 손에 남는 발사기 본체는 날리지 말고 별도 발사체를 source=effect와 glyph로 설계해야 합니다');
  const standard=result.moves.some(move=>move.rule);
  if(data.concept)result.concept=require('./concept.cjs').validate(data.concept,result.moves);
  const usesResource=result.moves.some(move=>Moves.Rules.resourceKinds.includes(move.rule?.kind)||move.mechanic);
  if(data.engine&&data.engine.mode!=='none'&&usesResource){try{result.engine=Tactics.engine(data.engine);}catch(error){error.code='WEAPON_ENGINE_CONFLICT';throw error;}}
  if(standard){
    if(result.moves.some(move=>!move.rule||(!move.story&&!move.motionPlan)))throw Error('기술 규칙·연출 형식 오류');
    if(!result.engine&&result.moves.some(move=>Moves.Rules.resourceKinds.includes(move.rule.kind))){const error=Error('기술의 자원 규칙과 무기 운용법이 일치하지 않습니다');error.code='WEAPON_ENGINE_CONFLICT';throw error;}
    if(result.engine){
      if(!result.moves.some(move=>['field','rewind','release'].includes(move.rule.kind))){const error=Error('자원을 사용하는 기술 없이 축적 규칙만 생성되었습니다');error.code='WEAPON_ENGINE_CONFLICT';throw error;}
    }
  }else if(result.engine){
    if(result.moves.some(move=>!move.mechanic||!move.story))throw Error('운용 기술·연출 형식 오류');
    if(!result.moves.some(move=>move.mechanic.cost>0||move.mechanic.kind==='release')){const error=Error('자원을 사용하는 기술 없이 축적 규칙만 생성되었습니다');error.code='WEAPON_ENGINE_CONFLICT';throw error;}
  }else if (!result.moves.some(move=>move.damage>=18&&move.pp>=10)) throw Error('주력 공격 기술 형식 오류');
  const first=result.moves[0];
  result.skill=first.name;result.skillDamage=first.damage;result.skillHeal=first.heal;result.skipCounter=first.skipCounter;
  return result;
}
module.exports = { prompt, validateCreative };


