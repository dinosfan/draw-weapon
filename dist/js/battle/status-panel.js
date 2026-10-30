BattlePreview.renderStatus = (target, character, hp, note, showValue = true, condition = null) => {
  const oldTrack=target.querySelector?.('.hp-track'),oldHp=Number(oldTrack?.getAttribute('aria-valuenow')),same=oldTrack?.getAttribute('aria-label')===character.name+' 체력';
  const level=Number.isFinite(character.level)?`<span class="level">Lv.${character.level}</span>`:'';
  target.innerHTML = `<div class="status-panel"><div class="status-heading"><span class="status-identity"><span class="character-name" title="${Craft.escapeHTML(character.name)}">${Craft.escapeHTML(character.name)}</span>${BattleStatusBadge.markup(condition)}</span>${level}</div><div class="type-line">${Craft.Types.badges(character.types)}</div><div class="hp-row"><span class="hp-label">HP</span><div class="hp-track" role="progressbar" aria-label="${Craft.escapeHTML(character.name)} 체력" aria-valuemin="0" aria-valuemax="${character.maxHp}" aria-valuenow="${hp}"><div class="hp-fill ${hp < character.maxHp * .3 ? 'low' : ''}" style="width:${hp / character.maxHp * 100}%"></div></div></div>${showValue ? `<div class="hp-value">${hp} / ${character.maxHp}</div>` : ''}<div class="status-note">${Craft.escapeHTML(note || character.note)}</div></div>`;
  if(typeof BattleHP!=='undefined')return BattleHP.transition(target,character,same&&Number.isFinite(oldHp)?oldHp:hp,hp,showValue);
  return Promise.resolve(true);
};


