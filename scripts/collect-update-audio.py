"""Select only requested music and map attack sounds by normalized move name.
Usage: python scripts/collect-update-audio.py --source /path/to/upload
"""
from pathlib import Path
import zipfile,json,re,argparse,subprocess,concurrent.futures,tempfile,shutil
ROOT=Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser();p.add_argument('--source',required=True);src=Path(p.parse_args().source)
target=ROOT/'game/assets/audio032';target.mkdir(parents=True,exist_ok=True)
out=Path(tempfile.mkdtemp(prefix='pokemon-032-audio-'))
music={'cities':[],'titles':[],'battle':{}};tasks=[]
def convert(task):
 data,dest,kind=task
 if dest.exists() and dest.stat().st_size>100:return dest.name
 with tempfile.NamedTemporaryFile(suffix='.mp3') as f:
  f.write(data);f.flush()
  # Conservative loudness, mono for SFX, lightweight offline soundtrack.
  args=['ffmpeg','-loglevel','error','-y','-i',f.name,'-map','0:a:0','-vn','-map_metadata','-1','-af','loudnorm=I=-22:TP=-3:LRA=11','-ar','44100','-b:a','96k' if kind=='music' else '64k']
  if kind=='sfx':args+=['-ac','1']
  args+=[str(dest)]
  result=subprocess.run(args,stderr=subprocess.PIPE)
  if result.returncode:
   dest.unlink(missing_ok=True);return {'invalid':dest.name}

 return dest.name
for ident,name in [('bw2','pkmn-bw2-soundtrack.zip'),('dp1','Disc 1(1).zip'),('dp2','Disc 2(1).zip')]:
 with zipfile.ZipFile(src/name) as z:
  for entry in z.infolist():
   label=Path(entry.filename).stem.split(' - ',1)[-1]
   city=bool(re.search(r'(City|Town)(?: \((?:Day|Night)\))?$',label))
   title=label=='Title Screen'
   battle='Battle!' in label and not label.startswith('Decisive')
   if not(city or title or battle):continue
   slug=ident+'-'+re.sub('[^a-z0-9]+','-',label.lower()).strip('-')
   dest=out/(slug+'.mp3');tasks.append((z.read(entry),dest,'music'));record={'id':slug,'name':label,'file':'assets/audio032/'+dest.name,'game':'BW2' if ident=='bw2' else 'DP'}
   if city:music['cities'].append(record)
   elif title:music['titles'].append(record)
   else:
    category='wild' if 'Wild Pokémon' in label else 'gym' if 'Gym Leader' in label else 'champion' if 'Champion' in label else 'elite' if 'Elite Four' in label else 'trainer' if any(x in label for x in ['Trainer','Rival','Team Galactic','Team Plasma','Colress','Ghetsis','(N)']) else 'legendary'
    music['battle'].setdefault(category,[]).append(record)
# Full files and separate stages contain the same move; use earliest stage when
# supplied, leaving effectiveness impact to the battle engine rather than playing twice.
data=json.loads((ROOT/'game/pokemon-data.js').read_text().split('=',1)[1].rstrip(';\n'))
def norm(s):return re.sub('[^a-z0-9]','',s.lower())
with zipfile.ZipFile(src/'GEN 7 SFX - Attack Moves - SUMO, USUM.zip') as z:
 entries={norm(Path(i.filename).stem):i for i in z.infolist() if i.filename.endswith('.mp3')}
 sounds={};missing=[]
 for move,m in data['moves'].items():
  key=norm(m['en']);entry=entries.get(key+'part1') or entries.get(key) or entries.get(key+'1hit') or entries.get(norm(move)+'part1') or entries.get(norm(move)) or entries.get(norm(move)+'1hit') or entries.get({'judgment':'judgement','vice-grip':'vicegrip'}.get(move,''))
  if not entry:missing.append(move);continue
  dest=out/('move-'+move+'.mp3');tasks.append((z.read(entry),dest,'sfx'));sounds[move]={'file':'assets/audio032/'+dest.name,'stage':bool(entries.get(key+'part1'))}
 for ident,name in [('hit','Hit Normal Damage'),('hitSE','Hit Super Effective'),('hitNE','Hit Weak Not Very Effective')]:
  entry=entries[norm(name)];dest=out/('impact-'+ident+'.mp3');tasks.append((z.read(entry),dest,'sfx'))
print('Music:',len(music['cities']),'cities,',len(music['titles']),'titles,',sum(map(len,music['battle'].values())),'battles; SFX:',len(sounds),'missing:',missing,flush=True)
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as ex:
 for i,result in enumerate(ex.map(convert,tasks),1):
  if isinstance(result,dict):
   invalid=result['invalid'];move=invalid.removeprefix('move-').removesuffix('.mp3');sounds.pop(move,None);missing.append(move);print('Invalid:',invalid,flush=True)
  if i%50==0:print('Converted',i,'/',len(tasks),flush=True)
for old in target.glob('*.mp3'):old.unlink()
for audio in out.glob('*.mp3'):shutil.copyfile(audio,target/audio.name)
shutil.rmtree(out)
(ROOT/'game/audio-assets.js').write_text('window.EXTRA_AUDIO='+json.dumps({'music':music,'moves':sounds,'missing':missing},ensure_ascii=False,separators=(',',':'))+';\n')
print('Done',len(tasks),flush=True)
