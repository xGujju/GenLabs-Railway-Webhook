import test from 'node:test';
import assert from 'node:assert/strict';

import { createWebhookServer } from '../../src/runtime/webhookRuntime.js';

test('createWebhookServer builds app from runtime config', () => {
  const calls = [];
  const app = { name: 'app-instance' };

  const result = createWebhookServer({
    config: {
      channelSecret: 'secret',
      channelAccessToken: 'token',
      storeDir: 'var/store'
    },
    createAppImpl(options) {
      calls.push(options);
      return app;
    }
  });

  assert.equal(result, app);
  assert.deepEqual(calls, [{
    channelSecret: 'secret',
    channelAccessToken: 'token',
    storeDir: 'var/store'
  }]);
});
