const {callAI}=require('../analyze.cjs'),Plan=require('./plan.cjs');
async function plan({weapon,drawing,...config}){let repair='',model=config.model;
 const timeout=AbortSignal.timeout(config.plannerTimeoutMs||300000),signal=config.signal?AbortSignal.any([config.signal,timeout]):timeout;
 for(let attempt=0;attempt<3;attempt++){
 const body={model,image:drawing,responseSchema:Plan.schema,messages:[{role:'system',content:Plan.prompt},{role:'user',content:JSON.stringify({weapon,evolutionStage:(weapon.evolution?.stage||0)+1})+repair}]};
 // Evolution planning runs as a background job. Give slow vision requests enough
 // time to finish instead of surfacing the browser's generic AbortError at 90s.
 const request=()=>callAI(config.endpoint,{method:'POST',headers:{Authorization:'Bearer '+config.key},body:JSON.stringify({...body,model}),signal,retryPolicy:{attemptTimeoutMs:90000,attempts:1}},config.fetchImpl);
 const canFallback=()=>config.fallbackModel&&model!==config.fallbackModel&&!signal.aborted;
 let response;try{response=await request();}catch(error){if(!canFallback()||!['TimeoutError','TypeError'].includes(error.name))throw error;model=config.fallbackModel;response=await request();}
 if([500,502,503,504].includes(response.status)&&canFallback()){model=config.fallbackModel;response=await request();}
 if(!response.ok){config.meter(response.status,null,model);const e=Error('진화 방향을 준비하지 못했습니다. 기존 무기는 유지됩니다. ('+response.status+')');e.status=response.status;throw e;}
 const data=await response.json();config.meter(200,data.usage,model);try{return Plan.validate(JSON.parse(data.choices?.[0]?.message?.content.replace(/^\s*```(?:json)?\s*/,'').replace(/\s*```\s*$/,'')),weapon);}catch(error){if(attempt===2)throw error;repair='\n이전 출력의 '+error.message+'만 수정하고 원본 그림과 기술을 계승하라.';}
 }throw Error('진화 방향 생성 실패');}
module.exports={plan};
