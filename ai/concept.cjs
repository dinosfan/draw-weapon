const {randomBytes}=require('node:crypto');
function brief(input){return JSON.stringify({description:input.description,hasImage:!!input.image,...(input.rarity?{rarity:input.rarity}:{}),designNonce:randomBytes(6).toString('hex')});}
function validate(concept,moves){
  if(!concept||typeof concept!=='object')throw Error('그림 컨셉 근거 형식 오류');
  const result={};for(const key of ['defense','healing']){if(typeof concept[key]!=='string'||concept[key].length>180)throw Error('그림 컨셉 근거 형식 오류');result[key]=concept[key].trim();}
  const heals=moves.some(move=>move.heal>0||['recover','drain','rewind'].includes(move.rule?.kind)||['drain','rewind'].includes(move.mechanic?.kind));
  const defends=moves.some(move=>['protect','defenseUp','field'].includes(move.rule?.kind)||move.mechanic?.kind==='field');
  const missing=[...(heals&&!result.healing?['healing']:[]),...(defends&&!result.defense?['defense']:[])];
  if(missing.length){const error=Error('그림에 '+missing.map(key=>key==='healing'?'회복':'방어').join('·')+' 기술 근거가 없습니다. 컨셉 형식 오류');error.code='CONCEPT_MOVE_CONFLICT';error.missing=missing;throw error;}
  return result;
}
module.exports={brief,validate};
