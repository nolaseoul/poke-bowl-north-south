(function(root){
'use strict';
function tokenKey(id){return 'poke-bowl-duel-'+id}
function rotate(view){const seat=view.seat,swap=arr=>seat?[arr[1],arr[0]]:arr;
 const state=s=>({...s,names:swap(s.names),score:swap(s.score),team:s.team^seat,actionTeam:s.actionTeam==null?null:s.actionTeam^seat,...(s.footballFlow?{openingReceiver:s.openingReceiver===null?null:s.openingReceiver^seat,toss:s.toss?{...s.toss,winner:s.toss.winner^seat}:null}:{}),stats:swap(s.stats),offensiveSnaps:s.offensiveSnaps?swap(s.offensiveSnaps):[0,0],usedUltimates:swap(s.usedUltimates),activeUltimates:swap(s.activeUltimates)});
 return{...view,names:swap(view.names),lineups:swap(view.lineups),locked:swap(view.locked),snapshot:state(view.snapshot),events:view.events.map(p=>({...p,snapshot:state(p.snapshot),event:{...p.event,team:p.event.team^seat,...(p.event.toss?{toss:{...p.event.toss,winner:p.event.toss.winner^seat}}:{}),...(p.event.scoringTeam!=null?{scoringTeam:p.event.scoringTeam^seat}:{}),...(p.event.receivingTeam!=null?{receivingTeam:p.event.receivingTeam^seat}:{}),scoreBefore:swap(p.event.scoreBefore),ultimateState:swap(p.event.ultimateState),ultimates:p.event.ultimates.map(u=>({...u,team:u.team^seat}))}}))};
}
class RoomClient{
 constructor(id,options={}){this.id=id;this.fetcher=options.fetch||root.fetch.bind(root);this.storage=options.storage||root.localStorage;this.cursor=0;this.revision=-1;this.active=false;this.token='';try{this.token=this.storage.getItem(tokenKey(id))||''}catch{}}
 remember(token){this.token=token;try{this.storage.setItem(tokenKey(this.id),token)}catch{}}
 async request(action='',data){const response=await this.fetcher('/api/rooms/'+this.id+(action?'/'+action:'')+'?after='+this.cursor,{method:data?'POST':'GET',headers:{'Content-Type':'application/json','X-Room-Token':this.token},...(data?{body:JSON.stringify(data)}:{}),signal:AbortSignal.timeout(12000)}),result=await response.json();if(!response.ok)throw Error(result.error||'Could not connect to your friend.');return result}
 async join(lineup,name){const result=await this.request('join',{lineup,name});this.remember(result.token);return this.poll()}
 deliver(view){if(view.revision!=null&&view.revision<this.revision)return;this.revision=view.revision??this.revision;this.view=view;this.onView?.(view)}
 async poll(){const view=await this.request();this.deliver(view);return view}
 async call(round,call,target=null){const view=await this.request('call',{round,call,...(target!==null?{target}:{})});this.deliver(view);return view}
 consume(round){this.cursor=Math.max(this.cursor,round)}
 start(onView,onError){this.stop();this.onView=onView;this.onError=onError;this.active=true;const tick=async()=>{try{await this.poll()}catch(error){if(this.active)this.onError?.(error)}finally{if(this.active)this.timer=setTimeout(tick,root.document?.hidden?3000:1000)}};tick()}
 stop(){this.active=false;clearTimeout(this.timer);this.onView=null}
 static async create(lineup,name,options={}){const fetcher=options.fetch||root.fetch.bind(root),response=await fetcher('/api/rooms',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({lineup,name,rulesVersion:options.rulesVersion??4}),signal:AbortSignal.timeout(12000)}),data=await response.json();if(!response.ok)throw Error(data.error||'Could not create an invitation.');const client=new RoomClient(data.id,options);client.remember(data.token);return client}
}
root.PokePvP={RoomClient,rotate,tokenKey};if(typeof module!=='undefined')module.exports=root.PokePvP;
})(typeof window!=='undefined'?window:globalThis);
