'use strict';
const assert=require('node:assert/strict');
const {Match,roster,calls,defenseCalls,firstRead,playHand}=require('../dist/sim.js');
const {PlayMotion,routes}=require('../dist/motion.js');
const {project}=require('../dist/stadium.js');
let seed=113;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
const samples={};
for(const [key,call] of Object.entries(calls)){
  let yards=0,completions=0;
  for(let i=0;i<500;i++){
    const match=new Match(random),e=match.next(key),motion=new PlayMotion(e,roster);
    assert.equal(e.playCall,key);
    if(e.counter){assert.equal(e.type,'sack');assert.equal(e.target,e.qb)}
    else if(call.kind==='run'){assert.equal(e.type,'run');assert.ok(['HB','FB'].includes(roster.find(p=>p.id===e.target).pos))}
    else{assert.ok(['pass','sack'].includes(e.type));assert.equal(e.target,firstRead(key,roster).id);if(e.complete){yards+=e.gain;completions++}}
    for(const route of routes(key,20,roster)){assert.ok(roster.some(p=>p.id===route.id));assert.ok(route.points.length>=2);for(const point of route.points)assert.ok(Number.isFinite(point.x)&&Number.isFinite(point.y))}
    for(const t of [0,motion.snap+.2,motion.release+.1,motion.catchAt+.1,motion.contact+.1]){
      const f=motion.frame(t);assert.equal(f.players.length,22);
      for(const team of [0,1]){
        for(const actor of f.players){const p=project(actor.tx,actor.ty,35,team);assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y))}
        const p=project(f.ball.x,f.ball.y,35,team);assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y));
      }
    }
  }
  samples[key]={yards:completions?yards/completions:0,completions};
}
assert.ok(samples.deep.yards>samples.action.yards&&samples.action.yards>samples.quick.yards,'Passing depth must change actual completed yards');
assert.ok(samples.quick.completions>samples.deep.completions,'Short passes should complete more often');
let previous=[],previousDefense=[];const seen=new Set();
for(let i=0;i<200;i++){
 const hand=playHand(random,false,previous),defense=playHand(random,true,previousDefense);
 assert.equal(new Set(hand).size,5);assert.equal(hand.filter(k=>calls[k].kind==='run').length,2);assert.equal(hand.filter(k=>calls[k].kind==='pass').length,3);
 assert.equal(new Set(defense).size,5);assert.ok(defense.every(k=>defenseCalls[k]));
 if(previous.length)assert.ok(hand.some(k=>!previous.includes(k)),'Each down changes at least one offered offensive play');
 if(previousDefense.length)assert.ok(defense.some(k=>!previousDefense.includes(k)),'Each down changes at least one counter');
 hand.forEach(k=>seen.add(k));previous=hand;previousDefense=defense;
}
assert.equal(seen.size,10);
for(const key of Object.keys(calls))assert.equal(Object.values(defenseCalls).filter(d=>d.counters===key).length,1);
const draw=new PlayMotion(new Match(random).next('draw','press'),roster);
assert.equal(draw.frame(draw.snap+.2).stage,'PLAY FAKE');assert.ok(draw.handoff>1.5);
assert.notDeepEqual(routes('slants',20,roster),routes('quick',20,roster));assert.notDeepEqual(routes('seam',20,roster),routes('action',20,roster));
const e=new Match(random).next('quick','gap'),quick=new PlayMotion(e,roster),deep=new PlayMotion({...e,playCall:'deep'},roster),action=new PlayMotion({...e,playCall:'action'},roster);
assert.ok(quick.release<deep.release&&deep.release<action.release);
assert.equal(action.frame(action.snap+.2).stage,'PLAY FAKE');
assert.equal(action.frame(action.snap+.2).players.find(p=>p.p.pos==='QB').pose,'handoff');
assert.ok(action.frame(action.release).players.find(p=>p.p.pos==='HB').ty>e.start);
assert.ok(new PlayMotion({...e,type:'run',playCall:'inside'},roster).lane!==new PlayMotion({...e,type:'run',playCall:'outside'},roster).lane);
for(const team of [0,1]){const a=project(320,20,30,team),b=project(320,30,30,team);assert.equal(a.y,b.y);assert.ok(team===0?b.x>a.x:b.x<a.x)}
assert.throws(()=>new Match(random).next('unknown'));
const fourth=new Match(random);fourth.down=4;const special=fourth.next('deep');assert.equal(special.type,'punt');
console.log(`PASS: ten play calls across 5,000 outcomes; distinct pass depth/risk, run lanes, release timing, play fake, route previews, and both horizontal attack directions. Average completed yards: ${['quick','action','deep'].map(k=>k+' '+samples[k].yards.toFixed(1)).join(', ')}.`);
