import {coursePoint,TRACK_HALF} from './course';
export const STAIRCASES=[{start:690,depth:12,heights:[1.1,2.2,3.3,2.2,1.1]},{start:936,depth:12,heights:[1.1,2.2,3.3,2.2,1.1]}];
export const STAIR_GAP=2,STAIR_SWAY=2.2;
const TREADS=STAIRCASES.flatMap(stair=>stair.heights.map((height,index)=>{const start=stair.start+index*stair.depth,end=start+stair.depth-STAIR_GAP;return {start,end,height,index,stairStart:stair.start,up:index===0||height>stair.heights[index-1],center:coursePoint(0,(start+end)/2)};}));
export type StairTread=typeof TREADS[number];
export const stairTreads=()=>TREADS;
export const inStairZone=(z:number)=>STAIRCASES.some(s=>z>=s.start&&z<s.start+s.depth*s.heights.length);
export const stairX=(time:number,tread:StairTread)=>Math.sin(time*.9+tread.index*1.15+tread.stairStart*.01)*STAIR_SWAY;
export function stairSupport(x:number,z:number,time:number){
 if(!inStairZone(z))return null;
 const world=coursePoint(x,z);
 for(const tread of TREADS){if(Math.abs(z-(tread.start+tread.end)/2)>9)continue;const h=tread.center.heading,dx=world.x-tread.center.x,dz=world.z-tread.center.z;
  const lateral=dx*Math.cos(h)-dz*Math.sin(h),along=dx*Math.sin(h)+dz*Math.cos(h);
  if(Math.abs(along)<(tread.end-tread.start)/2&&Math.abs(lateral-stairX(time,tread))<=TRACK_HALF)return tread;
 }
 return null;
}
export function stairHeight(z:number){return TREADS.find(t=>z>=t.start&&z<t.end)?.height??0;}
