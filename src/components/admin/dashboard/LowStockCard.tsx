'use client'

import { useAdminFetch } from '@/hooks/useAdminFetch'
import type { ApiLowStockItem } from '@/lib/adminApi'
import type { PageId } from '@/lib/adminData'

interface LowStockCardProps {
  /** Injected fetcher. If omitted, the card renders a "not configured" state. */
  fetcher?: (threshold?: number) => Promise<ApiLowStockItem[]>
  threshold?: number
  onNavigate?: (id: PageId) => void
}

function Skel() {
  return (
    <div style={{
      height: 14, borderRadius: 6, margin: '10px 0',
      background: 'linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%)',
      backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite',
    }} />
  )
}

export default function LowStockCard({ fetcher, threshold = 10, onNavigate }: LowStockCardProps) {
  // Hook is always called (Rules of Hooks). With no fetcher, resolve to [].
  const { data, loading, error, refetch } = useAdminFetch<ApiLowStockItem[]>(
    () => (fetcher ? fetcher(threshold) : Promise.resolve([])),
    [Boolean(fetcher), threshold],
  )

  const items = data ?? []

  return (
    <div className="dash-card" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="dash-card-head" style={{ flexShrink: 0 }}>
        <div className="dash-card-title">⚠️ Low Stock Alerts</div>
        {fetcher && (
          <button
            onClick={refetch}
            style={{
              padding: '4px 10px', borderRadius: 6, border: '1.5px solid #e5e7eb',
              background: '#fff', fontWeight: 700, fontSize: '.72rem',
              cursor: 'pointer', color: '#374151',
            }}
          >↻</button>
        )}
      </div>

      {!fetcher ? (
        <div style={{ padding: '8px 20px 16px' }}>
          <div style={{ padding: '24px 0', textAlign: 'center', color: '#9ca3af', fontSize: '.82rem' }}>
            Low-stock tracking isn’t configured yet.
          </div>
        </div>
      ) : loading ? (
        <div style={{ padding: '8px 20px 16px' }}>
          {Array.from({ length: 4 }).map((_, i) => <Skel key={i} />)}
        </div>
      ) : error ? (
        <div style={{ padding: '8px 20px 16px' }}>
          <div style={{ padding: '16px 0', textAlign: 'center' }}>
            <div style={{ color: '#b91c1c', fontSize: '.82rem', fontWeight: 700, marginBottom: 8 }}>⚠️ {error}</div>
            <button
              onClick={refetch}
              style={{
                padding: '6px 14px', borderRadius: 7, border: '1.5px solid #fca5a5',
                background: '#fff', color: '#b91c1c', fontWeight: 700, fontSize: '.75rem', cursor: 'pointer',
              }}
            >Retry</button>
          </div>
        </div>
      ) : items.length === 0 ? (
        <div style={{ padding: '8px 20px 16px' }}>
          <div style={{ padding: '24px 0', textAlign: 'center', color: '#15803d', fontSize: '.82rem', fontWeight: 600 }}>
            ✅ All products are above the {threshold}-unit threshold.
          </div>
        </div>
      ) : (
        <>
          {/* Scrollable list — caps height, scrolls when long */}
          <div style={{ flex: 1, overflowY: 'auto', maxHeight: 260, padding: '8px 20px 8px' }}>
            {items.map((p, i) => {
              const out = p.count <= 0
              return (
                <div key={p.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0',
                  borderBottom: i < items.length - 1 ? '1px solid #fafafa' : 'none',
                }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                    background: out ? '#fee2e2' : '#fff7ed',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                  }}>{out ? '🛑' : '⚠️'}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: '.82rem', color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {p.name}
                    </div>
                    <div style={{ fontSize: '.68rem', color: '#9ca3af', fontWeight: 600 }}>{p.category || '—'}</div>
                  </div>
                  <span style={{
                    fontSize: '.7rem', fontWeight: 800, padding: '3px 10px', borderRadius: 20,
                    background: out ? '#fee2e2' : '#fff7ed',
                    color: out ? '#b91c1c' : '#b45309',
                    whiteSpace: 'nowrap', flexShrink: 0,
                  }}>
                    {out ? 'Out of stock' : `${p.count} left`}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Pinned footer — stays at the card's bottom edge, never scrolls */}
          {onNavigate && (
            <div style={{ padding: '10px 20px', borderTop: '1px solid #f0f0f0', flexShrink: 0 }}>
              <button
                onClick={() => onNavigate('products')}
                style={{
                  width: '100%', padding: '8px', borderRadius: 8,
                  border: '1.5px solid #e5e7eb', background: '#fff',
                  fontWeight: 700, fontSize: '.78rem', cursor: 'pointer', color: '#374151',
                }}
              >Manage inventory →</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}