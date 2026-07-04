'use client'

import { useState, useMemo } from 'react'
import { useAdminFetch } from '@/hooks/useAdminFetch'
import { fetchDashboardStats, fetchLowStock, type ApiDashboardStats, type ApiOrder } from '@/lib/adminApi'
import { fmtMoney, fmtMoneyFull, fmtDate, fmtCount } from '@/lib/format'
import LowStockCard from '@/components/admin/dashboard/LowStockCard'
import { type PageId } from '@/lib/adminData'

// ── Order normalizer ──────────────────────────────────────────────
// stats.recent_orders come from the backend's _serialize_order shape
// (items[] with name/qty/price, plus customer_name/city/user_id).
// Kept shape-tolerant so it also survives the OrderResponse shape.
// NOTE: the dashboard endpoint does not join Users or parse the
// shipping address, so customer_name is "—" and city is "" there —
// we fall back to an id-based identifier (honest + cross-referenceable).

function normalizeOrder(raw: any): ApiOrder {
  const rawItems = raw.order_items ?? raw.items ?? []
  const items = rawItems.map((i: any) => ({
    product_id: i.product_id ?? i.id ?? '',
    name:       i.product?.name ?? i.product_name ?? i.name ?? 'Item',
    qty:        i.quantity ?? i.qty ?? 1,
    price:      i.price ?? i.unit_price ?? 0,
    color:      i.color ?? null,
    color_hex:  i.color_hex ?? null,
    image:      i.image ?? null,
  }))

  const id       = raw.id ?? ''
  const orderNum = raw.order_number ?? (id ? id.slice(0, 8).toUpperCase() : '—')
  const userId   = raw.user_id ? String(raw.user_id) : ''
  const rawName  = raw.customer_name && raw.customer_name !== '—' ? raw.customer_name : ''
  const customer = rawName || (userId ? `#${userId.slice(0, 8).toUpperCase()}` : '—')
  const city     = raw.city && raw.city !== '—' ? raw.city : ''

  return {
    id,
    order_number:   orderNum,
    user_id:        userId,
    customer_name:  customer,
    customer_email: raw.customer_email ?? '—',
    customer_phone: raw.customer_phone ?? '—',
    city,
    state:          raw.state ?? '',
    pincode:        raw.pincode ?? '',
    address:        raw.address ?? '',
    notes:          raw.notes ?? '',
    items,
    total_amount:   raw.total_amount ?? raw.total ?? 0,
    payment_method: raw.payment_method ?? '—',
    payment_status: raw.payment_status ?? '—',
    razorpay_payment_id: raw.razorpay_payment_id ?? null,   
    paid_at:        raw.paid_at ?? null,           
    status:         raw.status ?? 'pending',
    created_at:     raw.created_at ?? new Date().toISOString(),
    updated_at:     raw.updated_at ?? raw.created_at ?? '',
  }
}

// ── Status badge ──────────────────────────────────────────────────

