/* Shared deterministic match rules. The server regenerates every ranked result. */
(function(root){
 'use strict';
 const sim=typeof module!=='undefined'?require('./sim.js'):root.PokeSim;
 const draft=typeof module!=='undefined'?require('./draft.js'):root.PokeDraft;
 const countries='AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW'.split(' ');
 function random(seed){let value=seed>>>0;return()=>{value+=0x6D2B79F5;let t=value;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
 function teams(ids,seed){if(!draft.valid(ids)||ids.some(id=>!Number.isInteger(id)))throw Error('Choose 22 different Pokémon.');const d=new draft.Draft(ids);return[d.roster(),d.opponent(random(seed^0x9e3779b9))]}
 function replay(ids,seed,calls){
  if(!Array.isArray(calls)||calls.length>200)throw Error('Invalid play history.');
  const m=new sim.Match(random(seed),{teams:teams(ids,seed)});
  for(const call of calls){
   if(m.over)throw Error('Invalid play history.');
   if(call!==null&&typeof call==='object'){
    if(m.team!==1||Array.isArray(call)||Object.keys(call).length!==1||!Object.hasOwn(sim.defenseCalls,call.defense))throw Error('Invalid play history.');
    m.next(null,call.defense);
   }else{
    if(call!==null&&(typeof call!=='string'||!Object.hasOwn(sim.calls,call)||m.team!==0))throw Error('Invalid play history.');
    m.next(call);
   }
  }
  if(!m.over)throw Error('Finish the match before saving.');return m;
 }

 root.PokeLeague={countries,random,teams,replay};if(typeof module!=='undefined')module.exports=root.PokeLeague;
})(typeof window!=='undefined'?window:globalThis);
