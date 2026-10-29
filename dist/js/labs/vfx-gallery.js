(async()=>{
 const entries=await Promise.all(['fang','storm'].map(async variant=>{const atlas=await BattleSpriteAtlas.load(variant,'dragon'),canvas=document.getElementById('gallery-'+variant);return{atlas,canvas,ctx:canvas.getContext('2d')};}));
 let raf=0,start;
 function paint(now){if(start===undefined)start=now;const q=(now-start)%1000/1000;for(const{atlas,canvas,ctx}of entries){ctx.clearRect(0,0,canvas.width,canvas.height);BattleSpriteAtlas.draw(ctx,atlas,2,q,canvas.width/2,canvas.height/2,190);}if(!document.hidden)raf=requestAnimationFrame(paint);}
 document.addEventListener('visibilitychange',()=>{cancelAnimationFrame(raf);if(!document.hidden)raf=requestAnimationFrame(paint);});raf=requestAnimationFrame(paint);
})().catch(error=>{document.getElementById('gallery-status').textContent='이미지를 불러오지 못했습니다. 공방 서버에서 다시 열어주세요.';console.error(error);});
