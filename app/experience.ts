import {parseSettings,roomSettings,type Room,type RoomSettings} from './game';
export const PRESET_KEY='hideout-class-preset';
export function readPreset(raw:string|null):RoomSettings|null{try{return parseSettings(JSON.parse(raw||'null'));}catch{return null;}}
export function sessionEnded(error:unknown){return [401,404,423].includes((error as {status?:number})?.status||0);}
export function nextSeekers(room:Room){const n=room.players.length,count=roomSettings(room).seekerCount;if(n<=count)return [];return room.players.filter((_,i)=>(i-room.round%n+n)%n<count);}
export function currentTask({phase,role,caught,locked,mode,picking,preview,paused}:{phase:string;role?:string;caught?:boolean;locked?:boolean;mode:string;picking:boolean;preview:boolean;paused:number}){
 if(paused)return "일시정지";if(phase==='result')return "다음 경기 준비";if(caught)return "관전 대상 선택";if(role==='seeker')return phase==='seek'?"중앙 조준 후 발사":"친구 숨기 대기";if(preview)return "거리·방향별 확인";if(picking)return "배경 선택 · 색 추출";if(locked)return "숨기 완료";return mode==='paint'?"캐릭터 드래그 색칠":mode==='look'?"자세 선택 후 숨기":"왼쪽 패드 드래그 이동";
}
