import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client.js';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [lang, setLangState] = useState(() => localStorage.getItem('easylink-lang') || 'ar');
  const [theme, setThemeState] = useState(() => localStorage.getItem('easylink-theme') || 'system');
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [passwordChangeRequired, setPasswordChangeRequired] = useState(false);
  const [metadata, setMetadata] = useState(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    const resolved =
      theme === 'system'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
        : theme;
    document.documentElement.dataset.theme = resolved;
    localStorage.setItem('easylink-theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    localStorage.setItem('easylink-lang', lang);
  }, [lang]);

  async function refreshMe() {
    try {
      const me = await api('/auth/me');
      setUser(me.user);
      setRole(me.role);
      setPasswordChangeRequired(!!me.passwordChangeRequired);
      if (!me.passwordChangeRequired) {
        const meta = await api('/metadata');
        setMetadata(meta.data);
      }
    } catch {
      setUser(null);
      setRole(null);
      setPasswordChangeRequired(false);
    } finally {
      setBooting(false);
    }
  }

  useEffect(() => {
    refreshMe();
  }, []);

  const value = useMemo(
    () => ({
      lang,
      setLang: setLangState,
      theme,
      setTheme: setThemeState,
      user,
      role,
      passwordChangeRequired,
      metadata,
      booting,
      setUser,
      setRole,
      setPasswordChangeRequired,
      refreshMe,
      setMetadata,
    }),
    [lang, theme, user, role, passwordChangeRequired, metadata, booting],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('AppContext missing');
  return ctx;
}
