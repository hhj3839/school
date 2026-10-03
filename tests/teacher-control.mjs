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
assert.equal((await classroom.GET()).status,200);
const created=await play('create',{name:'학생'});assert.equal(created.status,200);
const session={code:created.room.code,token:created.token};
const versionBefore=sql.prepare('SELECT version FROM rooms WHERE code=?').get(session.code).version;
for(let i=0;i<10;i++)assert.equal((await play('state',session)).status,200);
assert.equal(sql.prepare('SELECT version FROM rooms WHERE code=?').get(session.code).version,versionBefore,'idle polling must not rewrite the room');


assert.equal((await control('status','wrong')).status,401);
assert.equal((await control('status','test-only-secret','https://other.example')).status,403);
const joined=await play('join',{code:session.code,name:'두 번째'});

const pin=(action,key='test-only-secret')=>call(classroom.POST,'classroom',{action,code:session.code},key);
assert.equal((await pin('featureRoom','wrong')).status,401);
assert.equal((await pin('featureRoom')).status,200);
let publicGate=await (await classroom.GET()).json();
assert.equal(publicGate.featured.code,session.code);assert.equal(publicGate.featured.canJoin,true);
assert.ok(!JSON.stringify(publicGate).includes(created.token));assert.ok(!JSON.stringify(publicGate).includes('학생'));
assert.equal((await pin('unfeatureRoom')).status,200);
assert.equal((await (await classroom.GET()).json()).featured,null);
await pin('featureRoom');
await play('next',session);
assert.equal((await (await classroom.GET()).json()).featured.canJoin,false);

const guest={code:session.code,token:joined.token};await play('pose',{...guest,locked:true});
let dashboard=await control('status');assert.equal(dashboard.rooms.length,1);assert.equal(dashboard.rooms[0].ready,1);assert.equal(dashboard.rooms[0].online,2);assert.ok(!JSON.stringify(dashboard).includes(created.token));
const manage=(action,key='test-only-secret')=>call(classroom.POST,'classroom',{action,code:session.code},key);
assert.equal((await manage('pauseRoom','wrong')).status,401);
assert.equal((await manage('pauseRoom')).room.paused,true);
const frozen=(await play('state',session)).room;assert.ok(frozen.paused);
assert.equal((await manage('pauseRoom')).room.paused,true,'pause is idempotent');
assert.equal((await manage('resumeRoom')).room.paused,false);
assert.equal((await manage('endRoom')).room.phase,'result');
assert.equal((await play('state',session)).room.phase,'result');
assert.equal((await manage('pauseRoom')).status,409);
assert.equal((await control('close','wrong')).status,401);
assert.equal((await control('close','test-only-secret','https://other.example')).status,403);
assert.equal((await control('check')).open,true);
assert.equal((await control('close')).open,false);assert.equal((await (await classroom.GET()).json()).featured,null);
for(const action of ['create','join','tick','state','paint','next','end'])assert.equal((await play(action,session)).status,423,action);
assert.equal((await control('open')).open,true);
assert.equal((await play('state',session)).status,404);
assert.equal((await play('create',{name:'새 학생'})).status,200);
// A request that read the old revision cannot write after a stop/reopen cycle.
assert.equal(sql.prepare('UPDATE rooms SET version=version+1 WHERE EXISTS (SELECT 1 FROM classroom WHERE id=1 AND opened=1 AND revision=0)').run().changes,0);
console.log('PASS: teacher dashboard authorization, readiness and presence, room pause/resume/end, no tokens exposed, teacher authentication, cross-origin denial, all room actions blocked, reopen, old rooms invalidated, stale writes denied');
