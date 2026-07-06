'use client'

import React, { useState, useEffect } from 'react'
import { useAdminFetch } from '@/hooks/useAdminFetch'
import { fmtMoneyFull, fmtDate } from '@/lib/format'
import OrderReceipt from '@/components/admin/orders/OrderReceipt'
import {
  fetchAdminOrders, updateOrderStatus, deleteOrder,
  type ApiOrder, type ApiOrdersResult,
} from '@/lib/adminApi'
import { createShipment, fetchShipmentsByOrders } from '@/lib/adminShipmentsApi'

const LIMIT = 15
const ALL_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']

const STATUS_STYLE: Record<string, { bg: string; color: string; dot: string }> = {
  pending:    { bg: '#fef9c3', color: '#a16207', dot: '#ca8a04' },
  confirmed:  { bg: '#dbeafe', color: '#1d4ed8', dot: '#2563eb' },
  processing: { bg: '#e0e7ff', color: '#4338ca', dot: '#6366f1' },
  shipped:    { bg: '#e0f2fe', color: '#0369a1', dot: '#0284c7' },
  delivered:  { bg: '#dcfce7', color: '#15803d', dot: '#16a34a' },
  cancelled:  { bg: '#fee2e2', color: '#b91c1c', dot: '#dc2626' },
}

const PAY_STYLE: Record<string, { bg: string; color: string }> = {
  paid:    { bg: '#dcfce7', color: '#15803d' },
  created: { bg: '#fef9c3', color: '#a16207' },
  failed:  { bg: '#fee2e2', color: '#b91c1c' },
}

const AVATAR_BG   = ['#fff1f0', '#fff7e6', '#f0f9ff', '#f9f0ff', '#f0fff4', '#fff0f6']
const AVATAR_TEXT = ['#cf1322', '#d46b08', '#096dd9', '#531dab', '#237804', '#c41d7f']

function initials(name: string) {
  const clean = (name || '').replace(/^#/, '')
  if (!clean) return '?'
  const parts = clean.split(' ').filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return clean.slice(0, 2).toUpperCase()
}

function useDebounce<T>(value: T, ms = 380): T {
  const [dv, setDv] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDv(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return dv
}

// ── Badges / Avatar ───────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLE[(status || '').toLowerCase()] ?? { bg: '#f3f4f6', color: '#374151', dot: '#9ca3af' }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: s.bg, color: s.color, fontSize: '.68rem', fontWeight: 800, padding: '3px 10px', borderRadius: 20, letterSpacing: '.03em', whiteSpace: 'nowrap', textTransform: 'capitalize' }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
      {status}
    </span>
  )
}

function PaymentBadge({ status }: { status: string }) {
  if (!status) {
    return <span style={{ background: '#f3f4f6', color: '#6b7280', fontSize: '.65rem', fontWeight: 800, padding: '3px 9px', borderRadius: 20 }}>Not recorded</span>
  }
  const s = PAY_STYLE[status.toLowerCase()] ?? { bg: '#f3f4f6', color: '#374151' }
  return <span style={{ background: s.bg, color: s.color, fontSize: '.65rem', fontWeight: 800, padding: '3px 9px', borderRadius: 20, textTransform: 'capitalize' }}>{status}</span>
}

function Avatar({ name, idx }: { name: string; idx: number }) {
  const i = idx % AVATAR_BG.length
  return (
    <div style={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0, background: AVATAR_BG[i], color: AVATAR_TEXT[i], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.7rem', fontWeight: 900, border: `1.5px solid ${AVATAR_TEXT[i]}22` }}>
      {initials(name)}
    </div>
  )
}

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 8 }).map((_, j) => (
        <td key={j}>
          <div style={{ height: 13, borderRadius: 6, background: 'linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite', width: j === 1 ? '80%' : j === 7 ? '50%' : '90%' }} />
        </td>
      ))}
    </tr>
  )
}

// ── Drawer sub-bits ───────────────────────────────────────────────

function SectionTitle({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ fontSize: '.7rem', fontWeight: 900, color: '#9ca3af', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '.08em', ...style }}>{children}</div>
}

