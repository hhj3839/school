import {parseSettings,roomSettings,type Room,type RoomSettings} from './game';
export const PRESET_KEY='hideout-class-preset';
export function readPreset(raw:string|null):RoomSettings|null{try{return parseSettings(JSON.parse(raw||'null'));}catch{return null;}}
export function sessionEnded(error:unknown){return [401,404,423].includes((error as {status?:number})?.status||0);}
export function nextSeekers(room:Room){const n=room.players.length,count=roomSettings(room).seekerCount;if(n<=count)return [];return room.players.filter((_,i)=>(i-room.round%n+n)%n<count);}
export function currentTask({phase,role,caught,locked,mode,picking,preview,paused}:{phase:string;role?:string;caught?:boolean;locked?:boolean;mode:string;picking:boolean;preview:boolean;paused:number}){
 if(paused)return '잠깐 쉬어 가요';if(phase==='result')return '다음 판을 준비해요';if(caught)return '친구를 골라 응원해요';if(role==='seeker')return phase==='seek'?'가운데 조준점을 맞추고 발사!':'친구들이 숨는 동안 기다려요';if(preview)return '거리와 방향을 바꿔 확인해요';if(picking)return '배경을 눌러 색을 가져와요';if(locked)return '꼭꼭 숨었어요!';return mode==='paint'?'몸을 손가락으로 칠해요':mode==='look'?'자세를 고르고 숨기를 눌러요':'왼쪽 동그라미를 끌어 이동해요';
}
