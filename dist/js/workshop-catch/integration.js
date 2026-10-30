(function(root){
 const embedded=new URLSearchParams(location.search).get('embedded')==='1'&&parent!==root;if(!embedded)return;
 document.body.classList.add('catch-embedded');let score=null,claimed=false;
 const $=id=>document.getElementById(id),send=type=>parent.postMessage({type,score},location.origin);
 document.querySelectorAll('.app-nav,.mock-caption,.catch-footer>span:last-child').forEach(node=>node.hidden=true);const note=document.querySelector('.catch-bag-note');note.textContent='한 판에 최대 3개. 모은 아이템은 전투 가방으로 가져가.';document.querySelector('.catch-result h3').textContent='이번 전투에 가져갈 아이템';
 const action=$('catch-again');action.textContent='가방 챙기고 전투 준비';document.querySelector('.catch-result-actions a').hidden=true;
 root.addEventListener('workshop-catch:finished',event=>{score=event.detail.score;claimed=false;action.disabled=true;action.textContent='가방에 챙기는 중…';send('workshop-catch:finish');});
 action.addEventListener('click',()=>{if(claimed)send('workshop-catch:continue');else if(score!==null){action.disabled=true;send('workshop-catch:finish');}});
 root.addEventListener('message',event=>{if(event.source!==parent||event.origin!==location.origin)return;if(event.data?.type==='workshop-catch:claimed'){claimed=true;action.disabled=false;action.textContent='가방 챙기고 전투 준비';$('catch-best').textContent='보상이 가방에 들어갔어. 이제 무기와 함께 출발하자!';}else if(event.data?.type==='workshop-catch:error'){action.disabled=false;action.textContent='가방 저장 다시 시도';$('catch-best').textContent=event.data.message;}});
 root.WorkshopCatchIntegration={embedded:true};
})(window);
