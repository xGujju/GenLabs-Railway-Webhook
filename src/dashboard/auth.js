import crypto from 'node:crypto';

export function createDashboardToken({ channelSecret = '', channelAccessToken = '' }) {
  const seed = channelSecret || channelAccessToken || 'genlabs-dashboard';
  return crypto.createHash('sha256').update(seed).digest('hex').slice(0, 24);
}

export function isValidDashboardToken(token, options) {
  return token === createDashboardToken(options);
}