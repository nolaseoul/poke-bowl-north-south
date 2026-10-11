'use strict';
const assert=require('node:assert/strict'),clubs=require('../dist/teams.js'),draft=require('../dist/draft.js'),sim=require('../dist/sim.js'),league=require('../dist/league.js');
const home=new draft.Draft().autoFill(league.random(151)).map(p=>p.id);
assert.equal(clubs.clubs.length,8);assert.equal(new Set(clubs.clubs.map(c=>c.id)).size,8);
let previous=0,games=0;
for(const club of clubs.clubs){
 const ps=clubs.roster(club.id),ids=ps.map(p=>p.id),summary=clubs.summary(club.id);
 assert.ok(draft.valid(ids));assert.ok(!ids.includes(null));assert.equal(ps.length,22);
 assert.deepEqual(ps.map(p=>p.pos),draft.slots.map(s=>s.pos));
 assert.ok(summary.ovr>=previous);previous=summary.ovr;
 assert.equal(summary.ovr,draft.mean(ps));assert.equal(summary.offense,draft.mean(ps.slice(0,11)));assert.equal(summary.defense,draft.mean(ps.slice(11)));
 for(const [slot,id] of club.anchors)assert.equal(ids[slot],id,'Signature stars must really take the field');
 ps[0].ratings.Arm=-999;assert.notEqual(clubs.roster(club.id)[0].ratings.Arm,-999,'Cached clubs must return independent player objects');
 for(let seed=1;seed<=12;seed++){
  const squads=league.teams(home,seed,club.id);assert.deepEqual(squads[1].map(p=>p.id),ids);
  const match=new sim.Match(league.random(seed),{teams:squads,...clubs.options(club.id)}),history=[];
  while(!match.over){const call=match.team===0?Object.keys(sim.calls)[match.plays%5]:{defense:Object.keys(sim.defenseCalls)[match.plays%5]};history.push(call);typeof call==='object'?match.next(null,call.defense):match.next(call)}
  const replay=league.replay(home,seed,history,club.id);assert.deepEqual(replay.score,match.score);assert.deepEqual(replay.stats,match.stats);games++;
 }
}
function tendencies(id){const m=new sim.Match(league.random(1337),{teams:league.teams(home,1337,id),...clubs.options(id)});m.team=1;const counts={};for(let n=0;n<6000;n++){const c=m.chooseOffense();counts[c]=(counts[c]||0)+1}return counts}
const ground=tendencies('pewter'),air=tendencies('vermilion'),trick=tendencies('saffron');assert.ok(ground.inside>ground.quick*2);assert.ok(air.deep>air.inside||!air.inside);assert.ok(air.deep>air.outside*1.7);assert.ok(trick.action>trick.quick*1.7);
assert.equal(clubs.name('random'),'Rocket Red');assert.equal(clubs.valid('bogus'),false);assert.throws(()=>league.teams(home,1,'bogus'),/valid opponent/);assert.throws(()=>clubs.roster('bogus'),/valid opponent/);
assert.equal(new Set(league.teams(home,55).flat().map(p=>p.id)).size,44,'Legacy random rivals keep separate species');
console.log(`PASS: eight complete gym clubs, ascending real OVR, signature starters, independent rosters, distinct CPU play styles and ${games} server-reproducible full games.`);
