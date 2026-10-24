import { Download, X } from 'lucide-react';
import { t } from '../i18n/index.js';
import { formatNumber, formatSfaCount } from '../utils/format.js';

export default function SfaBreakdownModal({
  open,
  lang,
  title,
  rows = [],
  onClose,
  onDownload,
  downloading = false,
}) {
  if (!open) return null;

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sfa-breakdown-title"
      onClick={onClose}
    >
      <div className="modal-card modal-card-wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 id="sfa-breakdown-title" style={{ margin: 0 }}>
            {title}
          </h3>
          <button type="button" className="icon-btn" onClick={onClose} aria-label={t(lang, 'close')}>
            <X size={18} />
          </button>
        </div>
        <p className="sfa-modal-sub">
          {formatSfaCount(lang, rows.length)} · {t(lang, 'sortedByOrders')}
        </p>
        <div className="modal-actions" style={{ marginBottom: 12 }}>
          <button
            type="button"
            className="btn btn-sm"
            onClick={onDownload}
            disabled={downloading || !rows.length}
          >
            <Download size={16} /> {t(lang, 'downloadExcel')}
          </button>
        </div>
        <div className="table-wrap sfa-table-wrap">
          {rows.length ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t(lang, 'colSfa')}</th>
                  <th>{t(lang, 'colOrders')}</th>
                  <th>{t(lang, 'applied')}</th>
                  <th>{t(lang, 'underActivation')}</th>
                  <th>{t(lang, 'lost')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.sfa}>
                    <td dir="ltr">{row.sfa}</td>
                    <td dir="ltr">{formatNumber(lang, row.orders)}</td>
                    <td dir="ltr">{formatNumber(lang, row.applied || 0)}</td>
                    <td dir="ltr">{formatNumber(lang, row.underActivation || 0)}</td>
                    <td dir="ltr">{formatNumber(lang, row.lost || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>{t(lang, 'empty')}</p>
          )}
        </div>
        <div className="modal-actions" style={{ marginTop: 16 }}>
          <button type="button" className="btn ghost" onClick={onClose}>
            {t(lang, 'close')}
          </button>
        </div>
      </div>
    </div>
  );
}
