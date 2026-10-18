import { Link } from 'react-router-dom';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { t } from '../i18n/index.js';

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
}) {
  const inner = (
    <>
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
      <div className="stat-value">{value}</div>
      {hint ? <div className="stat-hint">{hint}</div> : null}
      {footnote ? <div className="stat-footnote">{footnote}</div> : null}
      <MiniSpark values={spark} tone={tone} />
    </>
  );

  const className = `stat-card tone-${tone}${to ? ' is-link' : ''}`;

  if (to) {
    return (
      <Link to={to} className={className}>
        {inner}
        <span className="stat-link-label">{t(lang, 'viewOrders')}</span>
      </Link>
    );
  }

  return <div className={className}>{inner}</div>;
}
