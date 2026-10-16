import {recordConnection} from '../../connection';
import {database} from '../../../db/raw';
import {writePlayer,writeControl} from '../../player-write';
import {classroomState} from '../../classroom';
import {MAX_ROOMS,ROOM_IDLE_MS,CREATE_GAP_MS,cleanIdleRooms} from '../../room-limits';
import {advanceBlocks,blockCommand,finishBlocks,isBlocks,makeBlockPlayer,makeBlockRoom,pauseBlocks,publicBlocks,startBlocks,type Command} from '../../blocks/engine';
export const dynamic='force-dynamic';
const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
const seed=()=>crypto.getRandomValues(new Uint32Array(1))[0];
export async function POST(req:Request){try{
 if(req.headers.get('origin')&&req.headers.get('origin')!==new URL(req.url).origin)return reply({error:"외부 사이트 요청 제한"},403);
 const raw=await req.text();if(raw.length>4096)return reply({error:"요청 크기 초과"},413);
 const a=JSON.parse(raw),db=database(),now=Date.now();
 let gate:{open:boolean;revision:number};
 if(a.action==='create'){
  gate=await classroomState();if(!gate.open)return reply({error:"선생님 전체 게임 종료"},423);
  
  
  await cleanIdleRooms(now);
  const code=Array.from(crypto.getRandomValues(new Uint8Array(6)),b=>'ABCDEFGHJKMNPQRSTUVWXYZ23456789'[b%29]).join('');
  const p=makeBlockPlayer(crypto.randomUUID(),String(a.name||'친구').trim().slice(0,12)||'친구',now,seed());p.token=crypto.randomUUID();const r=makeBlockRoom(code,p,a.attack!==false),state=JSON.stringify(r);
  const [saved]=await db.batch([
   db.prepare('INSERT OR IGNORE INTO rooms(code,state,version,expires) SELECT ?,?,0,? WHERE EXISTS (SELECT 1 FROM classroom WHERE id=1 AND opened=1 AND revision=? AND last_created<=?) AND (SELECT COUNT(*) FROM rooms WHERE expires>?)<?').bind(code,state,now+ROOM_IDLE_MS,gate.revision,now-CREATE_GAP_MS,now,MAX_ROOMS),
   db.prepare('UPDATE classroom SET last_created=? WHERE id=1 AND EXISTS (SELECT 1 FROM rooms WHERE code=? AND state=?)').bind(now,code,state)
  ]);
  if(saved.meta.changes)return reply({room:publicBlocks(r),id:p.id,token:p.token,serverTime:now});
  const count=await db.prepare('SELECT COUNT(*) AS n FROM rooms WHERE expires>?').bind(now).first<{n:number}>();
  return reply({error:(count?.n||0)>=MAX_ROOMS?"방 생성 한도 초과 · 기존 방 참여 필요":"방 생성 간격 5초 · 잠시 대기"},429);
 }
 const code=String(a.code||'').toUpperCase();if(!/^[A-Z2-9]{6}$/.test(code))return reply({error:"6자리 방 코드 확인 필요"},400);
 if(a.action==='input'&&(!Array.isArray(a.commands)||a.commands.length>12||a.commands.some((c:{seq:number;key:string})=>!c||!Number.isSafeInteger(c.seq)||c.seq<1||!['left','right','rotate','down','drop','item-shield','item-clean','item-attack'].includes(c.key))))return reply({error:"조작 정보 확인 필요"},400);
 for(let attempt=0;attempt<12;attempt++){
  const row=await db.prepare('SELECT r.state,r.version,c.opened,c.revision FROM classroom c LEFT JOIN rooms r ON r.code=? AND r.expires>? WHERE c.id=1').bind(code,now).first<{state:string|null;version:number;opened:number;revision:number}>();if(!row)throw Error('Classroom configuration missing');if(!row.opened)return reply({error:"선생님 전체 게임 종료"},423);gate={open:true,revision:row.revision};if(!row.state)return reply({error:"방 종료 · 새 방 입장 필요"},404);
  const r=JSON.parse(row.state);if(!isBlocks(r))return reply({error:"다른 게임 방 · 게임 선택 필요"},409);
  const before=JSON.stringify(r);r.players=r.players.filter(p=>now-p.last<ROOM_IDLE_MS);
  if(!r.players.length){await db.prepare('DELETE FROM rooms WHERE code=? AND version=?').bind(code,row.version).run();return reply({error:"전원 퇴장 · 방 종료"},404);}
  if(!r.players.some(p=>p.id===r.host))r.host=r.players[0].id;
  advanceBlocks(r,now);let p=r.players.find(p=>p.token===a.token),newToken:string|undefined;
  if(a.action==='join'&&!p){
   
   if(r.phase==='playing')return reply({error:"경기 중 · 종료 후 입장 가능"},409);
   if(r.players.length>=4)return reply({error:"정원 4명 도달 · 다른 방 입장 필요"},409);
   p=makeBlockPlayer(crypto.randomUUID(),String(a.name||'친구').trim().slice(0,12)||'친구',now,seed());newToken=crypto.randomUUID();p.token=newToken;r.players.push(p);
  }
  if(!p)return reply({error:"입장 정보 없음 · 방 코드 재입장 필요"},401);
  if(a.action==='input'){
   if(a.round!==r.round)return reply({room:publicBlocks(r),id:p.id,serverTime:now});
   let budget=Math.min(12,Math.max(0,Math.floor((now-p.inputAt)/45)));
   for(const c of a.commands as {seq:number;key:Command}[]){if(c.seq<=p.seq)continue;if(c.seq!==p.seq+1)break;if(!budget)break;budget--;p.seq=c.seq;blockCommand(r,p,c.key,now);p.inputAt=now-(budget*45);}
   advanceBlocks(r,now);
  }else if(['start','pause','end','mode'].includes(a.action)){
   if(p.id!==r.host)return reply({error:"방장만 변경 가능"},403);
   if(a.action==='start'){if(r.phase==='playing'||r.players.length<2)return reply({error:"2명 이상 시작 가능"},409);startBlocks(r,now,seed());p=r.players.find(q=>q.id===p!.id)!;}
   if(a.action==='pause')pauseBlocks(r,now,typeof a.paused==='boolean'?a.paused:!r.paused);
   if(a.action==='end')finishBlocks(r,"방장 경기 종료");
   if(a.action==='mode'){if(r.phase==='playing')return reply({error:"경기 종료 후 변경 가능"},409);r.attack=!!a.attack;}
  }else if(a.action==='leave'){
   r.players=r.players.filter(q=>q.id!==p!.id);if(!r.players.length){const removed=await db.prepare('DELETE FROM rooms WHERE code=? AND version=?').bind(code,row.version).run();if(removed.meta.changes)return reply({left:true});continue;}
   if(r.host===p.id)r.host=r.players[0].id;advanceBlocks(r,now);
  }else if(!['join','state'].includes(a.action))return reply({error:"미지원 요청"},400);
 if(['pause','end'].includes(a.action)){const saved=await writeControl(JSON.parse(before),r,code,now,gate.revision);if(saved)return reply({room:publicBlocks(r),id:p.id,serverTime:now});if(saved===false)continue;}
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
 return reply({error:"연결 지연 · 재연결 중"},503);
 }catch(e){console.error('blocks request',e);return reply({error:"연결 확인 필요"},500);}}
