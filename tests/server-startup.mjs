import './resolve-ts.mjs';
import assert from 'node:assert/strict';

// Worker module initialization cannot create AbortControllers. Three's full
// entrypoint initializes DefaultLoadingManager and previously broke /api/room.
const original=globalThis.AbortController;
globalThis.AbortController=class {
  constructor(){throw Error('AbortController created during server module initialization');}
};
try{
  const vision=await import('../app/server-vision.ts');
  assert.equal(typeof vision.shotTarget,'function');
  assert.equal(typeof vision.visibleTo,'function');
}finally{globalThis.AbortController=original;}
console.log('PASS: server collision module initializes without browser asset loaders');
