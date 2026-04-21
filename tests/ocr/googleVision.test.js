import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { createOcrClient } from '../../src/ocr/client.js';

test('createOcrClient uses Google Cloud Vision annotate endpoint and extracts full text', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'genlabs-gcv-'));
  const filePath = path.join(tempDir, 'msg-1.jpg');
  await fs.writeFile(filePath, Buffer.from('fake-image'));

  const calls = [];
  const client = createOcrClient({
    provider: 'google_cloud_vision',
    apiKey: 'vision-key',
    httpClient: {
      async post(url, body, options) {
        calls.push({ url, body, options });
        return {
          data: {
            responses: [
              {
                fullTextAnnotation: {
                  text: 'SCB Amount 77.00 THB Reference 654321'
                }
              }
            ]
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

  assert.equal(text, 'SCB Amount 77.00 THB Reference 654321');
  assert.equal(calls.length, 1);
  assert.equal(
    calls[0].url,
    'https://vision.googleapis.com/v1/images:annotate?key=vision-key'
  );
  assert.equal(calls[0].body.requests[0].features[0].type, 'DOCUMENT_TEXT_DETECTION');
  assert.match(calls[0].body.requests[0].image.content, /^[A-Za-z0-9+/=]+$/);
});
