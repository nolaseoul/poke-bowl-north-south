import sim from '../dist/sim.js';
import draft from '../dist/draft.js';
import league from '../dist/league.js';
import naming from '../dist/team-name.js';
const fail=(text,status=400)=>{throw Object.assign(Error(text),{status})};
const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
const ttl=12*60*60*1000;
function coach(data){if(!draft.valid(data.lineup)||data.lineup.some(id=>!Number.isInteger(id)))fail('Choose 22 different Pokémon.');return{name:naming.name(data.name),lineup:data.lineup,token:crypto.randomUUID()+crypto.randomUUID()}}
export function snapshot(m){return structuredClone({names:m.names,score:m.score,team:m.team,ball:m.ball,first:m.first,down:m.down,quarter:m.quarter,clock:m.clock,over:m.over,plays:m.plays,series:m.series,stats:m.stats,usedUltimates:m.usedUltimates.map(s=>[...s]),activeUltimates:m.activeUltimates.map(s=>[...s]),actionTeam:m.actor(),stadiumRules:m.stadiumRules,offensiveSnaps:m.offensiveSnaps,footballFlow:m.footballFlow,phase:m.phase,toss:m.toss,openingReceiver:m.openingReceiver,pendingBoundary:m.pendingBoundary})}
export function rebuild(room,after=0){
 const teams=room.coaches.map(c=>new draft.Draft(c.lineup).roster()),m=new sim.Match(league.random(room.seed),{teams,names:room.coaches.map(c=>c.name),footballFlow:room.rulesVersion>=3,stadiumRules:room.rulesVersion>=4}),events=[];
 room.calls.forEach((calls,i)=>{const event=Object.hasOwn(calls,'action')?m.next(calls.action):m.next(calls.offense,calls.defense,calls.target??null);if(i>=after)events.push({round:i+1,event,snapshot:snapshot(m)})});return{match:m,events};
}
// One serialized, durable room owns both coaches' hidden calls and the authoritative result.
export class PvPRoom{
 constructor(state){this.state=state}
 async alarm(){await this.state.storage.deleteAll()}
 fetch(request){return this.state.blockConcurrencyWhile(async()=>{
  try{
   const url=new URL(request.url),method=request.method,token=request.headers.get('X-Room-Token');let room=await this.state.storage.get('room');
   if(url.pathname==='/create'&&method==='POST'){
    if(room)fail('This invitation already exists.',409);const data=await request.json();room={id:data.id,coaches:[coach(data),null],seed:crypto.getRandomValues(new Uint32Array(1))[0],revision:0,handVersion:2,rulesVersion:[3,4].includes(data.rulesVersion)?data.rulesVersion:1,calls:[],pending:[null,null],expires:Date.now()+ttl};await this.state.storage.put('room',room);await this.state.storage.setAlarm(room.expires);return json({id:room.id,token:room.coaches[0].token},201);
   }
   if(!room)fail('Invitation not found or expired.',404);if(Date.now()>room.expires)fail('This invitation expired. Create a new one.',410);
   let seat=room.coaches.findIndex(c=>c&&c.token===token);
   if(url.pathname==='/join'&&method==='POST'){
    if(seat>=0)return json({id:room.id,token:room.coaches[seat].token});if(room.coaches[1])fail('Both coaches have joined this duel.',409);
    room.coaches[1]=coach(await request.json());room.revision++;await this.state.storage.put('room',room);return json({id:room.id,token:room.coaches[1].token},201);
   }
   if(seat<0){if(method==='GET')return json({id:room.id,names:room.coaches.map(c=>c?.name||null),state:room.coaches[1]?'full':'waiting',expires:room.expires});fail('Reopen this invite in the browser you joined with.',401)}
   if(!room.coaches[1])return json({id:room.id,seat,names:room.coaches.map(c=>c?.name||null),state:'waiting',expires:room.expires});
   let {match,events}=rebuild(room,Math.max(0,Number(url.searchParams.get('after'))||0));
   if(url.pathname==='/call'&&method==='POST'){
    const data=await request.json();if(match.over)fail('The duel has finished.',409);
    if(data.round!==room.calls.length)fail('The down changed. Refresh your call.',409);
    const actionTurn=match.footballFlow?match.actor():null,offense=seat===match.team,choices=offense?sim.calls:sim.defenseCalls;
    if(actionTurn!==null){
     if(data.target!=null)fail('Receiver targets are only available on pass plays.');
     if(seat!==actionTurn)fail('Wait for the other coach’s football action.',409);
     try{match.next(data.call)}catch(error){fail(error.message)}
     room.calls.push({action:data.call});room.pending=[null,null];room.revision++;
     ({match,events}=rebuild(room,Math.max(0,Number(url.searchParams.get('after'))||0)));
    }else{
    if(typeof data.call!=='string'||!Object.hasOwn(choices,data.call))fail('Choose a valid play.');
    const target=data.target??null;
    if(target!==null){if(!offense)fail('Only the offense can choose a receiver.');try{sim.firstRead(data.call,match.lineup(seat),target)}catch(error){fail(error.message)}}
    const prior=room.pending[seat],priorCall=typeof prior==='string'?prior:prior?.call,priorTarget=typeof prior==='string'?null:prior?.target??null;
    if(prior&&(priorCall!==data.call||priorTarget!==target))fail('Your call is already locked for this down.',409);
    if(room.handVersion===2&&!league.hand(room.seed,room.calls.length,!offense).includes(data.call))fail('Choose one of your five offered plays.');
    room.pending[seat]=target===null?data.call:{call:data.call,target};room.revision++;
    if(room.pending.every(Boolean)){
     const attack=room.pending[match.team];room.calls.push({offense:typeof attack==='string'?attack:attack.call,defense:room.pending[1-match.team],...(typeof attack==='object'?{target:attack.target}:{})});room.pending=[null,null];
     ({match,events}=rebuild(room,Math.max(0,Number(url.searchParams.get('after'))||0)));
    }
    }
    await this.state.storage.put('room',room);
   }else if(method!=='GET')fail('Not found.',404);
   return json({id:room.id,seat,state:match.over?'finished':'playing',names:match.names,lineups:room.coaches.map(c=>c.lineup),round:room.calls.length,revision:room.revision,locked:room.pending.map(Boolean),snapshot:snapshot(match),hand:room.handVersion===2&&(!match.footballFlow||match.actor()===null)?league.hand(room.seed,room.calls.length,seat!==match.team):null,events,expires:room.expires});
  }catch(error){if(!error.status)console.error('Duel request failed',error.name);return json({error:error.status?error.message:'Could not connect to the duel. Try again.'},error.status||500)}
 })}
}
export async function routeRoom(request,env,readBody){
 if(!env.PVP)return json({error:'Friend matches are being connected. Try again shortly.'},503);
 const url=new URL(request.url);let id,action='';
 if(url.pathname==='/api/rooms'&&request.method==='POST'){
  const data=await readBody(request);id=crypto.randomUUID();const stub=env.PVP.get(env.PVP.idFromName(id));return stub.fetch(new Request('https://room/create',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...data,id})}));
 }
 const parsed=url.pathname.match(/^\/api\/rooms\/([a-f0-9-]{36})(?:\/(join|call))?$/);if(!parsed)return json({error:'Invitation not found.'},404);
 id=parsed[1];action=parsed[2]||'';if((action&&request.method!=='POST')||(!action&&request.method!=='GET'))return json({error:'Method not allowed.'},405);
 const data=request.method==='POST'?await readBody(request):undefined,stub=env.PVP.get(env.PVP.idFromName(id));
 return stub.fetch(new Request('https://room/'+action+url.search,{method:request.method,headers:{'Content-Type':'application/json','X-Room-Token':request.headers.get('X-Room-Token')||''},...(data?{body:JSON.stringify(data)}:{})}));
}
