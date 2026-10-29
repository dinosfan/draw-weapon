const fs=require('node:fs'),path=require('node:path');
function prepare({root=path.resolve(__dirname,'..'),data=process.env.DATA_DIR}={}){
 if(!data||!path.isAbsolute(data))throw Error('DATA_DIR must be an absolute persistent storage path');
 fs.mkdirSync(data,{recursive:true});
 const folders=[['dist/assets/vfx/generated','vfx-generated'],['dist/assets/evolutions','evolutions'],['.local-ai/cache','cache'],['.local-ai/evolution/cache','evolution-cache']];
 for(const[relative,name]of folders){const target=path.join(data,name),link=path.join(root,relative);fs.mkdirSync(target,{recursive:true});fs.mkdirSync(path.dirname(link),{recursive:true});
  if(fs.existsSync(link)){if(fs.lstatSync(link).isSymbolicLink()){if(fs.realpathSync(link)!==fs.realpathSync(target))throw Error('Storage link points elsewhere: '+relative);continue;}if(fs.readdirSync(link).length)throw Error('Refusing to replace existing generated artwork: '+relative);fs.rmdirSync(link);}
  fs.symlinkSync(target,link,process.platform==='win32'?'junction':'dir');
 }
 const probe=path.join(data,'.write-probe');fs.writeFileSync(probe,'ok');fs.unlinkSync(probe);
 return{feedbackFile:path.join(data,'playtest-feedback.jsonl'),usageFile:path.join(data,'ai-usage.jsonl'),work:path.join(data,'jobs')};
}
module.exports={prepare};
