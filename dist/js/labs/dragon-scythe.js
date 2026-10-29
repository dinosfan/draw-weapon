Craft.DragonScythe={create(){
 const canvas=document.createElement('canvas');canvas.width=400;canvas.height=300;
 const ctx=canvas.getContext('2d');ctx.fillStyle=GamePalette.tokens.surface;ctx.fillRect(0,0,400,300);ctx.strokeStyle=GamePalette.tokens.ink;ctx.lineWidth=5;ctx.lineJoin='round';ctx.lineCap='round';
 function shape(points,fill){ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));if(fill){ctx.closePath();ctx.fillStyle=GamePalette.tokens[fill];ctx.fill();}ctx.stroke();}
 shape([[161,116],[205,271],[218,267],[180,111]],'metal');
 shape([[150,98],[174,63],[217,39],[277,41],[323,68],[352,113],[351,156],[323,205],[327,151],[306,112],[272,88],[232,84],[198,105]],'metal');
 shape([[148,104],[112,94],[84,73],[109,69],[98,43],[129,56],[150,46],[158,71],[187,75],[202,91],[181,116],[151,125],[132,114]],'paper');
 shape([[109,84],[122,85],[130,80]]);shape([[156,89],[167,85],[165,96]],'dragon');shape([[156,125],[147,144],[173,138]],'paper');
 shape([[175,153],[193,158],[181,174]]);shape([[186,194],[204,200],[194,213]]);shape([[203,247],[217,241]]);
 return {study:'dragon-scythe',kind:'custom',name:'용의 초승달 낫',icon:'✨',type:'용의 낫',trait:'비늘 칼날',reason:'용의 머리와 뿔이 칼날로 이어지는 낫. 휘어진 날이 용의 궤적을 따라 상대를 벤다.',attack:24,types:['dragon','metal'],typeReason:'용의 머리·뿔·비늘이 핵심 모티프이며 칼날은 강철이다.',rig:{family:'blade',gripX:.48,gripY:.75,tipX:.88,tipY:.43},artwork:canvas.toDataURL('image/png'),moves:[
  ['비늘 베기','metal',24,15,100,'slash'],['용아 참격','dragon',30,10,95,'pierce'],['초승달 절단','metal',38,6,85,'heavy'],['창룡의 일섬','dragon',46,3,75,'slash']
 ].map(([name,element,damage,pp,accuracy,feel])=>({name,element,damage,pp,heal:0,skipCounter:false,feel,description:'용의 낫으로 벤다.',rule:{kind:'attack',accuracy,chance:0,amount:1},delivery:{mode:'swing',payload:'none',count:1,spread:0,path:'arc'},story:['wind','sweep','converge'].map((action,i)=>({label:['날을 세운다','큰 궤적으로 벤다','손잡이를 거둔다'][i],action,target:i===1?'enemy':'caster',part:'whole',motif:'none',duration:500}))}))};
}};
