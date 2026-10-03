import {COURSE_LENGTH,STAGES,NARROWS,trackHalfWidth,courseSpeedScale,upcomingTurn} from './course';
export const FINISH=COURSE_LENGTH,STEP=50,DURATION=480000,CAPACITY=20;
export const SPEED=13.5;
export const RAFT=[151,159];
export const RAFTS=STAGES.map(s=>[s+151,s+159]);
export const GAPS=STAGES.flatMap(s=>[[s+45,s+52],[s+113,s+120],[s+151,s+159],[s+181,s+187]]);
export const START=2;
export const WALL_HEIGHT=5;
export const SPINNERS=STAGES.flatMap(s=>[20,96,134,206].map(z=>s+z));
export const MOVERS=STAGES.flatMap(s=>[64,142].map(z=>s+z));
export const moverX=(time:number,z:number)=>Math.sin(time*1.6+z)*4;
export const spinnerAngle=(time:number,z:number)=>time*2.7+z;
export const WALLS=STAGES.flatMap((s,i)=>[{x:i%2?4:-4,z:s+12,w:6},{x:i%2?-3:3,z:s+215,w:7}]);
export const GATES=STAGES.flatMap(s=>[88,202].map(z=>s+z));
export const PENDULUMS=STAGES.flatMap(s=>[28,163,209].map(z=>s+z));
export const BELTS=STAGES.flatMap((s,i)=>[{z:s+72,d:7,dir:i%2?-1:1},{z:s+146,d:6,dir:-1},{z:s+196,d:4,dir:1}]);
export const BOUNCERS=STAGES.flatMap(s=>[80,166].map(z=>s+z));
export const gateAngle=(time:number,z:number)=>time*1.05+z;
export function pendulum(time:number,z:number){const x=Math.sin(time*2.0+z)*5;return {x,y:1.5+Math.abs(x)*.35};}
export function courseHint(z:number){const section=Math.min(4,Math.floor(z/220)+1),local=z%220,prefix=`${section}/4 구간 · `;if(NARROWS.some(n=>z>n.start-5&&z<n.end))return prefix+'좁은 커브! 가운데로 달리고 끊긴 길은 점프!';if(GAPS.some(([a,b])=>z>a-8&&z<b))return prefix+(RAFTS.some(([a,b])=>z>a-8&&z<b)?'움직이는 보라 발판을 따라가요':'끊긴 길! 가장자리 직전에 점프!');const turn=upcomingTurn(z);if(turn)return prefix+turn.label+' · 카메라는 자동으로 돌아요';if(local<16)return prefix+'높은 벽은 옆으로 피해요';if(local<34)return prefix+'회전 장애물은 점프 말고 옆으로 피해요!';if(local<84)return prefix+'움직이는 벽과 밀리는 바닥!';if(local<140)return prefix+'회전 장애물의 빈틈을 보고 피해 가요!';if(local<170)return prefix+'움직이는 발판 다음은 흔들리는 공!';return prefix+'연속 장치를 통과해요!';}


