"""Cache available official back sprites; retain front sprites for species without one."""
from pathlib import Path
import concurrent.futures,urllib.request,shutil
root=Path(__file__).resolve().parents[1];dest=root/'game/assets/online-sprites'
def get(i):
 out=dest/f'{i}-back.png';old=root/'game/assets/sprites'/f'{i}-b.png'
 if out.exists():return True
 if old.exists():shutil.copyfile(old,out);return True
 try:
  data=urllib.request.urlopen(f'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/{i}.png',timeout=12).read()
  if data.startswith(b'\x89PNG'):out.write_bytes(data);return True
 except Exception:pass
 return False
with concurrent.futures.ThreadPoolExecutor(max_workers=16) as pool:
 results=list(pool.map(get,range(1,650)))
print('Back sprites:',sum(results),flush=True)
