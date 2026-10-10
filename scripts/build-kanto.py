"""Build the bundled Kanto table from PokeAPI CSVs downloaded to the given directory.
Source: https://github.com/PokeAPI/pokeapi/tree/master/data/v2/csv
This preserves source traits; draft.js derives fictional football ratings separately.
"""
import csv, json, sys
from pathlib import Path
source = Path(sys.argv[1])
def rows(name):
    with (source / name).open() as handle:
        return list(csv.DictReader(handle))
stats, types = {}, {}
for row in rows('pokemon_stats.csv'):
    stats.setdefault(int(row['pokemon_id']), {})[int(row['stat_id'])] = int(row['base_stat'])
type_names = {int(row['id']): row['identifier'] for row in rows('types.csv')}
for row in rows('pokemon_types.csv'):
    types.setdefault(int(row['pokemon_id']), []).append(type_names[int(row['type_id'])])
special = {29:'Nidoran♀',32:'Nidoran♂',83:'Farfetch’d',122:'Mr. Mime'}
pool = []
for row in rows('pokemon.csv'):
    number = int(row['id'])
    if 1 <= number <= 151:
        pool.append([number, special.get(number, row['identifier'].capitalize()), types[number], int(row['weight'])/10, *[stats[number][i] for i in range(1,7)]])
assert len(pool) == 151
Path('dist/kanto.js').write_text('/* Bundled PokeAPI traits: id, name, types, kg, HP, Attack, Defense, Sp. Atk, Sp. Def, Speed. */\n(function(root){const rows='+json.dumps(pool,ensure_ascii=False,separators=(',',':'))+';root.PokeKanto=rows;if(typeof module!=="undefined")module.exports=rows;})(typeof window!=="undefined"?window:globalThis);\n')
print('Bundled 151 Kanto species.')
