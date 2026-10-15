import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Trophy, Target, Users, ClipboardList, Settings, LogOut } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { t } from '../i18n/index.js';
import { api } from '../api/client.js';
import '../styles/app.css';

export default function AppShell() {
  const { lang, setLang, theme, setTheme, user, role, metadata, refreshMe } = useApp();

  async function logout() {
    await api('/auth/logout', { method: 'POST' });
    await refreshMe();
    window.location.href = '/login';
  }

  const appName = metadata?.applicationName || t(lang, 'appName');

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <img src="/logo.jpg" alt={appName} />
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <NavLink className="nav-link" to="/">
            <LayoutDashboard size={18} /> {t(lang, 'overview')}
          </NavLink>
          <NavLink className="nav-link" to="/achievements">
            <Target size={18} /> {t(lang, 'achievements')}
          </NavLink>
          <NavLink className="nav-link" to="/leaderboard">
            <Trophy size={18} /> {t(lang, 'leaderboard')}
          </NavLink>
          <NavLink className="nav-link" to="/orders">
            <ClipboardList size={18} /> {t(lang, 'orders')}
          </NavLink>
          {role !== 'employee' && (
            <NavLink className="nav-link" to="/team">
              <Users size={18} /> {t(lang, 'team')}
            </NavLink>
          )}
          {role === 'admin' && (
            <NavLink className="nav-link" to="/admin">
              <Settings size={18} /> {t(lang, 'admin')}
            </NavLink>
          )}
        </nav>
      </aside>
      <div className="main-area">
        <header className="topbar">
          <div>
            <strong>{user?.username}</strong>{' '}
            <span style={{ color: 'var(--text-muted)' }}>{t(lang, `roles.${role}`)}</span>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select className="input" style={{ width: 110 }} value={lang} onChange={(e) => setLang(e.target.value)}>
              <option value="ar">العربية</option>
              <option value="en">English</option>
            </select>
            <select
              className="input"
              style={{ width: 120 }}
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
            >
              <option value="system">System</option>
              <option value="light">{t(lang, 'themeLight')}</option>
              <option value="dark">{t(lang, 'themeDark')}</option>
            </select>
            <button className="btn ghost" onClick={logout} type="button">
              <LogOut size={16} style={{ verticalAlign: 'middle' }} /> {t(lang, 'logout')}
            </button>
          </div>
        </header>
        <main className="page">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