const STATUS_STYLE: Record<string, { bg: string; color: string; dot: string }> = {
  delivered:  { bg: '#dcfce7', color: '#15803d', dot: '#16a34a' },
  confirmed:  { bg: '#dbeafe', color: '#1d4ed8', dot: '#2563eb' },
  processing: { bg: '#e0e7ff', color: '#4338ca', dot: '#6366f1' },
  shipped:    { bg: '#e0f2fe', color: '#0369a1', dot: '#0284c7' },
  pending:    { bg: '#fef9c3', color: '#a16207', dot: '#ca8a04' },
  cancelled:  { bg: '#fee2e2', color: '#b91c1c', dot: '#dc2626' },
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLE[(status || '').toLowerCase()] ?? { bg: '#f3f4f6', color: '#374151', dot: '#9ca3af' }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: s.bg, color: s.color,
      fontSize: '.68rem', fontWeight: 800,
      padding: '3px 10px', borderRadius: 20,
      letterSpacing: '.03em', whiteSpace: 'nowrap', textTransform: 'capitalize',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
      {status}
    </span>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────

function Skeleton({ h = 16, w = '100%' }: { h?: number; w?: string }) {
  return (
    <div style={{
      height: h, width: w, borderRadius: 6,
      background: 'linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.4s infinite',
    }} />
  )
}

// ── Avatar ────────────────────────────────────────────────────────

const AV_BG   = ['#fff1f0', '#fff7e6', '#f0f9ff', '#f9f0ff', '#f0fff4', '#fff0f6']
const AV_TEXT = ['#cf1322', '#d46b08', '#096dd9', '#531dab', '#237804', '#c41d7f']

function initials(name: string) {
  const clean = (name ?? '').replace(/^#/, '')
  if (!clean) return '?'
  const parts = clean.split(' ').filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return clean.slice(0, 2).toUpperCase()
}

function Avatar({ name, idx }: { name: string; idx: number }) {
  const i = idx % AV_BG.length
  return (
    <div style={{
      width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
      background: AV_BG[i], color: AV_TEXT[i],
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '.68rem', fontWeight: 900,
      border: `1.5px solid ${AV_TEXT[i]}22`,
    }}>{initials(name)}</div>
  )
}

// ── SVG Donut (offset math fixed) ─────────────────────────────────

function DonutChart({ segments, total }: {
  segments: { color: string; label: string; value: number }[]
  total: number
}) {
  const R = 54, CX = 64, CY = 64
  const circumference = 2 * Math.PI * R

  // Each segment is a full circle whose visible dash = its fraction of the
  // circumference, shifted by the cumulative length of preceding segments.
  let acc = 0
  const arcs = segments.map((seg) => {
    const fraction = total > 0 ? seg.value / total : 0
    const len      = fraction * circumference
    const arc = {
      ...seg,
      fraction,
      dasharray:  `${len} ${circumference - len}`,
      dashoffset: -acc,            // negative offset rotates the start clockwise
    }
    acc += len
    return arc
  })

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <svg width={128} height={128} viewBox="0 0 128 128">
          <circle cx={CX} cy={CY} r={R} fill="none" stroke="#f3f4f6" strokeWidth={16} />
          {arcs.map((a, i) => (
            <circle
              key={i}
              cx={CX} cy={CY} r={R}
              fill="none"
              stroke={a.color}
              strokeWidth={16}
              strokeDasharray={a.dasharray}
              strokeDashoffset={a.dashoffset}
              strokeLinecap="butt"
              transform={`rotate(-90 ${CX} ${CY})`}
              style={{ transition: 'stroke-dasharray .5s ease, stroke-dashoffset .5s ease' }}
            />
          ))}
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ fontWeight: 900, fontSize: '1.3rem', lineHeight: 1 }}>{total}</div>
          <div style={{ fontSize: '.68rem', color: '#9ca3af', fontWeight: 700 }}>Orders</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
        {arcs.map((a) => (
          <div key={a.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: a.color, flexShrink: 0 }} />
            <div style={{ flex: 1, fontSize: '.8rem', fontWeight: 700, color: '#374151' }}>{a.label}</div>
            <div style={{ fontSize: '.78rem', fontWeight: 800, color: '#111' }}>{a.value}</div>
            <div style={{ fontSize: '.7rem', color: '#9ca3af', fontWeight: 600, minWidth: 36, textAlign: 'right' }}>
              {Math.round(a.fraction * 100)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Bar chart ─────────────────────────────────────────────────────

function BarChart({ data }: { data: { label: string; revenue: number; orders: number }[] }) {
  const maxRev = Math.max(...data.map((x) => x.revenue), 1)
  const maxOrd = Math.max(...data.map((x) => x.orders),  1)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 8 }}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: 6, padding: '0 4px' }}>
        {data.map((b) => (
          <div key={b.label} style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: 3, height: '100%' }}>
            <div title={`Revenue: ${fmtMoney(b.revenue)}`} style={{
              flex: 1, borderRadius: '4px 4px 0 0',
              background: 'linear-gradient(180deg, #fb923c, #f97316)',
              height: `${(b.revenue / maxRev) * 100}%`, minHeight: 4,
              transition: 'height .4s ease',
            }} />
            <div title={`Orders: ${b.orders}`} style={{
              flex: 1, borderRadius: '4px 4px 0 0',
              background: 'linear-gradient(180deg, #34d399, #10b981)',
              height: `${(b.orders / maxOrd) * 100}%`, minHeight: 4,
              transition: 'height .4s ease',
            }} />
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6, padding: '0 4px', borderTop: '1px solid #f3f4f6', paddingTop: 6 }}>
        {data.map((b) => (
          <div key={b.label} style={{ flex: 1, textAlign: 'center', fontSize: '.62rem', fontWeight: 700, color: '#9ca3af' }}>
            {b.label}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────

const STATUS_TABS = ['All', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']

interface DashboardPageProps {
  onNavigate?: (id: PageId) => void
}

export default function DashboardPage({ onNavigate }: DashboardPageProps = {}) {
  const [orderTab, setOrderTab] = useState('All')

  const { data: stats, loading, error, refetch } = useAdminFetch<ApiDashboardStats>(
    fetchDashboardStats, [],
  )

  // recent_orders already arrive with items + customer fields — no extra fetch.
  const recentOrders: ApiOrder[] = useMemo(
    () => (stats?.recent_orders ?? []).map(normalizeOrder),
    [stats?.recent_orders],
  )

  const filteredOrders = useMemo(() => {
    if (orderTab === 'All') return recentOrders
    return recentOrders.filter((o) => o.status?.toLowerCase() === orderTab.toLowerCase())
  }, [recentOrders, orderTab])

  // ── Error state ────────────────────────────────────────────────
  if (error) {
    return (
      <div style={{ background: '#fff', borderRadius: 14, padding: 40, textAlign: 'center', border: '1px solid #f0f0f0' }}>
        <div style={{ fontSize: 36 }}>⚠️</div>
        <div style={{ fontWeight: 800, fontSize: '1rem', marginTop: 10 }}>Failed to load dashboard</div>
        <div style={{ color: '#9ca3af', fontSize: '.82rem', margin: '8px 0 20px' }}>{error}</div>
        <button
          onClick={refetch}
          style={{ padding: '9px 22px', borderRadius: 8, border: 'none', background: '#f97316', color: '#fff', fontWeight: 800, cursor: 'pointer' }}
        >Retry</button>
      </div>
    )
  }

  // ── Derived values ─────────────────────────────────────────────
const counts = stats?.order_status_counts
  const orderTotal = counts
    ? counts.pending + counts.confirmed + counts.processing + counts.shipped + counts.delivered + counts.cancelled
    : 0

  // Colours match the StatusBadge dot palette for cross-component consistency.
  const donutSegments = counts ? [
    { color: '#ca8a04', label: 'Pending',    value: counts.pending    },
    { color: '#2563eb', label: 'Confirmed',  value: counts.confirmed  },
    { color: '#6366f1', label: 'Processing', value: counts.processing },
    { color: '#0284c7', label: 'Shipped',    value: counts.shipped    },
    { color: '#16a34a', label: 'Delivered',  value: counts.delivered  },
    { color: '#dc2626', label: 'Cancelled',  value: counts.cancelled  },
  ] : []

  const cancelRate = orderTotal > 0 ? (counts!.cancelled / orderTotal) * 100 : 0
  const pending    = counts?.pending ?? 0
  const processing = counts?.processing ?? 0
  const needsAttention = pending + processing

  const kpiCards = stats ? [
    { icon: '💰', label: 'Revenue This Month', val: fmtMoney(stats.revenue_this_month), trend: stats.revenue_trend,  sub: 'vs last month',     bg: '#fff7ed' },
    { icon: '📦', label: 'Orders This Month',  val: fmtCount(stats.orders_this_month),  trend: stats.orders_trend,   sub: 'vs last month',     bg: '#eff6ff' },
    { icon: '👤', label: 'Total Customers',    val: fmtCount(stats.total_customers),    trend: stats.customers_trend, sub: 'registered users',  bg: '#f5f3ff' },
    { icon: '🚫', label: 'Cancellation Rate',  val: `${cancelRate.toFixed(1)}%`,        trend: null as number | null, sub: 'of all orders · refunds not tracked', bg: '#f0fdf4' },
  ] : null

  return (
    <>
      {/* ── KPI Cards ──────────────────────────────────────────── */}
      <div className="dash-kpi-grid">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="dash-card" style={{ padding: 20 }}>
                <Skeleton h={12} w="50%" />
                <div style={{ margin: '14px 0 8px' }}><Skeleton h={28} w="60%" /></div>
                <Skeleton h={10} w="80%" />
              </div>
            ))
          : kpiCards?.map((k) => (
              <div key={k.label} className="dash-card" style={{ padding: 20, background: k.bg, borderColor: k.bg }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10, background: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  }}>{k.icon}</div>
                  {k.trend !== null && (
                    <span style={{
                      fontSize: '.7rem', fontWeight: 800, padding: '3px 8px', borderRadius: 20,
                      background: k.trend >= 0 ? '#dcfce7' : '#fee2e2',
                      color:      k.trend >= 0 ? '#15803d' : '#b91c1c',
                    }}>
                      {k.trend >= 0 ? '▲' : '▼'} {Math.abs(k.trend).toFixed(1)}%
                    </span>
                  )}
                </div>
                <div style={{ fontWeight: 900, fontSize: '1.6rem', color: '#111827', lineHeight: 1 }}>{k.val}</div>
                <div style={{ fontWeight: 700, fontSize: '.78rem', color: '#374151', marginTop: 4 }}>{k.label}</div>
                <div style={{ fontSize: '.7rem', color: '#9ca3af', marginTop: 2 }}>{k.sub}</div>
              </div>
            ))}
      </div>

      {/* ── Pending / processing alert (item 12) ───────────────── */}
      {!loading && needsAttention > 0 && (
        <div className="dash-alert" role="button" tabIndex={0} onClick={() => onNavigate?.('orders')}
          onKeyDown={(e) => { if (e.key === 'Enter') onNavigate?.('orders') }}>
          <span className="dash-alert-icon">🔔</span>
          <span className="dash-alert-msg">
            <strong>{needsAttention}</strong> order{needsAttention !== 1 ? 's' : ''} need attention
            {' '}— {pending} pending, {processing} processing.
          </span>
          <span className="dash-alert-cta">Review →</span>
        </div>
      )}

      {/* ── Chart + Donut ──────────────────────────────────────── */}
      <div className="dash-mid-grid">
        {/* Bar chart */}
        <div className="dash-card">
          <div className="dash-card-head">
            <div className="dash-card-title">Revenue vs Orders</div>
            <span style={{ fontSize: '.72rem', fontWeight: 700, color: '#9ca3af' }}>Last 6 months</span>
          </div>
          <div style={{ padding: '16px 20px 8px', height: 220 }}>
            {loading
              ? <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: '100%' }}>
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} style={{ flex: 1, display: 'flex', gap: 3, alignItems: 'flex-end', height: '100%' }}>
                      <Skeleton h={60 + i * 10} w="100%" />
                      <Skeleton h={40 + i * 8}  w="100%" />
                    </div>
                  ))}
                </div>
              : stats?.revenue_chart?.length
              ? <BarChart data={stats.revenue_chart} />
              : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9ca3af', fontSize: '.82rem' }}>
                  No chart data available
                </div>}
          </div>
          <div style={{ padding: '0 20px 14px', display: 'flex', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '.75rem', fontWeight: 700, color: '#6b7280' }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: '#f97316' }} /> Revenue
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '.75rem', fontWeight: 700, color: '#6b7280' }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: '#10b981' }} /> Orders
            </div>
          </div>
        </div>

        {/* Donut */}
        <div className="dash-card">
          <div className="dash-card-head">
            <div className="dash-card-title">Order Status</div>
            <span style={{ fontSize: '.72rem', fontWeight: 700, color: '#9ca3af' }}>All time</span>
          </div>
          <div style={{ padding: '20px' }}>
            {loading
              ? <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                  <Skeleton h={128} w="128px" />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} h={12} />)}
                  </div>
                </div>
              : orderTotal === 0
              ? <div style={{ padding: '24px 0', textAlign: 'center', color: '#9ca3af', fontSize: '.82rem' }}>No order data yet</div>
              : <>
                  <DonutChart segments={donutSegments} total={orderTotal} />
                  <div style={{ fontSize: '.68rem', color: '#9ca3af', marginTop: 14 }}>
                    All-time breakdown across every order status.
                  </div>
                </>}
          </div>
        </div>
      </div>

      {/* ── Recent Orders ──────────────────────────────────────── */}
      <div className="dash-card" style={{ marginBottom: 20 }}>
        <div className="dash-card-head">
          <div className="dash-card-title">Recent Orders</div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', flex: 1, justifyContent: 'center' }}>
            {STATUS_TABS.map((t) => (
              <button key={t} className={`orders-tab-btn ${orderTab === t ? 'active' : ''}`} onClick={() => setOrderTab(t)}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
          <button
            onClick={() => onNavigate?.('orders')}
            style={{ padding: '6px 14px', borderRadius: 8, border: '1.5px solid #e5e7eb', background: '#fff', fontWeight: 700, fontSize: '.78rem', cursor: 'pointer', whiteSpace: 'nowrap', color: '#374151' }}
          >View All →</button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="dash-table">
            <thead>
              <tr>{['Order ID', 'Customer', 'Items', 'Amount', 'Date', 'Status', 'Actions'].map((h) => <th key={h}>{h.toUpperCase()}</th>)}</tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>{Array.from({ length: 7 }).map((_, j) => <td key={j}><Skeleton h={12} /></td>)}</tr>
                  ))
                : filteredOrders.length === 0
                ? <tr>
                    <td colSpan={7} style={{ padding: '40px 20px', textAlign: 'center', color: '#9ca3af', fontWeight: 700, fontSize: '.85rem' }}>
                      No {orderTab === 'All' ? '' : orderTab} orders found
                    </td>
                  </tr>
                : filteredOrders.map((o, idx) => (
                    <tr key={o.id}>
                      <td style={{ fontWeight: 800, color: '#1d4ed8', fontFamily: 'monospace', fontSize: '.8rem' }}>#{o.order_number}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Avatar name={o.customer_name} idx={idx} />
                          <div>
                            <div style={{ fontWeight: 800, fontSize: '.82rem' }}>{o.customer_name}</div>
                            {o.city && <div style={{ fontSize: '.7rem', color: '#9ca3af' }}>{o.city}</div>}
                          </div>
                        </div>
                      </td>
                      <td style={{ color: '#6b7280', fontWeight: 700 }}>
                        {(o.items ?? []).length} item{(o.items ?? []).length !== 1 ? 's' : ''}
                      </td>
                      <td style={{ fontWeight: 900 }}>{fmtMoneyFull(o.total_amount)}</td>
                      <td style={{ color: '#9ca3af', fontWeight: 600, whiteSpace: 'nowrap' }}>{fmtDate(o.created_at)}</td>
                      <td><StatusBadge status={o.status} /></td>
                      <td>
                        <button
                          onClick={() => onNavigate?.('orders')}
                          style={{ width: 28, height: 28, borderRadius: 7, border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: 13, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                        >👁</button>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Bottom grid: Top products | Low stock | Recent activity ── */}
      <div className="dash-bot-grid">

        {/* Top products */}
        <div className="dash-card">
          <div className="dash-card-head"><div className="dash-card-title">Top Products</div></div>
          <div style={{ padding: '12px 20px' }}>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} style={{ padding: '10px 0', borderBottom: '1px solid #fafafa' }}><Skeleton h={38} /></div>
                ))
              : !stats?.top_products?.length
              ? <div style={{ padding: '24px 0', textAlign: 'center', color: '#9ca3af', fontSize: '.82rem' }}>No product data</div>
              : (() => {
                  const maxSold = Math.max(...stats.top_products.map((x) => x.sold), 1)
                  return stats.top_products.map((p, i) => (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < stats.top_products.length - 1 ? '1px solid #fafafa' : 'none' }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                        background: ['#fff7ed', '#eff6ff', '#f5f3ff', '#f0fdf4', '#fff0f6'][i % 5],
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                      }}>🧸</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 800, fontSize: '.82rem', color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                          <div style={{ flex: 1, height: 5, borderRadius: 3, background: '#f3f4f6', overflow: 'hidden' }}>
                            <div style={{ height: '100%', borderRadius: 3, width: `${(p.sold / maxSold) * 100}%`, background: 'linear-gradient(90deg, #f97316, #fb923c)', transition: 'width .5s ease' }} />
                          </div>
                          <span style={{ fontSize: '.7rem', fontWeight: 800, color: '#6b7280', flexShrink: 0 }}>{p.sold} sold</span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontWeight: 900, fontSize: '.85rem', color: '#111' }}>{fmtMoneyFull(p.price)}</div>
                        <div style={{ fontSize: '.68rem', color: '#9ca3af', fontWeight: 600 }}>{p.category}</div>
                      </div>
                    </div>
                  ))
                })()}
          </div>
        </div>

        {/* Low stock (item 11) */}
        <LowStockCard fetcher={fetchLowStock} threshold={10} onNavigate={onNavigate} />

        {/* Recent activity (item 9) */}
        <div className="dash-card">
          <div className="dash-card-head">
            <div className="dash-card-title">Recent Activity</div>
            <button
              onClick={refetch}
              style={{ padding: '4px 10px', borderRadius: 6, border: '1.5px solid #e5e7eb', background: '#fff', fontWeight: 700, fontSize: '.72rem', cursor: 'pointer', color: '#374151' }}
            >↻</button>
          </div>
          <div style={{ padding: '8px 20px 16px' }}>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => <div key={i} className="dash-act-row"><Skeleton h={36} /></div>)
              : recentOrders.length === 0
              ? <div style={{ padding: '24px 0', textAlign: 'center', color: '#9ca3af', fontSize: '.82rem' }}>No recent activity</div>
              : recentOrders.slice(0, 6).map((o) => (
                  <div key={o.id} className="dash-act-row">
                    <div className="dash-act-ico" style={{ background: '#f0fdf4' }}>📦</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: '.8rem', color: '#111' }}>
                        #{o.order_number}
                        <span style={{ fontWeight: 600, color: '#6b7280', marginLeft: 6 }}>{fmtMoneyFull(o.total_amount)}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                        <StatusBadge status={o.status} />
                        <span style={{ fontSize: '.68rem', color: '#9ca3af' }}>{fmtDate(o.updated_at || o.created_at)}</span>
                      </div>
                    </div>
                  </div>
                ))}
          </div>
        </div>
      </div>
    </>
  )
}