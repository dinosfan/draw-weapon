Craft.captureDrawing = canvas => {
  // Flatten transparent ink onto white so the model sees the same drawing as the player.
  const image = document.createElement('canvas');
  image.width = canvas.width; image.height = canvas.height;
  const ctx = image.getContext('2d');
  ctx.fillStyle = GamePalette.tokens.surface; ctx.fillRect(0, 0, image.width, image.height);
  ctx.drawImage(canvas, 0, 0);
  return image.toDataURL('image/png');
};

let drawingAnalysisController;
Craft.cancelAnalysis=()=>drawingAnalysisController?.abort();
Craft.analyzeDrawing = async ({ canvas, description, rarity, onProgress=()=>{} }) => {
  if (location.protocol === 'file:') throw Error('그림 분석은 서버에서 사용할 수 있어. README의 실행 방법을 확인해 줘.');
  drawingAnalysisController?.abort();const controller=new AbortController();drawingAnalysisController=controller;
  const artwork=canvas.toDataURL('image/png'),image=Craft.captureDrawing(canvas);
  const started=Date.now(),progress=setInterval(()=>{const seconds=Math.floor((Date.now()-started)/1000);onProgress(seconds<90?'그림에서 기술 4개와 동작을 설계하고 있어… · '+seconds+'초':'AI 응답을 기다리거나 기술 구성을 보완하고 있어… · '+seconds+'초');},10000);
  try{let publicMode=false;try{publicMode=(await fetch('/api/public-info',{signal:AbortSignal.timeout(5000)})).ok;}catch{}
  const response = await fetch(publicMode?'/api/ai/analyze-jobs':'/api/ai/analyze', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ description, image,...(rarity?{rarity}:{}) }),
    signal: AbortSignal.any([controller.signal,AbortSignal.timeout(310000)])
  });
  let body = await Craft.Http.json(response);
  if (!response.ok) throw Error(body.error || '그림 분석에 실패했어. 잠시 후 다시 시도해 줘.');
  if(publicMode){const id=body.id;if(!/^[a-f0-9]{32}$/.test(id||''))throw Error('분석 작업 형식 오류');const deadline=Date.now()+320000;
   while(Date.now()<deadline){if(controller.signal.aborted)throw controller.signal.reason;try{const poll=await fetch('/api/ai/analyze-jobs/'+id,{signal:AbortSignal.any([controller.signal,AbortSignal.timeout(20000)])}),job=await Craft.Http.json(poll);if(!poll.ok)throw Error(job.error);if(job.status==='failed')throw Error(job.error);if(job.status==='done'){body={data:job.data};break;}}catch(error){if(controller.signal.aborted||!error.resumable&&!['TypeError','TimeoutError'].includes(error.name))throw error;onProgress('연결을 복구하고 있어 · 같은 그림 분석을 계속 확인 중');}await new Promise(r=>setTimeout(r,1500));}
   if(!body.data)throw Error('분석 시간이 오래 걸리고 있어. 그림은 그대로야.');
  }
  const weapon = Craft.normalizeWeapon(body.data);
  weapon.artwork = artwork;
  return weapon;
  }finally{clearInterval(progress);if(drawingAnalysisController===controller)drawingAnalysisController=null;}
};
