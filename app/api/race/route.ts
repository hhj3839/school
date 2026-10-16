import {writeControl} from '../../player-write';
import {recordConnection} from '../../connection';
import {database} from '../../../db/raw';
import {classroomState} from '../../classroom';
import {MAX_ROOMS,ROOM_IDLE_MS,CREATE_GAP_MS,cleanIdleRooms} from '../../room-limits';
import {isRace,makeRace,makeRacer,startRace,advanceRace,stepRacer,publicRace,pauseRace,finishRace,STEP,CAPACITY,INPUT_LIMIT,INPUT_WINDOW,type RaceInput} from '../../race/engine';
export const dynamic='force-dynamic';
const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
export async function POST(req:Request){try{
 if(req.headers.get('origin')&&req.headers.get('origin')!==new URL(req.url).origin)return reply({error:"요청 권한 없음"},403);
 const raw=await req.text();if(raw.length>4096)return reply({error:"요청 크기 초과"},413);
 const a=JSON.parse(raw),now=Date.now(),db=database();
 let gate:{open:boolean;revision:number};
 const name=String(a.name||'친구').trim().slice(0,12)||'친구';
 if(a.action==='create'){
  gate=await classroomState();if(!gate.open)return reply({error:"선생님 전체 게임 종료"},423);
  await cleanIdleRooms(now);const code=Array.from(crypto.getRandomValues(new Uint8Array(6)),b=>'ABCDEFGHJKMNPQRSTUVWXYZ23456789'[b%29]).join('');
  const p=makeRacer(crypto.randomUUID(),name,now);p.token=crypto.randomUUID();const r=makeRace(code,p),state=JSON.stringify(r);
  const [saved]=await db.batch([
   db.prepare('INSERT OR IGNORE INTO rooms(code,state,version,expires) SELECT ?,?,0,? WHERE EXISTS (SELECT 1 FROM classroom WHERE id=1 AND opened=1 AND revision=? AND last_created<=?) AND (SELECT COUNT(*) FROM rooms WHERE expires>?)<?').bind(code,state,now+ROOM_IDLE_MS,gate.revision,now-CREATE_GAP_MS,now,MAX_ROOMS),
   db.prepare('UPDATE classroom SET last_created=? WHERE id=1 AND EXISTS (SELECT 1 FROM rooms WHERE code=? AND state=?)').bind(now,code,state)
  ]);if(saved.meta.changes)return reply({room:publicRace(r),id:p.id,token:p.token,serverTime:now});
  return reply({error:"방 생성 한도 또는 대기 시간 미충족 · 잠시 후 재시도"},429);
 }
 const code=String(a.code||'').toUpperCase();if(!/^[A-Z2-9]{6}$/.test(code))return reply({error:"6자리 방 코드 확인 필요"},400);
 if(a.action==='input'&&(!Array.isArray(a.commands)||a.commands.length>INPUT_LIMIT||a.commands.some((c:RaceInput)=>!c||!Number.isSafeInteger(c.seq)||c.seq<1||!Number.isFinite(c.x)||!Number.isFinite(c.z)||Math.abs(c.x)>1||Math.abs(c.z)>1||typeof c.jump!=='boolean')))return reply({error:"잘못된 조작 입력"},400);
 for(let attempt=0;attempt<12;attempt++){
  const row=await db.prepare('SELECT r.state,r.version,c.opened,c.revision FROM classroom c LEFT JOIN rooms r ON r.code=? AND r.expires>? WHERE c.id=1').bind(code,now).first<{state:string|null;version:number;opened:number;revision:number}>();if(!row)throw Error('Classroom configuration missing');if(!row.opened)return reply({error:"선생님 전체 게임 종료"},423);gate={open:true,revision:row.revision};if(!row.state)return reply({error:"방 종료 · 새 방 입장 필요"},404);
  const r=JSON.parse(row.state);if(!isRace(r))return reply({error:"다른 게임 방 · 게임 선택 필요"},409);
  const before=JSON.stringify(r);r.players=r.players.filter(p=>now-p.last<ROOM_IDLE_MS);
  if(!r.players.length){await db.prepare('DELETE FROM rooms WHERE code=? AND version=?').bind(code,row.version).run();return reply({error:"전원 퇴장 · 방 종료"},404);}
  if(!r.players.some(p=>p.id===r.host))r.host=r.players[0].id;
  advanceRace(r,now);let p=r.players.find(p=>p.token===a.token),token:string|undefined;
  if(a.action==='join'&&!p){if(r.phase==='playing')return reply({error:"경기 중 · 종료 후 입장 가능"},409);if(r.players.length>=CAPACITY)return reply({error:"정원 20명 도달"},409);p=makeRacer(crypto.randomUUID(),name,now,r.players.length);token=crypto.randomUUID();p.token=token;r.players.push(p);}
  if(!p)return reply({error:"방 코드 재입장 필요"},401);
  if(a.action==='input'){
   if(a.round!==r.round)return reply({room:publicRace(r),id:p.id,serverTime:now});
   if(!r.paused&&r.phase==='playing'&&now>=r.start){p.at=Math.max(p.at,now-INPUT_WINDOW,r.start);for(const c of a.commands as RaceInput[]){if(c.seq<=p.seq)continue;if(c.seq!==p.seq+1||p.at+STEP>now)break;p.seq=c.seq;p.at+=STEP;stepRacer(r,p,c,p.at);}advanceRace(r,now);}
  }else if(['start','pause','end'].includes(a.action)){
   if(p.id!==r.host)return reply({error:"방장만 변경 가능"},403);
   if(a.action==='start'){if(r.phase==='playing'||r.players.length<2)return reply({error:"2명 이상 시작 가능"},409);startRace(r,now);p=r.players.find(q=>q.id===p!.id)!;}
   if(a.action==='pause')pauseRace(r,now,typeof a.paused==='boolean'?a.paused:!r.paused);if(a.action==='end')finishRace(r,"방장 경기 종료");
  }else if(a.action==='leave'){
   r.players=r.players.filter(q=>q.id!==p!.id);if(!r.players.length){const result=await db.prepare('DELETE FROM rooms WHERE code=? AND version=?').bind(code,row.version).run();if(result.meta.changes)return reply({left:true});continue;}if(r.host===p.id)r.host=r.players[0].id;advanceRace(r,now);
  }else if(!['state','join'].includes(a.action))return reply({error:"미지원 요청"},400);
 if(['pause','end'].includes(a.action)){const saved=await writeControl(JSON.parse(before),r,code,now,gate.revision);if(saved)return reply({room:publicRace(r),id:p.id,serverTime:now});if(saved===false)continue;}
  if(now-p.last>=5000||!['state','input'].includes(a.action))p.last=now;recordConnection(p,a.rtt,now);
  if(before===JSON.stringify(r))return reply({room:publicRace(r),id:p.id,serverTime:now});
  // Moving peers must not invalidate each other's writes. Compare and replace
  // only this player's JSON, while retaining room/teacher lifecycle guards.
  const original=JSON.parse(before),index=original.players.findIndex((q:{id:string})=>q.id===p.id);
  if(['input','state'].includes(a.action)&&r.phase==='playing'&&original.phase==='playing'&&index>=0&&r.players.length===original.players.length){
   const path=`$.players[${index}]`,oldPlayer=original.players[index];
   const newFinish=!oldPlayer.finished&&p.finished?r.finishers?.find(q=>q.id===p.id):undefined;
   const expression=newFinish?"json_insert(json_set(state,?,json(?)),'$.finishers[#]',json(?))":"json_set(state,?,json(?))";
   const values:unknown[]=[path,JSON.stringify(p)];if(newFinish)values.push(JSON.stringify(newFinish));
   const saved=await db.prepare(`UPDATE rooms SET state=${expression},version=version+1,expires=? WHERE code=? AND expires>? AND json_extract(state,'$.round')=? AND json_extract(state,'$.phase')='playing' AND json_extract(state,'$.paused')=? AND json_extract(state,?)=json(?) AND EXISTS (SELECT 1 FROM classroom WHERE id=1 AND opened=1 AND revision=?)`).bind(...values,now+ROOM_IDLE_MS,code,now,r.round,original.paused,path,JSON.stringify(oldPlayer),gate.revision).run();
   if(saved.meta.changes)return reply({room:publicRace(r),id:p.id,serverTime:now});
   continue;
  }
  const saved=await db.prepare('UPDATE rooms SET state=?,version=version+1,expires=? WHERE code=? AND version=? AND expires>? AND EXISTS (SELECT 1 FROM classroom WHERE id=1 AND opened=1 AND revision=?)').bind(JSON.stringify(r),now+ROOM_IDLE_MS,code,row.version,now,gate.revision).run();
  if(saved.meta.changes)return reply(a.action==='leave'?{left:true}:{room:publicRace(r),id:p.id,...(token?{token}:{}),serverTime:now});
  await new Promise(resolve=>setTimeout(resolve,10+Math.random()*15));
 }
 return reply({error:"연결 지연 · 재연결 중"},503);
 }catch(e){console.error('race request',e);return reply({error:"연결 확인 필요"},500);}}
