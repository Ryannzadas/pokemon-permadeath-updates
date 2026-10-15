"""Extend the gen-5 pack with the persisted PokeAPI Sword/Shield Sylveon snapshot."""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
p=ROOT/'game/pokemon-data.js'
pack=json.loads(p.read_text().split('=',1)[1].rstrip(';\n'))
snapshot=json.loads((ROOT/'build/sylveon-snapshot.json').read_text())
pack['moves'].update(snapshot['moves'])
pack['modernFairyMoves']=[id for id,m in snapshot['moves'].items() if m['t']=='fairy']
pack['species']['sylveon']=snapshot['species']
eevee=pack['species']['eevee']
for move in snapshot['eevee_fairy_learn']:
 if not any(x['id']==move['id'] and x['method']==move['method'] for x in eevee['learn']):eevee['learn'].append(move)
eevee['evolutions']=[x for x in eevee['evolutions'] if x['to']!='sylveon']
eevee['evolutions'].insert(0,{'to':'sylveon','trigger':1,'level':0,'friendship':160,'time':'','item':None,'move':None,'moveType':'fairy','levelUp':True,'location':'','beauty':'','gender':'','relative':'','party':''})
pack['source']='PokeAPI gen-5 pack; Sylveon and Eevee Fairy moves from Sword/Shield, modern friendship evolution.'
p.write_text('const POKEMON_DATA='+json.dumps(pack,ensure_ascii=False,separators=(',',':'))+';\n')
print('Sylveon snapshot integrated; Eevee has the modern Fairy evolution branch.')
