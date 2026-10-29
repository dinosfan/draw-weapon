(function(root){
 const tracks={title:{loop:'title.ogg'},loading:{loop:'loading.mp3'},workshop:{loop:'workshop.mp3'},battle1:{loop:'battle-1.ogg'},battle2:{loop:'battle-2.mp3'},boss1:{intro:'boss-1-intro.ogg',loop:'boss-1.ogg'},boss2:{intro:'boss-2-intro.mp3',loop:'boss-2.mp3'}};
 const cues={evolutionRise:'evolution-rise.wav',evolutionCraft:'evolution-craft.mp3',evolutionComplete:'evolution-complete.mp3',confirm:'menu-confirm.mp3'};
 const credits=[
  ['Flowerbed Fields [Loop]','Zane Little Music','CC0','flowerbed-fields-loop'],
  ['Town Theme RPG','cynicmusic — cynicmusic.com / pixelsphere.org','CC0','town-theme-rpg'],
  ['Red Curtain','HorrorPen','CC BY 3.0','red-curtain'],
  ['Chiptune Adventures — Boss Fight','Juhani Junkala / SubspaceAudio','CC0','4-chiptunes-adventure'],
  ['Battle Theme A','cynicmusic — cynicmusic.com / pixelsphere.org','CC0','battle-theme-a'],
  ["Rin’s Theme",'request — request.moe','CC0','rins-theme-loopable-chiptune-adventurebattle-bgm'],
  ['JRPG Epic Rock Battle Theme #1','HydroGene','CC0','jrpg-epic-rock-battle-theme-1'],
  ['Level up, power up, Coin get — Rise03','WobbleBoxx Workshop','CC0','level-up-power-up-coin-get-13-sounds'],
  ['8-Bit Sound Effects Library','Little Robot Sound Factory — www.littlerobotsoundfactory.com','CC BY 3.0','8-bit-sound-effects-library']
 ];
 function battleTrack(state){return state.stage>=2?(state.bossPhase===1?'boss2':'boss1'):state.stage===1?'battle2':'battle1';}
 const api={tracks,cues,credits,battleTrack};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.GameAudioManifest=api;
})(typeof window!=='undefined'?window:globalThis);
