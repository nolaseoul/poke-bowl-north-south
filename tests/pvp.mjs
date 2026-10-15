import assert from 'node:assert/strict';
import {database} from './support/d1.mjs';
import {totalsFor} from '../worker/activity.mjs';
const {db,sql}=database();
import {PvPRoom,rebuild} from '../worker/pvp.mjs';
import {createHandler} from '../worker/index.mjs';
import Draft from '../dist/draft.js';
import Sim from '../dist/sim.js';
import League from '../dist/league.js';
import PvP from '../dist/pvp-client.js';
const rooms=new Map();
function makeState(){let queue=Promise.resolve();const values=new Map();return{storage:{async get(k){return structuredClone(values.get(k))},async put(k,v){values.set(k,structuredClone(v))},async setAlarm(t){this.alarm=t},async deleteAll(){values.clear()}},blockConcurrencyWhile(fn){const next=queue.then(fn);queue=next.catch(()=>{});return next}}}
const env={LEAGUE:db,PVP:{idFromName:id=>id,get(id){if(!rooms.has(id)){const state=makeState();rooms.set(id,{state,object:new PvPRoom(state,env)})}return{fetch:r=>rooms.get(id).object.fetch(r)}}},ASSETS:{fetch:()=>new Response('assets')}};
const handler=createHandler();
function fetcher(url,options={}){return handler(new Request('https://bowl.test'+url,options),env)}
const stores=[0,1,2].map(()=>{const m=new Map();return{getItem:k=>m.get(k)||'',setItem:(k,v)=>m.set(k,v)}});
const ids=new Draft.Draft().autoFill(League.random(12)).map(p=>p.id),opponent=new Draft.Draft().autoFill(League.random(25)).map(p=>p.id);
const host=await PvP.RoomClient.create(ids,'Pika ⚡ FC',{fetch:fetcher,storage:stores[0],rulesVersion:1}),room=rooms.get(host.id);
let publicView=await (await fetcher('/api/rooms/'+host.id)).json();assert.equal(publicView.state,'waiting');assert.equal(publicView.token,undefined);assert.equal(publicView.seed,undefined);assert.equal(publicView.lineups,undefined);
const visitor=new PvP.RoomClient(host.id,{fetch:fetcher,storage:stores[1]});await visitor.join(opponent,'Eevee United');const intruder=new PvP.RoomClient(host.id,{fetch:fetcher,storage:stores[2]});await assert.rejects(intruder.join(ids,'Third wheel'),/Both coaches/);
await assert.rejects(intruder.call(0,'quick'),/browser/);await assert.rejects(host.call(0,'nope'),/valid play/);
const original=room.object;room.object=new PvPRoom(room.state,env);assert.equal((await host.poll()).names[1],'Eevee United','Object restart retains both coaches');assert.notEqual(room.object,original);
let view=await host.poll(),rounds=0,sawCounter=false;
while(view.state!=='finished'){
 const offense=view.snapshot.team,coaches=[host,visitor],offered=(await coaches[offense].poll()).hand,defOffered=(await coaches[1-offense].poll()).hand;
 assert.deepEqual((await coaches[offense].poll()).hand,offered,'Polling must not reroll the hand');
 const counter=defOffered.find(k=>offered.includes(Sim.defenseCalls[k].counters)),call=counter?Sim.defenseCalls[counter].counters:offered[0],defense=counter||defOffered[0];
 const unavailable=Object.keys(Sim.calls).find(k=>!offered.includes(k));await assert.rejects(coaches[offense].call(rounds,unavailable),/offered/);
 const target=Sim.calls[call].kind==='pass'?new Draft.Draft(offense?opponent:ids).roster().filter(p=>p.pos==='WR')[1].id:null;
 if(target!==null){await assert.rejects(coaches[offense].call(rounds,call,999),/WR or TE/);await assert.rejects(coaches[1-offense].call(rounds,defense,target),/Only the offense/)}
 const locked=await coaches[offense].call(rounds,call,target);assert.equal(locked.round,rounds);assert.equal(locked.locked[offense],true);assert.equal(locked.pending,undefined);assert.equal(locked.calls,undefined);assert.equal(locked.seed,undefined);assert.equal(locked.coaches,undefined);
 const other=await coaches[1-offense].poll();assert.equal(other.locked[offense],true);assert.equal(JSON.stringify(other).includes('"offense":"'+call+'"'),false,'Unresolved calls must stay hidden');assert.equal(JSON.stringify(other).includes('\"target\":'),false,'Selected receiver stays hidden before the snap');
 await coaches[offense].call(rounds,call,target);
 if(target!==null){const alternative=new Draft.Draft(offense?opponent:ids).roster().find(p=>p.pos==='WR').id;await assert.rejects(coaches[offense].call(rounds,call,alternative),/already locked/);assert.equal((await room.state.storage.get('room')).pending[offense].target,target)}
 await assert.rejects(coaches[offense].call(rounds,offered.find(k=>k!==call)),/already locked/);
 await coaches[1-offense].call(rounds,defense);view=await host.poll();const theirs=await visitor.poll();assert.deepEqual(view.snapshot,theirs.snapshot);assert.equal(view.round,rounds+1);assert.equal(view.events.length,1);assert.equal(view.events[0].round,rounds+1);sawCounter||=view.events[0].event.counter;if(target!==null&&view.events[0].event.type==='pass')assert.equal(view.events[0].event.target,target);
 const flipped=PvP.rotate(theirs);assert.deepEqual(flipped.snapshot.score,[view.snapshot.score[1],view.snapshot.score[0]]);assert.equal(flipped.snapshot.team,view.snapshot.team^1);assert.equal(flipped.events[0].event.team,view.events[0].event.team^1);assert.deepEqual(flipped.events[0].event.ultimates.map(u=>u.team),view.events[0].event.ultimates.map(u=>u.team^1));
 for(const c of coaches)c.consume(++c.cursor);rounds++;
 await assert.rejects(coaches[0].call(rounds-1,'quick'),/down changed|finished/);
}
assert.ok(rounds>20&&rounds<200);assert.ok(sawCounter);const stored=await room.state.storage.get('room'),verified=rebuild(stored);assert.deepEqual(verified.match.score,view.snapshot.score);assert.deepEqual(verified.match.stats,view.snapshot.stats);assert.equal(verified.events.length,rounds);
for(let i=0;i<rounds;i++){assert.equal(verified.events[i].snapshot.plays,i+1);if(i){assert.notStrictEqual(verified.events[i].snapshot.stats,verified.events[i-1].snapshot.stats);assert.notStrictEqual(verified.events[i].snapshot.score,verified.events[i-1].snapshot.score)}}
const returning=new PvP.RoomClient(host.id,{fetch:fetcher,storage:stores[0],rulesVersion:1});assert.equal((await returning.poll()).seat,0,'Invite restores the correct coach from its private browser token');
const publicFinal=await (await fetcher('/api/rooms/'+host.id)).json();assert.equal(publicFinal.snapshot,undefined);assert.equal(publicFinal.events,undefined);
// Concurrent coach requests resolve exactly one down and reject a third-player join atomically.
const second=await PvP.RoomClient.create(ids,'Second duel',{fetch:fetcher,storage:stores[0],rulesVersion:1}),s2=new PvP.RoomClient(second.id,{fetch:fetcher,storage:stores[1]});await s2.join(ids,'Mirror squad');const h2=(await second.poll()).hand,d2=(await s2.poll()).hand;await Promise.all([second.call(0,h2[0]),s2.call(0,d2[0])]);assert.equal((await second.poll()).round,1);
const old=await room.state.storage.get('room');old.expires=Date.now()-1;await room.state.storage.put('room',old);await assert.rejects(host.poll(),/expired/);await room.object.alarm();assert.equal(await room.state.storage.get('room'),undefined);
const forbidden=await fetcher('/api/rooms',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://evil.test'},body:JSON.stringify({lineup:ids})});assert.equal(forbidden.status,403);
// New clients play the complete football flow; old rooms above retain their original replay rules.
const robotIds=ids.slice();robotIds[1]=1001;
const full=await PvP.RoomClient.create(robotIds,'Coin toss crew',{fetch:fetcher,storage:stores[0]}),otherFull=new PvP.RoomClient(full.id,{fetch:fetcher,storage:stores[1]});await otherFull.join(opponent,'Meter masters');const fullRoom=rooms.get(full.id),newState=await fullRoom.state.storage.get('room');newState.seed=13;await fullRoom.state.storage.put('room',newState);
let fullView=await full.poll(),fullRounds=0,sawReturnScore=false,sawReserveTarget=false;const stages=new Set(),fullCoaches=[full,otherFull];
assert.equal(newState.rulesVersion,4);assert.equal(fullView.snapshot.stadiumRules,true);assert.equal(fullView.snapshot.stats[0][1001].returns,0);assert.equal(fullView.snapshot.phase,'coinToss');assert.equal(PvP.rotate(await otherFull.poll()).snapshot.actionTeam,1,'The visiting coach waits for the host to call the coin');
while(fullView.state!=='finished'){
 const s=fullView.snapshot;stages.add(s.phase);
 if(s.actionTeam!==null){
  const actor=s.actionTeam;await assert.rejects(fullCoaches[1-actor].call(fullRounds,{type:'kickoff',power:1}),/other coach/);
  const action=s.phase==='coinToss'?{type:'toss',choice:'heads'}:s.phase==='receive'?{type:'receive',choice:'kick'}:s.phase==='conversion'?{type:'conversion',choice:fullRounds%2?'pat':'two'}:s.phase==='pat'?{type:'pat',accuracy:.5}:{type:'kickoff',power:.5};
  if(s.phase==='kickoff')await assert.rejects(fullCoaches[actor].call(fullRounds,{type:'kickoff',power:10}),/power/);
  await fullCoaches[actor].call(fullRounds,action);
 }else{
  const offense=s.team,oh=(await fullCoaches[offense].poll()).hand,dh=(await fullCoaches[1-offense].poll()).hand;
  const call=oh.includes('deep')?'deep':oh.find(k=>Sim.calls[k].kind==='pass')||oh[0],defense=dh.find(k=>Sim.defenseCalls[k].counters!==call)||dh[0];
  const current=rebuild(await fullRoom.state.storage.get('room')).match,line=current.lineup(offense),eligible=line.filter(p=>['WR','TE'].includes(p.pos)),target=Sim.calls[call].kind==='pass'?eligible[1].id:null;
  if(target!==null){const resting=current.receiverPools[offense].find(p=>!eligible.some(a=>a.id===p.id));await assert.rejects(fullCoaches[offense].call(fullRounds,call,resting.id),/WR or TE/);sawReserveTarget||=eligible[1].receiverDepth>=4;}
  await fullCoaches[offense].call(fullRounds,call,target);const hidden=await fullCoaches[1-offense].poll();assert.equal(JSON.stringify(hidden).includes('\"target\":'),false,'Rotating target stays private until both calls lock');
  await fullCoaches[1-offense].call(fullRounds,defense);
 }
 fullRounds++;assert.ok(fullRounds<200);fullView=await full.poll();if(fullRounds===3)assert.equal(fullView.events[0].event.returner,1001,'The custom robot returns the opening kick in a real friend duel');const theirs=await otherFull.poll();assert.deepEqual(theirs.snapshot,fullView.snapshot);assert.equal(fullView.round,fullRounds);
 const rotated=PvP.rotate(theirs);assert.deepEqual(rotated.snapshot.offensiveSnaps,[...fullView.snapshot.offensiveSnaps].reverse());
 const resolved=fullView.events[0].event,flippedEvent=rotated.events[0].event;if(resolved.scoringTeam!=null){sawReturnScore=true;assert.equal(flippedEvent.scoringTeam,resolved.scoringTeam^1);assert.equal(flippedEvent.receivingTeam,resolved.receivingTeam^1);assert.deepEqual(flippedEvent.returnUnitIds,resolved.returnUnitIds);assert.equal(fullView.snapshot.team,resolved.scoringTeam);assert.equal(fullView.snapshot.phase,'conversion');}
 assert.deepEqual(rotated.snapshot.score,[...fullView.snapshot.score].reverse());if(fullView.snapshot.actionTeam!==null)assert.equal(rotated.snapshot.actionTeam,fullView.snapshot.actionTeam^1);
 fullCoaches.forEach(c=>c.consume(fullRounds));
}
assert.ok(stages.has('kickoff')&&stages.has('conversion'));assert.ok(sawReserveTarget,'Reserve WRs receive real targeted calls');assert.ok(sawReturnScore,'Return TDs rotate scoring ownership for the visiting coach');const fullStored=await fullRoom.state.storage.get('room');assert.deepEqual(rebuild(fullStored).match.score,fullView.snapshot.score);assert.deepEqual(rebuild(fullStored).match.stats,fullView.snapshot.stats);
console.log(`PASS: ${fullRounds} version-4 PvP actions including toss, receive choice, kickoff meters, conversions, actor enforcement, both perspective rotations and durable replay.`);

console.log(`PASS: two real coach clients, ${rounds} authoritative PvP downs through final whistle, private calls/tokens/seeds, idempotency, concurrency, third-player rejection, durability, refresh recovery, mirrored perspectives, expiry and full stat agreement.`);

const counted=sql.prepare('SELECT * FROM stadium_games WHERE id=?').get('friend:'+full.id),expected=totalsFor(rebuild(fullStored).match);assert.equal(counted.touchdowns,expected.touchdowns);assert.equal(counted.tackles,expected.tackles);const priorTotals=sql.prepare('SELECT * FROM stadium_totals').get();await full.poll();await otherFull.poll();fullRoom.object=new PvPRoom(fullRoom.state,env);await full.poll();assert.deepEqual(sql.prepare('SELECT * FROM stadium_totals').get(),priorTotals,'Both coaches, reconnects and object restarts count a friend game once');assert.equal(priorTotals.games,sql.prepare('SELECT count(*) AS n FROM stadium_games').get().n);sql.close();
console.log('PASS: friend games count once globally across both coaches, polling, durable restarts and retries.');
