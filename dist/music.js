/* Original stadium arrangements. Procedural 16-bit PCM instruments; no game recordings. */
(function(root){
'use strict';
const RATE=32000,TAU=Math.PI*2;
const tracks={
 victory:{name:'Route to Victory · Stadium Mix',bpm:120,roots:[48,55,57,53,48,55,50,55],chords:[[0,4,7,11],[0,4,7,9],[0,3,7,10],[0,4,7,11],[0,4,7,11],[0,4,7,9],[0,3,7,10],[0,4,7,10]],melody:[
 [76,0,79,0,83,81,79,0,76,0,74,76,0,79,0,0],
 [74,0,79,0,81,0,83,0,86,0,83,81,79,0,0,0],
 [76,0,81,0,84,0,83,81,79,0,76,0,74,76,0,0],
 [77,0,81,0,84,83,81,0,79,0,76,77,0,0,0,0],
 [79,0,83,0,86,0,84,83,81,0,79,0,76,0,79,0],
 [83,0,86,0,88,86,83,0,81,0,79,0,74,0,0,0],
 [77,0,81,0,84,0,86,84,81,0,79,77,0,74,0,0],
 [79,0,83,0,86,0,83,81,79,0,74,0,76,0,0,0]]},
 rivalry:{name:'Rivalry Night · Neon Mix',bpm:120,roots:[45,41,48,43,45,41,50,40],chords:[[0,3,7,10],[0,4,7,11],[0,4,7,11],[0,4,7,9],[0,3,7,10],[0,4,7,11],[0,3,7,10],[0,4,7,10]],melody:[
 [76,0,81,0,84,83,81,0,79,0,76,79,0,81,0,0],
 [77,0,81,0,84,0,88,0,86,84,81,0,79,0,0,0],
 [79,0,83,0,86,0,88,86,84,0,83,79,0,76,0,0],
 [74,0,79,0,83,81,79,0,78,0,74,0,79,0,0,0],
 [81,0,84,0,88,0,91,88,86,0,84,0,83,81,0,0],
 [84,0,88,0,89,88,84,0,81,0,79,0,77,0,0,0],
 [81,0,86,0,89,0,88,86,84,0,81,0,77,0,0,0],
 [80,0,83,0,88,0,86,83,80,0,76,0,80,0,0,0]]}
};
// Each patch is a small PCM sample with a shaped envelope, quantized to 16 bits.
// Keeping synthesis pure also lets the release checks render the exact score offline.
function patch(note,duration,instrument='lead',rate=RATE){
 const tail=['lead','bass','keys','brass','bell'].includes(instrument)?.035:.08;
 const length=Math.ceil((duration+tail)*rate),out=new Float32Array(length),freq=440*2**((note-69)/12);let seed=913+note*71,phase=0;
 const noise=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2147483648-1};
 for(let i=0;i<length;i++){
  const t=i/rate,release=Math.max(0,Math.min(1,(duration+tail-t)/tail));let wave=0,env=1;
  if(instrument==='kick'){phase+=TAU*(46+115*Math.exp(-t*34))/rate;wave=Math.sin(phase)*.88+noise()*.3*Math.exp(-t*120)+Math.sin(TAU*1800*t)*.16*Math.exp(-t*170);env=Math.exp(-t*17);}
  else if(instrument==='snare'){wave=noise()*.78+Math.sin(TAU*185*t)*.35+Math.sin(TAU*2700*t)*.18*Math.exp(-t*90);env=Math.exp(-t*26)*(1-Math.exp(-t*1800));}
  else if(instrument==='hat'||instrument==='shaker'){wave=noise()*.65+(Math.sin(TAU*7261*t)+Math.sin(TAU*10381*t))*.12;env=Math.exp(-t*(instrument==='hat'?70:38));}
  else if(instrument==='crash'){wave=noise()*.65+Math.sin(TAU*5371*t)*Math.sin(TAU*7213*t)*.22;env=Math.exp(-t*5)*(1-Math.exp(-t*700));}
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
 const add=(note,duration,instrument,gain,pan=0,wet=.15,offset=0)=>{if(note)events.push({note,duration,instrument,gain,pan,wet,offset})};
 const intro=section===0,breakdown=section===4,chorus=section===2||section===3||section===6||section===7,full=!intro&&!breakdown;
 let melody=track.melody[index][s];if(intro&&bar<4&&s%4!==0)melody=0;
 add(melody,tick*(s%4===0?1.35:.72),intro?'bell':'lead',intro?.16:.2,-.08,.1);
 if(chorus&&melody&&s%4===0)add(melody-12,tick*1.7,'brass',.09,.2,.12);
 if(s===0){chord.forEach((n,i)=>add(rootNote+12+n,tick*15,'pad',breakdown?.065:.043,(i%2?1:-1)*.6,.4));}
 if(s===0||s===6||s===10||s===14){chord.slice(0,3).forEach((n,i)=>add(rootNote+12+n,tick*(s===0?3:1.8),'keys',.07,-.32+i*.18,.25,i*.009));}
 if(s%2===0&&(!intro||bar>=4))add(rootNote-12+([6,14].includes(s)?7:s===10?12:0),tick*1.25,'bass',.34,0,.025);
 if(chorus&&s%2===1)add(rootNote+24+chord[(s+bar)%4],tick*1.3,'bell',.055,.5,.32);
 if(!breakdown&&(!intro||bar>=4)){
  if(s===0||s===8||full&&(s===6||s===11))add(36,.3,'kick',.5,0,0);
  if(s===4||s===12)add(40,.22,'snare',.32,-.06,.07);
  if(s%2===0)add(42,.085,'hat',.07,.38,.06);
  if(full&&s%2===1)add(44,.11,'shaker',s===15?.06:.035,-.4,.12,.012);
  if(bar%8===7&&full&&[13,14,15].includes(s))add(40,.15,'snare',.11+(s-13)*.035,(s-14)*.23,.13);
 }
 if(chorus&&s===0&&bar%8===0)add(49,1.05,'crash',.13,.2,.3);
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
