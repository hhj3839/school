import {database} from '../../../db/raw';
import {classroomState} from '../../classroom';
import {MAX_ROOMS,ROOM_IDLE_MS,CREATE_GAP_MS,cleanIdleRooms} from '../../room-limits';
import {isRace,makeRace,makeRacer,startRace,advanceRace,stepRacer,publicRace,pauseRace,finishRace,STEP,CAPACITY,type RaceInput} from '../../race/engine';
export const dynamic='force-dynamic';
const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
export async function POST(req:Request){try{
 if(req.headers.get('origin')&&req.headers.get('origin')!==new URL(req.url).origin)return reply({error:'허용되지 않은 요청이에요.'},403);
 const raw=await req.text();if(raw.length>4096)return reply({error:'요청이 너무 커요.'},413);
 const a=JSON.parse(raw),now=Date.now(),db=database(),gate=await classroomState();
 if(!gate.open)return reply({error:'선생님이 모든 게임을 종료했어요.'},423);
 const name=String(a.name||'친구').trim().slice(0,12)||'친구';
 if(a.action==='create'){
  await cleanIdleRooms(now);const code=Array.from(crypto.getRandomValues(new Uint8Array(6)),b=>'ABCDEFGHJKMNPQRSTUVWXYZ23456789'[b%29]).join('');
  const p=makeRacer(crypto.randomUUID(),name,now);p.token=crypto.randomUUID();const r=makeRace(code,p),state=JSON.stringify(r);
  const [saved]=await db.batch([
   db.prepare('INSERT OR IGNORE INTO rooms(code,state,version,expires) SELECT ?,?,0,? WHERE EXISTS (SELECT 1 FROM classroom WHERE id=1 AND opened=1 AND revision=? AND last_created<=?) AND (SELECT COUNT(*) FROM rooms WHERE expires>?)<?').bind(code,state,now+ROOM_IDLE_MS,gate.revision,now-CREATE_GAP_MS,now,MAX_ROOMS),
   db.prepare('UPDATE classroom SET last_created=? WHERE id=1 AND EXISTS (SELECT 1 FROM rooms WHERE code=? AND state=?)').bind(now,code,state)
  ]);if(saved.meta.changes)return reply({room:publicRace(r),id:p.id,token:p.token,serverTime:now});
  return reply({error:'방이 모두 찼거나 방을 만든 지 5초가 지나지 않았어요. 잠깐 후 다시 해 주세요.'},429);
 }
 const code=String(a.code||'').toUpperCase();if(!/^[A-Z2-9]{6}$/.test(code))return reply({error:'방 코드 6자리를 확인해 주세요.'},400);
 if(a.action==='input'&&(!Array.isArray(a.commands)||a.commands.length>8||a.commands.some((c:RaceInput)=>!c||!Number.isSafeInteger(c.seq)||c.seq<1||!Number.isFinite(c.x)||!Number.isFinite(c.z)||Math.abs(c.x)>1||Math.abs(c.z)>1||typeof c.jump!=='boolean')))return reply({error:'올바르지 않은 조작이에요.'},400);
 for(let attempt=0;attempt<12;attempt++){
  const row=await db.prepare('SELECT state,version FROM rooms WHERE code=? AND expires>?').bind(code,now).first<{state:string;version:number}>();if(!row)return reply({error:'방이 끝났어요. 새 방으로 들어가 주세요.'},404);
  const r=JSON.parse(row.state);if(!isRace(r))return reply({error:'다른 게임의 방이에요. 게임을 다시 골라 주세요.'},409);
  const before=JSON.stringify(r);r.players=r.players.filter(p=>now-p.last<ROOM_IDLE_MS);
  if(!r.players.length){await db.prepare('DELETE FROM rooms WHERE code=? AND version=?').bind(code,row.version).run();return reply({error:'모두 나가서 방이 정리됐어요.'},404);}
  if(!r.players.some(p=>p.id===r.host))r.host=r.players[0].id;
  advanceRace(r,now);let p=r.players.find(p=>p.token===a.token),token:string|undefined;
  if(a.action==='join'&&!p){if(r.phase==='playing')return reply({error:'경기 중이에요. 이번 판이 끝나면 들어올 수 있어요.'},409);if(r.players.length>=CAPACITY)return reply({error:'20명이 모두 모였어요.'},409);p=makeRacer(crypto.randomUUID(),name,now,r.players.length);token=crypto.randomUUID();p.token=token;r.players.push(p);}
  if(!p)return reply({error:'방 코드로 다시 들어가 주세요.'},401);
  if(a.action==='input'){
   if(a.round!==r.round)return reply({room:publicRace(r),id:p.id,serverTime:now});
   if(!r.paused&&r.phase==='playing'&&now>=r.start){p.at=Math.max(p.at,now-400,r.start);for(const c of a.commands as RaceInput[]){if(c.seq<=p.seq)continue;if(c.seq!==p.seq+1||p.at+STEP>now)break;p.seq=c.seq;p.at+=STEP;stepRacer(r,p,c,p.at);}advanceRace(r,now);}
  }else if(['start','pause','end'].includes(a.action)){
   if(p.id!==r.host)return reply({error:'방장만 바꿀 수 있어요.'},403);
   if(a.action==='start'){if(r.phase==='playing'||r.players.length<2)return reply({error:'2명 이상 모이면 시작할 수 있어요.'},409);startRace(r,now);p=r.players.find(q=>q.id===p!.id)!;}
   if(a.action==='pause')pauseRace(r,now,!r.paused);if(a.action==='end')finishRace(r,'방장이 이번 판을 마쳤어요');
  }else if(a.action==='leave'){
   r.players=r.players.filter(q=>q.id!==p!.id);if(!r.players.length){const result=await db.prepare('DELETE FROM rooms WHERE code=? AND version=?').bind(code,row.version).run();if(result.meta.changes)return reply({left:true});continue;}if(r.host===p.id)r.host=r.players[0].id;advanceRace(r,now);
  }else if(!['state','join'].includes(a.action))return reply({error:'지원하지 않는 요청이에요.'},400);
  if(now-p.last>=5000||!['state','input'].includes(a.action))p.last=now;
  if(before===JSON.stringify(r))return reply({room:publicRace(r),id:p.id,serverTime:now});
  const saved=await db.prepare('UPDATE rooms SET state=?,version=version+1,expires=? WHERE code=? AND version=? AND expires>? AND EXISTS (SELECT 1 FROM classroom WHERE id=1 AND opened=1 AND revision=?)').bind(JSON.stringify(r),now+ROOM_IDLE_MS,code,row.version,now,gate.revision).run();
  if(saved.meta.changes)return reply(a.action==='leave'?{left:true}:{room:publicRace(r),id:p.id,...(token?{token}:{}),serverTime:now});
  await new Promise(resolve=>setTimeout(resolve,10+Math.random()*15));
 }
 return reply({error:'잠깐 연결이 밀렸어요. 다시 연결할게요.'},503);
 }catch(e){console.error('race request',e);return reply({error:'연결을 확인해 주세요.'},500);}}
