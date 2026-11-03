import assert from 'node:assert/strict';
import test from 'node:test';
import {createRoomWithRetry} from './create-room-with-retry.mjs';

test('creation waits for the advertised cooldown before retrying', async () => {
  const events = [];
  const responses = [{status:429,retryAfter:5},{status:200}];
  const result = await createRoomWithRetry(async () => {
    events.push('create');
    return responses.shift();
  }, async ms => events.push(ms));
  assert.equal(result.status, 200);
  assert.deepEqual(events, ['create',5100,'create']);
});

test('creation does not hide failures or retry indefinitely', async () => {
  for (const result of [{status:403},{status:500},{status:429},{status:429,retryAfter:0}]) {
    assert.equal(await createRoomWithRetry(async () => result, () => assert.fail('unexpected retry')), result);
  }
  let attempts = 0;
  const result = await createRoomWithRetry(async () => {
    attempts++;
    return {status:429,retryAfter:5};
  }, async () => {});
  assert.equal(attempts, 4);
  assert.equal(result.status, 429);
});
