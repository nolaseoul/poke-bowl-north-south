const assert=require('node:assert/strict');
const {pool,slots,player,Draft,valid}=require('../dist/draft.js');
const {roster,specs,Match}=require('../dist/sim.js');
const {PlayMotion}=require('../dist/motion.js');
assert.equal(pool.length,151);assert.equal(new Set(pool.map(p=>p.id)).size,151);
for(const p of pool)for(const pos of Object.keys(specs)){
  const prospect=player(p.id,pos);assert.equal(Object.keys(prospect.ratings).length,8);
  for(const value of Object.values(prospect.ratings))assert.ok(Number.isInteger(value)&&value>=1&&value<=99);
  assert.ok(prospect.ovr>=1&&prospect.ovr<=99);assert.equal(prospect.id,p.id);
}
for(const p of roster)assert.deepEqual(player(p.id,p.pos).ratings,p.ratings);
assert.notEqual(player(135,'WR').ovr,player(135,'NT').ovr);
const copy=player(9,'QB');copy.ratings.Arm=1;assert.equal(player(9,'QB').ratings.Arm,98);
for(const invalid of [null,{},[1],Array(22).fill(1),Array(22).fill(999),Array(22).fill('1')])assert.equal(new Draft(invalid).summary().count,0);
const chosen=new Draft();assert.throws(()=>chosen.opponent());chosen.pick(0,65);assert.throws(()=>chosen.pick(1,65));assert.throws(()=>chosen.pick(-1,1));assert.throws(()=>chosen.pick(0,999));assert.equal(chosen.ids[0],65);
let seed=257;const rand=()=>((seed=(1664525*seed+1013904223)>>>0)/4294967296);
chosen.autoFill(rand);assert.equal(chosen.ids[0],65);assert.ok(valid(chosen.ids));assert.equal(chosen.summary().count,22);
assert.deepEqual(new Draft(chosen.ids).ids,chosen.ids);chosen.remove(1);assert.equal(chosen.summary().count,21);chosen.autoFill(rand);
let types=new Set(),frames=0;
for(let i=0;i<100;i++){
  const draft=new Draft();draft.autoFill(rand);const blue=draft.roster(),red=draft.opponent(rand);
  assert.equal(new Set([...blue,...red].map(p=>p.id)).size,44);
  for(const team of [blue,red])for(const slot of slots)assert.equal(team[slot.index].pos,slot.pos);
  const match=new Match(rand,{teams:[blue,red]});
  while(!match.over){
    const e=match.next(),active=[...match.teams[e.team].filter(p=>p.side==='offense'),...match.teams[1-e.team].filter(p=>p.side==='defense')],motion=new PlayMotion(e,active);
    types.add(e.type);assert.equal(e.qb,match.teams[e.team].find(p=>p.pos==='QB').id);
    for(const t of [0,motion.snap+.1,motion.release+.1,motion.catchAt+.1,motion.contact+.3]){
      const f=motion.frame(t);assert.equal(f.players.length,22);assert.equal(new Set(f.players.map(p=>p.p.id)).size,22);
      assert.ok(f.players.some(p=>p.p.id===f.carrier.id));
      if(t<motion.snap)assert.equal(f.carrier.id,e.qb);
      for(const p of f.players){assert.equal(p.team,p.off?e.team:1-e.team);for(const k of ['tx','ty','jump','fall'])assert.ok(Number.isFinite(p[k]));}
      for(const k of ['x','y','arc'])assert.ok(Number.isFinite(f.ball[k]));frames++;
    }
  }
  for(let t=0;t<2;t++){
    const team=match.teams[t],stats=match.stats[t],qb=stats[team.find(p=>p.pos==='QB').id],receivers=team.filter(p=>['WR','TE'].includes(p.pos)).map(p=>stats[p.id]);
    assert.equal(Object.keys(stats).length,22);assert.equal(qb.cmp,receivers.reduce((sum,p)=>sum+p.rec,0));assert.equal(qb.passYds,receivers.reduce((sum,p)=>sum+p.recYds,0));assert.equal(qb.passTD,receivers.reduce((sum,p)=>sum+p.recTD,0));assert.equal(qb.ints,Object.values(match.stats[1-t]).reduce((sum,p)=>sum+p.picks,0));
  }
}
for(const type of ['run','pass','sack','kick','punt'])assert.ok(types.has(type));
assert.throws(()=>new Match(rand,{teams:[[],[]]}));
console.log(`PASS: 151 species across 16 positions, valid saved drafts, unique picks, original scouting preservation, and 100 distinct-team games with ${frames} animation samples and reconciled stats.`);
