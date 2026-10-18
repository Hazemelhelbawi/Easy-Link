import { useEffect, useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import {
  chartValueAxisMargin,
  chartValueYAxisProps,
  rechartsTooltipProps,
} from '../components/rechartsTheme.jsx';
import { formatChartAxisNumber } from '../utils/format.js';
import { api } from '../api/client.js';
import { useApp } from '../context/AppContext.jsx';
import { t } from '../i18n/index.js';

export default function AchievementsPage() {
  const { lang } = useApp();
  const [data, setData] = useState(null);

  useEffect(() => {
    api('/achievements').then((res) => setData(res.data));
  }, []);

  if (!data) return <div>{t(lang, 'loading')}</div>;
  const months = t(lang, 'months');
  const fmt = (n) => new Intl.NumberFormat(lang === 'ar' ? 'ar-SA' : 'en-US').format(n);
  const isRtl = lang === 'ar';
  const axisNumber = (v) => formatChartAxisNumber(lang, v);
  const chartTick = { fill: 'var(--text-muted)', fontSize: 12 };

  return (
    <>
      <div className="grid-4">
        <div className="card">
          <div className="stat-label">{lang === 'ar' ? 'أفضل شهر' : 'Best month'}</div>
          <div className="stat-value">{data.bestMonth ? months[data.bestMonth] : '—'}</div>
        </div>
        <div className="card">
          <div className="stat-label">{lang === 'ar' ? 'آخر شهر' : 'Latest month'}</div>
          <div className="stat-value">{data.latestMonth ? months[data.latestMonth] : '—'}</div>
        </div>
        <div className="card">
          <div className="stat-label">{t(lang, 'appliedRevenue')}</div>
          <div className="stat-value">{fmt(data.comparison.current?.revenue || 0)}</div>
        </div>
        <div className="card">
          <div className="stat-label">{t(lang, 'appliedOrders')}</div>
          <div className="stat-value">{fmt(data.comparison.current?.completed || 0)}</div>
        </div>
      </div>
      <div className="card" style={{ height: 340 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data.monthly} margin={chartValueAxisMargin(isRtl)}>
            <XAxis dataKey="month" tickFormatter={(m) => months[m]} tick={chartTick} axisLine={{ stroke: 'var(--border)' }} tickLine={false} />
            <YAxis {...chartValueYAxisProps(isRtl, axisNumber)} />
            <Tooltip {...rechartsTooltipProps} labelFormatter={(m) => months[m]} />
            <Area type="monotone" dataKey="revenue" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.15} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="card table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>{lang === 'ar' ? 'الشهر' : 'Month'}</th>
              <th>{t(lang, 'appliedOrders')}</th>
              <th>{t(lang, 'appliedRevenue')}</th>
            </tr>
          </thead>
          <tbody>
            {data.monthly.map((row) => (
              <tr key={row.month} style={row.month === data.bestMonth ? { background: 'color-mix(in srgb, var(--accent) 12%, transparent)' } : undefined}>
                <td>{months[row.month]}</td>
                <td>{fmt(row.completed)}</td>
                <td>{fmt(row.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
