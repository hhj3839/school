import './resolve-ts.mjs';
import assert from 'node:assert/strict';
const e=await import('../app/race/engine.ts');
let cases=0;
for(const [walls,angle] of [[e.GATES,e.gateAngle],[e.SPINNERS,e.spinnerAngle]])for(const z of walls)for(const side of [-1,1])for(const height of [0,2.2,3.8])for(const t of [.05,1.25,2.5]){
 const r=e.practiceRace('회전벽 낙하',10000),p=r.players[0],a=angle(t,z),cs=Math.cos(a),sn=Math.sin(a),at=r.start+t*1000;
 p.x=cs*3*side-sn*.2*side;p.z=z+sn*3*side+cs*.2*side;p.y=height;p.safeZ=0;
 e.stepRacer(r,p,{seq:1,x:0,z:0,jump:false},at);
 assert.ok(Math.abs(p.pushVX)>=36,'every hit launches sideways');
 const direction=Math.sign(p.pushVX);let leftRoad=false;
 for(let i=1;i<=80&&!p.falls;i++){
  e.stepRacer(r,p,{seq:i+1,x:-direction,z:1,jump:true},at+i*e.STEP);
  leftRoad ||= Math.abs(p.x)>7;
 }
 assert.ok(leftRoad,'hit leaves the road despite counter-steering');assert.equal(p.falls,1,'hit guarantees a fall');
 assert.equal(p.z,0,'returns to last safe point');assert.equal(p.pushVX,0);assert.equal(p.y,0);
 const recovered={...p};e.stepRacer(r,p,{seq:100,x:1,z:1,jump:true},p.respawnUntil-1);assert.deepEqual(p,recovered,'recovery countdown blocks movement');
 cases++;
}
{
 const r=e.practiceRace('벽 위',10000),p=r.players[0];p.z=e.SPINNERS[0];p.y=e.WALL_HEIGHT+1;
 e.stepRacer(r,p,{seq:1,x:0,z:0,jump:false},r.start+50);assert.equal(p.pushVX,0,'above the wall is clear');
}
console.log(`PASS: ${cases} rotating-wall hits cause unavoidable falls and safe recovery, including counter-steering and jumping`);
