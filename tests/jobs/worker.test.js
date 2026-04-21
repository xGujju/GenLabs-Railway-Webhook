import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { processPendingFetchJobs } from '../../src/jobs/worker.js';

test('processPendingFetchJobs processes every pending fetch job in the store', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'genlabs-worker-'));
  const jobsDir = path.join(tempDir, 'jobs');
  await fs.mkdir(jobsDir, { recursive: true });

  await fs.writeFile(
    path.join(jobsDir, 'job-1.json'),
    JSON.stringify({
      jobType: 'fetch_line_content',
      status: 'pending',
      messageId: 'msg-1',
      messageType: 'image',
      replyToken: 'reply-1',
      source: { type: 'group', groupId: 'group-1' }
    })
  );

  await fs.writeFile(
    path.join(jobsDir, 'job-2.json'),
    JSON.stringify({
      jobType: 'fetch_line_content',
      status: 'pending',
      messageId: 'msg-2',
      messageType: 'image',
      replyToken: 'reply-2',
      source: { type: 'group', groupId: 'group-2' }
    })
  );

  const processed = [];
  const result = await processPendingFetchJobs({
    storeDir: tempDir,
    lineClient: {
      async fetchMessageContent(messageId) {
        processed.push(messageId);
        return { buffer: Buffer.from(messageId), contentType: 'image/jpeg' };
      }
    },
    ocrClient: {
      async extractText({ messageId }) {
        return `Transfer successful Amount 99.00 THB Reference ${messageId === 'msg-1' ? '111111' : '222222'}`;
      }
    }
  });

  assert.deepEqual(processed.sort(), ['msg-1', 'msg-2']);
  assert.equal(result.processedCount, 2);

  const replyJobs = await fs.readdir(path.join(tempDir, 'reply_jobs'));
  assert.equal(replyJobs.length, 2);
});
