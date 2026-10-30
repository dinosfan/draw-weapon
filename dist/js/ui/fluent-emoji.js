// Self-hosted Microsoft Fluent Emoji (Flat), MIT. Artwork is never recolored.
(function(root){
 const icons=root.FluentEmojiData||{},normalize=value=>String(value||'').replace(/[\uFE0E\uFE0F]/g,''),byCode=new Map(Object.entries(icons).map(([emoji,file])=>[normalize(emoji),file]));
 const base=new URL('../../assets/emoji/fluent/',document.currentScript.src),images=new Map();
 const emojiPattern=/\p{Extended_Pictographic}(?:[\uFE0E\uFE0F]|\p{Emoji_Modifier})*(?:\u200D\p{Extended_Pictographic}(?:[\uFE0E\uFE0F]|\p{Emoji_Modifier})*)*/gu;
 const excluded='script,style,textarea,input,select,option,canvas,noscript,[contenteditable]:not([contenteditable="false"]),[data-emoji-ignore]';
 function url(emoji){return new URL(byCode.get(normalize(emoji))||icons['✨'],base).href;}
 function image(emoji){const img=document.createElement('img');img.className='fluent-emoji-image';img.src=url(emoji);img.alt=emoji;img.draggable=false;img.decoding='async';return img;}
 function replace(node){
  if(!node.parentElement||node.parentElement.closest(excluded))return;
  const text=node.nodeValue,matches=[...text.matchAll(emojiPattern)];if(!matches.length)return;
  const content=document.createDocumentFragment();let cursor=0;
  for(const match of matches){if(match.index>cursor)content.append(document.createTextNode(text.slice(cursor,match.index)));content.append(image(match[0]));cursor=match.index+match[0].length;}
  if(cursor<text.length)content.append(document.createTextNode(text.slice(cursor)));node.replaceWith(content);
 }
 function render(target=document.body){
  if(!target)return;if(target.nodeType===Node.TEXT_NODE){replace(target);return;}
  if(target.nodeType!==Node.ELEMENT_NODE&&target.nodeType!==Node.DOCUMENT_FRAGMENT_NODE)return;
  if(target.nodeType===Node.ELEMENT_NODE&&target.closest(excluded))return;
  const walker=document.createTreeWalker(target,NodeFilter.SHOW_TEXT),text=[];let node;
  while((node=walker.nextNode()))text.push(node);text.forEach(replace);
 }
 function load(emoji){const src=url(emoji);if(!images.has(src))images.set(src,new Promise(resolve=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>{images.delete(src);resolve(null);};img.src=src;}));return images.get(src);}
 async function draw(ctx,emoji,x,y,width,height=width){const img=await load(emoji);if(!img)return false;ctx.drawImage(img,x,y,width,height);return true;}
 function boot(){
  render();
  const observer=new MutationObserver(records=>{const pending=new Set();for(const record of records){if(record.type==='characterData')pending.add(record.target);else for(const node of record.addedNodes)pending.add(node);}for(const node of pending)if(node.isConnected)render(node);});
  observer.observe(document.body,{childList:true,characterData:true,subtree:true});
 }
 root.FluentEmoji=Object.freeze({url,image,render,load,draw});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})(window);
