import { createApp } from '../app.js';

export function createWebhookServer({ config, createAppImpl = createApp }) {
  return createAppImpl({
    channelSecret: config.channelSecret,
    channelAccessToken: config.channelAccessToken,
    storeDir: config.storeDir
  });
}
