export default function LeaderboardBars({ entries, showRevenue, highlightPersonId, formatValue }) {
  const valueKey = showRevenue ? 'revenue' : 'completed';
  const rows = (entries || []).map((e) => ({
    ...e,
    value: Number(e[valueKey]) || 0,
  }));
  const max = rows.reduce((m, r) => Math.max(m, r.value), 1);

  const display = formatValue || ((v) => String(v));

  if (!rows.length) return null;

  return (
    <div className="leaderboard-bars" role="list">
      {rows.map((row) => {
        const width = Math.max(4, (row.value / max) * 100);
        const isYou = highlightPersonId && row.personId === highlightPersonId;
        return (
          <div
            key={row.personId}
            className={`leaderboard-bar-row${isYou ? ' is-you' : ''}`}
            role="listitem"
          >
            <div className="leaderboard-bar-head">
              <span className="leaderboard-bar-rank" dir="ltr">
                #{row.rank}
              </span>
              <span className="leaderboard-bar-name" title={row.name}>
                {row.name}
              </span>
              <span className="leaderboard-bar-value" dir="ltr">
                {display(row.value)}
              </span>
            </div>
            <div className="leaderboard-bar-track" aria-hidden>
              <div className="leaderboard-bar-fill" style={{ width: `${width}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
