// Respect the server's creation cooldown without retrying other API failures.
export async function createRoomWithRetry(create, sleep = ms => new Promise(resolve => setTimeout(resolve, ms))) {
  for (let attempt = 0; ; attempt++) {
    const result = await create();
    if (result.status !== 429 || !Number.isFinite(result.retryAfter) ||
        result.retryAfter <= 0 || result.retryAfter > 30 || attempt === 3) return result;
    await sleep(result.retryAfter * 1000 + 100);
  }
}
