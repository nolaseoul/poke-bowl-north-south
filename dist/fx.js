/* Original field effects and a squeaky creature-style hut/hike-chu cadence. */
(function(root){
'use strict';
const RATE=32000,TAU=Math.PI*2;
const cadence=Object.freeze(['ready','set','hut','hike']);
const announcements=Object.freeze(['touchdown','good','twoPoint','noGood','coinToss','heads','tails']);
const voiceClips=Object.freeze([...cadence,...announcements]);
const durations={touchdown:1,good:.75,twoPoint:.9,noGood:.7,coinToss:1,heads:.5,tails:.5,ready:.196,set:.181,hut:.168,hike:.318,snap:.12,throw:.23,catch:.16,hit:.28,kick:.24,cheer:.85,whistle:.32,ultimate:.72,charge:.3};
function effect(kind,rate=RATE){
 const duration=durations[kind];if(!duration)return new Float32Array(0);
 const out=new Float32Array(Math.ceil(duration*rate));let seed=719,phase=0,low=0;
 for(let i=0;i<out.length;i++){
  const t=i/rate,u=t/duration;seed=(Math.imul(seed,1664525)+1013904223)>>>0;const noise=seed/2147483648-1;low+=.12*(noise-low);let v=0;
  if(kind==='hit'){phase+=TAU*(48+115*Math.exp(-t*36))/rate;v=Math.sin(phase)*Math.exp(-t*19)*.85+noise*Math.exp(-t*65)*.5+low*Math.exp(-t*14)*.45;}
  else if(kind==='charge'){phase+=TAU*(180+u*u*1100)/rate;v=(Math.sin(phase)*.5+noise*.15)*u;}
  else if(kind==='ultimate'){const note=[440,660,880,1320][Math.min(3,Math.floor(u*4))];phase+=TAU*note/rate;v=(Math.sin(phase)*.6+Math.sin(phase*2)*.2)*Math.sin(Math.PI*u)**.7;}
  else if(kind==='catch')v=(noise-low)*Math.exp(-t*75)*.75+Math.sin(TAU*210*t)*Math.exp(-t*40)*.55;
  else if(kind==='snap'||kind==='kick'){phase+=TAU*(kind==='kick'?170-95*u:320-200*u)/rate;v=Math.sin(phase)*Math.exp(-t*35)*.45+noise*Math.exp(-t*55)*.55;}
  else if(kind==='throw'){phase+=TAU*(1500-1250*u)/rate;v=((noise-low)*.7+Math.sin(phase)*.22)*Math.sin(Math.PI*u)**1.5;}
  else if(kind==='whistle')v=(Math.sin(TAU*2350*t+1.5*Math.sin(TAU*42*t))*.42+Math.sin(TAU*3120*t)*.18)*Math.min(1,t*180)*Math.min(1,(duration-t)*35);
  else if(kind==='cheer')v=(low*.9+noise*.16+Math.sin(TAU*615*t+Math.sin(TAU*7*t))*Math.sin(TAU*12*t)*.09)*Math.sin(Math.PI*u);
  else{ // Offline fallback if a cadence voice clip cannot load.
   const second=kind==='hike'&&u>.48,pitch=(kind==='ready'?320:kind==='set'?347:kind==='hut'?374:second?460:390)*(1+.07*Math.sin(TAU*19*t));phase+=TAU*pitch/rate;
   const vowel=(Math.sin(phase)+Math.sin(phase*(second?2:3))*.35+Math.sin(phase*5)*.18)*.38;
   const syllable=kind==='hike'?(second?(u-.48)/.52:u/.48):u;
   v=(syllable<.14?noise*.42:vowel)*Math.sin(Math.PI*syllable)**.65;
  }
  const fade=Math.min(1,t*1400)*Math.min(1,(duration-t)*180);out[i]=Math.round(Math.tanh(v*1.35)*fade*32767)/32767;
 }
 return out;
}
function cuesBetween(m,e,from,to,replay=false){
 const cues=[];const add=(at,kind)=>{if(from<at&&to>=at)cues.push({at,kind})};
 if(e.returner){add(m.release,'kick');if(!e.touchback){add(m.catchAt,'catch');add(m.contact,e.touchdown?'cheer':'hit');for(const cue of m.powerCues||[]){add(cue.at,'charge');add(cue.at+.28,'ultimate')}}if(!e.touchdown)add(m.resolveAt,'whistle');return cues.sort((a,b)=>a.at-b.at)}
 if(!replay){add(-.8,'ready');add(-.46,'set');add(-.12,'hut');add(m.snap-.32,'hike')}
 add(m.snap,'snap');if(m.powerCues){for(const cue of m.powerCues){add(cue.at,'charge');add(cue.at+.28,'ultimate')}}else if(e.ultimates?.length)add((m.ultimateAt??m.snap)+.04,'ultimate');
 if(m.kick)add(1.1,'kick');else if(!m.run&&!m.sack)add(m.release,'throw');
 if(e.complete||e.interception)add(m.catchAt,'catch');
 if(e.touchdown)add(m.contact,'cheer');else if(!m.kick&&(m.run||m.sack||e.complete||e.fumble))add(m.contact,'hit');
 if(!e.touchdown){add(m.resolveAt,'whistle');if(e.score>0||e.safety)add(m.resolveAt,'cheer');}
 return cues.sort((a,b)=>a.at-b.at);
}
class FieldFX{
 constructor(){this.context=null;this.master=null;this.enabled=true;this.voices=new Set();this.cache=new Map();this.clips=new Map();this.loading=null;this.assets=null;this.revision=0;}
 preload(){if(!this.assets&&root.fetch)this.assets=Promise.all(voiceClips.map(async kind=>{try{const response=await root.fetch(`assets/fx-${kind}.wav`);if(!response.ok)return null;return[kind,await response.arrayBuffer()]}catch{return null}}));return this.assets;}
 async prepare(){
  if(!this.enabled)return;
  if(!this.context){const Audio=root.AudioContext||root.webkitAudioContext;if(!Audio)return;const c=this.context=new Audio();this.master=c.createGain();this.master.gain.value=.62;const limiter=c.createDynamicsCompressor();limiter.threshold.value=-9;limiter.knee.value=6;limiter.ratio.value=5;limiter.attack.value=.003;limiter.release.value=.12;this.master.connect(limiter);limiter.connect(c.destination);}
  if(this.context.state!=='running')await this.context.resume();
  if(!this.loading){this.loading=Promise.resolve(this.preload()).then(async assets=>{for(const item of assets||[]){if(!item)continue;try{this.clips.set(item[0],await this.context.decodeAudioData(item[1]))}catch{}}});}
  await this.loading;
 }
 async announce(kind){const revision=this.revision;try{await this.prepare();if(revision===this.revision)this.play(kind)}catch{}}
 play(kind,replay=false){
  const c=this.context;if(!this.enabled||!c||c.state!=='running')return;
  let buffer=this.clips.get(kind)||this.cache.get(kind);if(!buffer){const data=effect(kind);if(!data.length)return;buffer=c.createBuffer(1,data.length,RATE);buffer.getChannelData(0).set(data);this.cache.set(kind,buffer);}
  const source=c.createBufferSource(),gain=c.createGain();source.buffer=buffer;gain.gain.value=(voiceClips.includes(kind)?.9:kind==='hit'?.85:kind==='cheer'?.5:.68)*(replay?.65:1);source.connect(gain);gain.connect(this.master);this.voices.add(source);source.onended=()=>{this.voices.delete(source);source.disconnect();gain.disconnect()};source.start(c.currentTime);source.stop(c.currentTime+buffer.duration+.01);
 }
 stop(){this.revision++;for(const source of [...this.voices]){try{source.stop()}catch{}}this.voices.clear();}
 setEnabled(value){this.enabled=!!value;if(!this.enabled)this.stop();}
}
root.PokeFX={FieldFX,effect,cuesBetween,RATE,cadence,announcements,voiceClips};if(typeof module!=='undefined')module.exports=root.PokeFX;
})(typeof window!=='undefined'?window:globalThis);
