// Players use distance along the course (z) and lateral offset (x).
// Rendering and movement share the same circular arcs and track width.
export const COURSE_SCALE=3,SECTOR_LENGTH=220*COURSE_SCALE,COURSE_LENGTH=SECTOR_LENGTH*4;
export const STAGES=[0,1,2,3].map(i=>i*SECTOR_LENGTH);
// Four identical sectors, each turning 90 degrees, close the circuit exactly.
export const TURNS=STAGES.flatMap(offset=>[[34,58],[104,128],[170,194]].map(([a,b])=>({start:offset+a*COURSE_SCALE,end:offset+b*COURSE_SCALE,angle:Math.PI/6,label:'왼쪽 커브'})));
export const CHECKPOINTS=[110,220,330,440,550,660,770].map(z=>z*COURSE_SCALE);
export const SECTORS=[{start:0,end:220,name:'회전문 피하기',color:'#e6dcfa'},{start:220,end:440,name:'발판과 점프',color:'#fff0b5'},{start:440,end:660,name:'좁은 다리',color:'#cceee1'},{start:660,end:880,name:'마지막 질주',color:'#ffdccd'}].map(s=>({...s,start:s.start*COURSE_SCALE,end:s.end*COURSE_SCALE}));
export function courseSector(z:number){return SECTORS[Math.min(3,Math.max(0,Math.floor(z/SECTOR_LENGTH)))];}
export const SPINNER_POSITIONS=[20,64,112,158,196,726,812].map(z=>z*COURSE_SCALE);
export const GATE_POSITIONS=[88,136,180,762].map(z=>z*COURSE_SCALE);
export const ROTATING_HALF=6.8,ROTATING_APPROACH=10.5,ROTATING_ROAD_HALF=5;
// Each blade extends beyond the narrowed road. An outside jump cannot span
// the entire 21m approach, so the edge is no longer a permanent safe lane.
export const NARROWS=[...[{start:470,end:530,halfWidth:2.8},{start:560,end:625,halfWidth:2},{start:825,end:854,halfWidth:2.5}].map(n=>({...n,start:n.start*COURSE_SCALE,end:n.end*COURSE_SCALE})),...[...SPINNER_POSITIONS,...GATE_POSITIONS].map(z=>({start:z-ROTATING_APPROACH,end:z+ROTATING_APPROACH,halfWidth:ROTATING_ROAD_HALF}))];
export function trackHalfWidth(z:number){return NARROWS.find(n=>z>=n.start&&z<=n.end)?.halfWidth??7;}
export function coursePoint(offset:number,distance:number){
 distance=((distance%COURSE_LENGTH)+COURSE_LENGTH)%COURSE_LENGTH;
 let x=0,z=0,heading=0,cursor=0,curvature=0;
 for(const turn of TURNS){
  const straight=Math.min(distance,turn.start)-cursor;
  if(straight>0||distance<0){x+=Math.sin(heading)*straight;z+=Math.cos(heading)*straight;}
  if(distance<=turn.start){cursor=distance;break;}
  const length=Math.min(distance,turn.end)-turn.start,k=turn.angle/(turn.end-turn.start),next=heading+k*length;
  x+=(Math.cos(heading)-Math.cos(next))/k;z+=(Math.sin(next)-Math.sin(heading))/k;heading=next;cursor=turn.start+length;
  if(distance<turn.end){curvature=k;break;}
 }
 if(distance>cursor){x+=Math.sin(heading)*(distance-cursor);z+=Math.cos(heading)*(distance-cursor);}
 return {x:x+Math.cos(heading)*offset,z:z-Math.sin(heading)*offset,heading,curvature};
}
export function courseSpeedScale(offset:number,distance:number){return Math.max(.4,1-coursePoint(0,distance).curvature*offset);}
export function upcomingTurn(distance:number){return TURNS.find(t=>distance>=t.start-7&&distance<t.end);}
export const COURSE_MAP=Array.from({length:COURSE_LENGTH/(2*COURSE_SCALE)+1},(_,i)=>coursePoint(0,i*2*COURSE_SCALE));
