'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const PokeSim=require('../dist/sim.js');
const PokeDraft=require('../dist/draft.js');
const PokeMotion=require('../dist/motion.js');
const PokeStadium=require('../dist/stadium.js');
let replayCount=0,ellipseCount=0;
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
  const sandbox={document,window:{matchMedia:()=>({matches:false}),addEventListener(){}},Image:class{constructor(){this.complete=true;this.naturalWidth=96}},localStorage:{getItem:()=>null,setItem(){}},requestAnimationFrame:callback=>{nextFrame=callback},Math:math,PokeSim,PokeDraft,PokeMotion,PokeStadium,PokeMusic:{ChipMusic,tracks:{route:{name:'Route'}}}};
  vm.createContext(sandbox);
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
  let frames=0,wasReplay=false;
  while(vm.runInContext('running',sandbox)&&frames<12000){
    if(seed%2===1&&vm.runInContext('waiting',sandbox)){sandbox.nextCall=Object.keys(PokeSim.calls)[frames%5];vm.runInContext('selectedPlay=nextCall',sandbox);element('callPlay').onclick();}
    const callback=nextFrame;nextFrame=null;
    callback(++frames*60);
    const replay=vm.runInContext('replaying',sandbox);
    if(replay&&!wasReplay)replayCount++;
    wasReplay=replay;
  }
  assert.ok(frames<12000,'The browser animation loop must finish the game');
  assert.equal(vm.runInContext('match.over',sandbox),true);
  assert.match(element('banner').innerHTML,/FINAL WHISTLE/);
  assert.equal(typeof element('again').onclick,'function');
}
assert.ok(replayCount>0,'The renderer test must exercise highlight transitions');
console.log(`PASS: 12 complete drafted games in Coach and Auto modes through the horizontal rendering loop, ${replayCount} highlight replays and ${ellipseCount} finite, non-negative canvas ellipses.`);
