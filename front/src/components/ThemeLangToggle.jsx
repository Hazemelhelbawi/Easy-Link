import { Languages, Moon, Sun, Monitor } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { t } from '../i18n/index.js';

export default function ThemeLangToggle() {
  const { lang, setLang, theme, setTheme } = useApp();

  return (
    <div className="pref-toggles">
      <div className="toggle-group" role="group" aria-label={t(lang, 'language')}>
        <Languages size={16} className="toggle-icon" aria-hidden />
        <button
          type="button"
          className={`toggle-btn ${lang === 'ar' ? 'active' : ''}`}
          onClick={() => setLang('ar')}
        >
          AR
        </button>
        <button
          type="button"
          className={`toggle-btn ${lang === 'en' ? 'active' : ''}`}
          onClick={() => setLang('en')}
        >
          EN
        </button>
      </div>
      <div className="toggle-group" role="group" aria-label={t(lang, 'theme')}>
        <button
          type="button"
          className={`toggle-btn icon-only ${theme === 'light' ? 'active' : ''}`}
          title={t(lang, 'themeLight')}
          onClick={() => setTheme('light')}
        >
          <Sun size={16} />
        </button>
        <button
          type="button"
          className={`toggle-btn icon-only ${theme === 'dark' ? 'active' : ''}`}
          title={t(lang, 'themeDark')}
          onClick={() => setTheme('dark')}
        >
          <Moon size={16} />
        </button>
        <button
          type="button"
          className={`toggle-btn icon-only ${theme === 'system' ? 'active' : ''}`}
          title={t(lang, 'themeSystem')}
          onClick={() => setTheme('system')}
        >
          <Monitor size={16} />
        </button>
      </div>
    </div>
  );
}
