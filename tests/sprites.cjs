'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const data=require('../dist/sprite-data.js'),{direction,cell,pose}=require('../dist/sprites.js');
assert.equal(Object.keys(data).length,151);let atlases=new Set(),frames=0;
for(let id=1;id<=151;id++){
 const entry=data[id];assert.ok(entry.scale>0&&entry.scale<=2);
 for(const state of ['idle','run','action','hurt']){
  const m=entry.states[state],bytes=fs.readFileSync('dist/'+m.src);assert.equal(bytes.toString('hex',0,8),'89504e470d0a1a0a');assert.equal(bytes.readUInt32BE(16),m.w*m.ticks.length);assert.equal(bytes.readUInt32BE(20),m.h*8,'Every atlas must have all eight directional rows');assert.ok(m.ticks.every(n=>n>0));assert.equal(m.anchors.length,8);for(const row of m.anchors){assert.equal(row.length,m.ticks.length);for(const [x,y] of row)assert.ok(x>=0&&x<=m.w&&y>0&&y<=m.h)}
  const total=m.ticks.reduce((a,b)=>a+b,0),seen=new Set();for(let t=0;t<total;t++)seen.add(cell(m,(t+.1)/60));assert.equal(seen.size,m.ticks.length,'Every animation frame must be reachable');assert.equal(cell(m,99,true),m.ticks.length-1);atlases.add(m.src);frames+=m.ticks.length*8;
 }
 assert.ok(data[id].states.run.ticks.length>=2,'Every species needs a movement cycle');assert.ok(fs.existsSync(`dist/assets/directional/${id}-credits.txt`));
}
for(const [dx,dy,row] of [[0,1,0],[-1,1,1],[-1,0,2],[-1,-1,3],[0,-1,4],[1,-1,5],[1,0,6],[1,1,7]])assert.equal(direction(dx,dy),row);
assert.equal(direction(0,0,4),4);assert.equal(direction(NaN,0,2),2);assert.equal(pose({pose:'down'}),'hurt');assert.equal(pose({pose:'throw'}),'action');assert.equal(pose({pose:'run',move:1}),'run');
const window={PokeSpriteData:data,Image:class{constructor(){this.complete=true;this.naturalWidth=512}}};vm.runInNewContext(fs.readFileSync('dist/sprites.js','utf8'),{window});const bank=new window.PokeSprites.SpriteBank();bank.preload([{id:25}]);const draws=[];const ctx={drawImage(...args){args.slice(1).forEach(v=>assert.ok(Number.isFinite(v)));draws.push(args)}};
const player={p:{id:25},team:0,tx:320,ty:20,pose:'run',move:1,stride:0,jump:0},motion={snap:.55,contact:3,release:1},event={team:0};
bank.draw(ctx,player,48,0,motion,event,1,true);bank.draw(ctx,{...player,ty:21,stride:2},48,.1,motion,event,1.1,true);assert.equal(bank.facing.get('0:25').row,6);bank.draw(ctx,{...player,ty:20,stride:3},48,.2,motion,event,1.2,true);assert.equal(bank.facing.get('0:25').row,2,'Players must turn on a change of travel direction');
const before=bank.facing.get('0:25').row;bank.draw(ctx,{...player,ty:20},48,.3,motion,event,1.3,true);assert.equal(bank.facing.get('0:25').row,before,'Stationary player must retain facing');
bank.draw(ctx,{...player,pose:'idle',move:0},48,.4,{},event,0,true);assert.equal(bank.facing.get('0:25').row,6,'New play resets facing to formation');assert.ok(draws.length===5);assert.match(fs.readFileSync('dist/sprite-credits.html','utf8'),/CC BY-NC 4.0/);
bank.draw(ctx,{...player,pose:'block',move:0,engageFacing:2,actionFrame:.8},48,99,motion,event,1.2,true);assert.equal(bank.facing.get('0:25').row,2);assert.equal(draws.at(-1)[1],Math.round(.8*(data[25].states.action.ticks.length-1))*data[25].states.action.w,'Engagement uses an explicit native action frame');const anchor=data[25].states.action.anchors[6][Math.round(.8*(data[25].states.action.ticks.length-1))];assert.equal(draws.at(-1)[6],-anchor[1]*data[25].scale+10,'Controlled poses must keep their feet planted');
// Verify the source atlas rows, not only the logical direction cache.
for(const attackTeam of [0,1])for(const actorTeam of [0,1])for(const phase of [0,.55]){
 const expected=(attackTeam===0)===(actorTeam===attackTeam)?6:2;
 const actor={...player,team:actorTeam,pose:'idle',move:0,formationFacing:expected,engageFacing:4,danceFacing:0};
 bank.draw(ctx,actor,48,0,motion,{team:attackTeam},phase,true);
 assert.equal(bank.facing.get(actorTeam+':25').row,expected,'Pre-snap overrides stale directional poses');
 assert.equal(draws.at(-1)[2],((8-expected)%8)*data[25].states.idle.h,'Source sheet east/west rows must be mirrored into logical directions');
}
console.log(`PASS: all 151 species, ${atlases.size} genuine eight-direction atlases, ${frames} directional frames, complete playback cycles, facing changes, stationary facing and pose selection.`);
