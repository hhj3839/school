export type BrushShape='round'|'square'|'vertical';
export function brushContains(shape:BrushShape,x:number,y:number,radius:number){
 if(Math.abs(x)>radius||Math.abs(y)>radius)return false;
 if(shape==='square')return true;
 if(shape==='vertical')return Math.abs(x)<=Math.floor(radius/3);
 return x*x+y*y<=radius*radius;
}
