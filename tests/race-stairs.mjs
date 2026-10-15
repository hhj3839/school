import './resolve-ts.mjs';
import assert from 'node:assert/strict';
const e=await import('../app/race/engine.ts');
const {STAIRCASES,stairTreads,stairX,stairSupport}=await import('../app/race/stairs.ts');
const {replayInputs}=await import('../app/race/motion.ts');
for(const tread of stairTreads()){
 const z=(tread.start+tread.end)/2,r=e.practiceRace('운반',10000),p=r.players[0];p.z=z;p.x=stairX(0,tread);p.y=tread.height;
 for(let i=1;i<=50;i++)e.stepRacer(r,p,{seq:i,x:0,z:0,jump:false},r.start+i*e.STEP);
 assert.equal(p.y,tread.height,'standing racer stays on moving tread');assert.ok(Math.abs(p.x-stairX(2.5,tread))<.001,'deck carries feet laterally');
 e.stepRacer(r,p,{seq:51,x:0,z:0,jump:true},r.start+51*e.STEP);assert.ok(p.y>tread.height);
 for(const t of [0,.4,1,3]){const x=stairX(t,tread);assert.ok(stairSupport(x+6.9,z,t));assert.equal(stairSupport(x+7.1,z,t),null,'rendered and collidable width is 14');}
}
for(const stair of STAIRCASES){
 const r=e.practiceRace('틈 추락',10000),p=r.players[0];p.z=stair.start+11;p.y=1.1;p.safeZ=stair.start-3;assert.equal(e.surfaceHeight(0,p.z,0),null,'no road hidden below stair gaps');for(let i=1;i<=100&&!p.falls;i++)e.stepRacer(r,p,{seq:i,x:0,z:0,jump:false},r.start+i*e.STEP);assert.equal(p.falls,1);assert.equal(p.z,stair.start-3);assert.equal(p.y,0);
 const walk=e.practiceRace('걷기',10000),w=walk.players[0];w.z=stair.start-1;for(let i=1;i<=100;i++)e.stepRacer(walk,w,{seq:i,x:0,z:1,jump:false},walk.start+i*e.STEP);assert.ok(w.z<stair.start,'cannot walk onto elevated first step');
}
const r=e.practiceRace('재현',10000),p=r.players[0],tread=stairTreads()[0];p.z=(tread.start+tread.end)/2;p.y=tread.height;p.x=stairX(0,tread);p.at=r.start;const copy=structuredClone(r),commands=Array.from({length:24},(_,i)=>({seq:i+1,x:0,z:0,jump:i===10}));for(const command of commands){const q=copy.players[0];q.at+=e.STEP;e.stepRacer(copy,q,command,q.at);}replayInputs(r,p.id,commands);assert.deepEqual(r,copy,'prediction and server agree on moving platform coordinates');
e.pauseRace(r,r.start+1500,true);const frozen=structuredClone(r);e.stepRacer(r,p,{seq:100,x:1,z:1,jump:true},r.start+1600);assert.deepEqual(r,frozen,'pause freezes platform interaction');
console.log('PASS: 10 moving treads, matching 14-wide collision/render data, carry, elevated jump, real gap falls, recovery, walking blocked, replay and pause');
