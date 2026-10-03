export const FINISH=160,STEP=50,DURATION=180000;
export const GAPS=[[42,47],[87,92],[109,117]];
export const CHECKPOINTS=[2,50,96,128];
export const SPINNERS=[25,72,137];
export const WALLS=[{x:-3,z:15,w:7},{x:3,z:61,w:7},{x:-3,z:101,w:6},{x:3,z:149,w:6}];
export const PALETTE=['#59c7ab','#f6a37f','#9990e3','#f0c557','#71b7e3','#ea93bb','#a9cc6f','#b39ad4'];
export type RaceInput={seq:number;x:number;z:number;jump:boolean};
export type Racer={id:string;token?:string;name:string;last:number;x:number;z:number;y:number;vy:number;at:number;seq:number;checkpoint:number;falls:number;finished:number;stun:number;bounce:number;peak:number;color:number};
export type RaceRoom={kind:'race';practice?:boolean;code:string;host:string;players:Racer[];phase:'lobby'|'playing'|'result';round:number;start:number;end:number;paused:number;winner:string};
export const isRace=(v:unknown):v is RaceRoom=>!!v&&typeof v==='object'&&'kind' in v&&v.kind==='race';
export function makeRacer(id:string,name:string,now:number,color=0):Racer{return {id,name,last:now,x:(color%4-1.5)*2,z:2-Math.floor(color/4)*1.5,y:0,vy:0,at:now,seq:0,checkpoint:0,falls:0,finished:0,stun:0,bounce:0,peak:0,color};}
export function makeRace(code:string,p:Racer):RaceRoom{return {kind:'race',code,host:p.id,players:[p],phase:'lobby',round:0,start:0,end:0,paused:0,winner:''};}
export function startRace(r:RaceRoom,now:number){r.round++;r.phase='playing';r.start=now+3000;r.end=r.start+DURATION;r.paused=0;r.winner='';r.players=r.players.map((p,i)=>({...makeRacer(p.id,p.name,r.start,i),token:p.token,last:now}));}
export function raceTime(r:RaceRoom,now:number){return Math.max(0,((r.paused||now)-r.start)/1000);}
export function platformX(time:number){return Math.sin(time*.8)*3.5;}
export function ground(x:number,z:number,time:number){if(Math.abs(x)>7||z< -3||z>168)return false;for(const [a,b] of GAPS)if(z>a&&z<b)return a===109&&Math.abs(x-platformX(time))<2.8;return true;}
export function stepRacer(r:RaceRoom,p:Racer,c:RaceInput,at:number){
 if(r.phase!=='playing'||r.paused||at<r.start||at>r.end||p.finished)return;
 const dt=STEP/1000,t=raceTime(r,at),norm=Math.max(1,Math.hypot(c.x,c.z)),ox=p.x,oz=p.z;
 if(at>=p.stun){p.x+=c.x/norm*9*dt;p.z+=c.z/norm*9*dt;}else p.z-=2*dt;
 p.z=Math.max(-2,p.z);
 if(c.jump&&p.y===0&&ground(ox,oz,t))p.vy=9;
 p.vy-=18*dt;p.y+=p.vy*dt;
 if(p.y<=0&&p.vy<=0&&ground(p.x,p.z,t)){p.y=0;p.vy=0;}
 for(const w of WALLS)if(Math.abs(p.x-w.x)<w.w/2+.35&&Math.abs(p.z-w.z)<1.05&&p.y<1.4){p.x=ox;p.z=oz;}
 for(const z of SPINNERS){const a=t*1.65+z,dx=p.x,dz=p.z-z,along=dx*Math.cos(a)+dz*Math.sin(a),across=-dx*Math.sin(a)+dz*Math.cos(a);if(Math.abs(along)<6&&Math.abs(across)<.7&&p.y<1.05&&at>=p.stun){p.stun=at+600;p.z-=1.8;p.vy=3;}}
 if((Math.abs(p.z-56)<1.4||Math.abs(p.z-124)<1.4)&&Math.abs(p.x)<2.4&&p.y===0&&at>p.bounce){p.vy=12;p.bounce=at+1400;}
 if(p.y< -5){p.x=0;p.z=CHECKPOINTS[p.checkpoint];p.y=0;p.vy=0;p.falls++;p.stun=at+200;}
 if(p.y>=0&&ground(p.x,p.z,t)){CHECKPOINTS.forEach((z,i)=>{if(p.z>=z)p.checkpoint=Math.max(p.checkpoint,i);});p.peak=Math.max(p.peak,Math.min(FINISH,p.z));}
 if(p.z>=FINISH&&p.y>=0&&Math.abs(p.x)<7)p.finished=at-r.start;
}
export function raceRanks(r:RaceRoom){return [...r.players].sort((a,b)=>a.finished&&b.finished?a.finished-b.finished:a.finished?-1:b.finished?1:b.peak-a.peak);}
export function finishRace(r:RaceRoom,message=''){r.phase='result';r.paused=0;r.winner=message||'모두 수고했어요!';}
export function advanceRace(r:RaceRoom,now:number){if(r.phase!=='playing'||r.paused)return;if(now>=r.end||r.players.every(p=>p.finished||now-p.last>30000))finishRace(r);}
export function pauseRace(r:RaceRoom,now:number,on:boolean){if(r.phase!=='playing')return;if(on&&!r.paused)r.paused=now;else if(!on&&r.paused){const d=now-r.paused;r.start+=d;r.end+=d;r.players.forEach(p=>{p.at=now;p.stun+=d;p.bounce+=d;p.last=now;});r.paused=0;}}
export function publicRace(r:RaceRoom){return {...r,players:r.players.map(({token,...p})=>p)};}
export function practiceRace(name:string,now:number){const r=makeRace('연습',makeRacer('practice',name,now));r.practice=true;startRace(r,now);return r;}
