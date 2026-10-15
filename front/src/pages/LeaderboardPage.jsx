import { useEffect, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { api } from '../api/client.js';
import { useApp } from '../context/AppContext.jsx';
import { t } from '../i18n/index.js';

export default function LeaderboardPage() {
  const { lang, user, metadata } = useApp();
  const [month, setMonth] = useState('all');
  const [group, setGroup] = useState('all');
  const [data, setData] = useState(null);

  useEffect(() => {
    const q = new URLSearchParams({ month, group });
    api(`/leaderboard?${q}`).then((res) => setData(res.data));
  }, [month, group]);

  if (!data) return <div>{t(lang, 'loading')}</div>;
  const fmt = (n) => new Intl.NumberFormat(lang === 'ar' ? 'ar-SA' : 'en-US').format(n);
  const top3 = data.entries.slice(0, 3);
  const rest = data.entries.slice(0, 10);

  return (
    <>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <select className="input" style={{ width: 180 }} value={month} onChange={(e) => setMonth(e.target.value)}>
          <option value="all">{lang === 'ar' ? 'كل الأشهر' : 'All months'}</option>
          {(metadata?.availableMonths || []).map((m) => (
            <option key={m} value={m}>
              {t(lang, 'months')[m]}
            </option>
          ))}
        </select>
        <select className="input" style={{ width: 180 }} value={group} onChange={(e) => setGroup(e.target.value)}>
          <option value="all">{lang === 'ar' ? 'الكل' : 'All'}</option>
          <option value="outsource">{lang === 'ar' ? 'ال outsourcing' : 'Outsource'}</option>
          <option value="independent">{lang === 'ar' ? 'مستقل' : 'Independent'}</option>
          <option value="ict">ICT</option>
        </select>
      </div>
      {top3.length ? (
        <div className="podium">
          {top3.map((e) => (
            <div
              key={e.personId}
              className="podium-item"
              style={e.personId === user?.personId ? { borderColor: 'var(--primary)' } : undefined}
            >
              <div style={{ fontSize: '2rem', fontWeight: 800 }}>#{e.rank}</div>
              <div>{e.name}</div>
              <div style={{ color: 'var(--text-muted)' }}>{fmt(e.completed)}</div>
              {data.showRevenue ? <div>{fmt(e.revenue)}</div> : null}
            </div>
          ))}
        </div>
      ) : (
        <div className="card">{t(lang, 'empty')}</div>
      )}
      <div className="card table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>{lang === 'ar' ? 'الموظف' : 'Employee'}</th>
              <th>{t(lang, 'appliedOrders')}</th>
              {data.showRevenue ? <th>{t(lang, 'appliedRevenue')}</th> : null}
            </tr>
          </thead>
          <tbody>
            {rest.map((e) => (
              <tr key={e.personId} style={e.personId === user?.personId ? { fontWeight: 700 } : undefined}>
                <td>{e.rank}</td>
                <td>{e.name}</td>
                <td>{fmt(e.completed)}</td>
                {data.showRevenue ? <td>{fmt(e.revenue)}</td> : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="card" style={{ height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rest} layout="vertical">
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="name" width={120} />
            <Tooltip />
            <Bar dataKey={data.showRevenue ? 'revenue' : 'completed'} fill="var(--chart-3)" radius={[0, 8, 8, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}
