import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { buildLedgerSnapshot } from '../../src/dashboard/ledger.js';

async function writeJson(filePath, data) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

test('buildLedgerSnapshot aggregates detected slip revenue into dashboard metrics', async () => {
  const storeDir = await fs.mkdtemp(path.join(os.tmpdir(), 'genlabs-dashboard-ledger-'));
  const now = new Date('2026-04-21T12:00:00.000Z');

  await writeJson(path.join(storeDir, 'analysis', 'slip-1.json'), {
    messageId: 'slip-1',
    extractedText: 'Payment Completed',
    analysis: {
      isSlipLike: true,
      amount: '1500.00',
      currency: 'THB',
      bankHint: 'KBANK',
      status: 'Payment Completed',
      hasQr: true,
      dateTime: '21 Apr 2026 10:30 AM'
    },
    summary: 'ok'
  });

  await writeJson(path.join(storeDir, 'analysis', 'slip-2.json'), {
    messageId: 'slip-2',
    extractedText: 'Successful top up',
    analysis: {
      isSlipLike: true,
      amount: '2500.00',
      currency: 'THB',
      bankHint: 'SCB',
      status: 'Successful top up',
      hasQr: true,
      dateTime: '20 Apr 2026 - 21:13'
    },
    summary: 'ok'
  });

  await writeJson(path.join(storeDir, 'analysis', 'noise.json'), {
    messageId: 'noise',
    extractedText: 'random image',
    analysis: {
      isSlipLike: false,
      amount: null,
      currency: null,
      bankHint: null,
      status: null,
      hasQr: false,
      dateTime: null
    },
    summary: 'No clear slip detected.'
  });

  const snapshot = await buildLedgerSnapshot({ storeDir, now });

  assert.equal(snapshot.metrics.revenueToday, 1500);
  assert.equal(snapshot.metrics.revenueWeek, 4000);
  assert.equal(snapshot.metrics.revenueMonth, 4000);
  assert.equal(snapshot.metrics.revenueAllTime, 4000);
  assert.equal(snapshot.metrics.totalDetectedSlips, 2);
  assert.equal(snapshot.recentPayments.length, 2);
  assert.equal(snapshot.recentPayments[0].messageId, 'slip-1');
  assert.equal(snapshot.recentPayments[0].amount, 1500);
  assert.equal(snapshot.bankBreakdown[0].bank, 'SCB');
  assert.equal(snapshot.bankBreakdown[1].bank, 'KBANK');
});