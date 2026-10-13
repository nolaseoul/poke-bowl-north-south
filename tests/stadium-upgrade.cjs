'use strict';
const assert=require('node:assert/strict'),S=require('../dist/sim.js'),L=require('../dist/league.js'),D=require('../dist/draft.js'),Motion=require('../dist/motion.js'),FX=require('../dist/fx.js'),Stadium=require('../dist/stadium.js');
function game(seed=1){return new S.Match(L.random(seed),{teams:[structuredClone(S.roster),structuredClone(S.roster)],footballFlow:true,stadiumRules:true})}
const rotating=game();rotating.phase='scrimmage';let prev=null;
for(let round=0;round<12;round++){
 const line=rotating.lineup(0),receivers=line.filter(p=>['WR','TE'].includes(p.pos));assert.equal(line.length,22);assert.equal(new Set(line.map(p=>p.id)).size,22);assert.equal(receivers[0].id,135);
 if(prev){assert.notEqual(receivers[1].id,prev[1]);assert.notEqual(receivers[2].id,prev[2]);}
 prev=receivers.map(p=>p.id);rotating.team=0;rotating.ball=20;rotating.down=1;rotating.random=()=>.5;
 const e=rotating.next('quick','deep',receivers[1].id);assert.equal(e.target,receivers[1].id);assert.equal(e.receiverRound,round);assert.equal(rotating.lineup(0,e.receiverRound)[2].id,e.target);
 const m=new Motion.PlayMotion(e,[...line.filter(p=>p.side==='offense'),...rotating.lineup(1).filter(p=>p.side==='defense')]);assert.ok(m.frame(m.catchAt).players.some(p=>p.p.id===e.target));
}
assert.equal(rotating.teams[0].length,24);assert.equal(rotating.receiverPools[0].length,5);for(const p of rotating.teams[0].filter(p=>p.bench))assert.ok(rotating.stats[0][p.id].targets>0);
const normal=game();normal.phase='kickoff';normal.team=0;const ret=normal.next({type:'kickoff',power:.5}),fastest=normal.teams[1].slice().sort((a,b)=>b.ratings.Speed-a.ratings.Speed||b.ratings.Agility-a.ratings.Agility||a.id-b.id)[0];assert.equal(ret.returner,fastest.id);assert.ok(ret.ultimates.length>=7);assert.equal(new Set(ret.ultimates.map(u=>u.team+':'+u.id)).size,ret.ultimates.length);
for(const team of [0,1]){const e={...ret,team,receivingTeam:1-team,returnUnitIds:ret.returnUnitIds};const teams=[normal.teams[0],normal.teams[1]];if(team){e.returnUnitIds=undefined;e.returner=teams[0].find(p=>p.pos==='WR').id;e.ultimates=[]}const m=new Motion.KickoffMotion(e,teams);for(let t=0;t<m.duration;t+=.09){const f=m.frame(t);assert.equal(f.players.length,22);assert.equal(new Set(f.players.map(p=>p.team+':'+p.p.id)).size,22);for(const p of f.players)assert.ok([p.tx,p.ty,p.fall,p.lean,p.jump].every(Number.isFinite));assert.ok([f.ball.x,f.ball.y,f.focusY].every(Number.isFinite))}}
const animation=new Motion.KickoffMotion(ret,normal.teams);assert.equal(FX.cuesBetween(animation,ret,-1,animation.duration).filter(c=>c.kind==='ultimate').length,ret.ultimates.length);assert.ok(animation.frame(animation.contact-.1).engagements.length>0);assert.ok(animation.frame(animation.catchAt+.1).players.filter(p=>p.power).length>=3);
const tb=game();tb.phase='kickoff';tb.team=0;const touchback=tb.next({type:'kickoff',power:1});assert.equal(touchback.returnYards,0);assert.equal(touchback.touchdown,false);assert.equal(touchback.ultimates.length,0);
for(const punt of [false,true]){
 const m=game();m.team=0;m.phase=punt?'scrimmage':'kickoff';m.ball=20;m.down=punt?4:1;m.quarter=punt?4:1;m.clock=punt?1:120;let seq=[.5,.01];m.random=()=>seq.length?seq.shift():.5;
 const e=m.next(punt?'inside':{type:'kickoff',power:.5},punt?'deep':null);assert.equal(e.touchdown,true);assert.equal(e.scoringTeam,1);assert.equal(e.score,6);assert.deepEqual(m.score,[0,6]);assert.equal(m.phase,'conversion');assert.equal(m.team,1);assert.equal(m.over,false);assert.equal(m.stats[1][e.returner].returnTD,1);
 const motion=new Motion.KickoffMotion(e,m.teams),frame=motion.frame(motion.resolveAt+.4);assert.equal(frame.players.filter(p=>p.pose==='dance').length,1);assert.equal(frame.players.find(p=>p.pose==='dance').p.id,e.returner);
 m.next({type:'conversion',choice:'pat'});m.next({type:'pat',accuracy:.5});assert.deepEqual(m.score,[0,7]);assert.equal(m.over,punt);
}
let td=0,fastLong=0,slowLong=0,sample=2000;
for(let seed=1;seed<=sample;seed++)for(const speed of [55,95]){
 const m=game(seed);m.phase='kickoff';m.team=0;for(const p of m.teams[1]){p.ratings.Speed=speed;p.ratings.Agility=80;p.ratings.Awareness=75}
 const e=m.next({type:'kickoff',power:.4});if(speed===95){td+=e.touchdown;fastLong+=!e.touchdown&&e.returnYards>=25&&e.returnYards<=50}else slowLong+=!e.touchdown&&e.returnYards>=25&&e.returnYards<=50;
}
assert.ok(td/sample>.075&&td/sample<.125);assert.ok(fastLong>slowLong+sample*.2);
const ids=new D.Draft().autoFill(L.random(7)).map(p=>p.id);
for(let seed=1;seed<=30;seed++){
 const m=new S.Match(L.random(seed),{teams:L.teams(ids,seed),footballFlow:true,stadiumRules:true}),history=[];let n=0;
 while(!m.over){assert.ok(++n<200);if(m.actor()!==null){history.push(null);m.next();continue}if(m.team===1){history.push({defense:'deep'});m.next(null,'deep')}else{const target=m.lineup(0).filter(p=>['WR','TE'].includes(p.pos))[n%3].id;history.push({offense:'quick',target});m.next('quick',null,target)}}
 const replay=L.replay(ids,seed,history,'random',4);assert.deepEqual(replay.score,m.score);assert.deepEqual(replay.stats,m.stats);assert.deepEqual(replay.offensiveSnaps,m.offensiveSnaps);
}
assert.ok(Stadium.goalpostSize(true).height>Stadium.goalpostSize().height*3);assert.ok(Stadium.goalpostSize(true).halfWidth>Stadium.goalpostSize().halfWidth*2);
console.log(`PASS: five-receiver rotation, real reserve snaps/stats, fastest returns, ${td}/${sample} return TDs, speed-dependent 25–50-yard gains (${fastLong} fast vs ${slowLong} slow), multi-ultimate blocking, return conversions/final whistle, 30 V4 ranked replays and larger PAT posts.`);
