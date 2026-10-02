import assert from 'node:assert/strict';
import {DEFAULT_SETTINGS,SPEED,SHOT_COOLDOWN,makePlayer,makeRoom,nextPhase,advance,move,moveHeight,catchTarget,parseSettings} from '../app/game.ts';
const start=10000;
function round(){const a=makePlayer('a','술래',start),b=makePlayer('b','숨는 친구',start),r=makeRoom('TEST23',a);r.players.push(b);r.settings={...DEFAULT_SETTINGS,paintSeconds:60};nextPhase(r,start);return r;}
const r=round();assert.equal(r.phase,'paint');assert.equal(r.end,70000);r.players[1].locked=false;
advance(r,69999);assert.equal(r.phase,'paint');advance(r,70000);assert.equal(r.phase,'seek');assert.equal(r.end,190000);assert.equal(r.players[1].locked,false,'readiness never delays the start');
const late=round();advance(late,90000);assert.equal(late.phase,'seek');assert.equal(late.end,190000,'late polling does not extend the deadline');advance(late,190001);assert.equal(late.phase,'result');
const paused=round();paused.paused=20000;advance(paused,80000);assert.equal(paused.phase,'paint');
assert.ok(parseSettings({...DEFAULT_SETTINGS,paintSeconds:120}));assert.equal(parseSettings({...DEFAULT_SETTINGS,paintSeconds:0}),null);
const p=makePlayer('p','이동',start);p.x=100;p.y=800;move(p,1,0,.3);assert.equal(p.x,100+SPEED*.3);p.x=240;p.y=200;move(p,1,0,.3);assert.ok(p.x<252,'fast movement cannot cross a thin wall');p.locked=true;const old=p.x;move(p,1,0,.3);assert.equal(p.x,old);p.locked=false;moveHeight(p,1,.3);assert.ok(p.elevation>.25);
function shootRoom(){const r=round();advance(r,70000);r.players[0].x=800;r.players[0].y=800;r.players[1].x=1200;r.players[1].y=800;return r;}
const hit=shootRoom();assert.equal(catchTarget(hit,hit.players[0],'b',71000),true,'a clear shot works beyond the old touch range');assert.equal(hit.phase,'result');
const miss=shootRoom();assert.equal(catchTarget(miss,miss.players[0],'',71000),false);assert.equal(catchTarget(miss,miss.players[0],'b',71000+SHOT_COOLDOWN-1),false);assert.equal(catchTarget(miss,miss.players[0],'b',71000+SHOT_COOLDOWN),true);
const far=shootRoom();far.players[1].x=1700;assert.equal(catchTarget(far,far.players[0],'b',71000),false);
const wall=shootRoom();wall.players[0].x=240;wall.players[0].y=200;wall.players[1].x=330;wall.players[1].y=200;assert.equal(catchTarget(wall,wall.players[0],'b',71000),false,'no shooting through walls');
const blocked=round();assert.equal(catchTarget(blocked,blocked.players[0],'b',20000),false);advance(blocked,70000);blocked.paused=71000;assert.equal(catchTarget(blocked,blocked.players[0],'b',72000),false);
console.log('PASS: forced deadlines, late polling, pause, time choices, faster collision-safe movement, height, shooting range/walls/cooldown');
