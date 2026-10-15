"""Build the offline data pack from the public PokeAPI CSV database."""
import csv, io, json, re, urllib.request, concurrent.futures
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
BASE='https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/'
FILES=['pokemon_species','pokemon','pokemon_stats','pokemon_types','pokemon_moves','moves','move_names','types','pokemon_evolution','items','item_names','move_meta','move_meta_stat_changes','stats']
CACHE=ROOT/'build'/'data-cache';CACHE.mkdir(parents=True,exist_ok=True)
def get(name):
    p=CACHE/(name+'.csv')
    if not p.exists(): p.write_bytes(urllib.request.urlopen(BASE+name+'.csv',timeout=120).read())
    return name,list(csv.DictReader(io.StringIO(p.read_text())))
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool: data=dict(pool.map(get,FILES))
game=(ROOT/'game'/'game.js').read_text()
ids={int(x) for x in re.findall(r"sp\('[^']*','[^']*',(\d+),",game)}
# Add canonical trainer species which weren't present in the original roster.
ids.update([120,49,109,110,89,24,22,91,87,106,107,97,124,103,45,114,115,34,31,78,136])
ids.update([71,168,122,51,205,237])
species={int(r['id']):r for r in data['pokemon_species']}
pending=list(ids)
while pending:
    i=pending.pop();before=species[i]['evolves_from_species_id']
    if before and int(before) not in ids:ids.add(int(before));pending.append(int(before))
# Include every generation-5 descendant so evolution items never lead to a missing species.
while True:
    children={i for i,r in species.items() if i<=649 and r['evolves_from_species_id'] and int(r['evolves_from_species_id']) in ids}
    added=children-ids
    if not added:break
    ids.update(added)
pokemon={int(r['id']):r for r in data['pokemon'] if r['is_default']=='1'}
types={r['id']:r['identifier'] for r in data['types']}
pokemonTypes={}
for r in data['pokemon_types']:pokemonTypes.setdefault(int(r['pokemon_id']),[]).append(types[r['type_id']])
stats={};
for r in data['pokemon_stats']: stats.setdefault(int(r['pokemon_id']),{})[int(r['stat_id'])]=int(r['base_stat'])
names={};
for r in data['move_names']:
    if r['local_language_id'] in ('9','13'): names.setdefault(int(r['move_id']),{})[r['local_language_id']]=r['name']
meta={int(r['move_id']):r for r in data['move_meta']}
changes={}
for r in data['move_meta_stat_changes']: changes.setdefault(int(r['move_id']),[]).append([int(r['stat_id']),int(r['change'])])
moves={}
pt_file=ROOT/'game'/'move-names-pt.json'
pt_names=json.loads(pt_file.read_text()) if pt_file.exists() else {}
for r in data['moves']:
    i=int(r['id']);n=names.get(i,{})
    if int(r['generation_id'])>5 or not r['pp']: continue
    moves[r['identifier']]={'n':pt_names.get(r['identifier'],n.get('13',n.get('9',r['identifier']))),'en':n.get('9',r['identifier']),'t':types[r['type_id']],'p':int(r['power'] or 0),'a':int(r['accuracy'] or 100),'pp':int(r['pp']),'pri':int(r['priority']),'cat':int(r['damage_class_id']),'target':int(r['target_id']),'effect':int(r['effect_id'] or 0),'meta':meta.get(i,{}),'changes':changes.get(i,[])}
moveById={int(r['id']):r['identifier'] for r in data['moves']}
learn={}
# Black 2/White 2 provides a uniform generation 5 learnset for all supported species.
for r in data['pokemon_moves']:
    i=int(r['pokemon_id']);m=moveById.get(int(r['move_id']))
    if i not in ids or r['version_group_id']!='14' or m not in moves: continue
    method=int(r['pokemon_move_method_id'])
    if method in (1,4):learn.setdefault(i,[]).append({'id':m,'level':int(r['level']),'method':'level' if method==1 else 'machine'})
items={r['id']:r['identifier'] for r in data['items']}
evos={}
for r in data['pokemon_evolution']:
    to=int(r['evolved_species_id']);before=species.get(to,{}).get('evolves_from_species_id')
    if to not in ids or not before or int(before) not in ids:continue
    if int(r.get('generation_id') or 1)>5:continue
    evos.setdefault(int(before),[]).append({'to':species[to]['identifier'],'trigger':int(r['evolution_trigger_id']),'level':int(r['minimum_level'] or 0),'friendship':int(r['minimum_happiness'] or 0),'time':r['time_of_day'],'item':items.get(r['trigger_item_id'] or r['held_item_id']),'move':moveById.get(int(r['known_move_id'])) if r['known_move_id'] else None,'location':r['location_id'],'beauty':r['minimum_beauty'],'gender':r['gender_id'],'relative':r['relative_physical_stats'],'party':r['party_species_id']})
pack={'moves':moves,'species':{},'source':'PokeAPI CSV, generation 5 / Black 2 White 2; special evolution adaptations documented in game.'}
for i in sorted(ids):
    r=species[i];st=stats[i]
    pack['species'][r['identifier']]={'dex':i,'types':pokemonTypes[i],'base':species[int(r['evolves_from_species_id'])]['identifier'] if r['evolves_from_species_id'] else None,'stats':[st[x] for x in range(1,7)],'learn':sorted(learn.get(i,[]),key=lambda m:(m['level'],m['id'])),'evolutions':evos.get(i,[])}
(ROOT/'game'/'pokemon-data.js').write_text('const POKEMON_DATA='+json.dumps(pack,ensure_ascii=False,separators=(',',':'))+';\n')
print('offline species',len(pack['species']),'moves',len(moves))
