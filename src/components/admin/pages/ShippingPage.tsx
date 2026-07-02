'use client'

import { useState, useMemo } from 'react'
import { useAdminFetch } from '@/hooks/useAdminFetch'
import {
  fetchShipmentsSummary, fetchShipments, fetchShipment,
  SHIP_STATUS_LABEL, SHIP_STATUS_PILL, FAILURE_REASON_LABEL,
  type ShipmentSummaryRow, type ShipmentDetail,
} from '@/lib/adminShipmentsApi'
import { fetchAwaitingShipment, createShipment, type AwaitingOrderRow } from '@/lib/adminShipmentsApi'
import { ShipmentActions, BulkActionsBar } from './ShipmentModals'
import { CouriersDrawer } from './CouriersDrawer'

const PLACEHOLDER = '/images/placeholder-product.png'

const STATUS_FILTERS = ['all', 'ready_to_pack', 'packed', 'label_generated', 'pickup_scheduled',
  'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'delivery_failed',
  'rto_initiated', 'returned_to_origin', 'cancelled']

function fmt(s?: string | null): string {
  if (!s) return '—'
  const d = new Date(s); return isNaN(d.getTime()) ? '—' : d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
function inr(n: number | null | undefined): string { return `₹${Number(n || 0).toLocaleString('en-IN')}` }

/* ════════════════ DASHBOARD ════════════════ */
function Dashboard({ onPickStatus }: { onPickStatus: (s: string) => void }) {
  const { data, loading, error, refetch } = useAdminFetch(() => fetchShipmentsSummary(), [])
  if (loading) {
    return <div className="stat-grid">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="ll-skeleton" style={{ height: 92, borderRadius: 'var(--r)' }} />)}</div>
  }
  if (error) return <div className="ll-error">⚠️ {error} <button className="btn btn-outline btn-sm" onClick={refetch}>Retry</button></div>
  if (!data) return null

  const cards = [
    { label: 'Pending Packing',  value: data.pending_packing,  filter: 'ready_to_pack',   color: '#b45309', bg: '#fffbeb' },
    { label: 'Ready for Pickup', value: data.ready_for_pickup, filter: 'packed',          color: '#1d4ed8', bg: '#eff6ff' },
    { label: 'In Transit',       value: data.in_transit,       filter: 'in_transit',      color: '#0369a1', bg: '#f0f9ff' },
    { label: 'Out for Delivery', value: data.out_for_delivery, filter: 'out_for_delivery',color: '#6d28d9', bg: '#f5f3ff' },
    { label: 'Delivered',        value: data.delivered,        filter: 'delivered',       color: '#15803d', bg: '#ecfdf5' },
    { label: 'Failed',           value: data.failed,           filter: 'delivery_failed', color: '#b91c1c', bg: '#fef2f2' },
    { label: 'RTO',              value: data.rto,              filter: 'rto_initiated',   color: '#b91c1c', bg: '#fef2f2' },
    { label: 'COD to Remit',     value: data.cod_remittance_pending, filter: '',          color: '#a16207', bg: '#fefce8' },
  ]
  return (
    <div className="stat-grid" style={{ marginBottom: 22 }}>
      {cards.map(c => (
        <button key={c.label} type="button" className="stat-card" style={{ textAlign: 'left', cursor: c.filter ? 'pointer' : 'default' }}
          onClick={() => c.filter && onPickStatus(c.filter)}>
          <div className="stat-card-icon" style={{ background: c.bg, color: c.color }}>🚚</div>
          <div className="stat-card-value" style={{ color: c.color }}>{c.value}</div>
          <div className="stat-card-label">{c.label}</div>
        </button>
      ))}
    </div>
  )
}

