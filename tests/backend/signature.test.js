import test from 'node:test';
import assert from 'node:assert/strict';

import { computeLineSignature, verifyLineSignature } from '../../src/line/signature.js';

test('computeLineSignature returns expected base64 hmac sha256', () => {
  const body = JSON.stringify({ hello: 'world' });
  const secret = 'super-secret';

  const signature = computeLineSignature(body, secret);

  assert.equal(signature, '5wDDfJLTJLjXr4cfnNOxikeVi5Cy4qZleyqDMRlZ048=');
});

test('verifyLineSignature returns true for matching body and signature', () => {
  const body = JSON.stringify({ events: [] });
  const secret = 'line-secret';
  const signature = computeLineSignature(body, secret);

  assert.equal(verifyLineSignature(body, signature, secret), true);
  assert.equal(verifyLineSignature(body, 'bad-signature', secret), false);
});
