BattlePreview.renderArtwork = async () => {
  const weapon=BattlePreview.weapon;
  const held=document.getElementById('held-battle-weapon');
  held.hidden=false;
  held.setAttribute('aria-label','트레이너가 손에 든 '+weapon.name);
  const ctx=held.getContext('2d');
  try {
    if(await Craft.drawHeldArtwork(held,weapon.artwork)){Craft.attachToHand(held,Craft.WeaponRig.normalize(weapon.rig,weapon));return;}
  } catch {}
  // Offline presets without original art use the same self-hosted Fluent SVG as UI.
  ctx.clearRect(0,0,held.width,held.height);
  await FluentEmoji.draw(ctx,weapon.icon,10,20,76,76);
  Craft.attachToHand(held,Craft.WeaponRig.normalize(weapon.rig,weapon));
};
