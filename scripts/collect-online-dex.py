"""Build an independent National Dex for Team Builder and online battles.
PokeAPI CSV source; no changes to journey species, moves or save data.
"""
import csv,io,json,hashlib,urllib.request,concurrent.futures
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
CACHE=ROOT/'build'/'online-data-cache';CACHE.mkdir(parents=True,exist_ok=True)
BASE='https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/'
FILES=['pokemon_species','pokemon_species_names','pokemon','pokemon_stats','pokemon_types','pokemon_moves','moves','move_names','types','move_meta','move_meta_stat_changes','pokemon_abilities','abilities','ability_names','items','item_names','item_flag_map','natures','nature_names']
def get(name):
 p=CACHE/(name+'.csv')
 if not p.exists():
  for attempt in range(3):
   try:p.write_bytes(urllib.request.urlopen(BASE+name+'.csv',timeout=60).read());break
   except Exception:
    if attempt==2:raise
 return name,list(csv.DictReader(io.StringIO(p.read_text())))
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:data=dict(pool.map(get,FILES))
def existing(name):
 text=(ROOT/'game'/name).read_text();return json.loads(text[text.index('{'):text.rfind('}')+1])
old=existing('pokemon-data.js');oldAbilities=existing('ability-data.js')
sp={int(r['id']):r for r in data['pokemon_species']}
# One default form per National Dex species, including all generations.
pokemon={int(r['species_id']):r for r in data['pokemon'] if r['is_default']=='1'}
byPokemon={int(r['id']):i for i,r in pokemon.items()}
types={r['id']:r['identifier'] for r in data['types']}
names={int(r['pokemon_species_id']):r['name'] for r in data['pokemon_species_names'] if r['local_language_id']=='9'}
pt={}
if (ROOT/'game/move-names-pt.json').exists():pt=json.loads((ROOT/'game/move-names-pt.json').read_text())
moveNames={int(r['move_id']):r['name'] for r in data['move_names'] if r['local_language_id']=='9'}
meta={int(r['move_id']):r for r in data['move_meta']};changes={}
for r in data['move_meta_stat_changes']:changes.setdefault(int(r['move_id']),[]).append([int(r['stat_id']),int(r['change'])])
moves={};moveById={}
for r in data['moves']:
 i=int(r['id']);moveById[i]=r['identifier']
 if not r['pp'] or types[r['type_id']] not in {'normal','fire','water','electric','grass','ice','fighting','poison','ground','flying','psychic','bug','rock','ghost','dragon','dark','steel','fairy'}:continue
 id=r['identifier'];en=moveNames.get(i,id)
 moves[id]={'n':pt.get(id,old['moves'].get(id,{}).get('n',en)),'en':en,'t':types[r['type_id']],'p':int(r['power'] or 0),'a':int(r['accuracy'] or 100),'pp':int(r['pp']),'pri':int(r['priority']),'cat':int(r['damage_class_id']),'target':int(r['target_id']),'effect':int(r['effect_id'] or 0),'meta':meta.get(i,{}),'changes':changes.get(i,[])}
stats={};ptypes={}
for r in data['pokemon_stats']:stats.setdefault(int(r['pokemon_id']),{})[int(r['stat_id'])]=int(r['base_stat'])
for r in data['pokemon_types']:ptypes.setdefault(int(r['pokemon_id']),[]).append((int(r['slot']),types[r['type_id']]))
abilityNames={r['id']:r['identifier'] for r in data['abilities']};abilities={}
for r in data['pokemon_abilities']:
 if r['ability_id']:abilities.setdefault(int(r['pokemon_id']),[]).append({'slot':int(r['slot']),'id':abilityNames[r['ability_id']]})
learn={};latest={}
methods={1:'level',2:'egg',3:'tutor',4:'machine',5:'level',6:'tutor',10:'tutor',11:'tutor'}
# National builder permits legal learning across generations (transfer moves included).
for r in data['pokemon_moves']:
 p=int(r['pokemon_id']);v=int(r['version_group_id'])
 if p in byPokemon and int(r['pokemon_move_method_id']) in methods:latest[p]=max(latest.get(p,0),v)
