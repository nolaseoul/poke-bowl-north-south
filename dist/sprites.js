/* Eight true directional rows: S, SW, W, NW, N, NE, E, SE. */
(function(root){
'use strict';
const directions=['S','SW','W','NW','N','NE','E','SE'];
function direction(dx,dy,fallback=6){if(!Number.isFinite(dx)||!Number.isFinite(dy)||Math.hypot(dx,dy)<.035)return fallback;return[6,7,0,1,2,3,4,5][(Math.round(Math.atan2(dy,dx)/(Math.PI/4))+8)%8];}
function cell(meta,t,once=false){const ticks=meta.ticks,total=ticks.reduce((a,b)=>a+b,0);let phase=once?Math.max(0,Math.min(total-1,t*60)):((t*60)%total+total)%total;for(let i=0;i<ticks.length;i++){if(phase<ticks[i])return i;phase-=ticks[i]}return ticks.length-1;}
function pose(player){return['down','dive','miss'].includes(player.pose)?'hurt':['throw','kick','handoff','block','catch'].includes(player.pose)||player.jump>0?'action':player.move?'run':'idle';}
class SpriteBank{
 constructor(data=root.PokeSpriteData){this.data=data||{};this.images=new Map();this.preloaded=new Set();this.facing=new Map();this.motion=null;}
 preload(players){if(!root.Image)return;for(const p of players){if(this.preloaded.has(p.id))continue;const entry=this.data[p.id];if(!entry)continue;this.preloaded.add(p.id);for(const meta of Object.values(entry.states)){if(this.images.has(meta.src))continue;const image=new root.Image();image.src=meta.src;this.images.set(meta.src,image);}}}
 draw(ctx,player,size,time,motion,event,phase,fullEffects){
  const entry=this.data[player.p.id];if(!entry)return false;
  if(this.motion!==motion){this.motion=motion;this.facing.clear()}
  const key=player.team+':'+player.p.id,previous=this.facing.get(key),off=player.team===(event?.team??0),forward=((event?.team??0)===0?1:-1)*(off?1:-1),fallback=forward>0?6:2;
  let row=previous?.row??fallback;
  if(previous&&phase>=motion.snap&&['run','catch'].includes(player.pose)){const lane=player.tx-previous.x,yards=player.ty-previous.y;row=direction(((event?.team??0)===0?1:-1)*yards*16+lane*74/532,lane*310/532,row)}
  else if(phase<motion.snap||player.pose==='block'||player.pose==='throw'||player.pose==='kick')row=fallback;
  this.facing.set(key,{x:player.tx,y:player.ty,row});
  const state=fullEffects?pose(player):'idle',meta=entry.states[state]||entry.states.run,image=this.images.get(meta.src);if(!image?.complete||!image.naturalWidth)return false;
  const at=fullEffects?state==='run'?player.stride/(Math.PI*2)*meta.ticks.reduce((a,b)=>a+b,0)/60:state==='hurt'?Math.max(0,phase-motion.contact):state==='action'&&player.pose==='throw'?Math.max(0,phase-motion.release+.14):time+(player.p.id%7)*.08:0;
  const column=cell(meta,at,state==='hurt'||player.pose==='throw'),scale=entry.scale*size/48;
  ctx.imageSmoothingEnabled=false;ctx.drawImage(image,column*meta.w,row*meta.h,meta.w,meta.h,-meta.w*scale/2,-meta.baseline*scale+10,meta.w*scale,meta.h*scale);return true;
 }
}
root.PokeSprites={SpriteBank,direction,cell,pose,directions};if(typeof module!=='undefined')module.exports=root.PokeSprites;
})(typeof window!=='undefined'?window:globalThis);
