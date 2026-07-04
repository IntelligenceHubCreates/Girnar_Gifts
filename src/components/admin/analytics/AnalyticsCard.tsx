'use client'

export default function AnalyticsCard({
  icon, label, value, trend, sub, accent = 'var(--coral)',
}: {
  icon: string
  label: string
  value: string
  trend?: number | null
  sub?: string
  accent?: string
}) {
  return (
    <div className="an-card">
      <div className="an-card-row">
        <div className="an-card-icon">{icon}</div>
        {trend != null && (
          <span className="an-card-trend" style={{ color: trend >= 0 ? '#15803d' : '#dc2626' }}>
            {trend >= 0 ? '▲' : '▼'} {Math.abs(trend).toFixed(1)}%
          </span>
        )}
      </div>
      <div className="an-card-val">{value}</div>
      <div className="an-card-label">{label}</div>
      {sub && <div className="an-card-sub">{sub}</div>}
      <div className="an-card-bar" style={{ background: accent }} />
    </div>
  )
}
