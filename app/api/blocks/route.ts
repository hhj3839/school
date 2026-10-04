import {recordConnection} from '../../connection';
import {database} from '../../../db/raw';
import {writePlayer} from '../../player-write';
import {classroomState} from '../../classroom';
import {MAX_ROOMS,ROOM_IDLE_MS,CREATE_GAP_MS,cleanIdleRooms} from '../../room-limits';
import {advanceBlocks,blockCommand,finishBlocks,isBlocks,makeBlockPlayer,makeBlockRoom,pauseBlocks,publicBlocks,startBlocks,type Command} from '../../blocks/engine';
export const dynamic='force-dynamic';
const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
const seed=()=>crypto.getRandomValues(new Uint32Array(1))[0];
export async function POST(req:Request){try{
 if(req.headers.get('origin')&&req.headers.get('origin')!==new URL(req.url).origin)return reply({error:'다른 사이트에서는 요청할 수 없어요.'},403);
 const raw=await req.text();if(raw.length>4096)return reply({error:'요청이 너무 커요.'},413);
 const a=JSON.parse(raw),db=database(),now=Date.now(),gate=await classroomState();
 if(!gate.open)return reply({error:'선생님이 모든 게임을 종료했어요.'},423);
 if(a.action==='create'){
  
  
  await cleanIdleRooms(now);
  const code=Array.from(crypto.getRandomValues(new Uint8Array(6)),b=>'ABCDEFGHJKMNPQRSTUVWXYZ23456789'[b%29]).join('');
  const p=makeBlockPlayer(crypto.randomUUID(),String(a.name||'친구').trim().slice(0,12)||'친구',now,seed());p.token=crypto.randomUUID();const r=makeBlockRoom(code,p,a.attack!==false),state=JSON.stringify(r);
  const [saved]=await db.batch([
   db.prepare('INSERT OR IGNORE INTO rooms(code,state,version,expires) SELECT ?,?,0,? WHERE EXISTS (SELECT 1 FROM classroom WHERE id=1 AND opened=1 AND revision=? AND last_created<=?) AND (SELECT COUNT(*) FROM rooms WHERE expires>?)<?').bind(code,state,now+ROOM_IDLE_MS,gate.revision,now-CREATE_GAP_MS,now,MAX_ROOMS),
   db.prepare('UPDATE classroom SET last_created=? WHERE id=1 AND EXISTS (SELECT 1 FROM rooms WHERE code=? AND state=?)').bind(now,code,state)
  ]);
  if(saved.meta.changes)return reply({room:publicBlocks(r),id:p.id,token:p.token,serverTime:now});
  const count=await db.prepare('SELECT COUNT(*) AS n FROM rooms WHERE expires>?').bind(now).first<{n:number}>();
  return reply({error:(count?.n||0)>=MAX_ROOMS?'지금은 방이 모두 찼어요. 친구 방에 들어가 주세요.':'새 방은 5초 간격으로 만들 수 있어요. 잠깐 기다려 주세요.'},429);
 }
 const code=String(a.code||'').toUpperCase();if(!/^[A-Z2-9]{6}$/.test(code))return reply({error:'방 코드 6자리를 확인해 주세요.'},400);
 if(a.action==='input'&&(!Array.isArray(a.commands)||a.commands.length>12||a.commands.some((c:{seq:number;key:string})=>!c||!Number.isSafeInteger(c.seq)||c.seq<1||!['left','right','rotate','down','drop'].includes(c.key))))return reply({error:'조작 정보를 다시 확인해 주세요.'},400);
 for(let attempt=0;attempt<12;attempt++){
  const row=await db.prepare('SELECT state,version,expires FROM rooms WHERE code=? AND expires>?').bind(code,now).first<{state:string;version:number;expires:number}>();if(!row)return reply({error:'방이 끝났어요. 새 방에 들어가 주세요.'},404);
  const r=JSON.parse(row.state);if(!isBlocks(r))return reply({error:'다른 게임의 방이에요. 게임을 다시 골라 주세요.'},409);
  const before=JSON.stringify(r);r.players=r.players.filter(p=>now-p.last<ROOM_IDLE_MS);
  if(!r.players.length){await db.prepare('DELETE FROM rooms WHERE code=? AND version=?').bind(code,row.version).run();return reply({error:'모두 나가서 방이 정리됐어요.'},404);}
  if(!r.players.some(p=>p.id===r.host))r.host=r.players[0].id;
  advanceBlocks(r,now);let p=r.players.find(p=>p.token===a.token),newToken:string|undefined;
  if(a.action==='join'&&!p){
   
   if(r.phase==='playing')return reply({error:'경기 중이에요. 이번 판이 끝나면 들어올 수 있어요.'},409);
   if(r.players.length>=4)return reply({error:'4명이 모두 모였어요. 다른 방에 들어가 주세요.'},409);
   p=makeBlockPlayer(crypto.randomUUID(),String(a.name||'친구').trim().slice(0,12)||'친구',now,seed());newToken=crypto.randomUUID();p.token=newToken;r.players.push(p);
  }
  if(!p)return reply({error:'입장 정보가 없어요. 방 코드로 다시 들어가 주세요.'},401);
  if(a.action==='input'){
   if(a.round!==r.round)return reply({room:publicBlocks(r),id:p.id,serverTime:now});
   let budget=Math.min(12,Math.max(0,Math.floor((now-p.inputAt)/45)));
   for(const c of a.commands as {seq:number;key:Command}[]){if(c.seq<=p.seq)continue;if(c.seq!==p.seq+1)break;if(!budget)break;budget--;p.seq=c.seq;blockCommand(r,p,c.key,now);p.inputAt=now-(budget*45);}
   advanceBlocks(r,now);
  }else if(['start','pause','end','mode'].includes(a.action)){
   if(p.id!==r.host)return reply({error:'방장만 바꿀 수 있어요.'},403);
   if(a.action==='start'){if(r.phase==='playing'||r.players.length<2)return reply({error:'친구가 2명 이상 모이면 시작해요.'},409);startBlocks(r,now,seed());p=r.players.find(q=>q.id===p!.id)!;}
   if(a.action==='pause')pauseBlocks(r,now,!r.paused);
   if(a.action==='end')finishBlocks(r,'방장이 이번 판을 마쳤어요');
   if(a.action==='mode'){if(r.phase==='playing')return reply({error:'경기가 끝나면 바꿀 수 있어요.'},409);r.attack=!!a.attack;}
  }else if(a.action==='leave'){
   r.players=r.players.filter(q=>q.id!==p!.id);if(!r.players.length){const removed=await db.prepare('DELETE FROM rooms WHERE code=? AND version=?').bind(code,row.version).run();if(removed.meta.changes)return reply({left:true});continue;}
   if(r.host===p.id)r.host=r.players[0].id;advanceBlocks(r,now);
  }else if(!['join','state'].includes(a.action))return reply({error:'지원하지 않는 요청이에요.'},400);
  if(now-p.last>=5000||!['state','input'].includes(a.action))p.last=now;recordConnection(p,a.rtt,now);
  if(JSON.stringify(r)===before)return reply({room:publicBlocks(r),id:p.id,serverTime:now});
  if(['input','state'].includes(a.action)){
   const saved=await writePlayer(JSON.parse(before),r,p.id,code,now,gate.revision);
   if(saved)return reply({room:publicBlocks(r),id:p.id,serverTime:now});
   if(saved===false)continue;
  }
  const saved=await db.prepare('UPDATE rooms SET state=?,version=version+1,expires=? WHERE code=? AND version=? AND expires>? AND EXISTS (SELECT 1 FROM classroom WHERE id=1 AND opened=1 AND revision=?)').bind(JSON.stringify(r),now+ROOM_IDLE_MS,code,row.version,now,gate.revision).run();
  if(saved.meta.changes)return reply(a.action==='leave'?{left:true}:{room:publicBlocks(r),id:p.id,...(newToken?{token:newToken}:{}),serverTime:now});
  await new Promise(resolve=>setTimeout(resolve,10+Math.random()*15));
 }
 return reply({error:'잠깐 연결이 밀렸어요. 다시 연결할게요.'},503);
 }catch(e){console.error('blocks request',e);return reply({error:'연결을 확인해 주세요.'},500);}}
