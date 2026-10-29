const fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto');
function readyRows(rows){if(!Array.isArray(rows)||!rows.length||rows.length>4||new Set(rows).size!==rows.length||rows.some(r=>!Number.isInteger(r)||r<0||r>3))throw Error('완성된 도트 기술 위치 형식 오류');return[...rows].sort();}
function publish({root,owner,model,rarity,bytes,rows,elapsedMs}){
 rows=readyRows(rows);if(rows.length===4)return null;
 if(!Buffer.isBuffer(bytes)||bytes.length<33||bytes.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')throw Error('부분 도트 이미지 형식 오류');const width=bytes.readUInt32BE(16),height=bytes.readUInt32BE(20);if(width<512||width>4096||height!==width)throw Error('부분 도트 이미지 크기 오류');
 const id=createHash('sha256').update(owner).update(JSON.stringify(rows)).update(bytes).digest('hex'),meta={id,provider:'local',model,...(rarity?{rarity}:{}),width,height,elapsedMs,partial:true,local:{layout:'skill-2x2-v1',readyRows:rows,transparencyChecked:rows.length*4}};
 fs.mkdirSync(root,{recursive:true});fs.writeFileSync(path.join(root,id+'.png'),bytes);fs.writeFileSync(path.join(root,id+'.json'),JSON.stringify(meta));return meta;
}
module.exports={readyRows,publish};
