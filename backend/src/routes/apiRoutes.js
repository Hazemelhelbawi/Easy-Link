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
import XLSX from 'xlsx';
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
  lostMetricsForMonth,
  pendingMetricsOpen,
  sfaMetricsForRows,
} from '../services/metrics.js';
import { buildTargetVsActual } from '../services/targetsService.js';

const SFA_STATUSES = new Set(['applied', 'underActivation', 'lost']);
const SFA_EXPORT_SCOPES = new Set(['applied', 'underActivation', 'lost', 'month', 'system']);

function overviewMonthScopedRows(visible, selectedMonth, reportingYear) {
  return selectedMonth != null
    ? filterRowsByMonth(visible, selectedMonth, reportingYear)
    : visible;
}

function sfaRowsForStatus(monthScoped, status) {
  if (!SFA_STATUSES.has(status)) return [];
  return monthScoped.filter((r) => r.status === status);
}

function sfaRowsForScope(visible, monthScoped, status, { monthFilter } = {}) {
  if (status === 'system') return visible;
  if (status === 'month') return monthScoped;
  // Under Activation is an open backlog: only apply month when explicitly chosen.
  if (status === 'underActivation') {
    if (monthFilter && monthFilter !== 'all') {
      return sfaRowsForStatus(monthScoped, status);
    }
    return visible.filter((r) => r.status === 'underActivation');
  }
  return sfaRowsForStatus(monthScoped, status);
}

const router = Router();
router.use(attachAuth, requireAuth, requirePasswordChanged);

router.get('/metadata', async (req, res) => {
  const config = await loadConfig();
  const people = await loadPeople();
  const cache = getReportCache();
  const visible = filterVisibleRows(req.auth.user, req.auth.role, people, cache.rows);
  return res.json({
    ok: true,
    data: {
      applicationName: config.applicationName,
      companyName: config.companyName,
      reportingYear: config.reportingYear,
      currencyCode: config.currencyCode,
      currencyLabel: config.currencyLabel,
      lastUploadAt: cache.lastUploadAt,
      reportNumber: cache.reportMeta?.reportNumber || null,
      reportStatus: cache.reportMeta?.reportStatus || null,
      uploadFileName: cache.reportMeta?.fileName || null,
      rowCounts: cache.rowCounts,
      sfaTotal: sfaMetricsForRows(visible).unique,
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
  const monthScoped = overviewMonthScopedRows(visible, selectedMonth, config.reportingYear);
  const pendingSummary = pendingMetricsOpen(visible);
  const lostSummary =
    selectedMonth != null
      ? lostMetricsForMonth(visible, selectedMonth, config.reportingYear)
      : {
          count: visible.filter((r) => r.status === 'lost').length,
          revenue: visible.filter((r) => r.status === 'lost').reduce((s, r) => s + (r.revenue || 0), 0),
        };
  const underActivationRows = visible.filter((r) => r.status === 'underActivation');
  const sfaSummary = {
    applied: sfaMetricsForRows(sfaRowsForStatus(monthScoped, 'applied')),
    underActivation: sfaMetricsForRows(underActivationRows),
    lost: sfaMetricsForRows(sfaRowsForStatus(monthScoped, 'lost')),
    month: sfaMetricsForRows(monthScoped),
    system: sfaMetricsForRows(visible),
  };
  const targetsProgress =
    selectedMonth != null
      ? await buildTargetVsActual({
          user: req.auth.user,
          role: req.auth.role,
          people,
          appliedRows: applied,
          year: config.reportingYear,
          month: selectedMonth,
          config,
        })
      : null;
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
      pendingByStage: pendingSummary.byStage,
      pendingSummary,
      lostSummary,
      sfaSummary,
      report: {
        reportNumber: cache.reportMeta?.reportNumber || null,
        reportStatus: cache.reportMeta?.reportStatus || 'active',
        uploadedAt: cache.lastUploadAt,
        fileName: cache.reportMeta?.fileName || null,
      },
      targetsProgress,
      teamPerformance,
    },
  });
});

