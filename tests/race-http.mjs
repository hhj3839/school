import assert from 'node:assert/strict';
const url='http://127.0.0.1:5173/api/race',samples=[],sessions=[];
async function call(body){const at=performance.now();const response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json',Origin:'http://127.0.0.1:5173'},body:JSON.stringify(body),signal:AbortSignal.timeout(8000)});const data=await response.json();samples.push(performance.now()-at);assert.equal(response.status,200,JSON.stringify(data));return data;}
try{
 const created=await call({action:'create',name:'HTTP 방장'});sessions.push({code:created.room.code,token:created.token,id:created.id});
 for(let i=1;i<20;i++){const joined=await call({action:'join',code:created.room.code,name:'HTTP '+i});sessions.push({code:created.room.code,token:joined.token,id:joined.id});}
 const start=await call({action:'start',...sessions[0]});
 await Promise.all(sessions.map(async s=>{let ack=0;const end=Date.now()+30000;while(Date.now()<end){const commands=Array.from({length:6},(_,i)=>({seq:ack+i+1,x:0,z:1,jump:false}));const d=await call({action:'input',...s,round:start.room.round,commands});const p=d.room.players.find(p=>p.id===s.id);assert.ok(p.seq>=ack&&p.seq<=ack+6);ack=p.seq;await new Promise(resolve=>setTimeout(resolve,300));}assert.ok(ack>30,'continuous inputs accepted');}));
 samples.sort((a,b)=>a-b);console.log(JSON.stringify({test:'20 simultaneous players, local HTTP, 30 seconds',requests:samples.length,errors:0,p95ms:Math.round(samples[Math.floor(samples.length*.95)])}));
}finally{for(const s of sessions)await call({action:'leave',...s}).catch(()=>{});}
