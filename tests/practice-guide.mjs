import assert from 'node:assert/strict';
import {practiceRules,guideProgress} from '../app/practice-guide.ts';
import {makePlayer,parseSettings} from '../app/game.ts';
for(const seconds of [60,120,180,300]){const rules=practiceRules('forest',seconds);assert.equal(rules.maxPlayers,4);assert.equal(rules.seekerCount,1);assert.ok(parseSettings(rules));assert.equal(rules.paintSeconds,seconds);assert.equal(rules.seekSeconds,seconds);}
const p=makePlayer('me','연습',0),origin={x:p.x,y:p.y};
assert.equal(guideProgress(0,origin,p,true),0,'painting cannot skip movement');
p.x+=35;assert.equal(guideProgress(0,origin,p,false),1);
assert.equal(guideProgress(1,origin,p,true),1,'standing cannot complete elevation');
p.elevation=.15;assert.equal(guideProgress(1,origin,p,false),2);
assert.equal(guideProgress(2,origin,p,false),2,'opening paint UI alone is insufficient');
assert.equal(guideProgress(2,origin,p,true),3);
assert.equal(guideProgress(3,origin,p,true),3);p.locked=true;assert.equal(guideProgress(3,origin,p,true),4);
p.locked=false;assert.equal(guideProgress(4,origin,p,false),4,'completed guide stays complete');
console.log('PASS: fixed solo population, selected time, ordered movement/elevation/paint/lock learning and stable completion');
