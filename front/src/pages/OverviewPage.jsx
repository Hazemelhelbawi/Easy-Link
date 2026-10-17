import { useEffect, useMemo, useState } from 'react';
import { BarChart3, CheckCircle2, Clock3, XCircle } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { api } from '../api/client.js';
import { useApp } from '../context/AppContext.jsx';
import { t } from '../i18n/index.js';
import StatCard from '../components/StatCard.jsx';
import { defaultReportingMonth } from '../utils/monthDefaults.js';

const COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)'];

export default function OverviewPage() {
  const { lang, metadata } = useApp();
  const defaultMonth = useMemo(
    () => defaultReportingMonth(metadata?.reportingYear, metadata?.availableMonths || []),
    [metadata?.reportingYear, metadata?.availableMonths],
  );
  const [month, setMonth] = useState(null);
  const activeMonth = month ?? defaultMonth;
  const [data, setData] = useState(null);

  useEffect(() => {
    if (month === null && defaultMonth) setMonth(defaultMonth);
  }, [defaultMonth, month]);

  useEffect(() => {
    if (!activeMonth) return;
    const q = new URLSearchParams({ month: String(activeMonth) });
    api(`/overview?${q}`).then((res) => setData(res.data));
  }, [activeMonth]);

  if (!data) return <div>{t(lang, 'loading')}</div>;

  const fmt = (n) => new Intl.NumberFormat(lang === 'ar' ? 'ar-SA' : 'en-US').format(n);
  const months = t(lang, 'months');
  const monthLabel = activeMonth ? months[activeMonth] : '';

  return (
    <>
      <div className="overview-header">
        <div>
          <h2 style={{ margin: 0 }}>{t(lang, 'overview')}</h2>
          <p style={{ margin: '6px 0 0', color: 'var(--text-muted)' }}>
            {t(lang, 'monthScope')}: {monthLabel} {data.reportingYear}
          </p>
        </div>
        <label className="filter-field" style={{ minWidth: 180 }}>
          <span>{t(lang, 'filterMonth')}</span>
          <select
            className="input"
            value={String(activeMonth)}
            onChange={(e) => setMonth(Number(e.target.value))}
          >
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

      <div className="grid-4">
        <StatCard label={t(lang, 'appliedOrders')} value={fmt(data.summary.applied)} icon={CheckCircle2} />
        <StatCard
          label={t(lang, 'underActivationOrders')}
          value={fmt(data.summary.underActivation)}
          icon={Clock3}
        />
        <StatCard label={t(lang, 'lostOrders')} value={fmt(data.summary.lost)} icon={XCircle} />
        <StatCard
          label={t(lang, 'appliedRevenue')}
          value={fmt(data.summary.appliedRevenue)}
          icon={BarChart3}
          hint={
            data.comparison.revenueGrowth != null
              ? `${data.comparison.revenueGrowth.toFixed(1)}% ${t(lang, 'vsPrevMonth')}`
              : 'N/A'
          }
        />
      </div>

      {data.monthStatusBreakdown?.length ? (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>
            {t(lang, 'monthReportStatus')} — {monthLabel}
          </h3>
          <div className="status-chips">
            {data.monthStatusBreakdown.map((item) => (
              <div key={item.statusText} className="status-chip">
                <span className="status-chip-label">{item.statusText}</span>
                <strong>{fmt(item.count)}</strong>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="grid-2">
        <div className="card chart-card">
          <h3>{t(lang, 'appliedRevenue')}</h3>
          <ResponsiveContainer width="100%" height="85%">
            <LineChart data={data.revenueSeries}>
              <XAxis dataKey="month" tickFormatter={(m) => months[m]} />
              <YAxis />
              <Tooltip labelFormatter={(m) => months[m]} />
              <Line type="monotone" dataKey="revenue" stroke="var(--chart-1)" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="card chart-card">
          <h3>
            {t(lang, 'underActivation')} — {monthLabel}
          </h3>
          <ResponsiveContainer width="100%" height="85%">
            <PieChart>
              <Pie data={data.pendingByStage} dataKey="count" nameKey="stage" innerRadius={50} outerRadius={90}>
                {data.pendingByStage.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      {data.teamPerformance?.length ? (
        <div className="card chart-card">
          <h3>{t(lang, 'team')}</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.teamPerformance}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="revenue" fill="var(--chart-2)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : null}
    </>
  );
}
