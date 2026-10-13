'use strict';
const assert=require('node:assert/strict');const {ChipMusic,tracks,patch,scoreStep,celebrationScore,RATE}=require('../dist/music.js');let scheduled=0,intervals=new Set(),nextId=1,deviceRate=48000;
const param=()=>({value:0,setValueAtTime(v,t){assert.ok(Number.isFinite(v)&&Number.isFinite(t))},linearRampToValueAtTime(v,t){assert.ok(Number.isFinite(v)&&Number.isFinite(t))},exponentialRampToValueAtTime(v,t){assert.ok(v>0&&Number.isFinite(t))},setTargetAtTime(v,t){assert.ok(Number.isFinite(v)&&Number.isFinite(t))},cancelScheduledValues(){}});
const node=()=>({connect(){},disconnect(){},gain:param(),frequency:param(),threshold:param(),knee:param(),ratio:param(),attack:param(),release:param(),delayTime:param(),pan:param(),start(t){assert.ok(Number.isFinite(t));scheduled++},stop(t){assert.ok(t===undefined||Number.isFinite(t))}});
global.AudioContext=class{constructor(){this.currentTime=0;this.sampleRate=deviceRate;this.state='running';this.destination={}}createGain(){return node()}createBiquadFilter(){return node()}createDynamicsCompressor(){return node()}createStereoPanner(){return node()}createConvolver(){const n=node(),rate=this.sampleRate;Object.defineProperty(n,'buffer',{set(b){assert.equal(b.sampleRate,rate,'Reverb must use the output-device sample rate')}});return n}createDelay(){return node()}createBufferSource(){return node()}createBuffer(channels,length,rate){const data=Array.from({length:channels},()=>new Float32Array(length));return{sampleRate:rate,duration:length/rate,getChannelData(ch){return data[ch]}}}async resume(){this.state='running'}};
global.setInterval=()=>{let id=nextId++;intervals.add(id);return id};global.clearInterval=id=>intervals.delete(id);
(async()=>{
 assert.equal(new ChipMusic().track,'football','New listeners get the football fanfare');
 const hornPhrase=Array.from({length:16},(_,i)=>scoreStep(tracks.football,i,60/130/4)).flat().filter(e=>e.instrument==='brass');assert.ok(hornPhrase.some(e=>e.duration>.3),'Football hook must sustain horn phrases instead of constant sixteenth notes');assert.ok(hornPhrase.every(e=>e.note<90),'The main fanfare stays in a full-bodied horn register');
 const scores=['touchdown','extraPoint','twoPoint','fieldGoal','final'].map(celebrationScore);
 assert.equal(new Set(scores.map(s=>JSON.stringify(s.events))).size,5,'Each score type has a different victory hook');
 assert.ok(scores[0].duration>3.5&&scores[0].duration<4.3);assert.ok(scores[1].duration<scores[2].duration&&scores[2].duration<scores[0].duration);
 for(const score of scores){assert.ok(new Set(score.events.map(e=>e.instrument)).size>=8);for(const e of score.events)assert.ok(e.at>=0&&e.duration>0&&e.at+e.duration<=score.duration&&e.gain>0);}
 const muted=new ChipMusic(),beforeMuted=scheduled;muted.celebrate('touchdown');assert.equal(scheduled,beforeMuted,'Music mute suppresses victory stingers');
 const colors=new Map();
 for(const instrument of ['lead','bass','pad','keys','bell','brass','kick','snare','hat','shaker','crash','guitar','tom']){
  const pcm=patch(60,.3,instrument);assert.ok(pcm.length>RATE*.3);let energy=0;for(const v of pcm){assert.ok(Number.isFinite(v)&&Math.abs(v)<=1);assert.ok(Math.abs(v*32767-Math.round(v*32767))<.002,'Samples must use 16-bit quantization');energy+=v*v;}
  assert.ok(Math.sqrt(energy/pcm.length)>.01,`${instrument} must be audible`);assert.ok(Math.abs(pcm.at(-1))<.002,'Envelope must end near zero');colors.set(instrument,pcm.slice(100,120).join(','));
 }
 assert.equal(new Set(colors.values()).size,colors.size,'Every instrument needs a distinct timbre');
 for(const id of Object.keys(tracks)){
  const music=new ChipMusic();music.setTrack(id);await music.play();assert.equal(music.enabled,true);assert.equal(intervals.size,1);await music.play();assert.equal(intervals.size,1);
  assert.equal(tracks[id].bpm,130);const opening=scoreStep(tracks[id],0,60/130/4);for(const instrument of ['lead','bass','kick','guitar'])assert.ok(opening.some(e=>e.instrument===instrument),'First beat must hit immediately');
  const tick=60/tracks[id].bpm/4,used=new Set();let left=false,right=false;
  for(let step=0;step<1024;step++){scoreStep(tracks[id],step,tick).forEach(e=>{used.add(e.instrument);left||=e.pan<0;right||=e.pan>0;assert.ok(e.duration>0&&e.gain>0&&e.offset>=0);});music.noteStep(step,step*tick,tick);}
  assert.ok(used.size>=10&&left&&right,'Arrangement needs a full instrument palette and stereo placement');
  const intro=Array.from({length:64},(_,i)=>scoreStep(tracks[id],i,tick).length).reduce((a,b)=>a+b,0),chorus=Array.from({length:64},(_,i)=>scoreStep(tracks[id],256+i,tick).length).reduce((a,b)=>a+b,0);assert.ok(chorus>intro*1.3,'The chorus must lift beyond the intro');
  assert.ok(music.cache.size<=192,'PCM cache must stay bounded');
  music.setVolume(2);assert.equal(music.volume,1);music.setVolume(-1);assert.equal(music.volume,0);music.setVolume(NaN);assert.equal(music.volume,0);
  for(const kind of ['touchdown','extraPoint','twoPoint','fieldGoal','final']){const before=scheduled;music.celebrate(kind);assert.equal(scheduled-before,celebrationScore(kind).events.length);assert.ok(music.duckUntil>=music.context.currentTime+.45+celebrationScore(kind).duration)}music.stop();assert.equal(music.enabled,false);assert.equal(intervals.size,0);assert.equal(music.voices.size,0);
  await music.play();music.setTrack(id==='victory'?'rivalry':'victory');assert.equal(music.voices.size,0);music.stop();assert.equal(intervals.size,0);
 }
 const race=new ChipMusic();const start=race.play();race.stop();await start;assert.equal(race.enabled,false);assert.equal(intervals.size,0);
 for(const rate of [44100,96000]){deviceRate=rate;const device=new ChipMusic();await device.play();device.stop();assert.equal(intervals.size,0)}
 console.log(`PASS: three 64-bar stereo arrangements, 13 distinct 16-bit PCM instruments, ${scheduled} scheduled voices, chorus dynamics, bounded cache, volume bounds, single scheduler, restart, track switch, fanfares and cancelled startup.`);
})().catch(e=>{console.error(e);process.exitCode=1});
