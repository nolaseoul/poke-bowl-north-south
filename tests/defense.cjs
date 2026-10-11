'use strict';
const assert=require('node:assert/strict');
const {Match,roster,calls,defenseCalls}=require('../dist/sim.js');
const {PlayMotion,defenseRoutes}=require('../dist/motion.js');
const {random,teams,replay}=require('../dist/league.js');
const {Draft}=require('../dist/draft.js');
const {cuesBetween}=require('../dist/fx.js');
assert.equal(Object.keys(defenseCalls).length,5);assert.equal(new Set(Object.values(defenseCalls).map(d=>d.counters)).size,5);
for(const team of [0,1])for(const [offense]of Object.entries(calls))for(const [defense,definition]of Object.entries(defenseCalls)){
 const m=new Match(random(141));m.team=team;const e=m.next(offense,defense),right=definition.counters===offense;
 assert.equal(e.counter,right);assert.equal(e.counterRead,right);
 if(right){assert.equal(e.type,'sack');assert.ok(e.gain<=-5&&e.gain>=-10);assert.equal(m.ball,20+e.gain);assert.equal(m.down,2);assert.equal(m.first,30);assert.equal(e.target,e.qb);assert.equal(e.complete,false);assert.equal(e.ultimates.length,1);assert.equal(e.ultimates[0].team,1-team);assert.equal(e.ultimates[0].id,e.defender);assert.equal(m.stats[1-team][e.defender].ultimates,1);assert.equal(m.stats[1-team][e.defender].sacks,1);assert.equal(m.stats[team][e.qb].att,0);assert.equal(m.ultimateReady(1-team,e.defender),false);assert.match(e.text,/COUNTER.*unleashes.*-yard loss/);
  const motion=new PlayMotion(e,roster);for(let t=0;t<motion.duration;t+=.04){const f=motion.frame(t);for(const p of f.players)assert.ok([p.tx,p.ty,p.fall,p.jump].every(Number.isFinite));}
  const striking=motion.frame(motion.ultimateAt+.1);assert.equal(striking.stage,'ULTIMATE STRIKE');assert.equal(striking.players.find(p=>p.p.id===e.defender).pose,'ultimate');
  const impact=motion.frame(motion.contact+.3);assert.equal(impact.players.find(p=>p.carrier).pose,'down');assert.equal(impact.players.find(p=>p.p.id===e.defender).pose,'celebrate');
  const cues=cuesBetween(motion,e,-1,motion.duration);assert.equal(cues.filter(c=>c.kind==='ultimate').length,1);assert.ok(cues.find(c=>c.kind==='ultimate').at>motion.snap);assert.ok(cues.some(c=>c.kind==='hit'));assert.ok(!cues.some(c=>c.kind==='throw'||c.kind==='catch'));
 }
}
const distribution=Array(6).fill(0);for(let seed=0;seed<1200;seed++){const e=new Match(random(seed)).next('quick','press');distribution[-e.gain-5]++;}assert.ok(distribution.every(n=>n>140&&n<260),distribution.join(','));
const repeat=new Match(random(16));repeat.ball=75;repeat.first=100;const spent=new Set();for(let i=0;i<3;i++){const e=repeat.next('quick','press');assert.ok(e.counter);assert.equal(e.series,1);assert.ok(!spent.has(e.defender));spent.add(e.defender)}
const exhausted=new Match(random(12));for(const p of roster.filter(p=>p.side==='defense'))exhausted.usedUltimates[1].add(p.id);const denied=exhausted.next('quick','press');assert.equal(denied.counter,false);assert.equal(denied.counterBlocked,true);assert.ok(!denied.ultimates.some(u=>u.team===1));assert.match(denied.text,/every defensive ultimate is spent/);
const fallback=new Match(random(23));for(const p of roster.filter(p=>defenseCalls.press.positions.includes(p.pos)))fallback.usedUltimates[1].add(p.id);const alternate=fallback.next('quick','press');assert.ok(alternate.counter);assert.ok(!defenseCalls.press.positions.includes(roster.find(p=>p.id===alternate.defender).pos));
const safety=new Match(random(1));safety.ball=3;const s=safety.next('quick','press');assert.ok(s.safety&&s.counter);assert.equal(s.end,0);assert.equal(s.gain,-3);assert.deepEqual(safety.score,[0,2]);assert.equal(safety.series,2);
for(const ball of [20,70]){const fourth=new Match(random(2));fourth.ball=ball;fourth.down=4;const e=fourth.next('quick','press');assert.equal(e.counter,false);assert.equal(e.ultimates.length,0);assert.equal(e.type,ball===20?'punt':'kick')}
// Neither automatic chooser can inspect the coach's submitted opposing call.
for(let seed=1;seed<50;seed++){
 const hidden=Object.keys(defenseCalls).map(d=>new Match(random(seed)).next(null,d).playCall);assert.equal(new Set(hidden).size,1);
 const computer=Object.keys(calls).map(c=>new Match(random(seed)).next(c).defenseCall);assert.equal(new Set(computer).size,1);
}
for(const key of Object.keys(defenseCalls))for(const route of defenseRoutes(key,30,roster)){assert.ok(roster.find(p=>p.id===route.id).side==='defense');assert.ok(route.points.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)))}
assert.throws(()=>new Match().next(null,'invalid'),/defensive/);assert.throws(()=>new Match().next(null,'__proto__'),/defensive/);
const ids=new Draft().autoFill(random(3)).map(p=>p.id);let coachedDefenses=0;
for(let seed=1;seed<=25;seed++){
 const m=new Match(random(seed),{teams:teams(ids,seed)}),history=[];
 while(!m.over){if(m.team===1){const defense=Object.keys(defenseCalls)[m.plays%5];history.push({defense});m.next(null,defense);coachedDefenses++;}else{const call=Object.keys(calls)[m.plays%5];history.push(call);m.next(call)}}
 const verified=replay(ids,seed,history);assert.deepEqual(verified.score,m.score);assert.deepEqual(verified.stats,m.stats);
}
assert.ok(coachedDefenses>0);for(const call of [{defense:'press'},{defense:'bad'},[],{defense:'gap',offense:'deep'},'__proto__'])assert.throws(()=>replay(ids,2,[call]),/history/);
console.log(`PASS: all 25 offense/defense matchups on both teams; single ready ultimate on QB, uniformly randomized 5–10-yard losses (${distribution}), exhausted/fallback charges, safeties, special-team exclusion, visible strike/contact, fair hidden CPU choices and 25 replayed games with ${coachedDefenses} defensive calls.`);
