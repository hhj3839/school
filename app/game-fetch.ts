const latency=new Map<string,number>();
// Piggyback the previous round-trip measurement; never add monitoring requests.
export async function gameFetch(url:string,init:RequestInit){
 const started=performance.now(),body=JSON.parse(String(init.body||'{}'));
 const response=await fetch(url,{...init,body:JSON.stringify({...body,rtt:latency.get(url)})});
 if(response.ok)latency.set(url,Math.round(performance.now()-started));
 return response;
}
