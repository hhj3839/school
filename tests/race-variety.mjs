import './resolve-ts.mjs';
import assert from 'node:assert/strict';
const e=await import('../app/race/engine.ts');
const o=await import('../app/race/obstacles.ts');
const phaseTime=(phase,offset)=>(phase-offset+60)%6;
for(const tile of o.FADING_TILES){
 const z=(tile.start+tile.end)/2,on=phaseTime(2,tile.offset),off=phaseTime(5,tile.offset);
 assert.equal(e.surfaceHeight(6.9,z,on),0);assert.equal(e.surfaceHeight(7.1,z,on),null);
 assert.equal(e.surfaceHeight(0,z,off),null);
 assert.equal(e.surfaceHeight(0,z,off+6),null);
 assert.equal(e.surfaceHeight(0,z,on+6),0,'next player gets restored platform');
 assert.ok(o.fadingState(phaseTime(4,tile.offset),tile).warning);
 const r=e.practiceRace('fall',10000),p=r.players[0];p.z=z;p.safeZ=tile.start-4;
 const start=phaseTime(4.7,tile.offset);
 for(let i=1;i<=30&&!p.falls;i++)e.stepRacer(r,p,{seq:i,x:0,z:0,jump:false},r.start+start*1000+i*e.STEP);
 assert.equal(p.falls,1,'disappearance removes physical support');
}
for(const z of o.SHUTTERS){
 for(const x of [-6.8,0,6.8])for(const [phase,blocked] of [[1,true],[4,false]]){
  const r=e.practiceRace('door',10000),p=r.players[0];p.x=x;p.z=z-1.3;
  const t=phaseTime(phase,z*.017);
  for(let i=1;i<=6;i++)e.stepRacer(r,p,{seq:i,x:0,z:1,jump:false},r.start+t*1000+i*e.STEP);
  assert.equal(p.z<z,blocked,'door blocks edges when closed and allows passage when open');
 }
}
for(const punch of o.PUNCHES){
 const r=e.practiceRace('punch',10000),p=r.players[0];p.z=punch.z;p.x=0;
 const t=phaseTime(3.75,punch.z*.019);
 for(let i=1;i<=12&&!p.stun;i++)e.stepRacer(r,p,{seq:i,x:0,z:0,jump:false},r.start+t*1000+i*e.STEP);
 assert.ok(p.stun>0);assert.ok(p.pushVX*punch.side<0,'punch pushes away from its source');
 assert.ok(o.punchState(phaseTime(3,punch.z*.019),punch.z).warning);
}
console.log('PASS: reusable fading platforms, warning, actual falls, full-width shutters and punch collisions');
