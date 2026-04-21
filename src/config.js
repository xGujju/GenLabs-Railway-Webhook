function trim(value, fallback = '') {
  if (value == null) return fallback;
  return String(value).trim();
}

function toInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function createRuntimeConfig(env = process.env) {
  const googleVisionKey = trim(env.GOOGLE_CLOUD_VISION);
  const explicitProvider = trim(env.OCR_PROVIDER);
  const ocrProvider = explicitProvider || (googleVisionKey ? 'google_cloud_vision' : 'mock');
  const ocrApiKey = trim(
    env.OCR_API_KEY,
    ocrProvider === 'google_cloud_vision' ? googleVisionKey : ''
  );

  return {
    port: toInt(env.PORT, 3000),
    channelSecret: trim(env.LINE_CHANNEL_SECRET),
    channelAccessToken: trim(env.LINE_CHANNEL_ACCESS_TOKEN),
    storeDir: 'var/line_webhooks',
    workerPollIntervalMs: 5000,
    workerMaxIterations: toInt(env.WORKER_MAX_ITERATIONS, 0),
    ocr: {
      provider: ocrProvider,
      apiKey: ocrApiKey,
      mockText: trim(env.OCR_MOCK_TEXT, 'Transfer successful Amount 100.00 THB Reference 123456')
    }
  };
}
