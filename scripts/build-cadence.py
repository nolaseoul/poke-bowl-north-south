#!/usr/bin/env python3
"""Make original creature-style quarterback speech with the installed macOS voice."""
from pathlib import Path
import array, math, subprocess, tempfile, wave
ROOT=Path(__file__).resolve().parents[1]
RATE=32000

def voice(text,path):
    aiff=path.with_suffix('.aiff')
    subprocess.run(['say','-v','Reed (English (US))','-r','215','-o',str(aiff),text],check=True)
    subprocess.run(['afconvert','-f','WAVE','-d','LEI16@32000','-c','1',str(aiff),str(path)],check=True)
    with wave.open(str(path)) as wav:
        samples=array.array('h',wav.readframes(wav.getnframes()))
    if not samples:raise RuntimeError('The installed voice did not produce audio')
    peak=max(abs(x) for x in samples)
    active=[i for i,x in enumerate(samples) if abs(x)>peak*.012]
    start=max(0,active[0]-int(RATE*.008));end=min(len(samples),active[-1]+int(RATE*.025))
    return [x/32768 for x in samples[start:end]]

def creature(samples,pitch):
    result=[];low=0
    for i in range(int((len(samples)-1)/pitch)):
        # Repitch the whole voice, including formants, for a tiny animated creature.
        pos=i*pitch;at=int(pos);u=pos-at;x=samples[at]*(1-u)+samples[at+1]*u
        low+=.16*(x-low);bright=x*.78+(x-low)*.32
        wobble=1+.055*math.sin(2*math.pi*31*i/RATE)
        result.append(math.tanh(bright*wobble*1.65))
    peak=max(abs(x) for x in result)
    n=len(result);edge=int(RATE*.006)
    return [int(x/peak*26500*min(1,i/edge,(n-1-i)/edge)) for i,x in enumerate(result)]

def write(path,samples):
    with wave.open(str(path),'wb') as wav:
        wav.setparams((1,2,RATE,0,'NONE','not compressed'))
        wav.writeframes(array.array('h',samples).tobytes())

if __name__=='__main__':
    with tempfile.TemporaryDirectory(prefix='poke-bowl-voice-') as tmp:
        tmp=Path(tmp);hut=voice('Hut!',tmp/'hut.wav');hike=voice('Hike choo!',tmp/'hike.wav')
        clips={name:creature(raw,pitch) for name,raw,pitch in [('ready',hut,1.8),('set',hut,1.95),('hut',hut,2.1),('hike',hike,1.85)]}
        for name,samples in clips.items():
            write(ROOT/'dist/assets'/('fx-'+name+'.wav'),samples)
            print(name,round(len(samples)/RATE,3),'seconds')
        # Review copy; not a game asset and never fetched by the client.
        mix=[0]*int(RATE*1.7)
        for name,at in [('ready',.05),('set',.39),('hut',.73),('hike',1.08)]:
            for i,x in enumerate(clips[name]):mix[int(at*RATE)+i]+=x
        write(Path('/tmp/poke-bowl-hike-chu.wav'),mix)
