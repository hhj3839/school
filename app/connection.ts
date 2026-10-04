export type ConnectionSample={rtt:number;at:number};
export function recordConnection(player:{connection?:ConnectionSample},rtt:unknown,now:number){
 if(typeof rtt!=='number'||!Number.isFinite(rtt)||rtt<0||rtt>30000)return;
 if(player.connection&&now-player.connection.at<5000)return;
 player.connection={rtt:Math.round(rtt),at:now};
}
export function connectionStatus(player:{last:number;connection?:ConnectionSample},now:number){
 const age=Math.max(0,now-player.last);
 return {lastSeenSeconds:Math.floor(age/1000),connectionState:age>=30000?'disconnected':age>=15000?'checking':player.connection&&now-player.connection.at<30000&&player.connection.rtt>=1200?'slow':'connected',rtt:player.connection&&now-player.connection.at<30000?player.connection.rtt:null};
}
