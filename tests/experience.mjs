import assert from 'node:assert/strict';
import './resolve-ts.mjs';
const {readPreset,sessionEnded,nextSeekers,currentTask}=await import('../app/experience.ts');
const {makeRoom,makePlayer,nextPhase,DEFAULT_SETTINGS}=await import('../app/game.ts');
assert.equal(readPreset('{broken'),null);assert.equal(readPreset(JSON.stringify({...DEFAULT_SETTINGS,seekerCount:20})),null);
assert.deepEqual(readPreset(JSON.stringify(DEFAULT_SETTINGS)),DEFAULT_SETTINGS);
for(const status of [401,404,423])assert.equal(sessionEnded({status}),true);
for(const error of [new TypeError('offline'),{status:503},{status:500},{status:429}])assert.equal(sessionEnded(error),false);
for(const count of [2,6,20])for(const seekers of [1,count-1]){
 const r=makeRoom('ABCDEF',makePlayer('0','0',Date.now()));r.settings={...DEFAULT_SETTINGS,maxPlayers:count,seekerCount:seekers};
 for(let i=1;i<count;i++)r.players.push(makePlayer(String(i),String(i),Date.now()));
 for(let round=0;round<count+1;round++){r.phase='result';const predicted=nextSeekers(r).map(p=>p.id);nextPhase(r,Date.now());assert.deepEqual(r.players.filter(p=>p.role==='seeker').map(p=>p.id),predicted);}
 r.players.pop();r.phase='result';if(r.players.length>seekers){const predicted=nextSeekers(r).map(p=>p.id);nextPhase(r,Date.now());assert.deepEqual(r.players.filter(p=>p.role==='seeker').map(p=>p.id),predicted);}
}
const task={phase:'paint',role:'hider',mode:'paint',picking:false,preview:false,paused:0};
assert.equal(currentTask(task),'몸을 손가락으로 칠해요');
assert.equal(currentTask({...task,role:'seeker'}),'친구들이 숨는 동안 기다려요');
assert.equal(currentTask({...task,role:'seeker',phase:'seek'}),'가운데 조준점을 맞추고 발사!');
assert.equal(currentTask({...task,caught:true}),'친구를 골라 응원해요');
console.log('PASS: retry vs terminal errors, invalid saved settings, 2–20 player next-seeker prediction including departures and rotation wrap, task-specific short guidance');