function InfoGrid({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>{children}</div>
}

function InfoCard({ label, value, span, highlight }: { label: string; value: string; span?: boolean; highlight?: boolean }) {
  return (
    <div style={{ gridColumn: span ? '1 / -1' : undefined, background: '#f9fafb', borderRadius: 8, padding: '9px 12px', border: '1px solid #f0f0f0' }}>
      <div style={{ fontSize: '.65rem', fontWeight: 700, color: '#9ca3af', marginBottom: 3 }}>{label.toUpperCase()}</div>
      <div style={{ fontWeight: highlight ? 900 : 700, fontSize: highlight ? '1rem' : '.85rem', color: highlight ? '#1d4ed8' : '#111827', wordBreak: 'break-all' }}>{value || '—'}</div>
    </div>
  )
}

// ── Order Detail Drawer ───────────────────────────────────────────

function OrderDrawer({ order, onClose, onStatusUpdate, onPrint }: {
  order: ApiOrder
  onClose: () => void
  onStatusUpdate: (id: string, status: string) => Promise<void>
  onPrint: (order: ApiOrder) => void
}) {
  const [updating, setUpdating] = useState(false)
  const [currentStatus, setCurrentStatus] = useState(order.status)
  const [confirmStatus, setConfirmStatus] = useState<string | null>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  async function applyStatus(status: string) {
    setUpdating(true)
    try {
      await onStatusUpdate(order.id, status)
      setCurrentStatus(status)
    } finally {
      setUpdating(false)
      setConfirmStatus(null)
    }
  }

  const paid = !!order.payment_status

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)', display: 'flex', justifyContent: 'flex-end' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 520, maxWidth: '100vw', height: '100%', background: '#fff', display: 'flex', flexDirection: 'column', boxShadow: '-8px 0 40px rgba(0,0,0,0.14)' }}>
        {/* Head */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fafafa' }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: '1.05rem' }}>Order #{order.order_number}</div>
            <div style={{ fontSize: '.72rem', color: '#888', marginTop: 2 }}>Placed on {fmtDate(order.created_at)}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <StatusBadge status={currentStatus} />
            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>×</button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          <SectionTitle>Customer</SectionTitle>
          <InfoGrid>
            <InfoCard label="Name"  value={order.customer_name} />
            <InfoCard label="Phone" value={order.customer_phone} />
            <InfoCard label="Email" value={order.customer_email} span />
            <InfoCard label="User ID" value={order.user_id} span />
          </InfoGrid>

          <SectionTitle style={{ marginTop: 20 }}>Shipping Address</SectionTitle>
          <InfoGrid>
            <InfoCard label="City"    value={`${order.city}${order.state && order.state !== '—' ? ', ' + order.state : ''}`} />
            {order.pincode && order.pincode !== '—' && <InfoCard label="Pincode" value={order.pincode} />}
            <InfoCard label="Address" value={order.address} span />
          </InfoGrid>

          <SectionTitle style={{ marginTop: 20 }}>Payment</SectionTitle>
          {paid ? (
            <InfoGrid>
              <InfoCard label="Status" value={order.payment_status} />
              <InfoCard label="Method" value={order.payment_method || 'Razorpay'} />
              {order.razorpay_payment_id && <InfoCard label="Transaction ID" value={order.razorpay_payment_id} span />}
              {order.paid_at && <InfoCard label="Paid At" value={fmtDate(order.paid_at)} />}
              <InfoCard label="Total" value={fmtMoneyFull(order.total_amount)} highlight />
            </InfoGrid>
          ) : (
            <div style={{ background: '#f9fafb', border: '1px solid #f0f0f0', borderRadius: 8, padding: '12px 14px', fontSize: '.8rem', color: '#6b7280' }}>
              Payment not recorded (COD or pre-payment-system order).
              <div style={{ marginTop: 6, fontWeight: 900, color: '#1d4ed8', fontSize: '.95rem' }}>{fmtMoneyFull(order.total_amount)}</div>
            </div>
          )}

          <SectionTitle style={{ marginTop: 20 }}>{`Items (${(order.items ?? []).length})`}</SectionTitle>
          {(order.items ?? []).length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af', fontSize: '.82rem', border: '1px solid #f0f0f0', borderRadius: 10 }}>No item details available</div>
          ) : (
            <div style={{ border: '1px solid #f0f0f0', borderRadius: 10, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.82rem' }}>
                <thead>
                  <tr style={{ background: '#fafafa' }}>
                    {['Product', 'Color', 'Qty', 'Price', 'Total'].map((h) => (
                      <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontWeight: 800, fontSize: '.7rem', color: '#9ca3af', letterSpacing: '.05em', borderBottom: '1px solid #f0f0f0' }}>{h.toUpperCase()}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(order.items ?? []).map((item, i) => (
                    <tr key={i} style={{ borderBottom: i < (order.items ?? []).length - 1 ? '1px solid #f9f9f9' : 'none' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 600 }}>{item.name}</td>
                      <td style={{ padding: '10px 14px' }}>
                        {item.color ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'var(--gg-muted-fill)', border: '1px solid var(--gg-border)', borderRadius: 20, padding: '2px 8px 2px 5px' }}>
                            {item.color_hex && <span style={{ width: 10, height: 10, borderRadius: '50%', background: item.color_hex, border: '1.5px solid rgba(0,0,0,0.12)', display: 'inline-block' }} />}
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#555' }}>{item.color}</span>
                          </span>
                        ) : <span style={{ color: '#d1d5db' }}>—</span>}
                      </td>
                      <td style={{ padding: '10px 14px', color: '#6b7280' }}>{item.qty}</td>
                      <td style={{ padding: '10px 14px', color: '#6b7280' }}>{fmtMoneyFull(item.price)}</td>
                      <td style={{ padding: '10px 14px', fontWeight: 900 }}>{fmtMoneyFull(item.qty * item.price)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#fafafa', borderTop: '2px solid #f0f0f0' }}>
                    <td colSpan={4} style={{ padding: '10px 14px', fontWeight: 800, textAlign: 'right' }}>Grand Total</td>
                    <td style={{ padding: '10px 14px', fontWeight: 900, color: '#1d4ed8', fontSize: '1rem' }}>{fmtMoneyFull(order.total_amount)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          <SectionTitle style={{ marginTop: 20 }}>Update Status</SectionTitle>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {ALL_STATUSES.map((s) => {
              const style = STATUS_STYLE[s]
              const isActive = currentStatus.toLowerCase() === s
              return (
                <button
                  key={s}
                  disabled={updating || isActive}
                  onClick={() => setConfirmStatus(s)}
                  style={{ padding: '7px 16px', borderRadius: 20, fontSize: '.78rem', fontWeight: 800, cursor: updating || isActive ? 'default' : 'pointer', border: isActive ? `2px solid ${style?.dot}` : '2px solid #e5e7eb', background: isActive ? style?.bg : '#fff', color: isActive ? style?.color : '#374151', opacity: updating ? 0.6 : 1, textTransform: 'capitalize' }}
                >{s}</button>
              )
            })}
          </div>

          {/* Confirm-before-change (item 15) */}
          {confirmStatus && (
            <div style={{ marginTop: 12, background: '#fffbeb', border: '1.5px solid #fde68a', borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ flex: 1, fontSize: '.82rem', fontWeight: 700, color: '#92400e' }}>
                Change status to “{confirmStatus}”?
              </span>
              <button disabled={updating} onClick={() => applyStatus(confirmStatus)} style={{ padding: '7px 16px', borderRadius: 8, border: 'none', background: updating ? '#fca5a5' : '#16a34a', color: '#fff', fontWeight: 800, fontSize: '.78rem', cursor: updating ? 'not-allowed' : 'pointer' }}>{updating ? '…' : 'Confirm'}</button>
              <button disabled={updating} onClick={() => setConfirmStatus(null)} style={{ padding: '7px 16px', borderRadius: 8, border: '1.5px solid #e5e7eb', background: '#fff', fontWeight: 700, fontSize: '.78rem', cursor: 'pointer', color: '#374151' }}>Cancel</button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', gap: 10, background: '#fafafa' }}>
          <button onClick={() => onPrint(order)} style={{ padding: '9px 18px', borderRadius: 8, border: '1.5px solid #e5e7eb', background: '#fff', fontWeight: 700, fontSize: '.85rem', cursor: 'pointer', color: '#374151' }}>🖨 Print receipt</button>
          <button onClick={onClose} style={{ padding: '9px 22px', borderRadius: 8, border: '1.5px solid #e5e7eb', background: '#fff', fontWeight: 700, fontSize: '.85rem', cursor: 'pointer', color: '#374151' }}>Close</button>
        </div>
      </div>
    </div>
  )
}

// ── Delete modal ──────────────────────────────────────────────────

function DeleteModal({ order, onCancel, onConfirm }: { order: ApiOrder; onCancel: () => void; onConfirm: () => Promise<void> }) {
  const [deleting, setDeleting] = useState(false)
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onCancel])
  return (
    <div onClick={onCancel} style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 380, background: '#fff', borderRadius: 16, padding: '32px 28px', textAlign: 'center', boxShadow: '0 25px 60px rgba(0,0,0,0.18)' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 24 }}>🗑️</div>
        <div style={{ fontWeight: 900, fontSize: '1.1rem', marginBottom: 8 }}>Delete Order?</div>
        <div style={{ color: '#6b7280', fontSize: '.85rem', marginBottom: 24, lineHeight: 1.5 }}>
          Order <strong style={{ color: '#111' }}>#{order.order_number}</strong> ({fmtMoneyFull(order.total_amount)}) will be permanently removed.
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button onClick={onCancel} style={{ padding: '10px 22px', borderRadius: 8, border: '1.5px solid #e5e7eb', background: '#fff', fontWeight: 700, fontSize: '.85rem', cursor: 'pointer' }}>Cancel</button>
          <button onClick={async () => { setDeleting(true); try { await onConfirm() } finally { setDeleting(false) } }} disabled={deleting} style={{ padding: '10px 22px', borderRadius: 8, border: 'none', background: deleting ? '#fca5a5' : '#dc2626', color: '#fff', fontWeight: 800, fontSize: '.85rem', cursor: deleting ? 'not-allowed' : 'pointer' }}>{deleting ? 'Deleting…' : 'Yes, Delete'}</button>
        </div>
      </div>
    </div>
  )
}

// ── Toast ─────────────────────────────────────────────────────────

function Toast({ msg, type, onDone }: { msg: string; type: 'success' | 'error'; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3200)
    return () => clearTimeout(t)
  }, [onDone])
  return (
    <div style={{ position: 'fixed', bottom: 28, right: 28, zIndex: 2000, background: type === 'success' ? '#166534' : '#991b1b', color: '#fff', padding: '12px 20px', borderRadius: 10, fontWeight: 700, fontSize: '.85rem', boxShadow: '0 8px 24px rgba(0,0,0,0.18)', display: 'flex', alignItems: 'center', gap: 8 }}>
      <span>{type === 'success' ? '✓' : '✕'}</span>{msg}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────

export default function OrdersPage() {
  const [activeTab,    setActiveTab]    = useState('All')
  const [rawSearch,    setRawSearch]    = useState('')
  const [dateFrom,     setDateFrom]     = useState('')
  const [dateTo,       setDateTo]       = useState('')
  const [page,         setPage]         = useState(0)
  const [sortBy,       setSortBy]       = useState<'created_at' | 'total_amount'>('created_at')
  const [sortDir,      setSortDir]      = useState<'asc' | 'desc'>('desc')
  const [viewOrder,    setViewOrder]    = useState<ApiOrder | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ApiOrder | null>(null)
  const [receiptOrder, setReceiptOrder] = useState<ApiOrder | null>(null)
  const [toast,        setToast]        = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const search = useDebounce(rawSearch, 380)
  const statusFilter = activeTab === 'All' ? undefined : activeTab

  const { data, loading, error, refetch } = useAdminFetch<ApiOrdersResult>(
    () => fetchAdminOrders({
      skip: page * LIMIT, limit: LIMIT,
      status: statusFilter, search: search || undefined,
      dateFrom: dateFrom || undefined, dateTo: dateTo || undefined,
      sortBy, sortDir,
    }),
    [page, activeTab, search, dateFrom, dateTo, sortBy, sortDir],
  )

  const orders     = data?.orders ?? []
  const totalCount = data?.totalCount ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / LIMIT))

  // order_id → existing active shipment (for the Ship/View button)
  const [shipMap, setShipMap] = useState<Record<string, { shipment_id: string; status: string }>>({})
  const [shipBusy, setShipBusy] = useState<string | null>(null)

  useEffect(() => {
    const ids = orders.map(o => o.id)
    if (ids.length === 0) { setShipMap({}); return }
    let alive = true
    fetchShipmentsByOrders(ids)
      .then(r => { if (alive) setShipMap(r.data || {}) })
      .catch(() => { if (alive) setShipMap({}) })
    return () => { alive = false }
  }, [orders])

  async function handleShip(order: ApiOrder) {
    const existing = shipMap[order.id]
    if (existing) { window.location.href = `/admin?page=shipping`; return } // route to shipping (see note)
    setShipBusy(order.id)
    try {
      const sh = await createShipment({ order_id: order.id })
      setShipMap(prev => ({ ...prev, [order.id]: { shipment_id: sh.id, status: sh.status } }))
      showToast('Shipment created — open the Shipping page to pack it', 'success')
    } catch (err: any) {
      showToast(`Ship failed: ${err.message}`, 'error')
    } finally {
      setShipBusy(null)
    }
  }

  useEffect(() => { setPage(0) }, [activeTab, search, dateFrom, dateTo])

  function showToast(msg: string, type: 'success' | 'error') { setToast({ msg, type }) }

  function toggleSort(col: 'created_at' | 'total_amount') {
    if (sortBy === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortBy(col); setSortDir('desc') }
    setPage(0)
  }

  async function handleStatusUpdate(id: string, status: string) {
    try {
      await updateOrderStatus(id, status)
      if (viewOrder?.id === id) setViewOrder((prev) => prev ? { ...prev, status } : null)
      refetch()
      showToast(`Status updated to "${status}"`, 'success')
    } catch (err: any) {
      showToast(`Failed: ${err.message}`, 'error')
      throw err
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await deleteOrder(deleteTarget.id)
      refetch(); setDeleteTarget(null)
      showToast('Order deleted', 'success')
    } catch (err: any) {
      showToast(`Delete failed: ${err.message}`, 'error')
      setDeleteTarget(null)
    }
  }

  const TABS = ['All', ...ALL_STATUSES]

  const pageWindow = (() => {
    const half = 2
    let start = Math.max(0, page - half)
    const end = Math.min(totalPages - 1, start + half * 2)
    start = Math.max(0, end - half * 2)
    const pages: number[] = []
    for (let i = start; i <= end; i++) pages.push(i)
    return pages
  })()

  function sortArrow(col: 'created_at' | 'total_amount') {
    if (sortBy !== col) return <span style={{ opacity: 0.3, marginLeft: 4, fontSize: 10 }}>↕</span>
    return <span style={{ marginLeft: 4, fontSize: 10 }}>{sortDir === 'asc' ? '↑' : '↓'}</span>
  }

  return (
    <>
      <style>{`
        @keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }
        .orders-table tbody tr:hover { background: #fafafa; }
        .orders-table tbody tr { transition: background .1s; }
        .ord-tab { padding: 6px 14px; border-radius: 20px; font-size: .78rem; font-weight: 700; border: 1.5px solid transparent; cursor: pointer; white-space: nowrap; background: transparent; color: #6b7280; text-transform: capitalize; }
        .ord-tab:hover { background: #f3f4f6; color: #111; }
        .ord-tab.active { background: #1d4ed8; color: #fff; border-color: #1d4ed8; }
        .ord-page-btn { min-width: 32px; height: 32px; border-radius: 7px; border: 1.5px solid #e5e7eb; background: #fff; font-size: .78rem; font-weight: 700; cursor: pointer; padding: 0 10px; color: #374151; }
        .ord-page-btn:hover:not(:disabled) { border-color: #1d4ed8; color: #1d4ed8; }
        .ord-page-btn.active { background: #1d4ed8; color: #fff; border-color: #1d4ed8; }
        .ord-page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .ord-sort-th { cursor: pointer; user-select: none; }
        .ord-sort-th:hover { color: #1d4ed8; }
        .ord-date-input { border: 1.5px solid #e5e7eb; border-radius: 7px; padding: 6px 8px; font-size: .76rem; font-weight: 600; color: #374151; outline: none; }
        .ord-date-input:focus { border-color: #1d4ed8; }

        /* Mobile cards vs table (item 18) */
        .orders-cards { display: none; }
        @media (max-width: 768px) {
          .orders-table-wrap { display: none; }
          .orders-cards { display: flex; flex-direction: column; gap: 10px; padding: 12px; }
        }
        .ord-card { border: 1px solid #f0f0f0; border-radius: 12px; padding: 14px; }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#111827', lineHeight: 1.2 }}>Orders</div>
            <div style={{ fontSize: '.78rem', color: '#9ca3af', marginTop: 4, fontWeight: 600 }}>
              {loading ? 'Loading…' : `${totalCount.toLocaleString('en-IN')} total orders`}
            </div>
          </div>
          <button onClick={refetch} style={{ padding: '8px 16px', borderRadius: 8, border: '1.5px solid #e5e7eb', background: '#fff', fontWeight: 700, fontSize: '.82rem', cursor: 'pointer', color: '#374151' }}>↻ Refresh</button>
        </div>

        {/* Card */}
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #f0f0f0', boxShadow: '0 1px 12px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          {/* Toolbar */}
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {TABS.map((tab) => (
                <button key={tab} className={`ord-tab ${activeTab === tab ? 'active' : ''}`} onClick={() => { setActiveTab(tab); setPage(0) }}>{tab}</button>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '7px 12px', background: '#fafafa', minWidth: 220 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
              <input type="text" placeholder="Search order ID, customer…" value={rawSearch} onChange={(e) => setRawSearch(e.target.value)} style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '.82rem', fontWeight: 600, color: '#111', width: '100%' }} />
              {rawSearch && <button onClick={() => setRawSearch('')} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 16, lineHeight: 1, padding: 0 }}>×</button>}
            </div>
          </div>

          {/* Date filter row */}
          <div style={{ padding: '10px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '.72rem', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '.06em' }}>Date</span>
            <input type="date" className="ord-date-input" value={dateFrom} max={dateTo || undefined} onChange={(e) => setDateFrom(e.target.value)} aria-label="From date" />
            <span style={{ color: '#9ca3af' }}>→</span>
            <input type="date" className="ord-date-input" value={dateTo} min={dateFrom || undefined} onChange={(e) => setDateTo(e.target.value)} aria-label="To date" />
            {(dateFrom || dateTo) && (
              <button onClick={() => { setDateFrom(''); setDateTo('') }} style={{ border: '1.5px solid #e5e7eb', background: '#fff', borderRadius: 7, padding: '5px 10px', fontSize: '.72rem', fontWeight: 700, color: '#374151', cursor: 'pointer' }}>Clear dates</button>
            )}
          </div>

          {/* Error */}
          {error && (
            <div style={{ padding: '16px 20px', background: '#fff1f0', borderBottom: '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: 10, fontSize: '.82rem', color: '#b91c1c', fontWeight: 700 }}>
              <span>⚠️ {error}</span>
              <button onClick={refetch} style={{ padding: '4px 12px', borderRadius: 6, border: '1.5px solid #fca5a5', background: '#fff', color: '#b91c1c', fontWeight: 700, fontSize: '.75rem', cursor: 'pointer' }}>Retry</button>
            </div>
          )}

          {/* Table (desktop) */}
          <div className="orders-table-wrap" style={{ overflowX: 'auto' }}>
            <table className="orders-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.82rem' }}>
              <thead>
                <tr style={{ background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                  {['Order ID', 'Customer', 'Items', 'Amount', 'Date', 'Status', 'Payment', 'Actions'].map((label) => {
                    const sortable = label === 'Amount' || label === 'Date'
                    const col: 'total_amount' | 'created_at' | null = label === 'Amount' ? 'total_amount' : label === 'Date' ? 'created_at' : null
                    return (
                      <th key={label} className={sortable ? 'ord-sort-th' : ''} onClick={sortable && col ? () => toggleSort(col) : undefined}
                        style={{ padding: '11px 16px', textAlign: 'left', fontSize: '.68rem', fontWeight: 900, color: col && sortBy === col ? '#1d4ed8' : '#9ca3af', letterSpacing: '.06em', borderBottom: '1px solid #f0f0f0' }}>
                        {label.toUpperCase()}{sortable && col ? sortArrow(col) : null}
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                  : orders.length === 0
                  ? <tr><td colSpan={8} style={{ padding: '60px 20px', textAlign: 'center', color: '#9ca3af', fontWeight: 700 }}>
                      <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
                      <div style={{ fontSize: '1rem', marginBottom: 6 }}>No orders found</div>
                      <div style={{ fontSize: '.8rem', fontWeight: 500 }}>{rawSearch ? `No results for "${rawSearch}"` : 'No orders match the selected filters'}</div>
                    </td></tr>
                  : orders.map((o, idx) => (
                    <tr key={o.id}>
                      <td style={{ padding: '13px 16px', fontWeight: 800, color: '#1d4ed8', fontFamily: 'monospace', fontSize: '.8rem' }}>#{o.order_number}</td>
                      <td style={{ padding: '13px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Avatar name={o.customer_name} idx={idx} />
                          <div>
                            <div style={{ fontWeight: 800, color: '#111827', fontSize: '.8rem' }}>{o.customer_name}</div>
                            {o.city && o.city !== '—' && <div style={{ fontSize: '.7rem', color: '#9ca3af' }}>{o.city}</div>}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '13px 16px', color: '#6b7280', fontWeight: 700 }}>{(o.items ?? []).length} item{(o.items ?? []).length !== 1 ? 's' : ''}</td>
                      <td style={{ padding: '13px 16px', fontWeight: 900, color: '#111827' }}>{fmtMoneyFull(o.total_amount)}</td>
                      <td style={{ padding: '13px 16px', color: '#6b7280', fontWeight: 600, whiteSpace: 'nowrap' }}>{fmtDate(o.created_at)}</td>
                      <td style={{ padding: '13px 16px' }}><StatusBadge status={o.status} /></td>
                      <td style={{ padding: '13px 16px' }}><PaymentBadge status={o.payment_status} /></td>
                     <td style={{ padding: '13px 16px' }}>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          {(() => {
                            const shipped = shipMap[o.id]
                            const eligible = ['pending', 'confirmed', 'processing', 'packed'].includes((o.status || '').toLowerCase())
                            if (shipped) {
                              return <button title="View shipment" onClick={() => handleShip(o)}
                                style={{ padding: '0 10px', height: 30, borderRadius: 7, border: '1.5px solid #bfdbfe', background: '#eff6ff', color: '#1d4ed8', cursor: 'pointer', fontSize: 12, fontWeight: 800 }}>🚚 View</button>
                            }
                            if (eligible) {
                              return <button title="Create shipment" disabled={shipBusy === o.id} onClick={() => handleShip(o)}
                                style={{ padding: '0 10px', height: 30, borderRadius: 7, border: 'none', background: shipBusy === o.id ? '#fca5a5' : 'var(--gg-primary)', color: '#fff', cursor: shipBusy === o.id ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 800 }}>{shipBusy === o.id ? '…' : '🚚 Ship'}</button>
                            }
                            return null
                          })()}
                          <button title="View" onClick={() => setViewOrder(o)} style={{ width: 30, height: 30, borderRadius: 7, border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: 14 }}>👁</button>
                          <button title="Delete" onClick={() => setDeleteTarget(o)} style={{ width: 30, height: 30, borderRadius: 7, border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: 14 }}>🗑</button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Cards (mobile) */}
          <div className="orders-cards">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="ord-card"><div style={{ height: 60, borderRadius: 8, background: 'linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} /></div>)
              : orders.length === 0
              ? <div style={{ padding: '40px 20px', textAlign: 'center', color: '#9ca3af', fontWeight: 700 }}>📭 No orders found</div>
              : orders.map((o, idx) => (
                <div key={o.id} className="ord-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar name={o.customer_name} idx={idx} />
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '.84rem' }}>{o.customer_name}</div>
                        <div style={{ fontFamily: 'monospace', fontSize: '.72rem', color: '#1d4ed8', fontWeight: 800 }}>#{o.order_number}</div>
                      </div>
                    </div>
                    <StatusBadge status={o.status} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.76rem', color: '#6b7280', marginBottom: 10 }}>
                    <span>{(o.items ?? []).length} item{(o.items ?? []).length !== 1 ? 's' : ''} · {fmtDate(o.created_at)}</span>
                    <span style={{ fontWeight: 900, color: '#111' }}>{fmtMoneyFull(o.total_amount)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <PaymentBadge status={o.payment_status} />
                    <div style={{ display: 'flex', gap: 6 }}>
                      {(() => {
                        const shipped = shipMap[o.id]
                        const eligible = ['pending', 'confirmed', 'processing', 'packed'].includes((o.status || '').toLowerCase())
                        if (shipped) return <button onClick={() => handleShip(o)} style={{ padding: '6px 12px', borderRadius: 7, border: '1.5px solid #bfdbfe', background: '#eff6ff', color: '#1d4ed8', cursor: 'pointer', fontSize: '.76rem', fontWeight: 800 }}>🚚 View</button>
                        if (eligible) return <button disabled={shipBusy === o.id} onClick={() => handleShip(o)} style={{ padding: '6px 12px', borderRadius: 7, border: 'none', background: shipBusy === o.id ? '#fca5a5' : 'var(--gg-primary)', color: '#fff', cursor: 'pointer', fontSize: '.76rem', fontWeight: 800 }}>{shipBusy === o.id ? '…' : '🚚 Ship'}</button>
                        return null
                      })()}
                      <button onClick={() => setViewOrder(o)} style={{ padding: '6px 12px', borderRadius: 7, border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: '.76rem', fontWeight: 700, color: '#374151' }}>View</button>
                      <button onClick={() => setDeleteTarget(o)} style={{ width: 32, borderRadius: 7, border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: 14 }}>🗑</button>
                    </div>
                  </div>
                </div>
              ))}
          </div>

          {/* Pagination */}
          {!loading && orders.length > 0 && (
            <div style={{ padding: '14px 20px', borderTop: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <span style={{ fontSize: '.75rem', fontWeight: 700, color: '#9ca3af' }}>
                Showing {page * LIMIT + 1}–{Math.min((page + 1) * LIMIT, totalCount)} of {totalCount.toLocaleString('en-IN')}
              </span>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <button className="ord-page-btn" disabled={page === 0} onClick={() => setPage(0)}>«</button>
                <button className="ord-page-btn" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>‹</button>
                {pageWindow.map((p) => <button key={p} className={`ord-page-btn ${page === p ? 'active' : ''}`} onClick={() => setPage(p)}>{p + 1}</button>)}
                <button className="ord-page-btn" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>›</button>
                <button className="ord-page-btn" disabled={page >= totalPages - 1} onClick={() => setPage(totalPages - 1)}>»</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {viewOrder && <OrderDrawer order={viewOrder} onClose={() => setViewOrder(null)} onStatusUpdate={handleStatusUpdate} onPrint={(o) => setReceiptOrder(o)} />}
      {deleteTarget && <DeleteModal order={deleteTarget} onCancel={() => setDeleteTarget(null)} onConfirm={handleDelete} />}
      {receiptOrder && <OrderReceipt order={receiptOrder} onClose={() => setReceiptOrder(null)} />}
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </>
  )
}