(function(){
'use strict';
const $=id=>document.getElementById(id),base=()=>location.origin+location.pathname;
let client=null,booted=false,callbacks=null,incomingTeam=null;
function notice(text){$('socialNotice').textContent=text}
function openShare(url,title){$('shareTitle').textContent=title;$('shareURL').value=url;$('shareState').textContent='Send this link to your friend.';$('shareDialog').showModal()}
function showInvite(view){
 if(booted){if(view.snapshot)window.receivePvpView(view);return}
 $('duelPanel').hidden=false;$('duelTitle').textContent=view.state==='waiting'?`${view.names[0]} is waiting for a rival.`:view.state==='full'?'This duel already has two coaches.':'Your friend is on the field.';
 $('joinDuel').hidden=client.token!==''||view.state!=='waiting';$('resumeInvite').hidden=!client.token;
 if(view.snapshot){booted=true;client.consume(view.round);$('duelPanel').hidden=true;window.startPvpMatch(view,client);callbacks.showMatch();}
}
function follow(){client.start(showInvite,error=>{notice(error.message+' Reconnecting…');$('duelStatus').textContent=error.message+' Reconnecting…';$('duelStatus').hidden=false})}
function stop(){client?.stop();client=null;booted=false;$('duelStatus').hidden=true;$('duelPanel').hidden=true;$('resumeInvite').hidden=true;history.replaceState(null,'',location.pathname+location.search)}
window.PokeSocial={stop,setup(config){callbacks=config;
 $('shareTeam').onclick=()=>{try{openShare(base()+'#team='+PokeTeamLinks.encode(callbacks.ids(),callbacks.name()),'Share your starting 22')}catch(error){notice(error.message)}};
 $('inviteFriend').onclick=async()=>{if(!PokeDraft.valid(callbacks.ids())){notice('Fill all 22 spots before inviting a friend.');return}$('inviteFriend').disabled=true;try{client?.stop();client=await PokePvP.RoomClient.create(callbacks.ids(),callbacks.name());booted=false;history.replaceState(null,'','#duel='+client.id);openShare(base()+'#duel='+client.id,'Invite a friend · 1v1');follow();notice('Your team is locked for this duel. Waiting for your friend to join.')}catch(error){notice(error.message)}finally{$('inviteFriend').disabled=false}};
 $('joinDuel').onclick=async()=>{if(!PokeDraft.valid(callbacks.ids())){notice('Fill all 22 spots before joining.');return}$('joinDuel').disabled=true;try{await client.join(callbacks.ids(),callbacks.name());if($('shareDialog').open)$('shareDialog').close();notice('Both coaches are ready. Taking the field…')}catch(error){notice(error.message)}finally{$('joinDuel').disabled=false}};
 $('resumeInvite').onclick=()=>openShare(base()+'#duel='+client.id,'Invite a friend · 1v1');$('leaveLobby').onclick=()=>{stop();notice('Back to your draft. You can play the computer or create a new invite.')};
 $('useSharedTeam').onclick=()=>{callbacks.importTeam(incomingTeam);$('sharedTeamPanel').hidden=true;history.replaceState(null,'',location.pathname+location.search);notice('Shared team loaded. Make it yours, play the computer, or invite a friend.')};$('dismissSharedTeam').onclick=()=>{$('sharedTeamPanel').hidden=true;history.replaceState(null,'',location.pathname+location.search)};
 $('closeShare').onclick=()=>$('shareDialog').close();$('copyShare').onclick=async()=>{try{await navigator.clipboard.writeText($('shareURL').value);$('shareState').textContent='LINK COPIED · Ready to send.'}catch{$('shareURL').focus();$('shareURL').select();$('shareState').textContent='Select and copy the link above.'}};
 $('nativeShare').hidden=!navigator.share;$('nativeShare').onclick=async()=>{try{await navigator.share({title:'Poké Bowl · '+callbacks.name(),text:'Meet me on the field!',url:$('shareURL').value})}catch(error){if(error.name!=='AbortError')$('shareState').textContent='Use Copy link to share instead.'}};
 function readLink(){
 const hash=new URLSearchParams(location.hash.slice(1));
 if(hash.has('team'))try{incomingTeam=PokeTeamLinks.decode(hash.get('team'));$('sharedTeamPanel').hidden=false;$('sharedTeamTitle').textContent=incomingTeam.name+' · shared starting 22';}catch(error){notice(error.message)}
 if(hash.has('duel')){if(booted){notice('Leave your current duel before joining another invitation.');return}client?.stop();const id=hash.get('duel');if(/^[a-f0-9-]{36}$/.test(id)){client=new PokePvP.RoomClient(id);follow()}else notice('That invitation link is invalid. Ask your friend for a new one.')}
 }
 readLink();window.addEventListener('hashchange',readLink);
}};
})();
