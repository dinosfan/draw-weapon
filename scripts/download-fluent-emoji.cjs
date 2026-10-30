// Microsoft-authored Flat artwork, pinned to a reviewed upstream revision.
// Run only when updating vendored UI artwork. Runtime never uses an emoji CDN.
const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
const revision='1ffb34c752ecf5d402f04cfb4b392c77f57c54bc',root=path.join(__dirname,'..'),dir=path.join(root,'dist/assets/emoji/fluent');
const requested={
 '⚔️':'Crossed swords','🛡️':'Shield','🎒':'Backpack','📖':'Open book','🔄':'Counterclockwise arrows button','🏆':'Trophy','⚙️':'Gear','✏️':'Pencil','✨':'Sparkles','🌸':'Cherry blossom','🕒':'Three oclock','🚪':'Door','🕐':'One oclock','🪨':'Rock','⚡':'High voltage','☠️':'Skull and crossbones','🔥':'Fire','💤':'Zzz','❄️':'Snowflake','💫':'Dizzy','💥':'Collision','💨':'Dashing away','🩹':'Adhesive bandage','🧪':'Test tube','💧':'Droplet','✅':'Check mark button','🌿':'Herb','💣':'Bomb','▶️':'Play button','⬅️':'Left arrow','➡️':'Right arrow','📦':'Package'
};
async function fetchBytes(url){for(let attempt=0;attempt<3;attempt++){try{const r=await fetch(url,{headers:{'User-Agent':'draw-weapon-assets'},signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error('HTTP '+r.status+' '+url);return Buffer.from(await r.arrayBuffer());}catch(e){if(attempt===2)throw e;}}}
async function main(){
 await fs.mkdir(dir,{recursive:true});
 const tree=JSON.parse((await fetchBytes('https://api.github.com/repos/microsoft/fluentui-emoji/git/trees/'+revision+'?recursive=1')).toString());
 if(tree.sha!==revision||tree.truncated)throw Error('Unverified upstream asset tree');
 const upstream=p=>'https://raw.githubusercontent.com/microsoft/fluentui-emoji/'+revision+'/'+p.split('/').map(encodeURIComponent).join('/');
 const entries={};
 const pending=Object.entries(requested);
 await Promise.all(Array.from({length:6},async()=>{while(pending.length){const [emoji,name]=pending.shift(),prefix='assets/'+name+'/';
  const asset=tree.tree.find(a=>a.path.startsWith(prefix)&&/\/Flat\/[^/]+\.svg$/.test(a.path));
  if(!asset)throw Error('Missing official Flat asset '+name);
  const metadata=JSON.parse((await fetchBytes(upstream(prefix+'metadata.json'))).toString());
  const normalize=s=>s.replace(/[\uFE0F\uFE0E]/g,'');
  if(normalize(metadata.glyph)!==normalize(emoji))throw Error('Unicode mismatch '+name+' '+JSON.stringify(metadata));
  const bytes=await fetchBytes(upstream(asset.path)),file=path.basename(asset.path);
  if(!bytes.toString().includes('<svg'))throw Error('Invalid SVG '+file);
  await fs.writeFile(path.join(dir,file),bytes);
  entries[emoji]={file,name,source:asset.path,sha256:crypto.createHash('sha256').update(bytes).digest('hex')};
 }}));
 await fs.writeFile(path.join(dir,'LICENSE.txt'),await fetchBytes(upstream('LICENSE')));
 const manifest={provider:'Microsoft Fluent Emoji',style:'Flat',license:'MIT',copyright:'Copyright (c) Microsoft Corporation.',repository:'https://github.com/microsoft/fluentui-emoji',revision,icons:Object.fromEntries(Object.entries(entries).sort(([a],[b])=>a.localeCompare(b)))};
 await fs.writeFile(path.join(dir,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
 const map=Object.fromEntries(Object.entries(manifest.icons).map(([emoji,e])=>[emoji,e.file]));
 await fs.mkdir(path.join(root,'dist/js/ui'),{recursive:true});
 await fs.writeFile(path.join(root,'dist/js/ui/fluent-emoji-data.js'),'// Microsoft Fluent Emoji Flat, MIT. See assets/emoji/fluent/LICENSE.txt.\n(function(root){const icons='+JSON.stringify(map)+';if(typeof module!==\'undefined\'&&module.exports)module.exports=icons;else root.FluentEmojiData=icons;})(typeof window!==\'undefined\'?window:globalThis);\n');
 console.log(JSON.stringify({revision,icons:Object.keys(map).length,bytes:(await Promise.all(Object.values(entries).map(e=>fs.stat(path.join(dir,e.file))))).reduce((n,s)=>n+s.size,0)}));
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
