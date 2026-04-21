import express from 'express';
import crypto from 'crypto';
import axios from 'axios';

const app = express();
const PORT = process.env.PORT;
const CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET;
const CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;

// Middleware to capture raw body for signature verification
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf.toString('utf8');
    },
  })
);

// GET / route - health check
app.get('/', (req, res) => {
  res.status(200).send('LINE webhook running');
});

// Signature verification using HMAC SHA256 with base64 encoding
function verifySignature(body, signature) {
  const hash = crypto
    .createHmac('sha256', CHANNEL_SECRET)
    .update(body)
    .digest('base64');
  return hash === signature;
}

// Helper to handle media content download
async function fetchMediaContent(messageId, messageType) {
  try {
    const response = await axios.get(
      `https://api-data.line.me/v2/bot/message/${messageId}/content`,
      {
        headers: {
          Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}`,
        },
        responseType: 'arraybuffer',
      }
    );
    const fileSize =
      response.data.byteLength || response.headers['content-length'];
    console.log(`File size: ${fileSize} bytes`);
  } catch (error) {
    console.error(`Error fetching ${messageType} content:`, error.message);
  }
}

// Handle individual LINE events
async function handleEvent(event) {
  console.log('Incoming event:', JSON.stringify(event));

  if (event.type === 'follow') {
    console.log('User added bot');
    return;
  }

  if (event.type === 'message') {
    const { message } = event;
    console.log(`Message type: ${message.type}`);

    if (message.type === 'text') {
      console.log(`Message content: ${message.text}`);
    } else {
      console.log(`Message id: ${message.id}`);
    }

    if (['image', 'video', 'audio', 'file'].includes(message.type)) {
      await fetchMediaContent(message.id, message.type);
    }
  }
}

// POST /webhook endpoint
app.post('/webhook', (req, res) => {
  const signature = req.headers['x-line-signature'];
  const body = req.rawBody;

  // Verify LINE signature
  if (!verifySignature(body, signature)) {
    console.error('Invalid signature');
    return res.status(403).send('Forbidden');
  }

  // Respond 200 immediately before processing events
  res.status(200).send('OK');

  // Log all incoming events
  const events = req.body.events || [];
  console.log(`Received ${events.length} event(s)`);

  // Process events asynchronously after responding
  Promise.all(events.map(handleEvent)).catch((err) =>
    console.error('Error handling events:', err.message)
  );
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`LINE webhook server running on port ${PORT}`);
});
