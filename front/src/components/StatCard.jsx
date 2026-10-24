import { Link } from 'react-router-dom';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { t } from '../i18n/index.js';
import { formatSfaCount } from '../utils/format.js';

function MiniSpark({ values, tone }) {
  if (!values?.length) return null;
  const max = Math.max(...values, 1);
  return (
    <div className="stat-spark" aria-hidden>
      {values.map((v, i) => (
        <span
          key={i}
          className={`stat-spark-bar tone-${tone}`}
          style={{ height: `${Math.max(12, (v / max) * 100)}%` }}
        />
      ))}
    </div>
  );
}

function SfaChip({ lang, sfaCount, onViewSfas }) {
  if (sfaCount == null || !Number.isFinite(sfaCount)) return null;
  const label = formatSfaCount(lang, sfaCount);
  if (!onViewSfas) {
    return (
      <span className="stat-sfa-chip" dir="auto">
        {label}
      </span>
    );
  }
  return (
    <button
      type="button"
      className="stat-sfa-chip is-action"
      onClick={onViewSfas}
      title={t(lang, 'sfaChipHint')}
      aria-label={`${label} — ${t(lang, 'viewSfas')}`}
    >
      <span className="stat-sfa-chip-dot" aria-hidden />
      <span>{label}</span>
      <span className="stat-sfa-chip-cta">{t(lang, 'viewSfas')}</span>
    </button>
  );
}

export default function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  trend = null,
  tone = 'default',
  to,
  spark,
  lang,
  footnote,
  sfaCount = null,
  onViewSfas,
}) {
  const className = `stat-card tone-${tone}${to ? ' is-link' : ''}`;

  return (
    <div className={className}>
      <div className="stat-card-top">
        <div className={`stat-icon-wrap tone-${tone}`}>{Icon ? <Icon size={20} strokeWidth={2.2} /> : null}</div>
        {trend != null && Number.isFinite(trend) ? (
          <span className={`stat-trend ${trend >= 0 ? 'up' : 'down'}`} dir="ltr">
            {trend >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {Math.abs(trend).toFixed(1)}%
          </span>
        ) : null}
      </div>
      <div className="stat-label">{label}</div>
      {to ? (
        <Link to={to} className="stat-value-link">
          <div className="stat-value">{value}</div>
        </Link>
      ) : (
        <div className="stat-value">{value}</div>
      )}
      <SfaChip lang={lang} sfaCount={sfaCount} onViewSfas={onViewSfas} />
      {hint ? <div className="stat-hint">{hint}</div> : null}
      {footnote ? <div className="stat-footnote">{footnote}</div> : null}
      <MiniSpark values={spark} tone={tone} />
      {to ? (
        <Link to={to} className="stat-link-label">
          {t(lang, 'viewOrders')}
        </Link>
      ) : null}
    </div>
  );
}
