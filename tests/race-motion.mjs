import './resolve-ts.mjs';
import assert from 'node:assert/strict';
const {sweptBlade}=await import('../app/race/collision.ts');
const {replayInputs,clockOffset}=await import('../app/race/motion.ts');
const e=await import('../app/race/engine.ts');
assert.ok(sweptBlade(5,.8,5,-.8,-.135,0,6),'detect crossing when both endpoints are outside blade');
assert.equal(sweptBlade(8,2,8,-2,-.135,0,6),null,'outside blade length stays clear');
const r=e.practiceRace('prediction',10000),p=r.players[0];p.x=3;p.z=20;
const expected=structuredClone(r),commands=Array.from({length:8},(_,i)=>({seq:i+1,x:.1,z:1,jump:false}));
for(const c of commands){const q=expected.players[0];q.at+=50;e.stepRacer(expected,q,c,q.at);}
replayInputs(r,p.id,commands);assert.deepEqual(r,expected,'replay uses same tick times and collision state as authority');
let offset=clockOffset(0,1000,true);assert.equal(offset,1000);
for(const sample of [1500,700,1800,900]){const next=clockOffset(offset,sample,false);assert.ok(Math.abs(next-offset)<=20);offset=next;}
console.log('PASS: swept crossing, endpoint clearance, deterministic input replay and bounded network clock correction');
