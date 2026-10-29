(() => {
  const details=document.createElement('details');details.className='type-guide';
  const summary=document.createElement('summary');summary.textContent='타입 상성 보기';details.append(summary);
  const note=document.createElement('p');note.textContent='유리 ×1.5 · 불리 ×0.75 · 무효 ×0 · 나머지 ×1. 복합 타입의 유리·불리는 상쇄하며 무효가 우선합니다. ???·스텔라는 이 전투에서 중립입니다.';details.append(note);
  const grid=document.createElement('div');grid.className='type-chart';
  for(const [type,targets] of Object.entries(Craft.Types.strong)) {
    const row=document.createElement('p');row.innerHTML=Craft.Types.badge(type)+' → '+(targets.length?targets.map(Craft.Types.badge).join(' ')+'에 유리':'유리한 타입 없음')+(Craft.Types.weak[type].length?'<br>불리: '+Craft.Types.weak[type].map(Craft.Types.badge).join(' '):'')+(Craft.Types.immune[type]?.length?'<br>무효: '+Craft.Types.immune[type].map(Craft.Types.badge).join(' '):'');grid.append(row);
  }
  details.append(grid);const paletteLink=document.createElement('a');paletteLink.href='palette.html';paletteLink.textContent='앱 색표 보기';details.append(paletteLink);document.querySelector('main').append(details);
})();
