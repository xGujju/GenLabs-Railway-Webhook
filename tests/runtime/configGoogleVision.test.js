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
