'use strict';
const assert=require('node:assert/strict');
const Sim=require('../dist/sim.js'),League=require('../dist/league.js'),Motion=require('../dist/motion.js'),Stadium=require('../dist/stadium.js'),Draft=require('../dist/draft.js');
function opening(seed=1,choice='receive'){const m=new Sim.Match(League.random(seed),{footballFlow:true});assert.equal(m.phase,'coinToss');const toss=m.next({type:'toss',choice:'heads'});assert.ok(['heads','tails'].includes(toss.toss.result));assert.equal(m.actor(),toss.toss.winner);m.next({type:'receive',choice});assert.equal(m.phase,'kickoff');assert.equal(m.team,1-m.openingReceiver);return m}
for(const choice of ['kick','receive'])for(let seed=1;seed<=20;seed++){const m=opening(seed,choice),receiver=m.openingReceiver,e=m.next({type:'kickoff',power:1});assert.equal(e.touchback,true);assert.equal(m.team,receiver);assert.equal(m.ball,25);assert.equal(m.phase,'scrimmage');assert.equal(m.down,1);assert.equal(m.first,35)}
const short=opening(),long=opening();const a=short.next({type:'kickoff',power:.1}),b=long.next({type:'kickoff',power:.8});assert.ok(a.landing<b.landing);assert.ok(short.ball>long.ball,'Power must affect starting field position');
for(const power of [-1,2,NaN,Infinity,'1',null])assert.throws(()=>opening().next({type:'kickoff',power}),/power/);
assert.throws(()=>opening().next({type:'pat',accuracy:.5}),/changed/);
// Force a goal-line offense that always gains yards, without random defensive counters.
function touchdown(quarter=1,clock=120){const m=opening();m.next({type:'kickoff',power:1});m.random=()=>.5;m.team=0;m.ball=99;m.first=100;m.down=1;m.quarter=quarter;m.clock=clock;const e=m.next('inside','deep');assert.equal(e.touchdown,true);assert.equal(e.score,6);assert.equal(m.score[0],6);assert.equal(m.team,0);assert.equal(m.phase,'conversion');return m}
for(const accuracy of [0,.3,.5,.7,1]){const m=touchdown();m.next({type:'conversion',choice:'pat'});assert.equal(m.phase,'pat');const e=m.next({type:'pat',accuracy});assert.equal(e.extraPoint,true);assert.equal(m.score[0],accuracy===.5?7:6);assert.equal(m.phase,'kickoff');assert.equal(m.team,0);m.next({type:'kickoff',power:1});assert.equal(m.team,1);assert.equal(m.ball,25)}
for(const accuracy of [-1,2,NaN,Infinity,'1']){const m=touchdown();m.next({type:'conversion',choice:'pat'});assert.throws(()=>m.next({type:'pat',accuracy}),/accuracy/)}
const two=touchdown();two.next({type:'conversion',choice:'two'});assert.equal(two.ball,98);assert.equal(two.phase,'twoPoint');const before=structuredClone(two.stats),good=two.next('inside','deep');assert.equal(good.conversion,true);assert.equal(good.touchdown,false);assert.equal(good.score,2);assert.equal(two.score[0],8);assert.deepEqual(two.stats,before,'Conversion yards and TDs do not inflate the box score');assert.equal(two.phase,'kickoff');
const stopped=touchdown();stopped.next({type:'conversion',choice:'two'});const failed=stopped.next('inside','gap');assert.equal(failed.counter,true);assert.equal(failed.score,0);assert.equal(stopped.score[0],6);assert.equal(stopped.phase,'kickoff');
const final=touchdown(4,1);assert.equal(final.over,false,'Touchdown at zero still gets its conversion');assert.equal(final.clock,0);final.next({type:'conversion',choice:'pat'});final.next({type:'pat',accuracy:.5});assert.equal(final.over,true);assert.equal(final.score[0],7);assert.equal(final.phase,'final');assert.equal(final.next(),null);
const half=touchdown(2,1),firstReceiver=half.openingReceiver;half.next({type:'conversion',choice:'two'});half.next('inside','deep');assert.equal(half.quarter,3);assert.equal(half.clock,120);assert.equal(half.phase,'kickoff');assert.equal(half.team,firstReceiver,'The first-half receiver kicks after halftime');half.next({type:'kickoff',power:1});assert.equal(half.team,1-firstReceiver);
const fieldGoal=opening();fieldGoal.next();fieldGoal.random=()=>.2;fieldGoal.ball=80;fieldGoal.down=4;const fg=fieldGoal.next('inside','deep');assert.equal(fg.score,3);assert.equal(fieldGoal.phase,'kickoff');assert.equal(fieldGoal.team,fg.team);
const safety=opening();safety.next();safety.random=()=>.5;safety.ball=2;const sf=safety.next('inside','gap');assert.equal(sf.safety,true);assert.equal(safety.phase,'kickoff');assert.equal(safety.team,sf.team,'The team conceding the safety kicks away');
// The red-zone camera keeps the entire end zone and line of scrimmage on-screen both ways.
for(const team of [0,1])for(const yard of [80,85,90,95,99,100]){const camera=Stadium.cameraFor(yard);for(const y of [yard-10,yard,100,110])for(const lane of [54,586]){const p=Stadium.project(lane,y,camera,team);assert.ok(p.x>0&&p.x<1120,`yard ${yard}, team ${team}, point ${y} stays visible`)}}
for(const e of [a,b]){const motion=new Motion.KickoffMotion(e,[Sim.roster,Sim.roster]);for(let t=0;t<=motion.duration;t+=.08){const f=motion.frame(t);assert.equal(f.players.length,22);assert.ok(f.players.filter(p=>p.team===e.team).length===11);for(const p of f.players)assert.ok([p.tx,p.ty,p.fall].every(Number.isFinite));assert.ok([f.ball.x,f.ball.y,f.ball.arc,f.focusY].every(Number.isFinite))}}
const ids=new Draft.Draft().autoFill(League.random(8)).map(p=>p.id);let scores=0,tries=0;
for(let seed=1;seed<=100;seed++){
 const m=new Sim.Match(League.random(seed),{footballFlow:true,teams:League.teams(ids,seed)}),calls=[];let n=0;
 while(!m.over){assert.ok(++n<200);let call=null,def=null;
  if(m.actor()===0){call=m.phase==='coinToss'?{type:'toss',choice:'tails'}:m.phase==='receive'?{type:'receive',choice:seed%2?'receive':'kick'}:m.phase==='conversion'?{type:'conversion',choice:seed%2?'pat':'two'}:m.phase==='pat'?{type:'pat',accuracy:seed%3?.5:.8}:{type:'kickoff',power:seed%3?.95:.3};calls.push({action:call})}
  else if(m.actor()===1)calls.push(null);
  else if(m.team===1){def='deep';calls.push({defense:def})}else{call=seed%2?'deep':'inside';calls.push(call)}
  const e=m.next(call,def);scores+=!!e.touchdown;tries+=!!e.extraPoint||!!e.conversion;assert.ok(m.ball>=0&&m.ball<=100);assert.ok(m.clock>=0&&m.clock<=120);
 }
 assert.equal(m.quarter,4);assert.deepEqual(League.replay(ids,seed,calls,'random',3).score,m.score);assert.deepEqual(League.replay(ids,seed,calls,'random',3).stats,m.stats);
}
assert.ok(scores>0&&tries===scores);console.log(`PASS: 100 full version-3 ranked replays, ${scores} touchdowns and conversions; toss, kickoff power/returns, PAT accuracy/misses, two-point counters, halftime/final-play sequencing and both red-zone cameras.`);
