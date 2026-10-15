import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useApp } from '../context/AppContext.jsx';
import { t } from '../i18n/index.js';

export default function AdminPage() {
  const { lang, refreshMe } = useApp();
  const [peopleData, setPeopleData] = useState(null);
  const [config, setConfig] = useState(null);
  const [unassigned, setUnassigned] = useState([]);
  const [tempModal, setTempModal] = useState(null);
  const [uploadInfo, setUploadInfo] = useState('');

  async function loadAll() {
    const [p, c, u] = await Promise.all([
      api('/admin/people'),
      api('/admin/config'),
      api('/admin/unassigned-names'),
    ]);
    setPeopleData(p.data);
    setConfig(c.data);
    setUnassigned(u.data);
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function onUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!window.confirm(lang === 'ar' ? 'استبدال التقرير الحالي؟' : 'Replace active report?')) return;
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await api('/admin/upload', { method: 'POST', formData: fd });
      setUploadInfo(JSON.stringify(res.data));
      await refreshMe();
      await loadAll();
    } catch (err) {
      setUploadInfo(err.code || 'UPLOAD_FAILED');
    }
  }

  async function activate(personId) {
    const res = await api(`/admin/people/${personId}/activate`, { method: 'POST' });
    setTempModal(res.data.tempPassword);
    await loadAll();
  }

  async function saveConfig() {
    await api('/admin/config', { method: 'PUT', body: config });
    await loadAll();
  }

  if (!peopleData || !config) return <div>{t(lang, 'loading')}</div>;

  return (
    <>
      <div className="card">
        <h3>{t(lang, 'upload')}</h3>
        <input type="file" accept=".xlsx" onChange={onUpload} />
        {uploadInfo ? <pre style={{ whiteSpace: 'pre-wrap' }}>{uploadInfo}</pre> : null}
      </div>

      <div className="card table-wrap">
        <h3>{lang === 'ar' ? 'المستخدمون' : 'Users'}</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>{lang === 'ar' ? 'الاسم' : 'Name'}</th>
              <th>{lang === 'ar' ? 'الدور' : 'Role'}</th>
              <th>{lang === 'ar' ? 'الحالة' : 'Status'}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {peopleData.people.map((p) => {
              const user = peopleData.users.find((u) => u.personId === p.id);
              return (
                <tr key={p.id}>
                  <td>{p.displayName}</td>
                  <td>{p.orgRole}</td>
                  <td>{user?.active ? 'Active' : 'Inactive'}</td>
                  <td>
                    <button className="btn ghost" type="button" onClick={() => activate(p.id)}>
                      {lang === 'ar' ? 'تفعيل' : 'Activate'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3>{lang === 'ar' ? 'أسماء Excel غير المطابقة' : 'Unassigned Excel names'}</h3>
        <ul>
          {unassigned.map((u) => (
            <li key={u.name}>
              {u.name}
              {u.suggested?.length
                ? ` — ${u.suggested.map((s) => s.displayName).join(', ')}`
                : ''}
            </li>
          ))}
        </ul>
      </div>

      <div className="card">
        <h3>{lang === 'ar' ? 'الإعدادات' : 'Configuration'}</h3>
        <label>
          {lang === 'ar' ? 'سنة التقرير' : 'Reporting year'}
          <input
            className="input"
            type="number"
            value={config.reportingYear}
            onChange={(e) => setConfig({ ...config, reportingYear: Number(e.target.value) })}
          />
        </label>
        <label style={{ display: 'block', marginTop: 12 }}>
          {lang === 'ar' ? 'اسم التطبيق' : 'Application name'}
          <input
            className="input"
            value={config.applicationName}
            onChange={(e) => setConfig({ ...config, applicationName: e.target.value })}
          />
        </label>
        <label style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center' }}>
          <input
            type="checkbox"
            checked={!!config.leaderboardShowRevenue}
            onChange={(e) => setConfig({ ...config, leaderboardShowRevenue: e.target.checked })}
          />
          {lang === 'ar' ? 'إظهار الإيراد في المنافسة' : 'Show revenue on leaderboard'}
        </label>
        <button className="btn" style={{ marginTop: 12 }} type="button" onClick={saveConfig}>
          {t(lang, 'save')}
        </button>
      </div>

      {tempModal ? (
        <div className="card" style={{ borderColor: 'var(--warning)' }}>
          <strong>{lang === 'ar' ? 'كلمة مرور مؤقتة (مرة واحدة)' : 'One-time temporary password'}</strong>
          <p>{tempModal}</p>
          <button className="btn" type="button" onClick={() => navigator.clipboard.writeText(tempModal)}>
            Copy
          </button>
          <button className="btn ghost" type="button" onClick={() => setTempModal(null)}>
            {t(lang, 'cancel')}
          </button>
        </div>
      ) : null}
    </>
  );
}
