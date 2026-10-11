"""Import unmodified, eight-direction PMDCollab sheets (Pillow reads bounds)."""
import concurrent.futures, io, json, pathlib, subprocess, xml.etree.ElementTree as ET
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parents[1]
REV = '01b0a2d31e20ab2f4bfec1fa4a13ae566977579b'
BASE = f'https://raw.githubusercontent.com/PMDCollab/SpriteCollab/{REV}'
DEST = ROOT / 'dist/assets/directional'
DEST.mkdir(parents=True, exist_ok=True)

def fetch(path):
    # curl uses the host trust store, including managed workstation certificates.
    return subprocess.run(['curl', '--fail', '--silent', '--show-error', '--location', '--retry', '2', '--max-time', '30', BASE + '/' + path], check=True, capture_output=True).stdout

def species(number):
    folder = f'sprite/{number:04d}'
    anims = {a.findtext('Name'): a for a in ET.fromstring(fetch(folder + '/AnimData.xml')).find('Anims')}
    def resolve(name):
        seen = set()
        while name in anims and name not in seen:
            seen.add(name)
            a = anims[name]
            copy = a.findtext('CopyOf')
            if copy:
                name = copy
            else:
                return name, a
        return None
    states, loaded = {}, {}
    choices = {'run': ['Walk'], 'idle': ['Idle', 'Walk'], 'action': ['Attack', 'Shoot', 'Walk'], 'hurt': ['Hurt', 'Idle', 'Walk']}
    for state, options in choices.items():
        result = next((resolve(n) for n in options if resolve(n)), None)
        if not result:
            raise ValueError(f'{number}: missing {state}')
        name, a = result
        w, h = int(a.findtext('FrameWidth')), int(a.findtext('FrameHeight'))
        dur = [int(d.text) for d in a.find('Durations')]
        if name not in loaded:
            png = fetch(folder + '/' + name + '-Anim.png')
            image = Image.open(io.BytesIO(png)).convert('RGBA')
            if image.width != w * len(dur) or image.height != h * 8:
                raise ValueError(f'{number} {name}: expected {w * len(dur)}x{h * 8}, got {image.size}')
            bounds = []
            for row in range(8):
                for col in range(len(dur)):
                    box = image.crop((col*w, row*h, (col+1)*w, (row+1)*h)).getbbox()
                    if box:
                        bounds.append(box)
            if not bounds:
                raise ValueError('Empty atlas')
            left, right = min(b[0] for b in bounds), max(b[2] for b in bounds)
            top, bottom = min(b[1] for b in bounds), max(b[3] for b in bounds)
            file = f'{number}-{name.lower()}.png'
            (DEST / file).write_bytes(png)
            loaded[name] = {'src': 'assets/directional/' + file, 'w': w, 'h': h, 'ticks': dur, 'baseline': bottom, 'span': max(right-left, bottom-top)}
        states[state] = loaded[name]
    credits = fetch(folder + '/credits.txt').decode()
    (DEST / f'{number}-credits.txt').write_text(credits)
    return number, {'scale': round(min(2, 38/states['run']['span']), 4), 'states': states}

if __name__ == '__main__':
    data, errors = {}, []
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as pool:
        futures = {pool.submit(species, n): n for n in range(1, 152)}
        for future in concurrent.futures.as_completed(futures):
            try:
                n, result = future.result()
                data[n] = result
            except Exception as error:
                errors.append((futures[future], str(error)))
    if errors:
        raise SystemExit(json.dumps(errors))
    data = dict(sorted(data.items()))
    (ROOT / 'dist/sprite-data.js').write_text('/* PMDCollab atlas metadata. See sprite-credits.html. */\n(function(root){const data=' + json.dumps(data, separators=(',', ':')) + ';root.PokeSpriteData=data;if(typeof module!=="undefined")module.exports=data;})(typeof window!=="undefined"?window:globalThis);\n')
    (DEST / 'LICENSE.md').write_bytes(fetch('LICENSE.md'))
    (DEST / 'credit_names.txt').write_text('\n'.join(line.rstrip() for line in fetch('credit_names.txt').decode().splitlines()) + '\n')
    count = sum(len(set(s['src'] for s in v['states'].values())) for v in data.values())
    print(f'Imported {len(data)} species, {count} atlases with 8 directions each.')
