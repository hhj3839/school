import {database} from '../db/raw';
import {ROOM_IDLE_MS} from './room-limits';

type Snapshot={players:{id:string}[]};
// Only independent, single-player changes may bypass the room-wide version.
// Lifecycle changes, attacks and gravity affecting other boards keep full CAS.
export async function writePlayer(before:Snapshot,after:Snapshot,id:string,code:string,now:number,revision:number){
 const index=before.players.findIndex(p=>p.id===id);
 if(index<0||before.players.length!==after.players.length)return null;
 const {players:oldPlayers,...oldMeta}=before,{players:newPlayers,...newMeta}=after;
 if(JSON.stringify(oldMeta)!==JSON.stringify(newMeta)||oldPlayers.some((p,i)=>i!==index&&JSON.stringify(p)!==JSON.stringify(newPlayers[i])))return null;
 if(newPlayers[index].id!==id)return null;
 const path=`$.players[${index}]`;
 const saved=await database().prepare("UPDATE rooms SET state=json_set(state,?,json(?)),version=version+1,expires=? WHERE code=? AND expires>? AND json_remove(state,'$.players')=json(?) AND json_array_length(state,'$.players')=? AND json_extract(state,?)=json(?) AND EXISTS (SELECT 1 FROM classroom WHERE id=1 AND opened=1 AND revision=?)")
  .bind(path,JSON.stringify(newPlayers[index]),now+ROOM_IDLE_MS,code,now,JSON.stringify(oldMeta),oldPlayers.length,path,JSON.stringify(oldPlayers[index]),revision).run();
 return !!saved.meta.changes;
}
