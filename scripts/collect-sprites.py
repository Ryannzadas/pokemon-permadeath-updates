"""Download missing offline front/back sprites for the generated data pack."""
import json, concurrent.futures, urllib.request
from pathlib import Path
root=Path(__file__).resolve().parents[1]
data=json.loads((root/'game/pokemon-data.js').read_text().split('=',1)[1].rstrip(';\n'))
dest=root/'game/assets/sprites';dest.mkdir(parents=True,exist_ok=True)
def fetch(job):
    dex,side=job;p=dest/f'{dex}-{side}.png'
    if p.exists():return
    base='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/'
    url=base+('back/' if side=='b' else '')+str(dex)+'.png'
    raw=urllib.request.urlopen(url,timeout=90).read()
    if not raw.startswith(b'\x89PNG\r\n\x1a\n'):raise ValueError(url)
    p.write_bytes(raw)
jobs=[(s['dex'],side) for s in data['species'].values() for side in ('f','b')]
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:list(pool.map(fetch,jobs))
print('Offline sprite pack verified:',len(jobs),'files')
