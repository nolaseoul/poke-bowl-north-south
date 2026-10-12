import assert from 'node:assert/strict';
import {PvPRoom,rebuild} from '../worker/pvp.mjs';
import {createHandler} from '../worker/index.mjs';
import Draft from '../dist/draft.js';
import Sim from '../dist/sim.js';
import League from '../dist/league.js';
import PvP from '../dist/pvp-client.js';
const rooms=new Map();
function makeState(){let queue=Promise.resolve();const values=new Map();return{storage:{async get(k){return structuredClone(values.get(k))},async put(k,v){values.set(k,structuredClone(v))},async setAlarm(t){this.alarm=t},async deleteAll(){values.clear()}},blockConcurrencyWhile(fn){const next=queue.then(fn);queue=next.catch(()=>{});return next}}}
const env={PVP:{idFromName:id=>id,get(id){if(!rooms.has(id)){const state=makeState();rooms.set(id,{state,object:new PvPRoom(state)})}return{fetch:r=>rooms.get(id).object.fetch(r)}}},ASSETS:{fetch:()=>new Response('assets')}};
const handler=createHandler();
function fetcher(url,options={}){return handler(new Request('https://bowl.test'+url,options),env)}
const stores=[0,1,2].map(()=>{const m=new Map();return{getItem:k=>m.get(k)||'',setItem:(k,v)=>m.set(k,v)}});
const ids=new Draft.Draft().autoFill(League.random(12)).map(p=>p.id),opponent=new Draft.Draft().autoFill(League.random(25)).map(p=>p.id);
const host=await PvP.RoomClient.create(ids,'Pika ⚡ FC',{fetch:fetcher,storage:stores[0]}),room=rooms.get(host.id);
let publicView=await (await fetcher('/api/rooms/'+host.id)).json();assert.equal(publicView.state,'waiting');assert.equal(publicView.token,undefined);assert.equal(publicView.seed,undefined);assert.equal(publicView.lineups,undefined);
const visitor=new PvP.RoomClient(host.id,{fetch:fetcher,storage:stores[1]});await visitor.join(opponent,'Eevee United');const intruder=new PvP.RoomClient(host.id,{fetch:fetcher,storage:stores[2]});await assert.rejects(intruder.join(ids,'Third wheel'),/Both coaches/);
await assert.rejects(intruder.call(0,'quick'),/browser/);await assert.rejects(host.call(0,'nope'),/valid play/);
const original=room.object;room.object=new PvPRoom(room.state);assert.equal((await host.poll()).names[1],'Eevee United','Object restart retains both coaches');assert.notEqual(room.object,original);
let view=await host.poll(),rounds=0,sawCounter=false;
while(view.state!=='finished'){
 const offense=view.snapshot.team,coaches=[host,visitor],offered=(await coaches[offense].poll()).hand,defOffered=(await coaches[1-offense].poll()).hand;
 assert.deepEqual((await coaches[offense].poll()).hand,offered,'Polling must not reroll the hand');
 const counter=defOffered.find(k=>offered.includes(Sim.defenseCalls[k].counters)),call=counter?Sim.defenseCalls[counter].counters:offered[0],defense=counter||defOffered[0];
 const unavailable=Object.keys(Sim.calls).find(k=>!offered.includes(k));await assert.rejects(coaches[offense].call(rounds,unavailable),/offered/);
 const locked=await coaches[offense].call(rounds,call);assert.equal(locked.round,rounds);assert.equal(locked.locked[offense],true);assert.equal(locked.pending,undefined);assert.equal(locked.calls,undefined);assert.equal(locked.seed,undefined);assert.equal(locked.coaches,undefined);
 const other=await coaches[1-offense].poll();assert.equal(other.locked[offense],true);assert.equal(JSON.stringify(other).includes('"offense":"'+call+'"'),false,'Unresolved calls must stay hidden');
 await coaches[offense].call(rounds,call);await assert.rejects(coaches[offense].call(rounds,offered.find(k=>k!==call)),/already locked/);
 await coaches[1-offense].call(rounds,defense);view=await host.poll();const theirs=await visitor.poll();assert.deepEqual(view.snapshot,theirs.snapshot);assert.equal(view.round,rounds+1);assert.equal(view.events.length,1);assert.equal(view.events[0].round,rounds+1);sawCounter||=view.events[0].event.counter;
 const flipped=PvP.rotate(theirs);assert.deepEqual(flipped.snapshot.score,[view.snapshot.score[1],view.snapshot.score[0]]);assert.equal(flipped.snapshot.team,view.snapshot.team^1);assert.equal(flipped.events[0].event.team,view.events[0].event.team^1);assert.deepEqual(flipped.events[0].event.ultimates.map(u=>u.team),view.events[0].event.ultimates.map(u=>u.team^1));
 for(const c of coaches)c.consume(++c.cursor);rounds++;
 await assert.rejects(coaches[0].call(rounds-1,'quick'),/down changed|finished/);
}
assert.ok(rounds>20&&rounds<200);assert.ok(sawCounter);const stored=await room.state.storage.get('room'),verified=rebuild(stored);assert.deepEqual(verified.match.score,view.snapshot.score);assert.deepEqual(verified.match.stats,view.snapshot.stats);assert.equal(verified.events.length,rounds);
for(let i=0;i<rounds;i++){assert.equal(verified.events[i].snapshot.plays,i+1);if(i){assert.notStrictEqual(verified.events[i].snapshot.stats,verified.events[i-1].snapshot.stats);assert.notStrictEqual(verified.events[i].snapshot.score,verified.events[i-1].snapshot.score)}}
const returning=new PvP.RoomClient(host.id,{fetch:fetcher,storage:stores[0]});assert.equal((await returning.poll()).seat,0,'Invite restores the correct coach from its private browser token');
const publicFinal=await (await fetcher('/api/rooms/'+host.id)).json();assert.equal(publicFinal.snapshot,undefined);assert.equal(publicFinal.events,undefined);
// Concurrent coach requests resolve exactly one down and reject a third-player join atomically.
const second=await PvP.RoomClient.create(ids,'Second duel',{fetch:fetcher,storage:stores[0]}),s2=new PvP.RoomClient(second.id,{fetch:fetcher,storage:stores[1]});await s2.join(ids,'Mirror squad');const h2=(await second.poll()).hand,d2=(await s2.poll()).hand;await Promise.all([second.call(0,h2[0]),s2.call(0,d2[0])]);assert.equal((await second.poll()).round,1);
const old=await room.state.storage.get('room');old.expires=Date.now()-1;await room.state.storage.put('room',old);await assert.rejects(host.poll(),/expired/);await room.object.alarm();assert.equal(await room.state.storage.get('room'),undefined);
const forbidden=await fetcher('/api/rooms',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://evil.test'},body:JSON.stringify({lineup:ids})});assert.equal(forbidden.status,403);
console.log(`PASS: two real coach clients, ${rounds} authoritative PvP downs through final whistle, private calls/tokens/seeds, idempotency, concurrency, third-player rejection, durability, refresh recovery, mirrored perspectives, expiry and full stat agreement.`);
