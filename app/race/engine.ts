import {sweptBlade} from './collision';
import {COURSE_LENGTH,CHECKPOINTS,courseSector,NARROWS,trackHalfWidth,courseSpeedScale} from './course';
export const FINISH=COURSE_LENGTH,STEP=50,DURATION=480000,CAPACITY=20;
export const SPEED=13.5;
export const RAFTS=[[265,277],[337,349],[389,401]];
export const RAFT=RAFTS[0];
export const GAPS=[...RAFTS,[305,312],[423,430],[499,506],[590,597],[741,748],[839,846]].sort((a,b)=>a[0]-b[0]);
export const JUMP_ZONES=GAPS.filter(([a])=>!RAFTS.some(([r])=>r===a)).map(([a])=>a-2);
export const START=0;
export const RESPAWN_DELAY=3000;
export const WALL_HEIGHT=5;
export const SPINNERS=[20,64,112,158,196,726,812];
export const MOVERS=[692,790];
export const moverX=(time:number,z:number)=>Math.sin(time*1.6+z)*4;
export const spinnerAngle=(time:number,z:number)=>time*2.7+z;
export const WALLS=[{x:-4,z:12,w:6},{x:4,z:672,w:6}];
export const GATES=[88,136,180,762];
export const PENDULUMS=[450,544,640];
export const BELTS=[{z:552,d:6,dir:1},{z:702,d:7,dir:-1},{z:780,d:6,dir:1}];
export const BOUNCERS=[295,377,832];
export const gateAngle=(time:number,z:number)=>time*1.05+z;
export function pendulum(time:number,z:number){const x=Math.sin(time*2.0+z)*5;return {x,y:1.5+Math.abs(x)*.35};}
export function courseHint(z:number){const sector=courseSector(z),prefix=sector.name+' · ';if(z>FINISH-26)return '마지막 직선! 출발선으로 돌아오면 완주!';if(GAPS.some(([a,b])=>z>a-9&&z<b))return prefix+(RAFTS.some(([a,b])=>z>a-9&&z<b)?'보라색 발판을 기다렸다가 건너요':'노란 화살표에서 점프!');if(NARROWS.some(n=>z>n.start-6&&z<n.end))return prefix+'가운데로! 끊긴 길은 노란 표시에서 점프';if(z<220)return prefix+'회전 장애물은 옆으로 피하거나 기다려요';if(z<440)return prefix+'보라 발판은 기다리기 · 노란 화살표는 점프';if(z<660)return prefix+'흔들리는 공을 피하고 좁은 길 가운데로!';return prefix+'움직이는 장치를 피하고 결승선까지!';}

