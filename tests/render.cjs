'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const PokeSim=require('../dist/sim.js');
const PokeDraft=require('../dist/draft.js');
const PokeMotion=require('../dist/motion.js');
const PokeStadium=require('../dist/stadium.js');
const {cuesBetween}=require('../dist/fx.js');
const heard=new Set();
let replayCount=0,ellipseCount=0,celebrationCount=0,heldFrames=0,counterCount=0,defenseWaits=0;
function randomFor(seed){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}}
for(let seed=1;seed<=12;seed++){
  const random=randomFor(seed),elements=new Map();
  const context2d=new Proxy({
    measureText:text=>({width:text.length*6}),
    ellipse(x,y,rx,ry){assert.ok([x,y,rx,ry].every(Number.isFinite));assert.ok(rx>=0&&ry>=0,'Canvas ellipse radii must be non-negative');ellipseCount++}
  },{get:(target,key)=>key in target?target[key]:()=>{}});
  function element(id){if(!elements.has(id))elements.set(id,{id,value:'0',style:{},dataset:{},textContent:'',innerHTML:'',classList:{add(){},remove(){},toggle(){}},setAttribute(){},getContext:()=>context2d,querySelectorAll:()=>[],showModal(){},close(){}});return elements.get(id)}
  const speedButtons=[1,2,4].map(n=>({...element('speed'+n),dataset:{speed:String(n)}}));
  const document={hidden:false,getElementById:element,querySelector:()=>element('featured'),querySelectorAll:selector=>selector==='[data-speed]'?speedButtons:[],addEventListener(){}};
  let nextFrame;
  const math=Object.create(Math);math.random=random;
  class ChipMusic{constructor(){this.volume=.35;this.track='route';this.enabled=false}setVolume(v){this.volume=v}setTrack(v){this.track=v}play(){this.enabled=true;return Promise.resolve()}stop(){this.enabled=false}celebrate(){}}
  class FieldFX{preload(){}setEnabled(v){this.enabled=v}prepare(){return Promise.resolve()}stop(){}play(kind){if(this.enabled)heard.add(kind)}}
  const sandbox={PokeFX:{FieldFX,cuesBetween},document,window:{matchMedia:()=>({matches:false}),addEventListener(){}},Image:class{constructor(){this.complete=true;this.naturalWidth=96}},localStorage:{getItem:()=>null,setItem(){}},requestAnimationFrame:callback=>{nextFrame=callback},Math:math,PokeSim,PokeDraft,PokeMotion,PokeStadium,PokeMusic:{ChipMusic,tracks:{route:{name:'Route'}}}};
  vm.createContext(sandbox);
  sandbox.window.Image=sandbox.Image;sandbox.window.PokeMotion=PokeMotion;
  for(const file of ['sprite-data','sprites','stadium'])vm.runInContext(fs.readFileSync(require.resolve('../dist/'+file+'.js'),'utf8'),sandbox);
  sandbox.PokeStadium=sandbox.window.PokeStadium;
  vm.runInContext(fs.readFileSync(require.resolve('../dist/game.js'),'utf8'),sandbox);
  const draft=new PokeDraft.Draft();draft.autoFill(random);
  sandbox.window.startDraftedMatch(draft.roster(),draft.opponent(random));
  speedButtons[2].onclick();
  assert.equal(vm.runInContext('waiting',sandbox),true);
  assert.equal(vm.runInContext('match.plays',sandbox),0);
  for(let i=0;i<60;i++)nextFrame(i*60);
  assert.equal(vm.runInContext('match.plays',sandbox),0,'Waiting for a call must not consume a down');
  element('pause').onclick();element('callPlay').onclick();assert.equal(vm.runInContext('match.plays',sandbox),0,'Paused coach mode must not snap');element('pause').onclick();
  if(seed%2===0)element('autoMode').onclick();
  let frames=0,wasReplay=false,wasCelebrating=false,hold=0,wasCounter=false,counterFrames=0;
  while(vm.runInContext('running',sandbox)&&frames<12000){
    if(seed%2===1&&vm.runInContext('waiting',sandbox)){sandbox.nextCall=Object.keys(PokeSim.calls)[frames%5];vm.runInContext('selectedPlay=nextCall;selectedDefense=Object.keys(PokeSim.defenseCalls)[match.plays%5]',sandbox);if(vm.runInContext('match.team===1',sandbox)){defenseWaits++;assert.match(element('playbookTitle').textContent,/DEFENSIVE/);const plays=vm.runInContext('match.plays',sandbox);vm.runInContext('update(.06)',sandbox);assert.equal(vm.runInContext('match.plays',sandbox),plays);if(!vm.runInContext('match.down===4&&match.ball<92',sandbox))assert.match(element('coachAdvice').textContent,/counters/)}element('callPlay').onclick();}
    const callback=nextFrame;nextFrame=null;
    callback(++frames*60);
    const counter=vm.runInContext('counterHold>0',sandbox);
    if(counter){counterFrames++;if(!wasCounter)counterCount++;assert.match(element('actionCall').textContent,/COUNTER! −[5-9]|COUNTER! −10/);assert.equal(element('ultimateCall').hidden,false);}
    if(!counter&&wasCounter){assert.ok(counterFrames>=21,'Counter hit gets a real-time hold at 4×');counterFrames=0;}
    wasCounter=counter;
    const celebrating=vm.runInContext('!!celebration',sandbox);
    if(celebrating){assert.equal(element('scoreMoment').hidden,false);hold++;heldFrames++;if(!wasCelebrating)celebrationCount++;}
    if(!celebrating&&wasCelebrating){assert.ok(hold>=53,'Scoring holds for 3.2 real seconds even at 4×');hold=0;assert.equal(element('scoreMoment').hidden,true)}
    wasCelebrating=celebrating;
    const replay=vm.runInContext('replaying',sandbox);
    if(replay&&!wasReplay)replayCount++;
    wasReplay=replay;
  }
  assert.ok(frames<12000,'The browser animation loop must finish the game');
  assert.equal(vm.runInContext('match.over',sandbox),true);
  assert.match(element('banner').innerHTML,/FINAL WHISTLE/);
  assert.equal(typeof element('again').onclick,'function');
  if(seed===1)for(const scenario of ['td','fg','safety'])for(const reduced of [false,true]){
   // Exercise each scoring type on the final play, including reduced effects and pause.
   sandbox.scenario=scenario;sandbox.reduced=reduced;
   vm.runInContext(`clearMoment();running=true;paused=false;waiting=false;fullEffects=!reduced;replaying=false;replayed=false;speed=4;match.over=true;match.score=[scenario==='td'?7:scenario==='fg'?3:0,scenario==='safety'?2:0];
    event={team:0,start:scenario==='safety'?3:95,end:scenario==='safety'?0:100,gain:scenario==='safety'?-3:5,first:100,down:1,quarter:4,clock:4,scoreBefore:[0,0],type:scenario==='fg'?'kick':'run',playCall:'inside',qb:squads[0].find(p=>p.pos==='QB').id,target:squads[0].find(p=>p.pos==='HB').id,defender:squads[1].find(p=>p.pos==='ILB').id,score:scenario==='td'?7:scenario==='fg'?3:0,touchdown:scenario==='td',safety:scenario==='safety',text:'Test score'};
    motion=new PokeMotion.PlayMotion(event,[...squads[0].filter(p=>p.side==='offense'),...squads[1].filter(p=>p.side==='defense')]);phase=motion.resolveAt-.01;update(.02);`,sandbox);
   assert.equal(vm.runInContext('!!celebration',sandbox),true);assert.equal(element('scoreMoment').hidden,false);
   assert.match(element('scoreMoment').innerHTML,scenario==='td'?/TOUCHDOWN/:scenario==='fg'?/IT’S GOOD/:/SAFETY/);
   const team=scenario==='safety'?1:0;assert.equal(vm.runInContext(`motion.frame(motion.resolveAt+.3).players.filter(p=>p.team===${team}&&p.pose==='celebrate').length`,sandbox),11);
   vm.runInContext('paused=true;update(1);',sandbox);assert.equal(vm.runInContext('celebration.elapsed',sandbox),0);vm.runInContext('paused=false;',sandbox);
   for(let i=0;i<50;i++)vm.runInContext('update(.06)',sandbox);
   assert.equal(vm.runInContext('running&&!!celebration',sandbox),true,'Final whistle waits for celebration');
   for(let i=0;i<500&&vm.runInContext('running',sandbox);i++)vm.runInContext('update(.06)',sandbox);
   assert.equal(vm.runInContext('running',sandbox),false);assert.equal(element('scoreMoment').hidden,true);
  }
}
for(const kind of ['ready','set','hike','snap','throw','catch','hit','kick','cheer','whistle','ultimate'])assert.ok(heard.has(kind),`Full games must trigger ${kind} effects`);
assert.ok(celebrationCount>0&&heldFrames>0);assert.ok(counterCount>0&&defenseWaits>0);
assert.ok(replayCount>0,'The renderer test must exercise highlight transitions');
console.log(`PASS: 12 complete drafted games in Coach and Auto modes through the horizontal rendering loop, ${counterCount} ultimate counter holds and ${defenseWaits} defensive coaching calls, ${celebrationCount} real-time score celebrations, TD/FG/safety final-play and reduced-effects holds, ${replayCount} highlight replays and ${ellipseCount} finite, non-negative canvas ellipses.`);
