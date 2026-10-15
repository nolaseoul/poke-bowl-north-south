/* Public aggregate counts. Guest box scores never become a coach record. */
(function(){
 'use strict';
 const panels=[...document.querySelectorAll('[data-stadium-totals]')],key='pokebowl-anonymous-totals-v1';
 let latest=null,busy=false;
 const number=new Intl.NumberFormat('en-US'),compact=new Intl.NumberFormat('en-US',{notation:'compact',maximumFractionDigits:1});
 function paint(){for(const panel of panels){for(const field of ['games','touchdowns','tackles']){const value=panel.querySelector('[data-total="'+field+'"]');value.textContent=latest?(latest[field]>=1e6?compact:number).format(latest[field]):'—';value.title=latest?number.format(latest[field]):'';}const note=panel.querySelector('[data-totals-note]');if(latest){const date=new Date(latest.since);note.textContent='WORLDWIDE · SINCE '+date.toLocaleDateString('en-US',{month:'short',day:'numeric',timeZone:'UTC'}).toUpperCase();panel.title='Completed games tracked since '+date.toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric',timeZone:'UTC'})+'. Both teams count. Pokémon crushed means football tackles; replays and two-point conversions do not add touchdowns.'}else note.textContent='STADIUM TOTALS · CONNECTING';}}
 async function api(path,data){const response=await fetch('/api/stats'+path,{method:data?'POST':'GET',...(data?{headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}:{}),cache:'no-store',signal:AbortSignal.timeout(5000)});const result=await response.json();if(!response.ok)throw Error(result.error||'Stadium totals unavailable.');return result;}
 async function refresh(){try{const data=await api('');if(!['games','touchdowns','tackles'].every(k=>Number.isSafeInteger(data[k])&&data[k]>=0)||!Number.isFinite(Date.parse(data.since)))throw Error();latest=data;paint()}catch{if(!latest)for(const panel of panels)panel.querySelector('[data-totals-note]').textContent='TOTALS TEMPORARILY UNAVAILABLE';}}
 function pending(){try{const rows=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(rows)?rows.filter(r=>r?.ticket?.anonymous&&typeof r.ticket.id==='string'&&Array.isArray(r.calls)&&Array.isArray(r.score)):[]}catch{return []}}
 function store(rows){try{localStorage.setItem(key,JSON.stringify(rows.slice(-5)))}catch{}}
 async function finishMatch(ticket,calls,score){
  store([...pending().filter(r=>r.ticket.id!==ticket.id),{ticket,calls,score}]);
  await api('/games/'+ticket.id+'/finish',{calls,score});
  store(pending().filter(r=>r.ticket.id!==ticket.id));await refresh();
 }
 async function flush(){if(busy)return;busy=true;try{for(const row of pending()){try{await finishMatch(row.ticket,row.calls,row.score)}catch(error){if(/expired|not found/i.test(error.message)){store(pending().filter(r=>r.ticket.id!==row.ticket.id));continue}break}}}finally{busy=false}}
 window.PokeActivity={refresh,async prepareMatch(lineup,opponent){try{return await api('/games',{lineup,opponent})}catch{return null}},finishMatch};
 paint();refresh();flush();
 window.addEventListener('online',()=>{refresh();flush()});
 setInterval(()=>{if(!document.hidden){refresh();flush()}},60000);
})();
