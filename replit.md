# LINE Webhook Server

## Overview
A Node.js webhook server for the LINE Messaging API that receives, stores, and processes messages. The primary use case is automated slip detection and OCR (Optical Character Recognition) for transaction slips (bank transfers) sent via LINE.

## Architecture

### Components
1. **Webhook Server** (`src/cli/webhook.js`): Express server that receives LINE events, validates signatures, and persists them to the filesystem.
2. **Worker** (`src/cli/worker-loop.js`): Background process that polls for pending jobs, fetches media from LINE, runs OCR, and replies to users.

### Tech Stack
- **Runtime**: Node.js 20 (ES Modules)
- **Framework**: Express
- **HTTP Client**: Axios
- **OCR**: Google Cloud Vision API (or mock provider for development)
- **Storage**: Filesystem-based (`var/line_webhooks/`)
- **Testing**: Node.js built-in test runner + Supertest

## Project Structure
```
src/
  analysis/     # OCR text analysis (slip detection)
  cli/          # Entry point scripts (webhook, worker-loop, worker-once)
  jobs/         # Background task logic
  line/         # LINE API utilities (signature verification, API client)
  ocr/          # OCR service clients
  runtime/      # Lifecycle and configuration management
  app.js        # Express application
  config.js     # Environment-based configuration
  store.js      # Filesystem persistence layer
tests/          # Unit and integration tests
var/            # Runtime data (webhook payloads, job queue) - gitignored
```

## Configuration (Environment Variables)
| Variable | Description | Default |
|---|---|---|
| `PORT` | Server port | `3000` (set to `5000` in workflow) |
| `LINE_CHANNEL_SECRET` | LINE channel secret for signature verification | - |
| `LINE_CHANNEL_ACCESS_TOKEN` | LINE channel access token for API calls | - |
| `GOOGLE_CLOUD_VISION` | Google Cloud Vision API key | - |
| `OCR_PROVIDER` | OCR provider: `google_cloud_vision` or `mock` | Auto-detected |
| `OCR_API_KEY` | OCR API key override | - |
| `OCR_MOCK_TEXT` | Mock OCR response text | Sample transfer text |
| `WORKER_MAX_ITERATIONS` | Max worker loop iterations (0 = infinite) | `0` |

## Workflows
- **Start application**: `PORT=5000 node src/cli/webhook.js` on port 5000

## API Endpoints
- `GET /` — Health check, returns "LINE webhook running"
- `POST /webhook` — LINE webhook endpoint (requires valid X-Line-Signature header)

## Running
```bash
# Webhook server only
npm start

# Both webhook server and worker
npm run start:all

# Worker only (one iteration)
npm run worker:once

# Worker loop
npm run worker:loop

# Tests
npm test
```
