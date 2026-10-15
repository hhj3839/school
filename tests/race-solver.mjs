// Test driver uses only real movement inputs; it waits for a safe blade phase.
export function completeCourse(e,r){const p=r.players[0];let at=r.start,committed=0,falls=p.falls;const rotors=[...e.SPINNERS,...e.GATES].sort((a,b)=>a-b);
 for(let i=0;i<e.DURATION/e.STEP&&!p.finished;i++){
  at+=e.STEP;p.last=at;let target=0,wait=false;
  if(p.falls!==falls){committed=0;falls=p.falls;}
  const nextWall=[...e.WALLS,...e.MOVERS.map(z=>({x:e.moverX(e.raceTime(r,at),z),z,w:5}))].filter(w=>w.z>p.z-1.1).sort((a,b)=>a.z-b.z)[0];
  if(nextWall&&nextWall.z-p.z<8)target=nextWall.x<0?5:-5;
  const rotor=rotors.find(z=>p.z>z-18&&p.z<z+10);
  if(rotor){target=4.6;if(p.z>=rotor-9.5&&committed!==rotor){
   const probe=structuredClone(r),q=probe.players[0],oldFalls=q.falls;let ok=true;
   for(let j=0;j<100&&q.z<rotor+9.5;j++){e.stepRacer(probe,q,{seq:j+1,x:Math.max(-1,Math.min(1,(target-q.x)*2)),z:1,jump:false},at+j*e.STEP);if(q.falls!==oldFalls||q.stun>at+j*e.STEP){ok=false;break;}}
   if(ok&&q.z>=rotor+9.5)committed=rotor;else wait=true;
  }}else committed=0;
  if(e.RAFTS.some(([a,b])=>p.z>a-5&&p.z<b+2))target=e.platformX(e.raceTime(r,at));
  const gap=e.GAPS.find(([a])=>p.z>a-2&&p.z<a),flight=(p.vy+Math.sqrt(p.vy*p.vy+36*Math.max(0,p.y)))/18;
  const waitForLanding=p.y>0&&gap&&flight*e.SPEED<gap[1]-p.z+.5;
  e.stepRacer(r,p,{seq:i+1,x:Math.max(-1,Math.min(1,(target-p.x)*2)),z:wait||waitForLanding||Math.abs(target-p.x)>2.5?0:1,jump:e.GAPS.some(([a])=>p.z>a-2&&p.z<a)},at);e.advanceRace(r,at);
 }
 return {finished:!!p.finished,seconds:Math.round((at-r.start)/1000),z:p.z,falls:p.falls,peak:p.peak};
}
