import './resolve-ts.mjs';
import assert from 'node:assert/strict';
const {TURNS,COURSE_LENGTH,coursePoint,courseSpeedScale}=await import('../app/race/course.ts');
const {makeRace,makeRacer,startRace,stepRacer,START}=await import('../app/race/engine.ts');
for(const turn of TURNS){
 for(const at of [turn.start,turn.end]){const a=coursePoint(0,at-1e-5),b=coursePoint(0,at+1e-5);assert.ok(Math.hypot(a.x-b.x,a.z-b.z)<.00003,'continuous road at joins');assert.ok(Math.abs(a.heading-b.heading)<.00001,'no camera heading jump');}
 const at=(turn.start+turn.end)/2;
 for(const x of [-6,0,6]){const a=coursePoint(x,at),b=coursePoint(x,at+.0001);assert.ok(Math.abs(Math.hypot(b.x-a.x,b.z-a.z)/.0001-courseSpeedScale(x,at))<.0001,'movement scale matches curved mesh');}
 const left=coursePoint(-7,at),right=coursePoint(7,at);assert.ok(Math.abs(Math.hypot(left.x-right.x,left.z-right.z)-14)<1e-8,'constant track width');
}
assert.ok(coursePoint(0,COURSE_LENGTH).x>100,'finish is around corners, not straight ahead');
assert.equal(coursePoint(0,0).heading,0);assert.ok(coursePoint(0,70).heading>1.5);assert.ok(Math.abs(coursePoint(0,140).heading)<1e-8);
const r=makeRace('CURVES',makeRacer('me','나',10000));startRace(r,10000);const p=r.players[0];p.x=8;p.z=175;p.y=-4.9;p.vy=-6;stepRacer(r,p,{seq:1,x:0,z:0,jump:false},r.start+50);assert.equal(p.z,START);assert.equal(p.falls,1,'fall during final curve returns to start');
console.log('PASS: three connected turns, continuous camera headings, physical curve speed, constant road width, corner fall reset');
