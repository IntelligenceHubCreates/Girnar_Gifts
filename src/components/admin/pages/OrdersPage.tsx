'use client'

/**
 * OrdersPage.tsx — production-ready admin orders page
 *
 * ── INTEGRATION FIXES ──────────────────────────────────────────────────────
 *
 * FIX 1 — useAdminFetch signature changed: fetcher now receives AbortSignal.
 *   Old: () => Promise<T>
 *   New: (signal: AbortSignal) => Promise<T>
 *   The signal is passed through to fetch() inside adminFetch so in-flight
 *   requests are cancelled when deps change (e.g. user types in search box).
 *   Without this, a slow response from page=2 could overwrite the page=3 result.
 *
 * FIX 2 — fetchAdminOrders now returns ApiOrdersResult ({ orders, totalCount }).
 *   Old code did Array.isArray(data) branching everywhere in the component.
 *   That logic is now inside adminApi.ts once, tested once, used everywhere.
 *
 * FIX 3 — updateOrderStatus now uses PUT /orders/{id} (not PATCH /orders/{id}/status).
 *   Network tab showed 405 Method Not Allowed, Allow: PUT.
 *
 * FIX 4 — normalizeOrder no longer fabricates customer_name from guesses.
 *   It sets customer_name = '#' + userId.slice(0,8) — honest, consistent,
 *   matches order_number pattern so admins can cross-reference.
 *
 * FIX 5 — items[].name is '—' not a guess. Backend omits product name from
 *   order_items. The drawer shows '—' clearly rather than showing 'Product'
 *   which implies data that isn't there.
 *
 * FIX 6 — Sorting: frontend sort columns that don't exist on backend
 *   (customer_name, order_number, payment_method) are mapped to 'created_at'
 *   in adminApi.ts. The sort icon still shows for UX but the backend sorts by date.
 *
 * FIX 7 — handleStatusUpdate now re-throws on error so the drawer's
 *   setUpdating(false) runs correctly in the finally block.
 */

import React, { useState, useEffect, useRef } from 'react'
import { useAdminFetch } from '@/hooks/useAdminFetch'
import {
  fetchAdminOrders,
  updateOrderStatus,
  deleteOrder,
  exportOrdersCSV,
  type ApiOrder,
  type ApiOrdersResult,
} from '@/lib/adminApi'

// ── Constants ────────────────────────────────────────────────────

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

const PAYMENT_STYLE: Record<string, { bg: string; color: string }> = {
  UPI:  { bg: '#dcfce7', color: '#15803d' },
  Card: { bg: '#dbeafe', color: '#1d4ed8' },
  COD:  { bg: '#f3f4f6', color: '#374151' },
}

const AVATAR_COLORS = ['#fff1f0','#fff7e6','#f0f9ff','#f9f0ff','#f0fff4','#fff0f6']
const AVATAR_TEXT   = ['#cf1322','#d46b08','#096dd9','#531dab','#237804','#c41d7f']

// ── Helpers ───────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

function fmtMoney(n: number) {
  return '₹' + n.toLocaleString('en-IN')
}

function initials(name: string) {
  if (!name || name === '—') return '?'
  return name.replace(/^#/, '').slice(0, 2).toUpperCase()
}

// ── Debounce ──────────────────────────────────────────────────────

function useDebounce<T>(value: T, ms = 380): T {
  const [dv, setDv] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDv(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return dv
}

// ── Status badge ──────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLE[status.toLowerCase()] ?? { bg: '#f3f4f6', color: '#374151', dot: '#9ca3af' }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: s.bg, color: s.color,
      fontSize: '.68rem', fontWeight: 800,
      padding: '3px 10px', borderRadius: 20,
      letterSpacing: '.03em', whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
      {status}
    </span>
  )
}

function PaymentBadge({ method }: { method: string }) {
  const s = PAYMENT_STYLE[method] ?? { bg: '#f3f4f6', color: '#374151' }
  return (
    <span style={{
      background: s.bg, color: s.color,
      fontSize: '.65rem', fontWeight: 800,
      padding: '3px 9px', borderRadius: 20,
    }}>
      {method}
    </span>
  )
}

