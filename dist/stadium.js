/* Side-on stadium projection. Yardage is horizontal; sprites stay upright. */
(function(root){
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const dances=typeof module!=='undefined'?require('./dances.js'):root.PokeDances;
function project(lane,yard,camera=30,team=0){const v=(lane-54)/532;return{x:560+(team===0?1:-1)*(yard-camera)*16+(v-.5)*74,y:273+v*310};}
class Stadium{
 constructor(canvas,images){
  this.canvas=canvas;this.ctx=canvas.getContext('2d');this.images=images;this.sprites=root.PokeSprites?new root.PokeSprites.SpriteBank():null;
  this.scale=Math.min(2,Math.max(1,root.devicePixelRatio||1));canvas.width=1120*this.scale;canvas.height=640*this.scale;
  this.backdrop=null;if(root.Image){this.backdrop=new root.Image();this.backdrop.src='assets/stadium-grandstand-v1.webp';}
 }
 dancer(ctx,player,size,s){
  const move=dances.sample(player.p.id,player.danceTime??s.celebration.elapsed,s.fullEffects);
  ctx.save();ctx.translate(move.x,-move.lift);ctx.rotate(move.rotation);ctx.scale(move.sx,move.sy);
  const actor={...player,pose:move.pose,move:move.pose==='run'?1:0,jump:0,stride:move.time*10,danceFacing:move.facing,danceTime:move.time},image=this.images[player.p.id];
  ctx.imageSmoothingEnabled=false;
  if(!this.sprites?.draw(ctx,actor,size,move.time,s.motion,s.event,s.phase,s.fullEffects)&&image?.complete&&image.naturalWidth)ctx.drawImage(image,-size/2,-size+12,size,size);
  ctx.restore();
 }
 victoryScreen(s){
  const c=s.celebration,player=s.frame.players.find(p=>p.team===c.team&&p.p.id===c.scorer);if(!player)return;
  const ctx=this.ctx,color=c.dance.color,t=s.fullEffects?c.elapsed:0;
  ctx.save();ctx.fillStyle='#111c29';ctx.fillRect(322,8,476,246);ctx.strokeStyle=color;ctx.lineWidth=3;ctx.strokeRect(327,13,466,236);
  ctx.fillStyle='#071924';ctx.fillRect(334,20,452,222);ctx.fillStyle=c.team===0?'#285979':'#7d3f44';ctx.fillRect(334,20,452,29);
  ctx.textAlign='center';ctx.font='bold 17px monospace';ctx.fillStyle='#fff5bb';ctx.fillText(s.event.touchdown?'TOUCHDOWN · DANCE CAM':'VICTORY DANCE CAM',560,40);
  // The stadium camera shows the same sprite, facing and dance beat as the field.
  ctx.fillStyle='#17313b';ctx.fillRect(352,176,416,18);ctx.fillStyle=color;ctx.globalAlpha=.25;ctx.beginPath();ctx.ellipse(560,184,68,8,0,0,7);ctx.fill();ctx.globalAlpha=1;
  if(s.fullEffects)for(let i=0;i<10;i++){const x=360+(i*73)%400,y=65+(i*41)%103+Math.sin(t*4+i)*6;ctx.fillStyle=i%2?color:'#e5f989';ctx.fillRect(x-3,y,7,2);ctx.fillRect(x,y-3,2,7);}
  ctx.save();ctx.translate(560,182);this.dancer(ctx,player,119,s);ctx.restore();
  ctx.fillStyle='#e7f3d9';ctx.font='bold 19px monospace';ctx.fillText(player.p.name.toUpperCase(),560,213);ctx.fillStyle=color;ctx.font='bold 13px monospace';ctx.fillText(c.dance.name.toUpperCase(),560,234);
  ctx.restore();
 }
 atmosphere(s){
  const ctx=this.ctx,t=s.fullEffects?(s.ambientTime??s.elapsed):0,cheering=Boolean((s.event?.touchdown||s.event?.score>0||s.event?.safety)&&s.phase>s.motion.contact),energy=cheering?1:.24;
  ctx.fillStyle='#1e3149';ctx.fillRect(0,0,1120,273);
  if(this.backdrop?.complete&&this.backdrop.naturalWidth){ctx.imageSmoothingEnabled=false;ctx.drawImage(this.backdrop,0,0,1120,260);}
  else{ctx.fillStyle='#334455';ctx.fillRect(0,48,1120,210);for(let row=0;row<8;row++)for(let col=0;col<112;col++){const x=col*10,y=80+row*21;ctx.fillStyle=['#f2c39b','#b88264','#e2aa78'][(row+col)%3];ctx.fillRect(x+2,y,4,5);ctx.fillStyle=col<56?'#428cce':'#df655b';ctx.fillRect(x,y+5,8,9);}}
  // The illustrated crowd supplies depth; foreground spectators react in groups.
  for(let i=0;i<52;i++){
   if(i%13===0||i%13===12)continue;const x=13+i*21.5,team=i<26?0:1,beat=Math.sin(t*(cheering?10:3.2)+i*.8),jump=Math.max(0,beat)*energy*5,y=215-jump;
   const skin=['#f3be89','#d29168','#986346','#f0cfab'][i%4],shirt=team===0?['#287fd1','#55bddc','#174476'][i%3]:['#d34f58','#ed8a6d','#8e374a'][i%3];
   ctx.fillStyle='#17293b';ctx.fillRect(x-1,y-5,6,6);ctx.fillStyle=skin;ctx.fillRect(x,y-4,4,4);ctx.fillStyle=i%3?'#443b35':'#e1bb63';ctx.fillRect(x-1,y-5,6,2);ctx.fillStyle=shirt;ctx.fillRect(x-1,y,6,6);
   const raised=cheering||Math.sin(t*2+i*.66)>.65,arm=raised?y-5:y+1;ctx.fillStyle=shirt;ctx.fillRect(x-3,arm,2,5);ctx.fillRect(x+5,arm,2,5);ctx.fillStyle=skin;ctx.fillRect(x-3,arm-1,2,2);ctx.fillRect(x+5,arm-1,2,2);
  }
  // Cloth strips ripple with the stadium breeze, even while awaiting a play call.
  [69,219,365,757,900,1050].forEach((x,i)=>{const y=209+(i%2)*13;ctx.fillStyle='#d6d8c8';ctx.fillRect(x,y-33,2,44);for(let strip=0;strip<8;strip++){const lift=Math.sin(t*4+i+strip*.55)*3;ctx.fillStyle=strip%3===1?'#e9e9cb':i<3?'#4597df':'#ee7169';ctx.fillRect(x+2+strip*4,y-32+lift,4,17);}});
  if(s.fullEffects&&!s.paused)for(let i=0;i<9;i++){if(Math.sin(t*2.3+i*21.7)>.995){const x=52+(i*137)%1050,y=98+(i%3)*44;ctx.fillStyle='#fff4d0';ctx.fillRect(x-3,y,7,2);ctx.fillRect(x,y-3,2,7);}}
  ctx.fillStyle='#0b1828';ctx.fillRect(452,25,213,38);ctx.strokeStyle='#55738c';ctx.lineWidth=1;ctx.strokeRect(452,25,213,38);ctx.textAlign='center';ctx.font='bold 9px monospace';ctx.fillStyle='#b5d1e8';ctx.fillText('P O K É  S T A D I U M',560,37);ctx.font='bold 15px monospace';const score=s.event&&s.phase<s.motion.resolveAt?(s.event.scoreBefore??s.score):s.score;ctx.fillStyle='#d0f3e7';ctx.fillText(score?`BLUE ${String(score[0]).padStart(2,'0')} : ${String(score[1]).padStart(2,'0')} RED`:'KANTO LEAGUE',560,55);
  if(s.celebration)this.victoryScreen(s);
  ctx.fillStyle='#162c39';ctx.fillRect(0,260,1120,13);ctx.fillStyle='#92bdc4';ctx.fillRect(0,268,1120,2);
  // Team benches and the near camera rail give the field a foreground layer.
  ctx.fillStyle='#243a3b';ctx.fillRect(0,593,1120,47);ctx.fillStyle='#779595';ctx.fillRect(0,594,1120,2);
  [42,140,238,834,932,1030].forEach((x,i)=>{ctx.fillStyle=i<3?'#305f8b':'#a04f50';ctx.fillRect(x,606,60,11);ctx.fillStyle='#adc3bb';ctx.fillRect(x,604,60,3);ctx.fillStyle='#182c36';ctx.fillRect(x+4,617,3,8);ctx.fillRect(x+53,617,3,8);});
 }

 draw(s){
  const ctx=this.ctx,{frame,motion,event,phase,elapsed,camera,fullEffects,shake,particles,replaying,paused,waiting,selectedPlay,selectedDefense,squads}=s;
  if(!frame)return;this.sprites?.preload(frame.players.map(player=>player.p));const team=event?.team??0,P=(x,y)=>project(x,y,camera,team),line=(a,b,color,width=1)=>{ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke()},quad=(yard1,yard2,color)=>{let a=P(54,yard1),b=P(586,yard1),c=P(586,yard2),d=P(54,yard2);ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.lineTo(c.x,c.y);ctx.lineTo(d.x,d.y);ctx.closePath();ctx.fill()};
  ctx.setTransform(this.scale,0,0,this.scale,0,0);ctx.clearRect(0,0,1120,640);ctx.save();if(fullEffects&&shake>.1)ctx.translate(Math.sin(elapsed*103)*shake,Math.cos(elapsed*81)*shake*.6);
  this.atmosphere(s);
  ctx.fillStyle='#477d50';ctx.fillRect(0,273,1120,310);
  for(let y=-10;y<110;y+=5)quad(y,y+5,(y/5)%2?'#477e4b':'#528b50');
  quad(-10,0,team===0?'#285a56':'#77483c');quad(100,110,team===0?'#77483c':'#285a56');
  [-5,105].forEach(y=>{const a=P(320,y);ctx.save();ctx.translate(a.x,a.y);ctx.rotate(-Math.PI/2);ctx.font='bold 25px monospace';ctx.fillStyle='#dce7b6';ctx.textAlign='center';ctx.fillText(y<0?(team===0?'KANTO':'ROCKET'):(team===0?'ROCKET':'KANTO'),0,9);ctx.restore()});
  ctx.fillStyle='#fff2ba09';ctx.beginPath();ctx.moveTo(100,273);ctx.lineTo(345,273);ctx.lineTo(620,583);ctx.lineTo(20,583);ctx.fill();
  ctx.fillStyle='#162d4214';ctx.fillRect(0,273,1120,18);ctx.fillRect(0,571,1120,12);
  // Fixed field texture, sideline stripes, yard numbers, and hashes.
  for(let i=0;i<720;i++){const p=P(62+(i*89)%515,-10+(i*37.13)%120);if(p.x<0||p.x>1120)continue;ctx.fillStyle=['#28593935','#8eb85c24','#c5d57c14'][i%3];ctx.fillRect(p.x,p.y,i%3===0?2:4,1)}
  line(P(54,-10),P(54,110),'#d9e5bc',3);line(P(586,-10),P(586,110),'#e5edcd',4);
  for(let yard=0;yard<=100;yard+=5){line(P(54,yard),P(586,yard),yard%10===0?'#dbe6b8':'#a9c28d99',yard%10===0?2:1);if(yard%10===0&&yard>0&&yard<100){ctx.font='bold 24px monospace';ctx.fillStyle='#d5e3adc0';[98,540].forEach(lane=>{const p=P(lane,yard+1.4);ctx.save();ctx.translate(p.x,p.y);ctx.transform(1,0,.18,1,0,0);ctx.fillText(String(Math.min(yard,100-yard)),0,6);ctx.restore()})}for(let j=1;j<5;j++){[58,240,400,580].forEach(lane=>{const p=P(lane,yard+j);line({x:p.x-3,y:p.y},{x:p.x+3,y:p.y},'#dce7b6',2)})}}
  [0,100].forEach(yard=>{line(P(54,yard),P(586,yard),'#e3edc9',4)});
  const start=event?.start??20,first=event?.first??Math.min(100,start+10);
  line(P(54,start),P(586,start),'#72d3e9',3);line(P(54,first),P(586,first),'#ebd576',3);
  const marker=P(586,first);ctx.fillStyle='#e9d375';ctx.fillRect(marker.x-8,marker.y+5,17,21);ctx.fillStyle='#283b21';ctx.font='bold 13px monospace';ctx.fillText('1',marker.x,marker.y+20);
  // Goalposts are visible near either end zone.
  [-7,107].forEach(yard=>{const p=P(320,yard);ctx.strokeStyle='#e7ce72';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(p.x,p.y+30);ctx.lineTo(p.x,p.y-28);ctx.moveTo(p.x-27,p.y-28);ctx.lineTo(p.x+27,p.y-28);ctx.moveTo(p.x-27,p.y-28);ctx.lineTo(p.x-27,p.y-61);ctx.moveTo(p.x+27,p.y-28);ctx.lineTo(p.x+27,p.y-61);ctx.stroke()});
  if(waiting){const routes=team===1?root.PokeMotion.defenseRoutes(selectedDefense||'gap',start,squads[0]):root.PokeMotion.routes(selectedPlay,start,squads[0]);routes.forEach(route=>{ctx.setLineDash(route.primary?[]:[6,6]);ctx.strokeStyle=route.primary?'#f5dd7b':'#e0edc29c';ctx.lineWidth=route.primary?3:2;ctx.beginPath();route.points.forEach((p,i)=>{const q=P(p.x,p.y);if(i)ctx.lineTo(q.x,q.y);else ctx.moveTo(q.x,q.y)});ctx.stroke();ctx.setLineDash([]);const end=route.points.at(-1),prev=route.points.at(-2),a=P(end.x,end.y),b=P(prev.x,prev.y),angle=Math.atan2(a.y-b.y,a.x-b.x);ctx.fillStyle=route.primary?'#f5dd7b':'#e0edc2';ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(a.x-11*Math.cos(angle-.5),a.y-11*Math.sin(angle-.5));ctx.lineTo(a.x-11*Math.cos(angle+.5),a.y-11*Math.sin(angle+.5));ctx.closePath();ctx.fill()})}
  for(const particle of particles){const p=P(particle.x,particle.y);ctx.globalAlpha=clamp(particle.life/particle.max,0,1);ctx.fillStyle=particle.color;ctx.save();ctx.translate(p.x,p.y);if(particle.kind==='confetti')ctx.rotate(particle.life*7+particle.x);ctx.fillRect(-particle.size/2,-particle.size/2,particle.size,particle.kind==='confetti'?particle.size/2:particle.size);ctx.restore()}ctx.globalAlpha=1;
  frame.players.slice().sort((a,b)=>a.tx-b.tx).forEach(player=>{
    const p=P(player.tx,player.ty);if(p.x<-65||p.x>1185)return;const size=68+clamp((player.tx-54)/532,0,1)*12,bob=fullEffects&&player.move?Math.abs(Math.sin(player.stride))*3:0,down=fullEffects?player.fall:0;
    const ultimate=event?.ultimates?.find(u=>u.id===player.p.id&&u.team===player.team),power=phase-motion.ultimateAt;
    if(ultimate&&power>=0&&power<1.45){ctx.save();ctx.strokeStyle=ultimate.color;ctx.fillStyle=ultimate.color;ctx.lineWidth=2.5;const pulse=fullEffects?Math.sin(power*13)*4:0;ctx.globalAlpha=fullEffects?Math.min(1,(1.45-power)*3):.8;ctx.beginPath();ctx.ellipse(p.x,p.y+7,27+pulse,9+pulse*.2,0,0,7);ctx.stroke();
     if(fullEffects)for(let i=0;i<6;i++){const angle=i*Math.PI/3+power*4,x=p.x+Math.cos(angle)*(30+pulse),y=p.y-28+Math.sin(angle)*24;
      if(ultimate.element==='electric'||ultimate.element==='fire'){ctx.beginPath();ctx.moveTo(x-4,y+8);ctx.lineTo(x+2,y);ctx.lineTo(x-2,y-2);ctx.lineTo(x+4,y-10);ctx.stroke()}
      else if(ultimate.element==='water'||ultimate.element==='psychic'||ultimate.element==='ghost'){ctx.beginPath();ctx.arc(x,y,3+i%2,0,Math.PI*2);ctx.stroke()}
      else{ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.fillRect(-2,-5,4,10);ctx.restore()}}
     ctx.restore();}
    ctx.fillStyle='#0d26364d';ctx.beginPath();ctx.ellipse(p.x+8,p.y+11,down?25:19,6,0,0,7);ctx.fill();
    ctx.fillStyle=player.team===0?'#72d0efbb':'#ef8b74bb';ctx.beginPath();ctx.ellipse(p.x,p.y+8,down?21:16,5,0,0,7);ctx.fill();if(player.carrier&&!motion.kick){ctx.strokeStyle='#f0e785';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(p.x,p.y+8,22+Math.sin(elapsed*8),7,0,0,7);ctx.stroke()}
    if(fullEffects&&player.move&&!down){ctx.fillStyle=player.team===0?'#b2dce1':'#edb095';const feet=Math.sin(player.stride)*5;ctx.fillRect(p.x-9+feet,p.y+4,5,4);ctx.fillRect(p.x+5-feet,p.y+6,5,4)}
    ctx.save();ctx.translate(p.x,p.y-bob-(fullEffects?player.jump:0));const rock=fullEffects&&player.move?Math.sin(player.stride)*.065:0;ctx.rotate(rock+player.lean+down*(player.pose==='dive'||player.pose==='miss'?-.5:1)*Math.PI/2);if(fullEffects&&player.pose==='throw')ctx.rotate(team===0?-.18:.18);if(fullEffects&&player.pose==='celebrate')ctx.rotate(Math.sin(elapsed*9)*.12);const image=this.images[player.p.id];ctx.imageSmoothingEnabled=false;if(player.pose==='dance')this.dancer(ctx,player,size,s);else if(!this.sprites?.draw(ctx,player,size,s.ambientTime??elapsed,motion,event,phase,fullEffects)&&image?.complete&&image.naturalWidth)ctx.drawImage(image,-size/2,-size+12,size,size);ctx.restore();
    if(player.carrier||player.p.id===event?.defender||waiting&&player.p.pos==='QB'){const text=player.p.name.toUpperCase();ctx.font='bold 10px monospace';ctx.textAlign='center';const width=ctx.measureText(text).width+8;ctx.fillStyle='#122a20ee';ctx.fillRect(p.x-width/2,p.y-size-10-(fullEffects?player.jump:0)-bob,width,16);ctx.fillStyle=player.carrier?'#efeea6':'#f5c8b3';ctx.fillText(text,p.x,p.y-size-(fullEffects?player.jump:0)-bob)}
  });
  // The selected defender's own elemental ultimate travels to the quarterback.
  if(event?.counter&&phase>=motion.ultimateAt&&phase<motion.resolveAt+.65){
   const attacker=frame.players.find(p=>p.p.id===event.defender&&p.team!==event.team),victim=frame.players.find(p=>p.p.id===event.qb&&p.team===event.team),u=event.ultimates[0];
   if(attacker&&victim){const a=P(attacker.tx,attacker.ty),b=P(victim.tx,victim.ty),travel=clamp((phase-motion.ultimateAt)/.55,0,1),end={x:a.x+(b.x-a.x)*travel,y:a.y+(b.y-a.y)*travel};a.y-=33;end.y-=33;
    ctx.save();ctx.strokeStyle=u.color;ctx.fillStyle=u.color;ctx.lineWidth=fullEffects?7:2;ctx.globalAlpha=fullEffects?.85:.55;ctx.beginPath();ctx.moveTo(a.x,a.y);
    for(let i=1;i<=8;i++){const t=i/8,jitter=fullEffects&&i<8?Math.sin((s.ambientTime??elapsed)*23+i*7)*7:0;ctx.lineTo(a.x+(end.x-a.x)*t,a.y+(end.y-a.y)*t+jitter)}ctx.stroke();
    if(fullEffects){ctx.strokeStyle='#fff8cf';ctx.lineWidth=2;ctx.stroke();ctx.beginPath();ctx.arc(end.x,end.y,8+Math.abs(Math.sin(elapsed*17))*7,0,Math.PI*2);ctx.stroke();}
    ctx.restore();
   }
  }
  const ball=frame.ball;if(ball.visible){const p=P(ball.x,ball.y),lift=ball.arc*.75;ctx.fillStyle='#15341f6b';ctx.beginPath();ctx.ellipse(p.x,p.y+7,5+Math.max(0,lift)*.025,3,0,0,7);ctx.fill();ctx.save();ctx.translate(p.x,p.y-12-lift);ctx.rotate(ball.spin);ctx.fillStyle='#9a522d';ctx.strokeStyle='#ffe5b2';ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(0,0,5,7,0,0,7);ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(-2,-3);ctx.lineTo(2,3);ctx.stroke();ctx.restore()}
  if(frame.impact&&phase>=motion.contact&&phase<motion.contact+.3&&fullEffects){const c=P(frame.carrier.x,frame.carrier.y),t=clamp((phase-motion.contact)/.3,0,1);ctx.strokeStyle=`rgba(249,234,168,${1-t})`;ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(c.x,c.y,15+t*28,9+t*15,0,0,7);ctx.stroke()}
  ctx.restore();if(replaying){ctx.fillStyle='#14291de8';ctx.fillRect(455,243,210,23);ctx.fillStyle='#e5f894';ctx.font='bold 12px monospace';ctx.textAlign='center';ctx.fillText('↺ HIGHLIGHT REPLAY',560,259)}if(paused){ctx.fillStyle='#0e211baa';ctx.fillRect(0,0,1120,640);ctx.fillStyle='#d8f474';ctx.font='bold 28px monospace';ctx.textAlign='center';ctx.fillText('BROADCAST PAUSED',560,330)}
 }
}
root.PokeStadium={Stadium,project};if(typeof module!=='undefined')module.exports=root.PokeStadium;
})(typeof window!=='undefined'?window:globalThis);
