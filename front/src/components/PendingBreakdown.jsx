import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { formatNumber } from '../utils/format.js';
import { t } from '../i18n/index.js';

const SLICE_COLORS = [
  'var(--chart-1)',
  'var(--chart-4)',
  'var(--chart-3)',
  'var(--success)',
  'var(--primary)',
  'var(--primary-hover)',
  'var(--warning)',
  'var(--accent)',
];

function DonutTooltip({ active, payload, lang, total }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  const pct = total ? ((row.count / total) * 100).toFixed(1) : '0';
  return (
    <div className="chart-tooltip">
      <strong>{row.stage}</strong>
      <div dir="ltr">
        {formatNumber(lang, row.count)} · {pct}%
      </div>
    </div>
  );
}

/**
 * @param {{ total: number, byStage: { stage: string, count: number }[] }} summary
 */
export default function PendingBreakdown({ summary, lang, ordersLink }) {
  const navigate = useNavigate();

  const rows = useMemo(
    () =>
      (summary?.byStage || [])
        .map((row) => ({
          stage: String(row.stage || '').trim() || '—',
          count: Number(row.count) || 0,
        }))
        .filter((row) => row.count > 0)
        .sort((a, b) => b.count - a.count),
    [summary?.byStage],
  );

  const total = Number(summary?.total) || rows.reduce((s, r) => s + r.count, 0);
  const max = rows.reduce((m, i) => Math.max(m, i.count), 1);

  if (!rows.length) {
    return <p className="empty-state">{t(lang, 'emptyPendingChart')}</p>;
  }

  function openOrders(stage) {
    navigate(
      ordersLink({
        status: 'underActivation',
        stages: stage,
      }),
    );
  }

  return (
    <div className="pending-chart-panel">
      <div className="pending-donut-block">
        <div className="pending-donut-plot">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={rows}
                dataKey="count"
                nameKey="stage"
                cx="50%"
                cy="50%"
                innerRadius="62%"
                outerRadius="88%"
                paddingAngle={2}
                stroke="var(--surface)"
                strokeWidth={2}
                onClick={(_, index) => openOrders(rows[index]?.stage)}
                cursor="pointer"
              >
                {rows.map((row, index) => (
                  <Cell key={row.stage} fill={SLICE_COLORS[index % SLICE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<DonutTooltip lang={lang} total={total} />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="pending-donut-center" aria-hidden>
            <span className="pending-donut-center-value" dir="ltr">
              {formatNumber(lang, total)}
            </span>
            <span className="pending-donut-center-label">{t(lang, 'pendingBreakdown')}</span>
          </div>
        </div>
        <ul className="pending-donut-legend">
          {rows.slice(0, 6).map((row, index) => (
            <li key={row.stage}>
              <span className="pending-legend-swatch" style={{ background: SLICE_COLORS[index % SLICE_COLORS.length] }} />
              <span className="pending-legend-name">{row.stage}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="pending-rank-chart" role="list">
        {rows.map((item, index) => {
          const share = total ? (item.count / total) * 100 : 0;
          const barWidth = Math.max(6, (item.count / max) * 100);

          return (
            <button
              type="button"
              key={item.stage}
              className="pending-rank-row"
              role="listitem"
              onClick={() => openOrders(item.stage)}
            >
              <div className="pending-rank-head">
                <span className="pending-rank-index">{index + 1}</span>
                <span className="pending-rank-title">{item.stage}</span>
                <span className="pending-rank-meta" dir="ltr">
                  <span className="pending-rank-count">{formatNumber(lang, item.count)}</span>
                  <span className="pending-rank-share">
                    {share.toFixed(share >= 10 ? 0 : 1)}%
                  </span>
                </span>
              </div>
              <div className="pending-rank-track" aria-hidden>
                <div
                  className="pending-rank-fill"
                  style={{
                    width: `${barWidth}%`,
                    background: SLICE_COLORS[index % SLICE_COLORS.length],
                  }}
                />
              </div>
            </button>
          );
        })}
      </div>

      <p className="chart-footnote pending-chart-footnote">{t(lang, 'chartClickHint')}</p>
    </div>
  );
}
