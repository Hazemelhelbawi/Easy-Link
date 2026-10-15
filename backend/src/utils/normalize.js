export function collapseWhitespace(value) {
  return String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ');
}

export function normalizeKey(value) {
  return collapseWhitespace(value).toLowerCase();
}

export function normalizeHeader(value) {
  return collapseWhitespace(value);
}

export function msisdnToText(value) {
  if (value === null || value === undefined || value === '') return '';
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(Math.trunc(value));
  }
  let s = String(value).trim();
  if (/\.0+$/.test(s)) s = s.replace(/\.0+$/, '');
  return s;
}

export function toNumber(value) {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const n = Number(String(value).replace(/,/g, '').trim());
  return Number.isFinite(n) ? n : 0;
}

export function toMonth(value) {
  const n = toNumber(value);
  if (n >= 1 && n <= 12) return Math.trunc(n);
  return null;
}

export function normalizeType(value) {
  return normalizeKey(value);
}
