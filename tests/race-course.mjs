import './resolve-ts.mjs';
import assert from 'node:assert/strict';
const {TURNS,COURSE_LENGTH,COURSE_MAP,NARROWS,trackHalfWidth,coursePoint,courseSpeedScale}=await import('../app/race/course.ts');
const {makeRace,makeRacer,startRace,stepRacer,START,SPEED,ground}=await import('../app/race/engine.ts');
assert.equal(COURSE_LENGTH,220*4);
assert.equal(TURNS.length,12);
assert.equal(SPEED,9*1.5);
assert.deepEqual(COURSE_MAP.at(-1),coursePoint(0,COURSE_LENGTH),'map includes entire extended course');
for(const n of NARROWS){const z=n.start+2;assert.equal(trackHalfWidth(z),n.halfWidth);assert.equal(ground(0,z,0),true);assert.equal(ground(n.halfWidth+.1,z,0),false,'narrow bridge edges cause a fall');}
const speedRoom=makeRace('SPEED',makeRacer('me','나',10000));startRace(speedRoom,10000);const speedPlayer=speedRoom.players[0];stepRacer(speedRoom,speedPlayer,{seq:1,x:0,z:1,jump:false},speedRoom.start+50);assert.equal(speedPlayer.z,START+SPEED*.05);
for(const turn of TURNS){
 for(const at of [turn.start,turn.end]){const a=coursePoint(0,at-1e-5),b=coursePoint(0,at+1e-5);assert.ok(Math.hypot(a.x-b.x,a.z-b.z)<.00003,'continuous road at joins');assert.ok(Math.abs(a.heading-b.heading)<.00001,'no camera heading jump');}
 const at=(turn.start+turn.end)/2;
 for(const x of [-6,0,6]){const a=coursePoint(x,at),b=coursePoint(x,at+.0001);assert.ok(Math.abs(Math.hypot(b.x-a.x,b.z-a.z)/.0001-courseSpeedScale(x,at))<.0001,'movement scale matches curved mesh');}
 const left=coursePoint(-7,at),right=coursePoint(7,at);assert.ok(Math.abs(Math.hypot(left.x-right.x,left.z-right.z)-14)<1e-8,'constant track width');
}
assert.deepEqual(coursePoint(0,COURSE_LENGTH),coursePoint(0,0),'finish joins start exactly');
for(const x of [-6,0,6]){const a=coursePoint(x,COURSE_LENGTH-.00001),b=coursePoint(x,.00001);assert.ok(Math.hypot(a.x-b.x,a.z-b.z)<.00003,'seam is continuous');assert.ok(Math.abs(Math.sin(a.heading)-Math.sin(b.heading))<.00001,'camera direction is continuous at finish');}
const r=makeRace('CURVES',makeRacer('me','나',10000));startRace(r,10000);const p=r.players[0];p.x=8;p.z=175;p.y=-4.9;p.vy=-6;stepRacer(r,p,{seq:1,x:0,z:0,jump:false},r.start+50);assert.equal(p.z,START);assert.equal(p.falls,1,'fall during final curve returns to start');
console.log('PASS: 4x course, 50% faster movement, 12 connected turns, physical curve speed, narrow bridge collisions, full minimap and fall reset');
