import './resolve-ts.mjs';
import assert from 'node:assert/strict';
const e=await import('../app/race/engine.ts');
const {STAIRCASES,stairTreads,stairHeight}=await import('../app/race/stairs.ts');
const {replayInputs}=await import('../app/race/motion.ts');
const treads=stairTreads();
for(const stair of STAIRCASES){
 const end=stair.start+stair.depth*stair.heights.length;
 const walk=e.practiceRace('걷기',10000),w=walk.players[0];w.z=stair.start-1;
 for(let i=1;i<=150;i++)e.stepRacer(walk,w,{seq:i,x:0,z:1,jump:false},walk.start+i*e.STEP);
 assert.ok(w.z<stair.start);assert.equal(w.y,0,'walking into a step never lifts a player');
 const r=e.practiceRace('계단 점프',10000),p=r.players[0];p.z=stair.start-2;let jumps=0;const landed=new Set();
 for(let i=1;i<=250&&p.z<end+8;i++){
  const floor=e.surfaceHeight(p.x,p.z,e.raceTime(r,r.start+i*e.STEP));
  const jump=treads.some(t=>t.up&&t.start>=p.z&&t.start-p.z<1.5)&&floor!==null&&Math.abs(p.y-floor)<.001&&p.vy<=0;
  if(jump)jumps++;e.stepRacer(r,p,{seq:i,x:0,z:1,jump},r.start+i*e.STEP);
  if(p.vy===0&&p.y>0)landed.add(p.y);
 }
 assert.ok(p.z>end,'consecutive button taps traverse staircase');assert.equal(p.falls,0);assert.ok(jumps>=3);for(const height of [1.1,2.2,3.3])assert.ok(landed.has(height),'lands on each rising tread '+height);assert.equal(p.y,0,'returns to flat ground on the other side');
 for(const height of [1.1,2.2,3.3]){
  const index=stair.heights.indexOf(height),s=e.practiceRace('위에서 점프',10000),sp=s.players[0];sp.z=stair.start+(index+.5)*stair.depth;sp.y=height;
  for(let i=1;i<=30;i++)e.stepRacer(s,sp,{seq:i,x:0,z:0,jump:false},s.start+i*e.STEP);assert.equal(sp.y,height,'standing stays on elevated ground');
  e.stepRacer(s,sp,{seq:31,x:0,z:0,jump:true},s.start+31*e.STEP);assert.ok(sp.y>height&&sp.vy>0,'jump works from elevated ground');
 }
 for(let z=stair.start;z<end;z+=1)assert.equal(e.safeRecoveryPoint(z),false,'fall recovery never spawns under stairs');
 const falling=e.practiceRace('옆으로 낙하',10000),fp=falling.players[0];fp.z=stair.start+30;fp.x=8;fp.y=3.3;fp.safeZ=stair.start-3;
 for(let i=1;i<=90&&!fp.falls;i++)e.stepRacer(falling,fp,{seq:i,x:0,z:0,jump:false},falling.start+i*e.STEP);
 assert.equal(fp.falls,1);assert.equal(fp.z,stair.start-3);assert.equal(fp.y,0);
}
const r=e.practiceRace('서버 재현',10000),p=r.players[0];p.z=STAIRCASES[0].start-1;p.at=r.start;const copy=structuredClone(r),commands=Array.from({length:24},(_,i)=>({seq:i+1,x:0,z:1,jump:i===0}));for(const c of commands){const q=copy.players[0];q.at+=e.STEP;e.stepRacer(copy,q,c,q.at);}replayInputs(r,p.id,commands);assert.deepEqual(r,copy,'network replay uses identical elevated collisions');
assert.equal(stairHeight(0),0);
console.log('PASS: 2 staircases, walking blocked, 3 rising landings, jumps from each height, descent, side falls, safe recovery and deterministic replay');
