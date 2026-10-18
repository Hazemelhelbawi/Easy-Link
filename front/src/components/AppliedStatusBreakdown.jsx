import { useId, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  LabelList,
} from 'recharts';
import { formatNumber } from '../utils/format.js';
import { t } from '../i18n/index.js';
import { chartValueAxisMargin, chartValueYAxisProps, rechartsCursorSoft } from './rechartsTheme.jsx';
import { formatChartAxisNumber } from '../utils/format.js';

function ChartTooltip({ active, payload, lang }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="chart-tooltip">
      <strong>{row.statusText}</strong>
      <div dir="ltr">{formatNumber(lang, row.count)}</div>
    </div>
  );
}

export default function AppliedStatusBreakdown({ items, lang, ordersLink }) {
  const navigate = useNavigate();
  const isRtl = lang === 'ar';

  const rows = useMemo(
    () =>
      (items || [])
        .map((row) => ({
          statusText: String(row.statusText || '—').trim(),
          count: Number(row.count) || 0,
        }))
        .filter((row) => row.count > 0)
        .sort((a, b) => b.count - a.count),
    [items],
  );

  const total = rows.reduce((s, r) => s + r.count, 0);
  const gradId = useId().replace(/:/g, '');

  const tickStyle = { fill: 'var(--text-muted)', fontSize: 11 };
  const axisStyle = { fill: 'var(--text)', fontSize: 11 };

  function shortenLabel(value) {
    const s = String(value || '');
    if (s.length <= 14) return s;
    return `${s.slice(0, 13)}…`;
  }

  if (!rows.length) {
    return <p className="empty-state">{t(lang, 'empty')}</p>;
  }

  function openOrders(statusText) {
    navigate(ordersLink({ status: 'applied', statusTexts: statusText }));
  }

  return (
    <div className="status-breakdown-chart-wrap">
      <div className="status-breakdown-total" dir="ltr">
        <span className="status-breakdown-total-value">{formatNumber(lang, total)}</span>
        <span className="status-breakdown-total-label">{t(lang, 'appliedOrders')}</span>
      </div>

      <div className="chart-plot applied-chart applied-chart-columns">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={rows}
            margin={{
              ...chartValueAxisMargin(isRtl, 40),
              bottom: rows.length > 3 ? 56 : 36,
              top: 16,
            }}
            barCategoryGap={rows.length === 1 ? '62%' : '24%'}
          >
            <defs>
              <linearGradient id={gradId} x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.9} />
                <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="statusText"
              tick={axisStyle}
              axisLine={{ stroke: 'var(--border)' }}
              tickLine={false}
              interval={0}
              angle={rows.length > 2 ? -32 : 0}
              textAnchor={rows.length > 2 ? 'end' : 'middle'}
              height={rows.length > 2 ? 64 : 40}
              tickFormatter={shortenLabel}
              reversed={isRtl}
            />
            <YAxis {...chartValueYAxisProps(isRtl, (v) => formatChartAxisNumber(lang, v))} />
            <Tooltip content={<ChartTooltip lang={lang} />} cursor={rechartsCursorSoft} />
            <Bar
              dataKey="count"
              radius={[8, 8, 0, 0]}
              maxBarSize={rows.length === 1 ? 72 : 48}
              onClick={(bar) => openOrders(bar.statusText)}
              cursor="pointer"
            >
              <LabelList
                dataKey="count"
                position="top"
                fill="var(--text)"
                fontSize={12}
                fontWeight={600}
                formatter={(v) => formatNumber(lang, v)}
              />
              {rows.map((row) => (
                <Cell key={row.statusText} fill={`url(#${gradId})`} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="chart-footnote">{t(lang, 'chartClickHint')}</p>
    </div>
  );
}
