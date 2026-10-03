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
const classroom=await import('../app/api/classroom/route.ts'),room=await import('../app/api/blocks/route.ts');
async function call(handler,path,body,key,origin='http://localhost'){const response=await handler(new Request('http://localhost/api/'+path,{method:'POST',headers:{'Content-Type':'application/json',Origin:origin,...(key?{Authorization:'Bearer '+key}:{})},body:JSON.stringify(body)}));return {status:response.status,...await response.json()};}
const control=(action,key='test-only-secret',origin)=>call(classroom.POST,'classroom',{action},key,origin);
const play=(action,data={})=>call(room.POST,'room',{action,...data});


const engine=await import('../app/blocks/engine.ts');
let clock=2000000000000;Date.now=()=>clock;
sql.exec('UPDATE classroom SET student_create=0');
assert.equal((await play('create',{name:'학생'})).status,403);
const created=await call(room.POST,'room',{action:'create',name:'방장',attack:true},'test-only-secret');assert.equal(created.status,200);
const sessions=[{code:created.room.code,token:created.token}];
assert.equal((await (await classroom.GET()).json()).featured.kind,'blocks');
for(let i=1;i<4;i++){const joined=await play('join',{code:created.room.code,name:'친구'+i});assert.equal(joined.status,200);sessions.push({code:created.room.code,token:joined.token});}
assert.equal((await play('join',{code:created.room.code,name:'다섯째'})).status,409);
assert.equal((await play('start',sessions[1])).status,403);
let data=await play('start',sessions[0]);assert.equal(data.room.phase,'playing');assert.equal(data.room.players.length,4);assert.deepEqual(data.room.players[0].queue,data.room.players[1].queue);assert.ok(data.room.players.every(p=>!p.token));
clock+=3100;
data=await play('input',{...sessions[0],round:1,commands:[{seq:1,key:'left'},{seq:2,key:'drop'}]});assert.equal(data.status,200);const score=data.room.players[0].score,board=data.room.players[0].board;
assert.ok(score>0);assert.ok(board.some(Boolean));
data=await play('input',{...sessions[0],round:1,commands:[{seq:1,key:'left'},{seq:2,key:'drop'}]});assert.equal(data.room.players[0].score,score,'retry does not replay placement');assert.deepEqual(data.room.players[0].board,board);
assert.equal((await play('input',{...sessions[0],round:1,commands:[{seq:3,key:'invented'}]})).status,400);
const read=()=>JSON.parse(sql.prepare('SELECT state FROM rooms WHERE code=?').get(created.room.code).state);
const save=r=>sql.prepare('UPDATE rooms SET state=? WHERE code=?').run(JSON.stringify(r),r.code);
let r=read(),p=r.players[0];p.board=Array(200).fill(0);for(let y=16;y<20;y++)for(let x=0;x<10;x++)if(x!==5)p.board[y*10+x]=1;p.piece={kind:0,rotation:1,x:3,y:0};p.fallAt=clock+1000;save(r);clock+=600;
data=await play('input',{...sessions[0],round:1,commands:[{seq:3,key:'drop'}]});assert.equal(data.room.players[0].lines,4);assert.equal(data.room.players[1].pending,4);assert.equal(data.room.players[0].sent,4);
clock+=1300;data=await play('input',{...sessions[1],round:1,commands:[{seq:1,key:'drop'}]});assert.equal(data.room.players[1].pending,0);assert.equal(data.room.players[1].board.filter(x=>x===8).length,36,'four garbage rows have holes');
r=read();p=r.players[0];p.pending=4;p.incomingAt=clock+2000;p.board=Array(200).fill(0);for(let y=16;y<20;y++)for(let x=0;x<10;x++)if(x!==5)p.board[y*10+x]=1;p.piece={kind:0,rotation:1,x:3,y:0};p.fallAt=clock+1000;save(r);clock+=600;
data=await play('input',{...sessions[0],round:1,commands:[{seq:4,key:'drop'}]});assert.equal(data.room.players[0].pending,0);assert.equal(data.room.players[0].sent,4,'counter attack cancels before sending');
const manage=action=>call(classroom.POST,'classroom',{action,code:created.room.code},'test-only-secret');
assert.equal((await manage('pauseRoom')).status,200);r=read();const oldEnd=r.end,oldFall=r.players[0].fallAt;clock+=10000;assert.equal((await manage('resumeRoom')).status,200);r=read();assert.equal(r.end,oldEnd+10000);assert.equal(r.players[0].fallAt,oldFall+10000);
const summary=await control('status');assert.equal(summary.rooms[0].kind,'blocks');assert.equal(summary.rooms[0].online,4);
assert.equal((await manage('endRoom')).status,200);assert.equal(read().phase,'result');
data=await play('start',sessions[0]);assert.equal(data.room.round,2);assert.equal(data.room.players[0].score,0);assert.equal(data.room.players[0].seq,0);
clock+=3100;const before=read().players[0].score;data=await play('input',{...sessions[0],round:1,commands:[{seq:5,key:'drop'}]});assert.equal(data.room.players[0].score,before,'previous-round inputs ignored');
const hide=await import('../app/api/room/route.ts');assert.equal((await call(hide.POST,'room',{action:'state',...sessions[0]})).status,409);
await play('leave',sessions[0]);assert.notEqual(read().host,created.id);
assert.equal((await control('close')).open,false);assert.equal((await play('state',sessions[1])).status,423);await control('open');assert.equal((await play('state',sessions[1])).status,404);
console.log('PASS: 4-player capacity, teacher-only creation, shared teacher controls, tokens redacted, deterministic opening, authoritative inputs, retry deduplication, attacks, cancellation, garbage holes, round isolation, host transfer, close/reopen and route isolation');

// Board boundaries, rotation, line removal and timer results independently of HTTP.
const {makeBlockPlayer,makeBlockRoom,startBlocks,blockCommand,advanceBlocks,fits}=engine;
const a=makeBlockPlayer('a','A',clock,1),b=makeBlockPlayer('b','B',clock,2),match=makeBlockRoom('ABC234',a,false);match.players.push(b);startBlocks(match,clock,123);const t=match.start+10,one=match.players[0],two=match.players[1];
for(let kind=0;kind<7;kind++)for(let rotation=0;rotation<4;rotation++){one.piece={kind,rotation,x:3,y:0};assert.equal(fits(one,one.piece),true);for(let i=0;i<15;i++)blockCommand(match,one,'left',t);assert.equal(fits(one,one.piece),true);blockCommand(match,one,'rotate',t);assert.equal(fits(one,one.piece),true);}
one.board=Array(200).fill(0);for(let x=0;x<10;x++)if(x<3||x>6)one.board[190+x]=1;one.piece={kind:0,rotation:0,x:3,y:0};blockCommand(match,one,'drop',t);assert.equal(one.lines,1);assert.equal(two.pending,0,'score mode sends no garbage');assert.equal(one.board.some(Boolean),false);
one.fallAt=two.fallAt=match.end+1000;one.last=two.last=match.end;advanceBlocks(match,match.end);assert.equal(match.phase,'result');assert.equal(match.winner,'A 승리!');
console.log('PASS: seven shapes, rotations, wall boundaries, row removal, score mode and timed ranking');
