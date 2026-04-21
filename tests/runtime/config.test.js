import test from 'node:test';
import assert from 'node:assert/strict';

import { createRuntimeConfig } from '../../src/config.js';

test('createRuntimeConfig trims tokens and applies code defaults', () => {
  const config = createRuntimeConfig({
    PORT: '8080',
    LINE_CHANNEL_SECRET: ' secret ',
    LINE_CHANNEL_ACCESS_TOKEN: ' token\n',
    OCR_PROVIDER: 'mock',
    OCR_MOCK_TEXT: 'hello world',
    WORKER_POLL_INTERVAL_MS: '2500',
    LINE_WEBHOOK_STORE_DIR: 'ignored-custom-dir'
  });

  assert.equal(config.port, 8080);
  assert.equal(config.channelSecret, 'secret');
  assert.equal(config.channelAccessToken, 'token');
  assert.equal(config.storeDir, 'var/line_webhooks');
  assert.equal(config.ocr.provider, 'mock');
  assert.equal(config.ocr.mockText, 'hello world');
  assert.equal(config.workerPollIntervalMs, 5000);
});

test('createRuntimeConfig defaults to port 5000 when PORT is not set', () => {
  const config = createRuntimeConfig({});
  assert.equal(config.port, 5000);
});
