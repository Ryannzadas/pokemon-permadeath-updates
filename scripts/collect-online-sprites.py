"""Cache National Dex sprites from PokeAPI for offline builder/online rendering."""
from pathlib import Path
import concurrent.futures,json,urllib.request,shutil
root=Path(__file__).resolve().parents[1];text=(root/'game/online-dex-data.js').read_text();pack=json.loads(text[text.index('{'):text.rfind('}')+1]);dest=root/'game/assets/online-sprites';dest.mkdir(exist_ok=True)
def get(p):
 out=dest/(str(p['dex'])+'.png');old=root/'game/assets/sprites'/(str(p['dex'])+'-f.png')
 if out.exists():return True
 if old.exists():shutil.copyfile(old,out);return True
 urls=[f"https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/{p['spriteDex']}.png",f"https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/{p['spriteDex']}.png"]
 for url in urls:
  for attempt in range(2):
   try:
    data=urllib.request.urlopen(url,timeout=20).read()
    if not data.startswith(b'\x89PNG\r\n\x1a\n'):raise ValueError('Not PNG')
    out.write_bytes(data);return True
   except Exception:pass
 return p['id']
with concurrent.futures.ThreadPoolExecutor(max_workers=12) as pool:
 results=[]
 for i,result in enumerate(pool.map(get,pack['species'].values()),1):
  results.append(result)
  if i%100==0:print('Sprites',i,flush=True)
failed=[x for x in results if x is not True]
if failed:raise ValueError('Missing sprites: '+str(failed))
print('All sprites ready:',len(results),flush=True)
