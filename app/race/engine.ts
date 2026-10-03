import {COURSE_LENGTH,courseSpeedScale,upcomingTurn} from './course';
export const FINISH=COURSE_LENGTH,STEP=50,DURATION=180000,CAPACITY=20;
export const RAFT=[151,159];
export const GAPS=[[45,50],[113,118],RAFT];
export const START=2;
export const WALL_HEIGHT=5;
export const SPINNERS=[20,96,134];
export const MOVERS=[64,142];
export const moverX=(time:number,z:number)=>Math.sin(time*1.2+z)*4;
export const spinnerAngle=(time:number,z:number)=>time*2.1+z;
export const WALLS=[{x:-4,z:12,w:5},{x:3,z:215,w:6}];
export const GATES=[88,202];
export const PENDULUMS=[28,163,209];
export const BELTS=[{z:72,d:7,dir:1},{z:146,d:6,dir:-1},{z:196,d:4,dir:1}];
export const BOUNCERS=[80,166];
export const gateAngle=(time:number,z:number)=>time*.85+z;
export function pendulum(time:number,z:number){const x=Math.sin(time*1.65+z)*5;return {x,y:1.5+Math.abs(x)*.35};}
export function courseHint(z:number){const turn=upcomingTurn(z);if(turn)return turn.label+' · 길을 따라가요! 카메라는 자동으로 돌아요';if(z<16)return '높은 벽은 옆으로 피해요';if(z<24)return '회전 막대는 점프!';if(z<34)return '흔들리는 공의 빈틈으로!';if(z<69)return '움직이는 벽을 피해요';if(z<84)return '밀리는 바닥 다음은 점프 발판!';if(z<104)return '회전문과 막대의 타이밍을 봐요';if(z<140)return '회전 막대는 점프!';if(z<151)return '움직이는 벽과 밀리는 바닥을 조심!';if(z<160)return '보라색 움직이는 발판을 따라가요';if(z<170)return '흔들리는 공 다음은 점프 발판!';if(z<208)return '마지막 회전문이 열릴 때!';return '분홍색 결승문을 먼저 통과하면 우승!';}

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
export function ground(x:number,z:number,time:number){if(Math.abs(x)>7||z< -3||z>FINISH+8)return false;for(const [a,b] of GAPS)if(z>a&&z<b)return a===RAFT[0]&&Math.abs(x-platformX(time))<2.8;return true;}
export function stepRacer(r:RaceRoom,p:Racer,c:RaceInput,at:number){
 if(r.phase!=='playing'||r.paused||at<r.start||at>r.end||p.finished)return;
 const dt=STEP/1000,t=raceTime(r,at),norm=Math.max(1,Math.hypot(c.x,c.z)),ox=p.x,oz=p.z;
 if(at>=p.stun){p.x+=c.x/norm*9*dt;p.z+=c.z/norm*9*dt/courseSpeedScale(ox,oz);}else p.z-=2*dt;
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
 for(const z of SPINNERS){const a=spinnerAngle(t,z),dx=p.x,dz=p.z-z,along=dx*Math.cos(a)+dz*Math.sin(a),across=-dx*Math.sin(a)+dz*Math.cos(a);if(Math.abs(along)<6&&Math.abs(across)<.7&&p.y<1.05&&at>=p.stun){p.stun=at+600;p.z-=1.8;p.vy=3;}}
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
