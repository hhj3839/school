import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';

const entry=process.env.REHEARSAL_URL||'http://127.0.0.1:5173';
const pages=entry==='https://hhj3839.github.io/school/';
const base=pages?'https://kkokkkok-hideout.hhj3839.chatgpt.site':entry;
const live=pages||base==='https://kkokkkok-school.vercel.app';
if(!live&&!['127.0.0.1','localhost'].includes(new URL(base).hostname))throw Error('Only localhost or the explicitly requested classroom site may be tested.');
if(pages){
  const response=await fetch(entry,{signal:AbortSignal.timeout(20000)});
  assert.equal(response.status,200,'GitHub Pages entry must load');
  const html=await response.text();
  assert.ok(html.includes(`<iframe src="${base}/"`)||['hideout','blocks','race'].every(game=>html.includes(`href="${base}/${game}" data-game="${game}"`)),'Pages must connect to the tested production server');
  assert.ok(!html.includes('vercel.app'),'Pages must not rely on Vercel');
}
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const selected=process.env.REHEARSAL_SCENARIOS?.split(',');
const reportFile=new URL('../outputs/'+(pages?'github-pages-classroom-rehearsal.json':live?'live-classroom-rehearsal.json':'classroom-rehearsal.json'),import.meta.url);
const reports=selected?JSON.parse(await readFile(reportFile,'utf8')).reports:[];
// Older reports shared their status object with cleanup. Match the measured
// request total, excluding subsequent leave requests.
for(const r of reports)r.statuses['200']=r.requests-Object.entries(r.statuses).filter(([status])=>status!=='200').reduce((sum,[,count])=>sum+count,0);

