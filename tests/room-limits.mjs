import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {registerHooks} from 'node:module';
import {readFileSync} from 'node:fs';
const sql=new DatabaseSync(':memory:');let testNow=2000000000000;Date.now=()=>testNow;let batchQueue=Promise.resolve();
for(const file of ['0000_high_roulette.sql','0001_marvelous_psynapse.sql','0002_majestic_captain_universe.sql','0003_moaning_dakota_north.sql'])sql.exec(readFileSync(new URL('../drizzle/'+file,import.meta.url),'utf8'));
globalThis.__testEnv={TEACHER_KEY:'test-only-secret',DB:{
 prepare(query){let values=[];return {bind(...args){values=args;return this;},async first(){return sql.prepare(query).get(...values)||null;},async all(){return {results:sql.prepare(query).all(...values)};},async run(){return {meta:sql.prepare(query).run(...values)};}};},
 batch(statements){const job=batchQueue.then(async()=>{sql.exec('BEGIN');try{const results=[];for(const s of statements)results.push(await s.run());sql.exec('COMMIT');return results;}catch(e){sql.exec('ROLLBACK');throw e;}});batchQueue=job.catch(()=>{});return job;}

}};
registerHooks({resolve(s,c,next){if(s==='cloudflare:workers')return {url:'test:cloudflare',shortCircuit:true};try{return next(s,c)}catch(e){if(s.startsWith('.'))return next(s+'.ts',c);throw e;}},load(url,c,next){if(url==='test:cloudflare')return {format:'module',source:'export const env=globalThis.__testEnv;',shortCircuit:true};return next(url,c);}});
const classroom=await import('../app/api/classroom/route.ts'),room=await import('../app/api/room/route.ts');
async function call(handler,path,body,key,origin='http://localhost'){const response=await handler(new Request('http://localhost/api/'+path,{method:'POST',headers:{'Content-Type':'application/json',Origin:origin,...(key?{Authorization:'Bearer '+key}:{})},body:JSON.stringify(body)}));return {status:response.status,...await response.json()};}
const control=(action,key='test-only-secret',origin)=>call(classroom.POST,'classroom',{action},key,origin);
const play=(action,data={})=>call(room.POST,'room',{action,...data});

const {MAX_ROOMS,ROOM_IDLE_MS,CREATE_GAP_MS}=await import('../app/room-limits.ts');
const burst=await Promise.all(Array.from({length:20},()=>play('create',{name:'연속 생성'})));
assert.equal(burst.filter(r=>r.status===200).length,1,'atomic admission permits only one burst request');
assert.equal(burst.filter(r=>r.status===429).length,19);
const sessions=burst.filter(r=>r.status===200).map(r=>({code:r.room.code,token:r.token}));
for(let i=1;i<MAX_ROOMS;i++){testNow+=CREATE_GAP_MS;const r=await play('create',{name:'모둠'+i});assert.equal(r.status,200);sessions.push({code:r.room.code,token:r.token});}
testNow+=CREATE_GAP_MS;
const full=await Promise.all(Array.from({length:10},()=>play('create',{name:'초과'})));assert.ok(full.every(r=>r.status===409));assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM rooms').get().n,5);
let status=await control('status');assert.deepEqual(status.totals,{rooms:5,playing:0,online:2});assert.equal(status.limits.maxRooms,5);
const joined=await play('join',{code:sessions[0].code,name:'친구'});assert.equal(joined.status,200);await play('next',sessions[0]);status=await control('status');assert.equal(status.totals.playing,1);
// Last departure immediately frees the slot, but does not bypass creation cooldown.
await play('leave',sessions[4]);const replacement=await play('create',{name:'새 모둠'});assert.equal(replacement.status,200);await play('leave',{code:replacement.room.code,token:replacement.token});assert.equal((await play('create',{name:'재생성'})).status,429);
// A connected room survives while abandoned rooms expire; host transfers after disconnect.
testNow+=ROOM_IDLE_MS-1000;assert.equal((await play('tick',{code:joined.room.code,token:joined.token})).status,200);
testNow+=2000;status=await control('status');assert.equal(status.rooms.length,1);assert.equal(status.totals.online,1);assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM rooms').get().n,1);
const active=await play('state',{code:joined.room.code,token:joined.token});assert.equal(active.room.host,joined.id);assert.equal(active.room.players.length,1);assert.equal((await play('state',sessions[0])).status,401);
assert.equal((await play('state',sessions[1])).status,404);assert.equal((await play('create',{name:'빈자리'})).status,200);
testNow+=ROOM_IDLE_MS;status=await control('status');assert.equal(status.rooms.length,0);assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM rooms').get().n,0);
assert.equal((await control('status','wrong')).status,401);
console.log('PASS: 20 simultaneous creates admitted once, shared cooldown, atomic five-room cap, immediate last-leave cleanup, idle expiry/cleanup, active heartbeat retention, host transfer, teacher totals and authorization');
