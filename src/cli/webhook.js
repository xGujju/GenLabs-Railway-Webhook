import { createRuntimeConfig } from '../config.js';
import { createWebhookServer } from '../runtime/webhookRuntime.js';

const config = createRuntimeConfig(process.env);
const app = createWebhookServer({ config });

app.listen(config.port, '0.0.0.0', () => {
  console.log(`LINE webhook server running on port ${config.port}`);
});
