/* Stadium title menu. Invite/share and account recovery links go straight to their flow. */
(function(){
 'use strict';
 const screen=document.getElementById('welcomeScreen'),state=window.PokeWelcome;
 const main=document.querySelector('main');
 function close(){state.active=false;screen.hidden=true;main.inert=false;document.body.classList.remove('title-screen-open');window.scrollTo({top:0,behavior:'instant'});}
 function enter(){close();window.PokeAudio?.start();window.PokeAccount?.requestEntry();document.getElementById('draftTitle').focus({preventScroll:true});}
 function play(){enter();window.PokeTeamPicker.open()}
 document.getElementById('welcomePlay').onclick=play;
 document.getElementById('guidePlay').onclick=play;
 document.getElementById('welcomeDraft').onclick=()=>{enter();document.getElementById('draftSearch').focus({preventScroll:true});};
 document.getElementById('welcomeFriends').onclick=()=>{enter();document.getElementById('inviteFriend').focus({preventScroll:true});};
 document.getElementById('welcomeLeague').onclick=()=>document.getElementById('leaderboardNav').click();
 document.getElementById('welcomeHow').onclick=()=>{const help=document.getElementById('welcomeHelp'),button=document.getElementById('welcomeHow');help.hidden=!help.hidden;button.setAttribute('aria-expanded',String(!help.hidden));};
 const music=document.getElementById('welcomeMusic');music.onclick=()=>window.PokeAudio?.toggle();
 const audioLabel=()=>{music.textContent=window.PokeAudio?.playing()?'♫ MUSIC ON':'♫ MUSIC OFF';music.setAttribute('aria-pressed',String(Boolean(window.PokeAudio?.playing())));};window.addEventListener('pokebowl-music',audioLabel);audioLabel();
 screen.hidden=!state.active;main.inert=state.active;document.body.classList.toggle('title-screen-open',state.active);
 document.addEventListener('keydown',event=>{if(state.active&&event.key==='Enter'&&event.target===document.body){event.preventDefault();play();}});
})();
