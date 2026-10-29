(function(root){
 const variants=Object.freeze({fang:'assets/vfx/dragon-fang-v1.png',storm:'assets/vfx/dragon-storm-v1.png'});
 const cache=new Map();
 const channels=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
 function frame(progress){const sequence=[0,1,1,2,3];return sequence[Math.min(4,Math.max(0,Math.floor(progress*5)))];}
 function nearest(pixel,colors){let best=0,distance=Infinity;colors.forEach((color,index)=>{const d=color.reduce((sum,c,i)=>sum+(c-pixel[i])**2,0);if(d<distance){distance=d;best=index;}});return best;}
 // Find opaque rectangular backdrops, including ones split into separate white regions by artwork.
 function rectangularMattes(data,tile,columns=4,remove=false){
  const stride=tile*columns,issues=[];
  for(let row=0;row<columns;row++)for(let col=0;col<columns;col++){
   const offset=(x,y)=>((row*tile+y)*stride+col*tile+x)*4;
   const opaque=(x,y)=>x>=0&&y>=0&&x<tile&&y<tile&&data[offset(x,y)+3]>=96;
   const light=(x,y)=>{const i=offset(x,y);return opaque(x,y)&&Math.min(data[i],data[i+1],data[i+2])>=185&&Math.max(data[i],data[i+1],data[i+2])-Math.min(data[i],data[i+1],data[i+2])<=75;};
   const neutral=(x,y)=>{const i=offset(x,y);return opaque(x,y)&&Math.max(data[i],data[i+1],data[i+2])-Math.min(data[i],data[i+1],data[i+2])<=35;};
   const heights=new Uint16Array(tile),boxes=new Map();
   for(let y=0;y<tile;y++){for(let x=0;x<tile;x++)heights[x]=opaque(x,y)?heights[x]+1:0;const stack=[];
    for(let x=0;x<=tile;x++){const height=x===tile?0:heights[x];let start=x;
     while(stack.length&&stack.at(-1).h>height){const entry=stack.pop(),w=x-entry.x,h=entry.h;start=entry.x;if(w>=Math.max(12,tile*.18)&&h>=Math.max(12,tile*.18)&&w*h>=tile*tile*.05){const box={l:entry.x,r:x-1,t:y-h+1,b:y,area:w*h};boxes.set([box.l,box.r,box.t,box.b].join(','),box);}}
     if(height&&(!stack.length||stack.at(-1).h<height))stack.push({x:start,h:height});
    }
   }
   for(const box of [...boxes.values()].sort((a,b)=>b.area-a.area)){
    const{l,r,t,b}=box,border=[],outside=[];for(let x=l;x<=r;x++){border.push([x,t],[x,b]);outside.push([x,t-1],[x,b+1]);}for(let y=t;y<=b;y++){border.push([l,y],[r,y]);outside.push([l-1,y],[r+1,y]);}
    if(border.some(([x,y])=>!opaque(x,y))||outside.filter(([x,y])=>!opaque(x,y)).length/outside.length<.72)continue;
    const lights=border.filter(([x,y])=>light(x,y)),buckets=new Map();for(const[x,y]of border){const i=offset(x,y),key=[data[i]>>5,data[i+1]>>5,data[i+2]>>5].join(',');buckets.set(key,(buckets.get(key)||0)+1);}const flat=Math.max(...buckets.values())/border.length>=.55;
    if(lights.length/border.length<.25&&border.filter(([x,y])=>neutral(x,y)).length/border.length<.8&&!flat)continue;
    if(remove&&lights.length/border.length>=.25){const seen=new Uint8Array(tile*tile),stack=lights.map(([x,y])=>y*tile+x);for(const p of stack)seen[p]=1;
     while(stack.length){const p=stack.pop(),x=p%tile,y=Math.floor(p/tile);data[offset(x,y)+3]=0;for(const[dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,n=ny*tile+nx;if(nx<Math.max(0,l-2)||nx>Math.min(tile-1,r+2)||ny<Math.max(0,t-2)||ny>Math.min(tile-1,b+2)||seen[n]||!light(nx,ny))continue;seen[n]=1;stack.push(n);}}
    }else{issues.push({row,col,box:[l,t,r,b]});break;}
   }
  }return issues;
 }
 // Remove large rectangular near-white mattes, never all white pixels: enclosed bright cores stay.
 function clearWhiteMattesPass(data,tile,columns=4){
  rectangularMattes(data,tile,columns,true);
  const stride=tile*columns;
  for(let row=0;row<columns;row++)for(let col=0;col<columns;col++){
   const offset=(x,y)=>((row*tile+y)*stride+col*tile+x)*4,seen=new Uint8Array(tile*tile);
   const white=(x,y)=>{const i=offset(x,y),r=data[i],g=data[i+1],b=data[i+2];return data[i+3]>=96&&Math.min(r,g,b)>=185&&Math.max(r,g,b)-Math.min(r,g,b)<=75;};
   for(let y=0;y<tile;y++)for(let x=0;x<tile;x++){
    const start=y*tile+x;if(seen[start]||!white(x,y))continue;const stack=[start],points=[];seen[start]=1;let l=x,r=x,t=y,b=y;
    while(stack.length){const p=stack.pop(),px=p%tile,py=Math.floor(p/tile);points.push(p);l=Math.min(l,px);r=Math.max(r,px);t=Math.min(t,py);b=Math.max(b,py);
     for(const[dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=px+dx,ny=py+dy,n=ny*tile+nx;if(nx<0||ny<0||nx>=tile||ny>=tile||seen[n]||!white(nx,ny))continue;seen[n]=1;stack.push(n);}}
    const w=r-l+1,h=b-t+1;
    // A backdrop split by a dark ring can leave narrow L-shaped or striped fragments.
    // Their long, straight exposed edge differs from rounded glow and enclosed white cores.
    const members=new Set(points);let straight=0;
    // Scan every component edge, not just its bounding box: sparkles can extend past the matte.
    for(let yy=t;yy<=b;yy++)for(const dy of [-1,1]){let run=0;for(let xx=l;xx<=r;xx++){run=members.has(yy*tile+xx)&&!members.has((yy+dy)*tile+xx)?run+1:0;straight=Math.max(straight,run);}}
    for(let xx=l;xx<=r;xx++)for(const dx of [-1,1]){let run=0;for(let yy=t;yy<=b;yy++){run=members.has(yy*tile+xx)&&!members.has(yy*tile+xx+dx)?run+1:0;straight=Math.max(straight,run);}}
    const smallPatch=Math.max(1,Math.min(3,Math.floor(Math.min(w,h)/3))),corners=[[l,t,1,1],[r,t,-1,1],[l,b,1,-1],[r,b,-1,-1]];
    const filledCorners=corners.filter(([cx,cy,dx,dy])=>{let count=0;for(let yy=0;yy<smallPatch;yy++)for(let xx=0;xx<smallPatch;xx++)if(members.has((cy+yy*dy)*tile+cx+xx*dx))count++;return count/(smallPatch*smallPatch)>=.5;}).length;
    const exposed=points.some(p=>{const x=p%tile,y=Math.floor(p/tile);return [[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>x+dx<0||x+dx>=tile||y+dy<0||y+dy>=tile||data[offset(x+dx,y+dy)+3]<96);});
    if(points.length>=tile*tile*.003&&Math.min(w,h)>=3&&points.length/(w*h)>=.25&&filledCorners>=1&&straight>=Math.max(6,tile*.08)&&exposed){for(const p of points)data[offset(p%tile,Math.floor(p/tile))+3]=0;continue;}
    if(points.length>=tile*tile*.015&&Math.min(w,h)>=3&&straight>=Math.max(12,tile*.25)){for(const p of points)data[offset(p%tile,Math.floor(p/tile))+3]=0;continue;}
    if(points.length<tile*tile*.06||w<tile*.22||h<tile*.22||points.length/(w*h)<.55)continue;
    // Gradients and compression can interrupt an exact corner pixel; inspect a small corner patch.
    const patch=Math.max(2,Math.round(Math.min(w,h)*.06));
    if(![[l,t,1,1],[r,t,-1,1],[l,b,1,-1],[r,b,-1,-1]].every(([cx,cy,dx,dy])=>{let count=0;for(let yy=0;yy<patch;yy++)for(let xx=0;xx<patch;xx++)if(members.has((cy+yy*dy)*tile+cx+xx*dx))count++;return count/(patch*patch)>=.5;}))continue;
    for(const p of points)data[offset(p%tile,Math.floor(p/tile))+3]=0;
   }
  }return data;
 }
 function clearWhiteMattes(data,tile,columns=4){
  for(let pass=0;pass<4;pass++){const before=data.slice();clearWhiteMattesPass(data,tile,columns);let changed=false;for(let i=3;i<data.length;i+=4)if(before[i]!==data[i]){changed=true;break;}if(!changed)break;}return data;
 }
 function transparencyIssues(data,tile,columns=4){
  const issues=rectangularMattes(data,tile,columns),prepared=data.slice(),stride=tile*columns;clearWhiteMattes(prepared,tile,columns);
  for(let row=0;row<columns;row++)for(let col=0;col<columns;col++){let changed=false;for(let y=0;y<tile&&!changed;y++)for(let x=0;x<tile;x++){const i=((row*tile+y)*stride+col*tile+x)*4+3;if(data[i]>prepared[i]){changed=true;break;}}if(changed)issues.push({row,col,reason:'누끼 잔여 영역'});}return issues;
 }
 function quantize(data,element,palette=root.GamePalette,types=root.Craft.Types,generated=false){
  const tokens=palette.tokens,keys=['ink','dark','dragon','metal','paper'];
  const source=keys.map(key=>channels(tokens[key])),target=[tokens.ink,tokens.dark,types.color(element),tokens.metal,tokens.paper].map(channels);
  for(let i=0;i<data.length;i+=4){if(data[i+3]<96||data[i]<65&&data[i+1]>210&&data[i+2]<65){data[i+3]=0;continue;}const colored=generated&&data[i+2]>65&&data[i+2]-data[i]>25&&data[i+2]-data[i+1]>25,match=target[colored?2:nearest(data.subarray(i,i+3),source)];data[i]=match[0];data[i+1]=match[1];data[i+2]=match[2];data[i+3]=255;}return data;
 }
 function cleanEdges(data,tile,columns=4){
  const stride=tile*columns;
  for(let row=0;row<columns;row++)for(let col=0;col<columns;col++){
   const seen=new Uint8Array(tile*tile),offset=(x,y)=>((row*tile+y)*stride+col*tile+x)*4;
   for(let y=0;y<tile;y++)for(let x=0;x<tile;x++){
    const start=y*tile+x;if(seen[start]||!data[offset(x,y)+3])continue;
    const stack=[start],component=[];seen[start]=1;let left=x,right=x,top=y,bottom=y;
    while(stack.length){const p=stack.pop(),px=p%tile,py=Math.floor(p/tile);component.push(p);left=Math.min(left,px);right=Math.max(right,px);top=Math.min(top,py);bottom=Math.max(bottom,py);
     for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const nx=px+dx,ny=py+dy,n=ny*tile+nx;if(nx<0||ny<0||nx>=tile||ny>=tile||seen[n]||!data[offset(nx,ny)+3])continue;seen[n]=1;stack.push(n);}
    }
    if(component.length<=2||top>tile*.8&&bottom-top<3&&right-left>5)for(const p of component)data[offset(p%tile,Math.floor(p/tile))+3]=0;
   }
  }return data;
 }
 function validateReadyRows(rows,columns=4){if(rows===undefined)return Array.from({length:columns},(_,i)=>i);if(!Array.isArray(rows)||!rows.length||rows.length>columns||new Set(rows).size!==rows.length||rows.some(r=>!Number.isInteger(r)||r<0||r>=columns))throw Error('완성된 도트 기술 위치 형식 오류');return[...rows].sort();}
 function assertFrames(data,tile,columns=4,allowFadeEmpty=false,readyRows){
  readyRows=validateReadyRows(readyRows,columns);
  const matte=transparencyIssues(data,tile,columns);if(matte.length){const error=Error('생성된 연출에 사각 배경이나 누끼 잔여 영역이 남아 있습니다. 해당 기술 도트만 다시 만듭니다.');error.failedRows=[...new Set(matte.map(issue=>issue.row))];throw error;}
  const stride=tile*columns,bad=new Set();for(let row=0;row<columns;row++)for(let col=0;col<columns;col++){let count=0;for(let y=0;y<tile;y++)for(let x=0;x<tile;x++)if(data[((row*tile+y)*stride+col*tile+x)*4+3])count++;if(!readyRows.includes(row)){if(count)throw Error('아직 준비되지 않은 기술 이미지가 섞였습니다.');continue;}if(count<6&&!(allowFadeEmpty&&col===3)||count>tile*tile*.95)bad.add(row);}if(bad.size){const error=Error('생성된 연출의 프레임이 비었거나 배경을 분리하지 못했습니다. 해당 기술만 다시 만들어주세요.');error.failedRows=[...bad];throw error;}
 }
 async function load(variant='fang',element='dragon',{allowFadeEmpty=false,readyRows}={}){
  const generated=/^generated:([a-f0-9]{64})$/.exec(variant);if(!Object.hasOwn(variants,variant)&&!generated)variant='fang';if(!root.Craft.Types.valid(element))element='dragon';
  readyRows=validateReadyRows(readyRows);const key=variant+':'+element+':'+allowFadeEmpty+':'+readyRows.join(',');if(cache.has(key))return cache.get(key);
  const ready=(async()=>{
   const image=new Image(),url=generated?'assets/vfx/generated/'+generated[1]+'.png':variants[variant];let objectUrl;
   // Free cloud servers can lose generated files on restart. Keep recently used
   // immutable atlases in this browser, under this game's origin only.
   if(generated&&root.caches&&root.fetch&&root.URL?.createObjectURL)try{
    const saved=await root.caches.open('draw-weapon-atlases-v1');let response=await saved.match(url);
    if(!response){response=await root.fetch(url);if(response.ok&&response.headers.get('content-type')?.includes('image/png')){await saved.put(url,response.clone());const keys=await saved.keys();for(const key of keys.slice(0,Math.max(0,keys.length-40)))await saved.delete(key);}}
    if(response?.ok){const blob=await response.blob();if(blob.size<=12*1024*1024)objectUrl=root.URL.createObjectURL(blob);}
   }catch{/* Browser storage is optional; normal rendering remains available. */}
   image.src=objectUrl||url;try{await image.decode();}finally{if(objectUrl)root.URL.revokeObjectURL(objectUrl);}
   const tile=96,canvas=document.createElement('canvas');canvas.width=canvas.height=tile*4;const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.imageSmoothingEnabled=false;
   for(let row=0;row<4;row++)for(let col=0;col<4;col++){
    const x=Math.round(col*image.naturalWidth/4),y=Math.round(row*image.naturalHeight/4),right=Math.round((col+1)*image.naturalWidth/4),bottom=Math.round((row+1)*image.naturalHeight/4);
    ctx.drawImage(image,x+2,y+2,right-x-4,bottom-y-4,col*tile,row*tile,tile,tile);
   }
   const pixels=ctx.getImageData(0,0,canvas.width,canvas.height);if(generated)clearWhiteMattes(pixels.data,tile);quantize(pixels.data,element,root.GamePalette,root.Craft.Types,!!generated);if(generated)clearWhiteMattes(pixels.data,tile);cleanEdges(pixels.data,tile);if(generated)assertFrames(pixels.data,tile,4,allowFadeEmpty,readyRows);ctx.putImageData(pixels,0,0);return{canvas,tile,variant,readyRows};
  })();cache.set(key,ready);try{return await ready;}catch(error){cache.delete(key);throw error;}
 }
 function drawFrame(ctx,atlas,row,col,x,y,size,{angle=0,alpha=1,flip=false}={}){
  if(!Number.isInteger(row)||row<0||row>3||atlas.readyRows&&!atlas.readyRows.includes(row)||!Number.isInteger(col)||col<0||col>3||alpha<=0)return;ctx.save();ctx.imageSmoothingEnabled=false;ctx.globalAlpha=alpha;ctx.translate(Math.round(x),Math.round(y));ctx.rotate(angle);if(flip)ctx.scale(-1,1);ctx.drawImage(atlas.canvas,col*atlas.tile,row*atlas.tile,atlas.tile,atlas.tile,-size/2,-size/2,size,size);ctx.restore();
 }
 function draw(ctx,atlas,row,progress,x,y,size,options={}){if(progress<0||progress>1)return;drawFrame(ctx,atlas,row,frame(progress),x,y,size,options);}
 const loadGenerated=(id,element,options)=>{if(!/^[a-f0-9]{64}$/.test(id))return Promise.reject(Error('연출 파일 정보 오류'));return load('generated:'+id,element,options);};
 const api={variants,frame,nearest,quantize,rectangularMattes,transparencyIssues,clearWhiteMattes,cleanEdges,validateReadyRows,assertFrames,load,loadGenerated,draw,drawFrame};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.BattleSpriteAtlas=api;
})(typeof window!=='undefined'?window:globalThis);
