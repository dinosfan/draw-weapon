const { fetchRetry } = require('../retry.cjs');
const MAX_IMAGE_BYTES = 1024 * 1024;

function validateInput(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw Error('입력 형식 오류');
  const description = input.description ?? '';
  if (typeof description !== 'string' || description.length > 150) throw Error('설명 입력 형식 오류');
  let image;
  if (input.image !== undefined) {
    if (typeof input.image !== 'string' || input.image.length > 1400000) throw Error('이미지 용량 초과');
    const match = /^data:image\/png;base64,([A-Za-z0-9+/]+={0,2})$/.exec(input.image);
    if (!match || match[1].length % 4) throw Error('PNG 이미지 형식 오류');
    const bytes = Buffer.from(match[1], 'base64');
    if (bytes.length > MAX_IMAGE_BYTES) throw Error('이미지 용량 초과');
    if (bytes.length < 33 || bytes.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a' || bytes.toString('ascii', 12, 16) !== 'IHDR') throw Error('PNG 이미지 형식 오류');
    const width = bytes.readUInt32BE(16), height = bytes.readUInt32BE(20);
    if (!width || !height || width > 1400 || height > 1400) throw Error('이미지 크기 형식 오류');
    image = match[1];
  }
  if (!image && !description.trim()) throw Error('그림 또는 설명 입력이 필요합니다');
  if(input.rarity!==undefined&&!require('../dist/js/weapons/rarity.js').valid(input.rarity))throw Error('등급 입력 형식 오류');
  return { description: description.trim(), image,...(input.rarity?{rarity:input.rarity}:{}) };
}

function geminiBody(body) {
  const parts = [{ text: body.messages[1].content }];
  if (body.image) parts.push({ inlineData: { mimeType: 'image/png', data: body.image } });
  for(const image of body.additionalImages||[])parts.push({inlineData:{mimeType:'image/png',data:image}});
  return {
    systemInstruction: { parts: [{ text: body.messages[0].content }] },
    contents: [{ role: 'user', parts }],
    generationConfig: { responseMimeType: 'application/json', responseJsonSchema: body.responseSchema||require('./schema.cjs'), maxOutputTokens:body.max_tokens||8192 }
  };
}

async function callAI(endpoint, opts, fetchImpl = fetch) {
  const {retryPolicy,...requestOptions}=opts;
  const body = JSON.parse(opts.body);
  if (!endpoint.startsWith('https://generativelanguage.googleapis.com/')) {
    delete body.motionPlans;
    delete body.fallbackModel;
    const schema=body.responseSchema||require('./schema.cjs');delete body.responseSchema;
    if(endpoint.startsWith('https://factchat-cloud.mindlogic.ai/')){body.response_format={type:'json_object'};body.messages[0].content+='\nReturn only JSON matching this schema exactly. Type IDs and enums must use these exact allowed values: '+JSON.stringify(schema);body.max_tokens=16384;}
    if (body.image) {
      body.messages[1].content = [{ type: 'text', text: body.messages[1].content }, { type: 'image_url', image_url: { url: 'data:image/png;base64,' + body.image } }];
      for(const image of body.additionalImages||[])body.messages[1].content.push({type:'image_url',image_url:{url:'data:image/png;base64,'+image}});
    }
    delete body.image;
    delete body.additionalImages;
    if(endpoint.startsWith('https://factchat-cloud.mindlogic.ai/'))return fetchRetry(endpoint,{...requestOptions,body:JSON.stringify(body)},{...retryPolicy,fetchImpl});
    return fetchImpl(endpoint, { ...requestOptions, body: JSON.stringify(body) });
  }
  const response = await fetchRetry('https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(body.model) + ':generateContent', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': opts.headers.Authorization.slice(7) },
    body: JSON.stringify(geminiBody(body)), signal: opts.signal
  }, { ...retryPolicy, fetchImpl });
  if (!response.ok) return response;
  const data = await response.json();
  return { ok: true, json: async () => ({ usage: data.usageMetadata, choices: [{ message: { content: data.candidates?.[0]?.content?.parts?.filter(p => !p.thought).map(p => p.text || '').join('') } }] }) };
}
module.exports = { validateInput, geminiBody, callAI };
