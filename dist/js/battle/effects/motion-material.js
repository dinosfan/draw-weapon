(function(root){
 function drawingRect(bounds,crop,width,height){const b=bounds||{x:0,y:0,width:1,height:1};return{x:(b.x+crop.x*b.width)*width,y:(b.y+crop.y*b.height)*height,w:crop.w*b.width*width,h:crop.h*b.height*height};}
 function glyphPixels(glyph){
  const rows=glyph.split('/'),w=rows[0].length,h=rows.length,at=(x,y)=>x<0||y<0||x>=w||y>=h?'.':rows[y][x];
  let left=w,top=h,right=-1,bottom=-1;for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(at(x,y)!=='.'){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
  if(right<left)return{width:4,height:4,bodyWidth:0,bodyHeight:0,pixels:[]};
  const pixels=[];for(let y=top;y<=bottom;y++)for(let x=left;x<=right;x++){
   let color=at(x,y);if(color==='.')continue;
   // Keep the AI silhouette and holes. Dark pixels inside solid matter are shading,
   // not a black fill that overwhelms a small low-resolution projectile.
   const inside=[[1,0],[-1,0],[0,1],[0,-1]].every(([dx,dy])=>at(x+dx,y+dy)!=='.');
   if(inside&&(color==='1'||color==='2'))color='3';
   pixels.push({x:x-left+2,y:y-top+2,color});
  }
  return{width:right-left+5,height:bottom-top+5,bodyWidth:right-left+1,bodyHeight:bottom-top+1,pixels};
 }
 function size(width,height,requested,arenaHeight,maxScale=3.5){const scale=Math.min(requested/Math.max(width,height),maxScale,arenaHeight*.4/Math.max(width,height));return{w:width*scale,h:height*scale};}
 function safeAtlasRow(atlas,row){
  try{const tile=atlas.tile,c=atlas.canvas.getContext('2d');for(let col=0;col<4;col++){const {data}=c.getImageData(col*tile,row*tile,tile,tile);let edge=0;for(let y=0;y<tile;y++)for(let x=0;x<tile;x++)if((x<2||y<2||x>=tile-2||y>=tile-2)&&data[(y*tile+x)*4+3]>96)edge++;if(edge>8)return false;}return true;}catch{return false;}
 }
 const api={drawingRect,glyphPixels,size,safeAtlasRow};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.MotionMaterial=api;
})(typeof window!=='undefined'?window:globalThis);
