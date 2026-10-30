"""Per-skill local image preparation, validation and deterministic atlas packing."""
import argparse,json,base64
from pathlib import Path
from PIL import Image,ImageDraw
from matte import clear_white_mattes, transparency_issues
import numpy as np
from frame_extract import extract_frames
p=argparse.ArgumentParser();p.add_argument('mode',choices=['prepare','guide','glyph-guide','sheet-guide','sheet-split','inherit','inspect','pack']);p.add_argument('folder');p.add_argument('--style');p.add_argument('--index',type=int);p.add_argument('--image');p.add_argument('--rows',default='0,1,2,3');a=p.parse_args();folder=Path(a.folder)
def cut(image):
 data=np.array(image.convert('RGBA'));r=data[:,:,:3].astype(float);green=(r[:,:,1]>70)&(r[:,:,1]>r[:,:,0]*1.25)&(r[:,:,1]>r[:,:,2]*1.25);data[green,3]=0;return Image.fromarray(data)
def clean(tile):
 data=np.array(tile);mask=data[:,:,3]>=96;seen=np.zeros((96,96),bool)
 for y in range(96):
  for x in range(96):
   if seen[y,x] or not mask[y,x]:continue
   todo=[(x,y)];seen[y,x]=True;component=[]
   while todo:
    cx,cy=todo.pop();component.append((cx,cy))
    for dy in [-1,0,1]:
     for dx in [-1,0,1]:
      nx,ny=cx+dx,cy+dy
      if 0<=nx<96 and 0<=ny<96 and mask[ny,nx] and not seen[ny,nx]:seen[ny,nx]=True;todo.append((nx,ny))
   if len(component)<=2:
    for cx,cy in component:data[cy,cx,3]=0
 return Image.fromarray(data)
if a.mode=='prepare':
 im=Image.open(a.style).convert('RGBA');im.thumbnail((64,64),Image.Resampling.NEAREST);im=im.resize((im.width*6,im.height*6),Image.Resampling.NEAREST);bg=Image.new('RGBA',(512,512),(0,255,0,255));bg.alpha_composite(im,((512-im.width)//2,(512-im.height)//2));bg.convert('RGB').save(folder/'style-ref.png');print('{}')
elif a.mode=='guide':
 im=clear_white_mattes(cut(Image.open(a.image)));box=im.getbbox()
 if not box:raise ValueError('empty subject')
 im=im.crop(box);im.thumbnail((164,164),Image.Resampling.NEAREST);board=Image.new('RGBA',(512,512),(0,255,0,255))
 for y in range(2):
  for x in range(2):board.alpha_composite(im,(x*256+(256-im.width)//2,y*256+(256-im.height)//2))
 board.convert('RGB').save(folder/f'{a.index}-guide.png');print('{}')
elif a.mode=='glyph-guide':
 spec=json.loads((folder/f'{a.index}-glyph.json').read_text(encoding='utf-8'));rows=spec['glyph'].split('/');colors=spec['colors'];sprite=Image.new('RGBA',(len(rows[0]),len(rows)));pix=sprite.load()
 for y,row in enumerate(rows):
  for x,value in enumerate(row):
   if value in '1234':pix[x,y]=tuple(colors[int(value)-1])+ (255,)
 scale=164/max(sprite.size);sprite=sprite.resize((max(1,round(sprite.width*scale)),max(1,round(sprite.height*scale))),Image.Resampling.NEAREST);board=Image.new('RGBA',(512,512),(0,255,0,255))
 for y in range(2):
  for x in range(2):board.alpha_composite(sprite,(x*256+(256-sprite.width)//2,y*256+(256-sprite.height)//2))
 board.convert('RGB').save(folder/f'{a.index}-guide.png');print('{}')
elif a.mode=='sheet-guide':
 board=Image.new('RGBA',(1024,1024),(0,255,0,255))
 for row in range(4):
  if not (folder/f'{row}-guide.png').exists():continue
  guide=Image.open(folder/f'{row}-guide.png').convert('RGBA').crop((0,0,256,256))
  for col in range(4):board.paste(guide,(col*256,row*256))
 board.save(folder/'sheet-guide.png');print('{}')
elif a.mode=='sheet-split':
 im=Image.open(a.image).convert('RGBA');w,h=im.size
 if w!=h or w<1024 or w>4096:raise ValueError('invalid four-skill sheet size')
 for row in range(4):
  board=Image.new('RGBA',(512,512))
  for col in range(4):
   tile=im.crop((col*w//4,row*h//4,(col+1)*w//4,(row+1)*h//4)).resize((256,256),Image.Resampling.NEAREST)
   board.paste(tile,((col%2)*256,(col//2)*256))
  board.save(folder/f'{row}-sheet.png')
 print('{}')
elif a.mode=='inherit':
 im=Image.open(a.image).convert('RGBA');pixels=[];coverage=[]
 for col in range(4):
  x=col*im.width//4;y=a.index*im.height//4;tile=im.crop((x+2,y+2,x+im.width//4-2,y+im.height//4-2)).resize((96,96),Image.Resampling.NEAREST);tile.save(folder/f'{a.index}-frame-{col}.png');pixels.append(tile.tobytes());coverage.append(round(float((np.array(tile)[:,:,3]>=96).mean()),4))
 print(json.dumps({'valid':True,'coverage':coverage,'transparencyChecked':4,'pixels':base64.b64encode(b''.join(pixels)).decode()}))
elif a.mode=='inspect':
 im=Image.open(a.image).convert('RGBA');issues=[];coverage=[];pixels=[]
 frames,source_edges=extract_frames(im)
 for i in range(4):
  tile=clean(frames[i]);data=np.array(tile);m=data[:,:,3]>=96;amount=float(m.mean());edge=int(m[:2,:].sum()+m[-2:,:].sum()+m[:,:2].sum()+m[:,-2:].sum());coverage.append(round(amount,4))
  matte_issues=transparency_issues(tile)
  if (i<3 and amount<.005) or amount>.85 or edge>8 or matte_issues:issues.append({'frame':i,'coverage':round(amount,4),'edge':edge,'matte':matte_issues})
  tile.save(folder/f'{a.index}-frame-{i}.png');pixels.append(tile.tobytes())
 print(json.dumps({'valid':not issues and max(source_edges)<=8,'sourceClipped':max(source_edges)>8,'sourceEdges':source_edges,'issues':issues,'coverage':coverage,'transparencyChecked':4,'pixels':base64.b64encode(b''.join(pixels)).decode()}))
else:
 rows=[int(value) for value in a.rows.split(',')]
 if not rows or len(set(rows))!=len(rows) or any(row<0 or row>3 for row in rows):raise ValueError('invalid prepared rows')
 atlas=Image.new('RGBA',(784,784))
 for row in rows:
  for col in range(4):
   tile=Image.open(folder/f'{row}-frame-{col}.png').convert('RGBA')
   issues=transparency_issues(tile)
   if issues:raise ValueError(f'residual matte in skill {row+1}, frame {col+1}')
   atlas.alpha_composite(tile.resize((192,192),Image.Resampling.NEAREST),(col*196+2,row*196+2))
 atlas.save(folder/'atlas.png');print('{}')
