import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { api } from '../api/client.js';
import { t } from '../i18n/index.js';
import '../styles/app.css';

export default function LoginPage() {
  const { lang, user, passwordChangeRequired, refreshMe } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user && passwordChangeRequired) return <Navigate to="/change-password" replace />;
  if (user) return <Navigate to="/" replace />;

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api('/auth/login', { method: 'POST', body: { username, password } });
      await refreshMe();
      if (res.passwordChangeRequired) window.location.href = '/change-password';
      else window.location.href = '/';
    } catch (err) {
      setError(t(lang, `errors.${err.code}`) || err.code);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <form className="card login-card" onSubmit={onSubmit}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <img src="/logo.jpg" alt={t(lang, 'appName')} style={{ maxWidth: 220, width: '100%', height: 'auto' }} />
          <p style={{ color: 'var(--text-muted)', margin: '16px 0 0' }}>{t(lang, 'login')}</p>
        </div>
        <label>
          {t(lang, 'username')}
          <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
        </label>
        <label style={{ display: 'block', marginTop: 12 }}>
          {t(lang, 'password')}
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              className="input"
              type={show ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            <button type="button" className="btn ghost" onClick={() => setShow((s) => !s)}>
              {show ? 'Hide' : 'Show'}
            </button>
          </div>
        </label>
        {error ? <p className="error-text">{error}</p> : null}
        <button className="btn" style={{ width: '100%', marginTop: 16 }} disabled={loading}>
          {loading ? t(lang, 'loading') : t(lang, 'login')}
        </button>
      </form>
    </div>
  );
}
