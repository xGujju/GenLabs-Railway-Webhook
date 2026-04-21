import { processPendingFetchJobs } from './worker.js';
import { processPendingReplyJobs } from './replyWorker.js';

export async function runPipelineCycle({ storeDir, lineClient, ocrClient }) {
  const fetch = await processPendingFetchJobs({
    storeDir,
    lineClient,
    ocrClient
  });

  const reply = await processPendingReplyJobs({
    storeDir,
    lineClient
  });

  return { fetch, reply };
}
