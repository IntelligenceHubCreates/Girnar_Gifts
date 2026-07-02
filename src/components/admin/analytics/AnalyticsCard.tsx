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
    <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10, display: 'flex',
          alignItems: 'center', justifyContent: 'center', fontSize: 20,
          background: 'var(--soft-2, #f5f5f5)',
        }}>{icon}</div>
        {trend != null && (
          <span style={{
            fontSize: '.72rem', fontWeight: 800,
            color: trend >= 0 ? '#15803d' : '#dc2626',
          }}>
            {trend >= 0 ? '▲' : '▼'} {Math.abs(trend).toFixed(1)}%
          </span>
        )}
      </div>
      <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#111', lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: '.74rem', fontWeight: 700, color: 'var(--muted, #9ca3af)' }}>{label}</div>
      {sub && <div style={{ fontSize: '.7rem', color: 'var(--muted, #9ca3af)' }}>{sub}</div>}
      <div style={{ height: 3, borderRadius: 3, background: accent, opacity: 0.85, marginTop: 2 }} />
    </div>
  )
}