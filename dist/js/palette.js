// App UI/effect colors: edit only here, then run node scripts/build-palette.cjs.
// Values are selected from Open Color 1.9.1 (MIT): https://yeun.github.io/open-color/
(function(root){
  const tokens=Object.freeze({
    ink:'#000000',paper:'#f8f9fa',surface:'#ffffff',muted:'#495057',subtle:'#e9ecef',
    fire:'#fd7e14',water:'#339af0',nature:'#40c057',electric:'#fcc419',
    metal:'#adb5bd',ice:'#3bc9db',illusion:'#f06595',normal:'#868e96',danger:'#fa5252',
    fighting:'#e8590c',flying:'#a5d8ff',poison:'#9c36b5',ground:'#d9480f',rock:'#e67700',
    bug:'#74b816',ghost:'#5f3dc4',dragon:'#4263eb',dark:'#343a40',fairy:'#fcc2d7',stellar:'#38d9a9'
  });
  const sources=Object.freeze({ink:'black',paper:'gray 0',surface:'white',muted:'gray 7',subtle:'gray 2',fire:'orange 6',water:'blue 5',nature:'green 6',electric:'yellow 5',metal:'gray 5',ice:'cyan 4',illusion:'pink 5',normal:'gray 6',danger:'red 6',fighting:'orange 8',flying:'blue 2',poison:'grape 8',ground:'orange 9',rock:'yellow 9',bug:'lime 7',ghost:'violet 9',dragon:'indigo 7',dark:'gray 8',fairy:'pink 2',stellar:'teal 4'});
  const api=Object.freeze({tokens,sources});
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.GamePalette=api;
})(typeof window!=='undefined'?window:globalThis);
