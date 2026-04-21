import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { runPipelineCycle } from '../../src/jobs/runPipelineCycle.js';

test('runPipelineCycle processes fetch jobs and sends reply jobs in one pass', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'genlabs-pipeline-'));
  const jobsDir = path.join(tempDir, 'jobs');
  await fs.mkdir(jobsDir, { recursive: true });

  await fs.writeFile(
    path.join(jobsDir, 'msg-1.json'),
    JSON.stringify({
      jobType: 'fetch_line_content',
      status: 'pending',
      messageId: 'msg-1',
      messageType: 'image',
      replyToken: 'reply-1',
      source: { type: 'group', groupId: 'group-1' }
    })
  );

  const sent = [];
  const result = await runPipelineCycle({
    storeDir: tempDir,
    lineClient: {
      async fetchMessageContent(messageId) {
        return { buffer: Buffer.from(messageId), contentType: 'image/jpeg' };
      },
      async replyMessage(payload) {
        sent.push(payload);
      }
    },
    ocrClient: {
      async extractText() {
        return 'SCB Transfer successful Amount 88.00 THB Reference 654321 QR Payment';
      }
    }
  });

  assert.equal(result.fetch.processedCount, 1);
  assert.equal(result.reply.processedCount, 1);
  assert.equal(sent.length, 1);
  assert.match(sent[0].messages[0].text, /88.00 THB/);
});
