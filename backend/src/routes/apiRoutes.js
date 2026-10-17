import { Router } from 'express';
import { attachAuth, requireAuth, requirePasswordChanged } from '../middleware/auth.js';
import { getReportCache } from '../services/reportCache.js';
import { loadConfig, loadPeople } from '../services/store.js';
import {
  filterVisibleRows,
  canViewPersonMetrics,
  leaderboardEligiblePeople,
} from '../services/permissions.js';
import { applyOrderQueryFilters, collectOrderFilterOptions } from '../services/orderFilters.js';
import {
  aggregateOverview,
  aggregateOverviewForMonth,
  appliedStatusBreakdown,
  monthlyAppliedMetrics,
  getLatestReportingMonth,
  getAvailableMonths,
  monthComparison,
  pendingByStage,
  filterRowsByMonth,
  personPerformance,
  buildLeaderboard,
  teamBreakdown,
} from '../services/metrics.js';

const router = Router();
router.use(attachAuth, requireAuth, requirePasswordChanged);

router.get('/metadata', async (req, res) => {
  const config = await loadConfig();
  const cache = getReportCache();
  return res.json({
    ok: true,
    data: {
      applicationName: config.applicationName,
      companyName: config.companyName,
      reportingYear: config.reportingYear,
      currencyCode: config.currencyCode,
      currencyLabel: config.currencyLabel,
      lastUploadAt: cache.lastUploadAt,
      rowCounts: cache.rowCounts,
      availableMonths: getAvailableMonths(
        cache.rows.filter((r) => r.status === 'applied'),
        config.reportingYear,
      ),
    },
  });
});

router.get('/overview', async (req, res) => {
  const config = await loadConfig();
  const people = await loadPeople();
  const cache = getReportCache();
  const visible = filterVisibleRows(req.auth.user, req.auth.role, people, cache.rows);
  const applied = visible.filter((r) => r.status === 'applied');
  const monthParam = req.query.month ? String(req.query.month) : 'all';
  const latest = getLatestReportingMonth(applied, config.reportingYear);
  const selectedMonth =
    monthParam === 'all'
      ? latest
      : Number.isFinite(Number(monthParam))
        ? Number(monthParam)
        : latest;
  const summary =
    selectedMonth != null
      ? aggregateOverviewForMonth(visible, selectedMonth, config.reportingYear)
      : aggregateOverview(applied, visible);
  const monthMap = monthlyAppliedMetrics(applied, config.reportingYear);
  const cmp = monthComparison(monthMap, selectedMonth);
  const monthStatusBreakdown =
    selectedMonth != null
      ? appliedStatusBreakdown(applied, selectedMonth, config.reportingYear)
      : [];
  const revenueSeries = getAvailableMonths(applied, config.reportingYear).map((m) => ({
    month: m,
    revenue: monthMap.get(m)?.revenue || 0,
    completed: monthMap.get(m)?.completed || 0,
  }));
  const pending = pendingByStage(
    selectedMonth != null ? filterRowsByMonth(visible, selectedMonth, config.reportingYear) : visible,
  );
  let teamPerformance = [];
  if (['admin', 'top', 'manager'].includes(req.auth.role) && req.auth.user.personId) {
    teamPerformance = teamBreakdown(
      applied,
      people,
      req.auth.user.personId,
      config.reportingYear,
      selectedMonth ?? latest,
    );
  } else if (req.auth.role === 'admin' || req.auth.role === 'top') {
    teamPerformance = people
      .filter((p) => p.orgRole === 'manager')
      .flatMap((m) =>
        teamBreakdown(applied, people, m.id, config.reportingYear, selectedMonth ?? latest),
      );
  }

  return res.json({
    ok: true,
    data: {
      summary,
      reportingYear: config.reportingYear,
      selectedMonth,
      latestMonth: latest,
      comparison: cmp,
      revenueSeries,
      monthStatusBreakdown,
      pendingByStage: pending,
      teamPerformance,
    },
  });
});

router.get('/achievements', async (req, res) => {
  const config = await loadConfig();
  const people = await loadPeople();
  const cache = getReportCache();
  const visible = filterVisibleRows(req.auth.user, req.auth.role, people, cache.rows);
  let personId = req.auth.user.personId;
  if (req.query.person) {
    const requested = String(req.query.person);
    if (!canViewPersonMetrics(req.auth.user, req.auth.role, people, requested)) {
      return res.status(403).json({ ok: false, code: 'FORBIDDEN' });
    }
    personId = requested;
  }
  if (req.auth.role === 'ict' && req.query.person && req.query.person !== req.auth.user.personId) {
    return res.status(403).json({ ok: false, code: 'FORBIDDEN' });
  }

  const applied = visible.filter((r) => r.status === 'applied');
  const perf = personPerformance(applied, personId, config.reportingYear);
  const latest = getLatestReportingMonth(
    applied.filter((r) => r.personId === personId),
    config.reportingYear,
  );
  const cmp = monthComparison(perf.byMonth, latest);

  const monthly = getAvailableMonths(
    applied.filter((r) => r.personId === personId),
    config.reportingYear,
  ).map((m) => ({
    month: m,
    revenue: perf.byMonth.get(m)?.revenue || 0,
    completed: perf.byMonth.get(m)?.completed || 0,
  }));

  return res.json({
    ok: true,
    data: {
      personId,
      reportingYear: config.reportingYear,
      latestMonth: latest,
      bestMonth: perf.bestMonth,
      comparison: cmp,
      monthly,
    },
  });
});

