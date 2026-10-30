function create({provider,key,model,fetchImpl=fetch,onUsage}={}){
 if(provider==='chatkhu'){
  model=model||require('../baze.cjs').MODEL;
  return{model,local:false,configured:!!key,renderer:input=>require('../baze.cjs').evolution({...input,key,model,fetchImpl,onUsage})};
 }
 if(provider==='gemini'){
  model=model||require('../images/client.cjs').MODEL;
  const generateImage=async({prompt,reference,signal})=>{
   const response=await fetchImpl('https://generativelanguage.googleapis.com/v1beta/models/'+encodeURIComponent(model)+':generateContent',{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':key},body:JSON.stringify({contents:[{role:'user',parts:[{text:prompt},{inlineData:{mimeType:'image/png',data:reference.toString('base64')}}]}],generationConfig:{responseModalities:['IMAGE'],imageConfig:{aspectRatio:'1:1',imageSize:'1K'}}}),signal:signal?AbortSignal.any([signal,AbortSignal.timeout(180000)]):AbortSignal.timeout(180000)});
   let data;try{data=await response.json();}catch{const error=Error('진화 이미지 API 응답을 읽지 못했습니다.');error.status=502;throw error;}onUsage?.({model,status:response.status,usage:data.usageMetadata});
   if(!response.ok){const error=Error('진화 이미지 API 요청 실패 ('+response.status+') · 현재 무기는 유지됩니다.');error.status=response.status;throw error;}
   const image=data.candidates?.[0]?.content?.parts?.find(p=>p.inlineData?.mimeType==='image/png');if(!image)throw Error('진화 이미지 API가 PNG를 반환하지 않았습니다.');return Buffer.from(image.inlineData.data,'base64');
  };
  return{model,local:false,configured:!!key,renderer:input=>require('./api.cjs').render({...input,provider:'Gemini API',generateImage})};
 }
 if(provider==='local'){
  if(process.env.RENDER==='true')throw Error('공개 서버의 진화는 이미지 API를 사용해야 합니다.');
  return{model:require('../images/local/client.cjs').MODEL,local:true,configured:require('../images/local/client.cjs').available(),renderer:input=>require('./local.cjs').render(input)};
 }
 throw Error('지원하지 않는 진화 이미지 제공자입니다.');
}
module.exports={create};
