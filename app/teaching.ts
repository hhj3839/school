import {advance,mapName,roomSettings,type Room,type RoomSettings} from './game';

export function recommendedRules(count:number,mapId:RoomSettings['mapId']){
 const players=Math.max(2,Math.min(20,Math.floor(count)||2));
 return {seekerCount:Math.min(players-1,Math.max(1,Math.ceil(players/6))),paintSeconds:players>=12?300:180,seekSeconds:players>=12||mapId==='forest'||mapId==='ocean'?300:180};
}
export function teacherRoomSummary(room:Room,now:number){
 advance(room,now);
 const players=room.players.map(p=>({id:p.id,name:p.name,role:p.role,online:now-p.last<15000,ready:!!p.locked,caught:p.caught}));
 return {code:room.code,mapName:mapName(roomSettings(room).mapId),phase:room.phase,paused:!!room.paused,remaining:room.end?Math.max(0,Math.ceil((room.end-(room.paused||now))/1000)):0,players,online:players.filter(p=>p.online).length,ready:players.filter(p=>p.role==='hider'&&p.ready).length,hiders:players.filter(p=>p.role==='hider').length};
}
export type TeacherRoom=ReturnType<typeof teacherRoomSummary>;
