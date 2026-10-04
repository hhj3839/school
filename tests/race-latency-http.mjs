import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
const base='http://127.0.0.1:5173',sessions=[],samples=[],stats={requests:0,retries:0,errors:0};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function call(body,lag=0){
 for(let attempt=0;attempt<6;attempt++){
  await sleep(lag/2);const start=performance.now();
  const response=await fetch(base+'/api/race',{method:'POST',headers:{'Content-Type':'application/json',Origin:base},body:JSON.stringify(body),signal:AbortSignal.timeout(10000)});
  const data=await response.json();samples.push(performance.now()-start);stats.requests++;await sleep(lag/2);
  if(response.status===503){stats.retries++;await sleep(100+attempt*100);continue;}
  if(response.status!==200){stats.errors++;throw new Error(response.status+' '+data.error);}
  return data;
 }
 stats.errors++;throw new Error('retries exhausted');
}
try{
 const made=await call({action:'create',name:'지연 검사'});sessions.push({code:made.room.code,token:made.token,id:made.id});
 for(let i=1;i<20;i++){const d=await call({action:'join',code:made.room.code,name:'검사 '+i});sessions.push({code:made.room.code,token:d.token,id:d.id});}
 const started=await call({action:'start',...sessions[0]});await sleep(3100);
 const end=Date.now()+30000,accepted=[];
 await Promise.all(sessions.map(async(s,index)=>{let ack=0;const lag=[0,100,250,500][index%4];
  while(Date.now()<end){const commands=Array.from({length:6},(_,i)=>({seq:ack+i+1,x:Math.sin(index)*.15,z:1,jump:false}));
   const d=await call({action:'input',...s,round:started.room.round,commands},lag),p=d.room.players.find(p=>p.id===s.id);
   assert.ok(p.seq>=ack&&p.seq<=ack+6);assert.ok([p.x,p.y,p.z].every(Number.isFinite));ack=p.seq;await sleep(300);
  }assert.ok(ack>30);accepted.push(ack);
 }));
 samples.sort((a,b)=>a-b);const report={environment:'Local HTTP server, 20 simulated clients; no real tablet rendering',durationSeconds:30,injectedRoundTripDelayMs:[0,100,250,500],...stats,p50ServerRoundTripMs:Math.round(samples[Math.floor(samples.length*.5)]),p95ServerRoundTripMs:Math.round(samples[Math.floor(samples.length*.95)]),minAcceptedInputs:Math.min(...accepted)};
 await writeFile(new URL('../../work/race-latency-report.json',import.meta.url),JSON.stringify(report,null,2));console.log(JSON.stringify(report));assert.equal(stats.errors,0);
}finally{for(const s of sessions)await call({action:'leave',...s}).catch(()=>{});}
