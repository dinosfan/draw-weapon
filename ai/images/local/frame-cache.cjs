const fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto');
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
function key({model,drawing,subject,animation}){return digest(JSON.stringify({version:2,model,drawing:digest(drawing),subject,animation,width:512,height:512,steps:4,sampling:'euler',profile:'direct'}));}
function validPNG(bytes){return bytes.length>33&&bytes.subarray(0,8).toString('hex')==='89504e470d0a1a0a'&&bytes.readUInt32BE(16)===512&&bytes.readUInt32BE(20)===512;}
function create(root,namespace='effect-skill-frames'){if(!['effect-skill-frames','effect-subjects'].includes(namespace))throw Error('캐시 영역 형식 오류');const folder=path.join(root,'.local-ai/cache',namespace);
 function files(id){if(!/^[a-f0-9]{64}$/.test(id))throw Error('기술 캐시 형식 오류');return{png:path.join(folder,id+'.png'),meta:path.join(folder,id+'.json')};}
 function restore(id,target){try{const f=files(id),meta=JSON.parse(fs.readFileSync(f.meta,'utf8')),bytes=fs.readFileSync(f.png);if(!validPNG(bytes)||meta.checksum!==digest(bytes))return null;fs.writeFileSync(target,bytes);return meta;}catch{return null;}}
 function save(id,file,inspection){try{if(!inspection?.valid)return false;const bytes=fs.readFileSync(file);if(!validPNG(bytes))return false;const f=files(id);fs.mkdirSync(folder,{recursive:true});fs.writeFileSync(f.png,bytes);fs.writeFileSync(f.meta,JSON.stringify({checksum:digest(bytes),savedAt:Date.now()}));return true;}catch{return false;}}
 return{restore,save};
}
module.exports={create,key,validPNG};
