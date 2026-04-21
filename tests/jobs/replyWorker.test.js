import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { processPendingReplyJobs } from '../../src/jobs/replyWorker.js';

test('processPendingReplyJobs sends pending LINE reply jobs and marks them sent', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'genlabs-reply-worker-'));
  const replyJobsDir = path.join(tempDir, 'reply_jobs');
  await fs.mkdir(replyJobsDir, { recursive: true });

  const replyJobPath = path.join(replyJobsDir, 'msg-1.json');
  await fs.writeFile(
    replyJobPath,
    JSON.stringify({
      jobType: 'reply_message',
      status: 'pending',
      replyToken: 'reply-token-1',
      message: { type: 'text', text: 'Slip detected | Amount: 99.00 THB' }
    })
  );

  const sent = [];
  const result = await processPendingReplyJobs({
    storeDir: tempDir,
    lineClient: {
      async replyMessage(payload) {
        sent.push(payload);
      }
    }
  });

  assert.equal(result.processedCount, 1);
  assert.equal(sent.length, 1);
  assert.deepEqual(sent[0], {
    replyToken: 'reply-token-1',
    messages: [{ type: 'text', text: 'Slip detected | Amount: 99.00 THB' }]
  });

  const updatedJob = JSON.parse(await fs.readFile(replyJobPath, 'utf8'));
  assert.equal(updatedJob.status, 'sent');
  assert.ok(updatedJob.sentAt);
});