/* ════════════════ READ-ONLY DRAWER (Stage 5 adds action modals) ════════════════ */
function ShipmentDrawer({ shipmentId, onClose, onChanged }: { shipmentId: string; onClose: () => void; onChanged: () => void }) {
  const { data: d, loading, error, refetch } = useAdminFetch<ShipmentDetail>(() => fetchShipment(shipmentId), [shipmentId])
  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer" style={{ width: 640, maxWidth: '96vw' }} onClick={e => e.stopPropagation()}>
        <div className="drawer-head">
          <div className="drawer-title">Shipment {d ? `#${d.order?.order_number ?? d.id.slice(0, 8).toUpperCase()}` : ''}</div>
          <button className="drawer-close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="drawer-body">
          {loading ? (
            <>{[1, 2, 3].map(i => <div key={i} className="ll-skeleton" style={{ height: 40, marginBottom: 10 }} />)}</>
          ) : error ? (
            <div className="ll-error">⚠️ {error} <button className="btn btn-outline btn-sm" onClick={refetch}>Retry</button></div>
          ) : d ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
                <span className={`pill ${SHIP_STATUS_PILL[d.status] ?? 'pill-grey'}`}>{SHIP_STATUS_LABEL[d.status] ?? d.status}</span>
                <span className="tag tag-regular">{d.is_prepaid ? 'Prepaid' : 'COD'}</span>
                {d.awb_number && <span style={{ fontSize: '.78rem', color: 'var(--muted)' }}>AWB {d.awb_number}</span>}
              </div>

              <div className="form-grid form-grid-2" style={{ marginBottom: 14 }}>
                <div className="card" style={{ padding: 12 }}>
                  <div className="form-label">Customer</div>
                  <div style={{ fontWeight: 800, fontSize: '.84rem' }}>{d.customer?.name || '—'}</div>
                  <div style={{ fontSize: '.74rem', color: 'var(--muted)' }}>{d.customer?.phone}</div>
                  <div style={{ fontSize: '.74rem', color: 'var(--muted)' }}>{d.customer?.email}</div>
                </div>
                <div className="card" style={{ padding: 12 }}>
                  <div className="form-label">Ship to</div>
                  <div style={{ fontSize: '.8rem' }}>{d.ship_name}</div>
                  <div style={{ fontSize: '.74rem', color: 'var(--muted)' }}>{d.ship_line1}</div>
                  <div style={{ fontSize: '.74rem', color: 'var(--muted)' }}>{[d.ship_city, d.ship_state].filter(Boolean).join(', ')} {d.ship_pincode}</div>
                </div>
              </div>

              {!d.is_prepaid && (
                <div className="card" style={{ padding: 12, marginBottom: 14 }}>
                  <div className="form-label">COD</div>
                  <div style={{ fontSize: '.82rem' }}>
                    {inr(d.cod_amount)} · {d.cod_collected ? 'Collected' : 'Not collected'}{d.cod_remitted ? ` · Remitted${d.cod_remittance_reference ? ` (${d.cod_remittance_reference})` : ''}` : ''}
                  </div>
                </div>
              )}

              <div className="form-label" style={{ marginBottom: 6 }}>Courier & package</div>
              <div className="card" style={{ padding: 12, marginBottom: 14, fontSize: '.8rem' }}>
                <div>Courier: {d.courier_name || '—'}{d.courier_service ? ` · ${d.courier_service}` : ''}</div>
                {d.tracking_url && <div>Tracking: <a href={d.tracking_url} target="_blank" rel="noopener" style={{ color: 'var(--coral)' }}>{d.tracking_url}</a></div>}
                <div>Weight: {d.package_weight ? `${d.package_weight} kg` : '—'} · Dims: {[d.package_length, d.package_width, d.package_height].some(Boolean) ? `${d.package_length || '?'}×${d.package_width || '?'}×${d.package_height || '?'} cm` : '—'}</div>
                {d.label_url && <div>Label: <a href={d.label_url} target="_blank" rel="noopener" style={{ color: 'var(--coral)' }}>View label</a></div>}
                {d.expected_delivery_date && <div>Expected: {d.expected_delivery_date}</div>}
              </div>

              <div className="form-label" style={{ marginBottom: 6 }}>Items</div>
              <div className="table-wrap" style={{ marginBottom: 14 }}>
                <table className="resp-table">
                  <thead><tr><th>Product</th><th>Qty</th><th>Condition</th><th>Restocked</th></tr></thead>
                  <tbody>
                    {d.items.map(it => (
                      <tr key={it.id}>
                        <td data-label="Product" style={{ fontWeight: 700 }}>{it.product_name || '—'}{it.current_stock != null && <div className="td-muted">stock: {it.current_stock}</div>}</td>
                        <td data-label="Qty">{it.quantity}</td>
                        <td data-label="Condition" style={{ textTransform: 'capitalize' }}>{it.condition_status}</td>
                        <td data-label="Restocked">{it.restock_quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {d.attempts.length > 0 && (
                <>
                  <div className="form-label" style={{ marginBottom: 6 }}>Delivery attempts</div>
                  <div className="table-wrap" style={{ marginBottom: 14 }}>
                    <table className="resp-table">
                      <thead><tr><th>#</th><th>Status</th><th>Reason</th><th>When</th><th>Next</th></tr></thead>
                      <tbody>
                        {d.attempts.map(a => (
                          <tr key={a.id}>
                            <td data-label="#">{a.attempt_number}</td>
                            <td data-label="Status" style={{ textTransform: 'capitalize' }}>{a.status}</td>
                            <td data-label="Reason">{a.failure_reason ? (FAILURE_REASON_LABEL[a.failure_reason] ?? a.failure_reason) : '—'}</td>
                            <td data-label="When" className="td-muted">{fmt(a.attempted_at)}</td>
                            <td data-label="Next" className="td-muted">{fmt(a.next_attempt_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {d.admin_notes && (
                <div className="card" style={{ padding: 12, marginBottom: 14 }}>
                  <div className="form-label">Internal notes</div>
                  <div style={{ fontSize: '.82rem' }}>{d.admin_notes}</div>
                </div>
              )}

              <div className="form-label" style={{ margin: '14px 0 8px' }}>Timeline</div>
              <div className="ret-timeline">
                {d.status_history.map((h, i) => (
                  <div key={h.id} className="ret-tl-item">
                    <div className="ret-tl-dot-wrap">
                      <span className="ret-tl-dot" />
                      {i < d.status_history.length - 1 && <span className="ret-tl-line" />}
                    </div>
                    <div className="ret-tl-body">
                      <div className="ret-tl-status">{SHIP_STATUS_LABEL[h.new_status] ?? h.new_status}</div>
                      {h.note && <div className="ret-tl-note">{h.note}</div>}
                      <div className="ret-tl-date">{fmt(h.created_at)}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 16, padding: 12, background: 'var(--soft-2)', borderRadius: 'var(--r-sm)', fontSize: '.78rem', color: 'var(--muted)' }}>
                Lifecycle actions (pack, assign courier, pickup, deliver, RTO, COD) arrive in the next update.
              </div>
            </>
          ) : null}
        </div>
         <div className="drawer-foot" style={{ flexWrap: 'wrap', justifyContent: 'flex-start', gap: 8 }}>
          {d && <ShipmentActions shipment={d} onDone={() => { refetch(); onChanged() }} />}
          <button className="btn btn-ghost" style={{ marginLeft: 'auto' }} onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}

function AwaitingPanel({ onCreated }: { onCreated: (shipmentId: string) => void }) {
  const { data, loading, error, refetch } = useAdminFetch(() => fetchAwaitingShipment({ limit: 50 }), [])
  const [creatingId, setCreatingId] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const rows: AwaitingOrderRow[] = data?.data ?? []
  const total = data?.totalCount ?? 0

  async function create(orderId: string) {
    setCreatingId(orderId); setErr(null)
    try {
      const sh = await createShipment({ order_id: orderId })
      await refetch()
      onCreated(sh.id)
    } catch (e: any) {
      setErr(e?.message || 'Failed to create shipment')
    } finally {
      setCreatingId(null)
    }
  }

  if (!loading && !error && rows.length === 0) return null // nothing to ship → hide

  return (
    <div className="card" style={{ marginBottom: 18, borderLeft: '4px solid var(--coral)' }}>
      <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: collapsed ? 'none' : '1px solid var(--border)' }}>
        <span style={{ fontWeight: 900, fontSize: '.92rem' }}>📥 Awaiting Shipment</span>
        <span className="pill pill-yellow">{loading ? '…' : total}</span>
        <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }} onClick={() => setCollapsed(c => !c)}>
          {collapsed ? 'Show' : 'Hide'}
        </button>
        <button className="btn btn-ghost btn-sm" onClick={refetch}>↻</button>
      </div>
      {!collapsed && (
        <div style={{ padding: '10px 16px' }}>
          {err && <div className="ll-error" style={{ marginBottom: 10 }}>⚠️ {err}</div>}
          {loading ? (
            <>{[1, 2, 3].map(i => <div key={i} className="ll-skeleton" style={{ height: 40, marginBottom: 8 }} />)}</>
          ) : error ? (
            <div className="ll-error">⚠️ {error} <button className="btn btn-outline btn-sm" onClick={refetch}>Retry</button></div>
          ) : (
            <div className="table-wrap">
              <table className="resp-table">
                <thead><tr><th>Order</th><th>Customer</th><th>Payment</th><th>Items</th><th>Placed</th><th></th></tr></thead>
                <tbody>
                  {rows.map(o => (
                    <tr key={o.order_id}>
                      <td data-label="Order" className="td-id">#{o.order_number}<div className="td-muted" style={{ textTransform: 'capitalize' }}>{o.status}</div></td>
                      <td data-label="Customer">{o.customer_name || '—'}<div className="td-muted">{o.customer_phone}</div></td>
                      <td data-label="Payment">{o.is_prepaid ? 'Prepaid' : 'COD'}<div className="td-muted">{inr(o.total_amount)}</div></td>
                      <td data-label="Items">{o.item_count}{o.line_count !== o.item_count ? <span className="td-muted"> ({o.line_count} lines)</span> : null}</td>
                      <td data-label="Placed" className="td-muted">{fmt(o.created_at)}</td>
                      <td data-label="">
                        <button className="btn btn-primary btn-sm" style={{ width: '100%' }} disabled={creatingId === o.order_id} onClick={() => create(o.order_id)}>
                          {creatingId === o.order_id ? 'Creating…' : '🚚 Create Shipment'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ════════════════ PAGE ════════════════ */
export default function ShippingPage() {
  const [statusFilter, setStatusFilter] = useState('all')
  const [payment, setPayment] = useState('all')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [sort, setSort] = useState('latest')
  const [page, setPage] = useState(0)
  const [openId, setOpenId] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [couriersOpen, setCouriersOpen] = useState(false)
  const LIMIT = 20

  const { data, loading, error, refetch } = useAdminFetch(
    () => fetchShipments({
      skip: page * LIMIT, limit: LIMIT,
      status: statusFilter === 'all' ? undefined : statusFilter,
      payment: payment === 'all' ? undefined : payment,
      search: search || undefined, sort,
    }),
    [statusFilter, payment, search, sort, page],
  )

  const rows: ShipmentSummaryRow[] = data?.data ?? []
  const total = data?.totalCount ?? 0
  const totalPages = Math.max(1, Math.ceil(total / LIMIT))

  const allOnPageSelected = rows.length > 0 && rows.every(r => selected.has(r.id))
  function toggleAll() {
    setSelected(prev => {
      const next = new Set(prev)
      if (allOnPageSelected) rows.forEach(r => next.delete(r.id))
      else rows.forEach(r => next.add(r.id))
      return next
    })
  }
  function toggleOne(id: string) {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  function exportCsv() {
    const header = ['Order', 'Status', 'Payment', 'COD', 'Courier', 'AWB', 'Customer', 'Phone', 'City', 'Pincode', 'Items', 'Created']
    const lines = rows.filter(r => selected.size === 0 || selected.has(r.id)).map(r => [
      r.order_number, SHIP_STATUS_LABEL[r.status] ?? r.status, r.is_prepaid ? 'Prepaid' : 'COD',
      r.cod_amount ?? '', r.courier_name ?? '', r.awb_number ?? '', r.customer_name, r.customer_phone,
      r.ship_city ?? '', r.ship_pincode ?? '', r.item_count, r.created_at,
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    const blob = new Blob([[header.join(','), ...lines].join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `shipments-${Date.now()}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <style>{`
        @media (max-width: 768px) {
          .resp-table thead { display: none; }
          .resp-table, .resp-table tbody { display: block; width: 100%; }
          .resp-table tr {
            display: block; border: 1px solid var(--border);
            border-radius: var(--r-sm); margin-bottom: 10px; padding: 4px 2px; background: #fff;
          }
          .resp-table td {
            display: flex; justify-content: space-between; align-items: flex-start; gap: 14px;
            padding: 7px 12px; border: none; text-align: right; font-size: .82rem;
          }
          .resp-table td::before {
            content: attr(data-label);
            font-weight: 700; font-size: .68rem; color: var(--muted);
            text-transform: uppercase; letter-spacing: .04em;
            text-align: left; flex-shrink: 0; padding-top: 2px;
          }
          .resp-table td .td-muted { text-align: right; }
          .ship-filters > div { flex-direction: column !important; align-items: stretch !important; }
          .ship-filters .form-select,
          .ship-filters .tb-search { max-width: none !important; width: 100% !important; }
          .ship-filters .btn { width: 100%; }
          .ship-modal .form-grid-2 { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <div className="page-header">
        <div className="ph-left">
          <div className="ph-title">Shipping</div>
          <div className="ph-sub">{total} shipment{total !== 1 ? 's' : ''}</div>
        </div>
        <div className="ph-right" style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline btn-sm" onClick={() => setCouriersOpen(true)}>🚚 Couriers</button>
          <button className="btn btn-outline btn-sm" onClick={exportCsv} disabled={rows.length === 0}>
            ⬇ Export CSV{selected.size > 0 ? ` (${selected.size})` : ''}
          </button>
        </div>
      </div>

       <AwaitingPanel onCreated={(shipmentId) => { setOpenId(shipmentId); refetch() }} />

      <Dashboard onPickStatus={(s) => { setStatusFilter(s); setPage(0) }} />

      {/* Filters */}
    <div className="card ship-filters" style={{ padding: 14, marginBottom: 18 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <select className="form-select" style={{ maxWidth: 200 }} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(0) }}>
            {STATUS_FILTERS.map(s => <option key={s} value={s}>{s === 'all' ? 'All statuses' : (SHIP_STATUS_LABEL[s] ?? s)}</option>)}
          </select>
          <select className="form-select" style={{ maxWidth: 150 }} value={payment} onChange={e => { setPayment(e.target.value); setPage(0) }}>
            <option value="all">All payments</option><option value="prepaid">Prepaid</option><option value="cod">COD</option>
          </select>
          <select className="form-select" style={{ maxWidth: 160 }} value={sort} onChange={e => { setSort(e.target.value); setPage(0) }}>
            <option value="latest">Latest</option><option value="oldest">Oldest</option>
            <option value="status">By status</option><option value="deadline">By deadline</option>
          </select>
          <div className="tb-search" style={{ width: 240 }}>
            <input type="text" placeholder="Order id, customer, phone, AWB…" value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { setSearch(searchInput.trim()); setPage(0) } }} />
            {searchInput && <button className="tb-search-clear" onClick={() => { setSearchInput(''); setSearch(''); setPage(0) }} aria-label="Clear">×</button>}
          </div>
          <button className="btn btn-outline btn-sm" onClick={() => { setSearch(searchInput.trim()); setPage(0) }}>Search</button>
        </div>
        {selected.size > 0 && (
          <BulkActionsBar rows={rows} selected={selected} onClear={() => setSelected(new Set())} onDone={() => { refetch(); setSelected(new Set()) }} />
        )}
      </div>

      {/* List */}
      <div className="card">
        <div className="table-wrap">
          <table className="resp-table">
            <thead>
              <tr>
                <th style={{ width: 36 }}><input type="checkbox" checked={allOnPageSelected} onChange={toggleAll} aria-label="Select all" /></th>
                <th>Order</th><th>Customer</th><th>Payment</th><th>Courier / AWB</th><th>Destination</th><th>Items</th><th>Status</th><th>Created</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 9 }).map((_, j) => <td key={j}><div className="ll-skeleton" style={{ height: 14 }} /></td>)}</tr>
                ))
              ) : error ? (
                <tr><td colSpan={9}><div className="ll-error">⚠️ {error} <button className="btn btn-outline btn-sm" onClick={refetch}>Retry</button></div></td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={9}><div className="ll-empty"><div className="ll-empty-icon">🚚</div>No shipments found</div></td></tr>
              ) : (
                rows.map(r => (
                  <tr key={r.id} className="is-clickable" onClick={() => setOpenId(r.id)}>
                    <td data-label="Select" onClick={e => e.stopPropagation()}>
                      <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggleOne(r.id)} aria-label="Select" />
                    </td>
                    <td data-label="Order" className="td-id">#{r.order_number}</td>
                    <td data-label="Customer">{r.customer_name || '—'}<div className="td-muted">{r.customer_phone}</div></td>
                    <td data-label="Payment">{r.is_prepaid ? 'Prepaid' : <span>COD<div className="td-muted">{inr(r.cod_amount)}{r.cod_remitted ? ' · remitted' : r.cod_collected ? ' · collected' : ''}</div></span>}</td>
                    <td data-label="Courier / AWB">{r.courier_name || '—'}{r.awb_number && <div className="td-muted">{r.awb_number}</div>}</td>
                    <td data-label="Destination">{r.ship_city || '—'}<div className="td-muted">{r.ship_pincode}</div></td>
                    <td data-label="Items">{r.item_count}</td>
                    <td data-label="Status"><span className={`pill ${SHIP_STATUS_PILL[r.status] ?? 'pill-grey'}`}>{SHIP_STATUS_LABEL[r.status] ?? r.status}</span></td>
                    <td data-label="Created" className="td-muted">{fmt(r.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="card-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button className="btn btn-outline btn-sm" disabled={page <= 0} onClick={() => setPage(p => Math.max(0, p - 1))}>‹ Prev</button>
            <span style={{ fontSize: '.78rem', color: 'var(--muted)' }}>Page {page + 1} of {totalPages}</span>
            <button className="btn btn-outline btn-sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}>Next ›</button>
          </div>
        )}
      </div>

        {openId && <ShipmentDrawer shipmentId={openId} onClose={() => setOpenId(null)} onChanged={refetch} />}
      {couriersOpen && <CouriersDrawer onClose={() => setCouriersOpen(false)} />}
    </div>
  )
}