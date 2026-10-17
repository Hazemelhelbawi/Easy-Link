import { useState } from 'react';
import { Copy, X } from 'lucide-react';
import { t } from '../i18n/index.js';

export default function TempPasswordModal({ open, password, lang, onClose }) {
  const [copied, setCopied] = useState(false);
  if (!open || !password) return null;

  async function copy() {
    await navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="temp-pw-title">
      <div className="modal-card">
        <div className="modal-header">
          <h3 id="temp-pw-title">{t(lang, 'tempPasswordTitle')}</h3>
          <button type="button" className="icon-btn" onClick={onClose} aria-label={t(lang, 'cancel')}>
            <X size={18} />
          </button>
        </div>
        <p className="modal-warning">{t(lang, 'tempPasswordWarning')}</p>
        <div className="temp-password-box" aria-live="polite">
          {password}
        </div>
        <div className="modal-actions">
          <button type="button" className="btn" onClick={copy}>
            <Copy size={16} /> {copied ? t(lang, 'copied') : t(lang, 'copy')}
          </button>
          <button type="button" className="btn ghost" onClick={onClose}>
            {t(lang, 'close')}
          </button>
        </div>
      </div>
    </div>
  );
}
