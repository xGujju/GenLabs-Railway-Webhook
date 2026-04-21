import fs from 'node:fs/promises';
import path from 'node:path';

import { processFetchJob } from './processFetchJob.js';

export async function processPendingFetchJobs({ storeDir, lineClient, ocrClient }) {
  const jobsDir = path.join(storeDir, 'jobs');

  let files = [];
  try {
    files = await fs.readdir(jobsDir);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return { processedCount: 0, processedJobs: [] };
    }
    throw error;
  }

  const pendingJobPaths = [];
  for (const file of files) {
    const jobPath = path.join(jobsDir, file);
    const job = JSON.parse(await fs.readFile(jobPath, 'utf8'));
    if (
      job.jobType === 'fetch_line_content' &&
      ['pending', 'retryable'].includes(job.status)
    ) {
      pendingJobPaths.push(jobPath);
    }
  }

  const processedJobs = [];
  for (const jobPath of pendingJobPaths) {
    processedJobs.push(
      await processFetchJob(jobPath, { storeDir, lineClient, ocrClient })
    );
  }

  return {
    processedCount: processedJobs.length,
    processedJobs
  };
}
