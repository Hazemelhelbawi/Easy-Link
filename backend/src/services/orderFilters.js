import { matchSearch } from './permissions.js';

export function filterByMonth(rows, month, reportingYear) {
  if (!month || month === 'all') return rows;
  const m = Number(month);
  if (!Number.isFinite(m)) return rows;
  return rows.filter((r) => r.month === m && r.reportingYear === reportingYear);
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

  const statusText = query.statusText ? String(query.statusText) : '';
  if (statusText) {
    visible = visible.filter((r) => r.statusText === statusText);
  }

  const stage = query.stage ? String(query.stage) : '';
  if (stage) {
    visible = visible.filter((r) => r.stage === stage);
  }

  const search = query.search ? String(query.search) : '';
  if (search) visible = visible.filter((r) => matchSearch(r, search));

  return visible;
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
