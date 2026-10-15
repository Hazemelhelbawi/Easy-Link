import { useEffect, useState } from 'react';
import { BarChart3, CheckCircle2, Clock3, XCircle } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { api } from '../api/client.js';
import { useApp } from '../context/AppContext.jsx';
import { t } from '../i18n/index.js';
import StatCard from '../components/StatCard.jsx';

const COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)'];

export default function OverviewPage() {
  const { lang, metadata } = useApp();
  const [data, setData] = useState(null);

  useEffect(() => {
    api('/overview').then((res) => setData(res.data));
  }, []);

  if (!data) return <div>{t(lang, 'loading')}</div>;

  const fmt = (n) => new Intl.NumberFormat(lang === 'ar' ? 'ar-SA' : 'en-US').format(n);
  const months = t(lang, 'months');

  return (
    <>
      <div className="grid-4">
        <StatCard label={t(lang, 'appliedOrders')} value={fmt(data.summary.applied)} icon={CheckCircle2} />
        <StatCard label={t(lang, 'underActivationOrders')} value={fmt(data.summary.underActivation)} icon={Clock3} />
        <StatCard label={t(lang, 'lostOrders')} value={fmt(data.summary.lost)} icon={XCircle} />
        <StatCard
          label={t(lang, 'appliedRevenue')}
          value={fmt(data.summary.appliedRevenue)}
          icon={BarChart3}
          hint={
            data.comparison.revenueGrowth != null
              ? `${data.comparison.revenueGrowth.toFixed(1)}%`
              : 'N/A'
          }
        />
      </div>
      <div className="grid-2">
        <div className="card" style={{ height: 320 }}>
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
        <div className="card" style={{ height: 320 }}>
          <h3>{t(lang, 'underActivation')}</h3>
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
        <div className="card">
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
      {metadata?.reportingYear ? (
        <p style={{ color: 'var(--text-muted)' }}>
          {lang === 'ar' ? 'سنة التقرير' : 'Reporting year'}: {metadata.reportingYear}
        </p>
      ) : null}
    </>
  );
}
