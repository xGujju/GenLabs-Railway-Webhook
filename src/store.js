import fs from 'node:fs/promises';
import path from 'node:path';

const MEDIA_TYPES = new Set(['image', 'video', 'audio', 'file']);

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function writeJson(dirPath, fileName, data) {
  await ensureDir(dirPath);
  const fullPath = path.join(dirPath, fileName);
  await fs.writeFile(fullPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  return fullPath;
}

function envelopeFileName(payload) {
  const firstEvent = payload.events?.[0];
  return `${firstEvent?.webhookEventId || Date.now()}-envelope.json`;
}

function eventFileName(event, index) {
  return `${event.webhookEventId || event.message?.id || `event-${index}`}.json`;
}

function jobFileName(event, index) {
  return `${event.message?.id || event.webhookEventId || `job-${index}`}.json`;
}

function createFetchJob(event) {
  return {
    jobType: 'fetch_line_content',
    status: 'pending',
    createdAt: new Date().toISOString(),
    webhookEventId: event.webhookEventId || null,
    replyToken: event.replyToken || null,
    source: event.source || null,
    messageId: event.message.id,
    messageType: event.message.type
  };
}

export async function persistWebhookPayload(storeDir, payload) {
  const envelopesDir = path.join(storeDir, 'envelopes');
  const eventsDir = path.join(storeDir, 'events');
  const jobsDir = path.join(storeDir, 'jobs');

  await writeJson(envelopesDir, envelopeFileName(payload), payload);

  const events = payload.events || [];
  await Promise.all(
    events.map((event, index) =>
      writeJson(eventsDir, eventFileName(event, index), event)
    )
  );

  const fetchJobs = events.filter(
    (event) => event.type === 'message' && MEDIA_TYPES.has(event.message?.type)
  );

  await Promise.all(
    fetchJobs.map((event, index) =>
      writeJson(jobsDir, jobFileName(event, index), createFetchJob(event))
    )
  );
}
