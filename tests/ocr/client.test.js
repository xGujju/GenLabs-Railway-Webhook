import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { createOcrClient } from '../../src/ocr/client.js';

test('createOcrClient uses OCR.space API and extracts parsed text', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'genlabs-ocr-'));
  const filePath = path.join(tempDir, 'msg-1.jpg');
  await fs.writeFile(filePath, Buffer.from('fake-image'));

  const calls = [];
  const client = createOcrClient({
    provider: 'ocr_space',
    apiKey: 'ocr-key',
    httpClient: {
      async post(url, body, options) {
        calls.push({ url, body, options });
        return {
          data: {
            IsErroredOnProcessing: false,
            ParsedResults: [{ ParsedText: 'SCB Amount 88.00 THB Reference 123456' }]
          }
        };
      }
    }
  });

  const text = await client.extractText({
    messageId: 'msg-1',
    filePath,
    mimeType: 'image/jpeg'
  });

  assert.equal(text, 'SCB Amount 88.00 THB Reference 123456');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://api.ocr.space/parse/image');
  assert.equal(calls[0].options.headers.apikey, 'ocr-key');
});

test('createOcrClient supports a mock provider for local/test execution', async () => {
  const client = createOcrClient({
    provider: 'mock',
    mockText: 'Transfer successful Amount 99.00 THB'
  });

  const text = await client.extractText({
    messageId: 'msg-2',
    filePath: '/tmp/msg-2.jpg',
    mimeType: 'image/jpeg'
  });

  assert.equal(text, 'Transfer successful Amount 99.00 THB');
});
