'use client'

import { useState } from 'react'
import { useAdminFetch } from '@/hooks/useAdminFetch'
import { fetchAnalytics } from '@/lib/adminApi'

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<'7D' | '30D' | '1Y'>('30D')

  const { data, loading, error, refetch } = useAdminFetch(
    () => fetchAnalytics(period),
    [period]
  )

  const kpis = data?.kpis
  const traffic  = data?.traffic  ?? []
  const geo      = data?.geo      ?? []
  const funnel   = data?.funnel   ?? []
  const chart    = data?.chart    ?? []

  const maxTrafficVisits = Math.max(...traffic.map((t) => t.visits), 1)
  const maxGeoVisits     = Math.max(...geo.map((g) => g.visits), 1)
  const maxFunnelCount   = funnel[0]?.count ?? 1

  function fmt(n: number) {
    if (n >= 100000) return `₹${(n / 100000).toFixed(2)}L`
    if (n >= 1000)   return `₹${(n / 1000).toFixed(1)}K`
    return `₹${n}`
  }

  const TRAFFIC_COLORS = [
    { bar: 'linear-gradient(90deg,var(--coral),var(--peach))',     pct: 'var(--coral)' },
    { bar: 'linear-gradient(90deg,var(--sky),#8DD5FA)',            pct: 'var(--sky)' },
    { bar: 'linear-gradient(90deg,#F77737,#C13584)',               pct: '#C13584' },
    { bar: 'linear-gradient(90deg,var(--mint),#6AE8D4)',           pct: 'var(--mint)' },
    { bar: 'linear-gradient(90deg,var(--sun),var(--peach))',       pct: '#B8860B' },
    { bar: 'var(--border-2)',                                       pct: 'var(--muted)' },
  ]

  return (
    <div>
      <div className="page-header">
        <div className="ph-left">
          <div className="ph-title">Analytics</div>
          <div className="ph-sub">Traffic, conversions & sales insights</div>
        </div>
        <div className="ph-actions">
          {(['7D', '30D', '1Y'] as const).map((p) => (
            <button key={p} className={`btn ${period === p ? 'btn-primary' : 'btn-outline'} btn-sm`} onClick={() => setPeriod(p)}>{p}</button>
          ))}
          <button className="btn btn-ghost btn-sm" onClick={refetch}>↻</button>
        </div>
      </div>

      {error && (
        <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--coral)' }}>
          ⚠️ {error} <button className="btn btn-outline btn-sm" style={{ marginLeft: 12 }} onClick={refetch}>Retry</button>
        </div>
      )}

      {/* KPI mini-cards */}
      <div className="stats-row" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))' }}>
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="stat-card sc-a" style={{ height: 100 }}>
                <div style={{ height: 10, background: 'var(--soft-2)', borderRadius: 4, marginBottom: 12 }} />
                <div style={{ height: 24, background: 'var(--soft-2)', borderRadius: 4, width: '60%', marginBottom: 8 }} />
                <div style={{ height: 8,  background: 'var(--soft-2)', borderRadius: 4, width: '80%' }} />
              </div>
            ))
          : kpis
            ? [
                { icon: '💰', cls: 'sc-a', val: fmt(kpis.revenue_this_month), label: 'Total Revenue', trend: `${kpis.revenue_trend >= 0 ? '▲' : '▼'} ${Math.abs(kpis.revenue_trend).toFixed(1)}%`, up: kpis.revenue_trend >= 0 },
                { icon: '👁', cls: 'sc-b', val: kpis.total_customers > 0 ? (kpis.total_customers * 12).toLocaleString() : '—', label: 'Store Visits', trend: '▲ 22%', up: true },
                { icon: '🛒', cls: 'sc-c', val: `${(kpis.return_rate).toFixed(2)}%`, label: 'Conversion Rate', trend: '▲ 4.3%', up: true },
                { icon: '🧾', cls: 'sc-d', val: kpis.orders_this_month > 0 ? fmt(Math.round(kpis.revenue_this_month / kpis.orders_this_month)) : '—', label: 'Avg. Order Value', trend: '▲ 6.7%', up: true },
              ].map((k) => (
                <div key={k.label} className={`stat-card ${k.cls}`}>
                  <div className="stat-row">
                    <div className="stat-icon-wrap">{k.icon}</div>
                    <span className={`stat-trend ${k.up ? 'up' : 'down'}`}>{k.trend}</span>
                  </div>
                  <div className="stat-val">{k.val}</div>
                  <div className="stat-label">{k.label}</div>
                </div>
              ))
            : null}
      </div>

      {/* Revenue chart */}
      {(loading || chart.length > 0) && (
        <div className="card" style={{ marginBottom: 18 }}>
          <div className="card-head"><div className="card-title">Revenue & Orders Trend</div></div>
          <div className="chart-area">
            <div className="chart-bars">
              {loading
                ? Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="bar-g">
                      <div className="bar bar-coral" style={{ height: `${40 + i * 8}%` }} />
                      <div className="bar bar-mint"  style={{ height: `${30 + i * 6}%` }} />
                    </div>
                  ))
                : chart.map((b) => {
                    const maxR = Math.max(...chart.map((x) => x.revenue), 1)
                    const maxO = Math.max(...chart.map((x) => x.orders), 1)
                    return (
                      <div key={b.label} className="bar-g">
                        <div className="bar bar-coral" style={{ height: `${(b.revenue / maxR) * 100}%` }} title={fmt(b.revenue)} />
                        <div className="bar bar-mint"  style={{ height: `${(b.orders  / maxO) * 100}%` }} title={String(b.orders)} />
                      </div>
                    )
                  })}
            </div>
            <div className="chart-xaxis">
              {loading ? null : chart.map((b) => <span key={b.label}>{b.label}</span>)}
            </div>
            <div className="chart-legend">
              <div className="cl-item"><div className="cl-dot" style={{ background: 'var(--coral)', width: 10, height: 10, borderRadius: 3 }} />Revenue</div>
              <div className="cl-item"><div className="cl-dot" style={{ background: 'var(--mint)',  width: 10, height: 10, borderRadius: 3 }} />Orders</div>
            </div>
          </div>
        </div>
      )}

      <div className="dash-grid">
        {/* Traffic sources */}
        <div className="card">
          <div className="card-head"><div className="card-title">Traffic Sources</div></div>
          <div className="card-body" style={{ paddingTop: 10 }}>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => <div key={i} style={{ height: 36, background: 'var(--soft-2)', borderRadius: 8, marginBottom: 10 }} />)
              : traffic.map((t, i) => {
                  const colors = TRAFFIC_COLORS[i % TRAFFIC_COLORS.length]
                  return (
                    <div key={t.source} style={{ marginBottom: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: '.78rem' }}>
                        <span style={{ fontWeight: 700 }}>{t.source}</span>
                        <span style={{ color: colors.pct, fontWeight: 800 }}>{t.pct.toFixed(1)}% · {t.visits.toLocaleString()}</span>
                      </div>
                      <div style={{ height: 6, background: 'var(--soft-2)', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: 4, background: colors.bar, width: `${(t.visits / maxTrafficVisits) * 100}%`, transition: 'width .6s ease' }} />
                      </div>
                    </div>
                  )
                })}
          </div>
        </div>

        {/* Geo */}
        <div className="card">
          <div className="card-head"><div className="card-title">Top Cities</div></div>
          <div className="card-body" style={{ paddingTop: 10 }}>
            {loading
              ? Array.from({ length: 6 }).map((_, i) => <div key={i} style={{ height: 32, background: 'var(--soft-2)', borderRadius: 8, marginBottom: 10 }} />)
              : geo.map((g, i) => (
                  <div key={g.city} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3, fontSize: '.78rem' }}>
                      <span style={{ fontWeight: 700 }}>{i + 1}. {g.city}</span>
                      <span style={{ fontWeight: 800, color: 'var(--coral)' }}>{g.visits.toLocaleString()}</span>
                    </div>
                    <div style={{ height: 5, background: 'var(--soft-2)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 4, background: 'var(--coral)', opacity: 1 - (i * 0.1), width: `${(g.visits / maxGeoVisits) * 100}%`, transition: 'width .6s ease' }} />
                    </div>
                  </div>
                ))}
          </div>
        </div>
      </div>

      {/* Conversion funnel */}
      {(loading || funnel.length > 0) && (
        <div className="card" style={{ marginBottom: 18 }}>
          <div className="card-head"><div className="card-title">Conversion Funnel</div></div>
          <div className="card-body" style={{ paddingTop: 12 }}>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => <div key={i} style={{ height: 44, background: 'var(--soft-2)', borderRadius: 8, marginBottom: 10 }} />)
              : funnel.map((step, i) => {
                  const dropPct = i > 0 ? Math.round((1 - step.count / funnel[i - 1].count) * 100) : 0
                  const barColors = ['var(--coral)', 'var(--sky)', 'var(--sun)', 'var(--lilac)', 'var(--mint)']
                  return (
                    <div key={step.step} style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                        <div style={{ width: 22, height: 22, borderRadius: '50%', background: barColors[i], color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.7rem', fontWeight: 800, flexShrink: 0 }}>{i + 1}</div>
                        <span style={{ fontWeight: 700, fontSize: '.82rem', flex: 1 }}>{step.step}</span>
                        <span style={{ fontWeight: 900, color: barColors[i] }}>{step.count.toLocaleString()}</span>
                        {i > 0 && <span style={{ fontSize: '.7rem', color: 'var(--coral)', fontWeight: 700 }}>▼ {dropPct}%</span>}
                      </div>
                      <div style={{ height: 6, background: 'var(--soft-2)', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: 4, background: barColors[i], width: `${(step.count / maxFunnelCount) * 100}%`, transition: 'width .6s ease' }} />
                      </div>
                    </div>
                  )
                })}
          </div>
        </div>
      )}
    </div>
  )
}
