import type {Room,Player} from './game';
export const HEARTBEAT_MS=5000;
export function pollDelay(room:Room|null,player:Player|undefined,moving:boolean,turning:boolean,hidden=false){
 if(hidden)return 5000;if(!room||room.paused||['lobby','result'].includes(room.phase))return 1500;
 if(player&&!player.caught&&(moving&&!player.locked||player.role==='seeker'&&turning))return 300;
 return player?.role==='seeker'||player?.caught?600:1000;
}
