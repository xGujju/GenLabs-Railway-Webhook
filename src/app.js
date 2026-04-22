import express from 'express';

import { createDashboardToken } from './dashboard/auth.js';
import { createOwnerDashboardHtml } from './dashboard/html.js';
import { buildLedgerSnapshot } from './dashboard/ledger.js';
import { verifyLineSignature } from './line/signature.js';
import { persistWebhookPayload } from './store.js';

export function createApp({ channelSecret, channelAccessToken, storeDir }) {
  const app = express();
  const dashboardToken = createDashboardToken({ channelSecret, channelAccessToken });

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

  app.get('/owner/:token', async (req, res) => {
    if (req.params.token !== dashboardToken) {
      return res.status(404).send('Not Found');
    }

    return res.status(200).type('html').send(createOwnerDashboardHtml({ token: dashboardToken }));
  });

  app.get('/owner/:token/data', async (req, res) => {
    if (req.params.token !== dashboardToken) {
      return res.status(404).send('Not Found');
    }

    const snapshot = await buildLedgerSnapshot({ storeDir });
    const ledger = snapshot.ledger.map((entry) => ({
      ...entry,
      imageUrl: entry.imageFile ? `/owner/${dashboardToken}/media/${encodeURIComponent(entry.imageFile)}` : null
    }));

    return res.status(200).json({
      ...snapshot,
      recentPayments: ledger.slice(0, 10),
      ledger
    });
  });

  app.get('/owner/:token/media/:fileName', async (req, res) => {
    if (req.params.token !== dashboardToken) {
      return res.status(404).send('Not Found');
    }

    const mediaPath = new URL(`./${req.params.fileName}`, `file://${storeDir.replace(/\/$/, '')}/media/`).pathname;
    return res.sendFile(mediaPath);
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
