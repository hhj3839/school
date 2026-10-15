import './resolve-ts.mjs';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readdirSync,writeFileSync} from 'node:fs';
const {makeBlockPlayer,makeBlockRoom,startBlocks}=await import('../app/blocks/engine.ts');
const {makeRace,makeRacer,startRace}=await import('../app/race/engine.ts');
const stairLoad=process.argv[6]==='stairs';
const kind=process.argv[2]||'blocks',label=process.argv[3]||'baseline',interval=Number(process.argv[4]||(kind==='blocks'?100:300)),duration=Number(process.argv[5]||15000);
assert.ok(['blocks','race'].includes(kind));
const dir='.wrangler/state/v3/d1/miniflare-D1DatabaseObject',file=readdirSync(dir).find(n=>n.endsWith('.sqlite')&&n!=='metadata.sqlite');assert.ok(file);
const db=new DatabaseSync(dir+'/'+file),sessions=[],codes=[];db.exec('PRAGMA busy_timeout=5000');
const origin='http://127.0.0.1:5173';
// Fixture setup is local only. The measured requests use the real HTTP handlers.
try{
 for(let roomIndex=0;roomIndex<5;roomIndex++){
  const code='QA'+String.fromCharCode(65+roomIndex)+'T23';assert.equal(db.prepare('SELECT code FROM rooms WHERE code=?').get(code),undefined,'do not overwrite an existing room');
  const now=Date.now(),players=Array.from({length:4},(_,i)=>{const p=kind==='blocks'?makeBlockPlayer(crypto.randomUUID(),'부하 점검 '+i,now,42):makeRacer(crypto.randomUUID(),'부하 점검 '+i,now,i);p.token=crypto.randomUUID();return p;});
  const room=kind==='blocks'?makeBlockRoom(code,players[0],false):makeRace(code,players[0]);room.players=players;if(kind==='blocks')startBlocks(room,now-4000,42);else startRace(room,now-4000);
  if(stairLoad&&kind==='race')for(const p of room.players){p.z=695;p.y=1.1;p.safeZ=687;}
  db.prepare('INSERT INTO rooms(code,state,version,expires) VALUES (?,?,0,?)').run(code,JSON.stringify(room),now+120000);codes.push(code);
  sessions.push(...room.players.map(p=>({code,id:p.id,token:p.token,round:room.round})));
 }
 const samples=[],errors=[],bytes=[];let accepted=0;
 await Promise.all(sessions.map(async(s,index)=>{let ack=0,next=performance.now();const end=next+duration;
  while(performance.now()<end){const commands=kind==='blocks'?Array.from({length:Math.max(1,Math.round(interval/100))},(_,i)=>({seq:ack+i+1,key:(ack+i)%2?'right':'left'})):Array.from({length:6},(_,i)=>({seq:ack+i+1,x:0,z:stairLoad?0:1,jump:i===0&&ack%24===0}));
   const at=performance.now();try{const response=await fetch(origin+'/api/'+kind,{method:'POST',headers:{'Content-Type':'application/json',Origin:origin},body:JSON.stringify({action:'input',...s,commands}),signal:AbortSignal.timeout(8000)});const raw=await response.text();samples.push(performance.now()-at);bytes.push(Buffer.byteLength(raw));const data=JSON.parse(raw);if(!response.ok)errors.push(response.status);else{const p=data.room.players.find(p=>p.id===s.id);assert.ok(p.seq>=ack);accepted+=p.seq-ack;ack=p.seq;}}catch(e){errors.push(e.message);}
   next+=interval;await new Promise(resolve=>setTimeout(resolve,Math.max(0,next-performance.now())));
  }
 }));
 samples.sort((a,b)=>a-b);const report={kind,label,rooms:5,players:20,durationMs:duration,inputIntervalMs:interval,requests:samples.length,acceptedCommands:accepted,errors:errors.length,errorExamples:errors.slice(0,3),p50ms:Math.round(samples[Math.floor(samples.length*.5)]||0),p95ms:Math.round(samples[Math.floor(samples.length*.95)]||0),responseBytes:bytes.reduce((a,b)=>a+b,0)};writeFileSync('outputs/load-'+kind+'-'+label+'.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));assert.equal(errors.length,0);assert.ok(accepted>sessions.length*10);
}finally{for(const code of codes)db.prepare('DELETE FROM rooms WHERE code=?').run(code);db.close();}
