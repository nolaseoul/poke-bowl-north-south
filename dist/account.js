/* Managed accounts, public standings, and guest play. Passwords go only to Supabase Auth. */
(function(){
 'use strict';
 const $=id=>document.getElementById(id),dialog=$('accountDialog');
 let client=null,session=null,profile=null,config=null,mode='login',busy=false,chosen=false,guestCountry='',authRevision=0;
 const pendingKey='poke-bowl-pending-results-v1';
 function pending(){try{const data=JSON.parse(localStorage.getItem(pendingKey)||'[]');return Array.isArray(data)?data.filter(r=>r?.ticket?.owner&&r?.ticket?.id&&Array.isArray(r.calls)&&Array.isArray(r.score)):[]}catch{return []}}
 function storePending(rows){try{localStorage.setItem(pendingKey,JSON.stringify(rows))}catch{}}
 async function saveMatch(ticket,calls,score){
  storePending([...pending().filter(r=>r.ticket.id!==ticket.id),{ticket,calls,score}]);
  if(!session||!profile||ticket.owner!==profile.user_id)throw Error('Sign in to the account that started this match to save it.');
  const result=await api('matches/'+ticket.id+'/finish',{method:'POST',body:JSON.stringify({calls,score})});
  storePending(pending().filter(r=>r.ticket.id!==ticket.id));if(profile?.user_id===ticket.owner){profile=result.profile;status()}return result;
 }
 async function syncPending(){for(const item of pending().filter(r=>r.ticket.owner===profile?.user_id)){try{await saveMatch(item.ticket,item.calls,item.score)}catch{break}}}
 const redirectTo=location.origin+'/',callbackParams=new URLSearchParams(location.search||''),callbackHash=new URLSearchParams((location.hash||'').slice(1)),callbackError=callbackParams.get('error_description')||callbackHash.get('error_description'),flag=code=>code?String.fromCodePoint(...[...code].map(c=>127397+c.charCodeAt(0))):'🌐';
 const display=new Intl.DisplayNames(['en'],{type:'region'}),countryName=code=>display.of(code)||code;
 const countryOptions=PokeLeague.countries.map(code=>({code,name:countryName(code)})).sort((a,b)=>a.code==='US'?-1:b.code==='US'?1:a.name.localeCompare(b.name));
 const countryFilters={};
 for(const id of ['profileCountry','guestCountry','leaderCountry']){
  const select=$(id),search=$(id+'Search'),state=$(id+'Results'),placeholder=id==='leaderCountry'?'Every country':'Choose your country';
  const render=()=>{
   const value=select.value,query=search.value.trim().toLowerCase();
   const matches=countryOptions.filter(c=>!query||c.name.toLowerCase().includes(query)||c.code.toLowerCase().includes(query)||c.code==='US'&&['usa','america','u.s.'].some(alias=>alias.includes(query)));
   select.replaceChildren();
   const add=(value,text)=>{const option=document.createElement('option');option.value=value;option.textContent=text;select.append(option)};
   add('',placeholder);matches.forEach(c=>add(c.code,flag(c.code)+' '+c.name));
   if(value&&!matches.some(c=>c.code===value)){const selected=countryOptions.find(c=>c.code===value);if(selected)add(value,flag(value)+' '+selected.name+' · selected')}
   select.value=value;state.textContent=query?(matches.length?matches.length+' '+(matches.length===1?'country':'countries')+' found':'No countries found. Try another name or code.'):'';
  };
  search.oninput=render;countryFilters[id]=()=>{search.value='';render()};render();
 }
 function message(text,error=false){$('accountMessage').textContent=text;$('accountMessage').classList.toggle('error',error)}
 function status(){
  $('accountNav').textContent=profile&&session?flag(profile.country)+' '+profile.name:'SIGN IN';
  $('profileStatus').textContent=profile&&session?`${flag(profile.country)} ${profile.name} · ${profile.rank?'GLOBAL #'+profile.rank:'UNRANKED'} · ${profile.wins}W / ${profile.losses}L / ${profile.draws}D`:`GUEST MODE${guestCountry?' · '+flag(guestCountry)+' '+countryName(guestCountry):''} · Results aren’t saved`;
  $('profileStatus').classList.toggle('ranked',Boolean(profile&&session));
 }
 function show(next=mode){
  mode=next;message('');countryFilters.profileCountry();countryFilters.guestCountry();
  const isProfile=mode==='profile',isRecovery=mode==='recovery';
  $('accountWelcome').hidden=isProfile||isRecovery;$('accountProfile').hidden=!isProfile;$('recoveryForm').hidden=!isRecovery;
  $('accountTitle').textContent=isProfile?'Your place in the league.':isRecovery?'Back in the game.':'Build your legacy.';
  $('accountSubtitle').textContent=isProfile?'Represent your country. Make every match count.':isRecovery?'Choose a new password for your account.':'Choose an account, or jump straight into guest play.';
  $('authSubmit').textContent=mode==='signup'?'CREATE ACCOUNT →':'SIGN IN →';
  $('authPassword').autocomplete=mode==='signup'?'new-password':'current-password';$('authPassword').minLength=mode==='signup'?8:1;
  $('signupTab').setAttribute('aria-pressed',String(mode==='signup'));$('loginTab').setAttribute('aria-pressed',String(mode==='login'));
  $('forgotPassword').hidden=mode==='signup';$('resendConfirmation').hidden=true;
  $('accountClose').hidden=!chosen;
  if(isProfile){$('profileName').value=profile?.name||'';$('profileCountry').value=profile?.country||'';$('profileRecord').textContent=profile?`${profile.trophies} PTS · ${profile.wins}W / ${profile.losses}L / ${profile.draws}D${profile.rank?' · GLOBAL #'+profile.rank:''}`:'Choose your coach name and country to join the league.';$('profileHistory').replaceChildren();for(const game of profile?.history||[]){const row=document.createElement('li');const result=game.points_for>game.points_against?'WIN':game.points_for<game.points_against?'LOSS':'DRAW';row.textContent=`${result} · ${game.points_for}–${game.points_against} · ${new Date(game.completed_at).toLocaleDateString()}`;$('profileHistory').append(row)}$('profileHistoryEmpty').hidden=Boolean(profile?.history?.length);}
  if(!dialog.open)dialog.showModal();
 }
 async function action(fn){if(busy)return;busy=true;dialog.setAttribute('aria-busy','true');try{await fn()}catch(error){message(error.message||'Please try again.',true)}finally{busy=false;dialog.removeAttribute('aria-busy')}}
 async function api(path,options={}){
  const headers={'Content-Type':'application/json'};
  if(client){const {data,error}=await client.auth.getSession();if(error)throw error;session=data.session;if(session)headers.Authorization='Bearer '+session.access_token;}
  const response=await fetch('/api/'+path,{...options,headers,signal:AbortSignal.timeout(12000)});const data=await response.json();if(!response.ok)throw Error(data.error||'Could not connect to the league.');return data;
 }
 async function signedIn(value,recovery=false){
  const revision=++authRevision;session=value;
  if(!value){profile=null;status();return}
  try{const data=await api('profile');if(revision!==authRevision)return;profile=data.profile;chosen=Boolean(profile);status();if(profile)syncPending();if(recovery)show('recovery');else if(mode==='recovery')return;else if(!profile)show('profile');else if(dialog.open){dialog.close();message('')}}catch(error){if(revision===authRevision){show('login');message(error.message,true)}}
 }
 async function chooseGuest(){
  if(!$('guestCountry').value){message('Choose the country you want to represent.',true);$('guestCountry').focus();return}
  if(client&&session){const {error}=await client.auth.signOut({scope:'local'});if(error)throw error}
  session=null;profile=null;guestCountry=$('guestCountry').value;chosen=true;
  try{sessionStorage.setItem('poke-bowl-guest-country',guestCountry)}catch{}
  status();dialog.close();
 }
 $('accountNav').onclick=()=>show(session?'profile':'login');$('accountClose').onclick=()=>dialog.close();dialog.addEventListener('cancel',e=>{if(!chosen)e.preventDefault()});
 $('loginTab').onclick=()=>show('login');$('signupTab').onclick=()=>show('signup');
 $('guestLogin').onclick=()=>action(chooseGuest);
 $('authForm').onsubmit=e=>{e.preventDefault();action(async()=>{
  if(!client)throw Error('Account sign-in is being connected. Guest play is available below.');
  const email=$('authEmail').value.trim(),password=$('authPassword').value;
  if(mode==='signup'){
   const {data,error}=await client.auth.signUp({email,password,options:{emailRedirectTo:redirectTo}});if(error)throw error;$('authPassword').value='';
   if(data.session)await signedIn(data.session);else{message('Check your email to confirm your account, then sign in here.');$('resendConfirmation').hidden=false;}
  }else{const {data,error}=await client.auth.signInWithPassword({email,password});if(error)throw error;$('authPassword').value='';await signedIn(data.session)}
 })};
 $('googleLogin').onclick=()=>action(async()=>{if(!client||!config.google)throw Error('Google sign-in is being connected.');const {error}=await client.auth.signInWithOAuth({provider:'google',options:{redirectTo}});if(error)throw error});
 $('forgotPassword').onclick=()=>action(async()=>{if(!client)throw Error('Account sign-in is being connected.');if(!$('authEmail').reportValidity())return;const {error}=await client.auth.resetPasswordForEmail($('authEmail').value.trim(),{redirectTo});if(error)throw error;message('If that account exists, a password reset link is on its way. Check your email.')});
 $('resendConfirmation').onclick=()=>action(async()=>{const {error}=await client.auth.resend({type:'signup',email:$('authEmail').value.trim(),options:{emailRedirectTo:redirectTo}});if(error)throw error;message('Confirmation requested. Check your email before signing in.')});
 $('recoveryForm').onsubmit=e=>{e.preventDefault();action(async()=>{const {error}=await client.auth.updateUser({password:$('newPassword').value});if(error)throw error;$('newPassword').value='';chosen=Boolean(profile);show('profile');message('Password updated. You’re ready to play.')})};
 $('profileForm').onsubmit=e=>{e.preventDefault();action(async()=>{const data=await api('profile',{method:'PATCH',body:JSON.stringify({name:$('profileName').value,country:$('profileCountry').value})});profile=data.profile;chosen=true;try{sessionStorage.removeItem('poke-bowl-guest-country')}catch{}status();dialog.close()})};
 $('signOut').onclick=()=>action(async()=>{const {error}=await client.auth.signOut({scope:'local'});if(error)throw error;session=null;profile=null;chosen=false;status();show('login')});
 async function leaderboard(){
  const list=$('leaderRows');list.replaceChildren();$('leaderState').textContent='Loading the league…';
  try{const country=$('leaderCountry').value,data=await api('leaderboard'+(country?'?country='+country:''));$('leaderState').textContent=data.players.length?'3 points per win · 1 per draw · ties broken by wins, then point difference.':'The first chapter is yours. Finish a signed-in match to join the leaderboard.';
   for(const player of data.players){const row=document.createElement('tr');if(player.user_id===profile?.user_id)row.className='your-rank';for(const text of ['#'+player.rank,flag(player.country)+' '+player.name,`${player.wins}–${player.losses}–${player.draws}`,player.differential>0?'+'+player.differential:player.differential,player.trophies]){const cell=document.createElement('td');cell.textContent=String(text);row.append(cell)}list.append(row)}
  }catch(error){$('leaderState').textContent=error.message}
 }
 $('leaderboardNav').onclick=()=>{$('leaderboardDialog').showModal();leaderboard()};$('closeLeaderboard').onclick=()=>$('leaderboardDialog').close();$('leaderCountry').onchange=leaderboard;$('refreshLeaderboard').onclick=leaderboard;
 const ready=(async()=>{
  try{guestCountry=sessionStorage.getItem('poke-bowl-guest-country')||'';if(!PokeLeague.countries.includes(guestCountry))guestCountry='';chosen=Boolean(guestCountry);$('guestCountry').value=guestCountry}catch{}
  try{const response=await fetch('/api/config',{signal:AbortSignal.timeout(8000)});if(response.ok)config=await response.json()}catch{}
  if(config?.url&&config?.key){
   client=PokeAuthSDK.createClient(config.url,config.key,{auth:{flowType:'pkce',persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storageKey:'poke-bowl-account-v1'}});
   client.auth.onAuthStateChange((event,value)=>{session=value;if(event==='SIGNED_IN'||event==='SIGNED_OUT'||event==='PASSWORD_RECOVERY')setTimeout(()=>signedIn(value,event==='PASSWORD_RECOVERY'),0)});
   const {data,error}=await client.auth.getSession();if(error)message(error.message,true);await signedIn(data.session);
  }else{dialog.classList.add('auth-unavailable');$('authSetupNotice').hidden=false;['authSubmit','googleLogin','forgotPassword','signupTab','authEmail','authPassword'].forEach(id=>$(id).disabled=true)}
  $('googleLogin').disabled=!client||!config.google;$('googlePending').hidden=Boolean(client&&config.google);status();if(callbackError){show('login');message('Sign-in did not complete: '+callbackError.slice(0,240),true)}else if(!chosen&&!dialog.open&&!window.PokeWelcome?.active)show(session?'profile':'login');
 })().catch(error=>{status();if(!window.PokeWelcome?.active)show('login');message(error.message,true)});
 window.PokeAccount={ready,async requestEntry(){await ready;if(!chosen)show(session?'profile':'login')},async prepareMatch(ids,opponent='random'){await ready;if(!chosen){show(session?'profile':'login');throw Error('Choose an account or guest play before kickoff.')}if(!session||!profile)return null;return api('matches',{method:'POST',body:JSON.stringify({lineup:ids,opponent})})},async finishMatch(ticket,calls,score){if(!ticket)return {saved:false};return saveMatch(ticket,calls,score)},isSignedIn:()=>Boolean(session&&profile)};
})();
