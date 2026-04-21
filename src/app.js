import express from 'express';

import { verifyLineSignature } from './line/signature.js';
import { persistWebhookPayload } from './store.js';

export function createApp({ channelSecret, channelAccessToken, storeDir }) {
  const app = express();

  app.use(
    express.json({
      verify: (req, _res, buf) => {
        req.rawBody = buf.toString('utf8');
      }
    })
  );

  app.get('/', (_req, res) => {
    res.status(200).send('LINE webhook running');
  });

  async function handleLineWebhook(req, res) {
    const signature = req.headers['x-line-signature'];
    const rawBody = req.rawBody || '';

    if (!verifyLineSignature(rawBody, signature, channelSecret)) {
      return res.status(403).send('Forbidden');
    }

    await persistWebhookPayload(storeDir, req.body);

    return res.status(200).send('OK');
  }

  app.post('/webhook', handleLineWebhook);
  app.post('/webhooks/line', handleLineWebhook);

  return app;
}
