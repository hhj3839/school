import assert from 'node:assert/strict';
import {W,H,MAP_SCALE,CEILING_HEIGHT,MAX_ELEVATION,moveHeight,MAPS,DEFAULT_SETTINGS,parseSettings,mapObstacles,canStand,visibleLine,move,makeRoom,makePlayer,nextPhase} from '../app/game.ts';
assert.equal(parseSettings({...DEFAULT_SETTINGS,mapId:'invalid'}),null);
assert.equal(parseSettings({...DEFAULT_SETTINGS,mapId:undefined}).mapId,'art');
for(const {id} of MAPS){
 const room=makeRoom('MAP222',makePlayer('0','0',10000));room.settings={...DEFAULT_SETTINGS,mapId:id,maxPlayers:20,seekerCount:3};
 for(let i=1;i<20;i++)room.players.push(makePlayer(String(i),String(i),10000));nextPhase(room,10000);
 for(const p of room.players)assert.ok(canStand(p.x,p.y,id),id+' has clear spawn positions');
 assert.equal(new Set(room.players.map(p=>p.x+','+p.y)).size,20);
 const o=mapObstacles(id)[0],a=makePlayer('a','a',10000),b=makePlayer('b','b',10000);a.x=o.x-30;a.y=o.y+o.h/2;a.role='seeker';b.x=o.x+o.w+30;b.y=a.y;
 assert.equal(canStand(o.x+o.w/2,o.y+o.h/2,id),false);
 assert.equal(visibleLine(a,b,id),false);move(a,1,0,.3,id);assert.ok(canStand(a.x,a.y,id),'movement finishes outside actual prop solids');
}
assert.notDeepEqual(mapObstacles('amusement'),mapObstacles('forest'));
console.log('PASS: map validation, legacy fallback, 20 clear spawn points per map, unique layouts, collision and sight lines');

assert.equal(MAPS.length,5);
assert.ok(Math.abs(W*H/(1800*1140)-3)<1e-10,'floor area is exactly tripled');
assert.equal(CEILING_HEIGHT,6.6*2);assert.equal(MAX_ELEVATION,4.6*2);
assert.equal(parseSettings({...DEFAULT_SETTINGS,mapId:'toys'}).mapId,'amusement','legacy toy rooms migrate');
const flyer=makePlayer('fly','fly',0);for(let i=0;i<100;i++)moveHeight(flyer,1,.3);assert.equal(flyer.elevation,MAX_ELEVATION);
for(const {id} of MAPS){
 for(const o of mapObstacles(id)){assert.ok(o.x>0&&o.y>0&&o.x+o.w<W&&o.y+o.h<H,id+' obstacle inside map');assert.ok(o.height<CEILING_HEIGHT);}
 // Flood the walkable floor to make sure the enlarged regions remain reachable.
 const step=35,start=[Math.round(900*MAP_SCALE/step),Math.round(700*MAP_SCALE/step)],todo=[start],seen=new Set([start.join(',')]);
 for(let i=0;i<todo.length;i++){const [x,y]=todo[i];for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,key=nx+','+ny;if(!seen.has(key)&&canStand(nx*step,ny*step,id)){seen.add(key);todo.push([nx,ny]);}}}
 for(const [x,y] of [[70,70],[W-70,70],[70,H-70],[W-70,H-70]])assert.ok(seen.has(Math.round(x/step)+','+Math.round(y/step)),id+' reaches every corner');
}
console.log('PASS: five themes, 3x floor area, 2x height, legacy map migration, flight limit, all map corners reachable');
const base='http://127.0.0.1:5173',sessions=[];
async function call(action,extra={},session={}){const r=await fetch(base+'/api/room',{method:'POST',headers:{'Content-Type':'application/json',Origin:base,...(action==='create'&&process.env.TEACHER_KEY?{Authorization:'Bearer '+process.env.TEACHER_KEY}:{})},body:JSON.stringify({...session,action,...extra})});return {status:r.status,...await r.json()};}
try{for(const {id} of MAPS){const settings={...DEFAULT_SETTINGS,mapId:id};let made=await call('create',{name:'맵 테스트',settings});if(made.status===429){await new Promise(resolve=>setTimeout(resolve,(made.retryAfter||5)*1000));made=await call('create',{name:'맵 테스트',settings});}assert.equal(made.status,200);const host={code:made.room.code,token:made.token};sessions.push(host);const joined=await call('join',{code:host.code,name:'참가자'});const guest={code:host.code,token:joined.token};sessions.push(guest);assert.equal(joined.room.settings.mapId,id);assert.equal((await call('settings',{settings:{...settings,mapId:'forest'}},guest)).status,403);const started=await call('next',{},host);assert.equal(started.room.settings.mapId,id);assert.equal((await call('state',{},guest)).room.settings.mapId,id);assert.equal((await call('settings',{settings:{...settings,mapId:'amusement'}},host)).status,409);}
 console.log('PASS: all five maps create/join/start consistently, guest changes denied, map fixed during rounds');
}finally{for(const s of sessions)await call('leave',{},s);}
