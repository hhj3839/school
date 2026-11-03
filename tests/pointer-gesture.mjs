import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createPointerGesture,bindInputInterruptions} from '../app/pointer-gesture.ts';

test('a second finger cannot take over or stop a held button',()=>{
  let stops=0;
  const gesture=createPointerGesture(()=>stops++);
  assert.equal(gesture.begin(11),true);
  assert.equal(gesture.begin(12),false);
  gesture.end(12);
  assert.equal(stops,0);
  assert.equal(gesture.owns(11),true);
  gesture.end(11);
  assert.equal(stops,1);
  gesture.end(11); // lostpointercapture after pointerup
  assert.equal(stops,1);
  assert.equal(gesture.begin(12),true);
});

for(const event of ['blur','pagehide','visibilitychange']){
  test(`${event} cancels movement and allows a fresh touch`,()=>{
    const view=new EventTarget(),page=new EventTarget();
    let axis=1;
    const gesture=createPointerGesture(()=>axis=0);
    const cleanup=bindInputInterruptions(gesture.reset,view,page);
    gesture.begin(1);
    (event==='visibilitychange'?page:view).dispatchEvent(new Event(event));
    assert.equal(axis,0);
    assert.equal(gesture.owns(1),false,'old pointermove must not resume movement');
    assert.equal(gesture.begin(2),true);
    gesture.end(1);
    assert.equal(gesture.owns(2),true,'late release of the old finger cannot cancel a new touch');
    cleanup();
    assert.equal(gesture.owns(2),false);
  });
}

test('interruption stops auto-repeat before another block can move',t=>{
  t.mock.timers.enable({apis:['setTimeout','setInterval']});
  let commands=1,repeat;
  const gesture=createPointerGesture(()=>{clearTimeout(delay);clearInterval(repeat);});
  gesture.begin(1);
  const delay=setTimeout(()=>{repeat=setInterval(()=>commands++,120);},260);
  t.mock.timers.tick(260);
  t.mock.timers.tick(120);
  assert.equal(commands,2);
  gesture.reset();
  t.mock.timers.tick(2000);
  assert.equal(commands,2);
});

test('teardown removes global listeners and clears active input',()=>{
  const view=new EventTarget(),page=new EventTarget();
  let resets=0;
  const cleanup=bindInputInterruptions(()=>resets++,view,page);
  cleanup();
  assert.equal(resets,1);
  view.dispatchEvent(new Event('blur'));
  view.dispatchEvent(new Event('pagehide'));
  page.dispatchEvent(new Event('visibilitychange'));
  assert.equal(resets,1);
});
