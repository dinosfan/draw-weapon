const {jsonrepair}=require('../vendor/jsonrepair/lib/cjs/index.js');
function parse(text){if(typeof text!=='string'||text.length>200000)throw Error('AI JSON 응답 형식 오류');const raw=text.replace(/^\s*```(?:json)?\s*/,'').replace(/\s*```\s*$/,'');let data;try{data=JSON.parse(raw);}catch{try{data=JSON.parse(jsonrepair(raw));}catch{throw new SyntaxError('AI JSON 문법 형식 오류');}}return data;}
module.exports={parse};
