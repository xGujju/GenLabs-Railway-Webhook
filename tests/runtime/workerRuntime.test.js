import test from 'node:test';
import assert from 'node:assert/strict';

import { runWorkerOnce } from '../../src/runtime/workerRuntime.js';

test('runWorkerOnce runs one pipeline cycle using runtime config', async () => {
  const calls = [];
  const result = await runWorkerOnce({
    config: {
      storeDir: 'var/test-store',
      channelAccessToken: 'line-token',
      ocr: { provider: 'mock', mockText: 'Transfer successful Amount 77.00 THB' }
    },
    createLineClientImpl({ channelAccessToken }) {
      calls.push(['line', channelAccessToken]);
      return { kind: 'line-client' };
    },
    createOcrClientImpl(options) {
      calls.push(['ocr', options.provider, options.mockText]);
      return { kind: 'ocr-client' };
    },
    runPipelineCycleImpl: async ({ storeDir, lineClient, ocrClient }) => {
      calls.push(['cycle', storeDir, lineClient.kind, ocrClient.kind]);
      return { fetch: { processedCount: 1 }, reply: { processedCount: 1 } };
    }
  });

  assert.deepEqual(calls, [
    ['line', 'line-token'],
    ['ocr', 'mock', 'Transfer successful Amount 77.00 THB'],
    ['cycle', 'var/test-store', 'line-client', 'ocr-client']
  ]);
  assert.equal(result.fetch.processedCount, 1);
  assert.equal(result.reply.processedCount, 1);
});
