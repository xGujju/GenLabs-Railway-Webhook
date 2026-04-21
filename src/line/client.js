import axios from 'axios';

function normalizeToken(token) {
  return (token || '').trim();
}

export function createLineClient({ channelAccessToken, httpClient = axios }) {
  const token = normalizeToken(channelAccessToken);
  const authHeaders = {
    Authorization: `Bearer ${token}`
  };

  return {
    async fetchMessageContent(messageId) {
      const response = await httpClient.get(
        `https://api-data.line.me/v2/bot/message/${messageId}/content`,
        {
          headers: authHeaders,
          responseType: 'arraybuffer'
        }
      );

      return {
        buffer: Buffer.from(response.data),
        contentType: response.headers['content-type'] || 'application/octet-stream'
      };
    },

    async replyMessage({ replyToken, messages }) {
      await httpClient.post(
        'https://api.line.me/v2/bot/message/reply',
        {
          replyToken,
          messages
        },
        {
          headers: {
            ...authHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }
  };
}
