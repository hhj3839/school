import './resolve-ts.mjs';
import assert from 'node:assert/strict';
const e=await import('../app/race/engine.ts');
for(const [z,angle] of [[e.GATES[0],e.gateAngle],[e.SPINNERS[0],e.spinnerAngle]])for(const side of [-1,1])for(const height of [0,2.2,3.8]){
 const r=e.practiceRace('회전 밀기',10000),p=r.players[0],t=.05,a=angle(t,z),cs=Math.cos(a),sn=Math.sin(a);
 p.x=cs*3*side-sn*.2*side;p.z=z+sn*3*side+cs*.2*side;p.y=height;
 const ox=p.x,oz=p.z;e.stepRacer(r,p,{seq:1,x:0,z:0,jump:false},r.start+50);
 assert.ok(((p.x-ox)*-sn+(p.z-oz)*cs)*side>0,'both ends push in the local rotation direction');
 assert.ok((p.pushVX*-sn+p.pushVZ*cs)*side>0,'momentum follows rotation');
 for(let i=2;i<35;i++){const x=p.x,prevZ=p.z;e.stepRacer(r,p,{seq:i,x:0,z:0,jump:false},r.start+i*50);if(p.falls)break;assert.ok(Math.hypot(p.x-x,p.z-prevZ)<1.6,'no jumping across the pivot on repeated contact');}
}
console.log('PASS: gates and spinners push tangentially at both ends and all jump heights without pivot snapping');
