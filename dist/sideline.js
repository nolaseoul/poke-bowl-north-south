/* Screen-space sideline comedy, independent of the football clock, camera and RNG. */
(function(root){
'use strict';
const PERIOD=24,RUN_TIME=19;
function chase(time=0,animated=true){
 const t=animated?Math.max(0,Number.isFinite(time)?time:0)+4:4,pass=Math.floor(t/PERIOD),local=t%PERIOD,right=pass%2===0,dir=right?1:-1;
 if(animated&&local>=RUN_TIME)return{visible:false,actors:[],speech:false};
 const lead=animated?-100+local/RUN_TIME*1480:335,phase=animated?Math.floor(t*8)%4:0;
 const actors=[{name:'Jessie',row:0,gap:154,height:72},{name:'James',row:1,gap:78,height:70},{name:'Meowth',id:52,gap:0,height:47}].map((p,i)=>({...p,x:right?lead-p.gap:1120-lead+p.gap,y:267-(animated?Math.abs(Math.sin(t*11+i))*1.8:0),dir,frame:(phase+(i===1?2:0))%4,stride:animated?t*12:0}));
 return{visible:true,actors,local,time:t,speech:local>3&&local<6||local>11&&local<13};
}
function polygon(ctx,points,color){ctx.fillStyle=color;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill()}
function pixelLine(ctx,x,y,toX,toY,color,width){
 const dx=Math.abs(toX-x),dy=Math.abs(toY-y),sx=x<toX?1:-1,sy=y<toY?1:-1;let error=dx-dy;ctx.fillStyle=color;
 for(let n=0;n<80;n++){ctx.fillRect(x-width/2,y-width/2,width,width);if(x===toX&&y===toY)break;const e=2*error;if(e>-dy){error-=dy;x+=sx}if(e<dx){error+=dx;y+=sy}}
}
function trainer(ctx,actor){
 const jessie=actor.row===0,outline='#192136',skin='#f4c6a6',shade='#c88e8c',white='#f5f5e8',gray='#a8b7c9',boot='#273047',f=actor.frame;
 ctx.save();const scale=actor.height/48;ctx.scale(actor.dir*scale,scale);
 const steps=[[10,16,-8,-12],[4,7,-3,-5],[-8,-12,10,16],[-3,-5,4,7]][f];
 // Alternating bent knees and planted boots, drawn one pixel at a time.
 for(const i of [1,0]){const knee=steps[i*2],foot=steps[i*2+1],hip=i?1:5;
  pixelLine(ctx,hip,-14,knee,-7,outline,6);pixelLine(ctx,knee,-7,foot,-1,outline,6);
  pixelLine(ctx,hip,-14,knee,-7,jessie?(i?shade:skin):(i?gray:white),4);pixelLine(ctx,knee,-7,foot,-1,jessie?boot:i?gray:white,4);
  ctx.fillStyle=outline;ctx.fillRect(foot-2,-3,7,4);ctx.fillStyle=boot;ctx.fillRect(foot-1,-2,6,2);ctx.fillStyle='#626d80';ctx.fillRect(foot,-2,3,1);
 }
 const elbow=[[-10,-19],[-12,-24],[-6,-28],[-8,-22]][f];pixelLine(ctx,-3,-26,elbow[0],elbow[1],outline,6);pixelLine(ctx,-3,-26,elbow[0],elbow[1],gray,4);ctx.fillStyle=boot;ctx.fillRect(elbow[0]-3,elbow[1]-2,5,5);
 if(jessie){
  const sway=[0,1,0,-1][f];polygon(ctx,[[-5,-34],[-13,-31+sway],[-23,-34+sway],[-30,-38+sway],[-35,-36+sway],[-32,-42+sway],[-21,-43],[-11,-46],[0,-45],[7,-40],[5,-34]],outline);
  polygon(ctx,[[-5,-35],[-13,-33+sway],[-23,-36+sway],[-30,-40+sway],[-31,-41+sway],[-21,-41],[-10,-44],[0,-43],[5,-40],[3,-34]],'#c72c78');polygon(ctx,[[-27,-40],[-17,-40],[-8,-43],[1,-42],[-2,-40],[-13,-38],[-21,-38]],'#ef5797');
 }else{
  polygon(ctx,[[-9,-37],[-5,-43],[5,-44],[11,-40],[12,-34],[7,-29],[1,-28],[-6,-31]],outline);polygon(ctx,[[-7,-37],[-3,-41],[5,-42],[9,-39],[10,-34],[6,-30],[0,-30],[-5,-33]],'#7972bb');ctx.fillStyle='#aaa1e6';ctx.fillRect(-4,-40,8,2);ctx.fillRect(-6,-38,3,4);
 }
 // A three-quarter face, white uniform, black collar and tiny red Rocket R.
 polygon(ctx,[[1,-39],[7,-39],[9,-36],[11,-34],[8,-33],[7,-29],[2,-29],[-1,-33]],skin);ctx.fillStyle=shade;ctx.fillRect(0,-33,2,3);ctx.fillStyle=outline;ctx.fillRect(7,-36,2,1);ctx.fillRect(8,-35,1,2);ctx.fillStyle='#b8566c';ctx.fillRect(7,-31,2,1);
 if(jessie){polygon(ctx,[[-2,-42],[5,-42],[8,-39],[5,-37],[2,-39],[-1,-35],[-4,-35]],'#c72c78');ctx.fillStyle='#ef5797';ctx.fillRect(-1,-41,5,1);ctx.fillStyle='#75cfab';ctx.fillRect(0,-32,1,2)}else{ctx.fillStyle='#7972bb';ctx.fillRect(0,-40,4,3);ctx.fillRect(-2,-38,3,6);ctx.fillStyle='#aaa1e6';ctx.fillRect(0,-39,2,1)}
 ctx.fillStyle=outline;ctx.fillRect(-6,-28,15,15);ctx.fillStyle=white;ctx.fillRect(-4,-27,12,12);ctx.fillStyle=gray;ctx.fillRect(-4,-26,2,11);ctx.fillRect(-3,-16,10,2);ctx.fillStyle=boot;ctx.fillRect(2,-27,4,2);ctx.fillRect(-4,-15,12,3);
 if(jessie){polygon(ctx,[[-3,-13],[7,-13],[10,-9],[-6,-9]],outline);polygon(ctx,[[-2,-12],[6,-12],[8,-10],[-4,-10]],white)}
 const reach=[[15,-26,21,-23],[14,-22,19,-17],[13,-19,17,-15],[15,-23,21,-22]][f];pixelLine(ctx,7,-25,reach[0],reach[1],outline,6);pixelLine(ctx,reach[0],reach[1],reach[2],reach[3],outline,6);pixelLine(ctx,7,-25,reach[0],reach[1],white,4);pixelLine(ctx,reach[0],reach[1],reach[2],reach[3],white,4);ctx.fillStyle=boot;ctx.fillRect(reach[2]-1,reach[3]-2,5,5);
 ctx.fillStyle='#dc3658';['111','101','111','110','101'].forEach((row,y)=>[...row].forEach((v,x)=>{if(v==='1')ctx.fillRect(3+x,-23+y,1,1)}));ctx.restore();
}
class SidelineChase{
 constructor(){
  this.cat=null;this.sprites=root.PokeSprites?new root.PokeSprites.SpriteBank():null;this.motion={snap:0,contact:0,release:0};
  this.trainerAtlas=null;
  // Rasterize the native pixel poses once, keeping mobile playback to two blits.
  if(root.document?.createElement){const atlas=root.document.createElement('canvas');atlas.width=320;atlas.height=128;const ctx=atlas.getContext('2d');if(ctx){for(let row=0;row<2;row++)for(let frame=0;frame<4;frame++){ctx.save();ctx.translate(frame*80+40,row*64+56);trainer(ctx,{row,frame,dir:1,height:48});ctx.restore()}this.trainerAtlas=atlas}}
  if(root.Image){this.cat=new root.Image();this.cat.src='assets/52.png'}
  this.sprites?.preload([{id:52}]);
 }
 draw(ctx,time,animated=true){
  const scene=chase(time,animated);if(!scene.visible)return scene;
  ctx.save();ctx.imageSmoothingEnabled=false;
  for(const actor of scene.actors){if(actor.x<-90||actor.x>1210)continue;
   ctx.fillStyle='#07152566';ctx.beginPath();ctx.ellipse(actor.x,269,actor.id?10:13,2.5,0,0,Math.PI*2);ctx.fill();
   if(animated){ctx.fillStyle='#e6d7ae70';for(let i=0;i<3;i++){const age=(scene.time*3+i/3)%1;ctx.beginPath();ctx.ellipse(actor.x-actor.dir*(8+age*20),268-age*4,1+age*2,1+age,0,0,Math.PI*2);ctx.fill()}}
   ctx.save();ctx.translate(actor.x,actor.y);
   if(actor.id){
    const player={p:{id:52},team:0,pose:'run',move:animated?1:0,stride:actor.stride,jump:0,tx:actor.x,ty:actor.y,powerFacing:actor.dir>0?6:2,formationFacing:actor.dir>0?6:2};
    ctx.save();ctx.translate(0,-10);const drawn=this.sprites?.draw(ctx,player,actor.height,scene.time,this.motion,{team:0},1,animated);ctx.restore();
    if(!drawn&&this.cat?.complete&&this.cat.naturalWidth){if(actor.dir<0)ctx.scale(-1,1);ctx.drawImage(this.cat,-actor.height/2,-actor.height,actor.height,actor.height)}
   }else if(this.trainerAtlas){const scale=actor.height/48;ctx.scale(actor.dir*scale,scale);ctx.drawImage(this.trainerAtlas,actor.frame*80,actor.row*64,80,64,-40,-56,80,64)}else trainer(ctx,actor);
   ctx.restore();
  }
  const james=scene.actors[1];if(scene.speech&&james.x>65&&james.x<1050){
   const x=james.x-46,y=183;ctx.fillStyle='#f8f0d9';ctx.strokeStyle='#273143';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+94,y);ctx.lineTo(x+94,y+20);ctx.lineTo(x+57,y+20);ctx.lineTo(x+50,y+27);ctx.lineTo(x+47,y+20);ctx.lineTo(x,y+20);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#9e335b';ctx.textAlign='center';ctx.font='bold 10px monospace';ctx.fillText('MEOWTH!!',x+47,y+14);
  }
  ctx.restore();return scene;
 }
}
root.PokeSideline={SidelineChase,chase,trainer,PERIOD,RUN_TIME};if(typeof module!=='undefined')module.exports=root.PokeSideline;
})(typeof window!=='undefined'?window:globalThis);
