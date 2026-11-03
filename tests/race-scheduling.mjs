import './resolve-ts.mjs';
import assert from 'node:assert/strict';
const {FrameLoop}=await import('../app/race/frame-loop.ts');
const {predictionRoom}=await import('../app/race/motion.ts');
const {makeRace,makeRacer,startRace,stepRacer,FINISH}=await import('../app/race/engine.ts');
const {CHECKPOINTS}=await import('../app/race/course.ts');

let id=0,resets=0,draws=0;const callbacks=new Map();
const loop=new FrameLoop(fn=>{callbacks.set(++id,fn);return id;},key=>callbacks.delete(key),()=>draws++,()=>resets++);
const frame=time=>{const [key,fn]=callbacks.entries().next().value;callbacks.delete(key);fn(time);};
loop.start();loop.start();assert.equal(callbacks.size,1);frame(16);assert.equal(draws,1);
loop.stop();assert.equal(callbacks.size,0);loop.start();frame(10000);
assert.equal(draws,2,'resume draws once, without catch-up burst');assert.equal(resets,2);
loop.stop();loop.stop();assert.equal(callbacks.size,0);

const room=makeRace('TEST',makeRacer('local','local',0));
room.players=Array.from({length:20},(_,i)=>makeRacer(String(i),'bot',0));startRace(room,10000);
const before=structuredClone(room),next=predictionRoom(room,'0'),expected=structuredClone(room);
assert.equal(next.players[1],room.players[1]);assert.notEqual(next.players[0],room.players[0]);
for(let i=0;i<100;i++){
 const command={seq:i+1,x:.2,z:1,jump:i%10===0};
 stepRacer(next,next.players[0],command,next.start+(i+1)*50);
 stepRacer(expected,expected.players[0],command,expected.start+(i+1)*50);
}
assert.deepEqual(next,expected);assert.deepEqual(room,before,'React snapshot must stay immutable');
const finish=predictionRoom(room,'0');Object.assign(finish.players[0],{z:FINISH-.1,x:0,checkpoint:CHECKPOINTS.length});
stepRacer(finish,finish.players[0],{seq:1,x:0,z:1,jump:false},finish.start+50);
assert.equal(finish.finishers.length,1);assert.equal(room.finishers.length,0,'finisher append must not mutate old room');
console.log('PASS: lifecycle cancellation/idempotency, no resume burst, 20-player prediction equivalence and immutable finishers');

for(const [name,copy] of [['structuredClone',r=>structuredClone(r)],['predictionRoom',r=>predictionRoom(r,'0')]]){
 const begin=performance.now();for(let i=0;i<10000;i++)copy(room);
 console.log(`${name}: ${(performance.now()-begin).toFixed(2)} ms / 10000 copies`);
}
