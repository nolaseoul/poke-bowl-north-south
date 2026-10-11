/* Gym-inspired clubs. Ratings are real position projections, never decorative numbers. */
(function(root){
 'use strict';
 const draft=typeof module!=='undefined'?require('./draft.js'):root.PokeDraft;
 const clubs=[
  {id:'pewter',city:'Pewter',name:'Boulders',leader:'Brock',type:'rock',color:'#d6b589',icon:'◆',stars:1,target:62,style:'ground',tag:'GROUND & POUND',blurb:'Heavy fronts. Hard yards. Bring a helmet.',anchors:[[12,95],[7,76],[5,74]]},
  {id:'cerulean',city:'Cerulean',name:'Current',leader:'Misty',type:'water',color:'#79d9f4',icon:'≈',stars:2,target:66,style:'balanced',tag:'BALANCED ATTACK',blurb:'Go with the flow. Then flood the end zone.',anchors:[[0,121],[18,120],[4,55]]},
  {id:'vermilion',city:'Vermilion',name:'Voltage',leader:'Lt. Surge',type:'electric',color:'#f9d669',icon:'ϟ',stars:2,target:70,style:'air',tag:'AIR RAID',blurb:'Lightning routes. No safe coverage.',anchors:[[0,26],[1,101],[14,125]]},
  {id:'celadon',city:'Celadon',name:'Blossoms',leader:'Erika',type:'grass',color:'#aada91',icon:'✿',stars:3,target:73,style:'trick',tag:'TRICK PLAYS',blurb:'Look for the fake. It is already behind you.',anchors:[[0,45],[3,71],[16,114]]},
  {id:'fuchsia',city:'Fuchsia',name:'Venom',leader:'Koga',type:'poison',color:'#cd9cf3',icon:'☠',stars:3,target:76,style:'blitz',tag:'PRESSURE DEFENSE',blurb:'The pocket closes before the smoke clears.',anchors:[[0,110],[7,89],[18,49]]},
  {id:'saffron',city:'Saffron',name:'Psychics',leader:'Sabrina',type:'psychic',color:'#f1a5d0',icon:'◎',stars:4,target:79,style:'trick',tag:'MIND GAMES',blurb:'They called your bluff three downs ago.',anchors:[[0,65],[3,122],[16,97]]},
  {id:'cinnabar',city:'Cinnabar',name:'Flare',leader:'Blaine',type:'fire',color:'#ffad7a',icon:'♨',stars:4,target:82,style:'air',tag:'VERTICAL OFFENSE',blurb:'Deep shots. Hot hands. Scorched turf.',anchors:[[4,59],[1,78],[0,38]]},
  {id:'viridian',city:'Viridian',name:'Titans',leader:'Giovanni',type:'ground',color:'#c2bf9e',icon:'▲',stars:5,target:85,style:'ground',tag:'POWER FOOTBALL',blurb:'The final boss owns the line of scrimmage.',anchors:[[5,112],[3,34],[11,31]]}
 ];
 const byId=new Map(clubs.map(c=>[c.id,c]));
 const rosters=new Map();
 function get(id){return byId.get(id)||null}
 function valid(id){return id==='random'||byId.has(id)}
 function roster(id){
  const club=get(id);if(!club)throw Error('Choose a valid opponent team.');
  if(!rosters.has(id)){
   const ids=Array(22).fill(null),used=new Set();
   for(const [slot,pokemon] of club.anchors){ids[slot]=pokemon;used.add(pokemon)}
   for(const slot of draft.slots){
    if(ids[slot.index]!==null)continue;
    const candidates=draft.pool.filter(p=>!used.has(p.id)).map(p=>({id:p.id,score:Math.abs(draft.player(p.id,slot.pos).ovr-club.target)*1.3-(p.types.includes(club.type)?13:0)}));
    candidates.sort((a,b)=>a.score-b.score||a.id-b.id);ids[slot.index]=candidates[0].id;used.add(candidates[0].id);
   }
   rosters.set(id,ids);
  }
  return new draft.Draft(rosters.get(id)).roster();
 }
 function summary(id){const ps=roster(id);return{ovr:draft.mean(ps),offense:draft.mean(ps.slice(0,11)),defense:draft.mean(ps.slice(11))}}
 function name(id){const c=get(id);return c?c.city+' '+c.name:'Rocket Red'}
 function options(id){return{cpuStyle:get(id)?.style||null}}
 root.PokeTeams={clubs,get,valid,roster,summary,name,options};if(typeof module!=='undefined')module.exports=root.PokeTeams;
})(typeof window!=='undefined'?window:globalThis);
