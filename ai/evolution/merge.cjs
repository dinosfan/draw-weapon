const {validateCreative}=require('../weapon.cjs');
function merge(base,option,generated){
 const data=structuredClone(generated),indices=new Set(option.changes.map(c=>c.index));
 data.name=option.name;data.types=option.types;data.typeReason=option.typeReason;data.trait=option.trait;if(base.engine)data.engine=structuredClone(base.engine);else delete data.engine;data.attack=Math.max(base.attack,data.attack);
 data.moves=base.moves.map((old,index)=>{if(!indices.has(index))return structuredClone(old);const brief=option.changes.find(c=>c.index===index),move={...data.moves[index],name:brief.name,element:brief.element,damage:brief.damage,heal:brief.heal,pp:brief.pp,rule:brief.rule,effectBrief:brief.effectBrief,delivery:brief.delivery,skipCounter:false};delete move.mechanic;return move;});
 const result=validateCreative(data);if(result.moves.some(move=>!move.motionPlan||move.motionPlan.layers.some(l=>l.source==='effect'&&!l.glyph)))throw Error('연출 진화 기술 설계도 누락');
 result.rarity=base.rarity;result.evolution={stage:(base.evolution?.stage||0)+1,rootName:base.evolution?.rootName||base.name,previousName:base.name};
 return result;
}
module.exports={merge};
