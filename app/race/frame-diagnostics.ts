// Opt-in, bounded local diagnostics. No names, tokens, script URLs or uploads.
export function frameDiagnostics(el:HTMLElement):{frame:(now:number)=>void;dispose:()=>void}{
 if(new URLSearchParams(location.search).get('raceDiagnostics')!=='1')return {frame:()=>{},dispose:()=>{}};
 const started=performance.now();let last=started,timerAt=started,maxGap=0,maxTimerDelay=0,frames=0,resumes=0;
 const samples:{at:number;gap:number;focused:boolean}[]=[],events:{at:number;state:string}[]=[];
 const longTasks:{start:number;duration:number}[]=[],longFrames:{start:number;duration:number;blocking:number}[]=[];
 const observers:PerformanceObserver[]=[];
 const supported=typeof PerformanceObserver==='undefined'?[]:PerformanceObserver.supportedEntryTypes;
 const publish=()=>{el.dataset.frameDiagnostics=JSON.stringify({elapsed:Math.round(performance.now()-started),frames,maxGap:Math.round(maxGap),maxTimerDelay:Math.round(maxTimerDelay),resumes,visibility:document.visibilityState,focused:document.hasFocus(),supported:supported.filter(t=>t==='longtask'||t==='long-animation-frame'),gaps:samples,events,longTasks,longFrames});};
 const observe=(type:string,collect:(e:PerformanceEntry)=>void)=>{if(!supported.includes(type))return;const observer=new PerformanceObserver(list=>{for(const entry of list.getEntries())collect(entry);});observer.observe({type});observers.push(observer);};
 observe('longtask',e=>{longTasks.push({start:Math.round(e.startTime-started),duration:Math.round(e.duration)});if(longTasks.length>100)longTasks.shift();});
 observe('long-animation-frame',e=>{longFrames.push({start:Math.round(e.startTime-started),duration:Math.round(e.duration),blocking:Math.round((e as PerformanceEntry&{blockingDuration:number}).blockingDuration)});if(longFrames.length>100)longFrames.shift();});
 const lifecycle=()=>{const now=performance.now();events.push({at:Math.round(now-started),state:document.visibilityState});if(events.length>30)events.shift();last=now;timerAt=now;resumes++;publish();};
 document.addEventListener('visibilitychange',lifecycle);
 const timer=setInterval(()=>{const now=performance.now();if(!document.hidden)maxTimerDelay=Math.max(maxTimerDelay,now-timerAt-250);timerAt=now;publish();},250);
 return {frame(now:number){const gap=now-last;last=now;frames++;maxGap=Math.max(maxGap,gap);if(gap>100){samples.push({at:Math.round(now-started),gap:Math.round(gap),focused:document.hasFocus()});if(samples.length>60)samples.shift();}},dispose(){clearInterval(timer);observers.forEach(o=>o.disconnect());document.removeEventListener('visibilitychange',lifecycle);}};
}
