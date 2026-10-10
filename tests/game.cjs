const assert=require('node:assert/strict');const {roster,specs,Match}=require('../dist/sim.js');
assert.equal(roster.length,22);assert.equal(new Set(roster.map(p=>p.id)).size,22);
assert.equal(roster.filter(p=>p.side==='offense').length,11);assert.equal(roster.filter(p=>p.side==='defense').length,11);
for(const p of roster){assert.equal(Object.keys(p.ratings).length,8);for(const v of Object.values(p.ratings))assert.ok(v>=1&&v<=99);for(const k of specs[p.pos])assert.ok(k in p.ratings)}
let seed=1401;const rand=()=>((seed=(1664525*seed+1013904223)>>>0)/4294967296);let types=new Set(),touchdowns=0,picks=0,totals=[0,0];
for(let i=0;i<500;i++){const m=new Match(rand);let limit=0;while(!m.over){const e=m.next();assert.ok(++limit<180);types.add(e.type);touchdowns+=!!e.touchdown;picks+=!!e.interception;assert.ok(m.ball>=0&&m.ball<=100);assert.ok(m.down>=1&&m.down<=4);assert.ok(m.clock>=0&&m.clock<=120);assert.equal(e.gain,e.type==='kick'||e.type==='punt'||!e.complete&&e.type==='pass'?0:e.end-e.start);}
 assert.equal(m.next(),null);assert.equal(m.quarter,4);for(let t=0;t<2;t++){let s=m.stats[t],qb=s[9],receivers=[s[135],s[85],s[34]];assert.equal(qb.cmp,receivers.reduce((a,p)=>a+p.rec,0));assert.equal(qb.passYds,receivers.reduce((a,p)=>a+p.recYds,0));assert.equal(qb.passTD,receivers.reduce((a,p)=>a+p.recTD,0));assert.equal(qb.ints,Object.values(m.stats[1-t]).reduce((a,p)=>a+p.picks,0));assert.ok(qb.att>=qb.cmp+qb.ints);assert.ok(m.score[t]>=7*(qb.passTD+s[112].rushTD+s[128].rushTD));totals[t]+=m.score[t];}}
for(const type of ['run','pass','sack','punt','kick'])assert.ok(types.has(type));assert.ok(touchdowns>0&&picks>0);
// Ratings feed outcomes: lower every offensive rating and replay the same random sequence.
function sample(){let yards=0;seed=51;for(let i=0;i<100;i++){let m=new Match(rand);while(!m.over)m.next();yards+=m.stats[0][9].passYds+m.stats[0][112].rushYds;}return yards}
let normal=sample(),saved=roster.filter(p=>p.side==='offense').map(p=>({...p.ratings}));roster.filter(p=>p.side==='offense').forEach(p=>Object.keys(p.ratings).forEach(k=>p.ratings[k]=30));let weakened=sample();assert.ok(normal>weakened);roster.filter(p=>p.side==='offense').forEach((p,i)=>p.ratings=saved[i]);
console.log(`PASS: 500 full games terminate; all outcome types; ratings matter; box scores reconcile. Average score ${totals.map(t=>(t/500).toFixed(1)).join('–')}.`);
