"""Download offline PokeAPI item sprites from its primary sprite repository."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from urllib.request import urlopen
import json
ROOT=Path(__file__).resolve().parents[1];out=ROOT/'game/assets/items';out.mkdir(parents=True,exist_ok=True)
ids='potion super-potion revive rare-candy poke-ball great-ball ether elixir rare-candy fire-stone water-stone thunder-stone leaf-stone moon-stone sun-stone dusk-stone dawn-stone shiny-stone razor-claw razor-fang metal-coat kings-rock dragon-scale protector electirizer magmarizer reaper-cloth prism-scale escape-rope leaf-stone ice-stone thunder-stone oran-berry sitrus-berry lum-berry leftovers choice-band life-orb focus-sash'.split()+['tm-'+t for t in 'normal fighting flying poison ground rock bug ghost steel fire water grass electric psychic ice dragon dark fairy'.split()]
def get(ident):
 url='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/'+ident+'.png'
 try:
  data=urlopen(url,timeout=30).read();assert data[:8]==b'\x89PNG\r\n\x1a\n';(out/(ident+'.png')).write_bytes(data);return ident
 except Exception as e:return (ident,str(e))
with ThreadPoolExecutor(max_workers=6) as ex:results=list(ex.map(get,sorted(set(ids))))
print('Downloaded',sum(isinstance(x,str) for x in results),'Failed:',[x for x in results if not isinstance(x,str)])
