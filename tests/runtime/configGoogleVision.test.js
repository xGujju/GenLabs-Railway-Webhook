import test from 'node:test';
import assert from 'node:assert/strict';

import { createRuntimeConfig } from '../../src/config.js';

test('createRuntimeConfig uses GOOGLE_CLOUD_VISION as OCR API key for google provider', () => {
  const config = createRuntimeConfig({
    OCR_PROVIDER: 'google_cloud_vision',
    GOOGLE_CLOUD_VISION: 'AIza-test-key'
  });

  assert.equal(config.ocr.provider, 'google_cloud_vision');
  assert.equal(config.ocr.apiKey, 'AIza-test-key');
});

test('createRuntimeConfig auto-selects google provider when GOOGLE_CLOUD_VISION is present', () => {
  const config = createRuntimeConfig({
    GOOGLE_CLOUD_VISION: 'AIza-test-key'
  });

  assert.equal(config.ocr.provider, 'google_cloud_vision');
  assert.equal(config.ocr.apiKey, 'AIza-test-key');
  assert.equal(config.storeDir, 'var/line_webhooks');
  assert.equal(config.workerPollIntervalMs, 5000);
});
