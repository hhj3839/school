import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {registerHooks} from 'node:module';
import {readFileSync} from 'node:fs';
const sql=new DatabaseSync(':memory:');
for(const file of ['0000_high_roulette.sql','0001_marvelous_psynapse.sql','0002_majestic_captain_universe.sql','0003_moaning_dakota_north.sql'])sql.exec(readFileSync(new URL('../drizzle/'+file,import.meta.url),'utf8'));
globalThis.__testEnv={TEACHER_KEY:'test-only-secret',DB:{
 prepare(query){let values=[];return {bind(...args){values=args;return this;},async first(){return sql.prepare(query).get(...values)||null;},async all(){return {results:sql.prepare(query).all(...values)};},async run(){return {meta:sql.prepare(query).run(...values)};}};},
 async batch(statements){sql.exec('BEGIN');try{const results=[];for(const s of statements)results.push(await s.run());sql.exec('COMMIT');return results;}catch(e){sql.exec('ROLLBACK');throw e;}}
}};
registerHooks({resolve(s,c,next){if(s==='cloudflare:workers')return {url:'test:cloudflare',shortCircuit:true};try{return next(s,c)}catch(e){if(s.startsWith('.'))return next(s+'.ts',c);throw e;}},load(url,c,next){if(url==='test:cloudflare')return {format:'module',source:'export const env=globalThis.__testEnv;',shortCircuit:true};return next(url,c);}});
const classroom=await import('../app/api/classroom/route.ts'),room=await import('../app/api/room/route.ts');
async function call(handler,path,body,key,origin='http://localhost'){const response=await handler(new Request('http://localhost/api/'+path,{method:'POST',headers:{'Content-Type':'application/json',Origin:origin,...(key?{Authorization:'Bearer '+key}:{})},body:JSON.stringify(body)}));return {status:response.status,...await response.json()};}
const control=(action,key='test-only-secret',origin)=>call(classroom.POST,'classroom',{action},key,origin);
const play=(action,data={})=>call(room.POST,'room',{action,...data});

const h=await play('create',{name:'복구 테스트'});const session={code:h.room.code,id:h.id,token:h.token};
const g=await play('join',{code:h.room.code,name:'친구'});
await play('next',session);
const before=await play('state',session);
let stored=JSON.parse(sql.prepare('SELECT state FROM rooms WHERE code=?').get(session.code).state);
stored.players[0].last-=55000;
sql.prepare('UPDATE rooms SET state=? WHERE code=?').run(JSON.stringify(stored),session.code);
const recovered=await play('state',session);
assert.equal(recovered.status,200);assert.equal(recovered.room.players.length,2);
assert.deepEqual(recovered.room.players.find(p=>p.id===h.id).paint,before.room.players.find(p=>p.id===h.id).paint);
assert.equal(recovered.room.players.find(p=>p.id===h.id).role,before.room.players.find(p=>p.id===h.id).role);
assert.equal(recovered.room.players.find(p=>p.id===h.id).x,before.room.players.find(p=>p.id===h.id).x);
await control('close');assert.equal((await play('state',session)).status,423);
await control('open');assert.equal((await play('state',session)).status,404);
console.log('PASS: temporary absence resumes the same participant/role/paint/location without duplicate join; teacher closure and reopening prevent old-session recovery');
