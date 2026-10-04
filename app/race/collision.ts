// Sample both player travel and blade rotation, including the space between ticks.
export function sweptBlade(ox:number,oz:number,x:number,z:number,start:number,end:number,length:number){
 for(let i=0;i<=8;i++){
  const f=i/8,a=start+(end-start)*f,px=ox+(x-ox)*f,pz=oz+(z-oz)*f;
  const along=px*Math.cos(a)+pz*Math.sin(a),across=-px*Math.sin(a)+pz*Math.cos(a);
  if(Math.abs(along)<length&&Math.abs(across)<.72)return {along,across};
 }
 return null;
}
