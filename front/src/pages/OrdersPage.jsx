import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useApp } from '../context/AppContext.jsx';
import { t } from '../i18n/index.js';

const tabs = [
  { key: 'applied', labelKey: 'applied' },
  { key: 'underActivation', labelKey: 'underActivation' },
  { key: 'lost', labelKey: 'lost' },
];

export default function OrdersPage() {
  const { lang } = useApp();
  const [status, setStatus] = useState('applied');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);

  useEffect(() => {
    const q = new URLSearchParams({ status, page: String(page), pageSize: '20', search });
    api(`/orders?${q}`).then((res) => setData(res.data));
  }, [status, search, page]);

  return (
    <>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`btn ${status === tab.key ? '' : 'ghost'}`}
            onClick={() => {
              setStatus(tab.key);
              setPage(1);
            }}
          >
            {t(lang, tab.labelKey)}
          </button>
        ))}
        <input
          className="input"
          style={{ maxWidth: 280 }}
          placeholder={t(lang, 'search')}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>
      <div className="card table-wrap">
        {!data ? (
          t(lang, 'loading')
        ) : data.items.length === 0 ? (
          t(lang, 'empty')
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>{lang === 'ar' ? 'الشركة' : 'Company'}</th>
                <th>{lang === 'ar' ? 'الطلب' : 'Order'}</th>
                <th>KAM</th>
                <th>MSISDN</th>
                <th>{lang === 'ar' ? 'الباقة' : 'Package'}</th>
                <th>MRC</th>
                <th>{t(lang, 'appliedRevenue')}</th>
                <th>{lang === 'ar' ? 'الحالة' : 'Status'}</th>
                <th>{lang === 'ar' ? 'المرحلة' : 'Stage'}</th>
                <th>{lang === 'ar' ? 'الشهر' : 'Month'}</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((row) => (
                <tr key={row.id}>
                  <td>{row.companyName}</td>
                  <td>{row.orderIdentifier}</td>
                  <td>{row.kamName}</td>
                  <td>{row.msisdn}</td>
                  <td>{row.packageName}</td>
                  <td>{row.mrc}</td>
                  <td>{row.revenue}</td>
                  <td>{row.statusText}</td>
                  <td>{row.stage}</td>
                  <td>{row.month || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {data ? (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="btn ghost" type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Prev
          </button>
          <span>
            {page} / {Math.max(1, Math.ceil(data.total / data.pageSize))}
          </span>
          <button
            className="btn ghost"
            type="button"
            disabled={page * data.pageSize >= data.total}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      ) : null}
    </>
  );
}
