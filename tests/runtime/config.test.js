import test from 'node:test';
import assert from 'node:assert/strict';

import { createRuntimeConfig } from '../../src/config.js';

test('createRuntimeConfig trims tokens and applies defaults', () => {
  const config = createRuntimeConfig({
    PORT: '8080',
    LINE_CHANNEL_SECRET: ' secret ',
    LINE_CHANNEL_ACCESS_TOKEN: ' token\n',
    LINE_WEBHOOK_STORE_DIR: 'var/test-store',
    OCR_PROVIDER: 'mock',
    OCR_MOCK_TEXT: 'hello world',
    WORKER_POLL_INTERVAL_MS: '2500'
  });

  assert.equal(config.port, 8080);
  assert.equal(config.channelSecret, 'secret');
  assert.equal(config.channelAccessToken, 'token');
  assert.equal(config.storeDir, 'var/test-store');
  assert.equal(config.ocr.provider, 'mock');
  assert.equal(config.ocr.mockText, 'hello world');
  assert.equal(config.workerPollIntervalMs, 2500);
});
