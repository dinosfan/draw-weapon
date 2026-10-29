// Settle every active task before callers clean up shared job files.
async function each(items,limit,task){
 let next=0,failure;const count=Math.max(1,Math.min(4,Math.floor(limit)||1));
 const workers=Array.from({length:Math.min(count,items.length)},async()=>{
  while(!failure&&next<items.length){const item=items[next++];try{await task(item);}catch(error){failure ||= error;}}
 });
 await Promise.all(workers);if(failure)throw failure;
}
module.exports={each};
