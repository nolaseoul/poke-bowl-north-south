'use strict';
const assert=require('node:assert/strict'),Battle=require('../dist/battle.js'),Sim=require('../dist/sim.js'),Draft=require('../dist/draft.js'),League=require('../dist/league.js'),FX=require('../dist/fx.js');
const context=new Proxy({measureText:t=>({width:t.length*6})},{get:(o,k)=>k in o?o[k]:(...args)=>{for(const n of args)if(typeof n==='number')assert.ok(Number.isFinite(n),String(k)+' must have finite coordinates');if(k==='ellipse'||k==='arc')assert.ok(args[2]>=0,'Particle radii cannot be negative')}});
const pairs=new Set(),triggerTimes=new Set();let matches=0,frames=0;
for(let seed=1;seed<=50;seed++){
 const d=new Draft.Draft();d.autoFill(League.random(seed));const m=new Sim.Match(League.random(seed+100),{teams:[d.roster(),d.opponent(League.random(seed+4))],footballFlow:true,stadiumRules:true}),seen=new Set();
 while(!m.over){const e=m.next();if(!Battle.shouldStart(e,m.teams,seen))continue;
  const before=JSON.stringify(m),b=Battle.create(e,m.teams);assert.equal(b.duration,6.4);assert.notEqual(b.fighters[0].p.id,b.fighters[1].p.id);pairs.add(b.fighters.map(p=>p.p.id).join(':'));triggerTimes.add(e.quarter+':'+e.clock);
  const rotated=Battle.create({...e,team:e.team^1,scoreBefore:[...e.scoreBefore].reverse()},[...m.teams].reverse(),1);assert.equal(rotated.seed,b.seed);assert.equal(rotated.winner,b.winner^1);assert.deepEqual(rotated.fighters.map(p=>p.p.id),b.fighters.map(p=>p.p.id).reverse());
  assert.equal(Battle.triggerClock(m.teams,e.quarter),Battle.triggerClock([...m.teams].reverse(),e.quarter,1));
  const lastHP=[100,100];
  for(let t=0;t<=b.duration+.06;t+=.06){b.elapsed=t;const f=Battle.frame(b,t);for(let i=0;i<2;i++){assert.ok(f.hp[i]>=0&&f.hp[i]<=lastHP[i]);lastHP[i]=f.hp[i];assert.ok(Number.isFinite(f.fighters[i].x)&&Number.isFinite(f.fighters[i].y))}assert.equal(f.fighters.filter(p=>p.visible).length,t>=Battle.KO_AT?1:2);Battle.draw(context,b,null,{},true);Battle.draw(context,b,null,{},false);frames++}
  const end=Battle.frame(b,b.duration);assert.equal(end.hp[1-b.winner],0);assert.ok(end.hp[b.winner]>0);assert.equal(end.stage,'K.O.');
  const heard=Battle.cuesBetween(b,0,b.duration);assert.equal(heard.filter(c=>c.kind==='battleKO').length,1);assert.equal(heard.filter(c=>c.kind==='hit').length,4);assert.equal(heard.filter(c=>c.kind==='ultimate').length,2);
  const stepped=[];for(let t=0;t<7;t+=.06)stepped.push(...Battle.cuesBetween(b,t,t+.06));assert.deepEqual(stepped,heard,'No skipped or repeated attacks on frame boundaries');
  assert.equal(JSON.stringify(m),before,'Arena rendering must leave the authoritative football simulation untouched');seen.add(e.quarter);assert.equal(Battle.shouldStart(e,m.teams,seen),false);
 }
 assert.deepEqual([...seen],[1,2,3,4]);matches++;
}
assert.ok(pairs.size>100,'Different quarters and rosters produce varied matchups');assert.ok(triggerTimes.size>50,'Arena battles occur at varied clock times');
for(const kind of ['battleStart','battleKO']){const data=FX.effect(kind);assert.ok(data.length>15000);assert.ok([...data].every(Number.isFinite));assert.ok(Math.max(...data)<=1&&Math.min(...data)>=-1)}
console.log(`PASS: ${matches} full games with exactly four varied quarter rumbles, ${frames} finite isometric frames, mirrored PvP participants/winners, falling health, one KO, synchronized cues and unchanged football results.`);
