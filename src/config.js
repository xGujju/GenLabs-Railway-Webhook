function trim(value, fallback = '') {
  if (value == null) return fallback;
  return String(value).trim();
}

function toInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function createRuntimeConfig(env = process.env) {
  return {
    port: toInt(env.PORT, 3000),
    channelSecret: trim(env.LINE_CHANNEL_SECRET),
    channelAccessToken: trim(env.LINE_CHANNEL_ACCESS_TOKEN),
    storeDir: trim(env.LINE_WEBHOOK_STORE_DIR, 'var/line_webhooks'),
    workerPollIntervalMs: toInt(env.WORKER_POLL_INTERVAL_MS, 5000),
    workerMaxIterations: toInt(env.WORKER_MAX_ITERATIONS, 0),
    ocr: {
      provider: trim(env.OCR_PROVIDER, 'mock'),
      apiKey: trim(env.OCR_API_KEY),
      mockText: trim(env.OCR_MOCK_TEXT, 'Transfer successful Amount 100.00 THB Reference 123456')
    }
  };
}
