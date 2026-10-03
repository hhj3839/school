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
 ['이동해 봐요','왼쪽 동그라미를 손가락으로 끌어 보세요.'],
 ['조금 올라가 봐요','왼쪽 아래 ‘▲ 올라가기’를 톡 눌러 보세요.'],
 ['몸에 색칠해 봐요','아래 ‘색칠’을 누르고 몸을 문질러 보세요. 초록색으로 칠해져요.'],
 ['숨을 준비를 해요','오른쪽 ‘여기에 숨기’를 눌러 몸을 고정해 보세요.'],
 ['네 가지 모두 해냈어요!','이제 마음에 드는 곳으로 이동해서 자유롭게 위장해 보세요.'],
] as const;
