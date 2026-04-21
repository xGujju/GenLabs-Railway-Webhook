import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { processPendingFetchJobs } from '../../src/jobs/worker.js';

test('processPendingFetchJobs also processes retryable fetch jobs', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'genlabs-worker-retryable-'));
  const jobsDir = path.join(tempDir, 'jobs');
  await fs.mkdir(jobsDir, { recursive: true });

  await fs.writeFile(
    path.join(jobsDir, 'job-retryable.json'),
    JSON.stringify({
      jobType: 'fetch_line_content',
      status: 'retryable',
      attempts: 1,
      maxAttempts: 3,
      messageId: 'msg-retry',
      messageType: 'image',
      replyToken: 'reply-retry',
      source: { type: 'group', groupId: 'group-1' }
    })
  );

  const result = await processPendingFetchJobs({
    storeDir: tempDir,
    lineClient: {
      async fetchMessageContent() {
        return { buffer: Buffer.from('retry'), contentType: 'image/jpeg' };
      }
    },
    ocrClient: {
      async extractText() {
        return 'Transfer successful Amount 66.00 THB Reference 123123';
      }
    }
  });

  assert.equal(result.processedCount, 1);

  const updatedJob = JSON.parse(
    await fs.readFile(path.join(jobsDir, 'job-retryable.json'), 'utf8')
  );
  assert.equal(updatedJob.status, 'processed');
});
