import {database} from '../db/raw';
export const MAX_ROOMS=5;
export const ROOM_IDLE_MS=120000;
export const CREATE_GAP_MS=5000;
// Run on room creation and teacher status requests, never on every movement tick.
// No active request can revive a row after its expiry.
export async function cleanIdleRooms(now:number){
 return database().prepare("DELETE FROM rooms WHERE expires<=? OR NOT EXISTS (SELECT 1 FROM json_each(rooms.state,'$.players') WHERE json_extract(value,'$.last')>?)").bind(now,now-ROOM_IDLE_MS).run();
}
