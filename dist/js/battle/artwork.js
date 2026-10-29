BattlePreview.renderArtwork = async () => {
  const weapon=BattlePreview.weapon;
  const held=document.getElementById('held-battle-weapon');
  held.hidden=false;
  held.setAttribute('aria-label','트레이너가 손에 든 '+weapon.name);
  const ctx=held.getContext('2d');
  try {
    if(await Craft.drawHeldArtwork(held,weapon.artwork)){Craft.attachToHand(held,Craft.WeaponRig.normalize(weapon.rig,weapon));return;}
  } catch {}
  // Offline presets have no original drawing; display their Tossface weapon icon.
  ctx.clearRect(0,0,held.width,held.height);
  try { await document.fonts.load('76px Tossface'); } catch {}
  ctx.font='76px Tossface';ctx.textAlign='center';ctx.textBaseline='bottom';ctx.fillText(weapon.icon,48,96);
  Craft.attachToHand(held,Craft.WeaponRig.normalize(weapon.rig,weapon));
};
