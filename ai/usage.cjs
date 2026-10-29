const fs=require('node:fs');
const path=require('node:path');
function normalizeUsage(meta){
  if(!meta||typeof meta!=='object')return null;
  const count=value=>Number.isSafeInteger(value)&&value>=0?value:null;
  const gemini=Object.hasOwn(meta,'promptTokenCount')||Object.hasOwn(meta,'totalTokenCount');
  return {
    input:count(gemini?meta.promptTokenCount:meta.prompt_tokens),
    output:count(gemini?meta.candidatesTokenCount:meta.completion_tokens),
    thinking:count(gemini?meta.thoughtsTokenCount:meta.completion_tokens_details?.reasoning_tokens),
    total:count(gemini?meta.totalTokenCount:meta.total_tokens)
  };
}
function recordUsage(record,file=process.env.AI_USAGE_LOG_FILE||path.join(__dirname,'../ai-usage.jsonl')){
  const safe={time:new Date().toISOString(),model:String(record.model).slice(0,100),status:record.status,usage:normalizeUsage(record.usage)};
  try{fs.appendFileSync(file,JSON.stringify(safe)+'\n');return true;}catch{return false;}
}
module.exports={normalizeUsage,recordUsage};
