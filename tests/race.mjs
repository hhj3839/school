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
const classroom=await import('../app/api/classroom/route.ts'),room=await import('../app/api/race/route.ts');
async function call(handler,path,body,key,origin='http://localhost'){const response=await handler(new Request('http://localhost/api/'+path,{method:'POST',headers:{'Content-Type':'application/json',Origin:origin,...(key?{Authorization:'Bearer '+key}:{})},body:JSON.stringify(body)}));return {status:response.status,...await response.json()};}
const control=(action,key='test-only-secret',origin)=>call(classroom.POST,'classroom',{action},key,origin);
const play=(action,data={})=>call(room.POST,'room',{action,...data});



const engine=await import('../app/race/engine.ts');
let clock=2000000000000;Date.now=()=>clock;
const made=await play('create',{name:'방장'});assert.equal(made.status,200);
const sessions=[{code:made.room.code,token:made.token}];
for(let i=1;i<20;i++){const d=await play('join',{code:made.room.code,name:'친구'+i});assert.equal(d.status,200);sessions.push({code:made.room.code,token:d.token});}
assert.equal((await play('join',{code:made.room.code,name:'스물한째'})).status,409);
assert.equal((await play('start',sessions[1])).status,403);
assert.equal((await play('state',{code:made.room.code,token:'wrong'})).status,401);
let d=await play('start',sessions[0]);assert.equal(d.room.phase,'playing');assert.ok(d.room.players.every(p=>!p.token));assert.equal(d.room.players.length,20);assert.ok(d.room.players.every(p=>p.z===engine.START&&engine.ground(p.x,p.z,0)),'equal start line for all 20');
const hide=await import('../app/api/room/route.ts'),blocks=await import('../app/api/blocks/route.ts');
assert.equal((await call(hide.POST,'room',{action:'state',...sessions[0]})).status,409);
assert.equal((await call(blocks.POST,'blocks',{action:'state',...sessions[0]})).status,409);
clock+=3400;const commands=Array.from({length:8},(_,i)=>({seq:i+1,x:0,z:1,jump:false}));
d=await play('input',{...sessions[0],round:1,commands});assert.equal(d.room.players[0].seq,8);const z=d.room.players[0].z;assert.ok(z>engine.START&&z<=engine.START+engine.SPEED*.4+.01);
d=await play('input',{...sessions[0],round:1,commands});assert.equal(d.room.players[0].z,z,'retries cannot replay movement');
d=await play('input',{...sessions[0],round:1,commands:[{seq:9,x:0,z:1,jump:false}]});assert.equal(d.room.players[0].seq,8,'server time limits movement');
assert.equal((await play('input',{...sessions[0],commands:[{seq:9,x:99,z:1,jump:false}]})).status,400);
// All 20 read the same room version; different player writes must all survive.
clock+=400;
const concurrent=await Promise.all(sessions.map((session,i)=>play('input',{...session,round:1,commands:Array.from({length:6},(_,j)=>({seq:(i===0?8:0)+j+1,x:0,z:1,jump:false}))})));
assert.ok(concurrent.every(r=>r.status===200),'20 concurrent player updates succeed');
const merged=await play('state',sessions[0]);
assert.ok(merged.room.players.every((p,i)=>p.seq===(i===0?14:6)),'no peer update overwritten');
clock+=100;
const repeated=await Promise.all(Array.from({length:3},()=>play('input',{...sessions[0],round:1,commands:[{seq:15,x:0,z:1,jump:false}]})));
assert.ok(repeated.every(r=>r.status===200));
assert.equal((await play('state',sessions[0])).room.players[0].seq,15,'concurrent duplicate input applied once');
const manage=action=>call(classroom.POST,'classroom',{action,code:made.room.code},'test-only-secret');
assert.equal((await manage('pauseRoom')).status,200);const end=d.room.end;const pausedZ=(await play('state',sessions[0])).room.players[0].z;clock+=10000;
d=await play('input',{...sessions[0],round:1,commands:[{seq:9,x:0,z:1,jump:false}]});assert.equal(d.room.players[0].z,pausedZ);
assert.equal((await manage('resumeRoom')).status,200);d=await play('state',sessions[0]);assert.equal(d.room.end,end+10000);
const summary=await control('status');assert.equal(summary.rooms[0].kind,'race');assert.equal(summary.rooms[0].online,20);
assert.equal((await manage('endRoom')).status,200);d=await play('start',sessions[0]);assert.equal(d.room.round,2);assert.equal(d.room.players[0].seq,0);
assert.equal((await manage('deleteRoom')).status,200);assert.equal((await play('state',sessions[1])).status,404);
await control('close');assert.equal((await play('create',{name:'닫힘'})).status,423);await control('open');
// Full course simulation, using the same movement and hazards as client/server.
const r=engine.practiceRace('완주 연습',clock),p=r.players[0];let at=r.start;
for(let i=0;i<engine.DURATION/engine.STEP&&!p.finished;i++){
 at+=50;p.last=at;let target=0;
 const nextWall=[...engine.WALLS,...engine.MOVERS.map(z=>({x:engine.moverX(engine.raceTime(r,at),z),z,w:5}))].filter(w=>w.z>p.z-1.1).sort((a,b)=>a.z-b.z)[0];
 if(nextWall&&nextWall.z-p.z<8)target=nextWall.x<0?5:-5;
 for(const z of engine.GATES)if(p.z>z-7&&p.z<z+5)target=5;
 if(engine.RAFTS.some(([a,b])=>p.z>a-5&&p.z<b+2))target=engine.platformX(engine.raceTime(r,at));
 for(const z of engine.SPINNERS)if(p.z>z-6.5&&p.z<z+6.5)target=6.4;
 let jump=engine.GAPS.some(([a,b])=>p.z>a-2&&p.z<a);
 const x=Math.max(-1,Math.min(1,(target-p.x)*2));engine.stepRacer(r,p,{seq:i+1,x,z:Math.abs(target-p.x)>2.5?0:1,jump},at);engine.advanceRace(r,at);
}
assert.ok(p.finished,'course is traversable within the round time: '+JSON.stringify({z:p.z,x:p.x,peak:p.peak,falls:p.falls}));assert.equal(r.phase,'result');
const f=engine.practiceRace('낙하',clock),q=f.players[0];q.checkpoint=0;q.x=10;q.z=102;q.y=-4.9;q.vy=-5;engine.stepRacer(f,q,{seq:1,x:0,z:0,jump:false},f.start+50);assert.equal(q.z,engine.START);assert.equal(q.checkpoint,0);assert.equal(q.falls,1);
// Neither normal jumps nor bounce-pad height can clear a tall wall.
for(const height of [0,2.2,3.8]){const r=engine.practiceRace('회전 장애물',clock),p=r.players[0];p.z=engine.SPINNERS[0];p.y=height;engine.stepRacer(r,p,{seq:1,x:0,z:0,jump:height===0},r.start+50);assert.ok(p.stun>r.start+50,'rotating barrier hits at ground, normal jump and bounce height');}
{const r=engine.practiceRace('옆으로 피하기',clock),p=r.players[0];p.x=6.4;p.z=engine.SPINNERS[0];engine.stepRacer(r,p,{seq:1,x:0,z:0,jump:false},r.start+50);assert.equal(p.stun,0,'outer lane avoids rotating barrier without a jump');}
for(const vy of [9,12]){const wall=engine.WALLS[0],r=engine.practiceRace('벽 점프',clock),p=r.players[0];p.x=wall.x;p.z=wall.z-2;p.vy=vy;let maxY=0;for(let i=1;i<=30;i++){engine.stepRacer(r,p,{seq:i,x:0,z:1,jump:true},r.start+i*50);maxY=Math.max(maxY,p.y);assert.ok(p.z<wall.z-1,'wall cannot be jumped through');}assert.ok(maxY<engine.WALL_HEIGHT);}
const moving=engine.practiceRace('움직이는 벽',clock),runner=moving.players[0],mz=engine.MOVERS[0];runner.x=engine.moverX(.05,mz);runner.z=mz-1.2;runner.y=2;engine.stepRacer(moving,runner,{seq:1,x:0,z:1,jump:false},moving.start+50);assert.ok(runner.z<mz-1,'moving wall collision uses rendered position');
const belt=engine.practiceRace('바닥',clock),bp=belt.players[0];bp.z=engine.BELTS[0].z;engine.stepRacer(belt,bp,{seq:1,x:0,z:0,jump:false},belt.start+50);assert.ok(bp.x>0,'conveyor pushes sideways');
const pend=engine.practiceRace('공',clock),pp=pend.players[0],pz=engine.PENDULUMS[0],ball=engine.pendulum(.05,pz);pp.x=ball.x;pp.z=pz;engine.stepRacer(pend,pp,{seq:1,x:0,z:0,jump:false},pend.start+50);assert.ok(pp.stun>pend.start+50,'swinging ball knocks player');
const gate=engine.practiceRace('회전문',clock),gp=gate.players[0];gp.z=engine.GATES[0]-.2;gp.y=2;engine.stepRacer(gate,gp,{seq:1,x:0,z:1,jump:false},gate.start+50);assert.ok(gp.z<engine.GATES[0],'rotating gate blocks center');
const multi=engine.makeRace('TESTAA',engine.makeRacer('a','a',clock));multi.players.push(engine.makeRacer('b','b',clock));engine.startRace(multi,clock);multi.players[0].finished=5000;engine.advanceRace(multi,multi.start+6000);assert.equal(multi.phase,'playing','one finisher does not stop other runners');multi.players.forEach(p=>p.last=multi.end);engine.advanceRace(multi,multi.end);assert.equal(multi.phase,'result');assert.equal(multi.winner,'a 우승!');
const podium=engine.makeRace('TESTBB',engine.makeRacer('first','먼저',clock));podium.players.push(engine.makeRacer('second','나중',clock));engine.startRace(podium,clock);for(const [i,ms]of [[0,7000],[1,8000]]){podium.players[i].checkpoint=7;podium.players[i].z=engine.FINISH-.1;engine.stepRacer(podium,podium.players[i],{seq:1,x:0,z:1,jump:false},podium.start+ms);}assert.equal(engine.raceWinners(podium)[0].id,'first');assert.ok(podium.finishers.every(p=>!p.token));podium.players.shift();engine.finishRace(podium);assert.equal(podium.winner,'먼저 우승!','winner retained after leaving');
const tie=engine.makeRace('TESTCC',engine.makeRacer('a','가',clock));tie.players.push(engine.makeRacer('b','나',clock));engine.startRace(tie,clock);tie.players.forEach(p=>p.finished=1000);engine.finishRace(tie);assert.equal(tie.winner,'가 · 나 공동 우승!');
const recovery=engine.practiceRace('복귀',clock),rp=recovery.players[0];rp.z=36;engine.stepRacer(recovery,rp,{seq:1,x:0,z:0,jump:false},recovery.start+50);assert.equal(rp.safeZ,36);rp.x=10;rp.z=48;rp.y=-4.9;rp.vy=-5;engine.stepRacer(recovery,rp,{seq:2,x:0,z:0,jump:false},recovery.start+100);assert.equal(rp.z,36,'fall returns to last safe road');assert.equal(rp.respawnUntil,recovery.start+3100);engine.stepRacer(recovery,rp,{seq:3,x:1,z:1,jump:true},recovery.start+3050);assert.equal(rp.z,36);assert.equal(rp.x,0);assert.equal(rp.y,0,'recovery countdown freezes all movement');engine.pauseRace(recovery,recovery.start+500,true);engine.pauseRace(recovery,recovery.start+1500,false);assert.equal(rp.respawnUntil,recovery.start+3100,'pause preserves recovery time');engine.stepRacer(recovery,rp,{seq:4,x:0,z:1,jump:false},rp.respawnUntil);assert.ok(rp.z>36);
const shortcut=engine.practiceRace('지름길',clock),sp=shortcut.players[0];sp.z=engine.FINISH-.1;engine.stepRacer(shortcut,sp,{seq:1,x:0,z:1,jump:false},shortcut.start+50);assert.equal(sp.finished,0,'crossing finish without circuit checkpoints is not a lap');sp.z=219.9;engine.stepRacer(shortcut,sp,{seq:2,x:0,z:1,jump:false},shortcut.start+100);assert.equal(sp.checkpoint,0,'checkpoints must be passed in order');sp.z=109.9;engine.stepRacer(shortcut,sp,{seq:3,x:0,z:1,jump:false},shortcut.start+150);assert.equal(sp.checkpoint,1);
const order=engine.makeRace('ORDERA',engine.makeRacer('a','가',clock));order.players.push(engine.makeRacer('b','나',clock));engine.startRace(order,clock);order.players[0].peak=200;order.players[0].z=40;order.players[1].peak=100;order.players[1].z=80;assert.equal(engine.raceRanks(order)[0].id,'b','live rank follows current position rather than prior best');
console.log('PASS: 20 players, auth, controls, complete lap, ordered checkpoints, no finish shortcut, safe 3-second recovery, pause timing and live rank');
