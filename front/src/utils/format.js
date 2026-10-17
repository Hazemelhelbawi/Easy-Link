export function formatNumber(lang, value) {
  const n = Number(value) || 0;
  return new Intl.NumberFormat(lang === 'ar' ? 'ar-SA' : 'en-US', {
    maximumFractionDigits: 2,
  }).format(n);
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
