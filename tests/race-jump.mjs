import './resolve-ts.mjs';
import assert from 'node:assert/strict';
const {queueRaceInput,replayInputs}=await import('../app/race/motion.ts');
const e=await import('../app/race/engine.ts');
const queue=Array.from({length:e.INPUT_LIMIT},(_,i)=>({seq:i+1,x:0,z:1,jump:false})),input={x:.4,z:1,jump:true};
for(let i=0;i<20;i++){assert.equal(queueRaceInput(queue,input,e.INPUT_LIMIT+1),null);assert.equal(input.jump,true,'network backlog retains a tap');}
queue.splice(0,e.INPUT_LIMIT);const command=queueRaceInput(queue,input,e.INPUT_LIMIT+1);assert.equal(command.jump,true);assert.equal(input.jump,false);
const next=queueRaceInput(queue,input,e.INPUT_LIMIT+2);assert.equal(next.jump,false,'one tap is emitted exactly once');
const r=e.practiceRace('점프',10000),p=r.players[0];p.z=36;p.at=r.start;
replayInputs(r,p.id,[command]);assert.ok(p.y>0&&p.vy>0,'jump while moving predicts immediately');
const landing=e.practiceRace('착지',10000),lp=landing.players[0];lp.z=36;lp.y=.03;lp.vy=-1;
e.stepRacer(landing,lp,{seq:1,x:0,z:1,jump:true},landing.start+50);assert.equal(lp.y,0);
e.stepRacer(landing,lp,{seq:2,x:0,z:1,jump:false},landing.start+100);assert.ok(lp.y>0&&lp.vy>0,'tap just before landing is buffered');
const air=e.practiceRace('공중',10000),ap=air.players[0];ap.z=36;ap.y=2;ap.vy=0;
e.stepRacer(air,ap,{seq:1,x:0,z:0,jump:true},air.start+50);assert.ok(ap.vy<0,'no double jump');
for(let i=2;i<20;i++)e.stepRacer(air,ap,{seq:i,x:0,z:0,jump:false},air.start+i*50);
assert.equal(ap.y,0,'expired tap does not cause a later automatic jump');
console.log('PASS: backlog retains jump taps, one tap sends once, moving jump predicts immediately, 150ms landing buffer, no double/automatic jump');
