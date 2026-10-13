'use strict';
const assert=require('node:assert/strict'),Sim=require('../dist/sim.js'),Motion=require('../dist/motion.js');
for(const team of [0,1])for(const call of ['inside','outside','quick','deep','action']){
 const m=new Sim.Match(()=>.5);m.team=team;const event=m.next(call,call==='inside'?'press':'gap'),motion=new Motion.PlayMotion(event,Sim.roster);
 assert.equal(motion.frame(motion.snap-.01).engagements.length,0);
 const frame=motion.frame(motion.snap+.55);assert.equal(frame.engagements.length,5,'All five linemen must have a unique opponent');const seen=new Set();
 for(const link of frame.engagements){assert.equal(link.stage,'drive');for(const id of link.ids){assert.ok(!seen.has(id));seen.add(id)}const [a,b]=link.ids.map(id=>frame.players.find(p=>p.p.id===id));assert.equal(a.engagement.partner,b.p.id);assert.equal(b.engagement.partner,a.p.id);assert.equal(a.pose,'block');assert.equal(b.pose,'block');assert.ok(Math.abs(a.tx-b.tx)<8);assert.ok(Math.abs(a.ty-b.ty)<2.3);assert.equal(a.engageFacing,team===0?6:2);assert.equal(b.engageFacing,team===0?2:6);assert.ok(a.actionFrame>=0&&a.actionFrame<=1);}
 assert.equal(motion.frame(motion.contact+.1).engagements.length,0,'Blocks release before the tackle or celebration');assert.deepEqual(motion.frame(motion.snap+.8),motion.frame(motion.snap+.8),'Replay must reproduce the same body contact');
}
const counter=new Sim.Match(()=>.5).next('quick','press'),cm=new Motion.PlayMotion(counter,Sim.roster),striker=cm.frame(cm.ultimateAt).players.find(p=>!p.off&&p.p.id===counter.defender);assert.equal(striker.pose,'ultimate');assert.equal(striker.engagement,undefined,'Counter defender must break free to use their ultimate');
for(const type of ['punt','kick']){const e={team:0,type,start:70,end:100,target:112,qb:9,gain:0},m=new Motion.PlayMotion(e,Sim.roster);assert.equal(m.frame(1).engagements.length,0)}
console.log('PASS: five paired line engagements, shared contact, opposing facing, native action poses, deterministic shoves, both attack directions, released tackles and free ultimate attackers.');
