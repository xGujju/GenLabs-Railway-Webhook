import fs from 'node:fs/promises';
import path from 'node:path';

async function writeJson(filePath, data) {
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function getLogger(logger = console) {
  return {
    info: typeof logger.info === 'function' ? logger.info.bind(logger) : () => {},
    error: typeof logger.error === 'function' ? logger.error.bind(logger) : () => {}
  };
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

export async function processPendingReplyJobs({ storeDir, lineClient, logger }) {
  const log = getLogger(logger);
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

    log.info('reply_job_started', {
      replyToken: job.replyToken,
      jobPath,
      messageText: job.message?.text || null
    });

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
      log.info('reply_job_sent', {
        replyToken: job.replyToken,
        jobPath,
        messageText: job.message?.text || null
      });
    } catch (error) {
      log.error('reply_job_failed', {
        replyToken: job.replyToken,
        jobPath,
        error: error.message
      });
      await markReplyFailure(jobPath, job, error);
      throw error;
    }
  }

  return {
    processedCount: processedJobs.length,
    processedJobs
  };
}
