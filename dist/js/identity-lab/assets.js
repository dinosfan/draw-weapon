// Authored fixture drawings: these are examples, never user drawing classifiers.
IdentityLab.assets=(()=>{
 const P=GamePalette.tokens,cache={};
 function make(id,draw){const canvas=document.createElement('canvas');canvas.width=canvas.height=96;const c=canvas.getContext('2d');c.lineCap='round';c.lineJoin='round';draw(c);return cache[id]=canvas;}
 const stroke=(c,color,width=3)=>{c.strokeStyle=P[color];c.lineWidth=width;};
 make('ball',c=>{c.fillStyle=P.paper;stroke(c,'ink',4);c.beginPath();c.arc(48,48,30,0,Math.PI*2);c.fill();c.stroke();stroke(c,'danger',2);for(const sign of [-1,1]){c.beginPath();c.moveTo(48+sign*18,23);c.quadraticCurveTo(48-sign*3,48,48+sign*18,73);c.stroke();for(let i=0;i<7;i++){const y=27+i*7,x=48+sign*(9+Math.pow((y-48)/24,2)*8);c.beginPath();c.moveTo(x-3,y-2);c.lineTo(x+3,y+2);c.stroke();}}});
 make('gun',c=>{c.fillStyle=P.metal;stroke(c,'ink',4);c.beginPath();c.moveTo(12,24);c.lineTo(82,24);c.lineTo(82,42);c.lineTo(49,42);c.lineTo(41,77);c.lineTo(23,73);c.lineTo(29,42);c.lineTo(12,42);c.closePath();c.fill();c.stroke();stroke(c,'ink',2);c.strokeRect(12,29,62,6);c.beginPath();c.moveTo(49,43);c.quadraticCurveTo(60,65,43,61);c.stroke();});
 make('bird',c=>{stroke(c,'ink',3);c.fillStyle=P.paper;c.beginPath();c.moveTo(9,52);c.lineTo(43,43);c.lineTo(27,12);c.lineTo(65,37);c.lineTo(85,28);c.lineTo(77,47);c.lineTo(88,51);c.lineTo(61,60);c.lineTo(40,83);c.lineTo(42,59);c.closePath();c.fill();c.stroke();stroke(c,'illusion',2);c.beginPath();c.moveTo(43,43);c.lineTo(62,49);c.lineTo(40,83);c.moveTo(27,12);c.lineTo(62,49);c.lineTo(77,47);c.stroke();c.fillStyle=P.ink;c.fillRect(72,38,3,3);});
 make('bullet',c=>{c.fillStyle=P.metal;stroke(c,'ink',3);c.beginPath();c.moveTo(20,38);c.lineTo(62,38);c.lineTo(78,48);c.lineTo(62,58);c.lineTo(20,58);c.closePath();c.fill();c.stroke();c.fillStyle=P.paper;c.fillRect(28,41,29,4);c.fillStyle=P.rock;c.fillRect(20,39,8,18);});
 make('paper',c=>{c.fillStyle=P.paper;stroke(c,'illusion',2);c.beginPath();c.moveTo(20,30);c.lineTo(73,22);c.lineTo(60,70);c.lineTo(34,61);c.closePath();c.fill();c.stroke();c.beginPath();c.moveTo(20,30);c.lineTo(60,70);c.stroke();});
 return cache;
})();