router.get('/overview/sfa-export', async (req, res) => {
  const status = String(req.query.status || '');
  if (!SFA_EXPORT_SCOPES.has(status)) {
    return res.status(400).json({ ok: false, error: 'INVALID_STATUS' });
  }
  const config = await loadConfig();
  const people = await loadPeople();
  const cache = getReportCache();
  const visible = filterVisibleRows(req.auth.user, req.auth.role, people, cache.rows);
  const monthParam = req.query.month ? String(req.query.month) : 'all';
  const applied = visible.filter((r) => r.status === 'applied');
  const latest = getLatestReportingMonth(applied, config.reportingYear);
  const selectedMonth =
    monthParam === 'all'
      ? latest
      : Number.isFinite(Number(monthParam))
        ? Number(monthParam)
        : latest;
  const monthScoped = overviewMonthScopedRows(visible, selectedMonth, config.reportingYear);
  // Under Activation export defaults to all open; honor month only when query asks for it.
  const underMonthFilter =
    status === 'underActivation' && monthParam && monthParam !== 'all' ? monthParam : null;
  const metrics = sfaMetricsForRows(
    sfaRowsForScope(visible, monthScoped, status, {
      monthFilter:
        status === 'underActivation'
          ? underMonthFilter
          : selectedMonth != null
            ? String(selectedMonth)
            : 'all',
    }),
  );
  const sheetRows = [
    ['SFA', 'Orders', 'Applied', 'Under Activation', 'Lost'],
    ...metrics.rows.map((r) => [r.sfa, r.orders, r.applied, r.underActivation, r.lost]),
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sheetRows), 'SFA');
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  const monthPart =
    status === 'underActivation' && !underMonthFilter
      ? 'all-open'
      : selectedMonth != null
        ? `m${selectedMonth}`
        : 'all';
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  );
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="sfa-${status}-${monthPart}.xlsx"`,
  );
  return res.send(Buffer.from(buffer));
});

router.get('/targets/progress', async (req, res) => {
  const config = await loadConfig();
  const people = await loadPeople();
  const cache = getReportCache();
  const visible = filterVisibleRows(req.auth.user, req.auth.role, people, cache.rows);
  const applied = visible.filter((r) => r.status === 'applied');
  const month = Number(req.query.month) || getLatestReportingMonth(applied, config.reportingYear);
  if (!month) return res.json({ ok: true, data: null });
  const data = await buildTargetVsActual({
    user: req.auth.user,
    role: req.auth.role,
    people,
    appliedRows: applied,
    year: config.reportingYear,
    month,
    config,
  });
  return res.json({ ok: true, data });
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
  const peopleOptions = people
    .filter((p) => {
      if (req.auth.role === 'admin' || req.auth.role === 'top') return true;
      if (req.auth.role === 'manager') {
        const team = new Set([req.auth.user.personId]);
        for (const x of people) if (x.managerId === req.auth.user.personId) team.add(x.id);
        return team.has(p.id);
      }
      return p.id === req.auth.user.personId;
    })
    .map((p) => ({ id: p.id, name: p.displayName }))
    .sort((a, b) => a.name.localeCompare(b.name));
  return res.json({ ok: true, data: { ...options, people: peopleOptions } });
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

router.get('/orders/export', async (req, res) => {
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
  const header = [
    'Company',
    'Order',
    'Authorized Name',
    'Mobile',
    'KAM',
    'MSISDN',
    'Package',
    'MRC',
    'Revenue',
    'Status',
    'Stage',
    'Month',
  ];
  const lines = [header.join(',')];
  for (const row of visible) {
    lines.push(
      [
        row.companyName,
        row.orderIdentifier,
        row.authorizedName,
        row.authorizedMobile,
        row.kamNameOriginal,
        row.msisdn,
        row.packageName,
        row.mrc,
        row.revenue,
        row.statusText,
        row.stage,
        row.month,
      ]
        .map(csvEscape)
        .join(','),
    );
  }
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="orders-export.csv"');
  return res.send(`\uFEFF${lines.join('\n')}`);
});

function csvEscape(value) {
  const s = String(value ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

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
