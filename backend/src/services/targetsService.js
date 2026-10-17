import { paths } from '../config.js';
import { atomicWriteJson, readJson } from '../utils/atomicWrite.js';
import { getTeamMemberIds } from './permissions.js';

async function loadTargetsFile() {
  return readJson(paths.targets, { targets: [] });
}

export async function loadTargets() {
  const data = await loadTargetsFile();
  return data.targets || [];
}

export async function saveTargets(targets) {
  await atomicWriteJson(paths.targets, { targets });
}

export function targetKey(personId, year, month) {
  return `${personId}:${year}:${month}`;
}

export async function upsertTarget(entry) {
  const targets = await loadTargets();
  const idx = targets.findIndex(
    (t) => t.personId === entry.personId && t.year === entry.year && t.month === entry.month,
  );
  const row = {
    personId: entry.personId,
    year: Number(entry.year),
    month: Number(entry.month),
    revenueTarget: entry.revenueTarget != null ? Number(entry.revenueTarget) : null,
    ordersTarget: entry.ordersTarget != null ? Number(entry.ordersTarget) : null,
    updatedAt: new Date().toISOString(),
  };
  if (idx >= 0) targets[idx] = { ...targets[idx], ...row };
  else targets.push(row);
  await saveTargets(targets);
  return row;
}

export async function bulkUpsertTarget(entries) {
  for (const e of entries) await upsertTarget(e);
  return loadTargets();
}

export async function deleteTarget(personId, year, month) {
  const targets = await loadTargets();
  const next = targets.filter(
    (t) => !(t.personId === personId && t.year === Number(year) && t.month === Number(month)),
  );
  await saveTargets(next);
  return next;
}

export function computeActualForPerson(appliedRows, personId, year, month) {
  const rows = appliedRows.filter(
    (r) =>
      r.personId === personId &&
      r.status === 'applied' &&
      r.reportingYear === year &&
      r.month === month,
  );
  return {
    revenue: rows.reduce((s, r) => s + (r.revenue || 0), 0),
    orders: rows.length,
  };
}

export async function buildTargetVsActual({
  user,
  role,
  people,
  appliedRows,
  year,
  month,
  config,
}) {
  const visiblePeople = people.filter((p) => {
    if (role === 'admin' || role === 'top') return true;
    if (role === 'manager') {
      const team = getTeamMemberIds(user.personId, people);
      return team.has(p.id);
    }
    return p.id === user.personId;
  });

  const targets = await loadTargets();
  const monthTargets = targets.filter((t) => t.year === year && t.month === month);
  const byPerson = new Map(monthTargets.map((t) => [t.personId, t]));

  const rows = visiblePeople.map((person) => {
    const actual = computeActualForPerson(appliedRows, person.id, year, month);
    const target = byPerson.get(person.id);
    const hasTarget =
      target &&
      ((target.revenueTarget != null && target.revenueTarget > 0) ||
        (target.ordersTarget != null && target.ordersTarget > 0));
    let pct = null;
    if (hasTarget && target.revenueTarget > 0) {
      pct = (actual.revenue / target.revenueTarget) * 100;
    } else if (hasTarget && target.ordersTarget > 0) {
      pct = (actual.orders / target.ordersTarget) * 100;
    }
    return {
      personId: person.id,
      name: person.displayName,
      group: person.group,
      hasTarget: !!hasTarget,
      revenueTarget: target?.revenueTarget ?? null,
      ordersTarget: target?.ordersTarget ?? null,
      actualRevenue: actual.revenue,
      actualOrders: actual.orders,
      percentage: pct,
      remaining:
        hasTarget && target.revenueTarget > 0
          ? Math.max(0, target.revenueTarget - actual.revenue)
          : hasTarget && target.ordersTarget > 0
            ? Math.max(0, target.ordersTarget - actual.orders)
            : null,
    };
  });

  const teamTotals = rows.reduce(
    (acc, r) => {
      acc.actualRevenue += r.actualRevenue;
      acc.actualOrders += r.actualOrders;
      if (r.hasTarget) {
        acc.targetRevenue += r.revenueTarget || 0;
        acc.targetOrders += r.ordersTarget || 0;
        acc.withTarget += 1;
      }
      return acc;
    },
    { actualRevenue: 0, actualOrders: 0, targetRevenue: 0, targetOrders: 0, withTarget: 0 },
  );

  return { year, month, rows, teamTotals, currencyCode: config.currencyCode };
}
