'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const Sim=require('../dist/sim.js'),Draft=require('../dist/draft.js'),Motion=require('../dist/motion.js'),FX=require('../dist/fx.js');
const context=new Proxy({measureText:t=>({width:t.length*6})},{get:(o,k)=>k in o?o[k]:(...args)=>{args.forEach(v=>{if(typeof v==='number')assert.ok(Number.isFinite(v),String(k)+' needs finite coordinates')});}});
const window={PokeMotion:Motion,PokeDances:require('../dist/dances.js')};vm.runInNewContext(fs.readFileSync('dist/stadium.js','utf8'),{window});const stadium=new window.PokeStadium.Stadium({getContext:()=>context},{}),elements=new Set();let strikes=0;
for(let id=1;id<=151;id++){
 const portrait=fs.readFileSync(`dist/assets/portraits/${id}.png`);assert.equal(portrait.toString('hex',0,8),'89504e470d0a1a0a');assert.ok(portrait.readUInt32BE(16)>=400,'Each portrait has genuine detail');
 const qb=Draft.player(id,'QB'),off=Sim.roster.filter(p=>p.side==='offense').map(p=>p.pos==='QB'?qb:p),roster=[...off,...Sim.roster.filter(p=>p.side==='defense')];
 for(const team of [0,1]){
  const target=off.find(p=>p.pos==='WR'),u={...Sim.ultimates.signature(id),team,pos:'QB'},event={team,start:20,end:35,gain:15,first:30,type:'pass',playCall:'quick',qb:id,target:target.id,defender:roster.find(p=>p.side==='defense').id,complete:true,ultimates:[u]},motion=new Motion.PlayMotion(event,roster),cue=motion.powerCues[0];
  assert.ok(cue.at>=motion.snap&&cue.end<=motion.duration&&cue.end>cue.at+.3);
  const cues=FX.cuesBetween(motion,event,cue.at-.01,cue.at+.3);assert.ok(cues.some(c=>c.kind==='charge'));assert.ok(cues.some(c=>c.kind==='ultimate'));elements.add(u.element);
  for(const age of [.12,.4,.7])for(const fullEffects of [false,true]){
   const phase=cue.at+age,frame=motion.frame(phase),actor=frame.players.find(p=>p.team===team&&p.p.id===id);assert.ok(actor.power);if(age<.32){assert.equal(actor.pose,'ultimate');assert.equal(actor.move,0)}
   stadium.draw({frame,motion,event,phase,elapsed:phase,ambientTime:phase,camera:29,fullEffects,shake:0,particles:[],replaying:false,paused:false,waiting:false,squads:[roster,roster],score:[0,0]});strikes++;
  }
 }
}
assert.equal(elements.size,15,'Every elemental ultimate rendering path must be exercised');
console.log(`PASS: 151 detailed portraits, ${strikes} finite ultimate renders across all 15 elements, both teams, charge/strike sounds, caster wind-ups and reduced effects.`);
