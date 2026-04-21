import test from 'node:test';
import assert from 'node:assert/strict';

import { analyzeSlipText, buildSlipSummary } from '../../src/analysis/slip.js';

test('analyzeSlipText extracts slip signals from OCR text', () => {
  const result = analyzeSlipText(`
    SCB Easy App
    Transfer successful
    Amount 1,250.00 THB
    Fee 0.00 THB
    Reference 123456789012
    QR Payment
  `);

  assert.equal(result.isSlipLike, true);
  assert.equal(result.amount, '1250.00');
  assert.equal(result.currency, 'THB');
  assert.equal(result.referenceId, '123456789012');
  assert.equal(result.bankHint, 'SCB');
  assert.equal(result.hasQr, true);
});

test('analyzeSlipText detects common Thai slip OCR patterns', () => {
  const result = analyzeSlipText(`
    ธนาคารไทยพาณิชย์
    โอนเงินสำเร็จ
    จำนวนเงิน 1,250.00 บาท
    ค่าธรรมเนียม 0.00 บาท
    เลขอ้างอิง 123456789012
    QR พร้อมเพย์
  `);

  assert.equal(result.isSlipLike, true);
  assert.equal(result.amount, '1250.00');
  assert.equal(result.currency, 'THB');
  assert.equal(result.referenceId, '123456789012');
  assert.equal(result.bankHint, 'SCB');
  assert.equal(result.hasQr, true);
});

test('analyzeSlipText treats bank plus amount as slip-like even without english keywords', () => {
  const result = analyzeSlipText(`
    K PLUS
    21/04/2026 22:39
    จำนวนเงิน 499.00 บาท
    จาก 123-4-56789-0
    ไปยัง 987-6-54321-0
  `);

  assert.equal(result.isSlipLike, true);
  assert.equal(result.amount, '499.00');
  assert.equal(result.currency, 'THB');
  assert.equal(result.bankHint, 'KBANK');
});

test('buildSlipSummary returns a compact operator-facing summary', () => {
  const summary = buildSlipSummary({
    isSlipLike: true,
    amount: '1250.00',
    currency: 'THB',
    referenceId: '123456789012',
    bankHint: 'SCB',
    hasQr: true
  });

  assert.match(summary, /Slip detected/);
  assert.match(summary, /1250.00 THB/);
  assert.match(summary, /Ref: 123456789012/);
  assert.match(summary, /Bank: SCB/);
});