async function scenario(name,groups,durationSeconds=45){
  const sessions=[],rooms=[],stats={requests:0,retries:0,errors:0,latencies:[],statuses:{}};
  async function call(kind,body,{creating=false}={}){
    for(let attempt=0;attempt<6;attempt++){
      const start=performance.now();
      const response=await fetch(base+'/api/'+kind,{method:'POST',headers:{'Content-Type':'application/json',Origin:base},body:JSON.stringify(body),signal:AbortSignal.timeout(10000)});
      const data=await response.json();
      stats.requests++;stats.latencies.push(performance.now()-start);stats.statuses[response.status]=(stats.statuses[response.status]||0)+1;
      // Real clients reconnect after server failures. Retry only idempotent
      // state/input actions on 500; never replay create or pause blindly.
      if(response.status===503||(response.status===500&&['state','input','tick'].includes(body.action))||(creating&&response.status===429)){stats.retries++;await sleep(creating?5100:100*(attempt+1));continue;}
      if(response.status!==200){stats.errors++;throw Error(`${kind} ${body.action}: ${response.status} ${data.error}`);}
      return data;
    }
    stats.errors++;throw Error('Transient retries exhausted');
  }
  try{
    for(const [kind,count] of groups){
      const d=await call(kind,{action:'create',name:'시범 방장',attack:false,settings:{mapId:'art',maxPlayers:20,seekerCount:3,paintSeconds:300,seekSeconds:300,hideSeconds:0}},{creating:true});
      const host={kind,code:d.room.code,id:d.id,token:d.token,seq:0,known:{}};
      sessions.push(host);
      const joined=await Promise.all(Array.from({length:count-1},(_,i)=>call(kind,{action:'join',code:host.code,name:'시범 '+(i+2)})));
      for(const j of joined)sessions.push({kind,code:host.code,id:j.id,token:j.token,seq:0,known:{}});
      rooms.push({host,count});
    }
    // Prepare all lobbies before starting. Real browsers heartbeat continuously;
    // idle test clients must not lose a match while other rooms are being made.
    for(const {host} of rooms){
      const started=await call(host.kind,{...host,action:host.kind==='room'?'next':'start'});
      for(const s of sessions.filter(s=>s.code===host.code))s.round=started.room.round;
    }
    await sleep(3100);
    const startedAt=Date.now(),until=startedAt+durationSeconds*1000;
    console.log(`${name}: ${sessions.length} clients, ${rooms.length} rooms, ${durationSeconds}s`);
    const progress=setInterval(()=>console.log(`${name}: ${Math.floor((Date.now()-startedAt)/1000)}s, ${stats.requests} requests, ${stats.errors} errors`),10000);
    try{
      await Promise.all(sessions.map(async(s,index)=>{
        await sleep(index*8);
        while(Date.now()<until){
          // Four clients briefly stop sending, then recover their existing token.
          if(index%5===0&&!s.recovered&&Date.now()-startedAt>10000){await sleep(1800);const restored=await call(s.kind,{...s,action:'state'});assert.equal(restored.room.players.filter(p=>p.id===s.id).length,1);s.recovered=true;}
          const lag=[0,50,125,250][index%4];await sleep(lag);
          let body;
          if(s.kind==='room')body={...s,action:'tick',dx:index%2?.6:0,dy:.2,viewYaw:.3,viewPitch:.16,paintVersions:s.known};
          else if(s.kind==='race')body={...s,action:'input',commands:Array.from({length:6},(_,i)=>({seq:s.seq+i+1,x:index%2?.1:-.1,z:1,jump:s.seq%60===0}))};
          else body={...s,action:'input',commands:[{seq:s.seq+1,key:s.seq%3===0?'rotate':s.seq%2?'left':'right'}]};
          const d=await call(s.kind,body),p=d.room.players.find(p=>p.id===s.id);
          assert.ok(p,'participant preserved');
          assert.equal(d.room.players.length,rooms.find(r=>r.host.code===s.code).count);
          if(s.kind==='room'){assert.ok([p.x,p.y].every(Number.isFinite));s.known=Object.fromEntries(d.room.players.filter(q=>!q.hidden).map(q=>[q.id,q.paintVersion||0]));}
          else{assert.ok(p.seq>=s.seq,'acknowledgment cannot move backward');s.seq=p.seq;}
          await sleep(s.kind==='room'?300:s.kind==='race'?300:200);
        }
      }));
      for(const {host,count} of rooms){
        const paused=await call(host.kind,{...host,action:'pause'});assert.ok(paused.room.paused,JSON.stringify({kind:host.kind,phase:paused.room.phase,out:paused.room.players.map(p=>!!p.out),paused:paused.room.paused}));
        const states=await Promise.all(sessions.filter(s=>s.code===host.code).map(s=>call(s.kind,{...s,action:'state'})));
        assert.ok(states.every(d=>d.room.paused&&d.room.players.length===count),'pause shared by all clients');
        const resumed=await call(host.kind,{...host,action:'pause'});assert.equal(resumed.room.paused,0);
      }
    }finally{clearInterval(progress);}
    stats.latencies.sort((a,b)=>a-b);
    reports.push({name,clients:sessions.length,rooms:rooms.length,durationSeconds,requests:stats.requests,retries:stats.retries,errors:stats.errors,statuses:{...stats.statuses},p50ms:Math.round(stats.latencies[Math.floor(stats.latencies.length*.5)]),p95ms:Math.round(stats.latencies[Math.floor(stats.latencies.length*.95)]),maxms:Math.round(stats.latencies.at(-1)),reconnectedClients:sessions.filter(s=>s.recovered).length,sharedPauseResume:'passed'});
    console.log(JSON.stringify(reports.at(-1)));
  }finally{
    for(const s of [...sessions].reverse())try{await call(s.kind,{...s,action:'leave'});}catch(e){console.error('Cleanup: '+e.message);}
  }
}

try{
  if(!selected||selected.includes('hideout'))await scenario('20-player hideout',[['room',20]]);
  if(live&&(!selected||selected.includes('race')))await scenario('20-player race',[['race',20]]);
  if(!selected||selected.includes('blocks'))await scenario('20-player blocks, five rooms',Array.from({length:5},()=>['blocks',4]));
  if(!selected||selected.includes('mixed'))await scenario('20-player mixed games',[['room',12],['race',4],['blocks',4]]);
}finally{
  await mkdir(new URL('../outputs/',import.meta.url),{recursive:true});
  await writeFile(reportFile,JSON.stringify({testedAt:new Date().toISOString(),environment:pages?'GitHub Pages entry verified; HTTP clients test the exact embedded production server directly, no real tablet GPU or school Wi-Fi':live?'Live Vercel site and its production backend; HTTP clients only, no real tablet GPU or school Wi-Fi':'Local production Worker with local D1; HTTP clients only, no real tablet GPU or school Wi-Fi',entry,origin:base,reports},null,2));
}
