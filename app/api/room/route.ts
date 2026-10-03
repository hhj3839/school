import {MAX_ROOMS,ROOM_IDLE_MS,CREATE_GAP_MS,cleanIdleRooms} from '../../room-limits';
import {classroomState} from '../../classroom';
import {packPaint,unpackPaint} from '../../paint-codec';
import { database } from '../../../db/raw';
import { roomBounds,stepHeight,DEFAULT_SETTINGS,parseSettings,roomSettings,adjustPose,advance,attachToWall,catchTarget,makePlayer,makeRoom,move,moveHeight,nextPhase,publicRoom,type Room } from '../../game';
export const dynamic='force-dynamic';
function wireRoom(r:Room,known?:Record<string,number>){return {...r,players:r.players.map(p=>({...p,paint:known&&Object.hasOwn(known,p.id)&&known[p.id]===(p.paintVersion||0)?undefined:Array.isArray(p.paint)?packPaint(p.paint):p.paint}))};}
const reply=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
export async function POST(req:Request){try{
 if(req.headers.get('origin')&&req.headers.get('origin')!==new URL(req.url).origin)return reply({error:'다른 사이트에서는 요청할 수 없어요.'},403);
 const raw=await req.text();if(raw.length>250000)return reply({error:'요청이 너무 커요.'},413);
 const a=JSON.parse(raw),db=database(),now=Date.now();
 const gate=await classroomState();if(!gate.open)return reply({closed:true,error:'선생님이 모든 게임을 종료했어요.'},423);
 if(a.action==='create'){const settings=a.settings===undefined?{...DEFAULT_SETTINGS}:parseSettings(a.settings);if(!settings)return reply({error:'방 설정을 확인해 주세요.'},400);
 await cleanIdleRooms(now);
 const token=crypto.randomUUID(),id=crypto.randomUUID(),name=String(a.name||'선생님').trim().slice(0,12)||'선생님';
 for(let i=0;i<4;i++){const bytes=crypto.getRandomValues(new Uint8Array(6)),alphabet='ABCDEFGHJKMNPQRSTUVWXYZ23456789',code=Array.from(bytes,b=>alphabet[b%alphabet.length]).join('');const p=makePlayer(id,name,now);p.token=token;const r=makeRoom(code,p);r.settings=settings;const [saved]=await db.batch([
 db.prepare('INSERT OR IGNORE INTO rooms(code,state,version,expires) SELECT ?,?,0,? WHERE EXISTS (SELECT 1 FROM classroom WHERE id=1 AND opened=1 AND revision=? AND last_created<=?) AND (SELECT COUNT(*) FROM rooms WHERE expires>?)<?').bind(code,JSON.stringify(wireRoom(r)),now+ROOM_IDLE_MS,gate.revision,now-CREATE_GAP_MS,now,MAX_ROOMS),
 db.prepare('UPDATE classroom SET last_created=? WHERE id=1 AND EXISTS (SELECT 1 FROM rooms WHERE code=? AND state=?)').bind(now,code,JSON.stringify(wireRoom(r)))
 ]);if(saved.meta.changes)return reply({room:wireRoom(publicRoom(r,id)),id,token,serverTime:now});if(!await db.prepare('SELECT code FROM rooms WHERE code=?').bind(code).first())break;}
 const current=await classroomState();if(!current.open||current.revision!==gate.revision)return reply({error:'게임 시간이 바뀌었어요. 다시 들어와 주세요.'},423);
 const capacity=await db.prepare('SELECT COUNT(*) AS total FROM rooms WHERE expires>?').bind(now).first<{total:number}>();
 if((capacity?.total||0)>=MAX_ROOMS)return reply({error:`지금은 방 ${MAX_ROOMS}개가 열려 있어요. 친구 방에 들어가거나 빈자리가 생기면 다시 만들어 주세요.`},409);
 return reply({error:'새 방은 5초에 하나씩 만들 수 있어요. 잠깐 기다린 뒤 다시 눌러 주세요.',retryAfter:5},429);
 }
 const code=String(a.code||'').toUpperCase();if(!/^[A-Z2-9]{6}$/.test(code))return reply({error:'방 코드 6자리를 확인해 주세요.'},400);
 for(let retry=0;retry<32;retry++){
 const row=await db.prepare('SELECT state,version,expires FROM rooms WHERE code=?').bind(code).first<{state:string;version:number;expires:number}>();if(!row||row.expires<now)return reply({error:'방이 없거나 사용 시간이 끝났어요.'},404);
 const r=JSON.parse(row.state) as Room;r.players=r.players.filter(p=>now-p.last<ROOM_IDLE_MS);if(!r.players.length){await db.prepare('DELETE FROM rooms WHERE code=? AND version=?').bind(code,row.version).run();return reply({error:'접속이 없어 방이 정리됐어요. 새 방으로 들어와 주세요.'},404);}if(!r.players.some(p=>p.id===r.host))r.host=r.players[0].id;advance(r,now);let p=r.players.find(p=>p.token===a.token);let token:string|undefined;
 if(a.action==='join'&&!p){if(r.phase!=='lobby'&&r.phase!=='result')return reply({error:'게임 중이에요. 다음 판에 들어와 주세요.'},409);if(r.players.length>=roomSettings(r).maxPlayers)return reply({error:'방 정원이 모두 찼어요. 다른 방을 이용해 주세요.'},409);p=makePlayer(crypto.randomUUID(),String(a.name||'친구').trim().slice(0,12)||'친구',now);token=crypto.randomUUID();p.token=token;r.players.push(p);}
 if(!p)return reply({error:'입장 정보가 없어요. 방 코드로 다시 들어와 주세요.'},401);
 if(a.action==='settings'){if(r.host!==p.id)return reply({error:'방장만 설정할 수 있어요.'},403);if(!['lobby','result'].includes(r.phase))return reply({error:'설정은 대기 중이나 판이 끝난 뒤에 바꿔 주세요.'},409);const settings=parseSettings(a.settings);if(!settings||settings.maxPlayers<r.players.length)return reply({error:'설정을 확인해 주세요. 정원은 현재 인원보다 작을 수 없어요.'},400);r.settings=settings;}
 else if(a.action==='tick'){if(!r.paused&&(r.phase==='seek'||['lobby','paint','hide'].includes(r.phase)&&p.role==='hider')&&!p.caught){move(p,Number.isFinite(a.dx)?Math.max(-1,Math.min(1,a.dx)):0,Number.isFinite(a.dy)?Math.max(-1,Math.min(1,a.dy)):0,(now-p.moveAt)/1000,roomSettings(r).mapId,roomBounds(r));moveHeight(p,a.dz,(now-p.moveAt)/1000,roomSettings(r).mapId);}p.moveAt=now;}
 else if(a.action==='heightStep'){if(!stepHeight(r,p,a.direction,now))return reply({error:'지금은 높이를 바꿀 수 없어요.'},409);}
 else if(a.action==='wall'){if(r.paused||p.caught||p.role==='seeker')return reply({error:'숨는 사람만 벽에 붙을 수 있어요.'},409);if(!attachToWall(p,roomSettings(r).mapId,roomBounds(r)))return reply({error:'벽 가까이 이동한 뒤 다시 눌러 주세요.'},409);}
 else if(a.action==='pose'){if(r.paused||p.caught)return reply({error:'지금은 자세를 바꿀 수 없어요.'},409);adjustPose(p,a);if(typeof a.locked==='boolean'){p.locked=a.locked;}if(Number.isFinite(a.angle))p.angle=((a.angle%(Math.PI*2))+Math.PI*2)%(Math.PI*2);}
 else if(a.action==='paint'){if(!['lobby','paint','hide','result'].includes(r.phase))return reply({error:'색칠 시간이 끝났어요.'},409);const paint=unpackPaint(a.paint);if(!paint)return reply({error:'그림을 다시 확인해 주세요.'},400);p.paint=paint;p.paintVersion=(p.paintVersion||0)+1;}
 else if(a.action==='catch'){catchTarget(r,p,String(a.target||''),now);}
 else if(['next','pause','end','kick'].includes(a.action)){if(r.host!==p.id)return reply({error:'방장만 진행할 수 있어요.'},403);if(a.action==='next'){if(r.paused)return reply({error:'먼저 이어하기를 눌러 주세요.'},409);if(['lobby','result'].includes(r.phase)&&r.players.length<=roomSettings(r).seekerCount)return reply({error:'설정한 술래 수보다 참가자가 많아야 해요. 숨는 친구가 최소 1명 필요해요.'},409);nextPhase(r,now);}if(a.action==='pause'){if(r.phase==='lobby'||r.phase==='result')return reply({error:'진행 중일 때 잠시 멈출 수 있어요.'},409);if(r.paused){r.end+=now-r.paused;r.paused=0;r.players.forEach(q=>q.moveAt=now);}else r.paused=now;}if(a.action==='end'){r.phase='result';r.winner='선생님이 게임을 마쳤어요';r.paused=0;r.end=0;}if(a.action==='kick'){r.players=r.players.filter(q=>q.id===r.host||q.id!==a.target);advance(r,now);}}
 else if(a.action==='leave'){r.players=r.players.filter(q=>q.id!==p!.id);if(r.host===p.id&&r.players.length)r.host=r.players[0].id;if(!r.players.length){const deleted=await db.prepare('DELETE FROM rooms WHERE code=? AND version=?').bind(code,row.version).run();if(deleted.meta.changes)return reply({left:true});continue;}if(!r.players.some(q=>q.role==='seeker')&&!['lobby','result'].includes(r.phase)){r.phase='result';r.winner='술래가 나가서 판이 끝났어요';}advance(r,now);}
 else if(!['join','state'].includes(a.action))return reply({error:'지원하지 않는 요청이에요.'},400);
 p.last=now;const result=await db.prepare('UPDATE rooms SET state=?,version=version+1,expires=? WHERE code=? AND version=? AND expires>? AND EXISTS (SELECT 1 FROM classroom WHERE id=1 AND opened=1 AND revision=?)').bind(JSON.stringify(wireRoom(r)),now+ROOM_IDLE_MS,code,row.version,now,gate.revision).run();if(result.meta.changes)return reply({room:wireRoom(publicRoom(r,p.id),a.paintVersions),id:p.id,...(token?{token}:{}),serverTime:now});
  await new Promise(resolve=>setTimeout(resolve,5+Math.floor(Math.random()*20)));
 }return reply({error:'잠시 연결이 밀렸어요. 다시 시도해 주세요.'},503);
 }catch(e){console.error('room request',e);return reply({error:'연결하지 못했어요. 잠시 후 다시 시도해 주세요.'},500);}}


