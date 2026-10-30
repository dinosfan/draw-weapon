// API generation plus server-side CPU image preparation. No GPU runner, model
// installation, resident process or local GPU queue is involved in this path.
const fs=require('node:fs'),path=require('node:path'),{run}=require('../images/local/process.cjs');
const {each}=require('../images/local/concurrent.cjs'),{prompt}=require('./art-prompt.cjs');
async function render({weapon,drawing,options,id,assets,onProgress=()=>{},signal,generateImage,runCommand=run,provider='이미지 API',workRoot,python}){
 const check=()=>signal?.throwIfAborted();check();
 if(typeof generateImage!=='function')throw Error('진화 이미지 API 연결이 없습니다.');
 if(!/^[a-f0-9]{64}$/.test(id)||!Array.isArray(options)||options.length!==2)throw Error('진화 외형 입력 형식 오류');
 const root=path.resolve(__dirname,'../..'),work=workRoot||process.env.AI_WORK_DIR||path.join(root,'.local-ai/jobs');
 python=python||process.env.PYTHON_BIN||(process.platform==='win32'?path.join(root,'.local-ai/venv/Scripts/python.exe'):'python3');
 fs.mkdirSync(work,{recursive:true});const folder=fs.mkdtempSync(path.join(work,'evolution-api-')),helper=path.join(__dirname,'images.py');
 const processImage=async(mode,input,output)=>{check();try{await runCommand(python,[helper,mode,input,output],{timeout:30000,signal});}catch(error){check();const failure=Error(mode==='finish'?'진화 외형의 투명 배경 검사를 완료하지 못했어. 현재 무기는 그대로야.':'서버에서 원본 그림을 준비하지 못했어. 현재 무기는 그대로야.');failure.status=error.status||502;throw failure;}check();};
 try{
  const original=path.join(folder,'original.png'),reference=path.join(folder,'reference.png');fs.writeFileSync(original,Buffer.from(drawing,'base64'));await processImage('prepare',original,reference);const referenceBytes=fs.readFileSync(reference);
  await each([0,1],2,async index=>{
   for(let attempt=0;attempt<2;attempt++){
    check();onProgress({phase:'drawing',message:(index+1)+'/2 · '+options[index].name+'의 진화 외형을 '+provider+'로 만들고 있어…'+(attempt?' 배경 보완 중':'')});
    const bytes=await generateImage({prompt:prompt(weapon,options[index],attempt>0),reference:referenceBytes,signal});check();
    if(!Buffer.isBuffer(bytes)||bytes.length<33||bytes.length>12*1024*1024||bytes.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')throw Error('진화 이미지 API 응답 형식 오류');
    const width=bytes.readUInt32BE(16),height=bytes.readUInt32BE(20);if(width<512||width>4096||height!==width)throw Error('진화 이미지 API 크기 형식 오류');
    const raw=path.join(folder,index+'-raw.png'),finished=path.join(folder,index+'-finished.png');fs.writeFileSync(raw,bytes);
    try{await processImage('finish',raw,finished);break;}catch(error){check();if(attempt||![502,504].includes(error.status))throw error;}
   }
  });
  check();fs.mkdirSync(assets,{recursive:true});
  return options.map((_,index)=>{const file=path.join(assets,id+'-'+index+'.png');fs.copyFileSync(path.join(folder,index+'-finished.png'),file);return{file,image:'assets/evolutions/'+id+'-'+index+'.png'};});
 }finally{for(const entry of fs.readdirSync(folder,{withFileTypes:true})){if(entry.isFile())fs.unlinkSync(path.join(folder,entry.name));}fs.rmdirSync(folder);}
}
module.exports={render};
