// One native model at a time. Interactive evolution may run between completed VFX skills.
const pending=[];let active=false,sequence=0;
function drain(){if(active||!pending.length)return;pending.sort((a,b)=>b.priority-a.priority||a.sequence-b.sequence);const item=pending.shift();active=true;Promise.resolve().then(item.task).then(item.resolve,item.reject).finally(()=>{active=false;drain();});}
function exclusive(task,{priority=0,onStart}={}){
 if(typeof task!=='function')return Promise.reject(TypeError('GPU 작업 형식 오류'));
 const queuedAt=Date.now();return new Promise((resolve,reject)=>{pending.push({task:()=>{onStart?.({queuedMs:Date.now()-queuedAt});return task();},priority:Number.isFinite(priority)?Math.max(0,Math.min(10,priority)):0,sequence:sequence++,resolve,reject});drain();});
}
const snapshot=()=>({active,waiting:pending.length});
module.exports={exclusive,snapshot};
