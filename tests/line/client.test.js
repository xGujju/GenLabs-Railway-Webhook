import test from 'node:test';
import assert from 'node:assert/strict';

import { createLineClient } from '../../src/line/client.js';

test('fetchMessageContent trims token and calls LINE content API', async () => {
  const calls = [];
  const client = createLineClient({
    channelAccessToken: ' token-with-space\n',
    httpClient: {
      async get(url, options) {
        calls.push({ url, options });
        return {
          data: Buffer.from('image-bytes'),
          headers: { 'content-type': 'image/jpeg' }
        };
      }
    }
  });

  const result = await client.fetchMessageContent('msg-123');

  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://api-data.line.me/v2/bot/message/msg-123/content');
  assert.equal(calls[0].options.headers.Authorization, 'Bearer token-with-space');
  assert.equal(result.contentType, 'image/jpeg');
  assert.equal(Buffer.isBuffer(result.buffer), true);
});

test('replyMessage posts text message payload to LINE reply endpoint', async () => {
  const calls = [];
  const client = createLineClient({
    channelAccessToken: 'reply-token',
    httpClient: {
      async post(url, payload, options) {
        calls.push({ url, payload, options });
        return { data: { ok: true } };
      }
    }
  });

  await client.replyMessage({
    replyToken: 'line-reply-token',
    messages: [{ type: 'text', text: 'hello' }]
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://api.line.me/v2/bot/message/reply');
  assert.deepEqual(calls[0].payload, {
    replyToken: 'line-reply-token',
    messages: [{ type: 'text', text: 'hello' }]
  });
  assert.equal(calls[0].options.headers.Authorization, 'Bearer reply-token');
});
