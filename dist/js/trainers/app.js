(() => {
  const ui=id=>document.getElementById(id);
  let selected=0,holding=true;
  const buttons=Trainers.roster.map((trainer,index)=>{
    const button=document.createElement('button');button.type='button';button.className='trainer-slot';button.setAttribute('aria-label',trainer.name+' 선택');
    const canvas=document.createElement('canvas');canvas.width=40;canvas.height=48;canvas.setAttribute('aria-hidden','true');
    const name=document.createElement('span');name.textContent=trainer.name;
    const number=document.createElement('small');number.textContent='0'+(index+1);
    button.append(number,canvas,name);Trainers.draw(canvas,trainer);
    button.addEventListener('click',()=>select(index));
    button.addEventListener('keydown',event=>{const offsets={ArrowRight:1,ArrowLeft:-1,ArrowDown:3,ArrowUp:-3};if(event.key in offsets){event.preventDefault();const next=(selected+offsets[event.key]+6)%6;select(next);buttons[next].focus();}});
    ui('trainer-roster').append(button);return button;
  });
  function select(index){
    selected=index;const trainer=Trainers.roster[index];
    buttons.forEach((button,i)=>{button.classList.toggle('selected',i===index);button.setAttribute('aria-pressed',String(i===index));});
    Trainers.draw(ui('hero-sprite'),trainer);
    ui('hero-sprite').setAttribute('aria-label',trainer.name+' 도트 트레이너');
    ui('trainer-name').textContent=trainer.name;ui('trainer-tag').textContent=trainer.tag;ui('trainer-look').textContent=trainer.look;
    ui('trainer-number').textContent='0'+(index+1)+' / 06';
    ui('trainer-dialogue').textContent=Trainers.withName(trainer.name)+' 함께 떠나볼까?\n무엇을 그리든, 이 손에 들 수 있어.';
    ui('selection-status').textContent='선택 목업 · 전투 적용 전';
  }
  ui('toggle-weapon').addEventListener('click',()=>{holding=!holding;ui('held-weapon').hidden=!holding;ui('toggle-weapon').setAttribute('aria-pressed',String(holding));ui('toggle-weapon').textContent=holding?'무기 내려놓기':'무기 들어보기';});
  ui('confirm-trainer').addEventListener('click',()=>{
    const trainer=Trainers.roster[selected];
    ui('selection-status').textContent=trainer.name+' 선택! 목업에 반영했어요.';
    ui('trainer-dialogue').textContent='좋아! '+Trainers.withName(trainer.name)+' 함께 떠나는 거야.\n이 모습으로 모험하는 건 어때?';
  });
  select(0);
  Trainers.mountWeapon(ui('held-weapon')).then(original=>{ui('weapon-note').textContent=original?'지금 만든 낙서를 그대로 손에 들고 있어요.':'제작한 무기가 없어 도트 검으로 미리 보고 있어요.';}).catch(()=>{ui('held-weapon').hidden=true;ui('weapon-note').textContent='원본 그림을 불러오지 못했어요. 트레이너 외형을 먼저 골라보세요.';});
})();
