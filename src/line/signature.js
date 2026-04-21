import crypto from 'node:crypto';

export function computeLineSignature(body, channelSecret) {
  return crypto
    .createHmac('sha256', channelSecret)
    .update(body)
    .digest('base64');
}

export function verifyLineSignature(body, signature, channelSecret) {
  if (!body || !signature || !channelSecret) {
    return false;
  }

  return computeLineSignature(body, channelSecret) === signature;
}
