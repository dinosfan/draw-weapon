// Use the exact original PNG; crop only empty margins for a natural hand-held size.
Trainers.mountWeapon = async canvas => {
  const ctx=canvas.getContext('2d');
  let source;
  try {const saved=JSON.parse(localStorage.getItem('draw-weapon:equipped')); if(/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(saved?.image) && saved.image.length<1400000)source=saved.image;}catch{}
  if(!source){
    ctx.fillStyle=GamePalette.tokens.ink;ctx.fillRect(53,14,6,88);ctx.fillRect(36,71,40,6);ctx.fillRect(48,103,16,6);
    ctx.fillStyle=GamePalette.tokens.paper;ctx.fillRect(55,19,2,48);
    return false;
  }
  const image=new Image();image.src=source;await image.decode();
  const scratch=document.createElement('canvas');scratch.width=image.width;scratch.height=image.height;
  const c=scratch.getContext('2d');c.drawImage(image,0,0);
  const {data}=c.getImageData(0,0,image.width,image.height);
  let left=image.width,top=image.height,right=-1,bottom=-1;
  for(let y=0;y<image.height;y++)for(let x=0;x<image.width;x++){const i=(y*image.width+x)*4;if(data[i+3]>20 && Math.min(data[i],data[i+1],data[i+2])<235){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);}}
  if(right<left)return false;
  const w=right-left+1,h=bottom-top+1,scale=Math.min(104/w,104/h);
  ctx.clearRect(0,0,120,120);ctx.drawImage(image,left,top,w,h,(120-w*scale)/2,(120-h*scale)/2,w*scale,h*scale);
  return true;
};
