const {callAI:request}=require('./analyze.cjs');
const {validateCreative}=require('./weapon.cjs');

// A model's inconsistent move set is repaired internally, never blamed on the drawing.
async function callAI(endpoint,opts,fetchImpl,onUsage=()=>{}){
  const original=JSON.parse(opts.body);
  let repair='';
  const missing=new Set();
  let activeModel=original.model;
  const requestOptions={...opts,retryPolicy:{attemptTimeoutMs:90000,attempts:1}};
  const canFallback=()=>/^https:\/\/(?:generativelanguage.googleapis.com|factchat-cloud.mindlogic.ai)\//.test(endpoint)&&original.fallbackModel&&activeModel!==original.fallbackModel&&!opts.signal?.aborted;
  for(let attempt=0;attempt<3;attempt++){
    const body=structuredClone(original);
    body.model=activeModel;
    if(repair)body.messages[1].content+='\n'+repair;
    let response;
    try{response=await request(endpoint,{...requestOptions,body:JSON.stringify(body)},fetchImpl);}
    catch(error){if(!canFallback()||!['TimeoutError','TypeError'].includes(error.name))throw error;activeModel=original.fallbackModel;body.model=activeModel;response=await request(endpoint,{...requestOptions,body:JSON.stringify(body)},fetchImpl);}
    if([500,502,503,504].includes(response.status)&&canFallback()){activeModel=original.fallbackModel;body.model=activeModel;response=await request(endpoint,{...requestOptions,body:JSON.stringify(body)},fetchImpl);}
    if(!response.ok)return response;
    const data=await response.json();
    const raw=data.choices?.[0]?.message?.content;
    try{
      if(typeof raw!=='string')throw Error('API 응답 형식 오류');
      const parsed=require('./parse-json.cjs').parse(raw);
      if(Array.isArray(parsed.moves))for(const move of parsed.moves)if(typeof move.motionPlan==='string')move.motionPlan=require('./parse-json.cjs').parse(move.motionPlan);
      const result=validateCreative(parsed);
      if(original.motionPlans&&result.moves.some(move=>!move.motionPlan))throw Error('연출 설계도 누락');
      if(original.motionPlans&&result.moves.some(move=>move.motionPlan.layers.some(layer=>layer.source==='effect'&&!layer.glyph)))throw Error('연출 픽셀 소재 누락');
      return{ok:true,json:async()=>({...data,choices:[{message:{content:JSON.stringify(result)}}],modelUsed:body.model})};
    }catch(error){
      if(error.code==='WEAPON_ENGINE_CONFLICT'){
        onUsage(200,data.usage,body.model);
        if(attempt>=2)throw Error('무기의 기술 구성을 정리하지 못했어. 그림은 그대로 유지되어 있으니 다시 제작해 줘.');
        repair='이전 응답의 자원 engine과 기술 규칙이 모순된다: '+error.message+'. 그림이 부족한 것이 아니다. 일반 무기는 engine.mode=none으로 하고 자원 게이지를 강요하지 않는다. 원본 개념에 맞는 네 기술 이름과 정체성을 유지하며 해당 기술을 일반 공격/해당 개념의 보조 규칙으로 정리하라. 실제 자원 운용이 필요한 개념이라면 기존 기본 공격으로도 자원을 1칸 수급할 수 있으므로 축적 전용 기술이나 해방 슬롯을 억지로 추가하지 말고 실제 사용 가능한 소비 기술과 일관된 engine을 작성하라. 기술 역할 비율과 최소 종류 수는 없다. 완전한 JSON을 다시 반환하라.';continue;
      }
      if(error.code!=='CONCEPT_MOVE_CONFLICT'){
        if(!/^연출/.test(error.message)&&attempt<2&&(error instanceof SyntaxError||/형식|타입|누락/.test(error.message))){onUsage(200,data.usage,body.model);repair='이전 응답의 JSON 또는 허용값을 수정하라: '+error.message+'. 원본 그림의 정체성과 네 기술 구상을 유지하며 schema에 정의된 정확한 키와 enum으로 완전한 JSON을 다시 반환하라. 오류는 출력 형식 문제이며 그림을 거절하는 이유가 아니다.';continue;}
        if(!/^연출/.test(error.message)||attempt>=2)throw error;
        onUsage(200,data.usage,body.model);repair='이전 응답의 motionPlan 형식이 잘못됐다: '+error.message+'. 그림이나 기술 컨셉이 부족한 것이 아니다. 기존 네 기술의 이름·역할·그림 정체성을 유지하고 잘못된 연출 데이터만 수정하라. duration은700~4000, contact는0.25~0.85다. source=effect의 glyph는 .1234만 사용한12~16칸 행12~16개를 /로 구분한 문자열로 반드시 작성하라. 모든 기술에 유효한 motionPlan을 포함하고 각 레이어의2~6개 frames.t를 엄격한 오름차순으로 작성하라. 모든 키를 포함하고 범위와 crop 경계를 지켜 완전한 JSON을 다시 반환하라.';continue;
      }
      onUsage(200,data.usage,body.model);
      if(attempt===2)throw Error('기술 구성을 완성하지 못했습니다. 그림은 유지되어 있으니 다시 제작해 주세요.');
      error.missing.forEach(role=>missing.add(role));
      const roles=[...missing].map(key=>key==='healing'?'회복':'방어').join('·');
      repair=`이전 생성 결과에 ${roles} 근거는 없는데 해당 기술이 포함되는 모순이 있었다. 근거 없음은 정상이다. 해당 역할은 네 기술에서 모두 제외하고 원본 그림에 맞는 다른 기술로 새로 설계하라. 근거를 지어내지 마라. 방어와 회복이 모두 없어도 되며 공격 4개도 정상이다. 완전한 JSON을 다시 반환하라.`;
    }
  }
}
module.exports={callAI};
