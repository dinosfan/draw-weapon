// Opt-in demonstration weapons use packaged artwork and the normal battle engine.
(function(root){
 const entries=root.GameDemoCatalog||[],packs=new Map();
 async function pack(id){const entry=entries.find(e=>e.id===id);if(!entry)throw Error('시연 무기를 찾지 못했어.');if(!packs.has(id))packs.set(id,fetch('assets/demo/'+id+'.json?v=20261030-cutout1').then(r=>{if(!r.ok)throw Error('시연 무기를 불러오지 못했어. 다시 선택해 줘.');return r.json();}).catch(e=>{packs.delete(id);throw e;}));return packs.get(id);}
 async function atlasSource(variant){const entry=entries.find(e=>e.variant===variant||e.atlasId&&'generated:'+e.atlasId===variant);return entry?(await pack(entry.id)).atlas:null;}
 async function launch(id,rarity,stage){
  if(!Craft.Rarity.valid(rarity)||!Number.isInteger(stage)||stage<0||stage>2)throw Error('시연 설정을 확인해 줘.');
  const data=await pack(id),weapon=structuredClone(data.weapon);weapon.rarity=rarity;
  if(data.atlasId)weapon.effectAtlas={id:data.atlasId,...(data.layout?{layout:data.layout}:{})};
  const url=Craft.weaponBattleUrl(weapon),params=new URLSearchParams(url.split('#')[1]);params.set('demo',id);params.set('stage',stage);location.assign('battle.html#'+params);
 }
 root.GameDemo={entries,pack,atlasSource,launch};
 function mount(){
  const params=new URLSearchParams(location.hash.slice(1));
  if(params.has('demo')){const badge=document.createElement('span');badge.className='demo-mode-label';badge.textContent='모의전투 · API 사용 없음';document.querySelector('.game-bottomline')?.prepend(badge);}
  const host=document.getElementById('craft-settings');if(!host)return;
  const open=document.createElement('button');open.type='button';open.id='demo-settings';open.textContent=document.getElementById('craft-settings')?'시연 무기로 모의전투':'모의전투 설정';host.prepend(open);
  const dialog=document.createElement('dialog');dialog.className='demo-settings pixel-panel';dialog.setAttribute('aria-labelledby','demo-title');
  const title=document.createElement('h2');title.id='demo-title';title.textContent='모의전투';const note=document.createElement('p');note.textContent='완성된 무기와 전용 연출로 바로 시작해. API를 사용하지 않아.';
  function choice(label,id){const wrapper=document.createElement('label'),select=document.createElement('select');select.id=id;wrapper.append(label,select);dialog.append(wrapper);return select;}
  dialog.append(title,note);const weapon=choice('무기','demo-weapon'),rarity=choice('등급','demo-rarity'),stage=choice('시작 단계','demo-stage');
  for(const e of entries){const o=new Option(e.name+' · '+Craft.Types.summary(e.types),e.id);weapon.add(o);}weapon.value=params.get('demo')||'dragon-fang';
  for(const[id,tier]of Object.entries(Craft.Rarity.tiers))rarity.add(new Option(tier.label,id));rarity.value=Craft.Rarity.valid(params.get('rarity'))?params.get('rarity'):'mythic';for(let i=0;i<3;i++)stage.add(new Option((i+1)+'단계'+(i===2?' · 보스 2페이즈':''),String(i)));stage.value='0';
  const description=document.createElement('p');description.className='demo-note';description.textContent='선택한 무기로 새 전투를 시작해. 단계 진행·상성·상태이상·등급별 연출은 실제 전투와 같아.';const error=document.createElement('p');error.setAttribute('role','status');
  const actions=document.createElement('div'),start=document.createElement('button'),close=document.createElement('button');actions.className='demo-actions';start.type=close.type='button';start.textContent='이 무기로 시작';close.textContent='닫기';actions.append(start,close);dialog.append(description,error,actions);document.body.append(dialog);
  open.addEventListener('click',()=>dialog.showModal());close.addEventListener('click',()=>dialog.close());start.addEventListener('click',async()=>{start.disabled=true;error.textContent='무기와 도트를 꺼내고 있어…';try{await launch(weapon.value,rarity.value,Number(stage.value));}catch(e){error.textContent=e.message;start.disabled=false;}});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})(window);

