import {recordConnection} from '../../connection';
import {MAX_ROOMS,ROOM_IDLE_MS,CREATE_GAP_MS,cleanIdleRooms} from '../../room-limits';
import {visibleTo,shotTarget,validAim} from '../../server-vision';
import {HEARTBEAT_MS} from '../../network-policy';
import {writePlayer,writeControl} from '../../player-write';
import {classroomState} from '../../classroom';
import {packPaint,unpackPaint} from '../../paint-codec';
import { database } from '../../../db/raw';
import { ammunition,SHOT_COOLDOWN,roomBounds,stepHeight,DEFAULT_SETTINGS,parseSettings,roomSettings,adjustPose,advance,attachToWall,catchTarget,makePlayer,makeRoom,move,moveHeight,nextPhase,publicRoom,type Room } from '../../game';
export const dynamic='force-dynamic';
function wireRoom(r:Room,known?:Record<string,number>){return {...r,players:r.players.map(p=>({...p,paint:p.hidden?undefined:known&&Object.hasOwn(known,p.id)&&known[p.id]===(p.paintVersion||0)?undefined:Array.isArray(p.paint)?packPaint(p.paint):p.paint}))};}
const reply=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
export async function POST(req:Request){try{
 if(req.headers.get('origin')&&req.headers.get('origin')!==new URL(req.url).origin)return reply({error:"외부 사이트 요청 제한"},403);
 const raw=await req.text();if(raw.length>250000)return reply({error:"요청 크기 초과"},413);
 const a=JSON.parse(raw),db=database(),now=Date.now();
 const gate=await classroomState();if(!gate.open)return reply({closed:true,error:"선생님 전체 게임 종료"},423);
 if(a.action==='create'){const settings=a.settings===undefined?{...DEFAULT_SETTINGS}:parseSettings(a.settings);if(!settings)return reply({error:"방 설정 확인 필요"},400);
 await cleanIdleRooms(now);
 const token=crypto.randomUUID(),id=crypto.randomUUID(),name=String(a.name||'친구').trim().slice(0,12)||'친구';
 for(let i=0;i<4;i++){const bytes=crypto.getRandomValues(new Uint8Array(6)),alphabet='ABCDEFGHJKMNPQRSTUVWXYZ23456789',code=Array.from(bytes,b=>alphabet[b%alphabet.length]).join('');const p=makePlayer(id,name,now);p.token=token;const r=makeRoom(code,p);r.settings=settings;const [saved]=await db.batch([
 db.prepare('INSERT OR IGNORE INTO rooms(code,state,version,expires) SELECT ?,?,0,? WHERE EXISTS (SELECT 1 FROM classroom WHERE id=1 AND opened=1 AND revision=? AND last_created<=?) AND (SELECT COUNT(*) FROM rooms WHERE expires>?)<?').bind(code,JSON.stringify(wireRoom(r)),now+ROOM_IDLE_MS,gate.revision,now-CREATE_GAP_MS,now,MAX_ROOMS),
 db.prepare('UPDATE classroom SET last_created=? WHERE id=1 AND EXISTS (SELECT 1 FROM rooms WHERE code=? AND state=?)').bind(now,code,JSON.stringify(wireRoom(r)))
 ]);if(saved.meta.changes)return reply({room:wireRoom(publicRoom(r,id)),id,token,serverTime:now});if(!await db.prepare('SELECT code FROM rooms WHERE code=?').bind(code).first())break;}
 const current=await classroomState();if(!current.open||current.revision!==gate.revision)return reply({error:"게임 상태 변경 · 재입장 필요"},423);
 const capacity=await db.prepare('SELECT COUNT(*) AS total FROM rooms WHERE expires>?').bind(now).first<{total:number}>();
 if((capacity?.total||0)>=MAX_ROOMS)return reply({error:`지금은 방 ${MAX_ROOMS}개 사용 중 · 기존 방 참여 또는 빈자리 대기`},409);
 return reply({error:"방 생성 간격 5초 · 잠시 대기",retryAfter:5},429);
 }
 const code=String(a.code||'').toUpperCase();if(!/^[A-Z2-9]{6}$/.test(code))return reply({error:"6자리 방 코드 확인 필요"},400);
 for(let retry=0;retry<32;retry++){
 const row=await db.prepare('SELECT state,version,expires FROM rooms WHERE code=?').bind(code).first<{state:string;version:number;expires:number}>();if(!row||row.expires<now)return reply({error:"방 없음 또는 만료"},404);
 const rawRoom=JSON.parse(row.state);if(rawRoom.kind==='race')return reply({error:"운동회 방 · 운동회 화면 입장 필요"},409);if(rawRoom.kind==='blocks')return reply({error:"블록 대결 방 · 블록 화면 입장 필요"},409);const r=rawRoom as Room;const lifecycle=()=>[r.phase,r.end,r.paused,r.winner,r.host,r.players.length].join('|'),beforeLifecycle=lifecycle();r.players=r.players.filter(p=>now-p.last<ROOM_IDLE_MS);if(!r.players.length){await db.prepare('DELETE FROM rooms WHERE code=? AND version=?').bind(code,row.version).run();return reply({error:"접속 만료 · 새 방 입장 필요"},404);}if(!r.players.some(p=>p.id===r.host))r.host=r.players[0].id;advance(r,now);let p=r.players.find(p=>p.token===a.token);let token:string|undefined;
 if(a.action==='join'&&!p){if(r.phase!=='lobby'&&r.phase!=='result')return reply({error:"게임 진행 중 · 다음 판 입장 가능"},409);if(r.players.length>=roomSettings(r).maxPlayers)return reply({error:"정원 도달 · 다른 방 입장 필요"},409);p=makePlayer(crypto.randomUUID(),String(a.name||'친구').trim().slice(0,12)||'친구',now);token=crypto.randomUUID();p.token=token;r.players.push(p);}
 if(!p)return reply({error:"입장 정보 없음 · 방 코드 재입장 필요"},401);
 const motion=()=>[p!.x,p!.y,p!.elevation||0,p!.angle||0,p!.viewYaw||0,p!.viewPitch||0].join('|'),beforeMotion=motion();let shot:{hit:boolean}|undefined;
 if(a.action==='settings'){if(r.host!==p.id)return reply({error:"방장만 설정 가능"},403);if(!['lobby','result'].includes(r.phase))return reply({error:"대기·경기 종료 후 설정 변경 가능"},409);const settings=parseSettings(a.settings);if(!settings||settings.maxPlayers<r.players.length)return reply({error:"설정 확인 필요 · 현재 인원 이상 정원 필요"},400);r.settings=settings;}
 else if(a.action==='tick'){if(!r.paused&&(r.phase==='seek'||['lobby','paint','hide'].includes(r.phase)&&p.role==='hider')&&!p.caught){move(p,Number.isFinite(a.dx)?Math.max(-1,Math.min(1,a.dx)):0,Number.isFinite(a.dy)?Math.max(-1,Math.min(1,a.dy)):0,(now-p.moveAt)/1000,roomSettings(r).mapId,roomBounds(r));moveHeight(p,a.dz,(now-p.moveAt)/1000,roomSettings(r).mapId);}p.moveAt=now;if(p.role==='seeker'&&!r.paused){if(Number.isFinite(a.viewYaw)&&Math.abs((p.viewYaw||0)-a.viewYaw)>.015)p.viewYaw=a.viewYaw%(Math.PI*2);if(Number.isFinite(a.viewPitch)&&Math.abs((p.viewPitch||0)-a.viewPitch)>.015)p.viewPitch=Math.max(-.35,Math.min(.95,a.viewPitch));}}
 else if(a.action==='heightStep'){if(!stepHeight(r,p,a.direction,now))return reply({error:"현재 높이 변경 제한"},409);}
 else if(a.action==='wall'){if(r.paused||p.caught||p.role==='seeker')return reply({error:"숨는 사람만 벽 밀착 가능"},409);if(!attachToWall(p,roomSettings(r).mapId,roomBounds(r)))return reply({error:"벽 근처 이동 후 재시도"},409);}
 else if(a.action==='pose'){if(r.paused||p.caught)return reply({error:"현재 자세 변경 제한"},409);adjustPose(p,a);if(typeof a.locked==='boolean'){p.locked=a.locked;}if(Number.isFinite(a.angle))p.angle=((a.angle%(Math.PI*2))+Math.PI*2)%(Math.PI*2);}
 else if(a.action==='paint'){if(!['lobby','paint','hide','result'].includes(r.phase))return reply({error:"색칠 시간 종료"},409);const paint=unpackPaint(a.paint);if(!paint)return reply({error:"그림 확인 필요"},400);p.paint=paint;p.paintVersion=(p.paintVersion||0)+1;}
 else if(a.action==='catch'){if(r.phase!=='seek'||r.paused||p.role!=='seeker'||p.caught||ammunition(p,now).wait>0||now-p.catchAt<SHOT_COOLDOWN)return reply({error:"충전 중 또는 발사 제한"},409);if(!validAim(a.aim))return reply({error:"조준 방향 확인 필요"},400);p.viewYaw=a.aim.yaw;p.viewPitch=a.aim.pitch;const target=shotTarget(r,p,a.aim);shot={hit:catchTarget(r,p,target,now)};}
 else if(['next','pause','end','kick'].includes(a.action)){if(r.host!==p.id)return reply({error:"방장만 진행 가능"},403);if(a.action==='next'){if(r.paused)return reply({error:"게임 재개 필요"},409);if(['lobby','result'].includes(r.phase)&&r.players.length<=roomSettings(r).seekerCount)return reply({error:"술래 외 숨는 참가자 최소 1명 필요"},409);nextPhase(r,now);}if(a.action==='pause'){if(r.phase==='lobby'||r.phase==='result')return reply({error:"경기 중 일시정지 가능"},409);if(typeof a.paused==='boolean'&&a.paused===!!r.paused){}else if(r.paused){r.end+=now-r.paused;r.players.forEach(q=>{q.moveAt=now;if(q.reloadUntil)q.reloadUntil+=now-r.paused;});r.paused=0;}else r.paused=now;}if(a.action==='end'){r.phase='result';r.winner="선생님 게임 종료";r.paused=0;r.end=0;}if(a.action==='kick'){r.players=r.players.filter(q=>q.id===r.host||q.id!==a.target);advance(r,now);}}
 else if(a.action==='leave'){r.players=r.players.filter(q=>q.id!==p!.id);if(r.host===p.id&&r.players.length)r.host=r.players[0].id;if(!r.players.length){const deleted=await db.prepare('DELETE FROM rooms WHERE code=? AND version=?').bind(code,row.version).run();if(deleted.meta.changes)return reply({left:true});continue;}if(!r.players.some(q=>q.role==='seeker')&&!['lobby','result'].includes(r.phase)){r.phase='result';r.winner="술래 퇴장 · 경기 종료";}advance(r,now);}
 else if(!['join','state'].includes(a.action))return reply({error:"미지원 요청"},400);
 if(['pause','end'].includes(a.action)){const saved=await writeControl(JSON.parse(row.state),wireRoom(r),code,now,gate.revision);if(saved)return reply({room:wireRoom(publicRoom(r,p.id,(v,t)=>visibleTo(r,v,t),a.watch),a.paintVersions),id:p.id,serverTime:now});if(saved===false)continue;}
 if(['state','tick'].includes(a.action)&&lifecycle()===beforeLifecycle&&motion()===beforeMotion&&now-p.last<HEARTBEAT_MS&&row.expires>now+HEARTBEAT_MS)return reply({room:wireRoom(publicRoom(r,p.id,(v,t)=>visibleTo(r,v,t),a.watch),a.paintVersions),id:p.id,serverTime:now});
 p.last=now;recordConnection(p,a.rtt,now);
 if(['tick','state','paint','pose','heightStep','wall'].includes(a.action)){
  const saved=await writePlayer(JSON.parse(row.state),wireRoom(r),p.id,code,now,gate.revision);
  if(saved)return reply({room:wireRoom(publicRoom(r,p.id,(v,t)=>visibleTo(r,v,t),a.watch),a.paintVersions),id:p.id,serverTime:now});
  if(saved===false)continue;
 }
 const result=await db.prepare('UPDATE rooms SET state=?,version=version+1,expires=? WHERE code=? AND version=? AND expires>? AND EXISTS (SELECT 1 FROM classroom WHERE id=1 AND opened=1 AND revision=?)').bind(JSON.stringify(wireRoom(r)),now+ROOM_IDLE_MS,code,row.version,now,gate.revision).run();if(result.meta.changes)return reply({room:wireRoom(publicRoom(r,p.id,(v,t)=>visibleTo(r,v,t),a.watch),a.paintVersions),id:p.id,...(shot?{shot}:{}),...(token?{token}:{}),serverTime:now});
  await new Promise(resolve=>setTimeout(resolve,5+Math.floor(Math.random()*20)));
 }return reply({error:"연결 지연 · 재시도 필요"},503);
 }catch(e){console.error('room request',e);return reply({error:"연결 실패 · 잠시 후 재시도"},500);}}


