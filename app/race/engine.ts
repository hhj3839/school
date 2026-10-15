import {sweptBlade} from './collision';
import {FADING_BRIDGES,inFadingZone,fadingGround,SHUTTERS,shutterState,PUNCHES,punchState} from './obstacles';
import {STAIRCASES,inStairZone,stairSupport,stairX} from './stairs';
import {COURSE_LENGTH,COURSE_SCALE,SECTOR_LENGTH,SPINNER_POSITIONS,GATE_POSITIONS,ROTATING_HALF,ROTATING_APPROACH,TRACK_HALF,coursePoint,CHECKPOINTS,courseSector,NARROWS,trackHalfWidth,courseSpeedScale} from './course';
export const FINISH=COURSE_LENGTH,STEP=50,DURATION=480000,CAPACITY=20;
export const INPUT_LIMIT=24,INPUT_WINDOW=STEP*INPUT_LIMIT;
export const SPEED=13.5;
export const RAFTS=[[265,277],[337,349],[389,401]].map(([a,b])=>[a*COURSE_SCALE,a*COURSE_SCALE+(b-a)]);
export const RAFT=RAFTS[0];
export const GAPS=[...RAFTS,...[[305,314],[423,432],[499,508],[590,599],[741,750],[839,848]].map(([a,b])=>[a*COURSE_SCALE,a*COURSE_SCALE+(b-a)])].sort((a,b)=>a[0]-b[0]);
export const JUMP_ZONES=GAPS.filter(([a])=>!RAFTS.some(([r])=>r===a)).map(([a])=>a-2);
export const START=0;
export const RESPAWN_DELAY=3000;
export const WALL_HEIGHT=5;
export const SPINNERS=SPINNER_POSITIONS;
export const MOVERS=[692,790].map(z=>z*COURSE_SCALE);
export const MOVER_RATE=2.1,GATE_RATE=1.4,SPINNER_RATE=3.6;
export const moverX=(time:number,z:number)=>Math.sin(time*MOVER_RATE+z)*4;
export const spinnerAngle=(time:number,z:number)=>time*SPINNER_RATE+z;
export const WALLS=[{x:-4,z:12,w:6},{x:4,z:672,w:6}].map(w=>({...w,z:w.z*COURSE_SCALE}));
export const GATES=GATE_POSITIONS;
export const PENDULUMS=[450,544,640].map(z=>z*COURSE_SCALE);
export const BELTS=[{z:552,d:6,dir:1},{z:702,d:7,dir:-1},{z:780,d:6,dir:1}].map(b=>({...b,z:b.z*COURSE_SCALE}));
export const BOUNCERS=[295,377,832].map(z=>z*COURSE_SCALE);
export const gateAngle=(time:number,z:number)=>time*GATE_RATE+z;
export function pendulum(time:number,z:number){const x=Math.sin(time*2.0+z)*5;return {x,y:1.5+Math.abs(x)*.35};}
export function courseHint(z:number){const sector=courseSector(z),prefix=sector.name+' · ';if(FADING_BRIDGES.some(b=>z>b.start-12&&z<b.start+b.tileDepth*b.tiles+3))return prefix+'초록 발판에 건너요! 노랑은 곧 사라져요. 다시 나타날 때까지 기다려요';if(SHUTTERS.some(at=>Math.abs(z-at)<12))return prefix+'셔터가 올라가면 통과! 노란불은 곧 닫혀요';if(PUNCHES.some(p=>Math.abs(z-p.z)<12))return prefix+'빨간 경고등! 펀치가 들어간 뒤 통과해요';if(STAIRCASES.some(s=>z>s.start-12&&z<s.start+s.depth*s.heights.length+3))return prefix+'움직이는 계단! 발판을 보고 점프, 틈에 빠지면 떨어져요';if(z>FINISH-26)return '마지막 직선! 출발선으로 돌아오면 완주!';if(GAPS.some(([a,b])=>z>a-9&&z<b))return prefix+(RAFTS.some(([a,b])=>z>a-9&&z<b)?'보라색 발판을 기다렸다가 건너요':'노란 화살표에서 점프!');if([...SPINNERS,...GATES].some(at=>Math.abs(z-at)<14))return prefix+'회전벽은 길 전체를 지나가요! 타이밍을 보고 통과해요';if(NARROWS.some(n=>z>n.start-6&&z<n.end))return prefix+'가운데로! 끊긴 길은 노란 표시에서 점프';if(z<SECTOR_LENGTH)return prefix+'회전벽은 타이밍을 보고 통과해요';if(z<SECTOR_LENGTH*2)return prefix+'보라 발판은 기다리기 · 노란 화살표는 점프';if(z<SECTOR_LENGTH*3)return prefix+'흔들리는 공과 끊긴 길을 조심해요';return prefix+'움직이는 장치를 피하고 결승선까지!';}

