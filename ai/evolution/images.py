"""Prepare the real drawing for editing; preserve weapon highlights when removing chroma."""
import argparse,json,sys
from pathlib import Path
import numpy as np
from PIL import Image
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'images/local'))
from matte import rectangular_mattes
p=argparse.ArgumentParser();p.add_argument('mode',choices=['prepare','finish']);p.add_argument('input');p.add_argument('output');a=p.parse_args()
im=Image.open(a.input).convert('RGBA');data=np.array(im)
if a.mode=='prepare':
 mask=(data[:,:,3]>20)&(data[:,:,:3].min(2)<235);y,x=np.where(mask)
 if not len(x):raise ValueError('empty original')
 im=im.crop((int(x.min()),int(y.min()),int(x.max()+1),int(y.max()+1)));im.thumbnail((360,360),Image.Resampling.NEAREST);board=Image.new('RGBA',(512,512),(248,249,250,255));board.alpha_composite(im,((512-im.width)//2,(512-im.height)//2));board.convert('RGB').save(a.output)
else:
 rgb=data[:,:,:3].astype(float);green=(rgb[:,:,1]>70)&(rgb[:,:,1]>rgb[:,:,0]*1.25)&(rgb[:,:,1]>rgb[:,:,2]*1.25);data[green,3]=0;mask=data[:,:,3]>=96
 coverage=float(mask.mean());edge=int(mask[:4,:].sum()+mask[-4:,:].sum()+mask[:,:4].sum()+mask[:,-4:].sum())
 _,issues=rectangular_mattes(Image.fromarray(data).resize((96,96),Image.Resampling.NEAREST))
 if coverage<.01 or coverage>.65 or edge>8 or issues:raise ValueError('evolution artwork has empty/clipped/unseparated background')
 im=Image.fromarray(data);im=im.crop(im.getbbox());im.thumbnail((112,112),Image.Resampling.NEAREST);board=Image.new('RGBA',(128,128));board.alpha_composite(im,((128-im.width)//2,(128-im.height)//2));board.save(a.output)
 print(json.dumps({'transparent':True,'coverage':coverage,'edge':edge}))
