import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createCommercialStore, freshState, mutate, today } from '../lib/commercial.mjs';
import { metrics, calendarStatus } from '../admin/commercial-utils.js';
const campaign={name:'Campaña de prueba',owner:'Equipo Peluvi',objective:'registrations',platform:'Meta Ads',currency:'USD',budget:100,target:25,status:'active',start:today(),end:'',notes:''};
function setup(){return mutate(freshState(),{action:'campaign',revision:0,data:campaign});}
test('daily reporting replaces one day, converts currency and reopens the close',()=>{
 let s=setup(),id=s.campaigns[0].id;
 const data={campaignId:id,date:today(),spend:2,rate:4000,messages:10,results:2,revenue:16000};
 s=mutate(s,{action:'day',revision:s.revision,data});
 assert.deepEqual(metrics(s.days),{spend:8000,messages:10,results:2,revenue:16000,cpr:4000,roas:2});
 s=mutate(s,{action:'close',revision:s.revision,data:{owner:campaign.owner,date:today()}});
 assert.equal(s.closes.length,1);
 s=mutate(s,{action:'day',revision:s.revision,data:{...data,results:3}});
 assert.equal(s.days.length,1);assert.equal(s.days[0].results,3);assert.equal(s.closes.length,0);
 assert.throws(()=>mutate(s,{action:'campaign',revision:s.revision,data:{...campaign,id,currency:'COP'}}),/moneda/);
});
test('invalid amounts, impossible dates, future days and stale edits rejected',()=>{
 const s=setup(),id=s.campaigns[0].id;
 assert.throws(()=>mutate(s,{action:'campaign',revision:0,data:campaign}),/Otra sesión/);
 assert.throws(()=>mutate(s,{action:'campaign',revision:1,data:{...campaign,start:'2026-02-30'}}),/Fecha/);
 for(const spend of [-1,Infinity,'3'])assert.throws(()=>mutate(s,{action:'day',revision:1,data:{campaignId:id,date:today(),spend,rate:4000,messages:1,results:1,revenue:0}}));
 assert.throws(()=>mutate(s,{action:'day',revision:1,data:{campaignId:id,date:'2099-01-01'}}),/futuro/);
});
test('calendar respects Bogotá cutoff, holidays, reporting and explicit closure',()=>{
 const s=setup();s.config.trackingStart='2026-01-01';s.campaigns[0].start='2026-01-01';
 const owner=campaign.owner,day='2026-10-08';
 assert.equal(calendarStatus(s,owner,day,new Date('2026-10-09T00:59:00Z')).status,'pending');
 assert.equal(calendarStatus(s,owner,day,new Date('2026-10-09T01:01:00Z')).status,'overdue');
 s.config.holidays=[day];assert.equal(calendarStatus(s,owner,day,new Date('2026-10-09T01:01:00Z')).status,'off');
 s.closes=[{owner,date:day,closedAt:'2026-10-09T01:02:00Z'}];
 const cell=calendarStatus(s,owner,day,new Date('2026-10-09T02:00:00Z'));assert.equal(cell.status,'closed');assert.equal(cell.late,true);
});
test('local persistence survives a new store instance and rejects concurrent overwrite',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'peluvi-commercial-'));const file=join(dir,'state.json');
 try{
 const store=createCommercialStore({file});
 const results=await Promise.allSettled([store.update({action:'campaign',revision:0,data:campaign}),store.update({action:'campaign',revision:0,data:campaign})]);
 assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
 const saved=await createCommercialStore({file}).read();assert.equal(saved.campaigns.length,1);assert.equal(saved.events.length,1);
 }finally{await rm(dir,{recursive:true,force:true});}
});
test('production never silently saves to local disk',async()=>{await assert.rejects(createCommercialStore({production:true}).read(),/Supabase/);});
