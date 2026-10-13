/* Fictional football scouting ratings: 1–99. These are not official Pokémon stats. */
(function(root){
const ultimates=typeof module!=='undefined'?require('./ultimates.js'):root.PokeUltimates;
const specs={QB:['Arm','Accuracy','Reads'],WR:['Hands','Routes','Release'],TE:['Hands','Blocking','Routes'],HB:['Vision','Carry','Elusiveness'],FB:['Lead block','Carry','Power'],LT:['Pass block','Run block','Footwork'],LG:['Pass block','Run block','Anchor'],C:['Pass block','Run block','Snaps'],RG:['Pass block','Run block','Anchor'],RT:['Pass block','Run block','Footwork'],DE:['Rush','Tackle','Shed'],NT:['Anchor','Tackle','Shed'],OLB:['Rush','Tackle','Coverage'],ILB:['Reads','Tackle','Coverage'],CB:['Coverage','Ball skills','Mirror'],S:['Reads','Ball skills','Coverage']};
// id, name, position, speed, strength, agility, stamina, awareness, position skills, scouting note
const rows=[
[9,'Blastoise','QB',52,88,56,88,91,[98,88,90],'A cannon arm and a steady pocket presence. Limited scrambling speed.'],
[135,'Jolteon','WR',99,42,97,78,82,[83,91,96],'Electric acceleration creates separation. Contact catches are a challenge.'],
[85,'Dodrio','WR',96,61,89,87,79,[87,84,91],'Three heads track the ball; long strides make a dangerous vertical threat.'],
[34,'Nidoking','TE',70,94,66,89,81,[84,92,76],'A bruising middle-of-the-field target who doubles as an extra blocker.'],
[112,'Rhydon','HB',59,98,48,94,76,[84,95,59],'A downhill runner with excellent ball security. Slow to change direction.'],
[128,'Tauros','FB',85,93,70,91,74,[94,87,97],'Explosive lead blocks open lanes. Power over finesse.'],
[45,'Vileplume','LT',40,76,58,91,88,[90,79,76],'Patient pass protection and excellent positioning offset modest size.'],
[76,'Golem','LG',31,99,32,96,78,[85,98,99],'A boulder in the run game. Vulnerable to speed around the edge.'],
[3,'Venusaur','C',44,94,47,97,95,[91,93,98],'The line’s anchor: clean snaps and smart protection calls.'],
[89,'Muk','RG',29,91,62,99,73,[84,94,96],'Absorbs contact and holds ground. Recovery speed is the weakness.'],
[115,'Kangaskhan','RT',65,95,69,95,89,[93,92,82],'Strong, alert protection with dependable footwork.'],
[68,'Machamp','DE',65,99,67,94,85,[97,96,98],'Four-arm leverage overwhelms blockers and finishes sacks.'],
[143,'Snorlax','NT',20,99,22,99,82,[99,94,91],'An immovable interior wall. Offers little pursuit outside the pocket.'],
[67,'Machoke','DE',61,94,62,90,78,[88,91,90],'A disciplined power rusher who sets a hard edge.'],
[57,'Primeape','OLB',90,85,89,75,65,[91,86,62],'Relentless blitz speed, with a tendency to overcommit.'],
[28,'Sandslash','OLB',73,86,77,88,83,[85,89,77],'Balanced edge defense; stays patient and tackles reliably.'],
[24,'Arbok','ILB',78,76,90,83,91,[94,86,89],'Reads misdirection and closes underneath passing lanes.'],
[62,'Poliwrath','ILB',73,94,74,98,86,[88,95,81],'A sure tackler with the endurance to patrol every down.'],
[123,'Scyther','CB',97,75,99,82,87,[95,85,98],'Elite mirror coverage; quick cuts keep receivers within reach.'],
[141,'Kabutops','CB',87,85,91,86,84,[89,88,91],'Physical coverage and sharp reactions challenge contested catches.'],
[82,'Magneton','S',66,78,69,99,98,[99,91,93],'Tracks the entire field. Anticipation makes up for average range.'],
[105,'Marowak','S',62,88,67,90,92,[94,85,88],'A smart deep safety and dependable last line of defense.']
];
const roster=rows.map(([id,name,pos,speed,strength,agility,stamina,awareness,skills,note])=>{let ratings={Speed:speed,Strength:strength,Agility:agility,Stamina:stamina,Awareness:awareness};specs[pos].forEach((s,i)=>ratings[s]=skills[i]);let athletic=['WR','CB'].includes(pos)?speed*.6+agility*.4:['LT','LG','C','RG','RT','NT','DE','FB'].includes(pos)?strength*.75+stamina*.25:(awareness+stamina)/2;return{id,name,pos,side:rows.findIndex(r=>r[0]===id)<11?'offense':'defense',ratings,note,ovr:Math.round((skills[0]*.4+skills[1]*.35+skills[2]*.25)*.8+athletic*.2)}});
const calls={inside:{name:'Inside run',kind:'run',description:'Power through the middle. Win the short yards.',color:'#9dd68c'},quick:{name:'Quick pass',kind:'pass',depth:[3,9],catchBonus:.08,pressure:.7,description:'Short routes. Get the ball out quickly.',color:'#ead879'},deep:{name:'Deep pass',kind:'pass',depth:[22,36],catchBonus:-.055,pressure:1.2,description:'Stretch the field. Bigger risk, bigger reward.',color:'#8ccbe7'},action:{name:'Play action',kind:'pass',depth:[12,25],catchBonus:.025,pressure:1.12,description:'Sell the run, then find the crossing route.',color:'#eead8b'},outside:{name:'Outside run',kind:'run',description:'Race to the edge. Let your speed do the work.',color:'#c1a8e8'}};
Object.assign(calls,{
 slants:{name:'Double slants',kind:'pass',target:'WR',receiver:0,depth:[7,14],catchBonus:.055,pressure:.82,release:1.25,lane:290,description:'Two sharp cuts inside. Hit the receiver in stride.',color:'#ff6e99'},
 screen:{name:'Bubble screen',kind:'pass',target:'WR',receiver:1,depth:[1,5],catchBonus:.12,pressure:.5,release:.92,lane:550,description:'A fast throw wide. Let the receiver create yards.',color:'#42cde3'},
 draw:{name:'Delay draw',kind:'run',fake:true,handoff:1.65,lane:350,description:'Show pass, then hand it off behind the rush.',color:'#b48cff'},
 sweep:{name:'Power sweep',kind:'run',lane:110,description:'Follow your fullback around the left edge.',color:'#ffad52'},
 seam:{name:'TE seam',kind:'pass',target:'TE',depth:[15,27],catchBonus:-.015,pressure:1.08,release:1.65,lane:420,description:'Send the tight end between the safeties.',color:'#69e1aa'}
});
function firstRead(call,offense,targetId=null){
 if(targetId!==null){
  const target=offense.find(p=>p.id===targetId&&p.side==='offense'&&['WR','TE'].includes(p.pos));
  if(!Number.isInteger(targetId)||calls[call]?.kind!=='pass'||!target)throw Error('Choose a WR or TE from your offense for a pass.');
  return target;
 }
 const c=calls[call]||calls.quick;
 if(c.kind==='run')return offense.find(p=>p.pos==='HB');
 return c.target==='TE'||call==='action'?offense.find(p=>p.pos==='TE'):offense.filter(p=>p.pos==='WR')[c.receiver??(call==='deep'?1:0)];
}
// A deal uses its own random source, so previews never consume simulation randomness.
function playHand(random=Math.random,defense=false,previous=[]){
 const shuffle=list=>{const a=list.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
 const pool=defense?defenseCalls:calls;
 let hand=defense?shuffle(Object.keys(pool)).slice(0,5):shuffle([...shuffle(Object.keys(calls).filter(k=>calls[k].kind==='run')).slice(0,2),...shuffle(Object.keys(calls).filter(k=>calls[k].kind==='pass')).slice(0,3)]);
 if(previous.length===5&&hand.every(k=>previous.includes(k))){
  const index=defense?0:hand.findIndex(k=>calls[k].kind==='pass'),replacement=shuffle(Object.keys(pool).filter(k=>!hand.includes(k)&& (defense||calls[k].kind===calls[hand[index]].kind)))[0];
  if(replacement)hand[index]=replacement;
 }
 return hand;
}
// Each defensive call predicts one offensive concept. A correct read spends one ready ultimate.
const defenseCalls={
 gap:{name:'Gap blitz',counters:'inside',positions:['NT','ILB','DE'],description:'Counter Inside run. Crush the A-gap.',color:'#9dd68c'},
 press:{name:'Press blitz',counters:'quick',positions:['CB','OLB'],description:'Counter Quick pass. Jump the short game.',color:'#ead879'},
 deep:{name:'Deep trap',counters:'deep',positions:['S','CB'],description:'Counter Deep pass. Spring the safety trap.',color:'#8ccbe7'},
 spy:{name:'QB spy',counters:'action',positions:['ILB','OLB'],description:'Counter Play action. Ignore the fake.',color:'#eead8b'},
 edge:{name:'Edge blitz',counters:'outside',positions:['OLB','DE'],description:'Counter Outside run. Seal the edge.',color:'#c1a8e8'},
 slant:{name:'Inside shade',counters:'slants',positions:['CB','ILB'],description:'Counter Double slants. Take away the inside cut.',color:'#ff6e99'},
 screen:{name:'Screen crash',counters:'screen',positions:['CB','OLB'],description:'Counter Bubble screen. Blow up the wide throw.',color:'#42cde3'},
 draw:{name:'Patient front',counters:'draw',positions:['NT','ILB'],description:'Counter Delay draw. Hold your gap through the fake.',color:'#b48cff'},
 sweep:{name:'Force left',counters:'sweep',positions:['OLB','DE'],description:'Counter Power sweep. Beat the lead blocker outside.',color:'#ffad52'},
 seam:{name:'Seam bracket',counters:'seam',positions:['S','ILB'],description:'Counter TE seam. Squeeze the tight end.',color:'#69e1aa'}
};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));const avg=a=>a.reduce((s,n)=>s+n,0)/a.length;
function line(){return{returns:0,returnYds:0,returnTD:0,att:0,cmp:0,passYds:0,passTD:0,ints:0,rush:0,rushYds:0,rushTD:0,targets:0,rec:0,recYds:0,recTD:0,tackles:0,sacks:0,picks:0,pressures:0,blocks:0,snaps:0,ultimates:0}}
class Match{
 constructor(random=Math.random,options={}){this.random=random;this.customTeams=!!options.teams;this.teams=options.teams||[roster,roster];if(this.teams.length!==2||this.teams.some(team=>team.length!==22||new Set(team.map(p=>p.id)).size!==22||Object.entries({QB:1,WR:2,TE:1,HB:1,FB:1,LT:1,LG:1,C:1,RG:1,RT:1,DE:2,NT:1,OLB:2,ILB:2,CB:2,S:2}).some(([pos,n])=>team.filter(p=>p.pos===pos).length!==n)))throw new Error('Each team needs a valid, unique 22-player lineup');this.baseTeams=this.teams;this.stadiumRules=options.stadiumRules===true;this.offensiveSnaps=[0,0];this.receiverPools=[];if(this.stadiumRules)this.installReceivers();this.footballFlow=options.footballFlow===true;this.phase=this.footballFlow?'coinToss':'scrimmage';this.toss=null;this.openingReceiver=null;this.pendingBoundary=null;this.cpuStyle=options.cpuStyle||null;this.names=options.names||['Kanto Blue','Rocket Red'];this.score=[0,0];this.team=0;this.ball=20;this.first=30;this.down=1;this.quarter=1;this.clock=120;this.over=false;this.plays=0;this.stats=[{},{}];for(let t=0;t<2;t++)for(const p of this.teams[t])this.stats[t][p.id]=line();this.last=null;this.series=1;this.usedUltimates=[new Set(),new Set()];this.activeUltimates=[new Set(),new Set()];}
 installReceivers(){
  const draft=typeof module!=='undefined'?require('./draft.js'):root.PokeDraft;
  this.teams=this.baseTeams.map((team,t)=>{
   const used=new Set(team.map(p=>p.id)),bench=draft.pool.filter(p=>!used.has(p.id)).map(p=>draft.player(p.id,'WR')).sort((a,b)=>b.ovr-a.ovr||a.id-b.id).slice(0,2);
   this.receiverPools[t]=[...team.filter(p=>p.pos==='WR'),team.find(p=>p.pos==='TE'),...bench].map((p,i)=>({...p,receiverDepth:i+1}));
   return[...team,...bench.map((p,i)=>({...p,receiverDepth:i+4,bench:true}))];
  });
 }
 lineup(team,round=this.offensiveSnaps[team]){
  if(!this.stadiumRules)return this.teams[team];
  const draft=typeof module!=='undefined'?require('./draft.js'):root.PokeDraft,pool=this.receiverPools[team],pairs=[[1,2],[3,4],[2,1],[4,3]],pair=pairs[round%4];let wr=0;
  return this.baseTeams[team].map(p=>{const i=p.pos==='WR'?(wr++===0?0:pair[0]):p.pos==='TE'?pair[1]:null;if(i===null)return p;const choice=pool[i];return{...draft.player(choice.id,p.pos),receiverDepth:i+1,receiverSlot:p.pos==='TE'?3:wr,slot:p.slot}});
 }
 returnUnits(team,returner){
  const coverage=this.lineup(team).filter(p=>p.side==='defense').slice(0,10).concat(this.teams[team].find(p=>p.pos==='QB'));
  const blocking=this.lineup(1-team).filter(p=>p.side==='defense'&&p.id!==returner.id).slice(0,10).concat(returner);
  return[coverage,blocking];
 }
 makeReturn(e,team,landing){
  const receiver=1-team,returner=this.teams[receiver].slice().sort((a,b)=>b.ratings.Speed-a.ratings.Speed||b.ratings.Agility-a.ratings.Agility||a.id-b.id)[0];
  const touchback=landing>=100,td=!touchback&&this.r()<.1,speed=returner.ratings.Speed,agility=returner.ratings.Agility;
  const breakaway=clamp(.12+(speed-55)*.012+(agility-60)*.003+(returner.ratings.Awareness-70)*.002,.1,.85);
  const yards=touchback?0:td?landing:Math.min(landing-1,this.r()<breakaway?25+Math.floor(this.r()*26):5+Math.floor(this.r()*20));
  const spot=touchback?(e.type==='punt'?20:25):100-landing+yards;
  Object.assign(e,{receivingTeam:receiver,scoringTeam:td?receiver:undefined,returner:returner.id,target:returner.id,landing,touchback,returnYards:yards,returnSpot:spot,end:100-spot,touchdown:td,score:td?7:0,complete:false});
  const units=this.returnUnits(team,returner);e.returnUnitIds=units.map(unit=>unit.map(p=>p.id));
  if(!touchback){const stats=this.stats[receiver][returner.id];stats.returns++;stats.returnYds+=yards;if(td)stats.returnTD++;
   const coverage=units[0].filter(p=>p.pos!=='QB'&&this.ultimateReady(team,p.id)).slice().sort((a,b)=>b.ratings.Speed-a.ratings.Speed).slice(0,4),blockers=units[1].filter(p=>p.id!==returner.id&&this.ultimateReady(receiver,p.id)).slice(0,4);
   this.activate(returner,receiver,e);for(let i=0;i<4;i++){if(blockers[i])this.activate(blockers[i],receiver,e);if(coverage[i])this.activate(coverage[i],team,e)}
   e.defender=coverage[0]?.id||units[0][0].id;if(!td)this.stats[team][e.defender].tackles++;
  }
  e.ultimateState=this.usedUltimates.map(set=>[...set]);e.text=touchback?`${e.type==='punt'?'PUNT':'KICKOFF'}! Touchback. ${this.names[receiver]} starts at its ${spot}.`:td?`TOUCHDOWN ${this.names[receiver]}! ${returner.name} takes the ${e.type==='punt'?'punt':'kickoff'} ${yards} yards to the house!`:`${returner.name} returns the ${e.type==='punt'?'punt':'kickoff'} ${yards} yards. ${this.names[receiver]} starts at its ${spot}.`;
 }
 ultimateReady(team,id){return !this.usedUltimates[team].has(id)}
 resetUltimates(){this.series++;this.usedUltimates.forEach(set=>set.clear())}
 activate(p,team,e){if(!this.ultimateReady(team,p.id))return;this.usedUltimates[team].add(p.id);this.activeUltimates[team].add(p.id);this.stats[team][p.id].ultimates++;e.ultimates.push({...ultimates.signature(p.id),team,pos:p.pos,boost:ultimates.description(p)})}
 r(){return this.random()}
 pick(a){return a[Math.floor(this.r()*a.length)]}
 rating(p,k,t){ // Position skills and stamina determine outcomes for each drafted team.
 let mod=this.customTeams?0:t===0?(p.side==='offense'?1:-1):(p.side==='offense'?-1:1);let fatigue=Math.min(5,this.plays*.08)*(100-p.ratings.Stamina)/40;return clamp((p.ratings[k]??p.ratings.Awareness)+mod+(this.activeUltimates[t].has(p.id)?ultimates.boost(p,k):0)+(p.ratings.Awareness-80)*.025-fatigue,1,99)}
 mean(ps,k,t){return avg(ps.map(p=>this.rating(p,k,t)))}
 chooseOffense(){if(this.team===1&&this.cpuStyle){const bags={ground:['inside','inside','draw','sweep','outside','quick','action'],air:['deep','deep','seam','slants','quick','screen','action','outside'],trick:['action','action','draw','screen','outside','quick','deep','inside'],blitz:['inside','outside','draw','sweep','quick','slants','screen','deep','seam','action'],balanced:['inside','outside','draw','sweep','quick','slants','screen','deep','seam','action']};return this.pick(bags[this.cpuStyle]||bags.balanced)}const short=this.first-this.ball<4;if(this.r()<(short?.62:.42))return this.pick(['inside','outside','draw','sweep']);return this.pick(['quick','slants','screen','deep','seam','action'])}
 next(call=null,defenseCall=null,targetId=null){if(this.over)return null;if(targetId!==null)firstRead(call,this.lineup(this.team),targetId);if(call!==null&&!Object.hasOwn(calls,call))throw new Error('Unknown play call');if(defenseCall!==null&&!Object.hasOwn(defenseCalls,defenseCall))throw new Error('Unknown defensive play');this.activeUltimates.forEach(set=>set.clear());call=call||this.chooseOffense();defenseCall=defenseCall||this.pick(this.team===0&&this.cpuStyle==='blitz'?['gap','press','press','edge','edge','spy','deep']:Object.keys(defenseCalls));const called=calls[call];const t=this.team,d=1-t,off=this.lineup(t).filter(p=>p.side==='offense'),def=this.lineup(d).filter(p=>p.side==='defense'),qb=off.find(p=>p.pos==='QB'),hb=off.find(p=>p.pos==='HB'),fb=off.find(p=>p.pos==='FB'),ol=off.filter(p=>['LT','LG','C','RG','RT'].includes(p.pos)),rushers=def.filter(p=>['DE','NT','OLB'].includes(p.pos)),db=def.filter(p=>['CB','S'].includes(p.pos));
 let e={receiverRound:this.offensiveSnaps[t],defenseCall,counter:false,series:this.series,ultimates:[],scoreBefore:this.score.slice(),team:t,start:this.ball,down:this.down,first:this.first,quarter:this.quarter,clock:this.clock,type:'run',playCall:call,gain:0,qb:qb.id,fullback:fb.id,target:hb.id,defender:0,complete:false,turnover:false,score:0,text:''};const names=this.names;const s=(p,team=t)=>this.stats[team][p.id];const R=(p,k,team=t)=>this.rating(p,k,team);
 off.forEach(p=>s(p).snaps++);def.forEach(p=>s(p,d).snaps++);
 const specialTeams=this.down===4&&this.ball<92,correct=defenseCalls[defenseCall].counters===call,ready=def.filter(p=>this.ultimateReady(d,p.id)),preferred=ready.filter(p=>defenseCalls[defenseCall].positions.includes(p.pos));
 e.counterRead=correct&&!specialTeams;e.counterBlocked=e.counterRead&&!ready.length;
 if(e.counterRead&&ready.length){const defender=this.pick(preferred.length?preferred:ready);this.activate(defender,d,e);e.counter=true;e.type='sack';e.target=qb.id;e.defender=defender.id;e.counterLoss=5+Math.floor(this.r()*6);e.gain=-e.counterLoss;s(defender,d).sacks++;s(defender,d).pressures++;e.text=`COUNTER! ${defender.name} unleashes ${ultimates.signature(defender.id).name} on ${qb.name}. ${e.counterLoss}-yard loss.`;}
 else
 if(this.down===4&&this.ball<92){e.type=this.ball>=61?'kick':'punt';if(e.type==='kick'){let distance=117-this.ball;e.score=this.r()<clamp(.94-(distance-30)*.018,.25,.95)?3:0;e.text=e.score?`${names[t]} converts a ${distance}-yard field goal.`:`${names[t]} misses from ${distance} yards.`;}else{e.text=`${names[t]} punts. The defense wins the series.`;if(this.stadiumRules)this.makeReturn(e,t,Math.min(106,e.start+38+Math.floor(this.r()*10)))}e.turnover=true;}
 else if(called?called.kind==='run':this.r()<clamp(.42+(this.first-this.ball<4?.2:0),.25,.7)){
 e.type='run';e.playCall=call||'inside';let runner=['outside','draw','sweep'].includes(call)?hb:this.r()<.12?fb:hb;e.target=runner.id;s(runner).rush++;const blockers=ol.concat(fb),readyBlockers=blockers.filter(p=>this.ultimateReady(t,p.id));let blocker=this.pick(readyBlockers.length?readyBlockers:blockers);const tackler=this.pick(def.filter(p=>p.pos!=='NT'));e.defender=tackler.id;const front=this.pick(rushers);[runner,blocker].forEach(p=>this.activate(p,t,e));[tackler,front].forEach(p=>this.activate(p,d,e));let advantage=(this.mean(ol,'Run block',t)*.7+R(off.find(p=>p.pos==='TE'),'Blocking')*.3+R(fb,'Lead block'))/2-(this.mean(rushers,'Shed',d)*.8+R(def.find(p=>p.pos==='NT'),'Anchor',d)*.2);let gain=Math.floor(-3+this.r()*12+advantage*.1+(R(runner,'Vision')-75)*.06+((R(runner,'Strength')+R(runner,'Power'))/2-80)*.05+(R(runner,'Speed')-65)*.03+(R(runner,'Elusiveness')-70)*.03);if(call==='inside')gain+=1;if(call==='outside')gain+=Math.round((R(runner,'Speed')-78)*.09+(R(runner,'Elusiveness')-78)*.05)-1;if(call==='draw')gain+=Math.round((R(qb,'Reads')-80)*.07)-1;if(call==='sweep')gain+=Math.round((R(fb,'Lead block')+R(runner,'Speed')-160)*.08)-1;if(this.r()<.055)gain+=10+Math.floor(this.r()*16);e.gain=gain;if(gain>2)s(blocker).blocks++;if(this.r()<(100-R(runner,'Carry'))*.00075+(100-R(off.find(p=>p.pos==='C'),'Snaps'))*.0001){e.turnover=true;e.fumble=true;}e.text=`${runner.name} rushes ${gain>=0?'for '+gain:'back '+Math.abs(gain)} yards${e.fumble?' — fumble!':''}.`;
 }else{
 e.type='pass';let targets=off.filter(p=>['WR','TE'].includes(p.pos));let target=called?firstRead(call,off,targetId):this.pick(targets);e.target=target.id;s(qb).att++;let defender=def.find(p=>p.pos===(target.pos==='TE'?'ILB':'CB'))||db[0];if(this.r()<.3)defender=this.pick(db);let rusher=this.pick(rushers);e.defender=defender.id;[qb,target].forEach(p=>this.activate(p,t,e));[defender,rusher].forEach(p=>this.activate(p,d,e));let pressure=clamp(.18+(this.mean(rushers,'Rush',d)-(this.mean(ol,'Pass block',t)*.8+avg(ol.map(p=>R(p,p.pos==='C'?'Snaps':['LT','RT'].includes(p.pos)?'Footwork':'Anchor')))*.2))*.008,.08,.4);if(this.r()<pressure*(called?.pressure||1)){s(rusher,d).pressures++;if(this.r()<.42){e.type='sack';e.gain=-4-Math.floor(this.r()*5);e.defender=rusher.id;s(qb).att--;s(rusher,d).sacks++;e.text=`${rusher.name} collapses the pocket. ${qb.name} sacked for ${-e.gain}.`;}}
 if(e.type!=='sack'){s(target).targets++;let separation=(R(target,'Routes')+R(target,'Release')+R(target,'Speed'))/3-(R(defender,'Coverage',d)*.6+R(defender,'Mirror',d)*.2+R(defender,'Reads',d)*.2+R(defender,'Agility',d))/2;let depth=called?called.depth[0]+this.r()*(called.depth[1]-called.depth[0]):this.r()<.3?18+this.r()*18:4+this.r()*11;e.playCall=call||(depth>18?'deep':'quick');let catchRate=clamp(.69+(R(qb,'Accuracy')+R(qb,'Reads')+R(target,'Hands')-255)*.003+separation*.007-(depth>18?.13:0)+(called?.catchBonus||0),.3,.94);let interception=clamp(.022+(R(defender,'Ball skills',d)-R(qb,'Reads'))*.001,.01,.07);if(this.r()<interception){e.turnover=true;e.interception=true;e.defender=defender.id;s(qb).ints++;s(defender,d).picks++;e.text=`${defender.name} intercepts ${qb.name}! Possession flips.`;}else if(this.r()<catchRate){e.complete=true;e.gain=Math.floor(depth+(R(qb,'Arm')-90)*.15+this.r()*5+(R(target,'Agility')-80)*.06);s(qb).cmp++;s(this.pick(ol)).blocks++;e.text=`${qb.name} finds ${target.name} for ${e.gain} yards.`;}else{e.gain=0;e.text=`${qb.name} targets ${target.name}. Incomplete.`;}}
 }
 if(['run','sack'].includes(e.type)||e.complete){if(!e.defender)e.defender=this.pick(def.filter(p=>p.pos!=='NT')).id;let tackler=def.find(p=>p.id===e.defender); // Tackle skill affects yards after contact.
 if(e.type!=='sack'&&this.r()>(R(tackler,'Tackle',d)*.85+R(tackler,'Reads',d)*.15)/110)e.gain+=2;
 e.end=clamp(e.start+e.gain,0,100);e.gain=e.end-e.start;if(e.end===100){e.score=7;e.touchdown=true;e.turnover=true;e.text=`TOUCHDOWN ${names[t]}! ${off.find(p=>p.id===e.target).name} takes it home.`;}else if(e.end===0){e.safety=true;e.turnover=true;e.text=(e.counter?e.text+' ':'')+`SAFETY! ${names[d]} earns two points.`;}else s(tackler,d).tackles++;
 if(e.type==='run'&&!e.touchdown&&!e.safety)e.text=`${off.find(p=>p.id===e.target).name} rushes ${e.gain>=0?'for '+e.gain:'back '+Math.abs(e.gain)} yards${e.fumble?' — fumble!':''}.`;if(e.complete&&!e.touchdown&&!e.safety)e.text=`${qb.name} finds ${off.find(p=>p.id===e.target).name} for ${e.gain} yards.`;
 if(e.type==='run'){let runner=off.find(p=>p.id===e.target);s(runner).rushYds+=e.gain;if(e.touchdown)s(runner).rushTD++;}if(e.complete){let target=off.find(p=>p.id===e.target);s(qb).passYds+=e.gain;s(target).rec++;s(target).recYds+=e.gain;if(e.touchdown){s(qb).passTD++;s(target).recTD++;}}
 }else if(!e.returner)e.end=e.start;
 if(e.counterBlocked)e.text+=' Correct read, but every defensive ultimate is spent.';
 e.ultimateState=this.usedUltimates.map(set=>[...set]);
 this.score[e.scoringTeam??t]+=e.score;if(e.safety)this.score[d]+=2;
 if(e.turnover){this.team=d;this.ball=e.returner?e.returnSpot:e.type==='punt'?clamp(100-e.start-38+Math.floor(this.r()*10),10,45):e.score||e.safety?20:clamp(100-e.end,1,99);this.down=1;this.first=Math.min(100,this.ball+10);}
 else{this.ball=e.end;if(this.ball>=this.first){this.down=1;this.first=Math.min(100,this.ball+10);e.firstDown=true;}else{this.down++;if(this.down>4){e.turnover=true;e.text+=' Turnover on downs.';this.team=d;this.ball=100-this.ball;this.down=1;this.first=Math.min(100,this.ball+10);}}}
 let halftime=false;this.clock-=e.type==='pass'&&!e.complete?8:14+Math.floor(this.r()*12);if(this.clock<=0){if(this.quarter===4){this.clock=0;this.over=true;}else{this.quarter++;this.clock=120;if(this.quarter===3){halftime=true;this.team=1;this.ball=20;this.first=30;this.down=1;}}}
 if(e.firstDown||e.turnover||halftime)this.resetUltimates();
 if(this.stadiumRules)this.offensiveSnaps[t]++;this.plays++;e.text=e.text.replace(/for -([0-9]+)/,'for a loss of $1');this.last=e;return e;
 }
}

// Version 3 adds explicit dead-ball decisions without changing existing match replays.
const scrimmageNext=Match.prototype.next;
Match.prototype.actor=function(){if(this.viewActor!==undefined)return this.viewActor;return this.phase==='coinToss'?0:this.phase==='receive'?this.toss.winner:['kickoff','conversion','pat'].includes(this.phase)?this.team:null};
Match.prototype.autoAction=function(){
 switch(this.phase){
  case 'coinToss':return{type:'toss',choice:'heads'};
  case 'receive':return{type:'receive',choice:'receive'};
  case 'conversion':return{type:'conversion',choice:this.quarter===4&&this.score[1-this.team]-this.score[this.team]===2?'two':'pat'};
  case 'pat':return{type:'pat',accuracy:clamp(.5+(this.r()-.5)*.28,0,1)};
  case 'kickoff':return{type:'kickoff',power:.68+this.r()*.32};
  default:return null;
 }
};
Match.prototype.kickoff=function(team){this.phase='kickoff';this.team=team;this.ball=35;this.first=45;this.down=1;this.resetUltimates()};
Match.prototype.afterConversion=function(team){
 const boundary=this.pendingBoundary;this.pendingBoundary=null;
 if(boundary===5){this.clock=0;this.over=true;this.phase='final';return}
 if(boundary){this.quarter=boundary;this.clock=120}
 this.kickoff(boundary===3?this.openingReceiver:team);
};
Match.prototype.specialEvent=function(type,team){const qb=this.teams[team].find(p=>p.pos==='QB'),fb=this.teams[team].find(p=>p.pos==='FB');return{type,team,start:this.ball,end:this.ball,first:this.first,down:this.down,quarter:this.quarter,clock:this.clock,scoreBefore:this.score.slice(),score:0,gain:0,qb:qb.id,fullback:fb.id,target:qb.id,defender:this.teams[1-team].find(p=>p.pos==='S').id,complete:false,turnover:false,ultimates:[],ultimateState:this.usedUltimates.map(s=>[...s]),text:''}};
Match.prototype.next=function(call=null,defenseCall=null,targetId=null){
 if(!this.footballFlow)return scrimmageNext.call(this,call,defenseCall,targetId);
 if(this.over)return null;
 if(['coinToss','receive','conversion','pat','kickoff'].includes(this.phase)){
  if(targetId!==null)throw Error('Receiver targets are only available on pass plays.');
  const a=call===null?this.autoAction():call;
  if(!a||typeof a!=='object'||Array.isArray(a))throw Error('Choose the current football action.');
  const expected={coinToss:'toss',receive:'receive',conversion:'conversion',pat:'pat',kickoff:'kickoff'}[this.phase];
  if(a.type!==expected)throw Error('The football action changed.');
  const team=this.actor(),e=this.specialEvent(a.type,team);
  if(this.phase==='coinToss'){
   if(!['heads','tails'].includes(a.choice))throw Error('Call heads or tails.');
   const result=this.r()<.5?'heads':'tails',winner=result===a.choice?0:1;this.toss={choice:a.choice,result,winner};this.phase='receive';e.presentation='coin';e.toss={...this.toss};e.text=`${a.choice.toUpperCase()} called. ${result.toUpperCase()}! ${this.names[winner]} wins the toss.`;
  }else if(this.phase==='receive'){
   if(!['receive','kick'].includes(a.choice))throw Error('Choose kick or receive.');
   this.openingReceiver=a.choice==='receive'?team:1-team;this.kickoff(1-this.openingReceiver);e.presentation='setup';e.text=`${this.names[team]} chooses to ${a.choice}. ${this.names[this.openingReceiver]} receives first; ${this.names[1-this.openingReceiver]} receives after halftime.`;
  }else if(this.phase==='conversion'){
   if(!['pat','two'].includes(a.choice))throw Error('Choose extra point or two-point conversion.');
   this.phase=a.choice==='pat'?'pat':'twoPoint';this.ball=a.choice==='pat'?85:98;this.first=100;this.down=1;this.resetUltimates();e.presentation='setup';e.text=a.choice==='pat'?`${this.names[team]} lines up for the extra point.`:`${this.names[team]} goes for two from the 2-yard line!`;
  }else if(this.phase==='pat'){
   if(typeof a.accuracy!=='number'||!Number.isFinite(a.accuracy)||a.accuracy<0||a.accuracy>1)throw Error('Invalid kick accuracy.');
   e.type='kick';e.extraPoint=true;e.accuracy=a.accuracy;e.score=Math.abs(a.accuracy-.5)<=.12?1:0;e.end=100;e.text=e.score?`EXTRA POINT GOOD! ${this.names[team]} adds one.`:`NO GOOD! ${this.names[team]} misses the extra point.`;this.score[team]+=e.score;this.afterConversion(team);
  }else{
   if(typeof a.power!=='number'||!Number.isFinite(a.power)||a.power<0||a.power>1)throw Error('Invalid kickoff power.');
   if(this.stadiumRules){
    const landing=60+Math.round(a.power*46+this.r()*4);e.power=a.power;this.activeUltimates.forEach(set=>set.clear());this.makeReturn(e,team,landing);
    this.team=e.receivingTeam;this.down=1;this.first=Math.min(100,e.returnSpot+10);this.ball=e.returnSpot;
    if(e.touchdown){e.score=6;this.score[e.receivingTeam]+=6;this.phase='conversion';this.ball=100;this.first=100}else{this.phase='scrimmage';this.resetUltimates()}
   }else{
   const receiver=1-team,returner=this.teams[receiver].find(p=>p.pos==='WR'),landing=60+Math.round(a.power*46+this.r()*4),touchback=landing>=100;
   const returned=touchback?0:Math.round(7+this.r()*12+(returner.ratings.Speed-75)*.1),spot=touchback?25:clamp(100-landing+returned,1,65);
   e.power=a.power;e.landing=landing;e.touchback=touchback;e.returnYards=returned;e.returner=returner.id;e.target=returner.id;e.receivingTeam=receiver;e.end=100-spot;e.text=touchback?`KICKOFF! ${this.names[team]} boots a touchback. ${this.names[receiver]} starts at its 25.`:`KICKOFF! ${returner.name} returns ${returned} yards. ${this.names[receiver]} starts at its ${spot}.`;
   this.phase='scrimmage';this.team=receiver;this.ball=spot;this.first=Math.min(100,spot+10);this.down=1;this.resetUltimates();
   }
  }
  this.plays++;this.last=e;return e;
 }
 if(call!==null&&typeof call!=='string')throw Error('Choose a valid play.');
 const team=this.team,quarter=this.quarter,clock=this.clock,score=this.score.slice(),tryTwo=this.phase==='twoPoint',stats=tryTwo?structuredClone(this.stats):null;
 const e=scrimmageNext.call(this,call,defenseCall,targetId);
 if(tryTwo){
  const good=e.touchdown&&!e.fumble&&!e.interception;this.score=score;this.score[team]+=good?2:0;this.stats=stats;this.quarter=quarter;this.clock=clock;this.over=false;e.touchdown=false;e.conversion=true;e.score=good?2:0;e.safety=false;e.turnover=false;e.text=good?`TWO POINTS! ${this.names[team]} converts with ${this.teams[team].find(p=>p.id===e.target).name}.`:`TWO-POINT TRY STOPPED! ${this.names[1-team]} holds the line.`;this.afterConversion(team);
 }else if(e.touchdown){
  this.score[e.scoringTeam??team]--;e.score=6;this.pendingBoundary=this.over?5:this.quarter!==quarter?this.quarter:null;this.over=false;if(this.pendingBoundary){this.quarter=quarter;this.clock=0}this.phase='conversion';this.team=e.scoringTeam??team;this.ball=100;this.first=100;this.down=1;
 }else if(this.over)this.phase='final';
 else if(this.quarter===3&&quarter===2)this.kickoff(this.openingReceiver);
 else if(e.score||e.safety)this.kickoff(team);
 else this.phase='scrimmage';
 this.last=e;return e;
};

root.PokeSim={roster,specs,calls,defenseCalls,Match,ultimates,firstRead,playHand};if(typeof module!=='undefined')module.exports=root.PokeSim;
})(typeof window!=='undefined'?window:globalThis);
