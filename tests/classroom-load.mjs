import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
const base='http://127.0.0.1:5173',sessions=[],stats={requests:0,errors:0,bytes:0,latencies:[],statuses:{}};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function call(action,extra={},s={}){const began=performance.now();const response=await fetch(base+'/api/room',{method:'POST',headers:{'Content-Type':'application/json',Origin:base},body:JSON.stringify({...s,action,...extra}),signal:AbortSignal.timeout(15000)});const raw=await response.text();return {status:response.status,data:JSON.parse(raw),ms:performance.now()-began,bytes:Buffer.byteLength(raw)};}
try{
 for(let index=0;index<5;index++){
  let made=await call('create',{name:'부하 검사 '+index,settings:{mapId:['art','amusement','forest','ocean','museum'][index],maxPlayers:20,seekerCount:3,paintSeconds:300,seekSeconds:300,hideSeconds:0}});
  if(made.status===429){await sleep(5100);made=await call('create',{name:'부하 검사 '+index,settings:{mapId:['art','amusement','forest','ocean','museum'][index],maxPlayers:20,seekerCount:3,paintSeconds:300,seekSeconds:300,hideSeconds:0}});}
  assert.equal(made.status,200);const host={code:made.data.room.code,token:made.data.token,id:made.data.id};sessions.push(host);
  for(const joined of await Promise.all(Array.from({length:19},(_,i)=>call('join',{code:host.code,name:'검사 '+i})))){assert.equal(joined.status,200);sessions.push({code:host.code,token:joined.data.token,id:joined.data.id});}
  await call('next',{},host);await call('next',{},host);console.log('Prepared room '+(index+1)+'/5');
 }
 const started=Date.now(),duration=60000,until=started+duration;
 const progress=setInterval(()=>console.log(JSON.stringify({elapsedSeconds:Math.round((Date.now()-started)/1000),requests:stats.requests,errors:stats.errors})),10000);
 try{await Promise.all(sessions.map(async(s,i)=>{let known={};await sleep(i*7);while(Date.now()<until){const active=i%4===0,turning=i%20<3,angle=((Date.now()-started)/8000)%(2*Math.PI);try{const r=await call('tick',{dx:active?Math.sin(angle):0,dy:active?Math.cos(angle):0,viewYaw:turning?angle:0,viewPitch:.16,paintVersions:known},s);stats.requests++;stats.bytes+=r.bytes;stats.latencies.push(r.ms);stats.statuses[r.status]=(stats.statuses[r.status]||0)+1;if(r.status!==200)stats.errors++;if(r.data.room)known=Object.fromEntries(r.data.room.players.filter(p=>!p.hidden).map(p=>[p.id,p.paintVersion||0]));}catch{stats.requests++;stats.errors++;}await sleep(active||turning?300:1000);}}));}finally{clearInterval(progress);}
 const sorted=stats.latencies.sort((a,b)=>a-b),report={environment:'local development server; HTTP clients without tablet rendering',rooms:5,clients:100,durationSeconds:60,requests:stats.requests,errors:stats.errors,statuses:stats.statuses,p50ms:Math.round(sorted[Math.floor(sorted.length*.5)]),p95ms:Math.round(sorted[Math.floor(sorted.length*.95)]),maxms:Math.round(sorted.at(-1)),responseMiB:Math.round(stats.bytes/1048576*10)/10};
 console.log(JSON.stringify(report));await writeFile(new URL('../../work/load-report.json',import.meta.url),JSON.stringify(report,null,2));assert.equal(stats.errors,0);
}finally{for(const s of sessions)try{await call('leave',{},s);}catch{}}
