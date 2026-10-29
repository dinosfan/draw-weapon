const fs=require('node:fs'),path=require('node:path');
const base='https://opengameart.org/sites/default/files/';
const files={
 'dist/assets/audio/title.ogg':'flowerbed_fields.ogg',
 'dist/assets/audio/loading.mp3':'TownTheme.mp3',
 'dist/assets/audio/workshop.mp3':'Red Curtain.mp3',
 'dist/assets/audio/battle-2.mp3':'battleThemeA.mp3',
 'dist/assets/audio/boss-1-intro.ogg':'rins-theme_intro.ogg',
 'dist/assets/audio/boss-1.ogg':'rins-theme_loop.ogg',
 'dist/assets/audio/boss-2-intro.mp3':'jrpg_battle_intro.mp3',
 'dist/assets/audio/boss-2.mp3':'jrpg_battle_loop.mp3',
 'output/audio-sources/chiptunes.zip':'Juhani Junkala [Chiptune Adventures] OGG.zip',
 'output/audio-sources/powerup.zip':'SoundPack01.zip',
 'output/audio-sources/8bit.zip':'8-Bit Sound Library.zip'
};
async function main(){const entries=Object.entries(files);let index=0;await Promise.all(Array.from({length:3},async()=>{while(index<entries.length){const [file,name]=entries[index++];if(fs.existsSync(file)&&fs.statSync(file).size>1000)continue;const response=await fetch(base+encodeURIComponent(name),{signal:AbortSignal.timeout(120000)});if(!response.ok)throw Error(name+': '+response.status);const data=Buffer.from(await response.arrayBuffer());if(data.length<1000||data.subarray(0,100).toString().includes('<!DOCTYPE'))throw Error('Invalid audio: '+name);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,data);console.log(file,data.length);}}));}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
