'use client'

import { ReactNode } from 'react'

interface Bar { label: string; primary: number; secondary?: number }

export default function ChartCard({
  title, bars, loading, empty, primaryLabel = 'Revenue', secondaryLabel,
  formatPrimary = (n: number) => String(n), children,
}: {
  title: string
  bars?: Bar[]
  loading?: boolean
  empty?: boolean
  primaryLabel?: string
  secondaryLabel?: string
  formatPrimary?: (n: number) => string
  children?: ReactNode
}) {
  const maxP = bars && bars.length ? Math.max(...bars.map(b => b.primary), 1) : 1
  const maxS = bars && bars.length ? Math.max(...bars.map(b => b.secondary ?? 0), 1) : 1

  return (
    <div className="card" style={{ marginBottom: 18 }}>
      <div className="card-head"><div className="card-title">{title}</div></div>
      <div style={{ padding: 16 }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 180 }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{ flex: 1, height: `${30 + (i % 5) * 14}%`, background: 'var(--soft-2,#eee)', borderRadius: '6px 6px 0 0' }} />
            ))}
          </div>
        ) : empty || !bars || bars.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--muted,#9ca3af)', fontWeight: 700 }}>
            <div style={{ fontSize: 30, marginBottom: 8 }}>📊</div>No data for this range
          </div>
        ) : children ? children : (
          <>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 200 }}>
              {bars.map((b, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 2, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: '100%' }}>
                    <div title={formatPrimary(b.primary)} style={{
                      flex: 1, height: `${(b.primary / maxP) * 100}%`, minHeight: b.primary > 0 ? 3 : 0,
                      background: 'var(--coral)', borderRadius: '5px 5px 0 0', transition: 'height .4s',
                    }} />
                    {b.secondary != null && (
                      <div title={String(b.secondary)} style={{
                        flex: 1, height: `${(b.secondary / maxS) * 100}%`, minHeight: b.secondary > 0 ? 3 : 0,
                        background: 'var(--mint)', borderRadius: '5px 5px 0 0', transition: 'height .4s',
                      }} />
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 8, overflowX: 'auto' }}>
              {bars.map((b, i) => (
                <span key={i} style={{ flex: 1, textAlign: 'center', fontSize: '.62rem', color: 'var(--muted,#9ca3af)', whiteSpace: 'nowrap', minWidth: 0 }}>{b.label}</span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: '.74rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><i style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--coral)' }} />{primaryLabel}</span>
              {secondaryLabel && <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><i style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--mint)' }} />{secondaryLabel}</span>}
            </div>
          </>
        )}
      </div>
    </div>
  )
}