/** Shared Recharts tooltip/cursor styling — uses CSS variables for light/dark. */
export const rechartsTooltipProps = {
  contentStyle: {
    backgroundColor: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    boxShadow: 'var(--shadow-md)',
    color: 'var(--text)',
  },
  labelStyle: {
    color: 'var(--text)',
    fontWeight: 600,
    marginBottom: 4,
  },
  itemStyle: {
    color: 'var(--text-muted)',
  },
  wrapperStyle: {
    zIndex: 20,
    outline: 'none',
  },
};

export const rechartsCursorSoft = { fill: 'var(--accent-soft)' };

/** Side gutter so Y-axis numbers sit beside the plot, not on grid lines. */
export function chartValueAxisMargin(isRtl, gutter = 56) {
  return {
    top: 14,
    right: isRtl ? gutter + 8 : 16,
    left: isRtl ? 16 : gutter + 8,
    bottom: 6,
  };
}

export function ChartValueAxisTick({ x, y, payload, isRtl, formatValue }) {
  const label = formatValue(payload.value);
  return (
    <text
      x={x}
      y={y}
      dy={4}
      dx={isRtl ? 10 : -10}
      textAnchor={isRtl ? 'start' : 'end'}
      fill="var(--text-muted)"
      fontSize={11}
    >
      {label}
    </text>
  );
}

export function chartValueYAxisProps(isRtl, formatValue) {
  return {
    orientation: isRtl ? 'right' : 'left',
    width: 48,
    tickMargin: 8,
    axisLine: false,
    tickLine: false,
    allowDecimals: false,
    tick: (props) => <ChartValueAxisTick {...props} isRtl={isRtl} formatValue={formatValue} />,
  };
}