export const PALETTE=['#59c7ab','#f6a37f','#9990e3','#f0c557','#71b7e3','#ea93bb','#a9cc6f','#b39ad4'];
export type RaceInput={seq:number;x:number;z:number;jump:boolean};
export type Racer={id:string;token?:string;name:string;last:number;x:number;z:number;y:number;vy:number;pushVX?:number;pushVZ?:number;at:number;seq:number;checkpoint:number;safeZ?:number;respawnUntil?:number;falls:number;finished:number;stun:number;bounce:number;peak:number;color:number};
export type RaceRoom={kind:'race';practice?:boolean;code:string;host:string;players:Racer[];finishers?:Racer[];phase:'lobby'|'playing'|'result';round:number;start:number;end:number;paused:number;winner:string};
export const isRace=(v:unknown):v is RaceRoom=>!!v&&typeof v==='object'&&'kind' in v&&v.kind==='race';
export function makeRacer(id:string,name:string,now:number,color=0):Racer{return {id,name,last:now,x:0,z:START,y:0,vy:0,at:now,seq:0,checkpoint:0,safeZ:START,respawnUntil:0,falls:0,finished:0,stun:0,bounce:0,peak:0,color};}
export function makeRace(code:string,p:Racer):RaceRoom{return {kind:'race',code,host:p.id,players:[p],phase:'lobby',round:0,start:0,end:0,paused:0,winner:''};}
export function startRace(r:RaceRoom,now:number){r.round++;r.finishers=[];r.phase='playing';r.start=now+3000;r.end=r.start+DURATION;r.paused=0;r.winner='';r.players=r.players.map((p,i)=>({...makeRacer(p.id,p.name,r.start,i),token:p.token,last:now,x:(i-(r.players.length-1)/2)*Math.min(2.1,11.6/Math.max(1,r.players.length-1))}));}
export function raceTime(r:RaceRoom,now:number){return Math.max(0,((r.paused||now)-r.start)/1000);}
export function platformX(time:number){return Math.sin(time*.8)*3.5;}
export function ground(x:number,z:number,time:number){if(Math.abs(x)>trackHalfWidth(z)||z< -3||z>FINISH+8)return false;for(const [a,b] of GAPS)if(z>a&&z<b)return RAFTS.some(([start])=>start===a)&&Math.abs(x-platformX(time))<2.8;return true;}
export function safeRecoveryPoint(z:number){return z>=START&&z<FINISH-5&&trackHalfWidth(z)===7&&!GAPS.some(([a,b])=>z>a-3&&z<b+3)&&![...SPINNERS,...GATES].some(at=>Math.abs(z-at)<7)&&![...MOVERS,...WALLS.map(w=>w.z),...PENDULUMS,...BOUNCERS].some(at=>Math.abs(z-at)<4)&&!BELTS.some(b=>Math.abs(z-b.z)<b.d/2+1);}
export function stepRacer(r:RaceRoom,p:Racer,c:RaceInput,at:number){
 if(r.phase!=='playing'||r.paused||at<r.start||at>r.end||p.finished||at<(p.respawnUntil||0))return;
 const dt=STEP/1000,t=raceTime(r,at),norm=Math.max(1,Math.hypot(c.x,c.z)),ox=p.x,oz=p.z;
 // Brief momentum lets a moving wall carry a player beyond the road edge.
 p.x+=(p.pushVX||0)*dt;p.z+=(p.pushVZ||0)*dt/courseSpeedScale(ox,oz);p.pushVX=(p.pushVX||0)*.86;p.pushVZ=(p.pushVZ||0)*.86;
 if(Math.abs(p.pushVX)<.05)p.pushVX=0;
 if(at>=p.stun){p.x+=c.x/norm*SPEED*dt;p.z+=c.z/norm*SPEED*dt/courseSpeedScale(ox,oz);}
 p.z=Math.max(START,Math.min(FINISH,p.z));
 if(p.y===0&&at>=p.stun)for(const b of BELTS)if(Math.abs(p.z-b.z)<b.d/2)p.x+=b.dir*3.2*dt;
 if(c.jump&&at>=p.stun&&p.y===0&&ground(ox,oz,t))p.vy=9;
 p.vy-=18*dt;p.y+=p.vy*dt;
 if(p.y<=0&&p.vy<=0&&ground(p.x,p.z,t)){p.y=0;p.vy=0;}
 // Tall walls require steering around the opening, including during bounce jumps.
 for(const w of WALLS){
  if(p.y>=WALL_HEIGHT)continue;
  const inside=(x:number,z:number)=>Math.abs(x-w.x)<w.w/2+.35&&Math.abs(z-w.z)<1.05;
  if(inside(p.x,p.z)){
   if(!inside(ox,p.z))p.x=ox;
   else if(!inside(p.x,oz))p.z=oz;
   else{p.x=ox;p.z=oz<=w.z?w.z-1.06:w.z+1.06;}
  }
 }
 for(const z of MOVERS){
  if(p.y>=WALL_HEIGHT||p.y< -2||Math.abs(p.z-z)>=1.05)continue;
  const previous=moverX(t-dt,z),current=moverX(t,z),delta=current-previous,half=2.85;
  // Use the swept wall bounds so even a fast side contact cannot pass through.
  if(p.x<Math.min(previous,current)-half||p.x>Math.max(previous,current)+half)continue;
  if(Math.abs(oz-z)>=1.05){p.z=oz;continue;}
  if(Math.abs(delta)>.00001&&(ox-previous)*Math.sign(delta)>=0){const direction=Math.sign(delta);p.x=current+direction*(half+.01);p.pushVX=delta/dt;}
  else p.x=current+(ox>=current?1:-1)*(half+.01);
 }
 // Push along the rotating face normal instead of snapping across the pivot.
 const rotatingContact=(z:number,a:number,omega:number,length:number)=>{
  if(p.y>=WALL_HEIGHT||p.y< -2)return;
  const cs=Math.cos(a),sn=Math.sin(a),dx=p.x,dz=p.z-z;
  const along=dx*cs+dz*sn,across=-dx*sn+dz*cs;
  const contact=sweptBlade(ox,oz-z,p.x,p.z-z,a-omega*dt,a,length);
  if(!contact)return;
  const previous=a-omega*dt,oldAcross=-ox*Math.sin(previous)+(oz-z)*Math.cos(previous);
  const motionSide=Math.sign(contact.along)||1,side=Math.sign(oldAcross)||motionSide;
  const correction=side*Math.max(0,.74-side*across);
  p.x-=sn*correction;p.z+=cs*correction;
  if(side===motionSide){const speed=Math.min(6,Math.max(1,Math.abs(along)*omega));p.pushVX=-sn*side*speed;p.pushVZ=cs*side*speed;p.stun=at+100;}
 };
 for(const z of GATES)rotatingContact(z,gateAngle(t,z),1.05,5.9);
 for(const z of SPINNERS)rotatingContact(z,spinnerAngle(t,z),2.7,6);
 for(const z of PENDULUMS){const ball=pendulum(t,z);if(Math.hypot(p.x-ball.x,p.z-z)<1.7&&Math.abs(p.y+.9-ball.y)<2&&at>=p.stun){p.x+=(p.x>=ball.x?1:-1)*1.7;p.z-=1.2;p.vy=4;p.stun=at+650;}}
 if(BOUNCERS.some(z=>Math.abs(p.z-z)<1.4)&&Math.abs(p.x)<2.4&&p.y===0&&at>p.bounce){p.vy=12;p.bounce=at+1400;}
 if(p.y< -5){p.x=0;p.z=p.safeZ??START;p.y=0;p.vy=0;p.pushVX=0;p.pushVZ=0;p.falls++;p.stun=0;p.bounce=0;p.respawnUntil=at+RESPAWN_DELAY;return;}
 if(p.y===0&&safeRecoveryPoint(p.z))p.safeZ=p.z;
 const next=CHECKPOINTS[p.checkpoint];if(next!==undefined&&oz<next&&p.z>=next&&p.y>=0)p.checkpoint++;

 if(p.y>=0&&ground(p.x,p.z,t)){p.peak=Math.max(p.peak,Math.min(FINISH,p.z));}
 if(p.z>=FINISH&&p.checkpoint===CHECKPOINTS.length&&p.y>=0&&Math.abs(p.x)<7){p.finished=at-r.start;const {token,...result}=p;r.finishers||=[];r.finishers.push({...result});}
}
export function raceRanks(r:RaceRoom){return [...new Map([...r.players,...(r.finishers||[])].map(p=>[p.id,p])).values()].sort((a,b)=>a.finished&&b.finished?a.finished-b.finished:a.finished?-1:b.finished?1:r.phase==='playing'?b.z-a.z:b.peak-a.peak);}
export function raceWinners(r:RaceRoom){const done=raceRanks(r).filter(p=>p.finished);return done.length?done.filter(p=>p.finished===done[0].finished):[];}
export function finishRace(r:RaceRoom,message=''){r.phase='result';r.paused=0;const winners=raceWinners(r);r.winner=message||(r.practice?(winners.length?'완주 성공!':'다시 도전해 봐요!'):winners.length?winners.map(p=>p.name).join(' · ')+(winners.length>1?' 공동 우승!':' 우승!'):'시간 종료 · 이번 판은 완주자가 없어요');}
export function advanceRace(r:RaceRoom,now:number){if(r.phase!=='playing'||r.paused)return;if(now>=r.end||r.players.every(p=>p.finished||now-p.last>30000))finishRace(r);}
export function pauseRace(r:RaceRoom,now:number,on:boolean){if(r.phase!=='playing')return;if(on&&!r.paused)r.paused=now;else if(!on&&r.paused){const d=now-r.paused;r.start+=d;r.end+=d;r.players.forEach(p=>{p.at=now;p.stun+=d;p.bounce+=d;if(p.respawnUntil)p.respawnUntil+=d;p.last=now;});r.paused=0;}}
export function publicRace(r:RaceRoom){return {...r,players:r.players.map(({token,...p})=>p)};}
export function practiceRace(name:string,now:number){const r=makeRace('연습',makeRacer('practice',name,now));r.practice=true;startRace(r,now);return r;}
