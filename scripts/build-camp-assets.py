"""Extract user-supplied sprite sheets; requires Pillow, numpy and scipy.
Run: python scripts/build-camp-assets.py --source /path/to/original/sheets
The generated game assets are already included; this is not needed to play.
"""
import argparse, json, shutil
from pathlib import Path
from collections import Counter
from PIL import Image, ImageDraw
import numpy as np
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--source', required=True)
SRC = Path(parser.parse_args().source)
OUT = ROOT / 'game/assets/camp'
for sub in ['portraits', 'trainers', 'pokemon']:
    (OUT/sub).mkdir(parents=True, exist_ok=True)

def transparent(im, bg=None):
    a = np.array(im.convert('RGBA'))
    if bg is None and np.all(a[:,:,3] == 255):
        bg = Counter(map(tuple, a[:,:,:3].reshape(-1,3))).most_common(1)[0][0]
    if bg is not None:
        mask = np.all(a[:,:,:3] == bg, axis=2)
        a[mask,3] = 0
    return Image.fromarray(a)

def fit(im):
    box = im.getbbox()
    if not box:
        raise ValueError('Empty sprite')
    im = im.crop(box)
    if im.width > 30 or im.height > 44:
        factor = min(30/im.width,44/im.height)
        im = im.resize((round(im.width*factor),round(im.height*factor)),Image.Resampling.NEAREST)
    frame=Image.new('RGBA',(32,48))
    frame.alpha_composite(im,((32-im.width)//2,46-im.height))
    return frame

trainers = []
defs = [
 ('ethan','Ethan','Spr_HGSS_Ethan.png','pokemon_hgss_eathan_overworld_sprite_by_zender1752_df3ut04.png',0,0,25,30,3,[1,0,2,3]),
 ('red','Red','Spr_FRLG_Red.png','Game Boy Advance - Pokemon FireRed _ LeafGreen - Playable Characters - Player Sprites.png',8,42,17,33,3,[0,1,2,3]),
 ('brendan','Brendan','Spr_RS_Brendan.png','Game Boy Advance - Pokemon Emerald - Playable Characters - Brendan.png',0,0,16,24,3,[0,1,2,3]),
 ('hilda','Hilda','Spr_BW_Hilda.png','DS _ DSi - Pokemon Black _ White - Friendly Characters - Hero (M_F) Overworld.png',4,148,32,32,3,[0,1,2,3]),
 ('lucas','Lucas','Spr_DP_Lucas.png','DS _ DSi - Pokemon Platinum - Playable Characters - Lucas.png',0,0,34,34,4,[0,1,2,3]),
 ('dawn','Dawn','Spr_Pt_Dawn.png','DS _ DSi - Pokemon Platinum - Playable Characters - Dawn.png',0,0,34,34,4,[0,1,2,3]),
 ('cynthia','Cynthia','Spr_DP_Cynthia.png','cynthia_by_aveontrainer_ddmgu9n.png',0,0,32,48,4,[0,3,1,2]),
 ('cyrus','Cyrus','Spr_DP_Cyrus.png','cyrus_by_aveontrainer_dd28nbd.png',0,0,32,48,4,[0,3,1,2]),
]
for ident,name,portrait,sheet,x,y,w,h,n,rows in defs:
    shutil.copyfile(SRC/portrait,OUT/'portraits'/f'{ident}.png')
    raw=Image.open(SRC/sheet).convert('RGBA')
    bg=None if raw.getextrema()[3][0]==0 else raw.getpixel((x,y))[:3]
    # DS/GBA sheets contain cell outlines, removed only at the edge.
    atlas=Image.new('RGBA',(128,192))
    for dy,sy in enumerate(rows):
        for dx,sx in enumerate([0,1,2,1] if n==3 else [0,1,2,3]):
            frame=transparent(raw.crop((x+sx*w,y+sy*h,x+(sx+1)*w,y+(sy+1)*h)),bg)
            if ident=='brendan':
                cx=[0,14,28,28][dy];cy=[0,22,44,22][dx]
                frame=transparent(raw.crop((cx,cy,cx+14,cy+22)),(255,0,228))
                if dy==3:frame=frame.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
            a=np.array(frame)
            colors={'ethan':[(48,78,48),(88,144,88)],'lucas':[(0,128,128),(136,184,176)],'dawn':[(0,128,128),(136,184,176)],'hilda':[(255,0,255),(56,144,88),(88,144,88)]}.get(ident,[])
            for color in colors:a[np.all(a[:,:,:3]==color,axis=2),3]=0
            if ident=='red':
                labels,_=ndimage.label(np.all(a[:,:,:3]==(255,255,255),axis=2))
                edge=set(labels[0])|set(labels[-1])|set(labels[:,0])|set(labels[:,-1]);edge.discard(0)
                a[np.isin(labels,list(edge)),3]=0
            # Source grids have one-pixel teal borders, not part of the character.
            if ident in ['lucas','dawn']:
                a[0,:,3]=a[-1,:,3]=a[:,0,3]=a[:,-1,3]=0
            frame=Image.fromarray(a);frame=frame.crop(frame.getbbox())
            frame=frame.resize((round(frame.width*28/frame.height),28),Image.Resampling.NEAREST)
            frame=fit(frame)
            atlas.alpha_composite(frame,(dx*32,dy*48))
    atlas.save(OUT/'trainers'/f'{ident}.png')
    trainers.append(dict(id=ident,name=name,portrait=f'assets/camp/portraits/{ident}.png',sheet=f'assets/camp/trainers/{ident}.png'))

pokemon={}
def add(dex,im,bg):
    w,h=im.size
    fw,fh=w//2,h//4
    if fw<24 or fh<24:
        return
    atlas=Image.new('RGBA',(64,192))
    for row,coords in enumerate([[(0,2),(0,3)],[(0,0),(0,1)],[(1,2),(1,3)],[(1,0),(1,1)]]):
        for col,(x,y) in enumerate(coords):
            part=transparent(im.crop((x*fw,y*fh,(x+1)*fw,(y+1)*fh)),bg)
            a=np.array(part)
            # Gender marks and outlines sit on the outside edge of each frame.
            for color in [(255,0,255),(0,128,255),(255,128,0),(0,64,128)]:
                mask=np.all(a[:,:,:3]==color,axis=2)
                a[mask,3]=0
            a[0,:,3]=a[-1,:,3]=a[:,0,3]=a[:,-1,3]=0
            try: part=fit(Image.fromarray(a))
            except ValueError: return
            atlas.alpha_composite(part,(col*32,row*48))
    atlas.save(OUT/'pokemon'/f'{dex}.png')
    pokemon[str(dex)]=dict(sheet=f'assets/camp/pokemon/{dex}.png',mode='walk')

raw=Image.open(SRC/'DS _ DSi - Pokemon HeartGold _ SoulSilver - Overworld - Pokemon (1st Generation, Overworld).png').convert('RGBA')
dex=1
for r in range(11):
    for c in range(15):
        if dex>151: break
        im=raw.crop((c*65,r*129,c*65+64,r*129+128))
        a=np.array(im)
        if np.all(a[:,:,:3]==(255,0,255),axis=2).sum()>=8: continue
        add(dex,im,im.getpixel((1,1))[:3]);dex+=1
assert dex==152

def regions(gen):
    raw=Image.open(SRC/f'DS _ DSi - Pokemon HeartGold _ SoulSilver - Overworld - Pokemon ({gen}, Overworld).png').convert('RGBA')
    a=np.array(raw)[:,:,:3]
    boxes=[]
    for color,count in Counter(map(tuple,a.reshape(-1,3))).items():
        if count<700 or color==(0,0,0):continue
        labels,_=ndimage.label(np.all(a==color,axis=2))
        for idx,box in enumerate(ndimage.find_objects(labels),1):
            if box is None:continue
            yy,xx=box;w=xx.stop-xx.start;h=yy.stop-yy.start
            if 50<=w<=256 and 100<=h<=300 and (labels[box]==idx).sum()>w*h*.18:
                boxes.append((xx.start,yy.start,w,h,color))
    boxes.sort(key=lambda b:(b[1],b[0]))
    return raw,boxes

raw,boxes=regions('2nd Generation')
assert len(boxes)==144,len(boxes)
mapping={}
value=152
for i in range(51):
    if i in [3,22]:continue
    mapping[i]=value;value+=1
assert value==201
mapping.update({51:201,79:202})
mapping.update(dict(zip(range(81,86),range(203,208))))
mapping.update(dict(zip(range(94,100),range(209,215))))
mapping.update(dict(zip(range(101,135),range(215,249))))
mapping[143]=251
for i,dex in mapping.items():
    x,y,w,h,bg=boxes[i];add(dex,raw.crop((x,y,x+w,y+h)),bg)

# Steelix uses 64px frames, one direction per cell and separate gender cells.
atlas=Image.new('RGBA',(64,192))
for row,i in enumerate([90,86,92,88]):
    x,y,w,h,bg=boxes[i]
    for col in range(2):
        part=transparent(raw.crop((x,y+col*64,x+64,y+(col+1)*64)),bg)
        a=np.array(part)
        for color in [(0,128,255),(255,0,255),(0,64,128)]:a[np.all(a[:,:,:3]==color,axis=2),3]=0
        a[0,:,3]=a[-1,:,3]=a[:,0,3]=a[:,-1,3]=0
        atlas.alpha_composite(fit(Image.fromarray(a)),(col*32,row*48))
atlas.save(OUT/'pokemon'/'208.png')
pokemon['208']=dict(sheet='assets/camp/pokemon/208.png',mode='walk')

raw,boxes=regions('3rd Generation')
assert len(boxes)==138,len(boxes)
for i in range(135):
    x,y,w,h,bg=boxes[i];add(252+i,raw.crop((x,y,x+w,y+h)),bg)

raw,boxes=regions('4th Generation')
assert len(boxes)==141,len(boxes)
mapping=dict(zip(range(25),range(387,412)))
mapping.update({25:412,28:413,31:414})
mapping.update(dict(zip(range(32,39),range(415,422))))
mapping.update({40:422,42:423})
mapping.update(dict(zip(range(44,70),range(424,450))))
mapping[71]=450
mapping.update(dict(zip(range(73,102),range(451,480))))
mapping.update({107:480,108:481,109:482,118:485,131:488,132:489,133:490,134:491,135:492})
for i,dex in mapping.items():
    x,y,w,h,bg=boxes[i];add(dex,raw.crop((x,y,x+w,y+h)),bg)

(ROOT/'game/camp/assets.js').write_text('window.CAMP_ASSETS='+json.dumps(dict(trainers=trainers,pokemon=pokemon),ensure_ascii=False,separators=(',',':'))+';\n')
print(f'Built {len(trainers)} trainers and {len(pokemon)} walking Pokémon.')
