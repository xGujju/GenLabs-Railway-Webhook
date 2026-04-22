import fs from 'node:fs/promises';
import path from 'node:path';

function startOfDay(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function startOfWeek(date) {
  const day = startOfDay(date);
  const offset = (day.getUTCDay() + 6) % 7;
  day.setUTCDate(day.getUTCDate() - offset);
  return day;
}

function startOfMonth(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function parseDateTime(value) {
  if (!value) return null;

  const normalized = String(value).replace(/\s+/g, ' ').trim();
  const native = new Date(normalized);
  if (!Number.isNaN(native.getTime())) {
    return native;
  }

  const dashMatch = normalized.match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{2,4})\s*-\s*(\d{1,2}:\d{2})$/i);
  if (dashMatch) {
    const [, day, mon, year, time] = dashMatch;
    const candidate = new Date(`${day} ${mon} ${year} ${time} UTC`);
    return Number.isNaN(candidate.getTime()) ? null : candidate;
  }

  return null;
}

async function findMediaFile(storeDir, messageId) {
  const mediaDir = path.join(storeDir, 'media');
  try {
    const files = await fs.readdir(mediaDir);
    return files.find((file) => file.startsWith(`${messageId}.`)) || null;
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

async function readLedgerEntries(storeDir) {
  const analysisDir = path.join(storeDir, 'analysis');

  let files = [];
  try {
    files = await fs.readdir(analysisDir);
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }

  const entries = [];
  for (const file of files) {
    const filePath = path.join(analysisDir, file);
    const record = JSON.parse(await fs.readFile(filePath, 'utf8'));
    if (!record.analysis?.isSlipLike || !record.analysis?.amount) {
      continue;
    }

    const stat = await fs.stat(filePath);
    const occurredAt = parseDateTime(record.analysis?.dateTime) || stat.mtime;
    const mediaFile = await findMediaFile(storeDir, record.messageId);

    entries.push({
      messageId: record.messageId,
      amount: Number.parseFloat(record.analysis.amount),
      currency: record.analysis.currency || 'THB',
      bank: record.analysis.bankHint || 'UNKNOWN',
      status: record.analysis.status || 'Detected',
      referenceId: record.analysis.referenceId || null,
      dateTime: record.analysis.dateTime || occurredAt.toISOString(),
      occurredAt: occurredAt.toISOString(),
      hasQr: Boolean(record.analysis.hasQr),
      summary: record.summary,
      extractedText: record.extractedText,
      imageFile: mediaFile
    });
  }

  return entries.sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt));
}

function sumAmounts(entries) {
  return entries.reduce((sum, entry) => sum + entry.amount, 0);
}

function toChartSeries(entries, mode) {
  const buckets = new Map();

  for (const entry of entries) {
    const date = new Date(entry.occurredAt);
    const key = mode === 'hour'
      ? `${String(date.getUTCHours()).padStart(2, '0')}:00`
      : date.toISOString().slice(0, 10);
    buckets.set(key, (buckets.get(key) || 0) + entry.amount);
  }

  return [...buckets.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => a.label.localeCompare(b.label));
}

function buildBankBreakdown(entries) {
  const totals = new Map();
  for (const entry of entries) {
    totals.set(entry.bank, (totals.get(entry.bank) || 0) + entry.amount);
  }

  return [...totals.entries()]
    .map(([bank, value]) => ({ bank, value }))
    .sort((a, b) => b.value - a.value);
}

export async function buildLedgerSnapshot({ storeDir, now = new Date() }) {
  const entries = await readLedgerEntries(storeDir);
  const todayStart = startOfDay(now);
  const weekStart = startOfWeek(now);
  const monthStart = startOfMonth(now);

  const todayEntries = entries.filter((entry) => new Date(entry.occurredAt) >= todayStart);
  const weekEntries = entries.filter((entry) => new Date(entry.occurredAt) >= weekStart);
  const monthEntries = entries.filter((entry) => new Date(entry.occurredAt) >= monthStart);

  return {
    generatedAt: now.toISOString(),
    metrics: {
      revenueToday: sumAmounts(todayEntries),
      revenueWeek: sumAmounts(weekEntries),
      revenueMonth: sumAmounts(monthEntries),
      revenueAllTime: sumAmounts(entries),
      totalDetectedSlips: entries.length
    },
    charts: {
      hourlyToday: toChartSeries(todayEntries, 'hour'),
      dailyThisWeek: toChartSeries(weekEntries, 'day'),
      dailyThisMonth: toChartSeries(monthEntries, 'day')
    },
    bankBreakdown: buildBankBreakdown(entries),
    recentPayments: entries,
    ledger: entries
  };
}