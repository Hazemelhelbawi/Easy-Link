import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client.js';
import { useApp } from '../context/AppContext.jsx';
import { t } from '../i18n/index.js';
import { defaultReportingMonth } from '../utils/monthDefaults.js';

const tabs = [
  { key: 'applied', labelKey: 'applied' },
  { key: 'underActivation', labelKey: 'underActivation' },
  { key: 'lost', labelKey: 'lost' },
];

export default function OrdersPage() {
  const { lang, metadata } = useApp();
  const [status, setStatus] = useState('applied');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [options, setOptions] = useState({ companies: [], statusTexts: [], stages: [] });
  const [company, setCompany] = useState('');
  const [statusText, setStatusText] = useState('');
  const [stage, setStage] = useState('');

  const defaultMonth = useMemo(
    () => defaultReportingMonth(metadata?.reportingYear, metadata?.availableMonths || []),
    [metadata?.reportingYear, metadata?.availableMonths],
  );
  const [month, setMonth] = useState(null);
  const activeMonth = month ?? defaultMonth;

  useEffect(() => {
    if (month === null && defaultMonth) setMonth(defaultMonth);
  }, [defaultMonth, month]);

  useEffect(() => {
    const q = new URLSearchParams({
      status,
      page: String(page),
      pageSize: '20',
      search,
      month: String(activeMonth),
    });
    if (company) q.set('company', company);
    if (statusText) q.set('statusText', statusText);
    if (stage) q.set('stage', stage);
    api(`/orders?${q}`).then((res) => setData(res.data));
  }, [status, search, page, activeMonth, company, statusText, stage]);

  useEffect(() => {
    const q = new URLSearchParams({ status, month: String(activeMonth) });
    api(`/orders/options?${q}`).then((res) => setOptions(res.data));
  }, [status, activeMonth]);

  const months = t(lang, 'months');
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  function resetFilters() {
    setCompany('');
    setStatusText('');
    setStage('');
    setSearch('');
    setPage(1);
    setMonth(defaultMonth);
  }

  return (
    <>
      <div className="filters-bar">
        <div className="filters-row">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`btn ${status === tab.key ? '' : 'ghost'}`}
              onClick={() => {
                setStatus(tab.key);
                setPage(1);
                setStatusText('');
                setStage('');
              }}
            >
              {t(lang, tab.labelKey)}
            </button>
          ))}
        </div>
        <div className="filters-row">
          <label className="filter-field">
            <span>{t(lang, 'filterMonth')}</span>
            <select
              className="input"
              value={String(activeMonth)}
              onChange={(e) => {
                setMonth(Number(e.target.value));
                setPage(1);
              }}
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
          <label className="filter-field">
            <span>{t(lang, 'filterCompany')}</span>
            <select
              className="input"
              value={company}
              onChange={(e) => {
                setCompany(e.target.value);
                setPage(1);
              }}
            >
              <option value="">{t(lang, 'filterAll')}</option>
              {options.companies.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="filter-field">
            <span>{t(lang, 'filterStatus')}</span>
            <select
              className="input"
              value={statusText}
              onChange={(e) => {
                setStatusText(e.target.value);
                setPage(1);
              }}
            >
              <option value="">{t(lang, 'filterAll')}</option>
              {options.statusTexts.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="filter-field">
            <span>{t(lang, 'filterStage')}</span>
            <select
              className="input"
              value={stage}
              onChange={(e) => {
                setStage(e.target.value);
                setPage(1);
              }}
            >
              <option value="">{t(lang, 'filterAll')}</option>
              {options.stages.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="filter-field filter-field-grow">
            <span>{t(lang, 'search')}</span>
            <input
              className="input"
              placeholder={t(lang, 'searchOrdersHint')}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </label>
          <button className="btn ghost" type="button" onClick={resetFilters}>
            {t(lang, 'clearFilters')}
          </button>
        </div>
        {data ? (
          <p className="filters-meta">
            {t(lang, 'resultsCount')}: {data.total}
          </p>
        ) : null}
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
                <th>{t(lang, 'colCompany')}</th>
                <th>{t(lang, 'colOrder')}</th>
                <th>{t(lang, 'colAuthorizedName')}</th>
                <th>{t(lang, 'colAuthorizedMobile')}</th>
                <th>KAM</th>
                <th>MSISDN</th>
                <th>{t(lang, 'colPackage')}</th>
                <th>MRC</th>
                <th>{t(lang, 'appliedRevenue')}</th>
                <th>{t(lang, 'filterStatus')}</th>
                <th>{t(lang, 'filterStage')}</th>
                <th>{t(lang, 'filterMonth')}</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((row) => (
                <tr key={row.id}>
                  <td>{row.companyName}</td>
                  <td>{row.orderIdentifier}</td>
                  <td>{row.authorizedName || '—'}</td>
                  <td>{row.authorizedMobile || '—'}</td>
                  <td>{row.kamName}</td>
                  <td>{row.msisdn}</td>
                  <td>{row.packageName}</td>
                  <td>{row.mrc}</td>
                  <td>{row.revenue}</td>
                  <td>{row.statusText || '—'}</td>
                  <td>{row.stage || '—'}</td>
                  <td>{row.month || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {data ? (
        <div className="pagination-bar">
          <button className="btn ghost" type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            {t(lang, 'prev')}
          </button>
          <span>
            {page} / {totalPages}
          </span>
          <button
            className="btn ghost"
            type="button"
            disabled={page * data.pageSize >= data.total}
            onClick={() => setPage((p) => p + 1)}
          >
            {t(lang, 'next')}
          </button>
        </div>
      ) : null}
    </>
  );
}
