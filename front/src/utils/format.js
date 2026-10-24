import { t } from '../i18n/index.js';

export function formatNumber(lang, value) {
  const n = Number(value) || 0;
  return new Intl.NumberFormat(lang === 'ar' ? 'ar-SA' : 'en-US', {
    maximumFractionDigits: 2,
  }).format(n);
}

/** Localized unique-SFA label, e.g. "2 SFAs" / "2 SFA". */
export function formatSfaCount(lang, value) {
  const n = Number(value) || 0;
  if (n === 1) return t(lang, 'sfaCountOne');
  return t(lang, 'sfaCount', { n: formatNumber(lang, n) });
}

/** Short axis labels (e.g. 200K). Always LTR digits so RTL UI does not flip "800K" into unreadable order. */
export function formatChartAxisNumber(_lang, value) {
  const n = Number(value) || 0;
  const abs = Math.abs(n);
  const fmt = (v, digits = 0) =>
    new Intl.NumberFormat('en-US', { maximumFractionDigits: digits }).format(v);
  const ltr = (s) => `\u200E${s}`;
  if (abs >= 1_000_000) {
    const scaled = n / 1_000_000;
    return ltr(`${fmt(scaled, scaled >= 10 ? 0 : 1)}M`);
  }
  if (abs >= 1000) {
    const scaled = n / 1000;
    return ltr(`${fmt(scaled, 0)}K`);
  }
  return ltr(fmt(n, 0));
}

export function formatCurrency(lang, value, metadata) {
  const n = Number(value) || 0;
  const code = metadata?.currencyCode || 'SAR';
  const label = lang === 'ar' ? metadata?.currencyLabel?.ar : metadata?.currencyLabel?.en;
  try {
    return new Intl.NumberFormat(lang === 'ar' ? 'ar-SA' : 'en-US', {
      style: 'currency',
      currency: code,
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `${formatNumber(lang, n)} ${label || code}`;
  }
}

export function formatDateTime(lang, iso) {
  if (!iso) return '—';
  return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-SA' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso));
}
