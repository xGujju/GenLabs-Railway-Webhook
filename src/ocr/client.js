import axios from 'axios';
import fs from 'node:fs/promises';

function joinParsedText(data) {
  return (data?.ParsedResults || [])
    .map((item) => item?.ParsedText || '')
    .join('\n')
    .trim();
}

function createMockOcrClient(mockText) {
  return {
    async extractText() {
      return mockText;
    }
  };
}

function createOcrSpaceClient({ apiKey, httpClient = axios }) {
  return {
    async extractText({ filePath, mimeType }) {
      const fileBuffer = await fs.readFile(filePath);
      const form = new FormData();
      form.append('file', new Blob([fileBuffer], { type: mimeType }), filePath.split('/').pop() || 'upload.bin');
      form.append('language', 'eng');
      form.append('isOverlayRequired', 'false');
      form.append('OCREngine', '2');

      const response = await httpClient.post(
        'https://api.ocr.space/parse/image',
        form,
        {
          headers: {
            apikey: apiKey
          }
        }
      );

      if (response.data?.IsErroredOnProcessing) {
        throw new Error(`OCR.space failed: ${JSON.stringify(response.data?.ErrorMessage || response.data)}`);
      }

      return joinParsedText(response.data);
    }
  };
}

export function createOcrClient({ provider = 'mock', apiKey = '', mockText = '', httpClient = axios }) {
  if (provider === 'ocr_space') {
    return createOcrSpaceClient({ apiKey, httpClient });
  }

  return createMockOcrClient(mockText);
}
