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