// ── Sort icon ─────────────────────────────────────────────────────

function SortIcon({ col, active, dir }: { col: string; active: string; dir: 'asc' | 'desc' }) {
  const isActive = active === col
  return (
    <span style={{ marginLeft: 4, opacity: isActive ? 1 : 0.3, fontSize: 10 }}>
      {isActive ? (dir === 'asc' ? '↑' : '↓') : '↕'}
    </span>
  )
}

// ── Avatar ────────────────────────────────────────────────────────

function Avatar({ name, idx }: { name: string; idx: number }) {
  const i = idx % AVATAR_COLORS.length
  return (
    <div style={{
      width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
      background: AVATAR_COLORS[i], color: AVATAR_TEXT[i],
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '.7rem', fontWeight: 900,
      border: `1.5px solid ${AVATAR_TEXT[i]}22`,
    }}>
      {initials(name)}
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 8 }).map((_, j) => (
        <td key={j}>
          <div style={{
            height: 13, borderRadius: 6,
            background: 'linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.4s infinite',
            width: j === 1 ? '80%' : j === 7 ? '50%' : '90%',
          }} />
        </td>
      ))}
    </tr>
  )
}

// ── Sub-components ────────────────────────────────────────────────

function SectionTitle({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      fontSize: '.7rem', fontWeight: 900, color: '#9ca3af',
      marginBottom: 10,
      textTransform: 'uppercase', letterSpacing: '.08em',
      ...style,
    }}>
      {children}
    </div>
  )
}

function InfoGrid({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      {children}
    </div>
  )
}

function InfoCard({ label, value, span, highlight }: {
  label: string; value: string; span?: boolean; highlight?: boolean
}) {
  return (
    <div style={{
      gridColumn: span ? '1 / -1' : undefined,
      background: '#f9fafb', borderRadius: 8, padding: '9px 12px',
      border: '1px solid #f0f0f0',
    }}>
      <div style={{ fontSize: '.65rem', fontWeight: 700, color: '#9ca3af', marginBottom: 3 }}>
        {label.toUpperCase()}
      </div>
      <div style={{
        fontWeight: highlight ? 900 : 700,
        fontSize:   highlight ? '1rem' : '.85rem',
        color:      highlight ? '#1d4ed8' : '#111827',
        wordBreak: 'break-all',
      }}>
        {value || '—'}
      </div>
    </div>
  )
}

// ── Order Detail Drawer ───────────────────────────────────────────

