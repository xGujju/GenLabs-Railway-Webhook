import test from 'node:test';
import assert from 'node:assert/strict';

import {
  analyzeSlipText,
  buildSlipSummary,
  extractSlipEvidence,
  scoreSlipEvidence
} from '../../src/analysis/slip.js';

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

test('analyzeSlipText detects structured SCB top-up flow without relying on transfer keyword', () => {
  const result = analyzeSlipText(`
    SCB
    Successful top up
    12 Apr 2026 - 21:13
    Ref ID: 2026041263h9o0OZbkAftcYUkH
    FROM MR. SWAYAM SANJAY SHAH
    TO PromptPay Topup
    AMOUNT 1,542.00
    verify the top up status
  `);

  assert.equal(result.isSlipLike, true);
  assert.equal(result.amount, '1542.00');
  assert.equal(result.currency, 'THB');
  assert.equal(result.referenceId, '2026041263h9o0OZbkAftcYUkH');
  assert.equal(result.bankHint, 'SCB');
  assert.equal(result.hasQr, true);
});

test('analyzeSlipText detects structured KBank payment flow with transaction id and fee', () => {
  const result = analyzeSlipText(`
    Payment Completed
    19 Jan 26 4:07 AM
    K+
    MR. SWAYAM S
    KBank
    Meta Ads (KGP)
    Transaction ID: 016019040712CPM12799
    Amount: 5,000.00 Baht
    Fee: 0.00 Baht
    Scan for Verify Slip
  `);

  assert.equal(result.isSlipLike, true);
  assert.equal(result.amount, '5000.00');
  assert.equal(result.currency, 'THB');
  assert.equal(result.referenceId, '016019040712CPM12799');
  assert.equal(result.bankHint, 'KBANK');
  assert.equal(result.hasQr, true);
});

test('extractSlipEvidence and scoreSlipEvidence capture multi-signal document structure', () => {
  const evidence = extractSlipEvidence(`
    Payment Completed
    KBank
    Transaction ID: 016019040712CPM12799
    Amount: 5,000.00 Baht
    Fee: 0.00 Baht
    Scan for Verify Slip
  `);
  const score = scoreSlipEvidence(evidence);

  assert.equal(evidence.hasStatusSignal, true);
  assert.equal(evidence.hasReferenceSignal, true);
  assert.equal(evidence.hasMonetarySignal, true);
  assert.equal(evidence.hasVerificationSignal, true);
  assert.ok(score >= 6);
});

test('buildSlipSummary returns a clean multiline operator-facing summary', () => {
  const summary = buildSlipSummary({
    isSlipLike: true,
    status: 'Payment Completed',
    amount: '5000.00',
    currency: 'THB',
    fee: '0.00',
    dateTime: '19 Jan 26 4:07 AM',
    referenceId: '016019040712CPM12799',
    bankHint: 'KBANK',
    hasQr: true
  });

  assert.match(summary, /Slip detected/i);
  assert.match(summary, /Status: Payment Completed/);
  assert.match(summary, /Amount: 5000.00 THB/);
  assert.match(summary, /Fee: 0.00 THB/);
  assert.match(summary, /Date: 19 Jan 26 4:07 AM/);
  assert.match(summary, /Ref: 016019040712CPM12799/);
  assert.match(summary, /Bank: KBANK/);
  assert.match(summary, /QR: Found/);
  assert.match(summary, /\n/);
});
