(function(root){
  const Palette=typeof module!=='undefined'&&module.exports?require('../palette.js'):root.GamePalette;
  // IDs nature/metal/illusion are retained so existing saved drawings still work.
  const labels={normal:'노말',fighting:'격투',flying:'비행',poison:'독',ground:'땅',rock:'바위',bug:'벌레',ghost:'고스트',metal:'강철',fire:'불꽃',water:'물',nature:'풀',electric:'전기',illusion:'에스퍼',ice:'얼음',dragon:'드래곤',dark:'악',fairy:'페어리',unknown:'???',stellar:'스텔라'};
  const aliases={grass:'nature',steel:'metal',psychic:'illusion',none:'unknown','???':'unknown'};
  const resolve=type=>typeof type==='string'?(aliases[type]||type):'';
  const valid=type=>Object.hasOwn(labels,resolve(type));
  const colorTokens=Object.fromEntries(Object.keys(labels).map(type=>[type,type==='unknown'?'subtle':type]));
  const colors=Object.fromEntries(Object.entries(colorTokens).map(([type,token])=>[type,Palette.tokens[token]]));
  // Standard 18-type relationships. App balance retains x1.5 / x0.75 and non-stacking dual types.
  // Source: https://sg.portal-pokemon.com/game/type-chart/
  const strong={normal:[],fighting:['normal','ice','rock','dark','metal'],flying:['fighting','nature','bug'],poison:['nature','fairy'],ground:['fire','electric','poison','rock','metal'],rock:['fire','ice','flying','bug'],bug:['nature','illusion','dark'],ghost:['illusion','ghost'],metal:['ice','rock','fairy'],fire:['nature','ice','bug','metal'],water:['fire','ground','rock'],nature:['water','ground','rock'],electric:['water','flying'],illusion:['fighting','poison'],ice:['nature','ground','flying','dragon'],dragon:['dragon'],dark:['illusion','ghost'],fairy:['fighting','dragon','dark'],unknown:[],stellar:[]};
  const weak={normal:['rock','metal'],fighting:['flying','poison','illusion','bug','fairy'],flying:['electric','rock','metal'],poison:['poison','ground','rock','ghost'],ground:['nature','bug'],rock:['fighting','ground','metal'],bug:['fire','fighting','poison','flying','ghost','metal','fairy'],ghost:['dark'],metal:['fire','water','electric','metal'],fire:['fire','water','rock','dragon'],water:['water','nature','dragon'],nature:['fire','nature','poison','flying','bug','dragon','metal'],electric:['electric','nature','dragon'],illusion:['illusion','metal'],ice:['fire','water','ice','metal'],dragon:['metal'],dark:['fighting','dark','fairy'],fairy:['fire','poison','metal'],unknown:[],stellar:[]};
  const immune={normal:['ghost'],fighting:['ghost'],poison:['metal'],ground:['flying'],electric:['ground'],illusion:['dark'],ghost:['normal'],dragon:['fairy']};
  function normalize(types){
    if(!Array.isArray(types)||!types.length||types.length>2||types.some(type=>!valid(type)))throw Error('무기 타입 형식 오류');
    const result=types.map(resolve);if(new Set(result).size!==result.length||result.length>1&&result.some(type=>['unknown','stellar'].includes(type)))throw Error('무기 타입 형식 오류');return result;
  }
  function multiplier(attack,defenders=['normal']){
    attack=valid(attack)?resolve(attack):'normal';
    const values=defenders.map(value=>{const type=resolve(value);if(immune[attack]?.includes(type))return 0;if(strong[attack].includes(type))return 1.5;if(weak[attack].includes(type))return .75;return 1;});
    if(values.includes(0))return 0;return values.includes(1.5)&&values.includes(.75)?1:values.includes(1.5)?1.5:values.includes(.75)?.75:1;
  }
  const label=type=>labels[resolve(type)]||labels.normal;
  const color=type=>colors[resolve(type)]||colors.normal;
  function ink(type){const hex=color(type).slice(1),rgb=[0,2,4].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4),l=.2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2];return (l+.05)/.05>=1.05/(l+.05)?Palette.tokens.ink:Palette.tokens.surface;}
  const badge=type=>'<span class="type-badge" style="--type-color:'+color(type)+';--type-ink:'+ink(type)+'">'+label(type)+'</span>';
  const badges=types=>(types?.length?types:['normal']).map(badge).join(' ');
  const api={labels,aliases,resolve,colorTokens,colors,color,ink,badge,badges,strong,weak,immune,valid,normalize,multiplier,label,summary:types=>(types||['normal']).map(label).join(' / ')};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else{root.Craft=root.Craft||{};root.Craft.Types=api;}
})(typeof window!=='undefined'?window:globalThis);
