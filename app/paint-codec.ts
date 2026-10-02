import {PAINT_SIZE} from './game';

// A bounded run-length format keeps blank bodies and brush strokes small on the wire.
export type PackedPaint={size:number;runs:(string|number)[]};
export function packPaint(paint:string[]):PackedPaint{
 const runs:(string|number)[]=[];
 for(const color of paint){if(runs.length&&runs[runs.length-2]===color)runs[runs.length-1]=Number(runs[runs.length-1])+1;else runs.push(color,1);}
 return {size:paint.length,runs};
}
export function unpackPaint(value:unknown):string[]|null{
 const validColor=(v:unknown):v is string=>typeof v==='string'&&/^#[0-9a-fA-F]{6}$/.test(v);
 const sizes=[256,1024,PAINT_SIZE*PAINT_SIZE];
 if(Array.isArray(value))return sizes.includes(value.length)&&value.every(validColor)?value:null;
 if(!value||typeof value!=='object')return null;
 const {size,runs}=value as PackedPaint;
 if(!sizes.includes(size)||!Array.isArray(runs)||runs.length%2||runs.length>size*2)return null;
 const result:string[]=[];
 for(let i=0;i<runs.length;i+=2){const color=runs[i],count=runs[i+1];if(!validColor(color)||typeof count!=='number'||!Number.isSafeInteger(count)||count<1||result.length+count>size)return null;for(let j=0;j<count;j++)result.push(color);}
 return result.length===size?result:null;
}
export function upgradePaint(paint:string[]){
 if(paint.length===PAINT_SIZE*PAINT_SIZE)return paint;
 const n=Math.sqrt(paint.length);
 return Array.from({length:PAINT_SIZE*PAINT_SIZE},(_,i)=>paint[Math.floor(Math.floor(i/PAINT_SIZE)*n/PAINT_SIZE)*n+Math.floor(i%PAINT_SIZE*n/PAINT_SIZE)]);
}
