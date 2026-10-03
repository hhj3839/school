import './resolve-ts.mjs';
import assert from 'node:assert/strict';
const {practiceRace,stepRacer,MOVERS,moverX,STEP,WALL_HEIGHT}=await import('../app/race/engine.ts');
const z=MOVERS[0],idle={seq:1,x:0,z:0,jump:false};
function contact(phase,height=0){
 const t=(phase-z+Math.ceil(z/(2*Math.PI))*2*Math.PI)/1.6;
 const r=practiceRace('벽 밀기',10000),p=r.players[0],at=r.start+t*1000;
 const previous=moverX(t-.05,z),current=moverX(t,z),direction=Math.sign(current-previous);
 p.x=previous+direction*2.86;p.z=z;p.y=height;p.vy=height? .9:0;
 return {r,p,at,direction};
}
for(const phase of [0,Math.PI])for(const height of [0,2.2,3.8]){
 const {r,p,at,direction}=contact(phase,height),before=p.x;
 stepRacer(r,p,idle,at);
 assert.ok((p.x-before)*direction>0,'wall pushes in its movement direction at ground and jump heights');
 assert.ok(p.pushVX*direction>0,'momentum follows wall velocity');
 assert.equal(p.z,z,'side collision does not force player backwards');
}
{
 const {r,p,at}=contact(0,WALL_HEIGHT+1),before=p.x;stepRacer(r,p,idle,at);assert.equal(p.x,before,'no collision above wall');
}
{
 const {r,p,at}=contact(1.05);p.safeZ=680;
 let leftRoad=false;
 for(let i=0;i<120&&!p.falls;i++){stepRacer(r,p,idle,at+i*STEP);leftRoad||=p.x>7;}
 assert.ok(leftRoad,'wall momentum can push player over edge');assert.equal(p.falls,1);assert.equal(p.z,680);assert.equal(p.pushVX,0,'recovery clears momentum');
}
{
 const {r,p,at}=contact(0);r.paused=at;const before={...p};stepRacer(r,p,idle,at+STEP);assert.deepEqual(p,before,'pause freezes wall pushing');
}
console.log('PASS: moving walls push left/right at all playable heights, knock players off edges, reset momentum on recovery, and respect pause');