router.get('/leaderboard', async (req, res) => {
  const config = await loadConfig();
  const people = await loadPeople();
  const users = await (await import('../services/store.js')).loadUsers();
  const cache = getReportCache();
  const applied = cache.rows.filter((r) => r.status === 'applied');
  const month = req.query.month ? (req.query.month === 'all' ? 'all' : Number(req.query.month)) : 'all';
  const group = req.query.group ? String(req.query.group) : 'all';
  const eligible = leaderboardEligiblePeople(people, users, config);
  const entries = buildLeaderboard(applied, eligible, config.reportingYear, month, group);
  const showRevenue = config.leaderboardShowRevenue !== false;
  const sanitized = entries.map((e) => ({
    ...e,
    revenue: showRevenue ? e.revenue : undefined,
  }));
  const current = sanitized.find((e) => e.personId === req.auth.user.personId);
  return res.json({
    ok: true,
    data: {
      reportingYear: config.reportingYear,
      month,
      group,
      showRevenue,
      entries: sanitized,
      currentUserRank: current?.rank || null,
    },
  });
});

router.get('/orders/options', async (req, res) => {
  const config = await loadConfig();
  const people = await loadPeople();
  const cache = getReportCache();
  const visible = filterVisibleRows(req.auth.user, req.auth.role, people, cache.rows);
  const status = req.query.status ? String(req.query.status) : null;
  const month = req.query.month ? String(req.query.month) : 'all';
  const options = collectOrderFilterOptions(visible, { status, month, reportingYear: config.reportingYear });
  return res.json({ ok: true, data: options });
});

router.get('/orders', async (req, res) => {
  const config = await loadConfig();
  const people = await loadPeople();
  const cache = getReportCache();
  let visible = filterVisibleRows(req.auth.user, req.auth.role, people, cache.rows);

  const person = req.query.person ? String(req.query.person) : null;
  if (person) {
    if (!canViewPersonMetrics(req.auth.user, req.auth.role, people, person)) {
      return res.status(403).json({ ok: false, code: 'FORBIDDEN' });
    }
    visible = visible.filter((r) => r.personId === person);
  }

  visible = applyOrderQueryFilters(visible, req.query, config.reportingYear);

  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20));
  const total = visible.length;
  const start = (page - 1) * pageSize;
  const items = visible.slice(start, start + pageSize).map(publicOrder);

  return res.json({
    ok: true,
    data: { items, total, page, pageSize },
  });
});

router.get('/team', async (req, res) => {
  const config = await loadConfig();
  const people = await loadPeople();
  const cache = getReportCache();
  const visible = filterVisibleRows(req.auth.user, req.auth.role, people, cache.rows);
  const applied = visible.filter((r) => r.status === 'applied');
  const latest = getLatestReportingMonth(applied, config.reportingYear);

  if (req.auth.role === 'employee') {
    return res.status(403).json({ ok: false, code: 'FORBIDDEN' });
  }

  let rootPersonId = req.auth.user.personId;
  if (req.auth.role === 'admin' || req.auth.role === 'top') {
    rootPersonId = req.query.manager ? String(req.query.manager) : rootPersonId;
  }
  if (!rootPersonId && req.auth.role !== 'ict') {
    return res.json({ ok: true, data: { members: [], ictAggregate: null } });
  }

  if (req.auth.role === 'ict') {
    const ictRows = visible.filter((r) => r.ict);
    return res.json({
      ok: true,
      data: {
        ictAggregate: {
          applied: ictRows.filter((r) => r.status === 'applied').length,
          revenue: ictRows.filter((r) => r.status === 'applied').reduce((s, r) => s + r.revenue, 0),
          underActivation: ictRows.filter((r) => r.status === 'underActivation').length,
        },
        members: [],
      },
    });
  }

  const members = teamBreakdown(applied, people, rootPersonId, config.reportingYear, latest);
  const under = visible.filter((r) => r.status === 'underActivation');
  return res.json({
    ok: true,
    data: {
      managerId: rootPersonId,
      latestMonth: latest,
      members,
      underActivationCount: under.length,
    },
  });
});

function publicOrder(row) {
  return {
    id: row.id,
    status: row.status,
    companyName: row.companyName,
    authorizedName: row.authorizedName || '',
    authorizedMobile: row.authorizedMobile || '',
    orderIdentifier: row.orderIdentifier,
    kamName: row.kamNameOriginal,
    msisdn: row.msisdn,
    packageName: row.packageName,
    mrc: row.mrc,
    revenue: row.revenue,
    statusText: row.statusText,
    stage: row.stage,
    month: row.month,
    reportingYear: row.reportingYear,
    ict: row.ict,
    personId: row.personId,
  };
}

export default router;
