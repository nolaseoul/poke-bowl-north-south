'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const PokeSim=require('../dist/sim.js');
const PokeDraft=require('../dist/draft.js');
const PokeMotion=require('../dist/motion.js');
const PokeBattle=require('../dist/battle.js');
const PokeStadium=require('../dist/stadium.js');
const {cuesBetween}=require('../dist/fx.js');
const heard=new Set();
let replayCount=0,ellipseCount=0,celebrationCount=0,heldFrames=0,counterCount=0,defenseWaits=0,powerFrames=0;
function randomFor(seed){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}}
for(let seed=1;seed<=12;seed++){
  const random=randomFor(seed),elements=new Map(),musicCalls=[],voiceCalls=[];
  const context2d=new Proxy({
    measureText:text=>({width:text.length*6}),
    ellipse(x,y,rx,ry){assert.ok([x,y,rx,ry].every(Number.isFinite));assert.ok(rx>=0&&ry>=0,'Canvas ellipse radii must be non-negative');ellipseCount++}
  },{get:(target,key)=>key in target?target[key]:()=>{}});
  function element(id){if(!elements.has(id))elements.set(id,{id,value:'0',style:{},dataset:{},textContent:'',innerHTML:'',classList:{add(){},remove(){},toggle(){}},setAttribute(){},getContext:()=>context2d,querySelectorAll:()=>[],showModal(){},close(){}});return elements.get(id)}
  const speedButtons=[1,2,4].map(n=>({...element('speed'+n),dataset:{speed:String(n)}}));
  const document={hidden:false,getElementById:element,querySelector:()=>element('featured'),querySelectorAll:selector=>selector==='[data-speed]'?speedButtons:[],addEventListener(){}};
  let nextFrame;
  const math=Object.create(Math);math.random=random;
  class ChipMusic{constructor(){this.volume=.35;this.track='route';this.enabled=false}setVolume(v){this.volume=v}setTrack(v){this.track=v}play(){this.enabled=true;return Promise.resolve()}stop(){this.enabled=false}celebrate(kind){musicCalls.push(kind)}}
  class FieldFX{preload(){}setEnabled(v){this.enabled=v}prepare(){return Promise.resolve()}stop(){}announce(kind){voiceCalls.push(kind);this.play(kind)}play(kind){if(this.enabled)heard.add(kind)}}
  const sandbox={PokeFX:{FieldFX,cuesBetween},document,window:{matchMedia:()=>({matches:false}),addEventListener(){}},Image:class{constructor(){this.complete=true;this.naturalWidth=96}},localStorage:{getItem:()=>null,setItem(){}},requestAnimationFrame:callback=>{nextFrame=callback},Math:math,PokeSim,PokeDraft,PokeMotion,PokeBattle,PokeStadium,PokeTeamName:require('../dist/team-name.js'),PokePvP:require('../dist/pvp-client.js'),PokeDances:require('../dist/dances.js'),PokeMusic:{ChipMusic,tracks:{route:{name:'Route'}}}};
  vm.createContext(sandbox);
  sandbox.window.PokeBattle=PokeBattle;sandbox.window.Image=sandbox.Image;sandbox.window.PokeMotion=PokeMotion;sandbox.window.PokeDances=sandbox.PokeDances;
  for(const file of ['romantium','sprite-data','sprites','sideline','stadium'])vm.runInContext(fs.readFileSync(require.resolve('../dist/'+file+'.js'),'utf8'),sandbox);
  sandbox.PokeStadium=sandbox.window.PokeStadium;
  vm.runInContext(fs.readFileSync(require.resolve('../dist/game.js'),'utf8'),sandbox);
  const draft=new PokeDraft.Draft();draft.autoFill(random);
  sandbox.window.startDraftedMatch(draft.roster(),draft.opponent(random),seed===1?'✨ <img src=x> & FC':'Thunder FC');
  assert.equal(element('homeTeamName').textContent,seed===1?'✨ <IMG SRC=X> & FC':'THUNDER FC');
  assert.ok(!element('matchupSummary').innerHTML.includes('<IMG'));
  assert.equal(vm.runInContext('match.names[0]',sandbox),seed===1?'✨ <img src=x> & FC':'Thunder FC');
  speedButtons[2].onclick();
  assert.equal(vm.runInContext('waiting',sandbox),true);
  assert.equal(vm.runInContext('match.plays',sandbox),0);
  for(let i=0;i<60;i++)nextFrame(i*60);
  assert.equal(vm.runInContext('match.plays',sandbox),0,'Waiting for a call must not consume a down');
  element('pause').onclick();element('callPlay').onclick();assert.equal(vm.runInContext('match.plays',sandbox),0,'Paused coach mode must not snap');element('pause').onclick();
  if(seed%2===0)element('autoMode').onclick();
  let battleFrames=0,battleCount=0,wasBattle=false,battleSnapshot=null;
  let frames=0,wasReplay=false,wasCelebrating=false,hold=0,wasCounter=false,counterFrames=0;
  while(vm.runInContext('running',sandbox)&&frames<12000){
    if(seed%2===1&&vm.runInContext('waiting&&!!footballMode&&match.actor()===0',sandbox)){vm.runInContext(`submitFootball(match.phase==='coinToss'?{type:'toss',choice:'heads'}:match.phase==='receive'?{type:'receive',choice:'receive'}:match.phase==='conversion'?{type:'conversion',choice:match.plays%2?'pat':'two'}:match.phase==='pat'?{type:'pat',accuracy:.5}:{type:'kickoff',power:.9})`,sandbox)}
    if(seed%2===1&&vm.runInContext('waiting&&!footballMode',sandbox)){sandbox.nextCall=Object.keys(PokeSim.calls)[frames%5];vm.runInContext('selectedPlay=nextCall;selectedDefense=Object.keys(PokeSim.defenseCalls)[match.plays%5]',sandbox);if(vm.runInContext('match.team===1',sandbox)){defenseWaits++;assert.match(element('playbookTitle').textContent,/DEFENSIVE/);const plays=vm.runInContext('match.plays',sandbox);vm.runInContext('update(.06)',sandbox);assert.equal(vm.runInContext('match.plays',sandbox),plays);if(!vm.runInContext('match.down===4&&match.ball<92',sandbox))assert.match(element('coachAdvice').textContent,/counters/)}
     let chosen=null;
     if(vm.runInContext("match.team===0&&PokeSim.calls[selectedPlay].kind==='pass'&&match.down!==4",sandbox)){
      assert.equal(vm.runInContext('selectedTarget',sandbox),null,'A fresh down restores the concept’s first read');
      vm.runInContext("selectedTarget=fieldTeam(0).filter(p=>p.pos==='WR')[1].id;formation();coachUI()",sandbox);
      chosen=vm.runInContext('selectedTarget',sandbox);assert.equal(vm.runInContext('previewEvent.target',sandbox),chosen);assert.equal(element('receiverPicker').hidden,false);assert.match(element('receiverChoices').innerHTML,new RegExp('data-target="'+chosen+'" aria-pressed="true"'));assert.equal(element('readName').textContent,vm.runInContext('teamRoster(0).find(p=>p.id===selectedTarget).name',sandbox));
     }
     element('callPlay').onclick();
     if(chosen!==null){assert.equal(vm.runInContext('rankedCalls.at(-1).target',sandbox),chosen);if(vm.runInContext("event.type==='pass'",sandbox))assert.equal(vm.runInContext('event.target',sandbox),chosen);assert.equal(element('receiverPicker').hidden,true,'Receiver changes close when the play starts')}
    }
    const beforePower=vm.runInContext('(motion.powerCues||[]).some(u=>phase>=u.at&&phase<u.end)&&!celebration&&!counterHold&&!waiting&&!paused',sandbox),beforePhase=vm.runInContext('phase',sandbox);
    const callback=nextFrame;nextFrame=null;
    callback(++frames*60);
    if(beforePower&&!vm.runInContext('replaying||waiting||!!celebration||counterHold>0',sandbox)){const delta=vm.runInContext('phase',sandbox)-beforePhase;if(delta>=0){assert.ok(delta<=.060001,'Ultimate action must remain readable at 4x');powerFrames++;}}
    const inBattle=vm.runInContext('!!battleMoment',sandbox);
    if(inBattle){
     if(!wasBattle){battleCount++;battleFrames=0;battleSnapshot=vm.runInContext('JSON.stringify([match.score,match.stats,match.plays,match.clock,rankedCalls])',sandbox);assert.equal(element('battleHud').hidden,false);
      vm.runInContext('togglePause();update(.5)',sandbox);assert.equal(vm.runInContext('battleMoment.elapsed',sandbox),0,'Pause must freeze the arena timeline');vm.runInContext('togglePause()',sandbox);
     }
     battleFrames++;assert.equal(vm.runInContext('JSON.stringify([match.score,match.stats,match.plays,match.clock,rankedCalls])',sandbox),battleSnapshot,'The arena cannot consume football plays, clock, RNG or match stats');
    }
    if(!inBattle&&wasBattle){assert.ok(battleFrames>=106,'A rumble lasts 6.4 real seconds at 4x');assert.equal(element('battleHud').hidden,true)}wasBattle=inBattle;
    const counter=vm.runInContext('counterHold>0',sandbox);
    if(counter){counterFrames++;if(!wasCounter)counterCount++;assert.match(element('actionCall').textContent,/COUNTER! −[5-9]|COUNTER! −10/);assert.equal(element('ultimateCall').hidden,false);}
    if(!counter&&wasCounter){assert.ok(counterFrames>=21,'Counter hit gets a real-time hold at 4×');counterFrames=0;}
    wasCounter=counter;
    const celebrating=vm.runInContext('!!celebration',sandbox);
    if(celebrating){assert.equal(element('scoreMoment').hidden,false);hold++;heldFrames++;if(!wasCelebrating)celebrationCount++;}
    if(!celebrating&&wasCelebrating){assert.ok(hold>=80,'The victory dance holds for 4.8 real seconds even at 4×');hold=0;assert.equal(element('scoreMoment').hidden,true)}
    wasCelebrating=celebrating;
    const replay=vm.runInContext('replaying',sandbox);
    if(replay&&!wasReplay)replayCount++;
    wasReplay=replay;
  }
  assert.ok(frames<12000,'The browser animation loop must finish the game');assert.equal(battleCount,4,'Exactly one random arena battle per quarter');
  assert.equal(vm.runInContext('match.over',sandbox),true);
  assert.match(element('banner').innerHTML,/FINAL WHISTLE/);
  assert.equal(typeof element('again').onclick,'function');
  if(seed===1){
   vm.runInContext(`clearMoment();resetQuarterBattles();match=new Match(()=>.5,{teams:squads,footballFlow:true,stadiumRules:true});match.phase='scrimmage';match.clock=60;running=true;coaching=true;paused=false;event=match.next('quick','deep');formation();pendingBattle=PokeBattle.create(event,match.teams);startQuarterBattle();`,sandbox);
   const beforeSkip=vm.runInContext('JSON.stringify([match.score,match.stats,match.plays,match.clock,rankedCalls])',sandbox);element('battleSkip').onclick();assert.equal(vm.runInContext('battleMoment',sandbox),null);assert.equal(element('battleHud').hidden,true);assert.equal(vm.runInContext('waiting',sandbox),true);assert.equal(vm.runInContext('JSON.stringify([match.score,match.stats,match.plays,match.clock,rankedCalls])',sandbox),beforeSkip);assert.equal(vm.runInContext('battleQuarters.has(1)',sandbox),true,'Skipping cannot reroll another rumble in the same quarter');
   vm.runInContext(`clearMoment();match=new Match(()=>.5,{teams:squads,footballFlow:true});match.phase='pat';match.score=[6,0];match.team=0;match.ball=85;running=true;coaching=true;paused=false;event=null;showFootballStep();speed=1;update(.2);`,sandbox);
   const meter1=element('meterNeedle').style.top;assert.notEqual(meter1,'0%');assert.equal(element('meterNeedle').style.left,'-10px','PAT arrow moves vertically');
   element('pause').onclick();const plays=vm.runInContext('match.plays',sandbox);vm.runInContext('update(.5)',sandbox);element('meterStop').onclick();assert.equal(vm.runInContext('match.plays',sandbox),plays);assert.equal(element('meterNeedle').style.top,meter1,'Pause freezes the meter and rejects kicks');
   element('pause').onclick();vm.runInContext('speed=4;update(.2)',sandbox);const at4=vm.runInContext('meterValue(meterTime)',sandbox);assert.ok(Math.abs(at4-.38)<.00001,'Meter speed stays real time at 4x');element('meterStop').onclick();assert.equal(vm.runInContext('event.accuracy',sandbox),at4,'Stopped arrow determines actual kick result');
  }
  if(seed===1)for(const outcome of ['touchdown','extraPoint','twoPoint','fieldGoal','miss','stopped']){
   sandbox.outcome=outcome;
   const countMusic=musicCalls.length,countVoice=voiceCalls.length;
   vm.runInContext(`clearMoment();match=new Match(()=>.5,{teams:squads});running=true;waiting=false;paused=false;replaying=false;speed=4;event={team:0,start:95,end:100,gain:5,first:100,down:1,quarter:4,clock:40,scoreBefore:[0,0],type:['extraPoint','fieldGoal','miss'].includes(outcome)?'kick':'run',playCall:'inside',qb:squads[0].find(p=>p.pos==='QB').id,target:squads[0].find(p=>p.pos==='HB').id,defender:squads[1].find(p=>p.pos==='ILB').id,score:outcome==='touchdown'?6:outcome==='extraPoint'?1:outcome==='twoPoint'?2:outcome==='fieldGoal'?3:0,touchdown:outcome==='touchdown',extraPoint:outcome==='extraPoint'||outcome==='miss',conversion:outcome==='twoPoint'||outcome==='stopped',text:'Official test'};formation();phase=motion.resolveAt-.01;update(.02);`,sandbox);
   assert.equal(element('refereeCall').hidden,false,'Every scoring or failed conversion result gets a signal');
   const failed=['miss','stopped'].includes(outcome);
   assert.match(element('refereeCall').innerHTML,new RegExp('referee-'+(failed?'miss':['touchdown','twoPoint'].includes(outcome)?'touchdown':'good')));
   assert.equal(voiceCalls.at(-1),failed?'noGood':outcome==='touchdown'?'touchdown':outcome==='twoPoint'?'twoPoint':'good');
   assert.equal(voiceCalls.length,countVoice+1);assert.equal(musicCalls.length,countMusic+(failed?0:1),'Misses must never play victory music');
   if(!failed)assert.equal(musicCalls.at(-1),outcome);
   const timer=vm.runInContext('refereeTime',sandbox);vm.runInContext('paused=true;update(1)',sandbox);assert.equal(vm.runInContext('refereeTime',sandbox),timer);
   if(failed){vm.runInContext('paused=false;update(.06)',sandbox);assert.ok(vm.runInContext('officialHold>2',sandbox),'A missed call holds at real-time speed even at 4x');}
   vm.runInContext('clearMoment();paused=false;replaying=true;phase=motion.resolveAt-.01;update(.02)',sandbox);
   assert.equal(voiceCalls.length,countVoice+1,'Highlight must not repeat the official voice');assert.equal(musicCalls.length,countMusic+(failed?0:1),'Highlight must not repeat the stinger');
  }
  if(seed===1)for(const scenario of ['td','fg','safety'])for(const reduced of [false,true]){
   // Exercise each scoring type on the final play, including reduced effects and pause.
   sandbox.scenario=scenario;sandbox.reduced=reduced;
   vm.runInContext(`clearMoment();running=true;paused=false;waiting=false;fullEffects=!reduced;replaying=false;replayed=false;speed=4;match.over=true;match.score=[scenario==='td'?7:scenario==='fg'?3:0,scenario==='safety'?2:0];
    event={team:0,start:scenario==='safety'?3:95,end:scenario==='safety'?0:100,gain:scenario==='safety'?-3:5,first:100,down:1,quarter:4,clock:4,scoreBefore:[0,0],type:scenario==='fg'?'kick':'run',playCall:'inside',qb:squads[0].find(p=>p.pos==='QB').id,target:squads[0].find(p=>p.pos==='HB').id,defender:squads[1].find(p=>p.pos==='ILB').id,score:scenario==='td'?7:scenario==='fg'?3:0,touchdown:scenario==='td',safety:scenario==='safety',text:'Test score'};
    motion=new PokeMotion.PlayMotion(event,[...squads[0].filter(p=>p.side==='offense'),...squads[1].filter(p=>p.side==='defense')]);phase=motion.resolveAt-.01;update(.02);`,sandbox);
   assert.equal(vm.runInContext('!!celebration',sandbox),true);assert.equal(element('scoreMoment').hidden,false);if(scenario==='td')assert.equal(vm.runInContext('camera',sandbox),98,'End-zone camera must reveal the scorer before the dance');
   assert.match(element('scoreMoment').innerHTML,scenario==='td'?/TOUCHDOWN/:scenario==='fg'?/IT’S GOOD/:/SAFETY/);
   const team=scenario==='safety'?1:0;assert.equal(vm.runInContext(`motion.frame(motion.resolveAt+.3).players.filter(p=>p.team===${team}&&p.pose==='celebrate').length`,sandbox),10);assert.equal(vm.runInContext(`motion.frame(motion.resolveAt+.3).players.filter(p=>p.team===${team}&&p.pose==='dance').length`,sandbox),1);assert.match(element('scoreMoment').innerHTML,/score-hero/);assert.equal(vm.runInContext('celebration.scorer===motion.frame(motion.resolveAt+.3).players.find(p=>p.pose===\'dance\').p.id',sandbox),true);
   vm.runInContext('paused=true;update(1);',sandbox);assert.equal(vm.runInContext('celebration.elapsed',sandbox),0);vm.runInContext('paused=false;',sandbox);
   for(let i=0;i<50;i++)vm.runInContext('update(.06)',sandbox);
   assert.equal(vm.runInContext('running&&!!celebration',sandbox),true,'Final whistle waits for celebration');
   for(let i=0;i<500&&vm.runInContext('running',sandbox);i++)vm.runInContext('update(.06)',sandbox);
   assert.equal(vm.runInContext('running',sandbox),false);assert.equal(element('scoreMoment').hidden,true);
  }
  if(seed===1)for(const auto of [false,true])for(const pause of [false,true])for(const final of [false,true]){
   sandbox.skipAuto=auto;sandbox.skipPause=pause;sandbox.skipFinal=final;
   vm.runInContext(`clearMoment();match=new Match(()=>.5,{teams:squads,names:teamNames});event=match.next('deep','gap');motion=new PokeMotion.PlayMotion(event,[...squads[0].filter(p=>p.side==='offense'),...squads[1].filter(p=>p.side==='defense')]);replaying=true;replayed=true;running=true;waiting=false;paused=skipPause;coaching=!skipAuto;phase=.5;match.over=skipFinal;`,sandbox);
   const plays=vm.runInContext('match.plays',sandbox),stats=vm.runInContext('JSON.stringify(match.stats)',sandbox),score=vm.runInContext('JSON.stringify(match.score)',sandbox);
   element('skipReplay').hidden=false;element('skipReplay').onclick();
   assert.equal(element('skipReplay').hidden,true);assert.equal(vm.runInContext('replaying',sandbox),false);assert.equal(vm.runInContext('paused',sandbox),pause);
   if(final||!auto){assert.equal(vm.runInContext('match.plays',sandbox),plays);assert.equal(vm.runInContext('JSON.stringify(match.stats)',sandbox),stats);assert.equal(vm.runInContext('JSON.stringify(match.score)',sandbox),score)}else assert.equal(vm.runInContext('match.plays',sandbox),plays+1);
   if(final)assert.equal(vm.runInContext('running',sandbox),false);else if(!auto)assert.equal(vm.runInContext('waiting',sandbox),true);
   const now=vm.runInContext('match.plays',sandbox);element('skipReplay').onclick();assert.equal(vm.runInContext('match.plays',sandbox),now,'Repeated skip must not consume another down');
  }

}
for(const kind of ['ready','set','hut','hike','snap','throw','catch','hit','kick','cheer','whistle','ultimate'])assert.ok(heard.has(kind),`Full games must trigger ${kind} effects`);
assert.ok(celebrationCount>0&&heldFrames>0);assert.ok(counterCount>0&&defenseWaits>0);
assert.ok(replayCount>0,'The renderer test must exercise highlight transitions');
assert.ok(powerFrames>100,'Full matches must exercise readable ultimate windows');
console.log(`PASS: 12 complete drafted games in Coach and Auto modes through the horizontal rendering loop, ${counterCount} ultimate counter holds and ${defenseWaits} defensive coaching calls, ${celebrationCount} real-time score celebrations, TD/FG/safety final-play and reduced-effects holds, ${replayCount} highlight replays and ${ellipseCount} finite, non-negative canvas ellipses.`);
