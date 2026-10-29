Craft.mountBattleRecovery=error=>{
 const main=document.querySelector('main');main.replaceChildren();
 const panel=document.createElement('section');panel.className='pixel-panel';panel.setAttribute('role','alert');
 const title=document.createElement('h1'),message=document.createElement('p'),retry=document.createElement('button'),library=document.createElement('a');
 title.textContent='원래 무기의 저장 기록을 확인해 줘';message.textContent=error.message;retry.textContent='같은 무기 다시 불러오기';retry.addEventListener('click',()=>location.reload());library.href='library.html';library.textContent='무기 진열장 열기';panel.append(title,message,retry,library);main.append(panel);
};
