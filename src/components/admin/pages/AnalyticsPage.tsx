'use client'

import { useState } from 'react'
import { useAdminFetch } from '@/hooks/useAdminFetch'
import AnalyticsCard from '@/components/admin/analytics/AnalyticsCard'
import ChartCard from '@/components/admin/analytics/ChartCard'
import DateRangeFilter from '@/components/admin/analytics/DateRangeFilter'
import {
  fetchAnalyticsOverview, fetchAnalyticsRevenue, fetchAnalyticsProducts,
  fetchAnalyticsOrders, fetchAnalyticsCustomers,
  type AnalyticsRange,
} from '@/lib/adminApi'

function fmtMoney(n: number): string {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`
  if (n >= 100000)   return `₹${(n / 100000).toFixed(2)}L`
  if (n >= 1000)     return `₹${(n / 1000).toFixed(1)}K`
  return `₹${Math.round(n)}`
}
const fmtNum = (n: number) => n.toLocaleString('en-IN')

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: '.78rem', fontWeight: 900, color: 'var(--muted,#9ca3af)', textTransform: 'uppercase', letterSpacing: '.06em', margin: '24px 0 12px' }}>{children}</div>
}

function ErrorRetry({ msg, onRetry }: { msg: string; onRetry: () => void }) {
  return (
    <div className="card" style={{ padding: 20, textAlign: 'center', color: 'var(--coral)' }}>
      ⚠️ {msg} <button className="btn btn-outline btn-sm" style={{ marginLeft: 12 }} onClick={onRetry}>Retry</button>
    </div>
  )
}

function MiniListCard({ title, rows, empty }: { title: string; rows: { left: string; right: string; sub?: string }[]; empty: string }) {
  return (
    <div className="card">
      <div className="card-head"><div className="card-title">{title}</div></div>
      <div style={{ padding: '4px 16px 12px' }}>
        {rows.length === 0 ? (
          <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--muted,#9ca3af)', fontWeight: 700, fontSize: '.82rem' }}>{empty}</div>
        ) : rows.map((r, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: i < rows.length - 1 ? '1px solid var(--border,#f0f0f0)' : 'none' }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.left}</div>
              {r.sub && <div style={{ fontSize: '.7rem', color: 'var(--muted,#9ca3af)' }}>{r.sub}</div>}
            </div>
            <div style={{ fontWeight: 900, color: 'var(--coral)', fontSize: '.82rem', whiteSpace: 'nowrap', marginLeft: 10 }}>{r.right}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AnalyticsPage() {
  const [range, setRange] = useState<AnalyticsRange>('30d')
  const [start, setStart] = useState<string>()
  const [end,   setEnd]   = useState<string>()

  const ov  = useAdminFetch(() => fetchAnalyticsOverview(), [])
  const rev = useAdminFetch(() => fetchAnalyticsRevenue(range, start, end), [range, start, end])
  const pr  = useAdminFetch(() => fetchAnalyticsProducts(range, start, end), [range, start, end])
  const ord = useAdminFetch(() => fetchAnalyticsOrders(range, start, end), [range, start, end])
  const cust= useAdminFetch(() => fetchAnalyticsCustomers(range, start, end), [range, start, end])

  function applyRange(r: AnalyticsRange, s?: string, e?: string) {
    setRange(r); setStart(s); setEnd(e)
  }

  const o = ov.data
  const r = rev.data
  const p = pr.data
  const od = ord.data
  const c = cust.data

  return (
    <div>
      <div className="page-header">
        <div className="ph-left">
          <div className="ph-title">Analytics</div>
          <div className="ph-sub">Revenue, orders, products & customer insights — live data</div>
        </div>
        <div className="ph-actions">
          <button className="btn btn-ghost btn-sm" onClick={() => { ov.refetch(); rev.refetch(); pr.refetch(); ord.refetch(); cust.refetch() }}>↻</button>
        </div>
      </div>

      {/* ── OVERVIEW (all-time KPIs) ── */}
      <SectionTitle>Overview</SectionTitle>
      {ov.error ? <ErrorRetry msg={ov.error} onRetry={ov.refetch} /> : (
        <div className="stats-row" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(170px,1fr))', display: 'grid', gap: 12 }}>
          {ov.loading || !o ? (
            Array.from({ length: 8 }).map((_, i) => <div key={i} className="card" style={{ height: 116, background: 'var(--soft-2,#f5f5f5)' }} />)
          ) : (
            <>
              <AnalyticsCard icon="💰" label="Total Revenue"   value={fmtMoney(o.total_revenue)} accent="var(--coral)" />
              <AnalyticsCard icon="📅" label="Revenue (Month)" value={fmtMoney(o.revenue_this_month)} trend={o.revenue_trend} accent="var(--sky)" />
              <AnalyticsCard icon="🧾" label="Total Orders"    value={fmtNum(o.total_orders)} accent="var(--sun)" />
              <AnalyticsCard icon="📊" label="Avg Order Value" value={fmtMoney(o.avg_order_value)} accent="var(--mint)" />
              <AnalyticsCard icon="👥" label="Customers"       value={fmtNum(o.total_customers)} sub={`${o.new_customers_month} new this month`} accent="var(--lilac,#a78bfa)" />
              <AnalyticsCard icon="🔁" label="Returning"       value={fmtNum(o.returning_customers)} sub="2+ orders" accent="var(--coral)" />
              <AnalyticsCard icon="❌" label="Cancelled Rate"  value={`${o.cancelled_rate.toFixed(1)}%`} accent="#dc2626" />
              <AnalyticsCard icon="📦" label="Low / Out Stock" value={`${o.low_stock_count} / ${o.out_of_stock_count}`} accent="var(--sun)" />
            </>
          )}
        </div>
      )}
      {o?.best_seller && (
        <div className="card" style={{ padding: '14px 18px', marginTop: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 22 }}>🏆</span>
          <div><span style={{ fontWeight: 700, color: 'var(--muted,#9ca3af)', fontSize: '.78rem' }}>Best Seller:&nbsp;</span>
          <span style={{ fontWeight: 900 }}>{o.best_seller.name}</span>
          <span style={{ color: 'var(--muted,#9ca3af)', fontSize: '.8rem' }}> — {fmtNum(o.best_seller.units)} units sold</span></div>
        </div>
      )}

      {/* ── DATE RANGE (applies to sections below) ── */}
      <div style={{ margin: '24px 0 4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <SectionTitle>Revenue & Orders</SectionTitle>
        <DateRangeFilter range={range} start={start} end={end} onChange={applyRange} />
      </div>

      {/* ── REVENUE ── */}
      {rev.error ? <ErrorRetry msg={rev.error} onRetry={rev.refetch} /> : (
        <>
          <div className="stats-row" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(170px,1fr))', display: 'grid', gap: 12, marginBottom: 6 }}>
            {rev.loading || !r ? (
              Array.from({ length: 3 }).map((_, i) => <div key={i} className="card" style={{ height: 100, background: 'var(--soft-2,#f5f5f5)' }} />)
            ) : (
              <>
                <AnalyticsCard icon="💰" label={`Revenue (${range})`} value={fmtMoney(r.total_revenue)} trend={r.revenue_trend} sub={`prev: ${fmtMoney(r.prev_revenue)}`} accent="var(--coral)" />
                <AnalyticsCard icon="🧾" label={`Orders (${range})`} value={fmtNum(r.total_orders)} trend={r.orders_trend} sub={`prev: ${fmtNum(r.prev_orders)}`} accent="var(--sky)" />
                <AnalyticsCard icon="📊" label="Avg Order Value" value={fmtMoney(r.avg_order_value)} accent="var(--mint)" />
              </>
            )}
          </div>
          <ChartCard
            title="Revenue & Orders Trend"
            loading={rev.loading}
            empty={!r || r.series.length === 0}
            bars={r?.series.map(s => ({ label: s.label, primary: s.revenue, secondary: s.orders })) ?? []}
            primaryLabel="Revenue" secondaryLabel="Orders"
            formatPrimary={fmtMoney}
          />
        </>
      )}

      {/* ── ORDERS ── */}
      <SectionTitle>Orders</SectionTitle>
      {ord.error ? <ErrorRetry msg={ord.error} onRetry={ord.refetch} /> : (
        <>
          <div className="stats-row" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', display: 'grid', gap: 12, marginBottom: 12 }}>
            {ord.loading || !od ? (
              Array.from({ length: 6 }).map((_, i) => <div key={i} className="card" style={{ height: 90, background: 'var(--soft-2,#f5f5f5)' }} />)
            ) : (
              [
                { k: 'Pending',    v: od.status_counts.pending,    c: 'var(--sun)' },
                { k: 'Processing', v: od.status_counts.processing, c: 'var(--sky)' },
                { k: 'Confirmed',  v: od.status_counts.confirmed,  c: 'var(--lilac,#a78bfa)' },
                { k: 'Shipped',    v: od.status_counts.shipped,    c: 'var(--mint)' },
                { k: 'Delivered',  v: od.status_counts.delivered,  c: '#15803d' },
                { k: 'Cancelled',  v: od.status_counts.cancelled,  c: '#dc2626' },
              ].map(s => (
                <div key={s.k} className="card" style={{ padding: 14 }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: s.c }}>{fmtNum(s.v)}</div>
                  <div style={{ fontSize: '.74rem', fontWeight: 700, color: 'var(--muted,#9ca3af)' }}>{s.k}</div>
                </div>
              ))
            )}
          </div>
          <ChartCard
            title="Order Trend"
            loading={ord.loading}
            empty={!od || od.trend.length === 0}
            bars={od?.trend.map(t => ({ label: t.label, primary: t.orders })) ?? []}
            primaryLabel="Orders"
            formatPrimary={fmtNum}
          />
          {od?.payment_available && od.payment_breakdown.length > 0 && (
            <MiniListCard
              title="Payment Status (gateway)"
              rows={od.payment_breakdown.map(pb => ({ left: pb.status.charAt(0).toUpperCase() + pb.status.slice(1), right: fmtNum(pb.count) }))}
              empty="No payment records"
            />
          )}
        </>
      )}

      {/* ── PRODUCTS ── */}
      <SectionTitle>Products</SectionTitle>
      {pr.error ? <ErrorRetry msg={pr.error} onRetry={pr.refetch} /> : (
        <div className="dash-grid">
          <MiniListCard
            title="Top Selling Products"
            rows={(p?.top_products ?? []).map(t => ({ left: t.name, sub: `${t.category} · ${fmtNum(t.units)} units`, right: fmtMoney(t.revenue) }))}
            empty={pr.loading ? 'Loading…' : 'No sales in this range'}
          />
          <MiniListCard
            title="Slow Moving Products"
            rows={(p?.slow_products ?? []).map(t => ({ left: t.name, sub: t.category, right: `${fmtNum(t.units)} sold` }))}
            empty={pr.loading ? 'Loading…' : 'No products'}
          />
          <MiniListCard
            title="Low Stock"
            rows={(p?.low_stock ?? []).map(t => ({ left: t.name, sub: t.category, right: `${t.count} left` }))}
            empty={pr.loading ? 'Loading…' : '✅ All well stocked'}
          />
          <MiniListCard
            title="Out of Stock"
            rows={(p?.out_of_stock ?? []).map(t => ({ left: t.name, sub: t.category, right: '0' }))}
            empty={pr.loading ? 'Loading…' : '✅ Nothing out of stock'}
          />
          <MiniListCard
            title="Category Sales"
            rows={(p?.category_sales ?? []).map(cs => ({ left: cs.category, sub: `${fmtNum(cs.units)} units`, right: fmtMoney(cs.revenue) }))}
            empty={pr.loading ? 'Loading…' : 'No category sales'}
          />
        </div>
      )}

      {/* ── CUSTOMERS ── */}
      <SectionTitle>Customers</SectionTitle>
      {cust.error ? <ErrorRetry msg={cust.error} onRetry={cust.refetch} /> : (
        <>
          <div className="stats-row" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', display: 'grid', gap: 12, marginBottom: 12 }}>
            {cust.loading || !c ? (
              Array.from({ length: 4 }).map((_, i) => <div key={i} className="card" style={{ height: 90, background: 'var(--soft-2,#f5f5f5)' }} />)
            ) : (
              <>
                <AnalyticsCard icon="🆕" label={`New (${range})`} value={fmtNum(c.new_in_window)} accent="var(--sky)" />
                <AnalyticsCard icon="🔁" label="Repeat Customers" value={fmtNum(c.order_frequency.repeat)} sub="2+ orders" accent="var(--coral)" />
                <AnalyticsCard icon="1️⃣" label="One-time Buyers" value={fmtNum(c.order_frequency.one)} accent="var(--sun)" />
                <AnalyticsCard icon="⭐" label="3+ Orders" value={fmtNum(c.order_frequency.three_plus)} accent="var(--mint)" />
              </>
            )}
          </div>
          <ChartCard
            title="New Customer Trend"
            loading={cust.loading}
            empty={!c || c.new_trend.length === 0}
            bars={c?.new_trend.map(t => ({ label: t.label, primary: t.customers })) ?? []}
            primaryLabel="New customers"
            formatPrimary={fmtNum}
          />
          <div className="dash-grid">
            <MiniListCard
              title="Top Customers by Spend"
              rows={(c?.top_customers ?? []).map(tc => ({ left: tc.name, sub: `${fmtNum(tc.orders)} orders`, right: fmtMoney(tc.spent) }))}
              empty={cust.loading ? 'Loading…' : 'No customers'}
            />
            <MiniListCard
              title={`Top Cities${c ? ` (${fmtNum(c.city_coverage)} with address)` : ''}`}
              rows={(c?.city_breakdown ?? []).map(cb => ({ left: cb.city, right: `${fmtNum(cb.customers)}` }))}
              empty={cust.loading ? 'Loading…' : 'No address data'}
            />
          </div>
        </>
      )}
    </div>
  )
}