methods={1:'level',2:'egg',3:'tutor',4:'machine',5:'level',6:'tutor',10:'tutor',11:'tutor'}
for r in data['pokemon_moves']:
 p=int(r['pokemon_id']);id=moveById.get(int(r['move_id']));method=methods.get(int(r['pokemon_move_method_id']))
 if p not in byPokemon or id not in moves or not method:continue
 learn.setdefault(p,[]).append({'id':id,'level':int(r['level']),'method':method})
pack={'species':{},'moves':moves,'abilities':{},'source':'PokeAPI CSV National Dex: default species, cross-generation learnsets plus existing journey learnsets for saved team compatibility.','hashes':{f:hashlib.sha256((CACHE/(f+'.csv')).read_bytes()).hexdigest() for f in FILES}}
for dex,r in sorted(sp.items()):
 p=int(pokemon[dex]['id']);id=r['identifier'];base=sp.get(int(r['evolves_from_species_id'] or 0),{}).get('identifier')
 rows=learn.get(p,[])+old['species'].get(id,{}).get('learn',[])
 unique={(x['id'],x['method'],x['level']):x for x in rows}
 slots={x['slot']:x for x in abilities.get(p,[])}
 pack['abilities'][id]=[slots[i] for i in sorted(slots)]
 pack['species'][id]={'id':id,'n':names.get(dex,id.title()),'dex':dex,'spriteDex':p,'generation':int(r['generation_id']),'t':[t for _,t in sorted(ptypes[p])],'stats':[stats[p][i] for i in range(1,7)],'base':base,'learn':sorted(unique.values(),key=lambda x:(x['level'],x['id'],x['method']))}
 if not pack['species'][id]['learn']:raise ValueError('Missing learnset: '+id)
# Evolved species can retain moves learned by their earlier forms.
allLearn={}
def inherited(id):
 if id in allLearn:return allLearn[id]
 p=pack['species'][id];rows=p['learn'][:]
 if p['base'] in pack['species']:rows+=inherited(p['base'])
 allLearn[id]=list({(x['id'],x['method'],x['level']):x for x in rows}.values());return allLearn[id]
for id in pack['species']:pack['species'][id]['learn']=sorted(inherited(id),key=lambda x:(x['level'],x['id'],x['method']))
pack['backSprites']=[int(p.name.split('-')[0]) for p in (ROOT/'game/assets/online-sprites').glob('*-back.png')]
held={r['item_id'] for r in data['item_flag_map'] if r['item_flag_id']=='5'}
itemNames={r['item_id']:r['name'] for r in data['item_names'] if r['local_language_id']=='9'}
pack['items']={r['identifier']:{'n':itemNames.get(r['id'],r['identifier']),'category':int(r['category_id']),'pending':True} for r in data['items'] if r['id'] in held or r['fling_power'] or int(r['category_id']) in {*range(1,9),*range(12,20),36,42,44,45,46}}
pack['abilityNames']={r['ability_id']:r['name'] for r in data['ability_names'] if r['local_language_id']=='9'}
pack['abilityLabels']={r['identifier']:pack['abilityNames'].get(r['id'],r['identifier']) for r in data['abilities']}
natureNames={r['nature_id']:r['name'] for r in data['nature_names'] if r['local_language_id']=='9'}
statKeys={2:'atk',3:'def',4:'spa',5:'spd',6:'spe'}
pack['natures']={r['identifier']:{'n':natureNames.get(r['id'],r['identifier']),'up':statKeys[int(r['increased_stat_id'])],'down':statKeys[int(r['decreased_stat_id'])]} for r in data['natures']}
(ROOT/'game'/'online-dex-data.js').write_text('const ONLINE_DEX_DATA='+json.dumps(pack,ensure_ascii=False,separators=(',',':'))+';\n')
print('National Dex:',len(pack['species']),'species;',len(moves),'moves; highest #',max(sp),flush=True)
