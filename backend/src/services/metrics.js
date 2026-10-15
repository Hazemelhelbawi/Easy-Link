import { normalizeKey } from '../utils/normalize.js';

export function getAvailableMonths(rows, reportingYear) {
  const months = new Set();
  for (const row of rows) {
    if (row.status !== 'applied') continue;
    if (row.month && row.reportingYear === reportingYear) months.add(row.month);
  }
  return [...months].sort((a, b) => a - b);
}

export function getLatestReportingMonth(rows, reportingYear) {
  const months = getAvailableMonths(rows, reportingYear);
  return months.length ? months[months.length - 1] : null;
}

export function aggregateOverview(appliedRows, allRows) {
  const applied = appliedRows.length;
  const underActivation = allRows.filter((r) => r.status === 'underActivation').length;
  const lost = allRows.filter((r) => r.status === 'lost').length;
  const appliedRevenue = appliedRows.reduce((s, r) => s + (r.revenue || 0), 0);
  return { applied, underActivation, lost, appliedRevenue };
}

export function monthlyAppliedMetrics(appliedRows, reportingYear) {
  /** @type {Map<number, { revenue: number, completed: number }>} */
  const map = new Map();
  for (const row of appliedRows) {
    if (!row.month || row.reportingYear !== reportingYear) continue;
    const cur = map.get(row.month) || { revenue: 0, completed: 0 };
    cur.revenue += row.revenue || 0;
    cur.completed += 1;
    map.set(row.month, cur);
  }
  return map;
}

export function monthComparison(map, month) {
  if (!month) return { current: null, previous: null, revenueGrowth: null, orderGrowth: null };
  const current = map.get(month) || { revenue: 0, completed: 0 };
  const previous = map.get(month - 1) || { revenue: 0, completed: 0 };
  return {
    current,
    previous,
    revenueGrowth: growthPct(current.revenue, previous.revenue),
    orderGrowth: growthPct(current.completed, previous.completed),
  };
}

function growthPct(current, previous) {
  if (!previous) return null;
  return ((current - previous) / previous) * 100;
}

export function pendingByStage(rows) {
  const map = new Map();
  for (const row of rows.filter((r) => r.status === 'underActivation')) {
    const key = row.stage || 'Unknown';
    map.set(key, (map.get(key) || 0) + 1);
  }
  return [...map.entries()].map(([stage, count]) => ({ stage, count }));
}

export function personPerformance(appliedRows, personId, reportingYear) {
  const rows = appliedRows.filter((r) => r.personId === personId && r.reportingYear === reportingYear);
  const byMonth = monthlyAppliedMetrics(rows, reportingYear);
  let bestMonth = null;
  let bestRevenue = -1;
  for (const [m, data] of byMonth.entries()) {
    if (data.revenue > bestRevenue) {
      bestRevenue = data.revenue;
      bestMonth = m;
    }
  }
  return { byMonth, bestMonth, rows };
}

export function buildLeaderboard(appliedRows, people, reportingYear, monthFilter, groupFilter) {
  const filteredPeople = people.filter((p) => {
    if (!groupFilter || groupFilter === 'all') return true;
    if (groupFilter === 'ict') return p.group === 'ict' || p.orgRole === 'ict';
    return p.group === groupFilter;
  });
  const allowedIds = new Set(filteredPeople.map((p) => p.id));

  /** @type {Map<string, { revenue: number, completed: number, person: typeof people[0] }>} */
  const scores = new Map();

  for (const row of appliedRows) {
    if (!row.personId || !allowedIds.has(row.personId)) continue;
    if (row.reportingYear !== reportingYear) continue;
    if (monthFilter && monthFilter !== 'all' && row.month !== Number(monthFilter)) continue;
    const person = filteredPeople.find((p) => p.id === row.personId);
    if (!person) continue;
    const cur = scores.get(row.personId) || { revenue: 0, completed: 0, person };
    cur.revenue += row.revenue || 0;
    cur.completed += 1;
    scores.set(row.personId, cur);
  }

  const entries = [...scores.values()]
    .map((s) => ({
      personId: s.person.id,
      name: s.person.displayName,
      group: s.person.group,
      revenue: s.revenue,
      completed: s.completed,
    }))
    .sort((a, b) => {
      if (b.revenue !== a.revenue) return b.revenue - a.revenue;
      if (b.completed !== a.completed) return b.completed - a.completed;
      return normalizeKey(a.name).localeCompare(normalizeKey(b.name));
    })
    .map((e, i) => ({ rank: i + 1, ...e }));

  return entries;
}

export function teamBreakdown(appliedRows, people, managerPersonId, reportingYear, month) {
  const teamIds = new Set([managerPersonId]);
  for (const p of people) {
    if (p.managerId === managerPersonId) teamIds.add(p.id);
  }
  const result = [];
  for (const id of teamIds) {
    const person = people.find((p) => p.id === id);
    if (!person) continue;
    let revenue = 0;
    let completed = 0;
    for (const row of appliedRows) {
      if (row.personId !== id) continue;
      if (row.reportingYear !== reportingYear) continue;
      if (month && row.month !== month) continue;
      revenue += row.revenue || 0;
      completed += 1;
    }
    result.push({
      personId: id,
      name: person.displayName,
      revenue,
      completed,
    });
  }
  return result.sort((a, b) => b.revenue - a.revenue);
}
