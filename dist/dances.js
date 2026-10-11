/* Species-stable victory choreography shared by the end zone and stadium screen. */
(function(root){
'use strict';
const ultimates=typeof module!=='undefined'?require('./ultimates.js'):root.PokeUltimates;
const styles=['shuffle','spin','bounce','robot','sway','stomp','moonwalk','flop'];
const featured={3:['Vine Time','sway'],6:['Wing It','spin'],9:['Cannon Pop','robot'],25:['Electric Slide','shuffle'],26:['Thunder Shuffle','shuffle'],28:['Sand Shimmy','shuffle'],38:['Nine-Tail Twirl','spin'],39:['Mic Drop','bounce'],51:['Triple Trouble','bounce'],54:['Headache Hustle','sway'],57:['Banana Boogie','stomp'],65:['Spoon Groove','robot'],68:['Four-Arm Flex','stomp'],76:['Boulder Roll','flop'],80:['Slow Jam','sway'],82:['Magnet Lock','robot'],89:['Sludge Slide','moonwalk'],94:['Ghost Walk','moonwalk'],103:['Palm Party','sway'],105:['Bone Boogie','spin'],108:['Tongue Twist','sway'],112:['Rhino Rumble','stomp'],115:['Mama & Me','bounce'],121:['Star Power Spin','spin'],123:['Blade Break','robot'],128:['Bull Stomp','stomp'],129:['Victory Flop','flop'],131:['Surf Shuffle','sway'],132:['Copy That','robot'],133:['Eevee Two-Step','shuffle'],135:['Volt Shuffle','shuffle'],141:['Fossil Funk','robot'],143:['Belly Bounce','bounce'],144:['Ice Ice Birdie','moonwalk'],145:['Thunder Strut','stomp'],146:['Disco Inferno','spin'],149:['Dragon Drop','flop'],150:['Psychic Pop','robot'],151:['Mew Moonwalk','moonwalk']};
const catalog=Object.freeze(ultimates.catalog.map(u=>{const [name,style]=featured[u.id]||[u.pokemon+' '+['Two-Step','Twirl','Boogie','Pop','Wiggle','Stomp','Moonwalk','Flop'][u.id%8],styles[u.id%8]];return Object.freeze({id:u.id,name,style,color:u.color,amplitude:8+u.id%11,tempo:1+(u.id%7-3)*.035,accent:u.id/151})}));
function signature(id){const dance=catalog[id-1];if(!dance||dance.id!==id)throw Error('Unknown dancer');return dance}
function sample(id,time,fullEffects=true){
 const d=signature(id),t=fullEffects?Math.max(0,time):0,b=t*130/60*d.tempo,q=b*Math.PI*2,w=Math.sin(q),s=Math.sin(q/2),hop=Math.max(0,w),a=d.amplitude;
 let x=0,lift=0,rotation=0,sx=1,sy=1,facing=0,pose='celebrate';
 if(fullEffects)switch(d.style){
  case 'shuffle':x=s*a;lift=hop*8;rotation=w*.13;facing=s>0?7:1;pose='run';break;
  case 'spin':x=Math.sin(q/2)*a*.45;lift=hop*13;rotation=w*.1;facing=Math.floor(b*4)%8;break;
  case 'bounce':lift=hop*(13+a*.5);sx=1+Math.min(0,w)*-.13;sy=1+Math.min(0,w)*.15;rotation=s*.1;facing=b%4<2?7:1;break;
  case 'robot':x=Math.round(s*2)/2*a;rotation=Math.round(w*2)/2*.24;lift=Math.floor(b*2)%2*4;facing=[0,6,0,2][Math.floor(b)%4];break;
  case 'sway':x=s*a*.6;rotation=s*.28;sy=1+Math.sin(q)*.045;facing=s>0?7:1;break;
  case 'stomp':x=s*a*.55;lift=hop*19;rotation=w*.18;sx=1+Math.min(0,w)*-.09;sy=1+Math.min(0,w)*.09;facing=Math.floor(b)%2?1:7;break;
  case 'moonwalk':x=(((b/4)%1)-.5)*a*2;lift=Math.abs(w)*3;rotation=-.11;facing=2;pose='run';break;
  case 'flop':x=s*a*.45;rotation=Math.sin(q/2)*1.05;lift=Math.abs(w)*14;sx=1+hop*.06;sy=1-hop*.08;facing=b%4<2?6:2;break;
 }
 // A species-specific second beat keeps even related dances distinct.
 if(fullEffects){rotation+=Math.sin(q*.5+d.accent*Math.PI)*.04;x+=Math.sin(q*1.5)*d.accent*3;}
 return{x,lift,rotation,sx,sy,facing,pose,time:t*d.tempo};
}
root.PokeDances={catalog,signature,sample};if(typeof module!=='undefined')module.exports=root.PokeDances;
})(typeof window!=='undefined'?window:globalThis);
