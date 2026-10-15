import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {database} from './support/d1.mjs';
import {createHandler} from '../worker/index.mjs';
import Draft from '../dist/draft.js';
import Sim from '../dist/sim.js';
import League from '../dist/league.js';
const {db,sql}=database(),handler=createHandler(),env={LEAGUE:db},panels=[0,1].map(()=>{const values=new Map();return{values,querySelector(key){if(!values.has(key))values.set(key,{textContent:'',title:''});return values.get(key)}}}),storage=new Map(),events={},intervals=[];
let offline=false,calls=0;
const fetcher=async(path,options)=>{calls++;if(offline)throw Error('offline');return handler(new Request('https://bowl.test'+path,options),env)};
const sandbox={document:{querySelectorAll:()=>panels,hidden:false},window:{addEventListener:(key,fn)=>events[key]=fn},Intl,Date,AbortSignal,fetch:fetcher,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},setInterval:(fn,ms)=>{assert.equal(ms,60000);intervals.push(fn)}};
vm.createContext(sandbox);vm.runInContext(readFileSync(new URL('../dist/activity.js',import.meta.url),'utf8'),sandbox);const client=sandbox.window.PokeActivity;
await client.refresh();for(const panel of panels){assert.equal(panel.querySelector('[data-total="games"]').textContent,'0');assert.match(panel.querySelector('[data-totals-note]').textContent,/WORLDWIDE/)}
const ids=new Draft.Draft().autoFill(League.random(78)).map(p=>p.id),ticket=await client.prepareMatch(ids,'random');assert.equal(ticket.anonymous,true);
const match=new Sim.Match(League.random(ticket.seed),{teams:League.teams(ids,ticket.seed),footballFlow:true,stadiumRules:true}),history=[];while(!match.over){history.push(null);match.next()}
offline=true;await assert.rejects(client.finishMatch(ticket,history,match.score));assert.equal(JSON.parse([...storage.values()][0]).length,1,'Failed finish remains available after reload');await client.refresh();assert.equal(panels[0].querySelector('[data-total="games"]').textContent,'0','Outage preserves last known totals');assert.equal(await client.prepareMatch(ids,'random'),null,'An unavailable counter never prevents guest play');
offline=false;events.online();for(let i=0;i<50&&JSON.parse([...storage.values()][0]).length;i++)await new Promise(resolve=>setImmediate(resolve));await client.refresh();assert.equal(panels[0].querySelector('[data-total="games"]').textContent,'1');assert.equal(panels[1].querySelector('[data-total="games"]').textContent,'1');assert.equal(JSON.parse([...storage.values()][0]).length,0);assert.equal(sql.prepare('SELECT games FROM stadium_totals').get().games,1);
await client.finishMatch(ticket,history,match.score);assert.equal(sql.prepare('SELECT games FROM stadium_totals').get().games,1);
sql.prepare('UPDATE stadium_totals SET games=1234567,touchdowns=12345,tackles=987654321').run();await client.refresh();assert.equal(panels[0].querySelector('[data-total="games"]').textContent,'1.2M');assert.equal(panels[0].querySelector('[data-total="games"]').title,'1,234,567');assert.equal(panels[0].querySelector('[data-total="touchdowns"]').textContent,'12,345');assert.equal(panels[0].querySelector('[data-total="tackles"]').textContent,'987.7M');
sandbox.document.hidden=true;const before=calls;intervals[0]();assert.equal(calls,before,'Hidden tabs do not poll');assert.equal(intervals.length,1);sql.close();console.log('PASS: browser counter consumes real API totals, formats large counts, preserves known values offline, allows offline practice and retries anonymous final results exactly once without account access.');
