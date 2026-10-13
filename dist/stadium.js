/* Side-on stadium projection. Yardage is horizontal; sprites stay upright. */
(function(root){
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const dances=typeof module!=='undefined'?require('./dances.js'):root.PokeDances;
const battles=typeof module!=='undefined'?require('./battle.js'):root.PokeBattle;
function project(lane,yard,camera=30,team=0){const v=(lane-54)/532;return{x:560+(team===0?1:-1)*(yard-camera)*16+(v-.5)*74,y:273+v*310};}
// Keep the line, both units and the scoring end zone in view, in either direction.
function goalpostSize(extraPoint=false){return extraPoint?{halfWidth:78,stem:48,crossbar:88,height:210,line:7}:{halfWidth:27,stem:30,crossbar:28,height:61,line:4}}
function cameraFor(yard){return clamp(yard+(yard>=78?8:4),12,98)}
class Stadium{
 constructor(canvas,images){
  this.canvas=canvas;this.ctx=canvas.getContext('2d');this.images=images;this.sprites=root.PokeSprites?new root.PokeSprites.SpriteBank():null;
  this.scale=Math.min(2,Math.max(1,root.devicePixelRatio||1));canvas.width=1120*this.scale;canvas.height=640*this.scale;
  this.backdrop=null;if(root.Image){this.backdrop=new root.Image();this.backdrop.src='assets/stadium-grandstand-v1.webp';}
 }
 dancer(ctx,player,size,s){
  const move=dances.sample(player.p.id,player.danceTime??s.celebration.elapsed,s.fullEffects);
  ctx.save();ctx.translate(move.x,-move.lift);ctx.rotate(move.rotation);ctx.scale(move.sx,move.sy);
  const actor={...player,pose:move.pose,move:move.pose==='run'?1:0,jump:0,stride:move.time*10,danceFacing:move.facing,danceTime:move.time,actionFrame:move.actionFrame},image=this.images[player.p.id];
  ctx.imageSmoothingEnabled=false;
  if(!this.sprites?.draw(ctx,actor,size,move.time,s.motion,s.event,s.phase,s.fullEffects)&&image?.complete&&image.naturalWidth)ctx.drawImage(image,-size/2,-size+12,size,size);
  ctx.restore();
  if(s.fullEffects&&move.accent>0){ctx.save();ctx.translate(move.x,-move.lift);ctx.strokeStyle=dances.signature(player.p.id).color;ctx.globalAlpha=move.accent*.8;ctx.lineWidth=2;const top=-size*.86;ctx.beginPath();ctx.moveTo(-13,top+1);ctx.lineTo(-17,top-12);ctx.lineTo(-5,top-6);ctx.lineTo(0,top-19);ctx.lineTo(5,top-6);ctx.lineTo(17,top-12);ctx.lineTo(13,top+1);ctx.closePath();ctx.stroke();ctx.restore();}
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
 powerGround(p,u,age,animated){
  const ctx=this.ctx,charge=Math.min(1,age/.28),fade=Math.min(1,(1.15-age)*4),radius=animated?29+charge*13:33;
  ctx.save();ctx.globalAlpha=.18*fade;ctx.fillStyle=u.color;ctx.beginPath();ctx.ellipse(p.x,p.y+5,radius+12,14,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=.95*fade;ctx.strokeStyle=u.color;ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(p.x,p.y+5,radius,11,0,0,Math.PI*2);ctx.stroke();
  if(animated){ctx.setLineDash([7,7]);ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(p.x,p.y+5,radius+10,16,0,age*3,age*3+Math.PI*2);ctx.stroke();ctx.setLineDash([]);for(let i=0;i<5;i++){const x=p.x-24+i*12,y=p.y-12-age*46+i%2*13;ctx.fillRect(x,y,3,8)}}ctx.restore();
 }
 powerStrike(actor,s,P){
  const ctx=this.ctx,u=actor.power,age=actor.powerAge,players=s.frame.players,a=P(actor.tx,actor.ty),e=s.event;let target;
  if(e.returner)target=actor.team===e.receivingTeam?players.filter(p=>p.team!==actor.team).sort((p,q)=>Math.hypot(p.tx-actor.tx,(p.ty-actor.ty)*16)-Math.hypot(q.tx-actor.tx,(q.ty-actor.ty)*16))[0]:players.find(p=>p.carrier);
  else if(e.counter)target=players.find(p=>p.team===e.team&&p.p.id===e.qb);
  else if(actor.p.pos==='QB')target=players.find(p=>p.team===actor.team&&p.p.id===e.target);
  else if(actor.team!==e.team)target=players.find(p=>p.carrier);
  else target=players.filter(p=>p.team!==actor.team).sort((p,q)=>Math.hypot(p.tx-actor.tx,(p.ty-actor.ty)*16)-Math.hypot(q.tx-actor.tx,(q.ty-actor.ty)*16))[0];
  const b=target?P(target.tx,target.ty):{x:a.x+55,y:a.y};a.y-=33;b.y-=30;
  ctx.save();ctx.strokeStyle=u.color;ctx.fillStyle=u.color;ctx.lineWidth=3;ctx.globalAlpha=Math.min(1,(u.end-s.phase)*4);
  if(s.fullEffects&&age>=.28){
   const t=Math.min(1,(age-.28)/(e.counter?.27:.38)),x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t,angle=Math.atan2(b.y-a.y,b.x-a.x),r=18+Math.max(0,age-.5)*42;
   ctx.shadowColor=u.color;ctx.shadowBlur=12;
   if(u.element==='electric'){ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(a.x,a.y);for(let i=1;i<=10;i++)ctx.lineTo(a.x+(x-a.x)*i/10,a.y+(y-a.y)*i/10+(i===10?0:Math.sin(age*35+i*9)*13));ctx.stroke();ctx.lineWidth=1.5;ctx.strokeStyle='#fffce4';ctx.stroke();}
   else if(u.element==='water'||u.element==='dragon'){for(let i=0;i<3;i++){ctx.globalAlpha=.85-i*.17;ctx.lineWidth=13-i*3;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.quadraticCurveTo((a.x+x)/2,(a.y+y)/2+Math.sin(age*15+i)*18,x,y);ctx.stroke()}ctx.strokeStyle='#e2faff';ctx.lineWidth=2;for(let i=0;i<4;i++){ctx.beginPath();ctx.arc(x+Math.cos(age*9+i)*17,y+Math.sin(age*9+i)*17,5+i,0,Math.PI*2);ctx.stroke()}}
   else if(u.element==='fire'){for(let i=0;i<8;i++){const v=(age*2+i/8)%1,fx=a.x+(x-a.x)*v,fy=a.y+(y-a.y)*v;ctx.fillStyle=i%2?'#fff1a1':u.color;ctx.beginPath();ctx.moveTo(fx-9,fy+9);ctx.quadraticCurveTo(fx-14,fy,fx+Math.sin(age*18+i)*8,fy-23);ctx.quadraticCurveTo(fx+18,fy,fx+9,fy+9);ctx.fill()}}
   else if(u.element==='grass'){for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.bezierCurveTo(a.x+Math.cos(angle+.8)*45,a.y+Math.sin(angle+.8)*45,x-30,y-35+i*25,x,y+i*6);ctx.stroke();ctx.save();ctx.translate(x+Math.cos(age*8+i*2)*24,y+Math.sin(age*8+i*2)*18);ctx.rotate(age*5+i);ctx.fillRect(-3,-10,6,20);ctx.restore()}}
   else if(u.element==='psychic'||u.element==='ghost'||u.element==='fairy'||u.element==='poison'){for(let i=0;i<4;i++){ctx.globalAlpha=(.9-i*.15)*Math.min(1,(u.end-s.phase)*4);const ring=12+i*9+Math.sin(age*9)*3;ctx.beginPath();ctx.ellipse(x,y,ring,ring*.65,age+i*.4,0,Math.PI*2);ctx.stroke();if(u.element==='poison'||u.element==='ghost'){ctx.beginPath();ctx.arc(x+Math.sin(age*7+i*2)*35,y-15-i*6,5+i*2,0,Math.PI*2);ctx.fill()}}}
   else if(u.element==='ice'||u.element==='rock'||u.element==='ground'){for(let i=0;i<7;i++){const theta=i*Math.PI*2/7+age*.7,px=x+Math.cos(theta)*r,py=y+Math.sin(theta)*r*.6;ctx.save();ctx.translate(px,py);ctx.rotate(theta+age);ctx.beginPath();ctx.moveTo(0,-14);ctx.lineTo(9,0);ctx.lineTo(0,14);ctx.lineTo(-9,0);ctx.closePath();ctx.fill();ctx.strokeStyle='#fff6d6';ctx.lineWidth=1;ctx.stroke();ctx.restore()}}
   else{for(let i=0;i<3;i++){ctx.save();ctx.translate(x,y);ctx.rotate(angle+(i-1)*.4);ctx.lineWidth=5-i;ctx.beginPath();ctx.arc(0,0,r+i*10,-1.2,1.2);ctx.stroke();ctx.restore()}}
   ctx.globalAlpha=Math.min(1,(u.end-s.phase)*4);ctx.shadowBlur=0;ctx.strokeStyle='#fff8da';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,8+Math.sin(age*19)**2*11,0,Math.PI*2);ctx.stroke();
  }
  // An anchored marker identifies the caster throughout charge and impact.
  ctx.shadowBlur=0;ctx.globalAlpha=1;ctx.fillStyle=u.color;ctx.beginPath();ctx.moveTo(a.x,a.y-50);ctx.lineTo(a.x-6,a.y-60);ctx.lineTo(a.x+6,a.y-60);ctx.closePath();ctx.fill();
  ctx.font='bold 11px monospace';ctx.textAlign='center';const text=age<.28?'CHARGING…':u.name.toUpperCase(),w=ctx.measureText(text).width+14;ctx.fillStyle='#101b2bf2';ctx.fillRect(a.x-w/2,a.y-81,w,18);ctx.strokeStyle=u.color;ctx.lineWidth=1;ctx.strokeRect(a.x-w/2,a.y-81,w,18);ctx.fillStyle=u.color;ctx.fillText(text,a.x,a.y-68);ctx.restore();
 }
 atmosphere(s){
  const ctx=this.ctx,t=s.fullEffects?(s.ambientTime??s.elapsed):0,cheering=Boolean((s.event?.touchdown||s.event?.score>0||s.event?.safety||s.event?.gain>=20||s.event?.returnYards>=25||s.event?.interception)&&s.phase>=s.motion.contact),energy=cheering?1.9:.24;
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
  if(cheering){
   const age=Math.max(0,s.phase-s.motion.contact),score=s.event?.touchdown||s.event?.score>0,color=(s.event.scoringTeam??s.event.team)===0?'#75dbff':'#ff9b8c';
   ctx.save();ctx.textAlign='center';ctx.font='bold 19px Manrope';
   for(let i=0;i<6;i++){const x=90+i*188,y=104+(i%2)*41-(s.fullEffects?Math.sin(t*4+i)*5:0);ctx.fillStyle='#10223be6';ctx.fillRect(x-48,y-21,96,29);ctx.strokeStyle=color;ctx.strokeRect(x-48,y-21,96,29);ctx.fillStyle=color;ctx.fillText(score?'GOOO!':'ROAR!',x,y)}
   if(s.fullEffects)for(let i=0;i<42;i++){const x=(i*83+age*(i%2?24:-24)+1120)%1120,y=75+(i*31+age*36)%152;ctx.fillStyle=i%3===0?'#ffdf66':color;ctx.save();ctx.translate(x,y);ctx.rotate(age*2+i);ctx.fillRect(-3,-2,6,3);ctx.restore()}
   ctx.restore();
  }
  // Cloth strips ripple with the stadium breeze, even while awaiting a play call.
  [69,219,365,757,900,1050].forEach((x,i)=>{const y=209+(i%2)*13;ctx.fillStyle='#d6d8c8';ctx.fillRect(x,y-33,2,44);for(let strip=0;strip<8;strip++){const lift=Math.sin(t*4+i+strip*.55)*3;ctx.fillStyle=strip%3===1?'#e9e9cb':i<3?'#4597df':'#ee7169';ctx.fillRect(x+2+strip*4,y-32+lift,4,17);}});
  if(s.fullEffects&&!s.paused)for(let i=0;i<9;i++){if(Math.sin(t*2.3+i*21.7)>.995){const x=52+(i*137)%1050,y=98+(i%3)*44;ctx.fillStyle='#fff4d0';ctx.fillRect(x-3,y,7,2);ctx.fillRect(x,y-3,2,7);}}
  ctx.fillStyle='#0b1828';ctx.fillRect(452,25,213,38);ctx.strokeStyle='#55738c';ctx.lineWidth=1;ctx.strokeRect(452,25,213,38);ctx.textAlign='center';ctx.font='bold 9px monospace';ctx.fillStyle='#b5d1e8';ctx.fillText('P O K É  S T A D I U M',560,37);ctx.font='bold 15px monospace';const score=s.event&&s.phase<s.motion.resolveAt?(s.event.scoreBefore??s.score):s.score;ctx.fillStyle='#d0f3e7';ctx.font='bold 10px monospace';ctx.fillText(score?`${(s.names?.[0]||'Kanto Blue').toUpperCase()} ${String(score[0]).padStart(2,'0')} : ${String(score[1]).padStart(2,'0')} ${(s.names?.[1]||'Rocket Red').toUpperCase()}`:'KANTO LEAGUE',560,55,199);
  if(s.celebration)this.victoryScreen(s);
  ctx.fillStyle='#162c39';ctx.fillRect(0,260,1120,13);ctx.fillStyle='#92bdc4';ctx.fillRect(0,268,1120,2);
  // Team benches and the near camera rail give the field a foreground layer.
  ctx.fillStyle='#243a3b';ctx.fillRect(0,593,1120,47);ctx.fillStyle='#779595';ctx.fillRect(0,594,1120,2);
  [42,140,238,834,932,1030].forEach((x,i)=>{ctx.fillStyle=i<3?'#305f8b':'#a04f50';ctx.fillRect(x,606,60,11);ctx.fillStyle='#adc3bb';ctx.fillRect(x,604,60,3);ctx.fillStyle='#182c36';ctx.fillRect(x+4,617,3,8);ctx.fillRect(x+53,617,3,8);});
 }

 draw(s){
  const ctx=this.ctx,{frame,motion,event,phase,elapsed,camera,fullEffects,shake,particles,replaying,paused,waiting,selectedPlay,selectedDefense,squads}=s;
  if(!frame)return;this.sprites?.preload(frame.players.map(player=>player.p));const team=event?.team??0,P=(x,y)=>project(x,y,camera,team),line=(a,b,color,width=1)=>{ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke()},quad=(yard1,yard2,color)=>{let a=P(54,yard1),b=P(586,yard1),c=P(586,yard2),d=P(54,yard2);ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.lineTo(c.x,c.y);ctx.lineTo(d.x,d.y);ctx.closePath();ctx.fill()};
  ctx.setTransform(this.scale,0,0,this.scale,0,0);ctx.clearRect(0,0,1120,640);if(s.battle&&battles){battles.draw(ctx,s.battle,this.sprites,this.images,fullEffects);if(paused){ctx.fillStyle='#091323aa';ctx.fillRect(0,0,1120,640);ctx.fillStyle='#ffdf61';ctx.font='bold 28px monospace';ctx.textAlign='center';ctx.fillText('RUMBLE PAUSED',560,335)}return}ctx.save();if(fullEffects&&shake>.1)ctx.translate(Math.sin(elapsed*103)*shake,Math.cos(elapsed*81)*shake*.6);
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
  [-7,107].forEach(yard=>{const p=P(320,yard),g=goalpostSize(yard===107&&(event?.extraPoint||s.footballMode==='pat'));ctx.strokeStyle='#ffe37b';ctx.lineWidth=g.line;ctx.beginPath();ctx.moveTo(p.x,p.y+g.stem);ctx.lineTo(p.x,p.y-g.crossbar);ctx.moveTo(p.x-g.halfWidth,p.y-g.crossbar);ctx.lineTo(p.x+g.halfWidth,p.y-g.crossbar);ctx.moveTo(p.x-g.halfWidth,p.y-g.crossbar);ctx.lineTo(p.x-g.halfWidth,p.y-g.height);ctx.moveTo(p.x+g.halfWidth,p.y-g.crossbar);ctx.lineTo(p.x+g.halfWidth,p.y-g.height);ctx.stroke()});
  if(waiting){const routes=team===1?root.PokeMotion.defenseRoutes(selectedDefense||'gap',start,squads[0]):root.PokeMotion.routes(selectedPlay,start,squads[0],event?.target);routes.forEach(route=>{ctx.setLineDash(route.primary?[]:[6,6]);ctx.strokeStyle=route.primary?'#f5dd7b':'#e0edc29c';ctx.lineWidth=route.primary?3:2;ctx.beginPath();route.points.forEach((p,i)=>{const q=P(p.x,p.y);if(i)ctx.lineTo(q.x,q.y);else ctx.moveTo(q.x,q.y)});ctx.stroke();ctx.setLineDash([]);const end=route.points.at(-1),prev=route.points.at(-2),a=P(end.x,end.y),b=P(prev.x,prev.y),angle=Math.atan2(a.y-b.y,a.x-b.x);ctx.fillStyle=route.primary?'#f5dd7b':'#e0edc2';ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(a.x-11*Math.cos(angle-.5),a.y-11*Math.sin(angle-.5));ctx.lineTo(a.x-11*Math.cos(angle+.5),a.y-11*Math.sin(angle+.5));ctx.closePath();ctx.fill()})}
  for(const particle of particles){const p=P(particle.x,particle.y);ctx.globalAlpha=clamp(particle.life/particle.max,0,1);ctx.fillStyle=particle.color;ctx.save();ctx.translate(p.x,p.y);if(particle.kind==='confetti')ctx.rotate(particle.life*7+particle.x);ctx.fillRect(-particle.size/2,-particle.size/2,particle.size,particle.kind==='confetti'?particle.size/2:particle.size);ctx.restore()}ctx.globalAlpha=1;
  frame.players.slice().sort((a,b)=>a.tx-b.tx).forEach(player=>{
    const p=P(player.tx,player.ty);if(p.x<-65||p.x>1185)return;const size=86+clamp((player.tx-54)/532,0,1)*14,bob=fullEffects&&player.move?Math.abs(Math.sin(player.stride))*3:0,down=fullEffects?player.fall:0;
    const cue=player.power;if(cue)this.powerGround(p,cue,player.powerAge,fullEffects);
    ctx.fillStyle='#0d26364d';ctx.beginPath();ctx.ellipse(p.x+8,p.y+11,down?25:19,6,0,0,7);ctx.fill();
    ctx.fillStyle=player.team===0?'#72d0efbb':'#ef8b74bb';ctx.beginPath();ctx.ellipse(p.x,p.y+8,down?21:16,5,0,0,7);ctx.fill();if(player.carrier&&!motion.kick){ctx.strokeStyle='#f0e785';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(p.x,p.y+8,22+Math.sin(elapsed*8),7,0,0,7);ctx.stroke()}
    if(fullEffects&&player.move&&!down){ctx.fillStyle=player.team===0?'#b2dce1':'#edb095';const feet=Math.sin(player.stride)*5;ctx.fillRect(p.x-9+feet,p.y+4,5,4);ctx.fillRect(p.x+5-feet,p.y+6,5,4)}
    ctx.save();ctx.translate(p.x,p.y-bob-(fullEffects?player.jump:0));const rock=fullEffects&&player.move?Math.sin(player.stride)*.065:0;ctx.rotate(rock+player.lean+down*(player.pose==='dive'||player.pose==='miss'?-.5:1)*Math.PI/2);if(fullEffects&&player.pose==='throw')ctx.rotate(team===0?-.18:.18);if(fullEffects&&player.pose==='celebrate')ctx.rotate(Math.sin(elapsed*9)*.12);const image=this.images[player.p.id];ctx.imageSmoothingEnabled=false;ctx.shadowColor='#0a1529';ctx.shadowBlur=2;ctx.shadowOffsetY=1;if(player.pose==='dance')this.dancer(ctx,player,size,s);else if(!this.sprites?.draw(ctx,player,size,s.ambientTime??elapsed,motion,event,phase,fullEffects)&&image?.complete&&image.naturalWidth)ctx.drawImage(image,-size/2,-size+12,size,size);ctx.restore();
    if(player.carrier||player.power||player.p.id===event?.defender||waiting&&['QB','WR','HB','TE'].includes(player.p.pos)){const text=player.p.name.toUpperCase()+(waiting?' · '+player.p.pos:'');ctx.font='bold 11px monospace';ctx.textAlign='center';const width=ctx.measureText(text).width+8,roleOffset=waiting?(player.p.pos==='QB'?-18:player.p.pos==='HB'?14:0):0;ctx.fillStyle='#122a20ee';ctx.fillRect(p.x-width/2,p.y-size-10+roleOffset-(fullEffects?player.jump:0)-bob,width,17);ctx.fillStyle=player.carrier?'#efeea6':'#f5c8b3';ctx.fillText(text,p.x,p.y-size+roleOffset-(fullEffects?player.jump:0)-bob)}
  });
  // Paired bodies share a contact point; short shoulder impacts and cleat dust show the struggle.
  if(fullEffects)for(const contact of frame.engagements||[]){const p=P(contact.x,contact.y),beat=Math.sin((phase-motion.snap)*18+contact.ids[0]);ctx.save();ctx.strokeStyle='#fff0b6';ctx.lineWidth=2;ctx.globalAlpha=contact.stage==='engage'?.8:Math.max(0,beat)*.45;ctx.beginPath();for(const sign of [-1,1]){ctx.moveTo(p.x+sign*4,p.y-29);ctx.lineTo(p.x+sign*10,p.y-36);ctx.moveTo(p.x+sign*6,p.y-25);ctx.lineTo(p.x+sign*15,p.y-24)}ctx.stroke();ctx.globalAlpha=.5;ctx.fillStyle='#c1bf8f';for(let n=0;n<3;n++){const v=((phase*4+n/3+contact.ids[0]*.1)%1);ctx.fillRect(p.x-12+v*24,p.y+5-v*6,4-v*2,2)}ctx.restore();}
  // Draw the elemental strike above the entire lineup so bodies cannot hide it.
  for(const actor of frame.players.filter(p=>p.power))this.powerStrike(actor,s,P);
  const ball=frame.ball;if(ball.visible){const p=P(ball.x,ball.y),lift=ball.arc*.75;ctx.fillStyle='#15341f6b';ctx.beginPath();ctx.ellipse(p.x,p.y+7,5+Math.max(0,lift)*.025,3,0,0,7);ctx.fill();ctx.save();ctx.translate(p.x,p.y-12-lift);ctx.rotate(ball.spin);ctx.fillStyle='#9a522d';ctx.strokeStyle='#ffe5b2';ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(0,0,5,7,0,0,7);ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(-2,-3);ctx.lineTo(2,3);ctx.stroke();ctx.restore()}
  if(frame.impact&&phase>=motion.contact&&phase<motion.contact+.3&&fullEffects){const c=P(frame.carrier.x,frame.carrier.y),t=clamp((phase-motion.contact)/.3,0,1);ctx.strokeStyle=`rgba(249,234,168,${1-t})`;ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(c.x,c.y,15+t*28,9+t*15,0,0,7);ctx.stroke()}
  ctx.restore();if(replaying){ctx.fillStyle='#14291de8';ctx.fillRect(455,243,210,23);ctx.fillStyle='#e5f894';ctx.font='bold 12px monospace';ctx.textAlign='center';ctx.fillText('↺ HIGHLIGHT REPLAY',560,259)}if(paused){ctx.fillStyle='#0e211baa';ctx.fillRect(0,0,1120,640);ctx.fillStyle='#d8f474';ctx.font='bold 28px monospace';ctx.textAlign='center';ctx.fillText('BROADCAST PAUSED',560,330)}
 }
}
root.PokeStadium={Stadium,project,cameraFor,goalpostSize};if(typeof module!=='undefined')module.exports=root.PokeStadium;
})(typeof window!=='undefined'?window:globalThis);
