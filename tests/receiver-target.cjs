'use strict';
const assert=require('node:assert/strict');
const Sim=require('../dist/sim.js'),Motion=require('../dist/motion.js'),League=require('../dist/league.js'),Draft=require('../dist/draft.js');
const ids=new Draft.Draft().autoFill(League.random(12)).map(p=>p.id);
let passes=0;
for(const call of Object.keys(Sim.calls).filter(k=>Sim.calls[k].kind==='pass'))for(const team of [0,1])for(let seed=1;seed<=30;seed++){
 const m=new Sim.Match(League.random(seed),{teams:League.teams(ids,seed)});m.team=team;
 const receivers=m.teams[team].filter(p=>p.side==='offense'&&['WR','TE'].includes(p.pos));
 const target=receivers[seed%3],defense=Object.keys(Sim.defenseCalls).find(k=>Sim.defenseCalls[k].counters!==call);
 assert.equal(Sim.firstRead(call,m.teams[team],target.id),target);
 const e=m.next(call,defense,target.id);assert.equal(e.target,target.id,'The selected receiver gets the actual pass');
 const view=new Motion.PlayMotion(e,[...m.teams[team].filter(p=>p.side==='offense'),...m.teams[1-team].filter(p=>p.side==='defense')]);
 assert.equal(view.routes.filter(r=>r.primary).length,1);assert.equal(view.routes.find(r=>r.primary).id,target.id);
 if(target.id!==Sim.firstRead(call,m.teams[team]).id)assert.equal(view.lane,Motion.routes(call,e.start,m.teams[team],target.id).find(r=>r.id===target.id).points.at(-1).x,'Animation uses the chosen receiver’s route lane');
 if(e.type==='pass'){
  passes++;for(const p of receivers)assert.equal(m.stats[team][p.id].targets,p.id===target.id?1:0);
  if(e.complete)assert.equal(m.stats[team][target.id].rec,1);
 }
}
const m=new Sim.Match(League.random(44)),wr=m.teams[0].find(p=>p.pos==='WR');
for(const id of [0,'135',9,143,999])assert.throws(()=>m.next('quick','gap',id),/WR or TE/);
assert.throws(()=>m.next('inside','gap',wr.id),/WR or TE/);assert.throws(()=>m.next(null,null,wr.id),/WR or TE/);assert.equal(m.plays,0,'Rejected target cannot consume a down');
for(const rulesVersion of [1,3])for(let seed=1;seed<=20;seed++){
 const game=new Sim.Match(League.random(seed),{teams:League.teams(ids,seed),footballFlow:rulesVersion===3}),history=[];
 while(!game.over){
  if(game.actor()!==null){const action=game.actor()===0?({coinToss:{type:'toss',choice:'heads'},receive:{type:'receive',choice:'receive'},conversion:{type:'conversion',choice:game.plays%2?'pat':'two'},pat:{type:'pat',accuracy:.5},kickoff:{type:'kickoff',power:.9}}[game.phase]):null;history.push(action?{action}:null);game.next(action);continue}
  if(game.team===1){history.push(null);game.next();continue}
  const call=['quick','deep','slants','screen','seam','action'][game.plays%6],target=game.teams[0].filter(p=>['WR','TE'].includes(p.pos))[game.plays%3].id;
  history.push({offense:call,target});game.next(call,null,target);
 }
 const verified=League.replay(ids,seed,history,'random',rulesVersion);assert.deepEqual(verified.score,game.score);assert.deepEqual(verified.stats,game.stats);
}
for(const entry of [{offense:'inside',target:wr.id},{offense:'quick',target:9},{offense:'quick',target:null},{offense:'quick',target:wr.id,extra:true}])assert.throws(()=>League.replay(Sim.roster.map(p=>p.id),1,[entry]),/history/);
console.log(`PASS: ${passes} targeted pass attempts across six concepts, either offense and all eligible receivers; target stats, gold routes, animation lanes, invalid choices, and 40 complete ranked replays.`);
