import './resolve-ts.mjs';
import assert from 'node:assert/strict';
const {MAPS,hidingSpots,canStand,showHidingHints,makePlayer,makeRoom,DEFAULT_SETTINGS}=await import('../app/game.ts');
const {recommendedRules,teacherRoomSummary}=await import('../app/teaching.ts');
for(const {id} of MAPS){const spots=hidingSpots(id);assert.equal(spots.length,3,id);for(const s of spots)assert.ok(canStand(s.x,s.y,id,s.elevation));for(let n=2;n<=20;n++){const v=recommendedRules(n,id);assert.ok(v.seekerCount>=1&&v.seekerCount<n);assert.ok([180,300].includes(v.paintSeconds));assert.ok([180,300].includes(v.seekSeconds));}}
const p=makePlayer('h','숨는 친구',10000),s=makePlayer('s','술래',10000),r=makeRoom('TEST22',p);s.role='seeker';p.token='do-not-expose';r.players.push(s);r.phase='paint';r.end=70000;r.settings={...DEFAULT_SETTINGS};
assert.ok(showHidingHints(r,p.id,true));assert.equal(showHidingHints(r,s.id,true),false);assert.equal(showHidingHints(r,p.id,false),false);assert.equal(showHidingHints(r,p.id,true,true),false);
r.paused=10000;assert.equal(showHidingHints(r,p.id,true),false);r.paused=0;r.phase='seek';assert.equal(showHidingHints(r,p.id,true),false);r.phase='paint';
p.locked=true;const summary=teacherRoomSummary(r,11000);assert.equal(summary.ready,1);assert.equal(summary.online,2);assert.equal(summary.remaining,59);assert.equal('token' in summary.players[0],false);assert.equal('paint' in summary.players[0],false);assert.equal('x' in summary.players[0],false);assert.equal(teacherRoomSummary(r,30000).online,0);
console.log('PASS: three reachable hints per map, hider/preparation/preview restrictions, valid recommendations for 2–20 players, teacher readiness/presence/timer and data minimization');
