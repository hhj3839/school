// One pending callback, including after visibility/freeze/bfcache transitions.
// Never replay missed frames in a burst after the browser resumes the page.
export class FrameLoop {
 private pending:number|null=null;
 private running=false;
 private request:(fn:FrameRequestCallback)=>number;
 private cancel:(id:number)=>void;
 private draw:FrameRequestCallback;
 private reset:()=>void;
 constructor(request:(fn:FrameRequestCallback)=>number,cancel:(id:number)=>void,draw:FrameRequestCallback,reset:()=>void){this.request=request;this.cancel=cancel;this.draw=draw;this.reset=reset;}
 private tick:FrameRequestCallback=time=>{
  this.pending=null;
  if(!this.running)return;
  this.draw(time);
  if(this.running)this.pending=this.request(this.tick);
 };
 start(){if(this.running)return;this.running=true;this.reset();this.pending=this.request(this.tick);}
 stop(){this.running=false;if(this.pending!==null)this.cancel(this.pending);this.pending=null;}
}
