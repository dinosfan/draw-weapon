const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.join(__dirname,'../dist'),icons=require('../dist/js/ui/fluent-emoji-data.js'),{serveStatic}=require('../static.cjs');
const normalized=s=>s.replace(/[\uFE0E\uFE0F]/g,''),known=new Set(Object.keys(icons).map(normalized));
function files(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(dir,e.name)):[path.join(dir,e.name)]);}
test('every current UI emoji has verified local Microsoft artwork, without relying on a font CDN',()=>{
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/emoji/fluent/manifest.json'),'utf8'));
 assert.equal(manifest.license,'MIT');assert.equal(Object.keys(manifest.icons).length,32);
 for(const [emoji,entry]of Object.entries(manifest.icons)){
  const data=fs.readFileSync(path.join(root,'assets/emoji/fluent',entry.file));
  assert.equal(icons[emoji],entry.file);assert.equal(crypto.createHash('sha256').update(data).digest('hex'),entry.sha256);assert.match(data.toString(),/<svg/);
 }
 assert.match(fs.readFileSync(path.join(root,'assets/emoji/fluent/LICENSE.txt'),'utf8'),/Copyright \(c\) Microsoft Corporation/);
 for(const file of files(root).filter(f=>/\.(html|css|js)$/.test(f))){
  const source=fs.readFileSync(file,'utf8');assert.doesNotMatch(source,/tossface/i,path.relative(root,file));
  if(/\.(html|js)$/.test(file))for(const match of source.matchAll(/\p{Extended_Pictographic}(?:[\uFE0F\uFE0E])?/gu))assert.ok(known.has(normalized(match[0])),'Unbundled UI emoji '+match[0]+' in '+file);
  if(file.endsWith('.html')){assert.ok(source.includes('css/fonts.css'),file);assert.ok(source.indexOf('js/ui/fluent-emoji-data.js')<source.indexOf('js/ui/fluent-emoji.js'),file);assert.ok(source.includes('js/ui/fluent-emoji.js'),file);}
 }
});
test('public and local static servers actually serve SVG artwork and its MIT notice',()=>{
 for(const [file,type]of [[icons['⚔️'],'image/svg+xml'],['LICENSE.txt','text/plain; charset=utf-8']]){
  const response={writeHead(status,headers){this.status=status;this.headers=headers;},end(body){this.body=body;}};
  assert.equal(serveStatic({method:'GET',url:'/assets/emoji/fluent/'+file},response),true);
  assert.equal(response.status,200);assert.equal(response.headers['Content-Type'],type);assert.ok(response.body.length>0);
 }
});
