import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, CheckCircle2, Clock3, XCircle, FileText } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { api } from '../api/client.js';
import { useApp } from '../context/AppContext.jsx';
import { t } from '../i18n/index.js';
import StatCard from '../components/StatCard.jsx';
import { OverviewSkeleton } from '../components/Skeleton.jsx';
import { defaultReportingMonth } from '../utils/monthDefaults.js';
import { formatCurrency, formatDateTime, formatNumber } from '../utils/format.js';

const COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)'];

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

      {data?.report ? (
        <div className="card report-meta-card">
          <FileText size={20} color="var(--accent)" />
          <div>
            <div className="stat-label">{t(lang, 'currentReport')}</div>
            <strong>{data.report.reportNumber || '—'}</strong>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              {data.report.reportStatus} · {formatDateTime(lang, data.report.uploadedAt)}
            </div>
          </div>
        </div>
      ) : null}

      {data ? (
        <div className="grid-4">
          <StatCard label={t(lang, 'appliedOrders')} value={formatNumber(lang, data.summary.applied)} icon={CheckCircle2} />
          <StatCard
            label={t(lang, 'underActivationOrders')}
            value={formatNumber(lang, data.summary.underActivation)}
            icon={Clock3}
          />
          <Link to={ordersLink({ status: 'lost' })} className="card-link">
            <StatCard label={t(lang, 'lostOrders')} value={formatNumber(lang, data.lostSummary?.count || 0)} icon={XCircle} />
          </Link>
          <StatCard
            label={t(lang, 'appliedRevenue')}
            value={formatCurrency(lang, data.summary.appliedRevenue, metadata)}
            icon={BarChart3}
            hint={
              data.comparison.revenueGrowth != null
                ? `${data.comparison.revenueGrowth.toFixed(1)}% ${t(lang, 'vsPrevMonth')}`
                : 'N/A'
            }
          />
        </div>
      ) : null}

      {data?.lostSummary ? (
        <Link to={ordersLink({ status: 'lost' })} className="card card-link-inline">
          <strong>{t(lang, 'lostRevenueMonth')}</strong>: {formatCurrency(lang, data.lostSummary.revenue, metadata)}
        </Link>
      ) : null}

      {data?.pendingSummary ? (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>
            {t(lang, 'pendingBreakdown')} ({formatNumber(lang, data.pendingSummary.total)})
          </h3>
          <div className="grid-4 compact-cards">
            {data.pendingSummary.byStage.slice(0, 6).map((item) => (
              <Link
                key={item.stage}
                to={ordersLink({ status: 'underActivation', stages: item.stage })}
                className="mini-card"
              >
                <span>{item.stage.trim()}</span>
                <strong>{formatNumber(lang, item.count)}</strong>
              </Link>
            ))}
          </div>
          <div className="chart-card" style={{ height: 260 }}>
            {data.pendingSummary.byStage.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.pendingSummary.byStage} layout="vertical">
                  <XAxis type="number" tick={chartTick} />
                  <YAxis type="category" dataKey="stage" width={140} tick={chartTick} />
                  <Tooltip />
                  <Bar dataKey="count" fill="var(--chart-1)" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="empty-state">{t(lang, 'empty')}</p>
            )}
          </div>
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
              <LineChart data={data.revenueSeries}>
                <XAxis dataKey="month" tickFormatter={(m) => months[m]} tick={chartTick} />
                <YAxis tick={chartTick} />
                <Tooltip labelFormatter={(m) => months[m]} />
                <Line type="monotone" dataKey="revenue" stroke="var(--chart-1)" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="card chart-card">
            <h3>
              {t(lang, 'underActivation')} — {monthLabel}
            </h3>
            {data.pendingByStage?.length ? (
              <ResponsiveContainer width="100%" height="85%">
                <BarChart data={data.pendingByStage}>
                  <XAxis dataKey="stage" tick={chartTick} interval={0} angle={-20} textAnchor="end" height={70} />
                  <YAxis tick={chartTick} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                    {data.pendingByStage.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="empty-state">{t(lang, 'emptyPendingChart')}</p>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
