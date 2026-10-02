import assert from 'node:assert/strict';
import {MAPS,DEFAULT_SETTINGS,parseSettings,mapObstacles,canStand,visibleLine,move,makeRoom,makePlayer,nextPhase} from '../app/game.ts';
assert.equal(parseSettings({...DEFAULT_SETTINGS,mapId:'invalid'}),null);
assert.equal(parseSettings({...DEFAULT_SETTINGS,mapId:undefined}).mapId,'art');
for(const {id} of MAPS){
 const room=makeRoom('MAP222',makePlayer('0','0',10000));room.settings={...DEFAULT_SETTINGS,mapId:id,maxPlayers:20,seekerCount:3};
 for(let i=1;i<20;i++)room.players.push(makePlayer(String(i),String(i),10000));nextPhase(room,10000);
 for(const p of room.players)assert.ok(canStand(p.x,p.y,id),id+' has clear spawn positions');
 assert.equal(new Set(room.players.map(p=>p.x+','+p.y)).size,20);
 const o=mapObstacles(id)[0],a=makePlayer('a','a',10000),b=makePlayer('b','b',10000);a.x=o.x-30;a.y=o.y+o.h/2;a.role='seeker';b.x=o.x+o.w+30;b.y=a.y;
 assert.equal(canStand(o.x+o.w/2,o.y+o.h/2,id),false);
 assert.equal(visibleLine(a,b,id),false);move(a,1,0,.3,id);assert.ok(a.x<o.x-18);
}
assert.notDeepEqual(mapObstacles('toys'),mapObstacles('forest'));
console.log('PASS: map validation, legacy fallback, 20 clear spawn points per map, unique layouts, collision and sight lines');

const base='http://127.0.0.1:5173',sessions=[];
async function call(action,extra={},session={}){const r=await fetch(base+'/api/room',{method:'POST',headers:{'Content-Type':'application/json',Origin:base},body:JSON.stringify({...session,action,...extra})});return {status:r.status,...await r.json()};}
try{for(const {id} of MAPS){const settings={...DEFAULT_SETTINGS,mapId:id};const made=await call('create',{name:'맵 테스트',settings});assert.equal(made.status,200);const host={code:made.room.code,token:made.token};sessions.push(host);const joined=await call('join',{code:host.code,name:'참가자'});const guest={code:host.code,token:joined.token};sessions.push(guest);assert.equal(joined.room.settings.mapId,id);assert.equal((await call('settings',{settings:{...settings,mapId:'forest'}},guest)).status,403);const started=await call('next',{},host);assert.equal(started.room.settings.mapId,id);assert.equal((await call('state',{},guest)).room.settings.mapId,id);assert.equal((await call('settings',{settings:{...settings,mapId:'toys'}},host)).status,409);}
 console.log('PASS: all three maps create/join/start consistently, guest changes denied, map fixed during rounds');
}finally{for(const s of sessions)await call('leave',{},s);}
