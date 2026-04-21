import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import request from 'supertest';

import { createApp } from '../../src/app.js';
import { computeLineSignature } from '../../src/line/signature.js';

const imageEventPayload = {
  destination: 'U123',
  events: [
    {
      type: 'message',
      mode: 'active',
      timestamp: 1710000000000,
      webhookEventId: 'evt-image-1',
      deliveryContext: { isRedelivery: false },
      source: { type: 'group', groupId: 'group-1', userId: 'user-1' },
      replyToken: 'reply-token-1',
      message: { id: 'msg-image-1', type: 'image' }
    }
  ]
};

test('GET / returns health check text', async () => {
  const app = createApp({
    channelSecret: 'secret',
    channelAccessToken: 'token',
    storeDir: path.join(os.tmpdir(), 'genlabs-health')
  });

  const response = await request(app).get('/');

  assert.equal(response.status, 200);
  assert.equal(response.text, 'LINE webhook running');
});

test('POST /webhook rejects invalid signature', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'genlabs-webhook-invalid-'));
  const app = createApp({
    channelSecret: 'secret',
    channelAccessToken: 'token',
    storeDir: tempDir
  });

  const response = await request(app)
    .post('/webhook')
    .set('x-line-signature', 'invalid')
    .send(imageEventPayload);

  assert.equal(response.status, 403);
});

async function assertWebhookPathAcceptsAndPersists(routePath) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'genlabs-webhook-valid-'));
  const app = createApp({
    channelSecret: 'secret',
    channelAccessToken: 'token',
    storeDir: tempDir
  });

  const rawBody = JSON.stringify(imageEventPayload);
  const signature = computeLineSignature(rawBody, 'secret');

  const response = await request(app)
    .post(routePath)
    .set('Content-Type', 'application/json')
    .set('x-line-signature', signature)
    .send(rawBody);

  assert.equal(response.status, 200);
  assert.equal(response.text, 'OK');

  const envelopesDir = path.join(tempDir, 'envelopes');
  const eventsDir = path.join(tempDir, 'events');
  const jobsDir = path.join(tempDir, 'jobs');

  const [envelopes, events, jobs] = await Promise.all([
    fs.readdir(envelopesDir),
    fs.readdir(eventsDir),
    fs.readdir(jobsDir)
  ]);

  assert.equal(envelopes.length, 1);
  assert.equal(events.length, 1);
  assert.equal(jobs.length, 1);

  const jobContent = JSON.parse(await fs.readFile(path.join(jobsDir, jobs[0]), 'utf8'));
  assert.equal(jobContent.messageId, 'msg-image-1');
  assert.equal(jobContent.jobType, 'fetch_line_content');
  assert.equal(jobContent.status, 'pending');
}

test('POST /webhook accepts a valid signature and persists envelope, events, and fetch jobs', async () => {
  await assertWebhookPathAcceptsAndPersists('/webhook');
});

test('POST /webhooks/line accepts a valid signature and persists envelope, events, and fetch jobs', async () => {
  await assertWebhookPathAcceptsAndPersists('/webhooks/line');
});