export const PALETTE=['#59c7ab','#f6a37f','#9990e3','#f0c557','#71b7e3','#ea93bb','#a9cc6f','#b39ad4'];
export type RaceInput={seq:number;x:number;z:number;jump:boolean};
export type Racer={id:string;token?:string;name:string;last:number;x:number;z:number;y:number;vy:number;at:number;seq:number;checkpoint:number;falls:number;finished:number;stun:number;bounce:number;peak:number;color:number};
export type RaceRoom={kind:'race';practice?:boolean;code:string;host:string;players:Racer[];finishers?:Racer[];phase:'lobby'|'playing'|'result';round:number;start:number;end:number;paused:number;winner:string};
export const isRace=(v:unknown):v is RaceRoom=>!!v&&typeof v==='object'&&'kind' in v&&v.kind==='race';
export function makeRacer(id:string,name:string,now:number,color=0):Racer{return {id,name,last:now,x:0,z:START,y:0,vy:0,at:now,seq:0,checkpoint:0,falls:0,finished:0,stun:0,bounce:0,peak:0,color};}
export function makeRace(code:string,p:Racer):RaceRoom{return {kind:'race',code,host:p.id,players:[p],phase:'lobby',round:0,start:0,end:0,paused:0,winner:''};}
export function startRace(r:RaceRoom,now:number){r.round++;r.finishers=[];r.phase='playing';r.start=now+3000;r.end=r.start+DURATION;r.paused=0;r.winner='';r.players=r.players.map((p,i)=>({...makeRacer(p.id,p.name,r.start,i),token:p.token,last:now,x:(i-(r.players.length-1)/2)*Math.min(2.1,11.6/Math.max(1,r.players.length-1))}));}
export function raceTime(r:RaceRoom,now:number){return Math.max(0,((r.paused||now)-r.start)/1000);}
export function platformX(time:number){return Math.sin(time*.8)*3.5;}
export function ground(x:number,z:number,time:number){if(Math.abs(x)>trackHalfWidth(z)||z< -3||z>FINISH+8)return false;for(const [a,b] of GAPS)if(z>a&&z<b)return RAFTS.some(([start])=>start===a)&&Math.abs(x-platformX(time))<2.8;return true;}
export function stepRacer(r:RaceRoom,p:Racer,c:RaceInput,at:number){
 if(r.phase!=='playing'||r.paused||at<r.start||at>r.end||p.finished)return;
 const dt=STEP/1000,t=raceTime(r,at),norm=Math.max(1,Math.hypot(c.x,c.z)),ox=p.x,oz=p.z;
 if(at>=p.stun){p.x+=c.x/norm*SPEED*dt;p.z+=c.z/norm*SPEED*dt/courseSpeedScale(ox,oz);}else p.z-=2*dt;
 p.z=Math.max(-2,p.z);
 if(p.y===0&&at>=p.stun)for(const b of BELTS)if(Math.abs(p.z-b.z)<b.d/2)p.x+=b.dir*3.2*dt;
 if(c.jump&&p.y===0&&ground(ox,oz,t))p.vy=9;
 p.vy-=18*dt;p.y+=p.vy*dt;
 if(p.y<=0&&p.vy<=0&&ground(p.x,p.z,t)){p.y=0;p.vy=0;}
 // Tall walls require steering around the opening, including during bounce jumps.
 for(const w of [...WALLS,...MOVERS.map(z=>({x:moverX(t,z),z,w:5}))]){
  if(p.y>=WALL_HEIGHT)continue;
  const inside=(x:number,z:number)=>Math.abs(x-w.x)<w.w/2+.35&&Math.abs(z-w.z)<1.05;
  if(inside(p.x,p.z)){
   if(!inside(ox,p.z))p.x=ox;
   else if(!inside(p.x,oz))p.z=oz;
   else{p.x=ox;p.z=oz<=w.z?w.z-1.06:w.z+1.06;}
  }
 }
 for(const z of GATES){const a=gateAngle(t,z),dx=p.x,dz=p.z-z,along=dx*Math.cos(a)+dz*Math.sin(a),across=-dx*Math.sin(a)+dz*Math.cos(a);if(Math.abs(along)<5.9&&Math.abs(across)<.7&&p.y<WALL_HEIGHT){p.x=ox;p.z=oz<=z?Math.min(oz,z-1.1):Math.max(oz,z+1.1);}}
 for(const z of PENDULUMS){const ball=pendulum(t,z);if(Math.hypot(p.x-ball.x,p.z-z)<1.7&&Math.abs(p.y+.9-ball.y)<2&&at>=p.stun){p.x+=(p.x>=ball.x?1:-1)*1.7;p.z-=1.2;p.vy=4;p.stun=at+650;}}
 for(const z of SPINNERS){const a=spinnerAngle(t,z),dx=p.x,dz=p.z-z,along=dx*Math.cos(a)+dz*Math.sin(a),across=-dx*Math.sin(a)+dz*Math.cos(a);if(Math.abs(along)<6&&Math.abs(across)<.7&&p.y<WALL_HEIGHT&&p.y> -2&&at>=p.stun){p.stun=at+600;p.z-=1.8;p.vy=3;}}
 if(BOUNCERS.some(z=>Math.abs(p.z-z)<1.4)&&Math.abs(p.x)<2.4&&p.y===0&&at>p.bounce){p.vy=12;p.bounce=at+1400;}
 if(p.y< -5){p.x=0;p.z=START;p.y=0;p.vy=0;p.checkpoint=0;p.falls++;p.stun=at+200;p.bounce=0;}
 if(p.y>=0&&ground(p.x,p.z,t)){p.peak=Math.max(p.peak,Math.min(FINISH,p.z));}
 if(p.z>=FINISH&&p.y>=0&&Math.abs(p.x)<7){p.finished=at-r.start;const {token,...result}=p;r.finishers||=[];r.finishers.push({...result});}
}
export function raceRanks(r:RaceRoom){return [...new Map([...r.players,...(r.finishers||[])].map(p=>[p.id,p])).values()].sort((a,b)=>a.finished&&b.finished?a.finished-b.finished:a.finished?-1:b.finished?1:b.peak-a.peak);}
export function raceWinners(r:RaceRoom){const done=raceRanks(r).filter(p=>p.finished);return done.length?done.filter(p=>p.finished===done[0].finished):[];}
export function finishRace(r:RaceRoom,message=''){r.phase='result';r.paused=0;const winners=raceWinners(r);r.winner=message||(r.practice?(winners.length?'완주 성공!':'다시 도전해 봐요!'):winners.length?winners.map(p=>p.name).join(' · ')+(winners.length>1?' 공동 우승!':' 우승!'):'시간 종료 · 이번 판은 완주자가 없어요');}
export function advanceRace(r:RaceRoom,now:number){if(r.phase!=='playing'||r.paused)return;if(now>=r.end||r.players.every(p=>p.finished||now-p.last>30000))finishRace(r);}
export function pauseRace(r:RaceRoom,now:number,on:boolean){if(r.phase!=='playing')return;if(on&&!r.paused)r.paused=now;else if(!on&&r.paused){const d=now-r.paused;r.start+=d;r.end+=d;r.players.forEach(p=>{p.at=now;p.stun+=d;p.bounce+=d;p.last=now;});r.paused=0;}}
export function publicRace(r:RaceRoom){return {...r,players:r.players.map(({token,...p})=>p)};}
export function practiceRace(name:string,now:number){const r=makeRace('연습',makeRacer('practice',name,now));r.practice=true;startRace(r,now);return r;}
