(function(root){
'use strict';
const draft=typeof module!=='undefined'?require('./draft.js'):root.PokeDraft,naming=typeof module!=='undefined'?require('./team-name.js'):root.PokeTeamName;
function encode(ids,name){if(!draft.valid(ids))throw Error('Fill all 22 spots before sharing.');const bytes=new TextEncoder().encode(JSON.stringify({v:1,name:naming.name(name),ids}));return btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
function decode(value){try{if(typeof value!=='string'||value.length>2048||!/^[\w-]+$/.test(value))throw Error();const bytes=Uint8Array.from(atob(value.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0)),data=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));if(data.v!==1||!draft.valid(data.ids)||data.ids.some(id=>!Number.isInteger(id))||typeof data.name!=='string')throw Error();return{ids:data.ids,name:naming.name(data.name)}}catch{throw Error('That team link is invalid. Ask your friend to share a new one.')}}
root.PokeTeamLinks={encode,decode};if(typeof module!=='undefined')module.exports=root.PokeTeamLinks;
})(typeof window!=='undefined'?window:globalThis);
