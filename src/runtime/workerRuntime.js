import { createLineClient } from '../line/client.js';
import { createOcrClient } from '../ocr/client.js';
import { runPipelineCycle } from '../jobs/runPipelineCycle.js';

export async function runWorkerOnce({
  config,
  createLineClientImpl = createLineClient,
  createOcrClientImpl = createOcrClient,
  runPipelineCycleImpl = runPipelineCycle
}) {
  const lineClient = createLineClientImpl({
    channelAccessToken: config.channelAccessToken
  });

  const ocrClient = createOcrClientImpl(config.ocr);

  return runPipelineCycleImpl({
    storeDir: config.storeDir,
    lineClient,
    ocrClient
  });
}
