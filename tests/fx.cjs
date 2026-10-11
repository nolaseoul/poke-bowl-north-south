'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const {effect,cuesBetween,FieldFX,RATE}=require('../dist/fx.js');
const {PlayMotion}=require('../dist/motion.js'),{roster}=require('../dist/sim.js');
const kinds=['ready','set','hike','snap','throw','catch','hit','kick','cheer','whistle','ultimate'];
for(const kind of kinds){const data=effect(kind);let energy=0;for(const v of data){assert.ok(Number.isFinite(v)&&Math.abs(v)<1);energy+=v*v}assert.ok(energy/data.length>.001,kind+' must be audible');assert.ok(Math.abs(data[0])<.001&&Math.abs(data.at(-1))<.01,'No waveform clicks at edges')}
for(const kind of ['ready','set','hike']){const bytes=fs.readFileSync(`dist/assets/fx-${kind}.wav`);assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.toString('ascii',8,12),'WAVE');assert.ok(bytes.length>5000,'Bundled voice clip must contain audio')}
const event={team:0,start:20,end:35,gain:15,type:'pass',playCall:'quick',target:135,defender:123,complete:true};
for(const speed of [1,2,4]){
 const m=new PlayMotion(event,roster),heard=[];let old=-.85;
 while(old<m.duration){const next=Math.min(m.duration,old+(old<m.snap?Math.min(1/60,m.snap-old):speed/60));heard.push(...cuesBetween(m,event,old,next).map(e=>e.kind));old=next;}
 assert.deepEqual(heard,['ready','set','hike','snap','throw','catch','hit','whistle'],'Each cue must fire once and in order at every playback speed');
 assert.ok(!cuesBetween(m,event,-1,10,true).some(e=>['ready','set','hike'].includes(e.kind)),'Replay must not repeat live cadence');
 const incomplete={...event,complete:false};assert.ok(!cuesBetween(m,incomplete,-1,10).some(e=>e.kind==='catch'||e.kind==='hit'),'Incomplete pass must not sound caught or tackled');
 const sack={...event,type:'sack',complete:false};const cues=cuesBetween(new PlayMotion(sack,roster),sack,-1,10);assert.ok(cues.some(e=>e.kind==='hit')&&!cues.some(e=>e.kind==='throw'));
 const td={...event,touchdown:true};assert.ok(cuesBetween(m,td,-1,10).some(e=>e.kind==='cheer')&&!cuesBetween(m,td,-1,10).some(e=>e.kind==='hit'));
}
for(const score of [{...event,type:'kick',complete:false,score:3},{...event,type:'sack',complete:false,safety:true}]){const cues=cuesBetween(new PlayMotion(score,roster),score,-1,10);assert.equal(cues.filter(c=>c.kind==='cheer').length,1)}
const powered={...event,ultimates:[{id:135}]};assert.equal(cuesBetween(new PlayMotion(powered,roster),powered,-1,10).filter(c=>c.kind==='ultimate').length,1);
let starts=0,stops=0;
const param=()=>({value:0});const node=()=>({connect(){},disconnect(){},gain:param(),threshold:param(),knee:param(),ratio:param(),attack:param(),release:param(),start(){starts++},stop(){stops++}});
global.AudioContext=class{constructor(){this.state='running';this.currentTime=0;this.destination={}}createGain(){return node()}createDynamicsCompressor(){return node()}createBufferSource(){return node()}createBuffer(ch,length,rate){return{duration:length/rate,getChannelData:()=>new Float32Array(length)}}};
(async()=>{const fx=new FieldFX();await fx.prepare();for(const kind of kinds)fx.play(kind);assert.equal(starts,kinds.length);assert.equal(fx.voices.size,kinds.length);fx.setEnabled(false);assert.equal(fx.voices.size,0);assert.equal(stops,kinds.length*2);fx.play('hit');assert.equal(starts,kinds.length);fx.setEnabled(true);fx.play('hit');assert.equal(starts,kinds.length+1);fx.stop();assert.ok(fx.cache.size<=kinds.length);console.log('PASS: eleven distinct finite field effects, bundled quarterback calls, synchronized 1x/2x/4x cues, correct incomplete/sack/touchdown outcomes, replay cadence suppression and independent mute.');})().catch(e=>{console.error(e);process.exitCode=1});
