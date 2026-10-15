import './resolve-ts.mjs';
import assert from 'node:assert/strict';
const e=await import('../app/race/engine.ts'),c=await import('../app/race/course.ts');
assert.equal(c.COURSE_LENGTH,2640);assert.equal(c.COURSE_MAP.length,441);
for(let z=0;z<=c.COURSE_LENGTH;z+=5)assert.equal(c.trackHalfWidth(z),7,'uniform road width');
let hitCases=0,windows=0;
for(const z of [...e.SPINNERS,...e.GATES]){
 for(const side of [-1,1])for(const phase of [0,.5,1,1.5]){const r=e.practiceRace('가장자리',10000),p=r.players[0];p.x=side*6.4;p.z=z;for(let i=1;i<=70&&!p.stun;i++)e.stepRacer(r,p,{seq:i,x:0,z:0,jump:false},r.start+phase*1000+i*e.STEP);assert.ok(p.stun,'edge is not permanently clear of rotating blades');hitCases++;}
 let passes=0;for(let phase=0;phase<6&&!passes;phase+=.025){const r=e.practiceRace('통과',10000),p=r.players[0];p.x=6.6;p.z=z-10;for(let i=1;i<=70&&!p.falls&&!p.stun&&p.z<z+10;i++)e.stepRacer(r,p,{seq:i,x:0,z:1,jump:false},r.start+phase*1000+i*e.STEP);if(p.z>=z+10&&!p.falls&&!p.stun)passes++;}assert.ok(passes,'timed passage exists at '+z);windows+=passes;
}
console.log(JSON.stringify({test:'uniform 14-wide road, full-width rotating hazard and timed passage',hitCases,devicesWithCrossingWindow:windows}));
