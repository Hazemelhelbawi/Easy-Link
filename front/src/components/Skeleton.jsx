export function Skeleton({ height = 16, width = '100%', className = '' }) {
  return <div className={`skeleton ${className}`} style={{ height, width }} aria-hidden />;
}

export function OverviewSkeleton() {
  return (
    <div className="grid-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="card">
          <Skeleton height={14} width="60%" />
          <Skeleton height={32} width="40%" className="sk-mt" />
        </div>
      ))}
    </div>
  );
}
