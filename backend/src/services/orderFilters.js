import { matchSearch } from './permissions.js';

export function filterByMonth(rows, month, reportingYear) {
  if (!month || month === 'all') return rows;
  const m = Number(month);
  if (!Number.isFinite(m)) return rows;
  return rows.filter((r) => r.month === m && r.reportingYear === reportingYear);
}

function parseListParam(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  return String(value)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

const SORT_KEYS = {
  companyName: (r) => r.companyName,
  orderIdentifier: (r) => r.orderIdentifier,
  revenue: (r) => r.revenue || 0,
  month: (r) => r.month || 0,
  stage: (r) => r.stage,
  statusText: (r) => r.statusText,
  kamName: (r) => r.kamNameOriginal,
};

export function sortRows(rows, sortBy, sortDir) {
  if (!sortBy || !SORT_KEYS[sortBy]) return rows;
  const pick = SORT_KEYS[sortBy];
  const dir = sortDir === 'asc' ? 1 : -1;
  return [...rows].sort((a, b) => {
    const av = pick(a);
    const bv = pick(b);
    if (av < bv) return -1 * dir;
    if (av > bv) return 1 * dir;
    return 0;
  });
}

export function applyOrderQueryFilters(rows, query, reportingYear) {
  let visible = rows;

  const status = query.status ? String(query.status) : null;
  if (status && ['applied', 'underActivation', 'lost'].includes(status)) {
    visible = visible.filter((r) => r.status === status);
  }

  if (query.month && query.month !== 'all') {
    visible = filterByMonth(visible, query.month, reportingYear);
  }

  const company = query.company ? String(query.company) : '';
  if (company) {
    visible = visible.filter((r) => r.companyName === company);
  }

  let statusTexts = parseListParam(query.statusTexts);
  if (!statusTexts.length && query.statusText) statusTexts = [String(query.statusText)];
  if (statusTexts.length) {
    visible = visible.filter((r) => statusTexts.includes(r.statusText));
  }

  let stages = parseListParam(query.stages);
  if (!stages.length && query.stage) stages = [String(query.stage)];
  if (stages.length) {
    visible = visible.filter((r) => stages.includes(r.stage));
  }

  const search = query.search ? String(query.search) : '';
  if (search) visible = visible.filter((r) => matchSearch(r, search));

  return sortRows(visible, query.sortBy, query.sortDir);
}

export function collectOrderFilterOptions(rows, { status, month, reportingYear }) {
  let base = rows;
  if (status && ['applied', 'underActivation', 'lost'].includes(status)) {
    base = base.filter((r) => r.status === status);
  }
  if (month && month !== 'all') {
    base = filterByMonth(base, month, reportingYear);
  }

  const companies = [...new Set(base.map((r) => r.companyName).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b),
  );
  const statusTexts = [...new Set(base.map((r) => r.statusText).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b),
  );
  const stages = [...new Set(base.map((r) => r.stage).filter(Boolean))].sort((a, b) => a.localeCompare(b));

  return { companies, statusTexts, stages };
}

export function buildOrderIndexes(rows) {
  const byMonth = new Map();
  const byCompany = new Map();
  const byPerson = new Map();
  for (const row of rows) {
    const mk = `${row.reportingYear}-${row.month ?? 'x'}`;
    if (!byMonth.has(mk)) byMonth.set(mk, []);
    byMonth.get(mk).push(row);
    if (row.companyName) {
      if (!byCompany.has(row.companyName)) byCompany.set(row.companyName, []);
      byCompany.get(row.companyName).push(row);
    }
    if (row.personId) {
      if (!byPerson.has(row.personId)) byPerson.set(row.personId, []);
      byPerson.get(row.personId).push(row);
    }
  }
  return { byMonth, byCompany, byPerson };
}
