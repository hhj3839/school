import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {registerHooks} from 'node:module';
import {readFileSync} from 'node:fs';
const sql=new DatabaseSync(':memory:');
for(const file of ['0000_high_roulette.sql','0001_marvelous_psynapse.sql','0002_majestic_captain_universe.sql','0003_moaning_dakota_north.sql','0004_lovely_captain_universe.sql'])sql.exec(readFileSync(new URL('../drizzle/'+file,import.meta.url),'utf8'));
sql.exec('UPDATE classroom SET student_create=1');
globalThis.__testEnv={TEACHER_KEY:'test-only-secret',DB:{
 prepare(query){let values=[];return {bind(...args){values=args;return this;},async first(){return sql.prepare(query).get(...values)||null;},async all(){return {results:sql.prepare(query).all(...values)};},async run(){return {meta:sql.prepare(query).run(...values)};}};},
 async batch(statements){sql.exec('BEGIN');try{const results=[];for(const s of statements)results.push(await s.run());sql.exec('COMMIT');return results;}catch(e){sql.exec('ROLLBACK');throw e;}}
}};
registerHooks({resolve(s,c,next){if(s==='cloudflare:workers')return {url:'test:cloudflare',shortCircuit:true};try{return next(s,c)}catch(e){if(s.startsWith('.'))return next(s+'.ts',c);throw e;}},load(url,c,next){if(url==='test:cloudflare')return {format:'module',source:'export const env=globalThis.__testEnv;',shortCircuit:true};return next(url,c);}});
const classroom=await import('../app/api/classroom/route.ts'),room=await import('../app/api/room/route.ts');
async function call(handler,path,body,key,origin='http://localhost'){const response=await handler(new Request('http://localhost/api/'+path,{method:'POST',headers:{'Content-Type':'application/json',Origin:origin,...(key?{Authorization:'Bearer '+key}:{})},body:JSON.stringify(body)}));return {status:response.status,...await response.json()};}
const control=(action,key='test-only-secret',origin)=>call(classroom.POST,'classroom',{action},key,origin);
const play=(action,data={})=>call(room.POST,'room',{action,...data});

const {ammunition,finalHint,spectatorPlayers,makeRoom,makePlayer}=await import('../app/game.ts');
sql.exec('UPDATE classroom SET student_create=0');
const teacher=await play('create',{name:'학생 방장'});assert.equal(teacher.status,200);
const session={code:teacher.room.code,token:teacher.token};
const gate=await (await classroom.GET()).json();assert.equal(gate.studentCreate,true);
assert.ok(!JSON.stringify(gate).includes(teacher.token));
assert.equal((await play('join',{code:session.code,name:'친구'})).status,200);
sql.exec('UPDATE classroom SET last_created=0');
const other=await play('create',{name:'다른 방'});assert.equal(other.status,200);
assert.equal((await play('join',{code:other.room.code,name:'자유 입장'})).status,200);
let now=Date.now();const realNow=Date.now;Date.now=()=>now;
try{
 await play('next',session);await play('next',session);
 for(let i=0;i<3;i++){const shot=await play('catch',{...session,target:'',aim:{yaw:0,pitch:0}});assert.equal(shot.status,200);now+=800;}
 assert.equal((await play('catch',{...session,target:'',aim:{yaw:0,pitch:0}})).status,409,'fourth shot rejected by server');
 const before=(await play('state',session)).room.players.find(p=>p.id===teacher.id);assert.ok(ammunition(before,now).wait>0);
 await play('pause',session);now+=5000;await play('pause',session);
 assert.equal((await play('catch',{...session,target:'',aim:{yaw:0,pitch:0}})).status,409,'pause does not refill ammunition');
 now+=3000;assert.equal((await play('catch',{...session,target:'',aim:{yaw:0,pitch:0}})).status,200);
 const tick=await play('tick',{...session,viewYaw:1.2,viewPitch:50,dx:0,dy:0});assert.equal(tick.room.players.find(p=>p.id===teacher.id).viewYaw,1.2);assert.equal(tick.room.players.find(p=>p.id===teacher.id).viewPitch,.95);
 const r=tick.room;r.end=now+29000;const hint=finalHint(r,now);assert.ok(hint);assert.deepEqual(Object.keys(hint).sort(),['x','y','z']);
 assert.equal(finalHint({...r,end:now+31000},now),null);assert.equal(finalHint({...r,end:now+25000},now),null);assert.equal(finalHint({...r,paused:now},now),null);assert.equal(finalHint({...r,phase:'result'},now),null);
 assert.ok(spectatorPlayers(r).every(p=>p.role==='seeker'));
 await control('close');assert.equal((await play('create',{name:'학생'})).status,423);
}finally{Date.now=realNow;}
console.log('PASS: free student creation and joins with legacy restrictions disabled, server-enforced magazine/reload, paused reload, seeker camera sync/clamp, coarse timed hints, seeker-only watch targets');
