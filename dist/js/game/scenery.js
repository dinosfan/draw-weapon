// Approved pixel scenery, drawn at a fixed logical resolution using only the app palette.
window.GameScenery={paint(canvas,kind){
 canvas.width=480;canvas.height=240;const c=canvas.getContext('2d'),p=GamePalette.tokens,r=(color,x,y,w,h)=>{c.fillStyle=p[color];c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
 const oval=(color,x,y,w,h)=>{for(let yy=-h;yy<=h;yy++){const width=Math.floor(Math.sqrt(Math.max(0,1-yy*yy/(h*h)))*w);r(color,x-width,y+yy,width*2,1);}};
 function pine(x,y,size,color){r('ink',x-2*size,y,4*size,35*size);for(let tier=0;tier<4;tier++){const cy=y-24*size+tier*9*size,w=(7+tier*5)*size;for(let line=0;line<9*size;line+=2)r(color,x-w*(line/(9*size)),cy+line,w*(line/(9*size))*2,3);r(color,x-w,cy+8*size,w*2,3*size);}}
 function books(x,y){r('ink',x-3,y+18,55,5);for(let i=0;i<6;i++){const h=10+i%3*3;r(['metal','paper','muted','electric','metal','paper'][i],x+i*8,y+18-h,6,h);r('ink',x+i*8+1,y+21-h,3,1);}}
 if(kind==='workshop'){
  r('dark',0,0,480,240);r('muted',5,7,470,143);r('dark',8,10,464,133);for(let x=0;x<480;x+=72){r('ink',x,0,5,158);r('muted',x+5,0,2,149);}r('ink',0,148,480,92);r('muted',0,154,480,86);
  for(let y=155;y<240;y+=17){r('dark',0,y,480,2);for(let x=(y%3)*22;x<480;x+=91)r('dark',x,y,2,17);}r('dark',12,167,152,64);r('metal',16,171,144,56);r('dark',20,175,136,48);for(let x=25;x<151;x+=7){r('normal',x,178,3,3);r('normal',x,215,3,3);}
  r('ink',25,28,100,81);r('metal',29,32,92,73);r('flying',34,37,82,62);r('paper',37,41,25,4);r('paper',43,38,15,9);r('paper',81,52,25,5);pine(54,92,.6,'nature');pine(100,90,.8,'bug');r('ink',73,34,4,68);r('ink',31,70,87,4);r('ink',22,108,109,5);r('electric',21,28,8,68);r('rock',25,28,4,66);r('electric',121,28,8,68);
  books(143,33);books(377,39);r('ink',143,68,55,4);r('paper',147,53,16,15);r('ink',150,56,10,2);r('ink',150,61,7,2);r('nature',178,53,5,15);r('bug',173,57,5,5);r('bug',183,53,5,7);r('electric',173,66,17,9);r('ink',171,75,22,3);
  r('ink',143,94,2,24);r('ink',133,119,23,4);r('electric',137,111,16,9);r('paper',141,116,8,3);r('ink',130,123,29,3);
  r('ink',15,155,142,17);r('normal',19,155,134,12);r('metal',23,155,126,4);r('ink',23,172,8,31);r('ink',141,172,8,31);r('paper',91,151,28,7);r('subtle',94,148,25,5);r('ink',125,147,8,9);r('metal',126,149,6,2);r('paper',134,137,2,12);r('paper',136,133,3,5);
  r('ink',429,133,35,59);r('normal',432,136,29,51);for(let yy=138;yy<188;yy+=17){r('dark',432,yy,29,2);r('ink',445,yy+6,5,2);}r('ink',418,194,53,5);
 }else{
  r('paper',0,0,480,240);for(let x=-30;x<520;x+=27)pine(x,65+(x%4)*4,.85,'subtle');for(let x=-20;x<500;x+=45)pine(x,87+(x%3)*3,1.1,'metal');r('subtle',0,104,480,136);
  for(let y=120;y<240;y+=7){const start=225-(y-120)*1.6,end=302+(y-120)*.6;r('paper',start,y,end-start,8);}for(let i=0;i<110;i++){const x=(i*83+23)%480,y=115+(i*37)%124;if(x>240-(y-120)*1.8&&x<310+(y-120)*.7)continue;r(i%7===0?'nature':'metal',x,y,2+i%3,1);if(i%5===0)r('muted',x+1,y-2,1,2);}
  const pad=GameStageLayout.enemyPad,px=pad.x*480,py=pad.y*240;oval('metal',px,py+8,67,16);oval('muted',px,py+4,67,15);oval('paper',px,py,64,13);oval('subtle',px,py-1,49,9);oval('metal',108,219,82,19);oval('muted',108,215,82,18);oval('paper',108,210,79,15);oval('subtle',108,209,65,10);
  for(const[x,y,s]of [[-5,52,2.4],[38,69,1.8],[450,55,2.4],[484,99,2.8],[-10,180,2],[455,217,1.7]]){pine(x,y,s,'dark');for(let i=0;i<4;i++)r('muted',x-17*s+i*9*s,y-8*s+i%2*5,11*s,2*s);}
  for(let x=0;x<480;x+=13){if(x>54&&x<390)continue;r('dark',x,231-x%9,4,10+x%9);r('muted',x+4,233-x%7,2,7+x%7);}for(const[x,y]of [[209,188],[397,171],[163,151],[420,204]]){r('muted',x,y,10,5);r('metal',x+2,y-2,6,4);r('ink',x+1,y+5,10,1);r('nature',x+13,y+1,2,5);}
 }
}};
