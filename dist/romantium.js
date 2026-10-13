/* Original special creature. The native 3D pixel rig supplies real eight-way poses. */
(function(root){
'use strict';
const ID=1001,row=Object.freeze([ID,'Romantium',['steel','electric'],85,180,200,200,180,180,200]);
const signature=Object.freeze({id:ID,pokemon:'Romantium',name:'Quantum Overdrive',element:'electric',color:'#75ecff'});
const palette={white:'#edf7ff',shade:'#a0bfd9',blue:'#2868cc',dark:'#14233f',cyan:'#75ecff',gold:'#ffd35d',amber:'#ff9d42'};
function draw(ctx,player,size,time,facing=0,animated=true){
 const t=animated?time:0,angle=-facing*Math.PI/4,c=Math.cos(angle),s=Math.sin(angle),stride=animated&&player.move?player.stride||t*12:0,pose=player.pose;
 const action=['throw','kick','handoff','catch','block','ultimate'].includes(pose),celebrate=['celebrate','dance'].includes(pose),powered=Boolean(player.power)||pose==='ultimate';
 const P=(x,z,y)=>({x:Math.round(x*c+z*s),y:Math.round(-y+(z*c-x*s)*.34)});
 const polygon=(points,color)=>{ctx.fillStyle=color;ctx.strokeStyle=palette.dark;ctx.lineWidth=1;ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fill();ctx.stroke()};
 const panel=(points,color)=>polygon(points.map(p=>P(...p)),color);
 function box(x,z,y,w,d,h,front=palette.white,side=palette.shade,top=palette.white){
  const a=[x-w,z-d,y-h/2],b=[x+w,z-d,y-h/2],v=[x+w,z+d,y-h/2],q=[x-w,z+d,y-h/2],A=[x-w,z-d,y+h/2],B=[x+w,z-d,y+h/2],V=[x+w,z+d,y+h/2],Q=[x-w,z+d,y+h/2];
  if(c>=0)panel([q,v,V,Q],front);else panel([b,a,A,B],side);
  if(s>=0)panel([a,q,Q,A],side);else panel([v,b,B,V],side);
  panel([A,Q,V,B],top);
 }
 const legs=[-1,1].map(sign=>({sign,x:sign*6,z:Math.sin(stride+(sign<0?Math.PI:0))*5,lift:animated&&player.move?Math.max(0,Math.cos(stride+(sign<0?Math.PI:0)))*2:0}));
 const arms=[-1,1].map(sign=>({sign,x:sign*16,z:action?9:Math.sin(stride+(sign<0?0:Math.PI))*5,y:celebrate?44+(animated?Math.sin(t*7+sign)*3:0):action?34:24}));
 ctx.save();ctx.imageSmoothingEnabled=false;const scale=size/69;ctx.scale(scale,scale);ctx.translate(0,5);
 // Far limbs go behind the armor; near limbs finish in front of the body.
 const depth=a=>a.z*c-a.x*s;
 const leg=l=>{box(l.x,l.z*.3,18,3.5,3.5,10);box(l.x,l.z*.6,11+l.lift,4,4,12,palette.blue,palette.dark,palette.shade);box(l.x,l.z+2,3+l.lift,5,7,6,palette.white,palette.blue,palette.blue);const foot=P(l.x,l.z+8,2+l.lift);ctx.fillStyle=palette.cyan;ctx.fillRect(foot.x-3,foot.y-1,6,2);if(animated&&(player.move||powered)){panel([[l.x-3,l.z-4,2],[l.x+3,l.z-4,2],[l.x,l.z-8,-4-Math.abs(Math.sin(t*18+l.sign))*4]],palette.cyan)}};
 const arm=a=>{box(a.x,0,34,5,5,10,palette.blue,palette.dark,palette.shade);box(a.x,0,38,5.5,5.5,2,palette.gold,palette.amber,palette.white);box(a.x,a.z*.6,(a.y+34)/2,3.5,3.5,Math.abs(a.y-34)+6);box(a.x,a.z,a.y,5,5,9,palette.white,palette.blue,palette.white);if(powered&&a.sign===1){box(a.x,a.z+6,a.y,4,5,6,palette.blue,palette.dark,palette.shade);const muzzle=P(a.x,a.z+12,a.y);ctx.fillStyle=palette.cyan;ctx.fillRect(muzzle.x-4,muzzle.y-3,8,6);ctx.fillStyle='#f6ffff';ctx.fillRect(muzzle.x-2,muzzle.y-1,4,2)}};
 legs.slice().sort((a,b)=>depth(a)-depth(b)).forEach(leg);arms.filter(a=>depth(a)<=0).forEach(arm);
 box(0,0,21,8,4,6,palette.dark,palette.blue,palette.shade);box(0,0,31,10,6,16,palette.white,palette.blue,palette.white);
 if(c>-.15){panel([[-5,6.5,35],[5,6.5,35],[5,6.5,27],[-5,6.5,27]],palette.dark);panel([[0,7,36],[4,7,31],[0,7,26],[-4,7,31]],powered?'#f7ffff':palette.amber);const circuit=P(0,7,23);ctx.fillStyle=palette.cyan;ctx.fillRect(circuit.x-3,circuit.y,6,2)}
 else{for(const x of [-4,4])box(x,-6.5,31,2,1,7,palette.dark,palette.dark,palette.blue)}
 box(0,0,40,4,3,4,palette.dark,palette.dark,palette.shade);box(0,0,48,10,7,15,palette.white,palette.blue,palette.white);
 if(c>0){panel([[-8,7.5,51],[8,7.5,51],[8,7.5,44],[-8,7.5,44]],palette.dark);const hurt=['down','dive','miss'].includes(pose),eyeY=hurt?46:48;
  for(const x of [-4,4])panel([[x-2,8,eyeY+1],[x+2,8,eyeY+1],[x+2,8,eyeY-1],[x-2,8,eyeY-1]],palette.cyan);
 }else{box(0,-7,48,5,1,6,palette.blue,palette.dark,palette.shade);const vent=P(0,-8,49);ctx.fillStyle=palette.cyan;ctx.fillRect(vent.x-2,vent.y,4,2)}
 // Helmet side ports and a wraparound visor keep the side silhouette readable.
 const sideX=s>=0?-10.5:10.5;
 panel([[sideX,-4,51],[sideX,5,51],[sideX,5,46],[sideX,-4,46]],palette.dark);
 panel([[sideX,1,49],[sideX,6,49],[sideX,6,47],[sideX,1,47]],palette.cyan);
 box(sideX,0,43,1.5,3,3,palette.white,palette.shade,palette.white);
 for(const x of [-6,0,6]){panel([[x-2,0,55],[x+2,0,55],[x+1,-7,65],[x-1,-9,64]],palette.gold);panel([[x+2,0,55],[x+3,-4,59],[x+1,-7,65]],palette.amber)}
 arms.filter(a=>depth(a)>0).forEach(arm);
 if(powered&&animated){const core=P(0,8,31);ctx.strokeStyle=palette.cyan;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(core.x,core.y,7+Math.sin(t*15)**2*5,0,Math.PI*2);ctx.stroke();for(let i=0;i<5;i++){ctx.fillStyle=i%2?palette.cyan:palette.gold;ctx.fillRect(-20+(i*13)%39,-23-(i*9)%35-Math.sin(t*12+i)*3,2,2)}}
 ctx.restore();return true;
}
root.PokeRomantium={ID,row,signature,palette,draw};if(typeof module!=='undefined')module.exports=root.PokeRomantium;
})(typeof window!=='undefined'?window:globalThis);
