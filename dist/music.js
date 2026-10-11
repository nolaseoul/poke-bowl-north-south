/* Original stadium arrangements. Procedural 16-bit PCM instruments; no game recordings. */
(function(root){
'use strict';
const RATE=32000,TAU=Math.PI*2;
const tracks={
 victory:{name:'Victory Voltage · SNES Battle Mix',bpm:130,roots:[50,46,43,45,50,46,43,45],chords:[[0,3,7,12],[0,4,7,12],[0,3,7,10],[0,4,7,10],[0,3,7,12],[0,4,7,12],[0,3,7,10],[0,4,7,10]],melody:[
 [86,81,86,0,89,88,86,81,84,81,79,81,84,85,86,0],
 [86,82,89,0,94,93,89,86,89,86,82,81,82,86,89,0],
 [86,79,82,0,89,87,86,82,79,82,86,89,91,89,86,82],
 [85,81,88,0,93,91,88,85,81,85,88,91,93,91,88,85],
 [98,93,98,0,101,100,98,93,96,93,91,93,96,97,98,0],
 [94,89,94,0,98,97,94,89,94,89,86,89,94,93,89,86],
 [91,86,89,0,94,93,91,89,86,89,91,94,98,94,91,89],
 [93,88,85,81,88,85,81,76,81,85,88,91,93,97,98,0]]},
 rivalry:{name:'Midnight Rival · SNES Boss Mix',bpm:130,roots:[52,48,53,47,52,50,48,47],chords:[[0,3,7,12],[0,4,7,12],[0,4,7,12],[0,4,7,10],[0,3,7,12],[0,4,7,10],[0,4,7,12],[0,4,7,10]],melody:[
 [88,83,88,0,91,90,88,83,89,88,83,79,83,86,88,0],
 [91,88,84,0,88,91,96,95,91,88,84,83,84,88,91,0],
 [89,84,89,0,93,92,89,84,89,93,96,93,89,88,84,0],
 [87,83,90,0,95,93,90,87,83,87,90,93,95,93,90,87],
 [100,95,100,0,103,102,100,95,101,100,95,91,95,98,100,0],
 [98,93,90,0,93,98,102,100,98,93,90,86,90,93,98,0],
 [96,91,88,0,91,96,100,98,96,91,88,84,88,91,96,0],
 [95,90,87,83,90,87,83,78,83,87,90,93,95,99,100,0]]}
};
// Each patch is a small PCM sample with a shaped envelope, quantized to 16 bits.
// Keeping synthesis pure also lets the release checks render the exact score offline.
function patch(note,duration,instrument='lead',rate=RATE){
 const tail=['lead','bass','keys','brass','bell','guitar'].includes(instrument)?.035:.08;
 const length=Math.ceil((duration+tail)*rate),out=new Float32Array(length),freq=440*2**((note-69)/12);let seed=913+note*71,phase=0;
 const noise=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2147483648-1};
 for(let i=0;i<length;i++){
  const t=i/rate,release=Math.max(0,Math.min(1,(duration+tail-t)/tail));let wave=0,env=1;
  if(instrument==='kick'){phase+=TAU*(46+115*Math.exp(-t*34))/rate;wave=Math.sin(phase)*.88+noise()*.3*Math.exp(-t*120)+Math.sin(TAU*1800*t)*.16*Math.exp(-t*170);env=Math.exp(-t*17);}
  else if(instrument==='snare'){wave=noise()*.78+Math.sin(TAU*185*t)*.35+Math.sin(TAU*2700*t)*.18*Math.exp(-t*90);env=Math.exp(-t*26)*(1-Math.exp(-t*1800));}
  else if(instrument==='hat'||instrument==='shaker'){wave=noise()*.65+(Math.sin(TAU*7261*t)+Math.sin(TAU*10381*t))*.12;env=Math.exp(-t*(instrument==='hat'?70:38));}
  else if(instrument==='crash'){wave=noise()*.65+Math.sin(TAU*5371*t)*Math.sin(TAU*7213*t)*.22;env=Math.exp(-t*5)*(1-Math.exp(-t*700));}
  else if(instrument==='tom'){phase+=TAU*(freq*1.6+55*Math.exp(-t*28))/rate;wave=Math.sin(phase)*.9+noise()*.15*Math.exp(-t*65);env=Math.exp(-t*15);}
  else if(instrument==='guitar'){for(let h=1;h<=Math.min(12,Math.floor(rate*.45/freq));h++)wave+=Math.sin(TAU*freq*h*t)*Math.exp(-h*.13-t*h*1.8)/h;wave=Math.tanh(wave*3)*.8;env=(1-Math.exp(-t*2200))*Math.exp(-t*5);}
  else if(instrument==='bass'){wave=Math.tanh((Math.sin(TAU*freq*t)*.72+Math.sin(TAU*freq*t*2)*.24+Math.sin(TAU*freq*t*3)*.2+Math.sin(TAU*freq*t*5)*.09)*1.6)*.85;env=(1-Math.exp(-t*1200))*(.48+.52*Math.exp(-t*20));}
  else if(instrument==='keys'){wave=Math.sin(TAU*freq*t+2.4*Math.exp(-t*12)*Math.sin(TAU*freq*t*2))*.72+Math.sin(TAU*freq*t*3)*.12*Math.exp(-t*6);env=(1-Math.exp(-t*1600))*Math.exp(-t*3.6);}
  else if(instrument==='bell'){wave=Math.sin(TAU*freq*t+1.1*Math.exp(-t*5)*Math.sin(TAU*freq*t*3.01))*.8;env=(1-Math.exp(-t*600))*Math.exp(-t*5);}
  else if(instrument==='pad'){for(let h=1;h<=5;h++)wave+=(Math.sin(TAU*freq*h*.998*t)+Math.sin(TAU*freq*h*1.002*t))*(h%2?1:.35)/(h*5);env=Math.min(1,t/.14)*Math.min(1,release*2);}
  else if(instrument==='brass'){for(let h=1;h<=Math.min(9,Math.floor(rate*.45/freq));h++)wave+=Math.sin(TAU*freq*h*t)*Math.exp(-h*.16)/4;env=(1-Math.exp(-t*950))*(.45+.55*Math.exp(-t*20));}
  else{const vibrato=1+.002*Math.sin(TAU*5.2*t)*Math.min(1,t*5);for(let h=1;h<=Math.min(10,Math.floor(rate*.45/freq));h++)wave+=Math.sin(TAU*freq*h*vibrato*t)*(h%2?1:.65)/(h*1.8);wave+=Math.sin(TAU*freq*1.004*t)*.13;env=(1-Math.exp(-t*1500))*(.48+.52*Math.exp(-t*24));}
  out[i]=Math.round(Math.max(-1,Math.min(1,wave*env*release)) *32767)/32767;
 }
 return out;
}
function scoreStep(track,step,tick){
 const bar=Math.floor(step/16)%64,s=step%16,index=bar%8,section=Math.floor(bar/8),rootNote=track.roots[index],chord=track.chords[index],events=[];
 const add=(note,duration,instrument,gain,pan=0,wet=.1,offset=0)=>{if(note)events.push({note,duration,instrument,gain,pan,wet,offset})};
 const intro=section===0,breakdown=section===4,chorus=[2,3,6,7].includes(section);
 const melody=track.melody[index][s],accent=s%4===0;
 // The opening hits immediately. Later choruses add harmony, octave arps and fills.
 if(!breakdown||s%2===0)add(melody,tick*(accent?1.1:.66),'lead',intro?.19:.23,-.12,.08);
 if(chorus&&melody){add(melody-12,tick*.85,'brass',.095,.25,.1);if(accent)add(melody-24,tick*1.1,'keys',.07,-.4,.09);}
 if(s%2===0||[3,7,11,15].includes(s))add(rootNote-12+(s===7||s===15?7:s===10?12:0),tick*.78,'bass',.39,0,.015);
 if([0,3,6,8,11,14].includes(s)){
  [0,7].forEach((n,i)=>add(rootNote+n,tick*.85,'guitar',.14, i? .48:-.48,.04));
  if(!intro)chord.slice(0,3).forEach((n,i)=>add(rootNote+12+n,tick*1.2,'keys',.045,-.25+i*.25,.13));
 }
 if(!intro&&s===0)chord.forEach((n,i)=>add(rootNote+12+n,tick*12,'pad',.025,(i%2?1:-1)*.6,.2));
 if(!intro&&s%2===1)add(rootNote+24+chord[(s+bar)%4],tick*.65,'bell',chorus?.075:.045,.55,.15);
 if(chorus&&s%2===0)add(rootNote+24+chord[(s/2)%4],tick*.75,'keys',.055,-.55,.1);
 if(!breakdown||s%8===0){
  if([0,6,8,11].includes(s)||chorus&&s===14)add(36,.24,'kick',.58,0,0);
  if(s===4||s===12)add(40,.18,'snare',.4,-.08,.045);
  if(s%2===0)add(42,.065,'hat',.08,.35,.02);
  if(!intro&&s%2===1)add(44,.07,'shaker',.04,-.4,.04);
 }
 if(bar%8===7&&s>=12){add(40,.13,'snare',.14+(s-12)*.035,-.15,.04);add([55,52,48,43][s-12],.2,'tom',.22,(s-13.5)*.25,.07);}
 if(s===0&&bar%8===0)add(49,.85,'crash',.16,.2,.15);
 return events;
}
class ChipMusic{
 constructor(){this.context=null;this.master=null;this.track='victory';this.volume=.35;this.enabled=false;this.step=0;this.nextTime=0;this.timer=null;this.voices=new Set();this.duckUntil=0;this.onChange=()=>{};this.revision=0;this.cache=new Map();this.buses=[];}
 async prepare(){
  if(!this.context){
   const Audio=root.AudioContext||root.webkitAudioContext;if(!Audio)throw Error('This browser does not support Web Audio.');this.context=new Audio();const c=this.context;
   this.master=c.createGain();this.master.gain.value=0;const compressor=c.createDynamicsCompressor();compressor.threshold.value=-13;compressor.knee.value=18;compressor.ratio.value=3;compressor.attack.value=.006;compressor.release.value=.18;this.master.connect(compressor);compressor.connect(c.destination);
   this.dry=c.createGain();this.dry.gain.value=.7;this.dry.connect(this.master);
   const impulse=c.createBuffer(2,Math.ceil(c.sampleRate*1.65),c.sampleRate);let seed=481;for(let ch=0;ch<2;ch++){const data=impulse.getChannelData(ch);for(let i=0;i<data.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;data[i]=(seed/2147483648-1)*Math.exp(-i/c.sampleRate*4.8)*.28;}}
   this.reverb=c.createConvolver();this.reverb.buffer=impulse;this.room=c.createGain();this.room.gain.value=.32;this.reverb.connect(this.room);this.room.connect(this.master);
   this.delay=c.createDelay(1);this.delay.delayTime.value=60/tracks[this.track].bpm*.75;this.echo=c.createGain();this.echo.gain.value=.08;this.feedback=c.createGain();this.feedback.gain.value=.24;this.delay.connect(this.echo);this.echo.connect(this.master);this.delay.connect(this.feedback);this.feedback.connect(this.delay);
  }
  if(this.context.state!=='running')await this.context.resume();
 }
 clearVoices(){for(const voice of [...this.voices]){try{voice.stop()}catch{}this.voices.delete(voice)}this.buses.forEach(n=>n.disconnect());this.buses=[];}
 async play(){const revision=++this.revision;await this.prepare();if(revision!==this.revision)return;if(this.enabled&&this.timer!==null)return;this.enabled=true;this.step=0;this.nextTime=this.context.currentTime+.04;this.master.gain.cancelScheduledValues(this.context.currentTime);this.master.gain.setTargetAtTime(this.volume,this.context.currentTime,.04);this.schedule();this.timer=setInterval(()=>this.schedule(),25);this.onChange();}
 stop(){this.revision++;this.enabled=false;if(this.timer!==null)clearInterval(this.timer);this.timer=null;if(this.context){this.master.gain.cancelScheduledValues(this.context.currentTime);this.master.gain.setTargetAtTime(0,this.context.currentTime,.025);this.clearVoices()}this.onChange();}
 setVolume(value){if(!Number.isFinite(value))return;this.volume=Math.max(0,Math.min(1,value));if(this.context&&this.enabled)this.master.gain.setTargetAtTime(this.volume,this.context.currentTime,.04)}
 setTrack(id){if(!tracks[id]||id===this.track)return;this.track=id;this.step=0;if(this.context){this.clearVoices();this.nextTime=this.context.currentTime+.05;this.delay.delayTime.setValueAtTime(60/tracks[id].bpm*.75,this.nextTime)}this.onChange();}
 tone(note,time,duration,instrument='lead',volume=.1,pan=0,wet=.15){
  if(!note)return;const c=this.context,key=[note,duration.toFixed(3),instrument].join(':');let buffer=this.cache.get(key);
  if(!buffer){const data=patch(note,duration,instrument);buffer=c.createBuffer(1,data.length,RATE);buffer.getChannelData(0).set(data);this.cache.set(key,buffer);if(this.cache.size>192)this.cache.delete(this.cache.keys().next().value)}
  const source=c.createBufferSource(),gain=c.createGain(),stereo=c.createStereoPanner(),send=c.createGain();source.buffer=buffer;gain.gain.value=volume;stereo.pan.value=pan;send.gain.value=wet;source.connect(gain);gain.connect(stereo);stereo.connect(this.dry);stereo.connect(send);send.connect(this.reverb);if(instrument==='lead'||instrument==='bell')send.connect(this.delay);
  this.voices.add(source);source.onended=()=>{this.voices.delete(source);source.disconnect();gain.disconnect();stereo.disconnect();send.disconnect()};source.start(time);source.stop(time+buffer.duration+.01);
 }
 schedule(){if(!this.enabled||this.context.state!=='running')return;const tick=60/tracks[this.track].bpm/4;if(this.nextTime<this.context.currentTime-.15)this.nextTime=this.context.currentTime+.025;let count=0;while(this.nextTime<this.context.currentTime+.12&&count++<12){this.noteStep(this.step++,this.nextTime,tick);this.nextTime+=tick}}
 noteStep(step,time,tick){const duck=time<this.duckUntil?.4:1;scoreStep(tracks[this.track],step,tick).forEach(e=>this.tone(e.note,time+e.offset,e.duration,e.instrument,e.gain*duck,e.pan,e.wet));}
 celebrate(final=false){if(!this.enabled||!this.context)return;const at=this.context.currentTime+.02;this.duckUntil=at+1.5;const phrase=final?[79,83,86,88,86,91]:[76,79,83,86,88];phrase.forEach((note,i)=>{this.tone(note,at+i*.12,i===phrase.length-1?.65:.15,'brass',.2,-.15,.28);this.tone(note-12,at+i*.12,.25,'bell',.12,.3,.3)});[48,52,55,59].forEach((n,i)=>this.tone(n,at,.95,'keys',.1,i*.2-.3,.35));this.tone(49,at,1,'crash',.16,.15,.3)}
}
root.PokeMusic={ChipMusic,tracks,patch,scoreStep,RATE};if(typeof module!=='undefined')module.exports=root.PokeMusic;
})(typeof window!=='undefined'?window:globalThis);
