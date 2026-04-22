import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import request from 'supertest';

import { createApp } from '../../src/app.js';
import { createDashboardToken } from '../../src/dashboard/auth.js';

async function writeJson(filePath, data) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

test('owner dashboard routes require the derived private token and return ledger data', async () => {
  const storeDir = await fs.mkdtemp(path.join(os.tmpdir(), 'genlabs-dashboard-app-'));
  await writeJson(path.join(storeDir, 'analysis', 'slip-1.json'), {
    messageId: 'slip-1',
    extractedText: 'Payment Completed',
    analysis: {
      isSlipLike: true,
      amount: '5000.00',
      currency: 'THB',
      bankHint: 'KBANK',
      status: 'Payment Completed',
      hasQr: true,
      dateTime: '21 Apr 2026 10:30 AM'
    },
    summary: 'ok'
  });

  const channelSecret = 'secret';
  const app = createApp({
    channelSecret,
    channelAccessToken: 'token',
    storeDir
  });

  const token = createDashboardToken({ channelSecret });

  const denied = await request(app).get('/owner/wrong-token');
  assert.equal(denied.status, 404);

  const page = await request(app).get(`/owner/${token}`);
  assert.equal(page.status, 200);
  assert.match(page.text, /Owner Revenue Dashboard/);
  assert.match(page.text, /Private owner view/i);

  const data = await request(app).get(`/owner/${token}/data`);
  assert.equal(data.status, 200);
  assert.equal(data.body.metrics.totalDetectedSlips, 1);
  assert.equal(data.body.metrics.revenueAllTime, 5000);
  assert.equal(data.body.recentPayments[0].bank, 'KBANK');
});