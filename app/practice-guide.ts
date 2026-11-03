import {DEFAULT_SETTINGS,type RoomSettings,type Player} from './game';
export type GuideStep=0|1|2|3|4;
export function practiceRules(mapId:RoomSettings['mapId'],seconds:number):RoomSettings{
 return {...DEFAULT_SETTINGS,mapId,maxPlayers:4,seekerCount:1,paintSeconds:seconds,seekSeconds:seconds,hideSeconds:0};
}
export function guideProgress(step:GuideStep,origin:{x:number;y:number},player:Player,painted:boolean):GuideStep{
 if(step===0&&Math.hypot(player.x-origin.x,player.y-origin.y)>=30)return 1;
 if(step===1&&(player.elevation||0)>=.12)return 2;
 if(step===2&&painted)return 3;
 if(step===3&&player.locked)return 4;
 return step;
}
export const GUIDE_TEXT=[
 ["이동 연습","왼쪽 패드 드래그"],
 ["높이 조절 연습","왼쪽 아래 높이 버튼 선택"],
 ["캐릭터 색칠 연습","색칠 선택 후 캐릭터 드래그"],
 ["숨기 연습","오른쪽 숨기 버튼 선택 · 자세 고정"],
 ["조작 연습 완료","자유 이동·위장 연습"],
] as const;
