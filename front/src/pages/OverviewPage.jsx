import { useEffect, useMemo, useState } from 'react';
import { BarChart3, CheckCircle2, Clock3, XCircle } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { api } from '../api/client.js';
import { useApp } from '../context/AppContext.jsx';
import { t } from '../i18n/index.js';
import StatCard from '../components/StatCard.jsx';
import ReportMetaBanner from '../components/ReportMetaBanner.jsx';
import PendingBreakdown from '../components/PendingBreakdown.jsx';
import AppliedStatusBreakdown from '../components/AppliedStatusBreakdown.jsx';
import { chartValueAxisMargin, chartValueYAxisProps, rechartsTooltipProps } from '../components/rechartsTheme.jsx';
import { OverviewSkeleton } from '../components/Skeleton.jsx';
import { defaultReportingMonth } from '../utils/monthDefaults.js';
import { formatChartAxisNumber, formatCurrency, formatNumber } from '../utils/format.js';

export default function OverviewPage() {
  const { lang, metadata, role } = useApp();
  const defaultMonth = useMemo(
    () => defaultReportingMonth(metadata?.reportingYear, metadata?.availableMonths || []),
    [metadata?.reportingYear, metadata?.availableMonths],
  );
  const [month, setMonth] = useState(null);
  const activeMonth = month ?? defaultMonth;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (month === null && defaultMonth) setMonth(defaultMonth);
  }, [defaultMonth, month]);

  useEffect(() => {
    if (!activeMonth) return;
    setLoading(true);
    const q = new URLSearchParams({ month: String(activeMonth) });
    api(`/overview?${q}`)
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  }, [activeMonth]);

  const months = t(lang, 'months');
  const monthLabel = activeMonth ? months[activeMonth] : '';
  const chartTick = { fill: 'var(--text-muted)', fontSize: 12 };
  const isRtl = lang === 'ar';
  const axisNumber = (v) => formatChartAxisNumber(lang, v);

  const monthSpark = useMemo(() => {
    if (!data?.revenueSeries?.length || activeMonth == null) {
      return { revenue: [], orders: [] };
    }
    const idx = data.revenueSeries.findIndex((s) => s.month === activeMonth);
    const end = idx >= 0 ? idx + 1 : data.revenueSeries.length;
    const start = Math.max(0, end - 3);
    const slice = data.revenueSeries.slice(start, end);
    return {
      revenue: slice.map((s) => s.revenue),
      orders: slice.map((s) => s.completed),
    };
  }, [data?.revenueSeries, activeMonth]);

  const pipeline = useMemo(() => {
    if (!data?.summary) return null;
    const applied = data.summary.applied || 0;
    const pending = data.summary.underActivation || 0;
    const lost = data.lostSummary?.count ?? data.summary.lost ?? 0;
    const total = applied + pending + lost;
    if (total <= 0) return null;
    return { applied, pending, lost, total };
  }, [data?.summary, data?.lostSummary?.count]);

  if (loading && !data) return <OverviewSkeleton />;

  const ordersLink = (extra) => {
    const q = new URLSearchParams({ month: String(activeMonth), ...extra });
    return `/orders?${q}`;
  };

  return (
    <>
      <div className="overview-header">
        <div>
          <h2 style={{ margin: 0 }}>{t(lang, 'overview')}</h2>
          <p style={{ margin: '6px 0 0', color: 'var(--text-muted)' }}>
            {t(lang, 'monthScope')}: {monthLabel} {data?.reportingYear}
          </p>
        </div>
        <label className="filter-field" style={{ minWidth: 180 }}>
          <span>{t(lang, 'filterMonth')}</span>
          <select className="input" value={String(activeMonth)} onChange={(e) => setMonth(Number(e.target.value))}>
            {(metadata?.availableMonths?.length
              ? metadata.availableMonths
              : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
            ).map((m) => (
              <option key={m} value={m}>
                {months[m]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {data ? (
        <section className="overview-snapshot">
          {data.report ? <ReportMetaBanner report={data.report} lang={lang} /> : null}

          <div className="overview-kpi-grid">
            <StatCard
              lang={lang}
              tone="applied"
              label={t(lang, 'appliedOrders')}
              value={formatNumber(lang, data.summary.applied)}
              icon={CheckCircle2}
              to={ordersLink({ status: 'applied' })}
              trend={data.comparison.orderGrowth}
              hint={t(lang, 'vsPrevMonth')}
              spark={monthSpark.orders}
            />
            <StatCard
              lang={lang}
              tone="pending"
              label={t(lang, 'underActivationOrders')}
              value={formatNumber(lang, data.summary.underActivation)}
              icon={Clock3}
              to={ordersLink({ status: 'underActivation' })}
              footnote={
                pipeline
                  ? `${((pipeline.pending / pipeline.total) * 100).toFixed(0)}% ${t(lang, 'pipelineShare')}`
                  : null
              }
            />
            <StatCard
              lang={lang}
              tone="lost"
              label={t(lang, 'lostOrders')}
              value={formatNumber(lang, data.lostSummary?.count || 0)}
              icon={XCircle}
              to={ordersLink({ status: 'lost' })}
              footnote={
                data.lostSummary?.revenue
                  ? `${t(lang, 'lostRevenueMonth')}: ${formatCurrency(lang, data.lostSummary.revenue, metadata)}`
                  : null
              }
            />
            <StatCard
              tone="revenue"
              label={t(lang, 'appliedRevenue')}
              value={formatCurrency(lang, data.summary.appliedRevenue, metadata)}
              icon={BarChart3}
              trend={data.comparison.revenueGrowth}
              hint={t(lang, 'vsPrevMonth')}
              spark={monthSpark.revenue}
            />
          </div>

          {pipeline ? (
            <div className="pipeline-mix">
              <div className="pipeline-mix-head">
                <span>{t(lang, 'pipelineMix')}</span>
                <span dir="ltr">{formatNumber(lang, pipeline.total)}</span>
              </div>
              <div className="pipeline-mix-bar" role="img" aria-label={t(lang, 'pipelineMix')}>
                <span
                  className="seg applied"
                  style={{ width: `${(pipeline.applied / pipeline.total) * 100}%` }}
                  title={t(lang, 'appliedOrders')}
                />
                <span
                  className="seg pending"
                  style={{ width: `${(pipeline.pending / pipeline.total) * 100}%` }}
                  title={t(lang, 'underActivationOrders')}
                />
                <span
                  className="seg lost"
                  style={{ width: `${(pipeline.lost / pipeline.total) * 100}%` }}
                  title={t(lang, 'lostOrders')}
                />
              </div>
              <ul className="pipeline-mix-legend">
                <li>
                  <i className="dot applied" /> {t(lang, 'appliedOrders')}
                </li>
                <li>
                  <i className="dot pending" /> {t(lang, 'underActivationOrders')}
                </li>
                <li>
                  <i className="dot lost" /> {t(lang, 'lostOrders')}
                </li>
              </ul>
            </div>
          ) : null}
        </section>
      ) : null}

      {data?.pendingSummary ? (
        <div className="card pending-breakdown-card">
          <div className="pending-breakdown-header">
            <h3 style={{ margin: 0 }}>{t(lang, 'pendingBreakdown')}</h3>
            <span className="pending-total-badge" dir="ltr">
              {formatNumber(lang, data.pendingSummary.total)}
            </span>
          </div>
          <p className="pending-breakdown-sub">{t(lang, 'pendingBreakdownHint')}</p>
          <PendingBreakdown summary={data.pendingSummary} lang={lang} ordersLink={ordersLink} />
        </div>
      ) : null}

      {data?.targetsProgress?.rows?.length ? (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>{t(lang, 'targetsProgress')}</h3>
          {data.targetsProgress.rows.map((row) => (
            <div key={row.personId} className="target-row">
              <div>
                <strong>{row.name}</strong>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  {formatCurrency(lang, row.actualRevenue, metadata)} · {formatNumber(lang, row.actualOrders)}{' '}
                  {t(lang, 'appliedOrders')}
                </div>
              </div>
              {row.hasTarget ? (
                <div className="progress-wrap">
                  <div
                    className={`progress-bar ${row.percentage >= 100 ? 'ok' : row.percentage >= 60 ? 'warn' : 'bad'}`}
                    style={{ width: `${Math.min(100, row.percentage || 0)}%` }}
                  />
                  <span>{row.percentage != null ? `${row.percentage.toFixed(0)}%` : '—'}</span>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      {data ? (
        <div className="grid-2">
          <div className="card chart-card">
            <h3>{t(lang, 'appliedRevenue')}</h3>
            <ResponsiveContainer width="100%" height="85%">
              <BarChart
                data={data.revenueSeries}
                margin={chartValueAxisMargin(isRtl, 52)}
                barCategoryGap="28%"
              >
                <defs>
                  <linearGradient id="revenueColGrad" x1="0" y1="1" x2="0" y2="0">
                    <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.85} />
                    <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="month" tickFormatter={(m) => months[m]} tick={chartTick} axisLine={{ stroke: 'var(--border)' }} tickLine={false} />
                <YAxis {...chartValueYAxisProps(isRtl, axisNumber)} />
                <Tooltip
                  {...rechartsTooltipProps}
                  labelFormatter={(m) => months[m]}
                  formatter={(value) => [formatCurrency(lang, value, metadata), t(lang, 'appliedRevenue')]}
                />
                <Bar dataKey="revenue" fill="url(#revenueColGrad)" radius={[6, 6, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="card chart-card applied-status-card">
            <h3 style={{ marginTop: 0 }}>
              {t(lang, 'appliedOrders')} — {monthLabel}
            </h3>
            <p className="pending-breakdown-sub">{t(lang, 'appliedStatusHint')}</p>
            <AppliedStatusBreakdown
              items={data.monthStatusBreakdown}
              lang={lang}
              ordersLink={ordersLink}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
