import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { processFetchJob } from '../../src/jobs/processFetchJob.js';

function createStubLineClient() {
  return {
    async fetchMessageContent(messageId) {
      assert.equal(messageId, 'msg-image-1');
      return {
        buffer: Buffer.from('fake-image-binary'),
        contentType: 'image/jpeg'
      };
    }
  };
}

function createStubOcrClient() {
  return {
    async extractText({ messageId, filePath, mimeType }) {
      assert.equal(messageId, 'msg-image-1');
      assert.equal(mimeType, 'image/jpeg');
      assert.match(filePath, /msg-image-1/);
      return 'SCB Transfer successful Amount 1,250.00 THB Reference 123456789012 QR Payment';
    }
  };
}

test('processFetchJob fetches media, runs OCR analysis, and creates a reply job', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'genlabs-job-'));
  const jobsDir = path.join(tempDir, 'jobs');
  await fs.mkdir(jobsDir, { recursive: true });

  const jobPath = path.join(jobsDir, 'msg-image-1.json');
  await fs.writeFile(
    jobPath,
    JSON.stringify(
      {
        jobType: 'fetch_line_content',
        status: 'pending',
        messageId: 'msg-image-1',
        messageType: 'image',
        replyToken: 'reply-token-1',
        source: { type: 'group', groupId: 'group-1' }
      },
      null,
      2
    )
  );

  const result = await processFetchJob(jobPath, {
    storeDir: tempDir,
    lineClient: createStubLineClient(),
    ocrClient: createStubOcrClient()
  });

  assert.equal(result.status, 'processed');

  const mediaFiles = await fs.readdir(path.join(tempDir, 'media'));
  const analysisFiles = await fs.readdir(path.join(tempDir, 'analysis'));
  const replyFiles = await fs.readdir(path.join(tempDir, 'reply_jobs'));

  assert.equal(mediaFiles.length, 1);
  assert.equal(analysisFiles.length, 1);
  assert.equal(replyFiles.length, 1);

  const replyJob = JSON.parse(
    await fs.readFile(path.join(tempDir, 'reply_jobs', replyFiles[0]), 'utf8')
  );

  assert.equal(replyJob.replyToken, 'reply-token-1');
  assert.match(replyJob.message.text, /Slip detected/);
  assert.match(replyJob.message.text, /1250.00 THB/);

  const updatedJob = JSON.parse(await fs.readFile(jobPath, 'utf8'));
  assert.equal(updatedJob.status, 'processed');
  assert.ok(updatedJob.mediaPath);
  assert.ok(updatedJob.analysisPath);
});
