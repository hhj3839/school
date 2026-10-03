import {MAX_ROOMS,ROOM_IDLE_MS,cleanIdleRooms} from '../../room-limits';
import { env } from 'cloudflare:workers';
import { database } from '../../../db/raw';
import {teacherRoomSummary} from '../../teaching';
import {advance,mapName,roomSettings,type Room} from '../../game';
import { classroomState } from '../../classroom';
export const dynamic='force-dynamic';
const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
export async function GET(){try{const gate=await classroomState();const row=gate.open?await database().prepare('SELECT state FROM rooms WHERE code=(SELECT featured_code FROM classroom WHERE id=1) AND expires>?').bind(Date.now()).first<{state:string}>():null;let featured=null;if(row){const r=JSON.parse(row.state) as Room;advance(r,Date.now());const count=r.players.filter(p=>Date.now()-p.last<120000).length;if(count)featured={code:r.code,mapName:mapName(roomSettings(r).mapId),count,capacity:roomSettings(r).maxPlayers,canJoin:['lobby','result'].includes(r.phase)&&count<roomSettings(r).maxPlayers};}return reply({...gate,featured});}catch{return reply({error:'연결을 확인하고 있어요.'},503);}}
async function authorized(req:Request){
  const secret=(env as unknown as {TEACHER_KEY?:string}).TEACHER_KEY;
  const key=req.headers.get('authorization')?.replace(/^Bearer /,'');
  if(!secret||!key||key.length>200)return false;
  const hash=async(s:string)=>new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)));
  const [a,b]=await Promise.all([hash(secret),hash(key)]);let difference=0;for(let i=0;i<a.length;i++)difference|=a[i]^b[i];return difference===0;
}
export async function POST(req:Request){try{
  if(req.headers.get('origin')!==new URL(req.url).origin)return reply({error:'허용되지 않은 요청이에요.'},403);
  if(!await authorized(req))return reply({error:'선생님 비밀번호를 확인해 주세요.'},401);
  const raw=await req.text();if(raw.length>100)return reply({error:'잘못된 요청이에요.'},400);
  const {action,code}=JSON.parse(raw);
  if(action==='check')return reply(await classroomState());
  if(action==='status'){
    const now=Date.now(),db=database();await cleanIdleRooms(now);const rows=await db.prepare('SELECT state FROM rooms WHERE expires>? ORDER BY version DESC').bind(now).all<{state:string}>();
    const rooms=rows.results.map(row=>JSON.parse(row.state) as Room).filter(r=>r.players.some(p=>now-p.last<120000)).map(r=>teacherRoomSummary(r,now));
    const featured=await db.prepare('SELECT featured_code FROM classroom WHERE id=1').first<{featured_code:string|null}>();return reply({featuredCode:featured?.featured_code,rooms,updatedAt:now,limits:{maxRooms:MAX_ROOMS,idleSeconds:ROOM_IDLE_MS/1000},totals:{rooms:rooms.length,playing:rooms.filter(r=>!['lobby','result'].includes(r.phase)).length,online:rooms.reduce((n,r)=>n+r.online,0)}});
  }
  if(action==='featureRoom'||action==='unfeatureRoom'){
    const db=database();if(typeof code!=='string'||!/^[A-Z2-9]{6}$/.test(code))return reply({error:'방 코드를 확인해 주세요.'},400);
    const result=action==='featureRoom'?await db.prepare('UPDATE classroom SET featured_code=? WHERE id=1 AND opened=1 AND EXISTS (SELECT 1 FROM rooms WHERE code=? AND expires>?)').bind(code,code,Date.now()).run():await db.prepare('UPDATE classroom SET featured_code=NULL WHERE id=1 AND featured_code=?').bind(code).run();
    return result.meta.changes?reply({ok:true}):reply({error:'방이 종료되었거나 변경됐어요. 목록을 확인해 주세요.'},409);
  }
  if(['pauseRoom','resumeRoom','endRoom'].includes(action)){
    if(typeof code!=='string'||!/^[A-Z2-9]{6}$/.test(code))return reply({error:'방 코드를 확인해 주세요.'},400);
    const db=database(),now=Date.now(),gate=await classroomState();if(!gate.open)return reply({error:'모든 게임이 종료되어 있어요.'},409);
    for(let i=0;i<8;i++){
      const row=await db.prepare('SELECT state,version FROM rooms WHERE code=? AND expires>?').bind(code,now).first<{state:string;version:number}>();
      if(!row)return reply({error:'종료되었거나 없는 방이에요.'},404);
      const room=JSON.parse(row.state) as Room;advance(room,now);
      if(['lobby','result'].includes(room.phase))return reply({error:'진행 중인 판에서 사용할 수 있어요.'},409);
      if(action==='endRoom'){room.phase='result';room.end=0;room.paused=0;room.winner='선생님이 이번 판을 마쳤어요';}
      else if(action==='pauseRoom'&&!room.paused)room.paused=now;
      else if(action==='resumeRoom'&&room.paused){room.end+=now-room.paused;room.paused=0;room.players.forEach(p=>p.moveAt=now);}
      const saved=await db.prepare('UPDATE rooms SET state=?,version=version+1 WHERE code=? AND version=? AND expires>? AND EXISTS (SELECT 1 FROM classroom WHERE id=1 AND opened=1 AND revision=?)').bind(JSON.stringify(room),code,row.version,now,gate.revision).run();
      if(saved.meta.changes)return reply({room:teacherRoomSummary(room,now)});
    }
    return reply({error:'방이 갱신 중이에요. 다시 눌러 주세요.'},409);
  }
  if(action!=='open'&&action!=='close')return reply({error:'잘못된 요청이에요.'},400);
  const db=database();
  // The switch and room invalidation commit together. Reopening never revives old rooms.
  await db.batch([
    db.prepare('UPDATE classroom SET opened=?,revision=revision+1,last_created=0,featured_code=NULL WHERE id=1').bind(action==='open'?1:0),
    db.prepare('UPDATE rooms SET expires=0'),
  ]);
  return reply(await classroomState());
}catch{return reply({error:'변경하지 못했어요. 다시 확인해 주세요.'},503);}}
