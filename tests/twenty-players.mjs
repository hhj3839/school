import assert from 'node:assert/strict';
const base='http://127.0.0.1:5173';
const sessions=[];
async function call(action,extra={},session={}){const r=await fetch(base+'/api/room',{method:'POST',headers:{'Content-Type':'application/json',Origin:base,...(action==='create'&&process.env.TEACHER_KEY?{Authorization:'Bearer '+process.env.TEACHER_KEY}:{})},body:JSON.stringify({...session,action,...extra})});return {status:r.status,...await r.json()};}
const settings={paintSeconds:60,hideSeconds:0,seekSeconds:120,maxPlayers:20,seekerCount:3};
try{
 const host=await call('create',{name:'20명 테스트',settings});assert.equal(host.status,200);sessions.push({code:host.room.code,token:host.token,id:host.id});
 assert.equal((await call('next',{},sessions[0])).status,409);
 const joined=await Promise.all(Array.from({length:19},(_,i)=>call('join',{code:host.room.code,name:'테스트'+(i+2)})));for(const j of joined){assert.equal(j.status,200,JSON.stringify(j));sessions.push({code:host.room.code,token:j.token,id:j.id});}
 assert.equal((await call('join',{code:host.room.code,name:'21번째'})).status,409);
 assert.equal((await call('settings',{settings:{...settings,seekerCount:20}},sessions[0])).status,400);
 assert.equal((await call('settings',{settings},sessions[1])).status,403);
 let room=(await call('next',{},sessions[0])).room;assert.equal(room.players.filter(p=>p.role==='seeker').length,3);assert.equal(room.players.length,20);
 const start=performance.now();for(let i=0;i<3;i++){const ticks=await Promise.all(sessions.map(s=>call('tick',{dx:1,dy:0},s)));for(const t of ticks)assert.equal(t.status,200);}
 const known=Object.fromEntries(room.players.map(p=>[p.id,p.paintVersion||0]));const delta=await call('tick',{paintVersions:known},sessions[0]);assert.ok(delta.room.players.every(p=>p.paint===undefined));
 const paint={size:16384,runs:['#123456',8192,'#abcdef',8192]};assert.equal((await call('paint',{paint},sessions[4])).status,200);
 const changed=await call('state',{paintVersions:known},sessions[0]);assert.deepEqual(changed.room.players.find(p=>p.id===sessions[4].id).paint,paint);
 await call('next',{},sessions[0]);await call('leave',{},sessions[1]);assert.equal((await call('state',{},sessions[0])).room.phase,'seek','another seeker remains');
 await call('end',{},sessions[0]);await call('settings',{settings:{...settings,seekerCount:2}},sessions[0]);room=(await call('next',{},sessions[0])).room;assert.equal(room.players.filter(p=>p.role==='seeker').length,2);
 console.log(`PASS: 20 concurrent participants, 21st rejected, seeker validation/roles, 60 concurrent ticks (${Math.round(performance.now()-start)}ms including follow-up checks), paint deltas, seeker leave, next round`);
}finally{for(const s of sessions)await call('leave',{},s);}
