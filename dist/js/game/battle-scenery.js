(function(root){
 function paint(canvas,stage,phase=0){
  canvas.width=480;canvas.height=240;const c=canvas.getContext('2d'),p=root.GamePalette.tokens;
  const r=(color,x,y,w,h)=>{c.fillStyle=p[color];c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
  const oval=(color,x,y,w,h)=>{for(let dy=-h;dy<=h;dy++){const dx=Math.floor(Math.sqrt(Math.max(0,1-dy*dy/(h*h)))*w);r(color,x-dx,y+dy,dx*2,1);}};
  const line=(color,points,size=2)=>{for(let i=1;i<points.length;i++){const[a,b]=[points[i-1],points[i]],n=Math.max(Math.abs(b[0]-a[0]),Math.abs(b[1]-a[1]));for(let j=0;j<=n;j++)r(color,a[0]+(b[0]-a[0])*j/(n||1),a[1]+(b[1]-a[1])*j/(n||1),size,size);}};
  if(stage===1){
   r('paper',0,0,480,240);r('subtle',0,27,480,84);
   for(let x=-20;x<500;x+=54){const y=17+(Math.abs(x)%4)*3;r('metal',x,y,43,93-y);r('muted',x,y,43,4);for(let k=0;k<3;k++)r('metal',x+k*17,y-9,9,10);r('dark',x+15,y+17,8,18);r('paper',x+17,y+17,2,11);}
   r('muted',196,37,108,71);r('ink',202,40,96,68);oval('ink',250,40,48,23);r('dark',210,39,80,69);oval('dark',250,40,40,17);r('subtle',226,44,47,65);r('paper',237,45,25,64);
   for(let x=212;x<291;x+=12){r('muted',x,48,3,60);r('electric',x,48,2,3);}r('muted',191,105,117,7);
   for(const x of [169,317]){r('dark',x,35,15,38);r('paper',x+2,36,11,30);r('metal',x+7,38,2,23);r('electric',x-2,33,19,3);}
   r('subtle',0,112,480,128);for(let y=115;y<240;y+=19){r('metal',0,y,480,2);for(let x=(y%3)*23;x<480;x+=64)r('metal',x,y,2,19);}
   for(let y=114;y<240;y+=6){const width=35+(y-114)*.8;r('paper',250-width,y,width*2,6);}
   for(const x of [0,464]){r('ink',x,13,16,222);r('muted',x+3,16,10,217);r('metal',x+4,17,3,210);r('dark',x-4,96,24,8);}
   for(const[x,y]of [[52,170],[406,202],[176,142],[391,151]]){r('metal',x,y,14,4);r('muted',x+2,y+4,13,2);r('paper',x+1,y-2,9,2);}
  }else{
   const accent=phase>0?'electric':'ghost';r('dark',0,0,480,240);r('muted',0,73,480,43);
   for(let i=0;i<34;i++){const x=(i*79+17)%480,y=(i*37+7)%89;r(i%4===0?accent:'metal',x,y,i%3===0?2:1,1);}
   for(let x=-15;x<500;x+=47){const y=26+Math.abs(x*7)%39;r('dark',x,y,32,89-y);r('metal',x,y,7,8);r('ink',x+9,y+13,10,28);r('metal',x+28,y+5,4,18);}
   r('ink',250,19,128,95);oval('ink',314,20,64,18);r('muted',259,24,109,88);oval('muted',314,23,54,12);r('dark',270,34,87,79);r(accent,275,36,3,64);r(accent,348,36,3,64);r('ink',286,10,17,9);r('ink',329,7,18,14);r('metal',286,11,7,4);r('metal',329,8,6,4);
   for(let y=39;y<101;y+=12){r('ink',255,y,17,2);r('ink',354,y+3,16,2);}
   r('muted',0,111,480,129);for(let y=115;y<240;y+=24){r('dark',0,y,480,2);for(let x=(y%5)*14;x<480;x+=79)r('dark',x,y,2,24);}
   line('dark',[[196,114],[211,141],[194,158],[215,179],[202,198]],3);line('dark',[[385,123],[370,158],[390,176],[372,200]],3);line('metal',[[196,114],[211,141],[194,158]],1);
   for(const[x,y,h]of [[4,63,173],[458,40,197]]){r('ink',x,y,18,h);r('metal',x+3,y,4,h);r('dark',x-5,y+10,29,8);r('normal',x+7,y+15,6,h-15);}
   for(const[x,y]of [[41,171],[193,225],[426,195],[397,148]]){r('dark',x,y,17,7);r('metal',x+2,y-3,11,5);r('ink',x+1,y+7,17,2);}
   if(phase>0){for(const points of [[[211,15],[203,31],[215,40],[198,63]],[[399,7],[389,30],[405,42],[389,67]],[[32,113],[48,137],[35,151],[52,174]]]){line('fighting',points,3);line('electric',points,1);}for(let i=0;i<16;i++)r(i%3?'electric':'paper',(i*71+22)%480,20+(i*31)%91,2,2);r('electric',275,101,76,2);}
  }
  // Preserve the same ground anchors and foot positions in every location.
  const pad=root.GameStageLayout.enemyPad,px=pad.x*480,py=pad.y*240;
  for(const[x,y,w,h]of [[px,py,67,16],[108,210,82,19]]){oval('metal',x,y+8,w,h);oval('muted',x,y+4,w,h-1);oval('paper',x,y,w-3,h-3);oval('subtle',x,y-1,w-16,h-7);}
 }
 const api={paint};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.GameBattleScenery=api;
})(typeof window!=='undefined'?window:globalThis);
