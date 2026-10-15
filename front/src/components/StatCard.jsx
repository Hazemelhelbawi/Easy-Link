export default function StatCard({ label, value, icon: Icon, hint }) {
  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
        <div className="stat-label">{label}</div>
        {Icon ? <Icon size={18} color="var(--accent)" /> : null}
      </div>
      <div className="stat-value">{value}</div>
      {hint ? <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{hint}</div> : null}
    </div>
  );
}
