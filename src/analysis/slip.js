function normalizeText(text) {
  return (text || '').replace(/\s+/g, ' ').trim();
}

function extractAmount(text) {
  const patterns = [
    /amount\s*[:\-]?\s*([0-9,]+(?:\.[0-9]{2})?)\s*(thb|baht)?/i,
    /(?:จำนวนเงิน|ยอดเงิน|เงินโอน|บาท)\s*[:\-]?\s*([0-9,]+(?:\.[0-9]{2})?)/i,
    /([0-9,]+(?:\.[0-9]{2})?)\s*(thb|baht|บาท)/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return {
        amount: match[1].replace(/,/g, ''),
        currency: 'THB'
      };
    }
  }

  return { amount: null, currency: null };
}

function extractReferenceId(text) {
  const patterns = [
    /reference\s*[:\-]?\s*([0-9]{6,})/i,
    /(?:เลขอ้างอิง|รหัสอ้างอิง|เลขที่รายการ)\s*[:\-]?\s*([0-9]{6,})/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

function extractBankHint(text) {
  if (/scb|siam commercial|ไทยพาณิชย์/i.test(text)) return 'SCB';
  if (/kbank|kasikorn|k plus|กสิกร/i.test(text)) return 'KBANK';
  if (/bangkok bank|bbl|กรุงเทพ/i.test(text)) return 'BBL';
  if (/krungsri|bay|กรุงศรี/i.test(text)) return 'BAY';
  if (/krungthai|ktb|กรุงไทย/i.test(text)) return 'KTB';
  if (/ttb|ทหารไทยธนชาต/i.test(text)) return 'TTB';
  return null;
}

export function analyzeSlipText(rawText) {
  const text = normalizeText(rawText);
  const { amount, currency } = extractAmount(text);
  const referenceId = extractReferenceId(text);
  const bankHint = extractBankHint(text);
  const hasQr = /\bqr\b|qr payment|พร้อมเพย์|promptpay/i.test(text);
  const hasTransferKeyword = /transfer successful|transaction|slip|โอนเงินสำเร็จ|ทำรายการสำเร็จ|สำเร็จ|รายการ/i.test(text);
  const isSlipLike = Boolean(
    text && (
      referenceId ||
      hasTransferKeyword ||
      (amount && bankHint) ||
      (amount && hasQr)
    )
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
