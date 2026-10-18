import { FileText, CalendarClock } from 'lucide-react';
import { formatDateTime } from '../utils/format.js';
import { t } from '../i18n/index.js';

export default function ReportMetaBanner({ report, lang }) {
  if (!report) return null;

  const status = String(report.reportStatus || 'active').toLowerCase();
  const statusClass = status === 'active' ? 'ok' : 'muted';

  return (
    <div className="report-meta-banner">
      <div className="report-meta-icon">
        <FileText size={22} strokeWidth={2} />
      </div>
      <div className="report-meta-body">
        <div className="report-meta-row">
          <span className="stat-label">{t(lang, 'currentReport')}</span>
          <span className={`report-status-pill ${statusClass}`}>{report.reportStatus || 'active'}</span>
        </div>
        <div className="report-meta-id" dir="ltr">
          {report.reportNumber || '—'}
        </div>
        <div className="report-meta-time">
          <CalendarClock size={14} />
          <span>{formatDateTime(lang, report.uploadedAt)}</span>
        </div>
      </div>
    </div>
  );
}
