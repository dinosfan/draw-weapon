(function(root){
 function describe(status){
  const labels={chatkhu:'ChatKHU 이미지 API',gemini:'Gemini 이미지 API',local:'로컬 GPU'};
  if(!labels[status.evolutionProvider])return null;
  return{label:'진화 분석·기술: '+(status.provider||'서버 API')+' · 외형 생성: '+labels[status.evolutionProvider]+' · 기술 도트: '+(labels[status.effectsProvider]||'서버 API'),detail:'분석 모델: '+(status.model||'확인 필요')+' · 외형 모델: '+(status.evolutionModel||'확인 필요')};
 }
 if(typeof module!=='undefined'&&module.exports){module.exports={describe};return;}
 async function mount(){const label=document.getElementById('evolution-provider-info');if(!label)return;try{const response=await fetch('/api/status',{signal:AbortSignal.timeout(8000)});if(!response.ok)return;const info=describe(await response.json());if(info){label.textContent=info.label;label.title=info.detail;}}catch{/* Keep the generic server connection label when offline. */}}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})(typeof window!=='undefined'?window:globalThis);
