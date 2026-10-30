const fs=require('node:fs'),path=require('node:path');
const Fast=require('./fast-path.cjs'),Prompts=require('./skill-prompts.cjs');
// Only a complete fresh set uses a 4x4 sheet. Cached/inherited rows are never
// regenerated merely to fill this layout; partial sets use the per-row path.
function eligible({weapon,ready,retryRows,rowCorrections,moves}){
 return weapon.moves.length===4&&!ready.size&&!retryRows.length&&!Object.keys(rowCorrections).length&&moves.every(move=>Fast.select({move,mode:'glyph'}));
}
async function generate({weapon,moves,folder,helper,render,inspect,accept,reviewSkill,signal,notify}){
 const check=()=>signal?.throwIfAborted();
 const tokens=require('../../../dist/js/palette.js').tokens;
 const colors=['ink','dark','dragon','paper'].map(k=>[1,3,5].map(i=>parseInt(tokens[k].slice(i,i+2),16)));
 for(let i=0;i<4;i++){
  check();const selected=Fast.select({move:moves[i],mode:'glyph'});if(!selected)continue;
  fs.writeFileSync(path.join(folder,i+'-glyph.json'),JSON.stringify({glyph:selected.glyph,colors}));
  await helper('glyph-guide',['--index',String(i)]);
 }
 await helper('sheet-guide',[]);
 notify('animating','네 기술의 도트 16장면을 한 장에 만들고 있어…');
 let file;
 try{file=await render('four-skills',Prompts.sheet(weapon,moves),path.join(folder,'sheet-guide.png'),1024);}
 catch(error){check();if(![400,500,502,503,504].includes(error.status))throw error;notify('repairing','이미지 응답을 완료하지 못해 기술별로 나누어 준비하고 있어…');return;}
 check();try{await helper('sheet-split',['--image',file]);}catch{check();notify('repairing','격자 형식을 보완하기 위해 기술별 도트를 준비하고 있어…');return;}
 const corrections={};
 await require('./concurrent.cjs').each([0,1,2,3],4,async i=>{
  check();const rowFile=path.join(folder,i+'-sheet.png');let inspection;
  try{inspection=await inspect(i,rowFile);}catch(error){check();if(!(error instanceof SyntaxError)&&![502,504].includes(error.status))throw error;notify('repairing',(i+1)+'/4 · '+moves[i].name+'의 도트를 다시 검사할 수 있게 준비할게');return;}
  if(!inspection.valid){notify('repairing',(i+1)+'/4 · '+moves[i].name+'의 도트만 다시 준비할게');return;}
  let semantic;
  if(reviewSkill){semantic=await reviewSkill({file:rowFile,index:i,signal});check();if(semantic?.verdict==='mismatch'){if(typeof semantic.correction==='string')corrections[i]=semantic.correction;return;}}
  await accept(i,rowFile,inspection,semantic);
 });
 return corrections;
}
module.exports={eligible,generate};
