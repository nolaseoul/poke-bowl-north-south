import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {createHandler} from '../worker/index.mjs';
import rules from '../dist/league.js';
import draft from '../dist/draft.js';
import sim from '../dist/sim.js';
const sql=new DatabaseSync(':memory:');sql.exec(readFileSync(new URL('../migrations/0001_league.sql',import.meta.url),'utf8'));
const db={
 prepare(query){
  return {bind(...args){
   return {
    async first(){return sql.prepare(query).get(...args)||null},
    async all(){return {results:sql.prepare(query).all(...args)}},
    async run(){return sql.prepare(query).run(...args)}
   };
  }};
 }
};
const env={LEAGUE:db,SUPABASE_URL:'https://auth.example.test',SUPABASE_PUBLISHABLE_KEY:'public-test-key',GOOGLE_ENABLED:'true',ASSETS:{fetch:()=>new Response('assets')}};
const handler=createHandler(async(url,{headers})=>{assert.equal(url,env.SUPABASE_URL+'/auth/v1/user');assert.equal(headers.apikey,'public-test-key');const token=headers.Authorization.slice(7);if(token==='expired')return Response.json({error:'expired'},{status:401});return Response.json({id:token==='second'?'user-two':'user-one',is_anonymous:token==='guest'})});
async function request(path,method='GET',data,token='first',extra={}){const headers={'Content-Type':'application/json',...extra};if(token)headers.Authorization='Bearer '+token;const r=await handler(new Request('https://bowl.test/api/'+path,{method,headers,...(data===undefined?{}:{body:JSON.stringify(data)})}),env);return{status:r.status,data:await r.json(),headers:r.headers}}
assert.equal(rules.countries.length,249);assert.equal(new Set(rules.countries).size,249);
assert.equal((await request('config')).data.google,true);
assert.equal((await request('profile','GET',undefined,'expired')).status,401);
assert.equal((await request('profile','GET',undefined,'guest')).status,401);
assert.equal((await request('profile','GET',undefined,null)).status,401);
assert.equal((await request('profile')).data.profile,null);
assert.equal((await request('profile','PATCH',{name:'<script>',country:'US'})).status,400);
assert.equal((await request('profile','PATCH',{name:'Coach',country:'ZZ'})).status,400);
assert.equal((await request('profile','PATCH',{name:'Coach One',country:'JP'},'first',{Origin:'https://evil.test'})).status,403);
const created=await request('profile','PATCH',{name:'Coach One',country:'JP'});assert.equal(created.status,200);assert.equal(created.data.profile.games,0);assert.equal(created.data.profile.rank,null);assert.equal(created.headers.get('Cache-Control'),'private, no-store');
assert.equal((await request('leaderboard','GET',undefined,null)).data.players.length,0);
const ids=new draft.Draft().autoFill(rules.random(22)).map(p=>p.id);
assert.equal((await request('matches','POST',{lineup:ids.map(()=>25)})).status,400);
const ticket=(await request('matches','POST',{lineup:ids})).data;
const match=new sim.Match(rules.random(ticket.seed),{teams:rules.teams(ids,ticket.seed)}),calls=[];
while(!match.over){if(match.team===1){const defense=Object.keys(sim.defenseCalls)[match.plays%5];calls.push({defense});match.next(null,defense)}else{const call=match.plays%2?'deep':null;calls.push(call);match.next(call)}}
assert.deepEqual(rules.replay(ids,ticket.seed,calls).score,match.score);
assert.throws(()=>rules.replay(ids,ticket.seed,calls.slice(0,-1)),/Finish/);
assert.throws(()=>rules.replay(ids,ticket.seed,[...calls,null]),/history/);
assert.equal((await request('matches/'+ticket.id+'/finish','POST',{calls:[],score:[999,0]})).status,400);
assert.equal((await request('matches/'+ticket.id+'/finish','POST',{calls,score:[999,0]})).status,400);
assert.equal((await request('matches/'+ticket.id+'/finish','POST',{calls,score:match.score},'second')).status,404);
const saved=await request('matches/'+ticket.id+'/finish','POST',{calls,score:match.score});assert.equal(saved.status,200);assert.equal(saved.data.profile.games,1);assert.equal(saved.data.profile.rank,1);assert.equal(saved.data.profile.history[0].points_for,match.score[0]);
await request('matches/'+ticket.id+'/finish','POST',{calls,score:match.score});assert.equal((await request('profile')).data.profile.games,1,'Retry must not count twice');
await request('profile','PATCH',{name:'Coach Two',country:'US'},'second');
assert.equal((await request('profile','GET',undefined,'second')).data.profile.games,0,'Different account cannot see another profile history');
await request('profile','PATCH',{name:'Updated Coach',country:'GB'});assert.equal((await request('profile')).data.profile.games,1,'Editing profile must retain results');
assert.equal((await request('leaderboard?country=GB','GET',undefined,null)).data.players[0].name,'Updated Coach');assert.equal((await request('leaderboard?country=JP')).data.players.length,0);
assert.equal((await request('leaderboard?country=ZZ')).status,400);
for(let seed=1;seed<=50;seed++){const teams=rules.teams(ids,seed),m=new sim.Match(rules.random(seed),{teams}),history=[];while(!m.over){const call=m.team===0?Object.keys(sim.calls)[m.plays%5]:null;history.push(call);m.next(call)}const verified=rules.replay(ids,seed,history);assert.deepEqual(verified.score,m.score);assert.deepEqual(verified.stats,m.stats)}
const unconfigured=await handler(new Request('https://bowl.test/api/profile'),{...env,SUPABASE_URL:''});assert.equal(unconfigured.status,503);
console.log('PASS: 50 deterministic ranked games, session verification, guest exclusion, account isolation, country profiles, persistent SQL standings, forged score rejection, completed-only saving and idempotent retries.');sql.close();
