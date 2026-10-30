const {callAI}=require('../analyze.cjs'),Plan=require('./plan.cjs'),{parse}=require('../parse-json.cjs');
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
 let data;try{data=await response.json();}catch(error){if(!(error instanceof SyntaxError))throw error;config.meter(200,null,model);if(attempt===2)throw Error('진화 방향 응답 형식을 정리하지 못했어. 현재 무기와 기술은 그대로야. 진화 준비를 다시 시도해 줘.',{cause:error});repair='\n이전 응답의 JSON이 잘렸거나 문법이 잘못됐다. 원본 그림과 기술 구상을 유지하고 스키마에 맞는 완전한 JSON만 반환하라.';continue;}
 config.meter(200,data.usage,model);try{return Plan.validate(parse(data.choices?.[0]?.message?.content),weapon);}catch(error){if(attempt===2)throw Error('진화 방향 응답 형식을 정리하지 못했어. 현재 무기와 기술은 그대로야. 진화 준비를 다시 시도해 줘.',{cause:error});repair='\n이전 출력의 '+error.message+'만 수정하고 원본 그림과 기술을 계승하라. 스키마에 맞는 완전한 JSON만 반환하라.';}
 }throw Error('진화 방향 생성 실패');}
module.exports={plan};
