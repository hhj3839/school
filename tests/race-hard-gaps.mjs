import './resolve-ts.mjs';
import assert from 'node:assert/strict';
const e=await import('../app/race/engine.ts');
const gaps=e.GAPS.filter(([a])=>!e.RAFTS.some(([r])=>r===a));
for(const [a,b] of gaps){
 assert.equal(b-a,9);
 const room=e.practiceRace('점프 구간',10000),p=room.players[0];p.z=a-2;
 for(let i=1;i<=22&&p.z<b+1&&!p.falls;i++)e.stepRacer(room,p,{seq:i,x:0,z:1,jump:i===1},room.start+i*50);
 assert.ok(p.z>b&&p.y>=0&&!p.falls,'each wider gap is reachable by a timed jump');
 const walking=e.practiceRace('걷기',10000),w=walking.players[0];w.z=a-2;
 for(let i=1;i<=50&&!w.falls;i++)e.stepRacer(walking,w,{seq:i,x:0,z:1,jump:false},walking.start+i*50);
 assert.equal(w.falls,1,'walking below the opposite ledge cannot snap back onto the road');
}
console.log('PASS: all six 9m gaps are jumpable, and require jumping rather than walking across');
