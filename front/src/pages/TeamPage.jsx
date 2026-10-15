import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useApp } from '../context/AppContext.jsx';
import { t } from '../i18n/index.js';

export default function TeamPage() {
  const { lang } = useApp();
  const [data, setData] = useState(null);

  useEffect(() => {
    api('/team').then((res) => setData(res.data)).catch(() => setData({ members: [] }));
  }, []);

  if (!data) return <div>{t(lang, 'loading')}</div>;

  if (data.ictAggregate) {
    return (
      <div className="grid-4">
        <div className="card">
          <div className="stat-label">{t(lang, 'appliedOrders')}</div>
          <div className="stat-value">{data.ictAggregate.applied}</div>
        </div>
        <div className="card">
          <div className="stat-label">{t(lang, 'appliedRevenue')}</div>
          <div className="stat-value">{data.ictAggregate.revenue}</div>
        </div>
        <div className="card">
          <div className="stat-label">{t(lang, 'underActivationOrders')}</div>
          <div className="stat-value">{data.ictAggregate.underActivation}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="card table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>{lang === 'ar' ? 'العضو' : 'Member'}</th>
            <th>{t(lang, 'appliedOrders')}</th>
            <th>{t(lang, 'appliedRevenue')}</th>
          </tr>
        </thead>
        <tbody>
          {(data.members || []).map((m) => (
            <tr key={m.personId}>
              <td>{m.name}</td>
              <td>{m.completed}</td>
              <td>{m.revenue}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