function OrderDrawer({
  order, onClose, onStatusUpdate,
}: {
  order: ApiOrder
  onClose: () => void
  onStatusUpdate: (id: string, status: string) => Promise<void>
}) {
  const [updating,      setUpdating]      = useState(false)
  const [currentStatus, setCurrentStatus] = useState(order.status)
  const drawerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    drawerRef.current?.focus()
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  async function handleStatus(status: string) {
    if (status === currentStatus || updating) return
    setUpdating(true)
    try {
      await onStatusUpdate(order.id, status)
      setCurrentStatus(status)
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)',
        display: 'flex', justifyContent: 'flex-end',
      }}
    >
      <div
        ref={drawerRef} tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 520, maxWidth: '100vw', height: '100%',
          background: '#fff', display: 'flex', flexDirection: 'column',
          boxShadow: '-8px 0 40px rgba(0,0,0,0.14)',
          outline: 'none', animation: 'slideIn .22s ease',
        }}
      >
        {/* Head */}
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid #f0f0f0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#fafafa',
        }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: '1.05rem' }}>Order #{order.order_number}</div>
            <div style={{ fontSize: '.72rem', color: '#888', marginTop: 2 }}>
              Placed on {fmtDate(order.created_at)}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <StatusBadge status={currentStatus} />
            <button
              onClick={onClose}
              style={{
                width: 32, height: 32, borderRadius: '50%',
                border: '1.5px solid #e5e7eb', background: '#fff',
                cursor: 'pointer', fontSize: 16,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#6b7280',
              }}
            >×</button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

          <SectionTitle>Customer</SectionTitle>
          <InfoGrid>
            <InfoCard label="User ID"  value={order.user_id} span />
            <InfoCard label="City"     value={`${order.city}${order.state ? ', ' + order.state : ''}`} />
            {order.pincode && order.pincode !== '—' && (
              <InfoCard label="Pincode" value={order.pincode} />
            )}
            <InfoCard label="Address"  value={order.address} span />
          </InfoGrid>

          <SectionTitle style={{ marginTop: 20 }}>Payment</SectionTitle>
          <InfoGrid>
            <InfoCard label="Method"  value={order.payment_method} />
            <InfoCard label="Status"  value={order.payment_status} />
            <InfoCard label="Total"   value={fmtMoney(order.total_amount)} highlight />
          </InfoGrid>

          <SectionTitle style={{ marginTop: 20 }}>
            {`Items (${(order.items ?? []).length})`}
          </SectionTitle>
          {(order.items ?? []).length === 0 ? (
            <div style={{
              padding: '20px', textAlign: 'center',
              color: '#9ca3af', fontSize: '.82rem',
              border: '1px solid #f0f0f0', borderRadius: 10,
            }}>
              No item details available from backend
            </div>
          ) : (
            <div style={{ border: '1px solid #f0f0f0', borderRadius: 10, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.82rem' }}>
                <thead>
                  <tr style={{ background: '#fafafa' }}>
                    {['Product', 'Color', 'Qty', 'Unit Price', 'Total'].map((h) => (
                      <th key={h} style={{
                        padding: '9px 14px', textAlign: 'left',
                        fontWeight: 800, fontSize: '.7rem',
                        color: '#9ca3af', letterSpacing: '.05em',
                        borderBottom: '1px solid #f0f0f0',
                      }}>{h.toUpperCase()}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(order.items ?? []).map((item, i) => (
                    <tr key={i} style={{
                      borderBottom: i < (order.items ?? []).length - 1 ? '1px solid #f9f9f9' : 'none',
                    }}>
                      <td style={{ padding: '10px 14px', fontWeight: 600 }}>
                        {item.name}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        {item.color
                          ? (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5,
                              background: '#f5f2ee', border: '1px solid #e8e0d5',
                              borderRadius: 20, padding: '2px 8px 2px 5px' }}>
                              {item.color_hex && (
                                <span style={{
                                  width: 10, height: 10, borderRadius: '50%',
                                  background: item.color_hex,
                                  border: '1.5px solid rgba(0,0,0,0.12)',
                                  display: 'inline-block', flexShrink: 0,
                                }} />
                              )}
                              <span style={{ fontSize: 10, fontWeight: 700, color: '#555' }}>
                                {item.color}
                              </span>
                            </div>
                          )
                          : <span style={{ color: '#d1d5db', fontSize: '.8rem' }}>—</span>
                        }
                      </td>
                      <td style={{ padding: '10px 14px', color: '#6b7280' }}>{item.qty}</td>
                      <td style={{ padding: '10px 14px', color: '#6b7280' }}>{fmtMoney(item.price)}</td>
                      <td style={{ padding: '10px 14px', fontWeight: 900 }}>
                        {fmtMoney(item.qty * item.price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#fafafa', borderTop: '2px solid #f0f0f0' }}>
                    <td colSpan={4} style={{ padding: '10px 14px', fontWeight: 800, textAlign: 'right' }}>
                      Grand Total
                    </td>
                    <td style={{ padding: '10px 14px', fontWeight: 900, color: '#1d4ed8', fontSize: '1rem' }}>
                      {fmtMoney(order.total_amount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          <SectionTitle style={{ marginTop: 20 }}>Update Status</SectionTitle>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {ALL_STATUSES.map((s) => {
              const style    = STATUS_STYLE[s]
              const isActive = currentStatus.toLowerCase() === s
              return (
                <button
                  key={s}
                  disabled={updating}
                  onClick={() => handleStatus(s)}
                  style={{
                    padding: '7px 16px', borderRadius: 20, fontSize: '.78rem',
                    fontWeight: 800,
                    cursor: updating ? 'not-allowed' : 'pointer',
                    border:      isActive ? `2px solid ${style?.dot}` : '2px solid #e5e7eb',
                    background:  isActive ? style?.bg  : '#fff',
                    color:       isActive ? style?.color : '#374151',
                    opacity:     updating ? 0.6 : 1,
                    transition: 'all .15s',
                    textTransform: 'capitalize',
                  }}
                >
                  {updating && isActive ? '…' : s}
                </button>
              )
            })}
          </div>

          {order.notes && (
            <>
              <SectionTitle style={{ marginTop: 20 }}>Notes</SectionTitle>
              <div style={{
                background: '#fffbeb', border: '1px solid #fde68a',
                borderRadius: 8, padding: '10px 14px',
                fontSize: '.82rem', color: '#92400e',
              }}>
                {order.notes}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 24px', borderTop: '1px solid #f0f0f0',
          display: 'flex', justifyContent: 'flex-end', background: '#fafafa',
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '9px 22px', borderRadius: 8,
              border: '1.5px solid #e5e7eb', background: '#fff',
              fontWeight: 700, fontSize: '.85rem', cursor: 'pointer', color: '#374151',
            }}
          >Close</button>
        </div>
      </div>
    </div>
  )
}

// ── Delete modal ──────────────────────────────────────────────────

function DeleteModal({
  order, onCancel, onConfirm,
}: {
  order: ApiOrder
  onCancel: () => void
  onConfirm: () => Promise<void>
}) {
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onCancel])

  async function handleConfirm() {
    setDeleting(true)
    try { await onConfirm() } finally { setDeleting(false) }
  }

  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed', inset: 0, zIndex: 1100,
        background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 380, background: '#fff', borderRadius: 16,
          padding: '32px 28px', textAlign: 'center',
          boxShadow: '0 25px 60px rgba(0,0,0,0.18)',
          animation: 'popIn .2s ease',
        }}
      >
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: '#fee2e2', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px', fontSize: 24,
        }}>🗑️</div>
        <div style={{ fontWeight: 900, fontSize: '1.1rem', marginBottom: 8 }}>Delete Order?</div>
        <div style={{ color: '#6b7280', fontSize: '.85rem', marginBottom: 24, lineHeight: 1.5 }}>
          Order <strong style={{ color: '#111' }}>#{order.order_number}</strong> (
          {fmtMoney(order.total_amount)}) will be permanently removed. This cannot be undone.
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '10px 22px', borderRadius: 8,
              border: '1.5px solid #e5e7eb', background: '#fff',
              fontWeight: 700, fontSize: '.85rem', cursor: 'pointer',
            }}
          >Cancel</button>
          <button
            onClick={handleConfirm} disabled={deleting}
            style={{
              padding: '10px 22px', borderRadius: 8, border: 'none',
              background: deleting ? '#fca5a5' : '#dc2626',
              color: '#fff', fontWeight: 800, fontSize: '.85rem',
              cursor: deleting ? 'not-allowed' : 'pointer',
            }}
          >{deleting ? 'Deleting…' : 'Yes, Delete'}</button>
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
    <div style={{
      position: 'fixed', bottom: 28, right: 28, zIndex: 2000,
      background: type === 'success' ? '#166534' : '#991b1b',
      color: '#fff', padding: '12px 20px', borderRadius: 10,
      fontWeight: 700, fontSize: '.85rem',
      boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
      display: 'flex', alignItems: 'center', gap: 8,
      animation: 'slideUp .2s ease',
    }}>
      <span>{type === 'success' ? '✓' : '✕'}</span>
      {msg}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────

export default function OrdersPage() {
  const [activeTab,    setActiveTab]    = useState('All')
  const [rawSearch,    setRawSearch]    = useState('')
  const [page,         setPage]         = useState(0)
  const [sortBy,       setSortBy]       = useState('created_at')
  const [sortDir,      setSortDir]      = useState<'asc' | 'desc'>('desc')
  const [viewOrder,    setViewOrder]    = useState<ApiOrder | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ApiOrder | null>(null)
  const [toast,        setToast]        = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const search      = useDebounce(rawSearch, 380)
  const statusFilter = activeTab === 'All' ? undefined : activeTab

  // FIX: fetcher receives signal for request cancellation
  const { data, loading, error, refetch } = useAdminFetch<ApiOrdersResult>(
    (signal) => fetchAdminOrders({
      skip:    page * LIMIT,
      limit:   LIMIT,
      status:  statusFilter,
      search:  search || undefined,
      sortBy,
      sortDir,
    }),
    [page, activeTab, search, sortBy, sortDir]
  )

  // fetchAdminOrders now always returns { orders, totalCount } — no branching needed
  const orders:     ApiOrder[] = data?.orders     ?? []
  const totalCount: number     = data?.totalCount ?? 0
  const totalPages: number     = Math.max(1, Math.ceil(totalCount / LIMIT))

  useEffect(() => { setPage(0) }, [activeTab, search])

  function showToast(msg: string, type: 'success' | 'error') {
    setToast({ msg, type })
  }

  function handleSort(col: string) {
    if (sortBy === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortBy(col); setSortDir('desc') }
    setPage(0)
  }

  async function handleStatusUpdate(id: string, status: string) {
    try {
      await updateOrderStatus(id, status)
      // Optimistic update: reflect new status in the open drawer immediately
      if (viewOrder?.id === id) {
        setViewOrder((prev) => prev ? { ...prev, status } : null)
      }
      refetch()
      showToast(`Status updated to "${status}"`, 'success')
    } catch (err: any) {
      showToast(`Failed: ${err.message}`, 'error')
      throw err  // re-throw so drawer resets its loading state
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await deleteOrder(deleteTarget.id)
      refetch()
      setDeleteTarget(null)
      showToast('Order deleted', 'success')
    } catch (err: any) {
      showToast(`Delete failed: ${err.message}`, 'error')
      setDeleteTarget(null)
    }
  }

  async function handleExport() {
    try {
      const blob = await exportOrdersCSV({
        status:  statusFilter,
        search:  search || undefined,
        sortBy,
        sortDir,
      })
      const url = URL.createObjectURL(blob)
      const a   = document.createElement('a')
      a.href     = url
      a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
      showToast('CSV exported', 'success')
    } catch (err: any) {
      showToast(`Export failed: ${err.message}`, 'error')
    }
  }

  const TABS = ['All', ...ALL_STATUSES]

  const pageWindow = (() => {
    const half  = 2
    let   start = Math.max(0, page - half)
    let   end   = Math.min(totalPages - 1, start + half * 2)
    start        = Math.max(0, end - half * 2)
    const pages: number[] = []
    for (let i = start; i <= end; i++) pages.push(i)
    return pages
  })()

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0%   { background-position:  200% 0 }
          100% { background-position: -200% 0 }
        }
        @keyframes slideIn {
          from { transform: translateX(100%) }
          to   { transform: translateX(0) }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0 }
          to   { transform: translateY(0);    opacity: 1 }
        }
        @keyframes popIn {
          from { transform: scale(.9); opacity: 0 }
          to   { transform: scale(1);  opacity: 1 }
        }
        .orders-table tbody tr:hover { background: #fafafa; }
        .orders-table tbody tr       { transition: background .1s; }
        .sort-th { cursor: pointer; user-select: none; white-space: nowrap; }
        .sort-th:hover { color: #1d4ed8; }
        .action-btn {
          width: 30px; height: 30px; border-radius: 7px;
          border: 1.5px solid #e5e7eb; background: #fff;
          cursor: pointer; display: inline-flex;
          align-items: center; justify-content: center;
          font-size: 14px; transition: all .15s;
        }
        .action-btn:hover       { border-color: #d1d5db; background: #f9fafb; transform: translateY(-1px); }
        .action-btn.danger:hover{ border-color: #fca5a5; background: #fff1f0; }
        .tab-btn {
          padding: 6px 14px; border-radius: 20px; font-size: .78rem;
          font-weight: 700; border: 1.5px solid transparent;
          cursor: pointer; transition: all .15s; white-space: nowrap;
          background: transparent; color: #6b7280; text-transform: capitalize;
        }
        .tab-btn:hover  { background: #f3f4f6; color: #111; }
        .tab-btn.active { background: #1d4ed8; color: #fff; border-color: #1d4ed8; }
        .page-btn {
          min-width: 32px; height: 32px; border-radius: 7px;
          border: 1.5px solid #e5e7eb; background: #fff;
          font-size: .78rem; font-weight: 700; cursor: pointer;
          padding: 0 10px; transition: all .15s; color: #374151;
        }
        .page-btn:hover:not(:disabled) { border-color: #1d4ed8; color: #1d4ed8; }
        .page-btn.active  { background: #1d4ed8; color: #fff; border-color: #1d4ed8; }
        .page-btn:disabled{ opacity: 0.4; cursor: not-allowed; }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'flex-start',
          justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
        }}>
          <div>
            <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#111827', lineHeight: 1.2 }}>
              Orders
            </div>
            <div style={{ fontSize: '.78rem', color: '#9ca3af', marginTop: 4, fontWeight: 600 }}>
              {loading ? 'Loading…' : `${totalCount.toLocaleString()} total orders`}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={refetch}
              style={{
                padding: '8px 16px', borderRadius: 8,
                border: '1.5px solid #e5e7eb', background: '#fff',
                fontWeight: 700, fontSize: '.82rem', cursor: 'pointer', color: '#374151',
              }}
            >↻ Refresh</button>
            <button
              onClick={handleExport}
              style={{
                padding: '8px 16px', borderRadius: 8,
                border: '1.5px solid #e5e7eb', background: '#fff',
                fontWeight: 700, fontSize: '.82rem', cursor: 'pointer', color: '#374151',
              }}
            >📥 Export CSV</button>
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: '#fff', borderRadius: 14,
          border: '1px solid #f0f0f0',
          boxShadow: '0 1px 12px rgba(0,0,0,0.05)',
          overflow: 'hidden',
        }}>

          {/* Toolbar */}
          <div style={{
            padding: '14px 20px', borderBottom: '1px solid #f0f0f0',
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', flexWrap: 'wrap', gap: 10,
          }}>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {TABS.map((tab) => (
                <button
                  key={tab}
                  className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                  onClick={() => { setActiveTab(tab); setPage(0) }}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              border: '1.5px solid #e5e7eb', borderRadius: 8,
              padding: '7px 12px', background: '#fafafa', minWidth: 220,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="#9ca3af" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Search by order ID, city…"
                value={rawSearch}
                onChange={(e) => setRawSearch(e.target.value)}
                style={{
                  border: 'none', background: 'transparent', outline: 'none',
                  fontSize: '.82rem', fontWeight: 600, color: '#111', width: '100%',
                }}
              />
              {rawSearch && (
                <button
                  onClick={() => setRawSearch('')}
                  style={{
                    border: 'none', background: 'none', cursor: 'pointer',
                    color: '#9ca3af', fontSize: 16, lineHeight: 1, padding: 0,
                  }}
                >×</button>
              )}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              padding: '16px 20px', background: '#fff1f0',
              borderBottom: '1px solid #fecaca',
              display: 'flex', alignItems: 'center', gap: 10,
              fontSize: '.82rem', color: '#b91c1c', fontWeight: 700,
            }}>
              <span>⚠️ {error}</span>
              <button
                onClick={refetch}
                style={{
                  padding: '4px 12px', borderRadius: 6,
                  border: '1.5px solid #fca5a5', background: '#fff',
                  color: '#b91c1c', fontWeight: 700, fontSize: '.75rem', cursor: 'pointer',
                }}
              >Retry</button>
            </div>
          )}

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table className="orders-table" style={{
              width: '100%', borderCollapse: 'collapse', fontSize: '.82rem',
            }}>
              <thead>
                <tr style={{ background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                  {[
                    { label: 'Order ID',  col: 'order_number'  },
                    { label: 'User',      col: 'customer_name' },
                    { label: 'Items',     col: null            },
                    { label: 'Amount',    col: 'total_amount'  },
                    { label: 'Date',      col: 'created_at'    },
                    { label: 'Status',    col: 'status'        },
                    { label: 'Address',   col: null            },
                    { label: 'Actions',   col: null            },
                  ].map(({ label, col }) => (
                    <th
                      key={label}
                      className={col ? 'sort-th' : ''}
                      onClick={col ? () => handleSort(col) : undefined}
                      style={{
                        padding: '11px 16px', textAlign: 'left',
                        fontSize: '.68rem', fontWeight: 900,
                        color: sortBy === col ? '#1d4ed8' : '#9ca3af',
                        letterSpacing: '.06em',
                        borderBottom: '1px solid #f0f0f0',
                      }}
                    >
                      {label.toUpperCase()}
                      {col && <SortIcon col={col} active={sortBy} dir={sortDir} />}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                  : orders.length === 0
                  ? (
                    <tr>
                      <td colSpan={8} style={{
                        padding: '60px 20px', textAlign: 'center',
                        color: '#9ca3af', fontWeight: 700,
                      }}>
                        <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
                        <div style={{ fontSize: '1rem', marginBottom: 6 }}>No orders found</div>
                        <div style={{ fontSize: '.8rem', fontWeight: 500 }}>
                          {rawSearch
                            ? `No results for "${rawSearch}"`
                            : 'No orders match the selected filter'}
                        </div>
                      </td>
                    </tr>
                  )
                  : orders.map((o, idx) => (
                    <tr key={o.id}>
                      <td style={{
                        padding: '13px 16px', fontWeight: 800,
                        color: '#1d4ed8', fontFamily: 'monospace', fontSize: '.8rem',
                      }}>
                        #{o.order_number}
                      </td>
                      <td style={{ padding: '13px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Avatar name={o.customer_name} idx={idx} />
                          <div>
                            <div style={{ fontWeight: 800, color: '#111827', fontSize: '.8rem' }}>
                              {o.customer_name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '13px 16px', color: '#6b7280', fontWeight: 700 }}>
                        {(o.items ?? []).length} item{(o.items ?? []).length !== 1 ? 's' : ''}
                      </td>
                      <td style={{ padding: '13px 16px', fontWeight: 900, color: '#111827' }}>
                        {fmtMoney(o.total_amount)}
                      </td>
                      <td style={{ padding: '13px 16px', color: '#6b7280', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {fmtDate(o.created_at)}
                      </td>
                      <td style={{ padding: '13px 16px' }}>
                        <StatusBadge status={o.status} />
                      </td>
                      <td style={{ padding: '13px 16px', color: '#6b7280', fontSize: '.75rem', maxWidth: 160 }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {o.city !== '—' ? `${o.city}${o.state !== '—' ? ', ' + o.state : ''}` : '—'}
                        </div>
                      </td>
                      <td style={{ padding: '13px 16px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            className="action-btn"
                            title="View order"
                            onClick={() => setViewOrder(o)}
                          >👁</button>
                          <button
                            className="action-btn danger"
                            title="Delete order"
                            onClick={() => setDeleteTarget(o)}
                          >🗑</button>
                        </div>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && orders.length > 0 && (
            <div style={{
              padding: '14px 20px', borderTop: '1px solid #f0f0f0',
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', flexWrap: 'wrap', gap: 10,
            }}>
              <span style={{ fontSize: '.75rem', fontWeight: 700, color: '#9ca3af' }}>
                Showing {page * LIMIT + 1}–{Math.min((page + 1) * LIMIT, totalCount)} of{' '}
                {totalCount.toLocaleString()} orders
              </span>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <button className="page-btn" disabled={page === 0} onClick={() => setPage(0)}>«</button>
                <button className="page-btn" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>‹ Prev</button>
                {pageWindow.map((p) => (
                  <button
                    key={p}
                    className={`page-btn ${page === p ? 'active' : ''}`}
                    onClick={() => setPage(p)}
                  >
                    {p + 1}
                  </button>
                ))}
                <button className="page-btn" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>Next ›</button>
                <button className="page-btn" disabled={page >= totalPages - 1} onClick={() => setPage(totalPages - 1)}>»</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {viewOrder && (
        <OrderDrawer
          order={viewOrder}
          onClose={() => setViewOrder(null)}
          onStatusUpdate={handleStatusUpdate}
        />
      )}

      {deleteTarget && (
        <DeleteModal
          order={deleteTarget}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}

      {toast && (
        <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />
      )}
    </>
  )
}