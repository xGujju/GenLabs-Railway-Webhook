import fs from 'node:fs/promises';
import path from 'node:path';

import { analyzeSlipText, buildSlipSummary } from '../analysis/slip.js';

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function writeJson(filePath, data) {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function extensionForMimeType(mimeType) {
  if (mimeType === 'image/jpeg') return '.jpg';
  if (mimeType === 'image/png') return '.png';
  if (mimeType === 'application/pdf') return '.pdf';
  return '.bin';
}

async function markJobFailure(jobPath, job, error) {
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

export async function processFetchJob(jobPath, { storeDir, lineClient, ocrClient }) {
  const job = JSON.parse(await fs.readFile(jobPath, 'utf8'));

  try {
    const fetched = await lineClient.fetchMessageContent(job.messageId);
    const ext = extensionForMimeType(fetched.contentType);
    const mediaFileName = `${job.messageId}${ext}`;
    const mediaPath = path.join(storeDir, 'media', mediaFileName);
    await ensureDir(path.dirname(mediaPath));
    await fs.writeFile(mediaPath, fetched.buffer);

    const extractedText = await ocrClient.extractText({
      messageId: job.messageId,
      filePath: mediaPath,
      mimeType: fetched.contentType
    });

    const analysis = analyzeSlipText(extractedText);
    const analysisRecord = {
      messageId: job.messageId,
      extractedText,
      analysis,
      summary: buildSlipSummary(analysis)
    };
    const analysisPath = path.join(storeDir, 'analysis', `${job.messageId}.json`);
    await writeJson(analysisPath, analysisRecord);

    const replyJob = {
      jobType: 'reply_message',
      status: 'pending',
      attempts: 0,
      maxAttempts: 3,
      replyToken: job.replyToken,
      source: job.source,
      message: {
        type: 'text',
        text: analysisRecord.summary
      },
      analysisPath
    };
    const replyJobPath = path.join(storeDir, 'reply_jobs', `${job.messageId}.json`);
    await writeJson(replyJobPath, replyJob);

    const updatedJob = {
      ...job,
      attempts: job.attempts || 0,
      maxAttempts: job.maxAttempts || 3,
      status: 'processed',
      processedAt: new Date().toISOString(),
      mediaPath,
      analysisPath,
      replyJobPath
    };
    await writeJson(jobPath, updatedJob);

    return updatedJob;
  } catch (error) {
    await markJobFailure(jobPath, job, error);
    throw error;
  }
}
