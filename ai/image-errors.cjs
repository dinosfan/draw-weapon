// Gateway HTTP 400 also wraps upstream empty image responses. It is not enough
// evidence to label the drawing invalid, assume a policy violation or blame credit.
function classify(status,data){
 const message=typeof data?.detail?.message==='string'?data.detail.message:JSON.stringify(data);
 const upstreamCode=data?.detail?.code;
 const blocked=/safety|content.?filter|blocked|policy|prohibited|invalid.?api|permission|credit|quota|validation|invalid.?parameter|input.?image|unsupported.?parameter/i.test(JSON.stringify(data));
 const empty=status===400&&!blocked&&/no response parts returned from google api/i.test(message);
 const code=status===402?'IMAGE_CREDIT_EXHAUSTED':status===401?'IMAGE_AUTH_FAILED':status===403?'IMAGE_PERMISSION_DENIED':empty?'IMAGE_PROVIDER_EMPTY':blocked?'IMAGE_REQUEST_REJECTED':'IMAGE_PROVIDER_FAILED';
 const detail=status===402?'크레딧이 부족해. 크레딧을 보충한 뒤 다시 만들 수 있어.':status===401?'API 키를 확인해 줘.':status===403?'모델 사용 권한을 확인해 줘.':empty?'이미지 공급자가 결과 이미지를 반환하지 않았어. 공급자가 상세 원인을 알려주지 않았어.':blocked?'이미지 요청이 거절됐어. 원인을 확인해야 해.':'Nano Banana 응답을 완료하지 못했어.';
 return{code,upstreamCode,blocked,message:'ChatKHU 이미지 생성 실패 ('+status+(empty&&upstreamCode?' / '+upstreamCode:'')+') · '+detail+' 무기와 완성된 도트는 보존돼.'};
}
module.exports={classify};
