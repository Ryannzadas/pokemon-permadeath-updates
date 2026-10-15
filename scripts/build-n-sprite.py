"""Extract N's walking sprites from the user-provided RHcks GBA sheet."""
from PIL import Image
from pathlib import Path
import argparse,json,numpy as np
root=Path(__file__).resolve().parents[1];p=argparse.ArgumentParser();p.add_argument('source');raw=Image.open(p.parse_args().source).convert('RGBA')
def cut(box):
 im=raw.crop(box);a=np.array(im)
 for c in [(115,197,164),(56,53,85)]:a[np.all(a[:,:,:3]==c,axis=2),3]=0
 im=Image.fromarray(a);b=im.getbbox();assert b,box;return im.crop(b)
atlas=Image.new('RGBA',(128,192))
# Down, up, left, right: first three walking poses of each row.
for row,y in enumerate([209,246,278,312]):
 for col,sx in enumerate([0,1,2,1]):
  im=cut((2+sx*32,y,2+(sx+1)*32,y+29));im=im.resize((round(im.width*28/im.height),28),Image.Resampling.NEAREST)
  atlas.alpha_composite(im,(col*32+(32-im.width)//2,row*48+46-im.height))
out=root/'game/assets/camp';atlas.save(out/'trainers/n.png');cut((33,58,97,124)).save(out/'portraits/n.png')
p=root/'game/camp/assets.js';d=json.loads(p.read_text().split('=',1)[1].rstrip(';\n'));d['trainers']=[t for t in d['trainers'] if t['id']!='n']+[{'id':'n','name':'N','portrait':'assets/camp/portraits/n.png','sheet':'assets/camp/trainers/n.png'}];p.write_text('window.CAMP_ASSETS='+json.dumps(d,ensure_ascii=False,separators=(',',':'))+';\n')
