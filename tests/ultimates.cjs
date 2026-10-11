'use strict';
const assert=require('node:assert/strict');
const {Match,roster,ultimates}=require('../dist/sim.js');
const {player,slots}=require('../dist/draft.js');
const {random}=require('../dist/league.js');
assert.equal(ultimates.catalog.length,151);assert.equal(new Set(ultimates.catalog.map(u=>u.name)).size,151);
for(let id=1;id<=151;id++){
 const u=ultimates.signature(id);assert.equal(u.id,id);assert.match(u.color,/^#[0-9a-f]{6}$/i);
 for(const {pos} of slots){const p=player(id,pos);assert.equal(ultimates.signature(p.id),u,'Signature cannot change with position');assert.ok(Object.keys(p.ratings).some(k=>ultimates.boost(p,k)>0));}
}
const m=new Match(()=>.5);m.first=100;
let used=new Set();for(let i=0;i<3;i++){const e=m.next('inside');assert.equal(e.series,1);assert.equal(m.series,1);for(const u of e.ultimates){const key=u.team+':'+u.id;assert.ok(!used.has(key),'One activation per Pokémon per series');used.add(key);assert.equal(m.ultimateReady(u.team,u.id),false)}}
assert.ok(used.size>0);const punt=m.next();assert.equal(punt.type,'punt');assert.equal(m.series,2);assert.ok(m.usedUltimates.every(s=>s.size===0));
const first=new Match(()=>.5);first.first=21;const chain=first.next('inside');assert.ok(chain.firstDown);assert.equal(first.series,2);assert.ok(first.usedUltimates.every(s=>s.size===0));
const turnover=new Match(()=>0);assert.ok(turnover.next('inside','press').turnover);assert.equal(turnover.series,2);
for(const quarter of [1,2,3]){const q=new Match(()=>.5);q.quarter=quarter;q.clock=1;q.first=100;q.next('inside');assert.equal(q.series,quarter===2?2:1,'Only halftime kicks off a new series at a quarter boundary')}
const boost=new Match(()=>.5),p=roster.find(p=>p.pos==='QB'),base=boost.rating(p,'Accuracy',0),event={ultimates:[]};boost.activate(p,0,event);assert.ok(boost.rating(p,'Accuracy',0)>base);boost.activate(p,0,event);assert.equal(event.ultimates.length,1);boost.resetUltimates();boost.activate(p,0,event);assert.equal(event.ultimates.length,2);
// Deterministic full games: no repeated special in a series; stats match activations.
for(let seed=0;seed<100;seed++){
 const game=new Match(random(seed)),again=new Match(random(seed));let seen=new Set(),counts=[{},{}];
 while(!game.over){const e=game.next();assert.deepEqual(e,again.next());for(const u of e.ultimates){const key=`${e.series}:${u.team}:${u.id}`;assert.ok(!seen.has(key));seen.add(key);counts[u.team][u.id]=(counts[u.team][u.id]||0)+1;}}
 for(let t=0;t<2;t++)for(const p of roster)assert.equal(game.stats[t][p.id].ultimates,counts[t][p.id]||0);
}
console.log('PASS: all 151 fixed signature ultimates at every position, real rating boosts, once-per-series enforcement for both teams, first down/turnover/halftime recharge, quarter-boundary preservation, deterministic full games and reconciled ULT stats.');
