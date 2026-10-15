import './resolve-ts.mjs';
import assert from 'node:assert/strict';
const e=await import('../app/race/engine.ts');
const c=await import('../app/race/course.ts');
assert.equal(c.COURSE_LENGTH,880*3);assert.equal(c.COURSE_MAP.length,441,'minimap sample count is bounded');assert.equal(e.SPINNERS.length+e.GATES.length,11);
let blocked=0,windows=0;
for(const z of [...e.SPINNERS,...e.GATES]){
 assert.equal(c.trackHalfWidth(z),5);assert.equal(e.ground(6.4,z,0),false);
 for(const side of [-1,1])for(const vy of [0,9,12])for(const phase of [0,.35,.7,1.05,1.4,1.75]){
  const r=e.practiceRace('가장자리 우회',10000),p=r.players[0];p.x=side*6.4;p.z=z-12;p.vy=vy;p.y=vy?0.01:0;
  for(let i=1;i<=90&&!p.falls&&p.z<=z+11;i++)e.stepRacer(r,p,{seq:i,x:0,z:1,jump:false},r.start+phase*1000+i*e.STEP);
  assert.ok(p.falls||p.z<=z+11,'walking or jumping along the old outside lane cannot bypass a blade');blocked++;
 }
 // At least one on-road crossing window must remain at every rotating wall.
 let passes=0;
 for(let phase=0;phase<4&&passes===0;phase+=.05){
  const r=e.practiceRace('타이밍 통과',10000),p=r.players[0];p.x=4.6;p.z=z-9;
  for(let i=1;i<=60&&!p.falls&&!p.stun&&p.z<z+9;i++)e.stepRacer(r,p,{seq:i,x:0,z:1,jump:false},r.start+phase*1000+i*e.STEP);
  if(p.z>=z+9&&!p.falls&&!p.stun)passes++;
 }
 assert.ok(passes>0,'timed crossing remains possible at '+z);windows+=passes;
}
console.log(JSON.stringify({test:'3x length, bounded map, no added devices, blocked outside walking/jumps and timed crossing',blockedEdgeCases:blocked,devicesWithCrossingWindow:windows}));
