'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const Sim=require('../dist/sim.js'),Motion=require('../dist/motion.js');
const commands=[];const context=new Proxy({measureText:t=>({width:t.length*6})},{get:(o,k)=>k in o?o[k]:(...args)=>{for(const v of args)if(typeof v==='number')assert.ok(Number.isFinite(v),`${String(k)} requires finite coordinates`);commands.push([k,...args.filter(v=>typeof v!=='object')]);}});
const window={devicePixelRatio:3,Image:class{constructor(){this.complete=true;this.naturalWidth=2172}},PokeMotion:Motion,PokeDances:require('../dist/dances.js')};
const sandbox={window};vm.createContext(sandbox);vm.runInContext(fs.readFileSync(require.resolve('../dist/sideline.js'),'utf8'),sandbox);vm.runInContext(fs.readFileSync(require.resolve('../dist/stadium.js'),'utf8'),sandbox);
const canvas={getContext:()=>context},renderer=new window.PokeStadium.Stadium(canvas,{});
assert.equal(canvas.width,2240);assert.equal(canvas.height,1280);assert.match(renderer.backdrop.src,/stadium-grandstand-v1.webp$/);assert.ok(fs.existsSync('dist/'+renderer.backdrop.src));
const match=new Sim.Match(()=>.5),event=match.next('quick'),motion=new Motion.PlayMotion(event,Sim.roster),state={frame:motion.frame(0),motion,event,phase:0,elapsed:0,ambientTime:1,camera:30,fullEffects:true,shake:0,particles:[],replaying:false,paused:false,waiting:true,selectedPlay:'quick',squads:[Sim.roster,Sim.roster],score:[0,0]};
renderer.draw(state);const first=JSON.stringify(commands);assert.ok(commands.some(c=>c[0]==='drawImage'),'Generated grandstand must be drawn');
commands.length=0;renderer.draw({...state,ambientTime:2});assert.notEqual(JSON.stringify(commands),first,'Fans and flags must animate while waiting for a call');
commands.length=0;renderer.draw({...state,fullEffects:false});const reduced=JSON.stringify(commands);commands.length=0;renderer.draw({...state,fullEffects:false,ambientTime:99});assert.equal(JSON.stringify(commands),reduced,'Reduced effects must keep the crowd still');
for(const outcome of [{touchdown:true},{score:1},{gain:25},{returnYards:35},{interception:true}]){
 commands.length=0;renderer.draw({...state,event:{...event,...outcome},phase:motion.contact-.1});assert.equal(commands.filter(c=>c[0]==='fillText'&&['GOOO!','ROAR!'].includes(c[1])).length,0,'Cheering begins at the big-play impact');
 commands.length=0;renderer.draw({...state,event:{...event,...outcome},phase:motion.contact+.5});assert.equal(commands.filter(c=>c[0]==='fillText'&&['GOOO!','ROAR!'].includes(c[1])).length,6,'Big plays trigger six crowd banners');
 const lively=commands.filter(c=>c[0]==='fillRect').length;commands.length=0;renderer.draw({...state,event:{...event,...outcome},phase:motion.contact+.5,fullEffects:false});assert.equal(lively-commands.filter(c=>c[0]==='fillRect').length,42,'Reduced effects omit all stand confetti particles');
}
console.log('PASS: generated stadium asset, bounded retina canvas, finite drawing coordinates, crowd animation while waiting and reduced-motion behavior.');
