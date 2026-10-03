// Players use distance along the course (z) and lateral offset (x).
// Rendering and movement share the same circular arcs and track width.
export const COURSE_LENGTH=220;
export const TURNS=[{start:34,end:58,angle:Math.PI/2,label:'왼쪽 커브'}, {start:104,end:128,angle:-Math.PI/2,label:'오른쪽 커브'}, {start:170,end:194,angle:Math.PI/2,label:'왼쪽 커브'}];
export function coursePoint(offset:number,distance:number){
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
export const COURSE_MAP=Array.from({length:111},(_,i)=>coursePoint(0,i*2));
