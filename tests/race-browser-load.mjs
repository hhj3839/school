// A browser owns the test room; 19 HTTP clients keep all 20 avatars active.
// Usage: node tests/race-browser-load.mjs <origin> <test-room-code> [seconds]
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
const [base,code,seconds='120']=process.argv.slice(2);
assert.ok(['http://127.0.0.1:5173','https://kkokkkok-school.vercel.app'].includes(base));
assert.match(code||'',/^[A-Z2-9]{6}$/);
const duration=Number(seconds);assert.ok(duration>=30&&duration<=360);
const sessions=[],latencies=[],statuses={};let inputs=0,errors=0;
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function call(action,session={},extra={}){
 const start=performance.now();
 const response=await fetch(base+'/api/race',{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:JSON.stringify({code,...session,action,...extra}),signal:AbortSignal.timeout(15000)});
 latencies.push(performance.now()-start);statuses[response.status]=(statuses[response.status]||0)+1;
 const data=await response.json();assert.equal(response.status,200,`${action}: ${response.status} ${data.error||''}`);return data;
}
try{
 for(let i=0;i<19;i++){const d=await call('join',{}, {name:'성능봇 '+(i+1)});sessions.push({id:d.id,token:d.token,seq:0});}
 console.log('READY: 19 bots joined; start the 20-player room in the browser');
 const deadline=Date.now()+180000;let state;
 do{state=await call('state',sessions[0]);if(state.room.phase==='playing')break;await sleep(1000);}while(Date.now()<deadline);
 assert.equal(state.room.phase,'playing','browser host must start the match');
 const end=Date.now()+duration*1000;
 await Promise.all(sessions.map(async(s,index)=>{
  await sleep(index*12);
  while(Date.now()<end){
   const d=await call('input',s,{round:state.room.round,commands:Array.from({length:6},(_,i)=>({seq:s.seq+i+1,x:0,z:0,jump:s.seq%120===0}))});
   assert.equal(d.room.players.length,20);const p=d.room.players.find(p=>p.id===s.id);assert.ok(p.seq>=s.seq);inputs+=p.seq-s.seq;s.seq=p.seq;
   await sleep(300);
  }
 }));
}catch(error){errors++;throw error;}finally{
 // Only remove the bots created here. The browser host leaves through the UI.
 for(const s of sessions)try{await call('leave',s);}catch(error){errors++;console.error('Cleanup failed:',error.message);}
 latencies.sort((a,b)=>a-b);
 const report={origin:base,bots:sessions.length,browserPlayers:1,durationSeconds:duration,requests:latencies.length,statuses,errors,acceptedCommands:inputs,p95ms:Math.round(latencies[Math.floor(latencies.length*.95)]||0)};
 console.log(JSON.stringify(report));await writeFile(new URL('../outputs/race-browser-load.json',import.meta.url),JSON.stringify(report,null,2));
 if(errors)process.exitCode=1;
}
