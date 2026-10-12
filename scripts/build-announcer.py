#!/usr/bin/env python3
"""Original arcade creature announcer, built locally without a voice service."""
from pathlib import Path
import tempfile
from importlib.util import spec_from_file_location, module_from_spec
spec=spec_from_file_location('cadence',Path(__file__).with_name('build-cadence.py'))
base=module_from_spec(spec);spec.loader.exec_module(base)
CALLS={'touchdown':('Touch! Down!',1.52),'good':("It’s good!",1.5),'twoPoint':('Two points!',1.5),'noGood':('No good!',1.45),'coinToss':('Call the toss!',1.42),'heads':('Heads!',1.5),'tails':('Tails!',1.5)}
if __name__=='__main__':
 with tempfile.TemporaryDirectory(prefix='pokebowl-announcer-') as tmp:
  for name,(text,pitch) in CALLS.items():
   samples=base.creature(base.voice(text,Path(tmp)/(name+'.wav')),pitch)
   base.write(base.ROOT/'dist/assets'/('fx-'+name+'.wav'),samples)
   print(name,round(len(samples)/base.RATE,3),'seconds')
