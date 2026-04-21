import express from 'express';
import crypto from 'crypto';
import axios from 'axios';

const app = express();
const PORT = process.env.PORT || 3000;
const CHANNEL_SECRET = process.env.CHANNEL_SECRET;
const CHANNEL_ACCESS_TOKEN = process.env.CHANNEL_ACCESS_TOKEN;

// Middleware to capture raw body for signature verification
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf.toString('utf8');
  }
}));

// GET root endpoint
app.get('/', (req, res) => {
  res.send('LINE webhook running');
});

// Signature verification function
function verifySignature(body, signature) {
  const hash = crypto
    .createHmac('sha256', CHANNEL_SECRET)
    .update(body)
    .digest('base64');
  return hash === signature;
}

// POST webhook endpoint
app.post('/webhook', async (req, res) => {
  const signature = req.get('x-line-signature');

  // Verify signature
  if (!verifySignature(req.rawBody, signature)) {
    console.log('Invalid signature');
    return res.status(403).send('Forbidden');
  }

  // Respond 200 immediately
  res.status(200).send('OK');

  // Process events asynchronously
  const events = req.body.events || [];
  console.log(`Received ${events.length} event(s)`);

  for (const event of events) {
    console.log(`Event type: ${event.type}`);

    if (event.type === 'follow') {
      console.log('User added bot');
    } else if (event.type === 'message') {
      const message = event.message;
      console.log(`Message type: ${message.type}`);

      if (message.type === 'text') {
        console.log(`Message content: ${message.text}`);
      } else if (['image', 'video', 'audio', 'file'].includes(message.type)) {
        try {
          const response = await axios.get(
            `https://api-data.line.me/v2/bot/message/${message.id}/content`,
            {
              headers: {
                Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}`
              }
            }
          );
          const fileSize = response.headers['content-length'] || response.data.length;
          console.log(`${message.type.charAt(0).toUpperCase() + message.type.slice(1)} file size: ${fileSize} bytes`);
        } catch (error) {
          console.error(`Error fetching ${message.type} content:`, error.message);
        }
      }
    }
  }
});

app.listen(PORT, () => {
  console.log(`LINE webhook server listening on port ${PORT}`);
});
