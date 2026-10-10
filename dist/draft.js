/* Fictional football projections derived from bundled species traits. */
(function(root){
  const sim=typeof module!=='undefined'?require('./sim.js'):root.PokeSim;
  const rows=typeof module!=='undefined'?require('./kanto.js'):root.PokeKanto;
  const positions=['QB','WR','WR','TE','HB','FB','LT','LG','C','RG','RT','DE','NT','DE','OLB','OLB','ILB','ILB','CB','CB','S','S'];
  const slots=positions.map((pos,index)=>({pos,index,side:index<11?'offense':'defense',label:pos+(positions.filter(p=>p===pos).length>1?' '+positions.slice(0,index+1).filter(p=>p===pos).length:'')}));
  const pool=rows.map(([id,name,types,weight,hp,attack,defense,special,specialDefense,speed])=>({id,name,types,weight,hp,attack,defense,special,specialDefense,speed}));
  const byId=new Map(pool.map(p=>[p.id,p]));
  const clamp=v=>Math.round(Math.max(1,Math.min(99,v)));
  const mean=ps=>ps.length?Math.round(ps.reduce((sum,p)=>sum+p.ovr,0)/ps.length):0;
  const cache=new Map();
  function player(id,pos){
    const pokemon=byId.get(id);
    if(!pokemon||!sim.specs[pos])throw new Error('Unknown player or position');
    const key=id+':'+pos;
    if(!cache.has(key)){
      const original=sim.roster.find(p=>p.id===id&&p.pos===pos);
      const speed=clamp(15+pokemon.speed*.62);
      const strength=clamp(24+pokemon.attack*.45+pokemon.defense*.16+Math.log1p(pokemon.weight)*3);
      const agility=clamp(25+pokemon.speed*.42+pokemon.special*.15-pokemon.weight*.025);
      const stamina=clamp(30+pokemon.hp*.35+pokemon.specialDefense*.22);
      const awareness=clamp(40+pokemon.special*.32+pokemon.specialDefense*.24);
      const special=clamp(22+pokemon.special*.55);
      const skills={
        Arm:special*.55+strength*.45,Accuracy:awareness*.65+agility*.35,Reads:awareness,
        Hands:awareness*.65+agility*.35,Routes:speed*.4+agility*.4+awareness*.2,Release:speed*.65+strength*.35,
        Blocking:strength*.65+stamina*.25+awareness*.1,Vision:awareness*.7+agility*.3,
        Carry:stamina*.5+strength*.25+awareness*.25,Elusiveness:agility*.65+speed*.35,
        'Lead block':strength*.7+speed*.3,Power:strength,'Pass block':strength*.55+awareness*.45,
        'Run block':strength*.75+stamina*.25,Footwork:agility*.6+awareness*.4,Anchor:strength*.7+stamina*.3,
        Snaps:awareness*.8+agility*.2,Rush:strength*.5+speed*.35+agility*.15,
        Tackle:strength*.6+awareness*.25+stamina*.15,Shed:strength*.7+agility*.3,
        Coverage:speed*.4+agility*.35+awareness*.25,'Ball skills':awareness*.6+agility*.4,Mirror:agility*.6+speed*.4
      };
      const ratings={Speed:speed,Strength:strength,Agility:agility,Stamina:stamina,Awareness:awareness};
      sim.specs[pos].forEach(k=>ratings[k]=clamp(skills[k]));
      const athletic=['WR','CB'].includes(pos)?speed*.6+agility*.4:['LT','LG','C','RG','RT','NT','DE','FB'].includes(pos)?strength*.75+stamina*.25:(awareness+stamina)/2;
      const values=sim.specs[pos].map(k=>ratings[k]);
      const ovr=clamp((values[0]*.4+values[1]*.35+values[2]*.25)*.8+athletic*.2);
      const note=`${pokemon.name} projects at ${pos} through ${sim.specs[pos].join(', ').toLowerCase()}. ${speed>=85?'Explosive pace opens up the field.':strength>=85?'Physical strength wins contact.':awareness>=85?'Anticipation is the strongest asset.':'A developing prospect with room to grow.'}`;
      cache.set(key,{id,name:pokemon.name,pos,side:slots.find(s=>s.pos===pos).side,types:pokemon.types.slice(),ratings:original?{...original.ratings}:ratings,ovr:original?original.ovr:ovr,note:original?original.note:note});
    }
    const p=cache.get(key);
    return {...p,ratings:{...p.ratings},types:p.types.slice()};
  }
  function valid(ids){return Array.isArray(ids)&&ids.length===22&&ids.every(id=>id===null||byId.has(id))&&new Set(ids.filter(id=>id!==null)).size===ids.filter(id=>id!==null).length;}
  function choose(pos,used,random){
    const candidates=pool.filter(p=>!used.has(p.id)).map(p=>player(p.id,pos)).sort((a,b)=>b.ovr-a.ovr||a.id-b.id);
    return candidates[Math.min(4,Math.floor(random()*5))].id;
  }
  class Draft{
    constructor(ids){this.ids=valid(ids)?ids.slice():Array(22).fill(null);}
    pick(index,id){
      if(!slots[index]||!byId.has(id))throw new Error('Invalid draft pick');
      if(this.ids.some((other,i)=>i!==index&&other===id))throw new Error('This Pokémon is already in your lineup');
      this.ids[index]=id;
    }
    remove(index){if(!slots[index])throw new Error('Invalid slot');this.ids[index]=null;}
    autoFill(random=Math.random){const used=new Set(this.ids.filter(id=>id!==null));for(const slot of slots){if(this.ids[slot.index]!==null)continue;const id=choose(slot.pos,used,random);this.ids[slot.index]=id;used.add(id);}return this.roster();}
    roster(){return slots.filter(s=>this.ids[s.index]!==null).map(s=>({...player(this.ids[s.index],s.pos),slot:s.index}));}
    summary(){const team=this.roster();return {count:team.length,ovr:mean(team),offense:mean(team.filter(p=>p.side==='offense')),defense:mean(team.filter(p=>p.side==='defense'))};}
    opponent(random=Math.random){
      if(this.summary().count!==22)throw new Error('Fill all 22 positions before kickoff');
      const used=new Set(this.ids);
      return slots.map(slot=>{const id=choose(slot.pos,used,random);used.add(id);return {...player(id,slot.pos),slot:slot.index};});
    }
  }
  root.PokeDraft={pool,slots,player,Draft,valid,mean};
  if(typeof module!=='undefined')module.exports=root.PokeDraft;
})(typeof window!=='undefined'?window:globalThis);
