export function Skeleton({ height = 16, width = '100%', className = '' }) {
  return <div className={`skeleton ${className}`} style={{ height, width }} aria-hidden />;
}

export function OverviewSkeleton() {
  return (
    <div className="overview-snapshot">
      <Skeleton height={72} width="100%" />
      <div className="overview-kpi-grid">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="stat-card">
            <Skeleton height={14} width="60%" />
            <Skeleton height={32} width="40%" className="sk-mt" />
          </div>
        ))}
      </div>
    </div>
  );
}
