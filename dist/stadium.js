/* Side-on stadium projection. Yardage is horizontal; sprites stay upright. */
(function(root){
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function project(lane,yard,camera=30,team=0){const v=(lane-54)/532;return{x:560+(team===0?1:-1)*(yard-camera)*16+(v-.5)*74,y:123+v*310};}
class Stadium{
 constructor(canvas,images){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.images=images;}
 draw(s){
  const ctx=this.ctx,{frame,motion,event,phase,elapsed,camera,fullEffects,shake,particles,replaying,paused,waiting,selectedPlay,squads}=s;
  if(!frame)return;const team=event?.team??0,P=(x,y)=>project(x,y,camera,team),line=(a,b,color,width=1)=>{ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke()},quad=(yard1,yard2,color)=>{let a=P(54,yard1),b=P(586,yard1),c=P(586,yard2),d=P(54,yard2);ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.lineTo(c.x,c.y);ctx.lineTo(d.x,d.y);ctx.closePath();ctx.fill()};
  ctx.clearRect(0,0,1120,500);ctx.save();if(fullEffects&&shake>.1)ctx.translate(Math.sin(elapsed*103)*shake,Math.cos(elapsed*81)*shake*.6);
  // Stadium skyline, light towers, banners and three tiers of pixel fans.
  ctx.fillStyle='#182e2b';ctx.fillRect(0,0,1120,500);ctx.fillStyle='#2b4940';ctx.fillRect(0,37,1120,58);ctx.fillStyle='#4c6950';ctx.fillRect(0,92,1120,24);
  for(let i=0;i<24;i++){const x=i*49;ctx.fillStyle=i%2?'#1d4539':'#24523e';ctx.fillRect(x,18,24,43);ctx.beginPath();ctx.moveTo(x-9,32);ctx.lineTo(x+12,0);ctx.lineTo(x+34,32);ctx.fill()}
  [78,1040].forEach(x=>{ctx.fillStyle='#8f9c80';ctx.fillRect(x,10,4,83);ctx.fillStyle='#d8e8b4';ctx.fillRect(x-16,8,36,9);for(let j=0;j<4;j++){ctx.fillStyle='#fbefb0';ctx.fillRect(x-14+j*9,8,6,6)}});
  ctx.fillStyle='#182b26';ctx.fillRect(439,18,242,35);ctx.strokeStyle='#71855d';ctx.lineWidth=2;ctx.strokeRect(439,18,242,35);ctx.fillStyle='#dae6ac';ctx.textAlign='center';ctx.font='bold 16px monospace';ctx.fillText('P O K É  S T A D I U M',560,42);
  const cheering=event?.touchdown&&phase>motion.contact;
  for(let row=0;row<3;row++)for(let col=0;col<112;col++){const x=col*10+row%2*4,y=66+row*11-(cheering&&fullEffects?Math.abs(Math.sin(elapsed*8+col+row))*4:0);ctx.fillStyle=['#e2ca92','#9ab5a0','#82b4ca','#d58f73','#b7c679'][(col*7+row*3)%5];ctx.fillRect(x,y,5,4);ctx.fillStyle=col<56?'#6687a7':'#a06257';ctx.fillRect(x-1,y+4,7,5)}
  ctx.fillStyle='#172e24';ctx.fillRect(0,102,1120,20);ctx.fillStyle='#b4c784';ctx.fillRect(0,118,1120,3);ctx.fillStyle='#8fa879';ctx.fillRect(0,439,1120,3);ctx.fillStyle='#213b2b';ctx.fillRect(0,443,1120,57);
  for(let i=0;i<12;i++){ctx.fillStyle=i<6?'#75b1c0':'#c28976';ctx.fillRect(i*96+12,106,45,7)}
  ctx.fillStyle='#487342';ctx.fillRect(0,123,1120,310);
  for(let y=-10;y<110;y+=5)quad(y,y+5,(y/5)%2?'#4c7a44':'#507f48');
  quad(-10,0,team===0?'#285a56':'#77483c');quad(100,110,team===0?'#77483c':'#285a56');
  [-5,105].forEach(y=>{const a=P(320,y);ctx.save();ctx.translate(a.x,a.y);ctx.rotate(-Math.PI/2);ctx.font='bold 25px monospace';ctx.fillStyle='#dce7b6';ctx.textAlign='center';ctx.fillText(y<0?(team===0?'KANTO':'ROCKET'):(team===0?'ROCKET':'KANTO'),0,9);ctx.restore()});
  // Fixed field texture, sideline stripes, yard numbers, and hashes.
  ctx.fillStyle='#183d2325';for(let i=0;i<240;i++){const p=P(62+(i*89)%515,-10+(i*37)%120);ctx.fillRect(p.x,p.y,3,2)}
  line(P(54,-10),P(54,110),'#d9e5bc',3);line(P(586,-10),P(586,110),'#e5edcd',4);
  for(let yard=0;yard<=100;yard+=5){line(P(54,yard),P(586,yard),yard%10===0?'#dbe6b8':'#a9c28d99',yard%10===0?2:1);if(yard%10===0&&yard>0&&yard<100){ctx.font='bold 24px monospace';ctx.fillStyle='#d5e3adc0';[98,540].forEach(lane=>{const p=P(lane,yard+1.4);ctx.save();ctx.translate(p.x,p.y);ctx.transform(1,0,.18,1,0,0);ctx.fillText(String(Math.min(yard,100-yard)),0,6);ctx.restore()})}for(let j=1;j<5;j++){[58,240,400,580].forEach(lane=>{const p=P(lane,yard+j);line({x:p.x-3,y:p.y},{x:p.x+3,y:p.y},'#dce7b6',2)})}}
  [0,100].forEach(yard=>{line(P(54,yard),P(586,yard),'#e3edc9',4)});
  const start=event?.start??squads?.start??20,first=event?.first??Math.min(100,start+10);
  line(P(54,start),P(586,start),'#72d3e9',3);line(P(54,first),P(586,first),'#ebd576',3);
  const marker=P(586,first);ctx.fillStyle='#e9d375';ctx.fillRect(marker.x-8,marker.y+5,17,21);ctx.fillStyle='#283b21';ctx.font='bold 13px monospace';ctx.fillText('1',marker.x,marker.y+20);
  // Goalposts are visible near either end zone.
  [-7,107].forEach(yard=>{const p=P(320,yard);ctx.strokeStyle='#e7ce72';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(p.x,p.y+30);ctx.lineTo(p.x,p.y-28);ctx.moveTo(p.x-27,p.y-28);ctx.lineTo(p.x+27,p.y-28);ctx.moveTo(p.x-27,p.y-28);ctx.lineTo(p.x-27,p.y-61);ctx.moveTo(p.x+27,p.y-28);ctx.lineTo(p.x+27,p.y-61);ctx.stroke()});
  if(waiting){const routes=root.PokeMotion.routes(selectedPlay,start,squads[0]);routes.forEach(route=>{ctx.setLineDash(route.primary?[]:[6,6]);ctx.strokeStyle=route.primary?'#f5dd7b':'#e0edc29c';ctx.lineWidth=route.primary?3:2;ctx.beginPath();route.points.forEach((p,i)=>{const q=P(p.x,p.y);if(i)ctx.lineTo(q.x,q.y);else ctx.moveTo(q.x,q.y)});ctx.stroke();ctx.setLineDash([]);const end=route.points.at(-1),prev=route.points.at(-2),a=P(end.x,end.y),b=P(prev.x,prev.y),angle=Math.atan2(a.y-b.y,a.x-b.x);ctx.fillStyle=route.primary?'#f5dd7b':'#e0edc2';ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(a.x-11*Math.cos(angle-.5),a.y-11*Math.sin(angle-.5));ctx.lineTo(a.x-11*Math.cos(angle+.5),a.y-11*Math.sin(angle+.5));ctx.closePath();ctx.fill()})}
  for(const particle of particles){const p=P(particle.x,particle.y);ctx.globalAlpha=clamp(particle.life/particle.max,0,1);ctx.fillStyle=particle.color;ctx.save();ctx.translate(p.x,p.y);if(particle.kind==='confetti')ctx.rotate(particle.life*7+particle.x);ctx.fillRect(-particle.size/2,-particle.size/2,particle.size,particle.kind==='confetti'?particle.size/2:particle.size);ctx.restore()}ctx.globalAlpha=1;
  frame.players.slice().sort((a,b)=>a.tx-b.tx).forEach(player=>{
    const p=P(player.tx,player.ty);if(p.x<-65||p.x>1185)return;const size=44+clamp((player.tx-54)/532,0,1)*8,bob=fullEffects&&player.move?Math.abs(Math.sin(player.stride))*3:0,down=fullEffects?player.fall:0;
    ctx.fillStyle=player.team===0?'#72d0efbb':'#ef8b74bb';ctx.beginPath();ctx.ellipse(p.x,p.y+8,down?21:16,5,0,0,7);ctx.fill();if(player.carrier&&!motion.kick){ctx.strokeStyle='#f0e785';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(p.x,p.y+8,22+Math.sin(elapsed*8),7,0,0,7);ctx.stroke()}
    if(fullEffects&&player.move&&!down){ctx.fillStyle=player.team===0?'#b2dce1':'#edb095';const feet=Math.sin(player.stride)*5;ctx.fillRect(p.x-9+feet,p.y+4,5,4);ctx.fillRect(p.x+5-feet,p.y+6,5,4)}
    ctx.save();ctx.translate(p.x,p.y-bob-player.jump);const rock=fullEffects&&player.move?Math.sin(player.stride)*.065:0;ctx.rotate(rock+player.lean+down*(player.pose==='dive'||player.pose==='miss'?-.5:1)*Math.PI/2);if(fullEffects&&player.pose==='throw')ctx.rotate(team===0?-.18:.18);if(fullEffects&&player.pose==='celebrate')ctx.rotate(Math.sin(elapsed*9)*.12);const image=this.images[player.p.id];ctx.imageSmoothingEnabled=false;if(image?.complete&&image.naturalWidth)ctx.drawImage(image,-size/2,-size+12,size,size);ctx.restore();
    if(player.carrier||player.p.id===event?.defender||waiting&&player.p.pos==='QB'){const text=player.p.name.toUpperCase();ctx.font='bold 8px monospace';ctx.textAlign='center';const width=ctx.measureText(text).width+8;ctx.fillStyle='#122a20ee';ctx.fillRect(p.x-width/2,p.y-size-10-player.jump-bob,width,13);ctx.fillStyle=player.carrier?'#efeea6':'#f5c8b3';ctx.fillText(text,p.x,p.y-size-player.jump-bob)}
  });
  const ball=frame.ball;if(ball.visible){const p=P(ball.x,ball.y),lift=ball.arc*.75;ctx.fillStyle='#15341f6b';ctx.beginPath();ctx.ellipse(p.x,p.y+7,5+Math.max(0,lift)*.025,3,0,0,7);ctx.fill();ctx.save();ctx.translate(p.x,p.y-12-lift);ctx.rotate(ball.spin);ctx.fillStyle='#9a522d';ctx.strokeStyle='#ffe5b2';ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(0,0,5,7,0,0,7);ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(-2,-3);ctx.lineTo(2,3);ctx.stroke();ctx.restore()}
  if(frame.impact&&phase>=motion.contact&&phase<motion.contact+.3&&fullEffects){const c=P(frame.carrier.x,frame.carrier.y),t=clamp((phase-motion.contact)/.3,0,1);ctx.strokeStyle=`rgba(249,234,168,${1-t})`;ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(c.x,c.y,15+t*28,9+t*15,0,0,7);ctx.stroke()}
  ctx.restore();if(replaying){ctx.fillStyle='#14291de8';ctx.fillRect(455,91,210,23);ctx.fillStyle='#e5f894';ctx.font='bold 12px monospace';ctx.textAlign='center';ctx.fillText('↺ HIGHLIGHT REPLAY',560,107)}if(paused){ctx.fillStyle='#0e211baa';ctx.fillRect(0,0,1120,500);ctx.fillStyle='#d8f474';ctx.font='bold 28px monospace';ctx.textAlign='center';ctx.fillText('BROADCAST PAUSED',560,265)}
 }
}
root.PokeStadium={Stadium,project};if(typeof module!=='undefined')module.exports=root.PokeStadium;
})(typeof window!=='undefined'?window:globalThis);
