import test from 'node:test';
import assert from 'node:assert/strict';

import { runWorkerLoop } from '../../src/runtime/workerLoop.js';

test('runWorkerLoop executes pipeline repeatedly for a bounded number of iterations', async () => {
  const calls = [];

  const result = await runWorkerLoop({
    config: {
      workerPollIntervalMs: 10,
      workerMaxIterations: 3
    },
    runWorkerOnceImpl: async () => {
      calls.push('tick');
      return { fetch: { processedCount: 1 }, reply: { processedCount: 1 } };
    },
    sleepImpl: async () => {
      calls.push('sleep');
    }
  });

  assert.equal(result.iterations, 3);
  assert.deepEqual(calls, ['tick', 'sleep', 'tick', 'sleep', 'tick']);
});

test('runWorkerLoop stops early when a stop condition returns true', async () => {
  let iteration = 0;

  const result = await runWorkerLoop({
    config: {
      workerPollIntervalMs: 10,
      workerMaxIterations: 10
    },
    runWorkerOnceImpl: async () => {
      iteration += 1;
      return { fetch: { processedCount: 0 }, reply: { processedCount: 0 } };
    },
    shouldStopImpl: ({ iteration }) => iteration >= 2,
    sleepImpl: async () => {}
  });

  assert.equal(result.iterations, 2);
});
