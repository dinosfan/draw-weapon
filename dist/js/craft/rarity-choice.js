(function(root){
 const R=typeof module!=='undefined'&&module.exports?require('../weapons/rarity.js'):root.Craft.Rarity;
 function resolve(value,roll=R.roll){return R.valid(value)?value:roll();}
 function mount(select,hint){
  for(const[id,tier]of Object.entries(R.tiers)){const option=document.createElement('option');option.value=id;option.textContent=tier.label;select.append(option);}
  function update(){hint.textContent=R.valid(select.value)?'테스트 지정 · '+R.get(select.value).label+' 등급으로 제작해. 성능과 도트 연출도 이 등급을 따라가.':'기존 확률로 등급을 추첨해.';}
  select.addEventListener('change',update);update();return{choose:()=>resolve(select.value)};
 }
 const api={resolve,mount};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Craft.RarityChoice=api;
})(typeof window!=='undefined'?window:globalThis);
