Craft.renderWeapon = (preview, result, weapon) => {
  const oldArt = preview.querySelector('.weapon-art');
  const art = document.createElement(Craft.validArtwork(weapon.artwork) ? 'img' : 'span');
  art.className = 'weapon-art';
  if (art.tagName === 'IMG') { art.src = weapon.artwork; art.alt = '직접 그린 ' + weapon.name; }
  else { art.classList.add('fluent-emoji'); art.textContent = weapon.icon; }
  oldArt.replaceWith(art);
  preview.querySelector('.preview-caption').textContent = '당신의 낙서에서 태어난 무기';
  const safe = Object.fromEntries(Object.entries(weapon).map(([key,value]) => [key,Craft.escapeHTML(value)]));
  const rarity=weapon.rarity&&Craft.Rarity?Craft.Rarity.get(weapon.rarity):null;
  const badge=rarity?'<span class="rarity-tag" style="--rarity-color:var(--color-'+rarity.color+');--rarity-ink:var(--color-'+(rarity.rank===2?'surface':'ink')+')">'+rarity.label+'</span> ':'';
  result.innerHTML = `${badge}<span class="weapon-type">${safe.type} 무기</span><span class="weapon-element">${Craft.Types.badges(weapon.types)}</span><h3>${safe.name}</h3><p>${safe.reason}</p><p class="type-reason">${Craft.escapeHTML(weapon.typeReason||'모의 제작 · 타입 판정 전')}</p>${weapon.engine?'<div class="engine-rule"><strong>'+Craft.escapeHTML(weapon.engine.name)+' · 고유 자원</strong><p>'+Craft.escapeHTML(weapon.engine.rule)+'</p></div>':''}<dl class="weapon-stats"><div><dt>공격력</dt><dd>${Craft.Rarity?Craft.Rarity.attack(weapon):safe.attack}</dd></div><div><dt>특성</dt><dd class="stat-text">${safe.trait}</dd></div></dl>${rarity?'<p class="rarity-bonus">'+Craft.Rarity.summary(weapon.rarity)+'</p>':''}<div class="skill-card"><span class="section-label">기술 4개</span>${Craft.Moves.forWeapon(weapon).map(move=>'<div class="crafted-move"><strong>'+(move.ultimate?'궁극기 · ':'')+Craft.escapeHTML(move.name)+'</strong><span>PP '+move.pp+'</span><p>'+Craft.escapeHTML(move.description)+'</p><small>'+Craft.Types.badge(move.element)+' · '+Craft.escapeHTML(move.rule?Craft.Moves.Rules.describe(move):move.mechanic?Craft.Tactics.describe(move,weapon):Craft.Moves.effect(move))+'</small></div>').join('')}
</div>`;
};


