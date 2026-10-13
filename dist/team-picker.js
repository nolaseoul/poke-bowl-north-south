(function(){
 'use strict';
 const $=id=>document.getElementById(id),dialog=$('teamPicker'),clubs=PokeTeams.clubs,escape=PokeTeamName.html;
 let step='home',home='saved',rival='random',quick=[],saved=[],savedName='',busy=false;
 try{const value=localStorage.getItem('poke-bowl-rival-v1');if(PokeTeams.valid(value))rival=value}catch{}
 function reroll(){quick=new PokeDraft.Draft().autoFill().map(p=>p.id)}
 function ownIds(){return home==='saved'?saved:home==='quick'?quick:PokeTeams.roster(home).map(p=>p.id)}
 function ownName(){return home==='saved'?savedName:home==='quick'?'Kanto All-Stars':PokeTeams.name(home)}
 function stats(ids){return new PokeDraft.Draft(ids).summary()}
 function stars(n){return '★'.repeat(n)+'☆'.repeat(5-n)}
 function art(ids){return ids.map((id,i)=>`<img src="assets/portraits/${id}.png" alt="${escape(PokeDraft.pool.find(p=>p.id===id).name)}" ${i===1?'class="captain"':''} width="112" height="112">`).join('')}
 function card(id,title,caption,ids,color,icon,meta,club=null){
  const active=(step==='home'?home:rival)===id,summary=stats(ids);
  return `<button class="club-card ${active?'chosen':''}" data-club="${id}" style="--club:${color}" aria-pressed="${active}" aria-label="${escape(title)}, ${summary.ovr} overall${club?', leader '+escape(club.leader):''}"><div class="club-card-top"><span class="club-badge" aria-hidden="true">${icon}</span><span>${escape(caption)}</span><b>${summary.ovr}<small>OVR</small></b></div><h3>${escape(title)}</h3><div class="club-portraits">${art(club?club.anchors.map(a=>a[1]):[ids[1],ids[0],ids[4]])}</div><div class="club-rating"><span>OFF <b>${summary.offense}</b></span><span>DEF <b>${summary.defense}</b></span>${club?`<span class="club-stars" aria-label="${club.stars} of 5 difficulty">${stars(club.stars)}</span>`:'<span>22 STARTERS</span>'}</div><div class="club-card-foot"><span>${escape(meta)}</span><span class="club-check" aria-hidden="true">${active?'✓':'＋'}</span></div></button>`;
 }
 function render(){
  const isHome=step==='home';$('teamPickerTitle').textContent=isHome?'Choose your team.':'Choose your rival.';
  $('teamPickerSubtitle').textContent=isHome?'Bring your own 22, roll the dice, or take a gym club to the big league.':'Eight gyms. Eight football identities. Who is getting cooked today?';
  $('teamPickerStep').textContent=isHome?'01 / YOUR TEAM':'02 / CPU OPPONENT';
  $('teamStepHome').classList.toggle('current',isHome);$('teamStepRival').classList.toggle('current',!isHome);
  $('teamStepHome').setAttribute('aria-current',isHome?'step':'false');$('teamStepRival').setAttribute('aria-current',!isHome?'step':'false');
  $('teamPickerReroll').hidden=!isHome;$('teamPickerBack').textContent=isHome?'CANCEL':'← YOUR TEAM';
  let html='';
  if(isHome){html+=card('saved',savedName,'YOUR SAVED LINEUP',saved,'#84d6e8','◒','PICK UP WHERE YOU LEFT OFF');html+=card('quick','Kanto All-Stars','QUICK DRAFT',quick,'#f5d379','↻','RANDOMIZED BY POSITION FIT')}
  else{const ps=new PokeDraft.Draft(ownIds()).opponent(()=>.4);html+=card('random','Rocket Red','WILD CARD · SAMPLE',ps.map(p=>p.id),'#f0a49e','?','NEW ROSTER EVERY MATCH')}
  html+=clubs.map(c=>card(c.id,c.city+' '+c.name,'COACH '+c.leader.toUpperCase(),PokeTeams.roster(c.id).map(p=>p.id),c.color,c.icon,c.tag,c)).join('');
  $('teamPickerCards').innerHTML=html;
  $('teamPickerCards').querySelectorAll('[data-club]').forEach(button=>button.onclick=()=>{if(isHome)home=button.dataset.club;else rival=button.dataset.club;render();$('teamPickerCards').querySelector(`[data-club="${button.dataset.club}"]`).focus({preventScroll:true})});
  const c=PokeTeams.get(isHome?home:rival),ids=isHome?ownIds():rival==='random'?new PokeDraft.Draft(ownIds()).opponent(()=>.4).map(p=>p.id):PokeTeams.roster(rival).map(p=>p.id),summary=stats(ids);
  $('teamPickerSelected').textContent=isHome?ownName():PokeTeams.name(rival);
  $('teamPickerDetail').textContent=c?c.blurb:isHome?'Your play calls. Their highlight reel.':'Rocket Red drafts a fresh team from the Pokémon you leave behind.';
  $('teamPickerMatchup').textContent=isHome?`${summary.ovr} OVR · 11 OFFENSE / 11 DEFENSE`:`${ownName()} vs ${PokeTeams.name(rival)}`;
  $('teamPickerNext').textContent=isHome?'CHOOSE RIVAL →':'KICK OFF →';$('teamPickerNext').disabled=busy;
  $('teamPickerRoster').innerHTML=PokeDraft.slots.map(slot=>{const p=PokeDraft.player(ids[slot.index],slot.pos);return `<div><img src="assets/portraits/${p.id}.png" alt="" loading="lazy"><span>${slot.label}<b>${p.name}</b></span><strong>${p.ovr}</strong></div>`}).join('');
  $('teamPickerRosterSummary').textContent=!isHome&&rival==='random'?'SAMPLE STARTERS · REDRAFTED AT KICKOFF':`SCOUT THE STARTING 22 · OFF ${summary.offense} / DEF ${summary.defense}`;
 }
 function apply(){PokeDraftUI.load(ownIds(),ownName())}
 function open(start='home'){
  saved=new PokeDraft.Draft(PokeDraftUI.ids()).autoFill().map(p=>p.id);savedName=PokeDraftUI.name();home='saved';reroll();step=start;busy=false;render();dialog.showModal();$('teamPickerTitle').focus();
 }
 $('chooseTeams').onclick=()=>open();
 $('teamPickerClose').onclick=()=>dialog.close();
 $('teamPickerBack').onclick=()=>{if(step==='home')dialog.close();else{step='home';render();dialog.scrollTop=0;$('teamPickerTitle').focus()}};
 $('teamPickerReroll').onclick=()=>{reroll();home='quick';render()};
 $('teamStepHome').onclick=()=>{step='home';render()};
 $('teamPickerCustomize').onclick=()=>{apply();dialog.close();PokeDraftUI.show();$('draftTitle').focus()};
 $('teamPickerNext').onclick=async()=>{
  if(busy)return;
  if(step==='home'){step='rival';render();dialog.scrollTop=0;$('teamPickerTitle').focus();return}
  busy=true;render();apply();try{localStorage.setItem('poke-bowl-rival-v1',rival)}catch{}
  dialog.close();const started=await PokeDraftUI.kickoff(rival);busy=false;
  if(!started){$('draftNotice').textContent='Choose an account or guest play, then choose your rival and kick off.'}
 };
 window.PokeTeamPicker={open};
})();
