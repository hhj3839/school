// Long browser scheduling gaps are not evidence that rendering is expensive.
// Keep them in diagnostics, but never lower resolution because of them.
export class FrameBudget {
 private start=0;
 private frames=0;
 private work=0;
 private stalls=0;
 private lastChange=0;
 reset(now:number){this.start=now;this.frames=0;this.work=0;this.stalls=0;}
 sample(now:number,gap:number,workMs:number,ratio:number,ceiling:number){
  if(!this.start)this.reset(now);
  this.frames++;this.work+=workMs;if(gap>250)this.stalls++;
  const elapsed=now-this.start;if(elapsed<1000)return null;
  const fps=this.frames*1000/elapsed,cpuMs=this.work/this.frames,stalls=this.stalls;
  let nextRatio=ratio;
  if(stalls===0&&now-this.lastChange>=3000){
   // GPU work can be asynchronous: a short CPU frame alone does not prove
   // the GPU is keeping up. Adapt to sustained slow frames without stalls.
   if(fps<24)nextRatio=Math.max(.4,ratio-.1);
   else if(fps>=28&&cpuMs<12)nextRatio=Math.min(ceiling,ratio+.1);
   if(nextRatio!==ratio)this.lastChange=now;
  }
  this.reset(now);return {fps,cpuMs,stalls,ratio:nextRatio};
 }
}
