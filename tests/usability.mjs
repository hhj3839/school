import './resolve-ts.mjs';
import assert from 'node:assert/strict';
const {coverContains,coverOverlaps}=await import('../app/cover-layout.ts');
const {stepHeight,makePlayer,makeRoom,DEFAULT_SETTINGS,mapCover,visibleLine}=await import('../app/game.ts');
const planet=mapCover('museum').find(o=>o.kind==='planet'),ring=mapCover('museum').find(o=>o.kind==='ring');
assert.ok(coverContains(planet,planet.x+planet.w/2,planet.y+planet.h/2,planet.base+planet.height/2));
assert.equal(coverContains(planet,planet.x+1,planet.y+1,planet.base+.01),false,'empty sphere corners remain clear');
const x=ring.x+ring.w/2,y=ring.y+ring.h/2,z=ring.base+ring.height/2;
assert.equal(coverContains(ring,x,y,z),false,'ring has a real hole');
assert.equal(coverOverlaps(ring,x,y,ring.base,.2),false,'body fits through ring opening');
assert.ok(coverContains(ring,x+ring.w*.4,y,z),'ring rim blocks');
const p=makePlayer('p','p',0),r=makeRoom('TEST22',p);r.settings={...DEFAULT_SETTINGS};r.phase='paint';
assert.equal(stepHeight(r,p,1,1000),true);assert.ok(Math.abs(p.elevation-.15)<1e-9);
assert.equal(stepHeight(r,p,1,1100),false,'rapid taps are limited');
assert.equal(stepHeight(r,p,999,1300),false);
assert.equal(stepHeight(r,p,-1,1300),true);assert.equal(p.elevation,0);
for(const change of [{paused:1},{phase:'result'}]){const blocked={...r,...change};assert.equal(stepHeight(blocked,p,1,2000),false);}
p.role='seeker';assert.equal(stepHeight(r,p,1,2000),false);p.role='hider';p.locked=true;assert.equal(stepHeight(r,p,1,2000),false);
console.log('PASS: curved cover corners, ring opening/rim, 15 cm step, cooldown, direction validation, pause/result/seeker/lock guards');
const base='http://127.0.0.1:5173';let session;
async function call(action,extra={}){const response=await fetch(base+'/api/room',{method:'POST',headers:{'Content-Type':'application/json',Origin:base,...(action==='create'&&process.env.TEACHER_KEY?{Authorization:'Bearer '+process.env.TEACHER_KEY}:{})},body:JSON.stringify({...session,action,...extra})});return {status:response.status,...await response.json()};}
try{const made=await call('create',{name:'미세 조작 확인'});assert.equal(made.status,200);session={code:made.room.code,token:made.token};const stepped=await call('heightStep',{direction:1});assert.equal(stepped.status,200);assert.ok(Math.abs(stepped.room.players[0].elevation-.15)<1e-9);assert.equal((await call('heightStep',{direction:0})).status,409);console.log('PASS: multiplayer height step persists and rejects invalid direction');}finally{if(session)await call('leave');}
