import league from '../dist/league.js';
import {routeRoom} from './pvp.mjs';
export {PvPRoom} from './pvp.mjs';
const {countries,teams,replay}=league;
const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
const fail=(message,status=400)=>{throw Object.assign(Error(message),{status})};
const ranked=`SELECT *, ROW_NUMBER() OVER (ORDER BY trophies DESC, wins DESC, differential DESC, user_id ASC) AS rank FROM standings WHERE games>0`;
async function body(request){
 if(!request.headers.get('content-type')?.includes('application/json'))fail('Send JSON.');
 const reader=request.body?.getReader();if(!reader)fail('Missing request body.');let parts=[],size=0;
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>16384){await reader.cancel();fail('Request too large.',413)}parts.push(value)}
 const bytes=new Uint8Array(size);let offset=0;for(const part of parts){bytes.set(part,offset);offset+=part.length}
 try{return JSON.parse(new TextDecoder().decode(bytes))}catch{fail('Invalid JSON.')}
}
async function identity(request,env,fetcher){
 if(!env.SUPABASE_URL||!env.SUPABASE_PUBLISHABLE_KEY)fail('Account service is not configured yet. You can still play as a guest.',503);
 const authorization=request.headers.get('authorization');if(!/^Bearer [A-Za-z0-9._-]+$/.test(authorization||''))fail('Sign in to save results.',401);
 let response;try{response=await fetcher(env.SUPABASE_URL+'/auth/v1/user',{headers:{Authorization:authorization,apikey:env.SUPABASE_PUBLISHABLE_KEY},signal:AbortSignal.timeout(8000)})}catch{fail('Account service is temporarily unavailable.',503)}
 if(!response.ok)fail('Your session expired. Sign in again.',401);
 const user=await response.json();if(!user.id||user.is_anonymous)fail('Guest results are not recorded.',401);return user.id;
}
async function profile(db,id){
 const result=await db.prepare(`SELECT s.*,r.rank FROM standings s LEFT JOIN (${ranked}) r ON s.user_id=r.user_id WHERE s.user_id=?`).bind(id).first();
 if(!result)return null;
 const history=await db.prepare('SELECT id,completed_at,points_for,points_against,plays FROM matches WHERE user_id=? AND completed_at IS NOT NULL ORDER BY completed_at DESC LIMIT 10').bind(id).all();
 return {...result,history:history.results};
}
export function createHandler(fetcher=fetch){return async(request,env)=>{
 const url=new URL(request.url),path=url.pathname,method=request.method;
 if(!path.startsWith('/api/'))return env.ASSETS.fetch(request);
 try{
  if(!['GET','POST','PATCH'].includes(method))fail('Method not allowed.',405);
  if(method!=='GET'&&request.headers.get('origin')&&request.headers.get('origin')!==url.origin)fail('Invalid request origin.',403);
  if(path==='/api/config'&&method==='GET')return json({url:env.SUPABASE_URL||null,key:env.SUPABASE_PUBLISHABLE_KEY||null,google:env.GOOGLE_ENABLED==='true'});
  if(path==='/api/rooms'||path.startsWith('/api/rooms/'))return await routeRoom(request,env,body);
  if(!env.LEAGUE)fail('Leaderboard is temporarily unavailable.',503);
  if(path==='/api/leaderboard'&&method==='GET'){
   const country=url.searchParams.get('country');if(country&&!countries.includes(country))fail('Choose a valid country.');
   const board=await env.LEAGUE.prepare(`SELECT * FROM (${ranked}) ${country?'WHERE country=?':''} ORDER BY rank LIMIT 100`).bind(...(country?[country]:[])).all();return json({players:board.results});
  }
  const userId=await identity(request,env,fetcher);
  if(path==='/api/profile'&&method==='GET')return json({profile:await profile(env.LEAGUE,userId)});
  if(path==='/api/profile'&&method==='PATCH'){
   const data=await body(request),name=typeof data.name==='string'?data.name.normalize('NFKC').trim():'';
   if(name.length<2||name.length>20||/[\p{C}<>]/u.test(name)||!countries.includes(data.country))fail('Choose a 2–20 character name and a country.');
   await env.LEAGUE.prepare('INSERT INTO profiles(user_id,name,country) VALUES(?,?,?) ON CONFLICT(user_id) DO UPDATE SET name=excluded.name,country=excluded.country').bind(userId,name,data.country).run();return json({profile:await profile(env.LEAGUE,userId)});
  }
  if(path==='/api/matches'&&method==='POST'){
   if(!await profile(env.LEAGUE,userId))fail('Choose your name and country first.',409);
   const data=await body(request),seed=crypto.getRandomValues(new Uint32Array(1))[0];teams(data.lineup,seed);
   const id=crypto.randomUUID();await env.LEAGUE.prepare('INSERT INTO matches(id,user_id,seed,lineup) VALUES(?,?,?,?)').bind(id,userId,seed,JSON.stringify(data.lineup)).run();return json({id,seed,owner:userId},201);
  }
  const finish=path.match(/^\/api\/matches\/([a-f0-9-]{36})\/finish$/);
  if(finish&&method==='POST'){
   const stored=await env.LEAGUE.prepare('SELECT * FROM matches WHERE id=? AND user_id=?').bind(finish[1],userId).first();if(!stored)fail('Match not found.',404);
   if(stored.completed_at)return json({saved:true,profile:await profile(env.LEAGUE,userId)});
   const data=await body(request),match=replay(JSON.parse(stored.lineup),stored.seed,data.calls);
   if(!Array.isArray(data.score)||data.score.length!==2||data.score.some((n,i)=>n!==match.score[i]))fail('The match result could not be verified.');
   await env.LEAGUE.prepare("UPDATE matches SET completed_at=strftime('%Y-%m-%dT%H:%M:%fZ','now'),points_for=?,points_against=?,plays=? WHERE id=? AND user_id=? AND completed_at IS NULL").bind(...match.score,match.plays,stored.id,userId).run();return json({saved:true,profile:await profile(env.LEAGUE,userId)});
  }
  fail('Not found.',404);
 }catch(error){const validation=/Pokémon|history|Finish the match/.test(error.message);if(!error.status&&!validation)console.error('League request failed',error.name);return json({error:(error.status||validation)?error.message:'Could not complete that request. Please try again.'},error.status||(validation?400:500))}
}}
export default {fetch:createHandler()};
