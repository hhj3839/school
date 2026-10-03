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

const game=await import('../app/game.ts');
const {MAPS,areaForCount,roomBounds,areaWalls,areaName,makeRoom,makePlayer,nextPhase,canStand,move,MAX_ELEVATION,MAP_SCALE}=game;
for(const count of [2,6,7,12,13,20])for(const {id} of MAPS){
 const r=makeRoom('ARE222',makePlayer('0','0',Date.now()));r.settings={...game.DEFAULT_SETTINGS,maxPlayers:20,mapId:id};for(let i=1;i<count;i++)r.players.push(makePlayer(String(i),String(i),Date.now()));nextPhase(r,Date.now());assert.equal(r.playArea,count<=6?'small':count<=12?'medium':'full');const b=roomBounds(r);
 for(const p of r.players)assert.ok(canStand(p.x,p.y,id,0,1.7,b),id+' spawn within area');
 for(const elevation of [0,MAX_ELEVATION]){assert.equal(canStand(b.width-20,600*MAP_SCALE,id,elevation,1.7,b),false);assert.equal(canStand(600*MAP_SCALE,b.height-20,id,elevation,1.7,b),false);}
 const before=r.playArea;r.players.pop();r.phase='paint';nextPhase(r,Date.now());assert.equal(r.playArea,before,'boundary is frozen through the round');
 assert.equal(areaWalls(r).length,before==='small'?2:before==='medium'?1:0);
}
assert.equal(roomBounds().width,game.W,'legacy live rooms retain full map');
const host=await play('create',{name:'구역 테스트'}),guest=await play('join',{code:host.room.code,name:'친구'}),session={code:host.room.code,token:host.token};
assert.equal((await play('next',session)).room.playArea,'small');
// Put the seeker near the boundary to test authoritative movement at maximum flight height.
let row=sql.prepare('SELECT state FROM rooms WHERE code=?').get(session.code),r=JSON.parse(row.state),p=r.players.find(p=>p.token===host.token);p.x=roomBounds(r).width-30;p.y=700*MAP_SCALE;p.elevation=MAX_ELEVATION;p.moveAt=Date.now()-300;r.phase='seek';r.end=Date.now()+60000;
sql.prepare('UPDATE rooms SET state=? WHERE code=?').run(JSON.stringify(r),session.code);
const moved=await play('tick',{...session,dx:1,dy:0,dz:1,playArea:'full'});assert.equal(moved.status,200);assert.ok(moved.room.players.find(p=>p.id===host.id).x<=roomBounds(r).width-28,'client cannot fly beyond restricted boundary');
const wall=await play('wall',{code:host.room.code,token:guest.token});assert.equal(wall.status===200||wall.status===409,true);
await play('leave',session);assert.equal((await play('state',{code:host.room.code,token:guest.token})).room.playArea,'small');
console.log('PASS: every threshold and theme, clear in-bounds spawns, ground/air boundaries, frozen round size, legacy compatibility, server rejects client boundary override');
