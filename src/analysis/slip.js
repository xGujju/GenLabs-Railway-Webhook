function normalizeText(text) {
  return (text || '').replace(/\s+/g, ' ').trim();
}

function extractAmount(text) {
  const patterns = [
    /amount\s*[:\-]?\s*([0-9,]+(?:\.[0-9]{2})?)\s*(thb|baht)?/i,
    /(?:จำนวนเงิน|ยอดเงิน|เงินโอน|amount)\s*[:\-]?\s*([0-9,]+(?:\.[0-9]{2})?)\s*(thb|baht|บาท)?/i,
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
    /ref(?:erence)?\s*id\s*[:\-]?\s*([a-z0-9]{8,})/i,
    /transaction\s*id\s*[:\-]?\s*([a-z0-9]{8,})/i,
    /reference\s*[:\-]?\s*([a-z0-9]{6,})/i,
    /(?:เลขอ้างอิง|รหัสอ้างอิง|เลขที่รายการ)\s*[:\-]?\s*([a-z0-9]{6,})/i
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
  if (/kbank|kasikorn|k plus|\bk\+\b|กสิกร/i.test(text)) return 'KBANK';
  if (/bangkok bank|bbl|กรุงเทพ/i.test(text)) return 'BBL';
  if (/krungsri|bay|กรุงศรี/i.test(text)) return 'BAY';
  if (/krungthai|ktb|กรุงไทย/i.test(text)) return 'KTB';
  if (/ttb|ทหารไทยธนชาต/i.test(text)) return 'TTB';
  return null;
}

function extractStatus(text) {
  const patterns = [
    /successful top up/i,
    /payment completed/i,
    /transfer successful/i,
    /transaction successful/i,
    /โอนเงินสำเร็จ/i,
    /ทำรายการสำเร็จ/i,
    /สำเร็จ/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[0];
  }

  return null;
}

function extractDateTime(text) {
  const patterns = [
    /\b\d{1,2}\s+[A-Za-z]{3}\s+\d{2,4}\s*(?:-|at)?\s*\d{1,2}:\d{2}\s*(?:AM|PM)?\b/i,
    /\b\d{1,2}\/\d{1,2}\/\d{2,4}\s+\d{1,2}:\d{2}\b/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[0].replace(/\s+/g, ' ').trim();
  }

  return null;
}

function extractFee(text) {
  const patterns = [
    /fee\s*[:\-]?\s*([0-9,]+(?:\.[0-9]{2})?)\s*(thb|baht)?/i,
    /ค่าธรรมเนียม\s*[:\-]?\s*([0-9,]+(?:\.[0-9]{2})?)\s*(บาท)?/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1].replace(/,/g, '');
    }
  }

  return null;
}

export function extractSlipEvidence(rawText) {
  const text = normalizeText(rawText);
  const status = extractStatus(text);
  const referenceId = extractReferenceId(text);
  const bankHint = extractBankHint(text);
  const { amount, currency } = extractAmount(text);
  const fee = extractFee(text);
  const dateTime = extractDateTime(text);
  const hasQr = /\bqr\b|qr payment|พร้อมเพย์|promptpay|scan for verify slip|verify the top up status/i.test(text);
  const hasVerificationSignal = /scan for verify slip|verify the top up status|for recipient/i.test(text) || hasQr;
  const hasStatusSignal = Boolean(status);
  const hasReferenceSignal = Boolean(referenceId);
  const hasMonetarySignal = Boolean(amount || fee);
  const hasBankSignal = Boolean(bankHint);
  const hasDateTimeSignal = Boolean(dateTime);
  const hasParticipantSignal = /\bfrom\b|\bto\b|recipient|sender|biller note|promptpay topup|meta ads|จาก|ไปยัง/i.test(text);
  const hasTransferContextSignal = /payment|top up|topup|transfer|slip|transaction|รายการ|ชำระ/i.test(text);

  return {
    normalizedText: text,
    status,
    referenceId,
    bankHint,
    amount,
    currency,
    fee,
    dateTime,
    hasQr,
    hasStatusSignal,
    hasReferenceSignal,
    hasMonetarySignal,
    hasBankSignal,
    hasDateTimeSignal,
    hasParticipantSignal,
    hasTransferContextSignal,
    hasVerificationSignal
  };
}

export function scoreSlipEvidence(evidence) {
  let score = 0;
  if (evidence.hasStatusSignal) score += 2;
  if (evidence.hasReferenceSignal) score += 2;
  if (evidence.hasMonetarySignal) score += 2;
  if (evidence.hasBankSignal) score += 1;
  if (evidence.hasDateTimeSignal) score += 1;
  if (evidence.hasParticipantSignal) score += 1;
  if (evidence.hasTransferContextSignal) score += 1;
  if (evidence.hasVerificationSignal) score += 1;
  return score;
}

export function analyzeSlipText(rawText) {
  const evidence = extractSlipEvidence(rawText);
  const confidenceScore = scoreSlipEvidence(evidence);
  const isSlipLike = confidenceScore >= 4;

  return {
    rawText,
    normalizedText: evidence.normalizedText,
    isSlipLike,
    confidenceScore,
    amount: evidence.amount,
    currency: evidence.currency,
    referenceId: evidence.referenceId,
    bankHint: evidence.bankHint,
    hasQr: evidence.hasQr,
    status: evidence.status,
    fee: evidence.fee,
    dateTime: evidence.dateTime,
    evidence
  };
}

export function buildSlipSummary(analysis) {
  if (!analysis?.isSlipLike) {
    return 'No clear slip detected.';
  }

  const parts = ['Slip detected'];

  if (analysis.status) {
    parts.push(`Status: ${analysis.status}`);
  }

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
