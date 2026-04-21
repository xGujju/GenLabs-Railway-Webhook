import fs from 'node:fs/promises';
import path from 'node:path';

async function writeJson(filePath, data) {
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

async function markReplyFailure(jobPath, job, error) {
  const attempts = (job.attempts || 0) + 1;
  const maxAttempts = job.maxAttempts || 3;
  const status = attempts >= maxAttempts ? 'failed' : 'retryable';
  const updatedJob = {
    ...job,
    attempts,
    maxAttempts,
    status,
    lastError: error.message,
    updatedAt: new Date().toISOString()
  };
  await writeJson(jobPath, updatedJob);
}

export async function processPendingReplyJobs({ storeDir, lineClient }) {
  const replyJobsDir = path.join(storeDir, 'reply_jobs');

  let files = [];
  try {
    files = await fs.readdir(replyJobsDir);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return { processedCount: 0, processedJobs: [] };
    }
    throw error;
  }

  const processedJobs = [];
  for (const file of files) {
    const jobPath = path.join(replyJobsDir, file);
    const job = JSON.parse(await fs.readFile(jobPath, 'utf8'));

    if (job.jobType !== 'reply_message' || !['pending', 'retryable'].includes(job.status)) {
      continue;
    }

    try {
      await lineClient.replyMessage({
        replyToken: job.replyToken,
        messages: [job.message]
      });

      const updatedJob = {
        ...job,
        status: 'sent',
        attempts: job.attempts || 0,
        maxAttempts: job.maxAttempts || 3,
        sentAt: new Date().toISOString()
      };
      await writeJson(jobPath, updatedJob);
      processedJobs.push(updatedJob);
    } catch (error) {
      await markReplyFailure(jobPath, job, error);
      throw error;
    }
  }

  return {
    processedCount: processedJobs.length,
    processedJobs
  };
}
