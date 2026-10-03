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

const blocks=await import('../app/api/blocks/route.ts');
sql.exec('UPDATE classroom SET student_create=0');
for(const [handler,label] of [[room.POST,'숨바꼭질'],[blocks.POST,'블록']]){
 sql.exec('UPDATE classroom SET last_created=0');
 const first=await call(handler,'game',{action:'create',name:label});assert.equal(first.status,200);
 const session={code:first.room.code,token:first.token};
 const joined=await call(handler,'game',{action:'join',code:session.code,name:'친구'});assert.equal(joined.status,200);
 assert.equal((await call(classroom.POST,'classroom',{action:'deleteRoom',code:session.code},'wrong')).status,401);
 assert.equal((await call(handler,'game',{action:'state',...session})).status,200);
 const deletion=await call(classroom.POST,'classroom',{action:'deleteRoom',code:session.code},'test-only-secret');assert.equal(deletion.deleted,true);
 for(const token of [session.token,joined.token])assert.equal((await call(handler,'game',{action:'state',code:session.code,token})).status,404);
 assert.equal((await call(handler,'game',{action:'join',code:session.code,name:'새 친구'})).status,404);
 assert.equal(sql.prepare('UPDATE rooms SET version=version+1 WHERE code=?').run(session.code).changes,0,'stale writes cannot revive deleted room');
 assert.equal((await call(classroom.POST,'classroom',{action:'deleteRoom',code:session.code},'test-only-secret')).deleted,false,'idempotent delete');
}
assert.equal((await control('status')).rooms.length,0);
await control('close');assert.equal((await play('create',{name:'학생'})).status,423);await control('open');sql.exec('UPDATE classroom SET last_created=0');assert.equal((await play('create',{name:'다시 입장'})).status,200);
console.log('PASS: both games freely create/join despite old restriction; teacher-only delete; participants evicted; no rejoin or stale resurrection; all-stop retained');
