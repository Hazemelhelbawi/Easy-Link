import { useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { api } from '../api/client.js';
import { t } from '../i18n/index.js';
import '../styles/app.css';

export default function ChangePasswordPage() {
  const { lang, user, passwordChangeRequired, refreshMe } = useApp();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');

  const strength = useMemo(() => {
    let score = 0;
    if (newPassword.length >= 8) score += 1;
    if (/[A-Za-z]/.test(newPassword) && /\d/.test(newPassword)) score += 1;
    if (newPassword.length >= 12) score += 1;
    return score;
  }, [newPassword]);

  if (!user) return <Navigate to="/login" replace />;
  if (!passwordChangeRequired) return <Navigate to="/" replace />;

  async function submit(e) {
    e.preventDefault();
    if (newPassword !== confirm) {
      setError('Mismatch');
      return;
    }
    try {
      await api('/auth/change-password', {
        method: 'POST',
        body: { currentPassword, newPassword },
      });
      await refreshMe();
      window.location.href = '/';
    } catch (err) {
      setError(t(lang, `errors.${err.code}`) || err.code);
    }
  }

  return (
    <div className="login-page">
      <form className="card login-card" onSubmit={submit}>
        <h2>{t(lang, 'changePassword')}</h2>
        <label>
          {t(lang, 'password')}
          <input className="input" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
        </label>
        <label style={{ marginTop: 12, display: 'block' }}>
          {t(lang, 'newPassword')}
          <input className="input" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        </label>
        <div style={{ height: 6, background: 'var(--border)', borderRadius: 99, marginTop: 8 }}>
          <div
            style={{
              width: `${(strength / 3) * 100}%`,
              height: '100%',
              background: 'var(--primary)',
              borderRadius: 99,
            }}
          />
        </div>
        <label style={{ marginTop: 12, display: 'block' }}>
          {t(lang, 'confirmPassword')}
          <input className="input" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </label>
        {error ? <p className="error-text">{error}</p> : null}
        <button className="btn" style={{ width: '100%', marginTop: 16 }}>
          {t(lang, 'save')}
        </button>
      </form>
    </div>
  );
}
