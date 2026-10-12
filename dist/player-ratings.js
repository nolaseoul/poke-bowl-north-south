/* Enhance the fully rendered default scouting table; no account or game state required. */
(function(){
 'use strict';
 const draft=window.PokeDraft,sim=window.PokeSim;
 if(!draft||!sim)return;
 const form=document.getElementById('ratingsFilters'),search=document.getElementById('ratingsSearch'),position=document.getElementById('ratingsPosition'),type=document.getElementById('ratingsType'),sort=document.getElementById('ratingsSort'),body=document.getElementById('ratingsBody'),count=document.getElementById('ratingsCount'),caption=document.getElementById('ratingsCaption');
 const positions=Object.keys(sim.specs),best=new Map(draft.pool.map(p=>[p.id,positions.map(pos=>draft.player(p.id,pos)).sort((a,b)=>b.ovr-a.ovr||positions.indexOf(a.pos)-positions.indexOf(b.pos))[0].pos]));
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function render(){
  const pos=position.value,query=search.value.trim().toLowerCase().replace(/^#/,''),key=sort.value,skills=sim.specs[pos];
  const rows=draft.pool.filter(p=>(!type.value||p.types.includes(type.value))&&(!query||p.name.toLowerCase().includes(query)||String(p.id).padStart(3,'0').includes(query))).map(p=>draft.player(p.id,pos));
  rows.sort((a,b)=>key==='name'?a.id-b.id:(key==='ovr'?b.ovr-a.ovr:b.ratings[key]-a.ratings[key])||a.id-b.id);
  body.innerHTML=rows.map(p=>`<tr data-player="${p.id}"><th scope="row"><span class="guide-player"><img src="/assets/${p.id}.png" width="48" height="48" loading="lazy" alt=""><span>${esc(p.name)}<small>#${String(p.id).padStart(3,'0')} · Best OVR: ${best.get(p.id)}</small></span></span></th><td class="guide-ovr">${p.ovr}</td>${skills.map(k=>`<td>${p.ratings[k]}</td>`).join('')}<td>${p.ratings.Speed}</td><td>${p.ratings.Strength}</td><td>${esc(sim.ultimates.signature(p.id).name)}</td></tr>`).join('');
  skills.forEach((k,i)=>document.getElementById('ratingsSkill'+i).textContent=k);
  const label=position.selectedOptions[0].textContent.split(' · ')[1];
  caption.textContent=label+' ratings · 1–99 scale';
  count.textContent=rows.length+' Pokémon · '+pos+' ratings · '+(key==='name'?'Pokédex order':'highest '+(key==='ovr'?'OVR':key)+' first');
  document.getElementById('ratingsEmpty').hidden=rows.length!==0;
 }
 form.addEventListener('submit',e=>e.preventDefault());
 [search,position,type,sort].forEach(control=>{control.disabled=false;control.addEventListener(control===search?'input':'change',render)});
 render();
})();
