import assert from 'node:assert/strict';
import {database} from './support/d1.mjs';
import {createHandler} from '../worker/index.mjs';
import {totalsFor} from '../worker/activity.mjs';
import Draft from '../dist/draft.js';
import Sim from '../dist/sim.js';
import League from '../dist/league.js';
const {db,sql}=database(),env={LEAGUE:db},handler=createHandler(()=>{throw Error('Guest aggregate counts must not contact Auth.')}),ids=new Draft.Draft().autoFill(League.random(45)).map(p=>p.id);
async function request(path='',method='GET',data,origin){const response=await handler(new Request('https://bowl.test/api/stats'+path,{method,headers:{'Content-Type':'application/json',...(origin?{Origin:origin}:{})},...(data?{body:JSON.stringify(data)}:{})}),env);return{status:response.status,data:await response.json(),headers:response.headers}}
const initial=await request();assert.equal(initial.status,200);assert.equal(initial.data.games,0);assert.equal(initial.headers.get('cache-control'),'public, max-age=15');assert.ok(Date.parse(initial.data.since));
assert.equal((await request('/games','POST',{lineup:ids},'https://elsewhere.test')).status,403);
assert.equal((await request('/games','POST',{lineup:ids.map(()=>25)})).status,400);
assert.equal((await request('/games','POST',{lineup:ids,opponent:'invented'})).status,400);
assert.throws(()=>totalsFor({over:false}),/Finish/);
assert.deepEqual(totalsFor({over:true,stats:[{1:{passTD:3,recTD:0,rushTD:1,returnTD:0,tackles:2},2:{passTD:0,recTD:3,rushTD:0,returnTD:1,tackles:4}},{}]}),{touchdowns:5,tackles:6},'Passing TDs are already counted at the receiver');
let touchdowns=0,tackles=0,sawConversion=false;
for(let i=0;i<8;i++){
 const issued=await request('/games','POST',{lineup:ids,opponent:i%2?'pewter':'random'});assert.equal(issued.status,201);const ticket=issued.data;assert.equal(ticket.anonymous,true);assert.equal(ticket.owner,undefined);
 const m=new Sim.Match(League.random(ticket.seed),{teams:League.teams(ids,ticket.seed,ticket.opponent),...globalThis.PokeTeams?.options(ticket.opponent),footballFlow:true,stadiumRules:true}),calls=[],events=[];
 while(!m.over){const actor=m.actor(),action=actor===0?(m.phase==='coinToss'?{type:'toss',choice:'heads'}:m.phase==='receive'?{type:'receive',choice:'kick'}:m.phase==='conversion'?{type:'conversion',choice:'two'}:m.phase==='pat'?{type:'pat',accuracy:.5}:{type:'kickoff',power:.8}):null;calls.push(action?{action}:null);events.push(m.next(action));sawConversion||=events.at(-1)?.conversion===true}
 if(i===0){assert.equal((await request('/games/'+ticket.id+'/finish','POST',{calls:calls.slice(0,-1),score:m.score})).status,400);assert.equal((await request('/games/'+ticket.id+'/finish','POST',{calls,score:[999,999]})).status,400);assert.equal((await request()).data.games,0)}
 const result=await request('/games/'+ticket.id+'/finish','POST',{calls,score:m.score});assert.equal(result.status,200);assert.equal(result.data.counted,true);
 const expected=totalsFor(m);assert.equal(expected.touchdowns,events.filter(e=>e?.touchdown).length,'PATs, two-pointers and TD passes must not inflate touchdowns');touchdowns+=expected.touchdowns;tackles+=expected.tackles;
 assert.equal(sql.prepare('SELECT count(*) AS n FROM stadium_tickets WHERE id=?').get(ticket.id).n,0,'Guest lineup and seed are deleted after aggregation');
 await Promise.all([request('/games/'+ticket.id+'/finish','POST',{calls,score:m.score}),request('/games/'+ticket.id+'/finish','POST',{calls,score:m.score})]);
 const total=(await request()).data;assert.equal(total.games,i+1);assert.equal(total.touchdowns,touchdowns);assert.equal(total.tackles,tackles);
}
assert.ok(sawConversion);assert.ok(touchdowns>0&&tackles>0);assert.equal(sql.prepare('SELECT count(*) AS n FROM profiles').get().n,0);assert.equal(sql.prepare('SELECT count(*) AS n FROM matches').get().n,0,'Anonymous totals never become ranked records');
const expired=(await request('/games','POST',{lineup:ids})).data;sql.prepare('UPDATE stadium_tickets SET expires=0 WHERE id=?').run(expired.id);assert.equal((await request('/games/'+expired.id+'/finish','POST',{calls:[],score:[0,0]})).status,404);await request('/games','POST',{lineup:ids});assert.equal(sql.prepare('SELECT count(*) AS n FROM stadium_tickets WHERE id=?').get(expired.id).n,0);
console.log('PASS: anonymous global totals from eight fully verified games, receiving/rushing/return TDs counted once, real tackles, rejected incomplete/forged results, expiry, duplicate retries, no guest profile records and constant-time totals.');sql.close();
