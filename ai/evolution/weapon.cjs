const {callAI}=require('../generate.cjs'),{prompt}=require('../weapon.cjs'),{merge}=require('./merge.cjs'),{parse}=require('../parse-json.cjs');
async function evolve({weapon,option,drawing,...config}){let repair='';for(let attempt=0;attempt<3;attempt++){
 const instructions='이번 입력은 선택한 진화형의 새 외형이다. 다음 진화 계획대로 기존 네 기술 중 changes에 명시된 위치만 교체한다. 다른 위치는 정확히 계승한다. 기존 자원 engine을 유지하고 새 보편 축적/방어/회복 슬롯을 만들지 않는다. 새 그림의 실제 그립/끝점을 분석해 rig를 작성한다. 원본 개념의 증거와 네 기술의 고유 소재/동작을 유지한다. 완전한 무기 JSON을 반환한다.';
 const timeout=AbortSignal.timeout(config.evolutionTimeoutMs||300000),signal=config.signal?AbortSignal.any([config.signal,timeout]):timeout;
 const response=await callAI(config.endpoint,{method:'POST',headers:{Authorization:'Bearer '+config.key},body:JSON.stringify({model:config.model,fallbackModel:config.fallbackModel,motionPlans:true,image:drawing,messages:[{role:'system',content:prompt},{role:'user',content:instructions+'\n'+JSON.stringify({previous:weapon,selected:option})+repair}]}),signal},config.fetchImpl,config.meter);
 if(!response.ok){config.meter(response.status,null,config.model);throw Error('진화 전용 기술을 완성하지 못했습니다. 기존 무기는 유지됩니다. ('+response.status+')');}
 const data=await response.json();config.meter(200,data.usage,data.modelUsed||config.model);
 try{return merge(weapon,option,parse(data.choices?.[0]?.message?.content));}catch(error){if(attempt===2)throw Error('진화 기술 응답 형식을 정리하지 못했어. 현재 무기와 기술은 그대로야. 선택한 진화 준비를 다시 시도해 줘.',{cause:error});repair='\n계승 기술을 합친 뒤 오류: '+error.message+'. 선택 계획을 지키며 모순을 수정하라.';}
 }throw Error('진화 기술 완성 실패');}
module.exports={evolve};