export const PALETTE=['#59c7ab','#f6a37f','#9990e3','#f0c557','#71b7e3','#ea93bb','#a9cc6f','#b39ad4'];
export type RaceInput={seq:number;x:number;z:number;jump:boolean};
export type Racer={id:string;token?:string;name:string;last:number;connection?:{rtt:number;at:number};x:number;z:number;y:number;vy:number;pushVX?:number;pushVZ?:number;jumpUntil?:number;at:number;seq:number;checkpoint:number;safeZ?:number;respawnUntil?:number;falls:number;finished:number;stun:number;bounce:number;peak:number;color:number};
export type RaceRoom={kind:'race';practice?:boolean;code:string;host:string;players:Racer[];finishers?:Racer[];phase:'lobby'|'playing'|'result';round:number;start:number;end:number;paused:number;winner:string};
export const isRace=(v:unknown):v is RaceRoom=>!!v&&typeof v==='object'&&'kind' in v&&v.kind==='race';
export function makeRacer(id:string,name:string,now:number,color=0):Racer{return {id,name,last:now,x:0,z:START,y:0,vy:0,at:now,seq:0,checkpoint:0,safeZ:START,respawnUntil:0,falls:0,finished:0,stun:0,bounce:0,peak:0,color};}
export function makeRace(code:string,p:Racer):RaceRoom{return {kind:'race',code,host:p.id,players:[p],phase:'lobby',round:0,start:0,end:0,paused:0,winner:''};}
export function startRace(r:RaceRoom,now:number){r.round++;r.finishers=[];r.phase='playing';r.start=now+3000;r.end=r.start+DURATION;r.paused=0;r.winner='';r.players=r.players.map((p,i)=>({...makeRacer(p.id,p.name,r.start,i),token:p.token,last:now,x:(i-(r.players.length-1)/2)*Math.min(2.1,11.6/Math.max(1,r.players.length-1))}));}
export function raceTime(r:RaceRoom,now:number){return Math.max(0,((r.paused||now)-r.start)/1000);}
export function platformX(time:number){return Math.sin(time*.8)*3.5;}
export function ground(x:number,z:number,time:number){
 if(z< -3||z>FINISH+8)return false;
 if(inStairZone(z))return !!stairSupport(x,z,time);
 if(inFadingZone(z))return Math.abs(x)<=TRACK_HALF&&fadingGround(z,time);
 for(const [a,b] of GAPS)if(z>a&&z<b)return RAFTS.some(([start])=>start===a)&&Math.abs(x-platformX(time))<=TRACK_HALF;
 return Math.abs(x)<=trackHalfWidth(z);
}
export function surfaceHeight(x:number,z:number,time:number):number|null{if(inStairZone(z))return stairSupport(x,z,time)?.height??null;return ground(x,z,time)?0:null;}
export function safeRecoveryPoint(z:number){return !FADING_BRIDGES.some(b=>z>b.start-3&&z<b.start+b.tileDepth*b.tiles+3)&&!SHUTTERS.some(at=>Math.abs(z-at)<4)&&!PUNCHES.some(p=>Math.abs(z-p.z)<7)&&!STAIRCASES.some(s=>z>s.start-2&&z<s.start+s.depth*s.heights.length+2)&&z>=START&&z<FINISH-5&&trackHalfWidth(z)===7&&!GAPS.some(([a,b])=>z>a-3&&z<b+3)&&![...SPINNERS,...GATES].some(at=>Math.abs(z-at)<ROTATING_APPROACH)&&![...MOVERS,...WALLS.map(w=>w.z),...PENDULUMS,...BOUNCERS].some(at=>Math.abs(z-at)<4)&&!BELTS.some(b=>Math.abs(z-b.z)<b.d/2+1);}
export function stepRacer(r:RaceRoom,p:Racer,c:RaceInput,at:number){
 if(r.phase!=='playing'||r.paused||at<r.start||at>r.end||p.finished||at<(p.respawnUntil||0))return;
 const dt=STEP/1000,t=raceTime(r,at),norm=Math.max(1,Math.hypot(c.x,c.z)),ox=p.x,oz=p.z,oy=p.y,oldFloor=surfaceHeight(p.x,p.z,t-dt),grounded=oldFloor!==null&&Math.abs(p.y-oldFloor)<.001&&p.vy<=0;
 // Carry grounded feet with the same rigid moving deck used by rendering.
 const support=grounded?stairSupport(ox,oz,t-dt):null;
 if(support){const delta=stairX(t,support)-stairX(t-dt,support),heading=coursePoint(0,oz).heading-support.center.heading;p.x+=delta*Math.cos(heading);p.z+=delta*Math.sin(heading)/courseSpeedScale(ox,oz);}
 const carriedX=p.x,carriedZ=p.z;
 // Brief momentum lets a moving wall carry a player beyond the road edge.
 p.x+=(p.pushVX||0)*dt;p.z+=(p.pushVZ||0)*dt/courseSpeedScale(ox,oz);p.pushVX=(p.pushVX||0)*.86;p.pushVZ=(p.pushVZ||0)*.86;
 if(Math.abs(p.pushVX)<.05)p.pushVX=0;
 if(at>=p.stun){p.x+=c.x/norm*SPEED*dt;p.z+=c.z/norm*SPEED*dt/courseSpeedScale(ox,oz);}
 p.z=Math.max(START,Math.min(FINISH,p.z));
 if(p.y===0&&at>=p.stun)for(const b of BELTS)if(Math.abs(p.z-b.z)<b.d/2)p.x+=b.dir*3.2*dt;
 if(c.jump&&at>=p.stun)p.jumpUntil=at+150;
 if((p.jumpUntil||0)>=at&&at>=p.stun&&grounded){p.vy=9;p.jumpUntil=0;}
 p.vy-=18*dt;p.y+=p.vy*dt;
 let floor=surfaceHeight(p.x,p.z,t);
 // A higher step is a solid face. Walking into it cannot lift or teleport a racer.
 if(floor!==null&&floor>(oldFloor??0)+.001&&p.y<floor&&oy<floor){p.x=carriedX;p.z=carriedZ;floor=surfaceHeight(p.x,p.z,t);}
 if(floor!==null&&p.y<=floor&&p.vy<=0&&oy>=floor-.001){p.y=floor;p.vy=0;}
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
 // Shutters block the full road until the opening clears the racer's body.
 for(const z of SHUTTERS){const bottom=Math.min(shutterState(t,z).bottom,shutterState(t-dt,z).bottom);
  if(Math.abs(p.z-z)<1.05&&p.y<bottom+5&&p.y+2.2>bottom){p.z=oz<=z?Math.min(oz,z-1.06):Math.max(oz,z+1.06);}
 }
 for(const punch of PUNCHES){const current=punchState(t,punch.z),previous=punchState(t-dt,punch.z);if(Math.max(current.extension,previous.extension)<=0||p.y< -1||p.y>=2.8||Math.abs(p.z-punch.z)>1.6||at<p.stun)continue;
  const a=punch.side*(9-17*previous.extension),b=punch.side*(9-17*current.extension);
  if(Math.max(ox,p.x)>=Math.min(a,b)-1.7&&Math.min(ox,p.x)<=Math.max(a,b)+1.7){p.pushVX=-punch.side*36;p.pushVZ=0;p.jumpUntil=0;p.vy=3;p.stun=at+3000;}
 }
 // A rotating-wall hit throws the racer off the nearest side; input cannot undo the hit.
 const rotatingContact=(z:number,a:number,omega:number,length:number)=>{
  if(p.y>=WALL_HEIGHT||p.y< -2)return;
  const contact=sweptBlade(ox,oz-z,p.x,p.z-z,a-omega*dt,a,length);
  if(!contact)return;
  const direction=Math.sign(p.x)||Math.sign(-Math.sin(a)*(Math.sign(contact.along)||1))||1;
  p.pushVX=direction*36;p.pushVZ=0;p.jumpUntil=0;p.vy=3;p.stun=at+3000;
 };
 for(const z of GATES)rotatingContact(z,gateAngle(t,z),GATE_RATE,ROTATING_HALF);
 for(const z of SPINNERS)rotatingContact(z,spinnerAngle(t,z),SPINNER_RATE,ROTATING_HALF);
 for(const z of PENDULUMS){const ball=pendulum(t,z);if(Math.hypot(p.x-ball.x,p.z-z)<1.7&&Math.abs(p.y+.9-ball.y)<2&&at>=p.stun){p.x+=(p.x>=ball.x?1:-1)*1.7;p.z-=1.2;p.vy=4;p.stun=at+650;}}
 if(BOUNCERS.some(z=>Math.abs(p.z-z)<1.4)&&Math.abs(p.x)<2.4&&p.y===0&&at>p.bounce){p.vy=12;p.bounce=at+1400;}
 if(p.y< -5){p.x=0;p.z=p.safeZ??START;p.y=0;p.vy=0;p.pushVX=0;p.pushVZ=0;p.jumpUntil=0;p.falls++;p.stun=0;p.bounce=0;p.respawnUntil=at+RESPAWN_DELAY;return;}
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
