// Display-only crop: preserve the original lines and colors, remove empty margins.
Craft.drawHeldArtwork = async (canvas, source) => {
  if (!Craft.validArtwork(source)) return false;
  const image=new Image();image.src=source;await image.decode();
  const scratch=document.createElement('canvas');scratch.width=image.width;scratch.height=image.height;
  const ctx=scratch.getContext('2d');ctx.drawImage(image,0,0);
  const {data}=ctx.getImageData(0,0,image.width,image.height);
  let left=image.width,top=image.height,right=-1,bottom=-1;
  for(let y=0;y<image.height;y++)for(let x=0;x<image.width;x++) {
    const i=(y*image.width+x)*4;
    if(data[i+3]>20 && Math.min(data[i],data[i+1],data[i+2])<235){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);}
  }
  if(right<left)return false;
  const width=right-left+1,height=bottom-top+1;
  const scale=Math.min((canvas.width-8)/width,(canvas.height-8)/height);
  const target=canvas.getContext('2d');target.clearRect(0,0,canvas.width,canvas.height);
  canvas.artworkBounds={x:(canvas.width-width*scale)/2/canvas.width,y:(canvas.height-height*scale)/canvas.height,width:width*scale/canvas.width,height:height*scale/canvas.height};
  target.drawImage(image,left,top,width,height,(canvas.width-width*scale)/2,canvas.height-height*scale,width*scale,height*scale);
  return true;
};

// Approved trainer's forward hand is at sprite coordinate (44, 34) on its 56×64 grid.
Craft.attachToHand = (canvas,rig) => {
  const sprite=document.getElementById('player-sprite');if(!sprite)return;
  const bounds=canvas.artworkBounds||{x:0,y:0,width:1,height:1};
  const w=canvas.clientWidth||96,h=canvas.clientHeight||96;
  const gx=(bounds.x+rig.gripX*bounds.width)*w,gy=(bounds.y+rig.gripY*bounds.height)*h;
  canvas.style.left=((sprite.offsetLeft||0)+(sprite.clientWidth||224)*44/56-gx)+'px';
  canvas.style.top=((sprite.offsetTop||0)+(sprite.clientHeight||256)*34/64-gy)+'px';
  canvas.style.transformOrigin=gx+'px '+gy+'px';
};
