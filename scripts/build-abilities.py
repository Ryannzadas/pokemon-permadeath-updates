"""Rebuild offline regular ability slots for generation 5 from the retained PokeAPI snapshot.

Sources: https://github.com/PokeAPI/pokeapi/tree/master/data/v2/csv
Retrieved 2026-10-09. Historical entries apply through generation_id, not from it.
"""
from pathlib import Path
import csv
import json

root = Path(__file__).resolve().parent.parent
source = root / 'scripts' / 'ability-data'
def rows(name):
    with (source / name).open(encoding='utf-8', newline='') as handle:
        return list(csv.DictReader(handle))

abilities = {row['id']: row for row in rows('abilities.csv')}
past = {}
for row in rows('pokemon_abilities_past.csv'):
    if int(row['generation_id']) >= 5:
        key = row['pokemon_id'], row['slot']
        if key not in past or int(row['generation_id']) < int(past[key]['generation_id']):
            past[key] = row
slots = {}
for row in rows('pokemon_abilities.csv'):
    row = past.get((row['pokemon_id'], row['slot']), row)
    if row['is_hidden'] == '0' and row['ability_id'] and int(abilities[row['ability_id']]['generation_id']) <= 5:
        slots.setdefault(int(row['pokemon_id']), []).append({'slot': int(row['slot']), 'id': abilities[row['ability_id']]['identifier']})
text = (root / 'game' / 'pokemon-data.js').read_text(encoding='utf-8')
data = json.loads(text[text.index('{'):text.rfind('}') + 1])
result = {name: slots.get(info['dex'], []) for name, info in data['species'].items()}
(root / 'game' / 'ability-data.js').write_text("'use strict';\n/* PokeAPI CSV: regular ability slots, with historical overrides through generation 5. */\nconst POKEMON_ABILITIES=" + json.dumps(result, separators=(',', ':')) + ';\n', encoding='utf-8')
print(f'Built offline ability slots for {len(result)} species.')
