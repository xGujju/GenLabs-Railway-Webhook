import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { processFetchJob } from '../../src/jobs/processFetchJob.js';
import { processPendingReplyJobs } from '../../src/jobs/replyWorker.js';

test('processFetchJob marks job retryable on failure and increments attempts', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'genlabs-fetch-retry-'));
  const jobsDir = path.join(tempDir, 'jobs');
  await fs.mkdir(jobsDir, { recursive: true });

  const jobPath = path.join(jobsDir, 'msg-fail.json');
  await fs.writeFile(
    jobPath,
    JSON.stringify({
      jobType: 'fetch_line_content',
      status: 'pending',
      attempts: 0,
      maxAttempts: 3,
      messageId: 'msg-fail',
      messageType: 'image',
      replyToken: 'reply-token',
      source: { type: 'group', groupId: 'group-1' }
    })
  );

  await assert.rejects(
    () => processFetchJob(jobPath, {
      storeDir: tempDir,
      lineClient: {
        async fetchMessageContent() {
          throw new Error('LINE fetch failed');
        }
      },
      ocrClient: {
        async extractText() {
          return 'should not run';
        }
      }
    }),
    /LINE fetch failed/
  );

  const updatedJob = JSON.parse(await fs.readFile(jobPath, 'utf8'));
  assert.equal(updatedJob.status, 'retryable');
  assert.equal(updatedJob.attempts, 1);
  assert.match(updatedJob.lastError, /LINE fetch failed/);
});

test('processPendingReplyJobs marks reply job failed after max attempts', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'genlabs-reply-retry-'));
  const replyJobsDir = path.join(tempDir, 'reply_jobs');
  await fs.mkdir(replyJobsDir, { recursive: true });

  const replyJobPath = path.join(replyJobsDir, 'reply-fail.json');
  await fs.writeFile(
    replyJobPath,
    JSON.stringify({
      jobType: 'reply_message',
      status: 'pending',
      attempts: 2,
      maxAttempts: 3,
      replyToken: 'reply-token-1',
      message: { type: 'text', text: 'hello' }
    })
  );

  await assert.rejects(
    () => processPendingReplyJobs({
      storeDir: tempDir,
      lineClient: {
        async replyMessage() {
          throw new Error('Reply failed');
        }
      }
    }),
    /Reply failed/
  );

  const updatedJob = JSON.parse(await fs.readFile(replyJobPath, 'utf8'));
  assert.equal(updatedJob.status, 'failed');
  assert.equal(updatedJob.attempts, 3);
  assert.match(updatedJob.lastError, /Reply failed/);
});
