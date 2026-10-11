(function(){
  'use strict';
  const $=id=>document.getElementById(id),{pool,slots,player,Draft}=PokeDraft;
  const teamInput=$('teamName');teamInput.value=PokeTeamName.load(localStorage);
  function teamIdentity(commit=false){const clean=PokeTeamName.clean(teamInput.value);if(commit)teamInput.value=PokeTeamName.save(localStorage,clean);else PokeTeamName.save(localStorage,clean);$('teamNameCount').textContent=Array.from(clean).length+' / '+PokeTeamName.limit;$('draftTeamName').textContent=PokeTeamName.name(clean);}
  teamInput.addEventListener('input',()=>teamIdentity());teamInput.addEventListener('blur',()=>teamIdentity(true));teamIdentity();
  const storageKey='poke-bowl-draft-v1';
  let saved=null;
  try{saved=JSON.parse(localStorage.getItem(storageKey))}catch{}
  const draft=new Draft(saved);
  const autoPicked=draft.summary().count<22;if(autoPicked)draft.autoFill();
  let selected=Math.max(0,draft.ids.indexOf(null)),draftSide=slots[selected].side,limit=24,hasMatch=false,undoClear=null;
  const titles={QB:'Quarterback',WR:'Wide receiver',TE:'Tight end',HB:'Halfback',FB:'Fullback',LT:'Left tackle',LG:'Left guard',C:'Center',RG:'Right guard',RT:'Right tackle',DE:'Defensive end',NT:'Nose tackle',OLB:'Outside linebacker',ILB:'Inside linebacker',CB:'Cornerback',S:'Safety'};
  const hints={QB:'Find the arm that leads your offense.',WR:'Speed creates space. Hands finish the play.',TE:'A reliable target who can hold a block.',HB:'Find the vision, burst, and ball security to move the chains.',FB:'Lead the way through contact.',LT:'Protect the pocket from the edge.',LG:'Win the line of scrimmage.',C:'Every play starts with a clean snap.',RG:'Open a lane up the middle.',RT:'Keep your quarterback standing.',DE:'Pressure the pocket. Finish the tackle.',NT:'An anchor at the heart of your defense.',OLB:'Rush, tackle, or drop into coverage.',ILB:'Read the play and shut down the middle.',CB:'Stay with the receiver. Make a play on the ball.',S:'Read the whole field. Be the last line of defense.'};
  const types=[...new Set(pool.flatMap(p=>p.types))].sort();
  types.forEach(type=>{const option=document.createElement('option');option.value=type;option.textContent=type[0].toUpperCase()+type.slice(1);$('draftType').append(option)});
  function save(){try{localStorage.setItem(storageKey,JSON.stringify(draft.ids))}catch{}}
  function announce(text){$('draftNotice').textContent=text;}
  function renderSlots(){
    $('draftSlots').innerHTML=slots.filter(s=>s.side===draftSide).map(slot=>{
      const p=draft.ids[slot.index]===null?null:player(draft.ids[slot.index],slot.pos);
      return `<button class="draft-slot ${selected===slot.index?'selected':''} ${p?'filled':''}" data-slot="${slot.index}" aria-pressed="${selected===slot.index}" aria-label="${slot.label}: ${p?p.name+', '+p.ovr+' overall':'empty'}"><span class="slot-position">${slot.label}</span>${p?`<img src="assets/portraits/${p.id}.png" alt=""><span class="slot-name">${p.name}</span><b>${p.ovr}</b>`:'<span class="empty-pick">＋ Choose a Pokémon</span>'}</button>`;
    }).join('');
    $('draftSlots').querySelectorAll('[data-slot]').forEach(button=>button.onclick=()=>{selected=+button.dataset.slot;limit=24;renderSlots();renderMarket()});
    document.querySelectorAll('[data-draft-side]').forEach(button=>{const active=button.dataset.draftSide===draftSide;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active))});
  }
  function renderSummary(){
    const summary=draft.summary();
    $('draftCount').innerHTML=summary.count+'<span>/22</span>';
    $('offenseOvr').textContent=summary.offense||'—';$('defenseOvr').textContent=summary.defense||'—';
    $('offenseCount').textContent=draft.ids.slice(0,11).filter(id=>id!==null).length+'/11';
    $('defenseCount').textContent=draft.ids.slice(11).filter(id=>id!==null).length+'/11';
    $('draftReady').textContent=summary.count===22?'Your 22 are ready. Time to meet your rival.':`${22-summary.count} starting position${summary.count===21?'':'s'} to fill.`;
    $('draftLaunch').disabled=summary.count!==22;
    $('draftLaunch').innerHTML=summary.count===22?'LOCK LINEUP & KICK OFF <span>→</span>':`FILL ${22-summary.count} MORE POSITION${summary.count===21?'':'S'} <span>→</span>`;
    $('clearDraft').textContent=undoClear?'UNDO CLEAR':'CLEAR LINEUP';
    $('autoDraft').textContent=summary.count===22?'RE-DRAFT ↻':'AUTO DRAFT ↗';
  }
  function renderMarket(){
    const slot=slots[selected],current=draft.ids[selected]===null?null:player(draft.ids[selected],slot.pos);
    $('slotEyebrow').textContent=`SCOUTING ${slot.label} · ${slot.side.toUpperCase()}`;
    $('positionTitle').textContent=titles[slot.pos];$('positionHint').textContent=hints[slot.pos];
    $('currentPick').innerHTML=current?`<img src="assets/portraits/${current.id}.png" alt=""><div><small>YOUR STARTER</small><b>${current.name}</b><span>${current.ovr} OVR <button id="removePick" aria-label="Remove ${current.name} from ${slot.label}">Remove</button></span></div>`:'<span class="open-spot">OPEN POSITION<br><b>Make your pick ↓</b></span>';
    if(current)$('removePick').onclick=()=>{draft.remove(selected);undoClear=null;save();render();announce(`${slot.label} is open. Choose a new starter.`)};
    const query=$('draftSearch').value.trim().toLowerCase().replace(/^#/,'');
    const type=$('draftType').value,sort=$('draftSort').value;
    let candidates=pool.filter(p=>(type==='all'||p.types.includes(type))&&(!query||p.name.toLowerCase().includes(query)||String(p.id)===query)).map(p=>player(p.id,slot.pos));
    candidates.sort((a,b)=>sort==='number'?a.id-b.id:sort==='speed'?b.ratings.Speed-a.ratings.Speed||b.ovr-a.ovr:sort==='strength'?b.ratings.Strength-a.ratings.Strength||b.ovr-a.ovr:b.ovr-a.ovr||a.id-b.id);
    $('prospectCount').textContent=`${candidates.length} PROSPECT${candidates.length===1?'':'S'} · SHOWING ${Math.min(limit,candidates.length)}`;
    $('prospects').innerHTML=candidates.slice(0,limit).map(p=>{
      const assigned=draft.ids.indexOf(p.id),taken=assigned!==-1,starter=assigned===selected;
      return `<button class="prospect ${taken?'taken':''} ${starter?'starter':''}" data-pick="${p.id}" ${taken?'disabled':''} aria-label="Draft ${p.name} at ${slot.label}, ${p.ovr} overall"><div class="prospect-top"><small>#${String(p.id).padStart(3,'0')}</small><b>${p.ovr}<span>OVR</span></b></div><img src="assets/portraits/${p.id}.png" alt="" loading="lazy"><h3>${p.name}</h3><div class="type-tags">${p.types.map(t=>`<span class="type-${t}">${t}</span>`).join('')}</div><div class="prospect-ultimate" style="--ultimate:${PokeSim.ultimates.signature(p.id).color}">✦ ${PokeSim.ultimates.signature(p.id).name}</div><div class="prospect-skills">${PokeSim.specs[slot.pos].map(k=>`<div><span>${k}</span><b>${p.ratings[k]}</b></div>`).join('')}</div><span class="pick-action">${starter?'YOUR STARTER':taken?'DRAFTED · '+slots[assigned].label:'DRAFT AT '+slot.label+' ＋'}</span></button>`;
    }).join('')+(candidates.length===0?'<p class="empty-search">No Pokémon match that search. Try another name or type.</p>':'')+(candidates.length>limit?`<button id="moreProspects" class="more-prospects">SHOW MORE PROSPECTS · ${candidates.length-limit} REMAINING ↓</button>`:'');
    $('prospects').querySelectorAll('[data-pick]').forEach(button=>button.onclick=()=>{
      const id=+button.dataset.pick,name=player(id,slot.pos).name;
      draft.pick(selected,id);undoClear=null;save();
      const next=slots.find(s=>s.index>selected&&draft.ids[s.index]===null)||slots.find(s=>draft.ids[s.index]===null);
      if(next){selected=next.index;draftSide=next.side;$('draftSearch').value='';$('draftType').value='all';}
      limit=24;render();announce(`${name} drafted at ${slot.label}. ${next?'Next: '+titles[next.pos]+'.':'All 22 starters are ready.'}`);
      $('draftSlots').querySelector(`[data-slot="${selected}"]`)?.focus({preventScroll:true});
    });
    if($('moreProspects'))$('moreProspects').onclick=()=>{limit+=24;renderMarket()};
  }
  function render(){renderSlots();renderSummary();renderMarket();}
  function showDraft(){window.draftIsOpen=true;$('draftScreen').hidden=false;$('broadcastScreen').hidden=true;$('backToMatch').hidden=!hasMatch;$('editDraft').classList.add('active');render();window.scrollTo({top:0,behavior:'instant'});}
  function showMatch(){window.draftIsOpen=false;$('draftScreen').hidden=true;$('broadcastScreen').hidden=false;$('editDraft').classList.remove('active');window.scrollTo({top:0,behavior:'instant'});}
  $('editDraft').onclick=showDraft;$('backToMatch').onclick=showMatch;
  document.querySelectorAll('[data-draft-side]').forEach(button=>button.onclick=()=>{draftSide=button.dataset.draftSide;selected=(slots.find(s=>s.side===draftSide&&draft.ids[s.index]===null)||slots.find(s=>s.side===draftSide)).index;limit=24;render()});
  ['draftSearch','draftType','draftSort'].forEach(id=>$(id).addEventListener(id==='draftSearch'?'input':'change',()=>{limit=24;renderMarket()}));
  $('autoDraft').onclick=()=>{if(draft.summary().count===22){draft.ids=Array(22).fill(null);selected=0;draftSide='offense';$('draftSearch').value='';$('draftType').value='all';}draft.autoFill();undoClear=null;save();render();announce('Your lineup is complete. Swap any starter, or lock your 22 and kick off.');};
  $('clearDraft').onclick=()=>{if(undoClear){draft.ids=undoClear;undoClear=null;announce('Your lineup is restored.')}else{undoClear=draft.ids.slice();draft.ids=Array(22).fill(null);selected=0;draftSide='offense';announce('Lineup cleared. Use Undo Clear to restore it.');}save();render()};
  $('draftLaunch').onclick=async()=>{if(draft.summary().count!==22)return;save();$('draftLaunch').disabled=true;announce('Preparing your matchup…');const started=await window.startDraftedMatch(draft.roster(),draft.opponent(),PokeTeamName.save(localStorage,teamInput.value));if(started){hasMatch=true;showMatch()}renderSummary();};
  PokeSocial.setup({ids:()=>draft.ids.slice(),name:()=>PokeTeamName.name(teamInput.value),showMatch:()=>{hasMatch=true;showMatch()},importTeam:team=>{draft.ids=team.ids.slice();teamInput.value=PokeTeamName.save(localStorage,team.name);teamIdentity();save();selected=0;draftSide='offense';render()}});
  showDraft();
  if(autoPicked){save();announce('Your offense and defense are auto-picked. Swap any starter, or lock your lineup and kick off.');}else announce('Your saved lineup is ready. Swap any starter, or kick off.');
})();
