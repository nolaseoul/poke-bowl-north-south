/* Team identity is a browser preference, separate from a coach's account name. */
(function(root){
'use strict';
const key='poke-bowl-team-name-v1',fallback='Kanto Blue',limit=24;
function clean(value){return Array.from(String(value??'').normalize('NFC').replace(/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/g,'').replace(/\s+/gu,' ').trim()).slice(0,limit).join('')}
function name(value){return clean(value)||fallback}
function load(storage){try{return name(storage.getItem(key))}catch{return fallback}}
function save(storage,value){const result=name(value);try{storage.setItem(key,result)}catch{}return result}
function html(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
root.PokeTeamName={key,fallback,limit,clean,name,load,save,html};if(typeof module!=='undefined')module.exports=root.PokeTeamName;
})(typeof window!=='undefined'?window:globalThis);
