// Shared by the authoritative physics and the rendered stair mesh.
export const STAIRCASES=[{start:690,depth:12,heights:[1.1,2.2,3.3,2.2,1.1]},{start:936,depth:12,heights:[1.1,2.2,3.3,2.2,1.1]}];
export const stairTreads=()=>STAIRCASES.flatMap(stair=>stair.heights.map((height,i)=>({start:stair.start+i*stair.depth,end:stair.start+(i+1)*stair.depth,height,up:i===0||height>stair.heights[i-1]})));
export function stairHeight(z:number){const stair=STAIRCASES.find(s=>z>=s.start&&z<s.start+s.depth*s.heights.length);return stair?stair.heights[Math.floor((z-stair.start)/stair.depth)]:0;}
