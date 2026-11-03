// Players use distance along the course (z) and lateral offset (x).
// Rendering and movement share the same circular arcs and track width.
export const COURSE_SCALE=3,SECTOR_LENGTH=220*COURSE_SCALE,COURSE_LENGTH=SECTOR_LENGTH*4;
export const STAGES=[0,1,2,3].map(i=>i*SECTOR_LENGTH);
// Four identical sectors, each turning 90 degrees, close the circuit exactly.
export const TURNS=STAGES.flatMap(offset=>[[34,58],[104,128],[170,194]].map(([a,b])=>({start:offset+a*COURSE_SCALE,end:offset+b*COURSE_SCALE,angle:Math.PI/6,label:'왼쪽 커브'})));
export const CHECKPOINTS=[110,220,330,440,550,660,770].map(z=>z*COURSE_SCALE);
export const SECTORS=[{start:0,end:220,name:'타이밍 장애물',color:'#e6dcfa'},{start:220,end:440,name:'발판과 점프',color:'#fff0b5'},{start:440,end:660,name:'흔들리는 장치',color:'#cceee1'},{start:660,end:880,name:'마지막 질주',color:'#ffdccd'}].map(s=>({...s,start:s.start*COURSE_SCALE,end:s.end*COURSE_SCALE}));
export function courseSector(z:number){return SECTORS[Math.min(3,Math.max(0,Math.floor(z/SECTOR_LENGTH)))];}
export const SPINNER_POSITIONS=[64,726].map(z=>z*COURSE_SCALE);
export const GATE_POSITIONS=[136,762].map(z=>z*COURSE_SCALE);
export const TRACK_HALF=7,ROTATING_HALF=8,ROTATING_APPROACH=11;
export const NARROWS:{start:number;end:number;halfWidth:number}[]=[];
// Keep the distance argument shared with course geometry; this course has uniform width.
export function trackHalfWidth(z:number){void z;return TRACK_HALF;}
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
