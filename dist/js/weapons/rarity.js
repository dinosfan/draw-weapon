(function(root){
 const tiers=Object.freeze({
  common:{label:'일반',chance:50,color:'normal',power:0,accuracy:0,pp:0,rank:0},
  rare:{label:'희귀',chance:30,color:'water',power:2,accuracy:2,pp:1,rank:1},
  epic:{label:'영웅',chance:15,color:'ghost',power:5,accuracy:3,pp:2,rank:2},
  legendary:{label:'전설',chance:4.5,color:'electric',power:9,accuracy:5,pp:3,rank:3},
  mythic:{label:'신화',chance:.5,color:'illusion',power:14,accuracy:7,pp:4,rank:4}
 });
 const valid=id=>Object.hasOwn(tiers,id);
 const get=id=>tiers[valid(id)?id:'common'];
 function roll(random=()=>{const a=new Uint32Array(1);root.crypto.getRandomValues(a);return a[0]/4294967296;}){
  const n=random();if(!Number.isFinite(n)||n<0||n>=1)throw Error('등급 추첨 값 오류');
  let sum=0;for(const[id,tier]of Object.entries(tiers)){sum+=tier.chance;if(n*100<sum)return id;}return'mythic';
 }
 const attack=weapon=>weapon.attack+get(weapon.rarity).power;
 function moves(moves,id){const tier=get(id);return moves.map(move=>{
  const result={...move,rule:move.rule?{...move.rule}:undefined};
  if(!tier.rank)return result;
  if(result.damage>0)result.damage+=tier.power;
  if(result.heal>0)result.heal+=Math.ceil(tier.power/2);
  result.pp+=tier.pp;
  if(result.rule){result.rule.accuracy=Math.min(100,result.rule.accuracy+tier.accuracy);}
  return result;
 });}
 function summary(id){const tier=get(id);return tier.rank?'공격 위력 +'+tier.power+' · 명중 +'+tier.accuracy+'%p'+(tier.pp?' · PP +'+tier.pp:''):'기본 성능 · 당신의 첫 번째 가능성';}
 const api={tiers,valid,get,roll,attack,moves,summary};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Craft.Rarity=api;
})(typeof window!=='undefined'?window:globalThis);
