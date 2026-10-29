(()=>{
  const types=Craft.Types.labels;
  document.getElementById('palette-count').textContent=new Set(Object.values(GamePalette.tokens)).size;
  const base={ink:'글자 · 기본 테두리',paper:'화면 바탕',surface:'카드 · 입력면',muted:'보조 글자',subtle:'비활성 면',danger:'위험 · 피해'};
  function render(target,entries,isType){for(const [key,label]of Object.entries(entries)){
    const token=isType?Craft.Types.colorTokens[key]:key;
    const card=document.createElement('article');card.className='swatch';card.style.setProperty('--swatch',GamePalette.tokens[token]);
    const color=document.createElement('div');color.className='swatch-color';
    const title=document.createElement('strong');title.textContent=label;
    const source=document.createElement('p');source.textContent=GamePalette.sources[token];
    const hex=document.createElement('code');hex.textContent=GamePalette.tokens[token].toUpperCase();card.append(color,title,source,hex);
    if(isType){const button=document.createElement('button');button.className='move-button';button.style.setProperty('--type-color',GamePalette.tokens[token]);button.textContent=label+' 기술';card.append(button);}
    target.append(card);
  }}
  render(document.getElementById('type-swatches'),types,true);render(document.getElementById('base-swatches'),base,false);
  for(const [key,state]of Object.entries(Craft.Conditions.definitions)){const card=document.createElement('article');card.className='swatch';const title=document.createElement('strong');title.innerHTML=BattleStatusBadge.markup(key);const description=document.createElement('p');description.textContent=state.description;card.append(title,description);document.getElementById('condition-swatches').append(card);}
})();
