// Original 32×32 pixel sprites, drawn locally without external assets.
BattlePreview.drawSprites = (stageIndex,state) => {
  const palette = { k:'#000000', g:'#58a838', l:'#a8d058', d:'#306820', w:'#f7f9f6', p:'#ff5838', y:'#ffb000', b:'#a8a8a8' };
  const stage = Number.isInteger(stageIndex)?stageIndex+1:Number(document.getElementById('stage-counter')?.textContent.match(/STAGE (\d)/)?.[1] || 1);
  if (stage === 2) { palette.g='#ffb000'; palette.l='#f4d47d'; palette.d='#a85800'; }
  if (stage === 3) { palette.g='#a8a8a8'; palette.l='#f7f9f6'; palette.d='#585858'; }
  function paint(id, draw) {
    const ctx = document.getElementById(id).getContext('2d');
    ctx.clearRect(0,0,32,32);
    const rect = (color, x, y, width, height) => { ctx.fillStyle = palette[color]; ctx.fillRect(x,y,width,height); };
    draw(rect);
  }
  const enemyCanvas=document.getElementById('enemy-sprite');enemyCanvas.width=enemyCanvas.height=32;
  const enemyActor=document.querySelector('.enemy-fighter');if(enemyActor){enemyActor.dataset.boss=stage===3?'true':'false';enemyActor.dataset.phase=String(state?.bossPhase||0);}
  const encounter=BattlePreview.getEncounter?.(stage-1,state),custom=typeof BattleEnemySprites!=='undefined'&&encounter&&(encounter.sprite||encounter.boss)&&BattleEnemySprites.draw(document.getElementById('enemy-sprite'),encounter);
  if(!custom)paint('enemy-sprite', r => {
    r('k',9,8,16,17);r('k',6,12,22,10);r('k',11,5,4,5);r('k',21,4,4,7);r('g',10,10,14,13);r('l',11,9,4,4);r('d',19,16,6,7);
    r('k',6,22,7,6);r('k',22,22,6,6);r('g',7,21,5,4);r('g',23,21,4,4);r('k',3,15,5,7);r('k',27,13,4,8);
    r('w',11,14,4,4);r('w',20,14,4,4);r('k',13,15,2,3);r('k',20,15,2,3);r('k',16,21,4,1);
    r('g',10,3,4,5);r('l',8,2,4,3);r('g',22,2,3,5);r('l',25,1,3,3);r('l',16,6,3,4);
  });
  TrainerStudy.draw(document.getElementById('player-sprite'));
};
