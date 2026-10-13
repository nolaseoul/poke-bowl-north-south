/* Original quarter-break arena. Its own deterministic timeline never consumes football RNG. */
(function(root){
'use strict';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),DURATION=6.4,KO_AT=4.7;
function hash(text){let n=2166136261;for(const c of String(text))n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0}
function random(seed){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}}
function rosterKey(teams,perspective=0){return (perspective?[teams[1],teams[0]]:teams).map(t=>t.map(p=>p.id).sort((a,b)=>a-b).join(',')).join('|')}
function triggerClock(teams,quarter,perspective=0){return 46+hash(rosterKey(teams,perspective)+':quarter:'+quarter)%50}
function shouldStart(e,teams,seen,perspective=0){return Boolean(e&&e.quarter>=1&&e.quarter<=4&&!seen.has(e.quarter)&&!e.presentation&&!e.extraPoint&&!e.conversion&&['run','pass','sack','punt','kick','kickoff'].includes(e.type)&&e.clock<=triggerClock(teams,e.quarter,perspective))}
function create(e,teams,perspective=0){
 const canonical=perspective?[teams[1],teams[0]]:teams,score=perspective?[...e.scoreBefore].reverse():e.scoreBefore;
 const seed=hash([rosterKey(teams,perspective),e.quarter,e.clock,e.team^perspective,e.start,e.target,e.defender,e.gain,...score].join(':')),r=random(seed);
 const first=canonical[0].slice().sort((a,b)=>a.id-b.id),left=first[Math.floor(r()*first.length)],second=canonical[1].filter(p=>p.id!==left.id).sort((a,b)=>a.id-b.id),right=second[Math.floor(r()*second.length)];
 const selected=[left,right],winner=Math.floor(r()*2)^perspective,fighters=(perspective?[right,left]:selected).map((p,team)=>({p,team}));
 const attackers=[winner,1-winner,winner,1-winner,winner,winner],times=[1.15,1.85,2.55,3.25,3.95,KO_AT],damage=[25,27,28,26,24,23];
 return{quarter:e.quarter,seed,fighters,winner,elapsed:0,snap:0,release:0,contact:0,duration:DURATION,attacks:times.map((at,i)=>({at,attacker:attackers[i],target:1-attackers[i],damage:damage[i],ultimate:i>=4})),koAt:KO_AT};
}
function project(x,y){return{x:560+(x-y)*72,y:398+(x+y)*35}}
function frame(b,time=b.elapsed,animated=true){
 const t=clamp(time,0,DURATION),hp=[100,100];for(const a of b.attacks)if(t>=a.at)hp[a.target]=Math.max(0,hp[a.target]-a.damage);
 const current=b.attacks.find(a=>t>=a.at-.36&&t<a.at+.35),last=b.attacks.filter(a=>t>=a.at).at(-1),ko=t>=KO_AT;
 const fighters=b.fighters.map((fighter,i)=>{
  let x=i===0?-2:2,y=i===0?1:-1,jump=0;
  if(animated){const drift=Math.sin(t*5+i*Math.PI)*.13;x+=drift;y-=drift;if(current){const age=t-current.at;if(current.attacker===i){const lunge=Math.max(0,1-Math.abs(age+.015)/.24)*(current.ultimate?.38:.85);x+=(i===0?1:-1)*lunge;y+=(i===0?-1:1)*lunge;jump=Math.max(0,Math.sin((age+.24)/.48*Math.PI))*7}else if(age>=0){x+=(i===0?-1:1)*Math.sin(clamp(age/.35,0,1)*Math.PI)*.18}}}
  const point=project(x,y),attacking=current?.attacker===i,hit=current?.target===i&&t>=current.at;
  return{...fighter,...point,hp:hp[i],visible:!ko||i===b.winner,pose:ko?'celebrate':hit?'down':attacking?(current.ultimate?'ultimate':'throw'):'run',jump,move:ko?0:1,stride:t*12,tx:point.x,ty:point.y,formationFacing:i===0?7:3,powerFacing:i===0?7:3,actionFrame:ko?.5:attacking?clamp((t-current.at+.36)/.7,0,1):undefined};
 });
 return{time:t,hp,fighters,current,last,ko,stage:ko?'K.O.':t<.8?'FACE OFF':current?.ultimate?'ULTIMATE CLASH':'BATTLE!',winner:b.winner,progress:t/DURATION};
}
function cuesBetween(b,from,to){const cues=[],add=(at,kind)=>{if(from<at&&to>=at)cues.push({at,kind})};for(const a of b.attacks){add(a.at-.32,'charge');add(a.at,a.ultimate?'ultimate':'hit')}add(KO_AT,'battleKO');return cues.sort((a,b)=>a.at-b.at)}
function diamond(ctx,x,y,w,h,color){ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(x,y-h);ctx.lineTo(x+w,y);ctx.lineTo(x,y+h);ctx.lineTo(x-w,y);ctx.closePath();ctx.fill()}
function draw(ctx,b,sprites,images,animated=true){
 const f=frame(b,b.elapsed,animated),t=f.time,loser=1-b.winner,signature=p=>root.PokeSim?.ultimates.signature(p.id)||{color:'#ffdf56',name:'POWER STRIKE',element:'normal'};
 ctx.save();ctx.fillStyle='#091323';ctx.fillRect(0,0,1120,640);
 // A raised diamond arena, viewed from above; tiles and edge lights establish depth.
 for(let i=0;i<45;i++){ctx.fillStyle=i%3?'#235274':'#4d2f63';const x=(i*137+b.seed%113)%1120,y=(i*71)%640;ctx.fillRect(x,y,3,3)}
 diamond(ctx,560,414,505,211,'#0b0c1b');diamond(ctx,560,399,505,211,'#426c82');diamond(ctx,560,398,492,199,'#233b50');
 for(let x=-3;x<3;x++)for(let y=-3;y<3;y++){const p=project(x+.5,y+.5);diamond(ctx,p.x,p.y,70,33,(x+y)%2?'#263e53':'#2d465a')}
 ctx.strokeStyle='#5a9da3';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(560,199);ctx.lineTo(1052,398);ctx.lineTo(560,597);ctx.lineTo(68,398);ctx.closePath();ctx.stroke();
 for(let i=0;i<12;i++){const a=project(-5+i*.9,-5),c=project(-5,5-i*.9);ctx.fillStyle=i%2?'#ffcf54':'#72dcf2';ctx.fillRect(a.x-4,a.y-2,8,5);ctx.fillRect(c.x-4,c.y-2,8,5)}
 ctx.globalAlpha=.16;diamond(ctx,560,398,215,96,'#8bd8df');ctx.globalAlpha=1;
 const impact=f.current&&t>=f.current.at&&t<f.current.at+.28,shake=animated&&impact?Math.sin(t*73)*3:0;ctx.translate(shake,0);
 if(f.ko){const origin=f.fighters[loser],age=t-KO_AT,r=random(b.seed^7021),colors=['#d72a4c','#a01938','#f24760',signature(origin.p).color,'#ffe9bd'];
  // Stylized red pixel splatter and colored sprite shards; no anatomical artwork.
  for(let i=0;i<50;i++){const angle=r()*Math.PI*2,force=65+r()*170,size=3+r()*7,travel=animated?Math.min(age,.85):.5;const x=origin.x+Math.cos(angle)*force*travel,y=origin.y+Math.sin(angle)*force*travel*.48;ctx.globalAlpha=i<24?.65:clamp(1-(age-.45)/1.2,0,1);ctx.fillStyle=colors[i%colors.length];ctx.fillRect(x-size/2,y-(animated&&i>=24?Math.sin(Math.min(1,age/1.1)*Math.PI)*65:0),size,size*(i<24?.45:1))}
  if(animated&&age<.9){ctx.globalAlpha=(1-age/.9)*.65;ctx.strokeStyle='#ffdf68';ctx.lineWidth=6;ctx.beginPath();ctx.ellipse(origin.x,origin.y-20,18+age*120,12+age*65,0,0,Math.PI*2);ctx.stroke();for(let i=0;i<7;i++){ctx.fillStyle=i%2?'#506075':'#8898a8';ctx.globalAlpha=(1-age/.9)*.5;ctx.beginPath();ctx.arc(origin.x+Math.cos(i)*age*60,origin.y-25-age*55+Math.sin(i*3)*14,10+age*19,0,Math.PI*2);ctx.fill()}}
  ctx.globalAlpha=1;
 }
 if(f.current){const a=f.fighters[f.current.attacker],target=f.fighters[f.current.target],u=signature(a.p),age=t-f.current.at;ctx.strokeStyle=u.color;ctx.lineWidth=3;ctx.globalAlpha=.65;
  ctx.beginPath();ctx.ellipse(a.x,a.y+7,37+(age+.36)*20,13,0,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;
  if(age>=0){ctx.strokeStyle=u.color;ctx.lineWidth=f.current.ultimate?13:5;ctx.beginPath();ctx.moveTo(a.x,a.y-58);ctx.quadraticCurveTo(560,310,target.x,target.y-45);ctx.stroke();ctx.strokeStyle='#fff1b2';ctx.lineWidth=2;ctx.stroke();for(let i=0;i<8;i++){const angle=i*Math.PI/4,reach=animated?15+age*90:25;ctx.fillStyle=i%2?u.color:'#fff3c4';ctx.fillRect(target.x+Math.cos(angle)*reach,target.y-50+Math.sin(angle)*reach*.7,6,6)}}
 }
 sprites?.preload(b.fighters.map(a=>a.p));
 for(const actor of f.fighters.slice().sort((a,c)=>a.y-c.y)){if(!actor.visible)continue;const color=actor.team===0?'#70deff':'#ff8e9b';ctx.fillStyle='#02091870';ctx.beginPath();ctx.ellipse(actor.x,actor.y+10,48,14,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle=color;ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(actor.x,actor.y+7,39,12,0,0,Math.PI*2);ctx.stroke();ctx.save();ctx.translate(actor.x,actor.y-actor.jump);ctx.imageSmoothingEnabled=false;
  if(!sprites?.draw(ctx,actor,160,t,b,{team:0},t+1,animated)){const img=images[actor.p.id];if(img?.complete&&img.naturalWidth)ctx.drawImage(img,-80,-140,160,160)}ctx.restore();
  if(f.ko&&actor.team===b.winner){ctx.fillStyle='#ffdf56';ctx.font='bold 26px monospace';ctx.textAlign='center';ctx.fillText('★ WINNER ★',actor.x,actor.y-166)}
 }
 if(impact&&animated){const p=f.fighters[f.current.target],age=t-f.current.at;ctx.strokeStyle='#fff0b0';ctx.lineWidth=4;ctx.beginPath();for(let i=0;i<10;i++){const a=i*Math.PI/5,r=22+age*80;ctx.moveTo(p.x+Math.cos(a)*r,p.y-60+Math.sin(a)*r);ctx.lineTo(p.x+Math.cos(a)*(r+16),p.y-60+Math.sin(a)*(r+16))}ctx.stroke()}
 ctx.restore();return f;
}
root.PokeBattle={DURATION,KO_AT,hash,triggerClock,shouldStart,create,project,frame,cuesBetween,draw};if(typeof module!=='undefined')module.exports=root.PokeBattle;
})(typeof window!=='undefined'?window:globalThis);
