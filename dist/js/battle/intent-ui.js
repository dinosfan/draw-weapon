BattlePreview.mountIntent=()=>{
 const target=document.getElementById('battle-intent');if(!target)return()=>{};
 // Enemy choices stay private until the enemy actually takes its turn.
 target.hidden=true;target.replaceChildren();
 return()=>{target.hidden=true;target.replaceChildren();};
};
