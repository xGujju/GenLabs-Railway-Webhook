function normalizeText(text) {
  return (text || '').replace(/\s+/g, ' ').trim();
}

function extractAmount(text) {
  const match = text.match(/amount\s*([0-9,]+(?:\.[0-9]{2})?)\s*(thb|baht)?/i);
  if (!match) {
    return { amount: null, currency: null };
  }

  return {
    amount: match[1].replace(/,/g, ''),
    currency: 'THB'
  };
}

function extractReferenceId(text) {
  const match = text.match(/reference\s*([0-9]{6,})/i);
  return match ? match[1] : null;
}

function extractBankHint(text) {
  if (/scb|siam commercial/i.test(text)) return 'SCB';
  if (/kbank|kasikorn/i.test(text)) return 'KBANK';
  if (/bangkok bank|bbl/i.test(text)) return 'BBL';
  if (/krungsri|bay/i.test(text)) return 'BAY';
  return null;
}

export function analyzeSlipText(rawText) {
  const text = normalizeText(rawText);
  const { amount, currency } = extractAmount(text);
  const referenceId = extractReferenceId(text);
  const bankHint = extractBankHint(text);
  const hasQr = /\bqr\b|qr payment/i.test(text);
  const isSlipLike = Boolean(
    text && (amount || referenceId || /transfer successful|transaction|slip/i.test(text))
  );

  return {
    rawText,
    normalizedText: text,
    isSlipLike,
    amount,
    currency,
    referenceId,
    bankHint,
    hasQr
  };
}

export function buildSlipSummary(analysis) {
  if (!analysis?.isSlipLike) {
    return 'No clear slip detected.';
  }

  const parts = ['Slip detected'];

  if (analysis.amount && analysis.currency) {
    parts.push(`Amount: ${analysis.amount} ${analysis.currency}`);
  }

  if (analysis.referenceId) {
    parts.push(`Ref: ${analysis.referenceId}`);
  }

  if (analysis.bankHint) {
    parts.push(`Bank: ${analysis.bankHint}`);
  }

  if (analysis.hasQr) {
    parts.push('QR found');
  }

  return parts.join(' | ');
}
