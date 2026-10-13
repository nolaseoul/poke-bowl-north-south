'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const Dances=require('../dist/dances.js'),Sim=require('../dist/sim.js'),Motion=require('../dist/motion.js'),Sprites=require('../dist/sprites.js'),SpriteData=require('../dist/sprite-data.js'),{Stadium}=require('../dist/stadium.js');
assert.equal(Dances.catalog.length,152);assert.equal(new Set(Dances.catalog.map(d=>d.name)).size,152);
const trajectories=new Set();
for(let id=1;id<=151;id++){
 const points=[];for(let t=0;t<=4.8;t+=.06){const p=Dances.sample(id,t);assert.ok(Object.values(p).filter(v=>typeof v==='number').every(Number.isFinite));assert.ok(p.sx>.7&&p.sy>.7);assert.ok(p.facing>=0&&p.facing<8);assert.ok(p.lift>=0&&p.lift<32);assert.ok(Math.abs(p.x)<45);points.push(p);}
 trajectories.add(JSON.stringify(points));assert.deepEqual(Dances.sample(id,1.5),Dances.sample(id,1.5));assert.deepEqual(Dances.sample(id,0,false),Dances.sample(id,4.8,false));
}
for(const style of Object.keys(Dances.programs)){assert.equal(Dances.programs[style].length,16);const id=Dances.catalog.find(d=>d.style===style).id;assert.equal(Dances.sample(id,.1).stage,'windup');assert.equal(Dances.sample(id,1).stage,'dance');assert.equal(Dances.sample(id,4.6).stage,'finish');assert.deepEqual({...Dances.sample(id,4.6),time:0,accent:0},{...Dances.sample(id,4.8),time:0,accent:0},'Finish holds a strong pose');assert.ok(new Set(Dances.programs[style].map(p=>p.frame)).size>3,'Native limb poses must change on accents')}
assert.equal(trajectories.size,151,'Every species must have distinct stable choreography');
assert.equal(Dances.signature(143).name,'Belly Bounce');assert.equal(Dances.signature(129).name,'Victory Flop');assert.throws(()=>Dances.signature(152));
// Capture the actual actor sent to SpriteBank: big screen and field must share the beat.
const actors=[],text=[];
const ctx=new Proxy({measureText:t=>({width:t.length*6})},{get:(o,k)=>k in o?o[k]:(...args)=>{for(const v of args)if(typeof v==='number')assert.ok(Number.isFinite(v),String(k));if(k==='fillText')text.push(args[0]);}});
const renderer=new Stadium({getContext:()=>ctx},{});renderer.sprites={preload(){},draw(c,p){if(p.danceFacing!=null)actors.push({...p});return true}};
for(const team of [0,1])for(const id of [9,25,129,143,150]){
 const hb=Sim.roster.find(p=>p.pos==='HB'),roster=Sim.roster.map(p=>p.id===hb.id?{...p,id,name:Sim.ultimates.signature(id).pokemon}:p.id===id?{...p,id:hb.id}:p);
 const e={team,type:'run',playCall:'inside',start:95,end:100,gain:5,first:100,target:id,qb:roster.find(p=>p.pos==='QB').id,defender:roster.find(p=>p.pos==='ILB').id,score:7,touchdown:true,scoreBefore:[0,0]};
 const m=new Motion.PlayMotion(e,roster);
 for(const reduced of [false,true])for(const elapsed of [.5,1.2,2.9,4.6]){
  actors.length=0;text.length=0;const phase=m.resolveAt+elapsed,frame=m.frame(phase),dancer=frame.players.find(p=>p.pose==='dance');
  assert.equal(dancer.p.id,id);assert.equal(dancer.team,team);assert.equal(dancer.ty,103,'Touchdown dancer must be inside the end zone');assert.equal(frame.players.filter(p=>p.pose==='dance').length,1);assert.equal(frame.ball.visible,false,'Put the football away during the dance');
  const s={frame,motion:m,event:e,phase,elapsed,ambientTime:99,camera:78,fullEffects:!reduced,shake:0,particles:[],replaying:false,paused:false,waiting:false,squads:[roster,roster],score:team===0?[7,0]:[0,7],celebration:{team,scorer:id,elapsed,dance:Dances.signature(id)}};
  renderer.draw(s);assert.equal(actors.length,2,'Render scorer on both stadium screen and field');assert.deepEqual(actors[0],actors[1],'Big screen must show the exact same facing, pose and dance clock');assert.ok(text.includes(Dances.signature(id).name.toUpperCase()));assert.ok(text.includes('TOUCHDOWN · DANCE CAM'));
  const frozen=JSON.stringify(actors);actors.length=0;renderer.draw({...s,ambientTime:500});assert.equal(JSON.stringify(actors),frozen,'Ambient time must not move a paused dance');
  actors.length=0;text.length=0;renderer.draw({...s,celebration:null});assert.ok(!text.includes('TOUCHDOWN · DANCE CAM'),'Screen returns to score after the celebration');
 }
}
// All eight directional rows and the dance-specific clock must reach the real atlas renderer.
const window={PokeSpriteData:SpriteData,Image:class{constructor(){this.complete=true;this.naturalWidth=512}}};vm.runInNewContext(fs.readFileSync('dist/sprites.js','utf8'),{window});const bank=new window.PokeSprites.SpriteBank();bank.preload([{id:25}]);const draws=[],drawCtx={drawImage(...args){draws.push(args)}};
const dancer={p:{id:25},team:0,tx:300,ty:103,pose:'celebrate',jump:0,move:0,stride:0,danceTime:.6};
for(let row=0;row<8;row++){bank.draw(drawCtx,{...dancer,danceFacing:row},80,90,{}, {team:0},5,true);assert.equal(bank.facing.get('0:25').row,row);}
const meta=SpriteData[25].states.action;assert.equal(draws.at(-1)[1],Sprites.cell(meta,.6)*meta.w,'Dance uses its own clock, not ambient crowd time');
console.log('PASS: all 151 unique species dances; finite choreography; both end zones; synchronized field/screen actors; frozen pause/reduced effects; clean screen teardown; real eight-direction dance frames.');
