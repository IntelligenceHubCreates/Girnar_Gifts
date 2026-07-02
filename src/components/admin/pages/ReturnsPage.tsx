'use client'

import { useState, useMemo } from 'react'
import { useAdminFetch } from '@/hooks/useAdminFetch'
import {
  fetchAdminReturns, fetchAdminReturn,
  approveReturn, rejectReturn, receiveReturn, refundReturn, replacementReturn,
  setReturnStatus, setReturnNotes,
  RET_STATUS_LABEL, RET_STATUS_PILL, RET_REASON_LABEL, RET_TYPE_LABEL, GENERIC_NEXT,
  type AdminReturnSummary, type AdminReturnDetail, type AdminReturnItem, type ReceiveItemPayload,
} from '@/lib/adminReturnsApi'

const PLACEHOLDER = '/images/placeholder-product.png'

const STATUS_FILTERS = ['all', 'requested', 'under_review', 'approved', 'rejected', 'received', 'refunded', 'replacement_dispatched', 'completed', 'cancelled_by_customer']
const REASON_FILTERS = ['all', 'damaged', 'defective', 'wrong_item', 'missing_item', 'variant_issue', 'other']

function fmt(s?: string | null): string {
  if (!s) return '—'
  const d = new Date(s); return isNaN(d.getTime()) ? '—' : d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
function inr(n: number | null | undefined): string { return `₹${Number(n || 0).toLocaleString('en-IN')}` }

/* ════════════════ ACTION MODALS ════════════════ */

function ModalShell({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer" style={{ width: 440 }} onClick={e => e.stopPropagation()}>
        <div className="drawer-head">
          <div className="drawer-title">{title}</div>
          <button className="drawer-close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

function RejectModal({ onConfirm, onClose, busy }: { onConfirm: (reason: string, notes: string) => void; onClose: () => void; busy: boolean }) {
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  return (
    <ModalShell title="Reject Return" onClose={onClose}>
      <div className="drawer-body">
        <div className="form-group">
          <label className="form-label">Rejection reason (shown to customer) *</label>
          <textarea className="form-textarea" rows={3} value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Item shows signs of use beyond inspection" />
        </div>
        <div className="form-group">
          <label className="form-label">Internal notes (optional)</label>
          <textarea className="form-textarea" rows={2} value={notes} onChange={e => setNotes(e.target.value)} />
        </div>
      </div>
      <div className="drawer-foot">
        <button className="btn btn-ghost" onClick={onClose} disabled={busy}>Cancel</button>
        <button className="btn btn-danger" disabled={busy || !reason.trim()} onClick={() => onConfirm(reason.trim(), notes.trim())}>
          {busy ? 'Rejecting…' : 'Reject Return'}
        </button>
      </div>
    </ModalShell>
  )
}

function ReceiveModal({ items, onConfirm, onClose, busy }: { items: AdminReturnItem[]; onConfirm: (payload: ReceiveItemPayload[], note: string) => void; onClose: () => void; busy: boolean }) {
  const [conds, setConds] = useState<Record<string, { condition: 'resellable' | 'damaged'; restock: number }>>(() => {
    const m: Record<string, { condition: 'resellable' | 'damaged'; restock: number }> = {}
    items.forEach(it => { m[it.id] = { condition: 'resellable', restock: it.quantity } })
    return m
  })
  const [note, setNote] = useState('')
  return (
    <ModalShell title="Mark Received" onClose={onClose}>
      <div className="drawer-body">
        <div style={{ fontSize: '.78rem', color: 'var(--muted)', marginBottom: 12 }}>
          Set each item’s condition. <strong>Resellable</strong> units are added back to stock; <strong>damaged</strong> units are not.
        </div>
        {items.map(it => {
          const c = conds[it.id]
          return (
            <div key={it.id} className="card" style={{ padding: 12, marginBottom: 10 }}>
              <div style={{ fontWeight: 800, fontSize: '.84rem', marginBottom: 8 }}>{it.product_name || 'Product'} <span style={{ color: 'var(--muted)', fontWeight: 600 }}>· qty {it.quantity}</span></div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                {(['resellable', 'damaged'] as const).map(opt => (
                  <button key={opt} className={`ftab${c.condition === opt ? ' active' : ''}`} style={{ textTransform: 'capitalize' }}
                    onClick={() => setConds(p => ({ ...p, [it.id]: { ...p[it.id], condition: opt, restock: opt === 'damaged' ? 0 : it.quantity } }))}>
                    {opt}
                  </button>
                ))}
              </div>
              {c.condition === 'resellable' && (
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Units to restock (max {it.quantity})</label>
                  <input className="form-input" type="number" min={0} max={it.quantity} value={c.restock}
                    onChange={e => setConds(p => ({ ...p, [it.id]: { ...p[it.id], restock: Math.max(0, Math.min(it.quantity, Number(e.target.value))) } }))} />
                </div>
              )}
            </div>
          )
        })}
        <div className="form-group">
          <label className="form-label">Note (optional)</label>
          <input className="form-input" value={note} onChange={e => setNote(e.target.value)} />
        </div>
      </div>
      <div className="drawer-foot">
        <button className="btn btn-ghost" onClick={onClose} disabled={busy}>Cancel</button>
        <button className="btn btn-primary" disabled={busy}
          onClick={() => onConfirm(items.map(it => ({ return_item_id: it.id, condition_status: conds[it.id].condition, restock_quantity: conds[it.id].restock })), note.trim())}>
          {busy ? 'Saving…' : 'Confirm Received'}
        </button>
      </div>
    </ModalShell>
  )
}

function RefundModal({ suggested, gatewayPaymentId, onConfirm, onClose, busy }:
  { suggested: number; gatewayPaymentId?: string | null; onConfirm: (body: any) => void; onClose: () => void; busy: boolean }) {
  const hasGateway = !!gatewayPaymentId
  const [executeGateway, setExecuteGateway] = useState(hasGateway)   // default ON for gateway orders
  const [amount, setAmount] = useState(String(suggested))
  const [speed, setSpeed] = useState<'normal' | 'optimum'>('normal')
  const [method, setMethod] = useState('manual')
  const [status, setStatus] = useState('completed')
  const [ref, setRef] = useState('')

  const live = executeGateway && hasGateway
  function submit() {
    if (live) onConfirm({ amount: Number(amount), execute_gateway: true, speed })
    else onConfirm({ amount: Number(amount), method, status, transaction_reference: ref.trim() || undefined, execute_gateway: false })
  }

  return (
    <ModalShell title="Process Refund" onClose={onClose}>
      <div className="drawer-body">
        {hasGateway ? (
          <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: 12, border: '1.5px solid var(--border)', borderRadius: 'var(--r-sm)', marginBottom: 14, cursor: 'pointer', background: live ? 'var(--soft-2)' : '#fff' }}>
            <input type="checkbox" checked={executeGateway} onChange={e => setExecuteGateway(e.target.checked)} style={{ marginTop: 2 }} />
            <span>
              <span style={{ fontWeight: 800, fontSize: '.84rem', display: 'block' }}>Process refund through Razorpay</span>
              <span style={{ fontSize: '.74rem', color: 'var(--muted)' }}>Sends money back to the customer’s original payment method. This is a real transfer and runs only when you confirm below.</span>
            </span>
          </label>
        ) : (
          <div style={{ fontSize: '.78rem', color: 'var(--muted)', marginBottom: 12, padding: 10, background: 'var(--soft-2)', borderRadius: 'var(--r-sm)' }}>
            No online (Razorpay) payment on record for this order — settle the refund through your own channel and record it here.
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Amount (₹)</label>
          <input className="form-input" type="number" min={1} value={amount} onChange={e => setAmount(e.target.value)} />
          <span style={{ fontSize: '.7rem', color: 'var(--muted)' }}>Suggested {inr(suggested)} (price paid for returned items). Cannot exceed the captured amount.</span>
        </div>

        {live ? (
          <div className="form-group">
            <label className="form-label">Speed</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['normal', 'optimum'] as const).map(s => (
                <button key={s} type="button" className={`ftab${speed === s ? ' active' : ''}`} onClick={() => setSpeed(s)}>
                  {s === 'normal' ? 'Normal (5–7 days)' : 'Instant (optimum)'}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="form-grid form-grid-2">
            <div className="form-group"><label className="form-label">Method</label>
              <select className="form-select" value={method} onChange={e => setMethod(e.target.value)}>
                <option value="manual">Manual</option><option value="upi">UPI</option><option value="bank_transfer">Bank Transfer</option>
              </select>
            </div>
            <div className="form-group"><label className="form-label">Status</label>
              <select className="form-select" value={status} onChange={e => setStatus(e.target.value)}>
                <option value="pending">Pending</option><option value="initiated">Initiated</option><option value="completed">Completed</option>
              </select>
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}><label className="form-label">Reference (optional)</label><input className="form-input" value={ref} onChange={e => setRef(e.target.value)} placeholder="UTR / txn id" /></div>
          </div>
        )}
      </div>
      <div className="drawer-foot">
        <button className="btn btn-ghost" onClick={onClose} disabled={busy}>Cancel</button>
        <button className="btn btn-primary" disabled={busy || Number(amount) < 1} onClick={submit}>
          {busy ? 'Processing…' : (live ? '💸 Refund via Razorpay' : 'Save Refund')}
        </button>
      </div>
    </ModalShell>
  )
}

function ReplacementModal({ items, onConfirm, onClose, busy }: { items: AdminReturnItem[]; onConfirm: (body: any) => void; onClose: () => void; busy: boolean }) {
  const first = items[0]
  const [productId, setProductId] = useState(first?.product_id ?? '')
  const [qty, setQty] = useState(String(items.reduce((s, it) => s + it.quantity, 0)))
  const [tracking, setTracking] = useState('')
  const [status, setStatus] = useState('dispatched')
  return (
    <ModalShell title="Send Replacement" onClose={onClose}>
      <div className="drawer-body">
        <div style={{ fontSize: '.78rem', color: 'var(--muted)', marginBottom: 12 }}>
          Stock is checked and deducted when you dispatch. Defaults to the returned product and total units.
        </div>
        <div className="form-group"><label className="form-label">Product</label>
          <select className="form-select" value={productId} onChange={e => setProductId(e.target.value)}>
            {items.map(it => <option key={it.id} value={it.product_id}>{it.product_name || it.product_id}{it.current_stock != null ? ` (stock ${it.current_stock})` : ''}</option>)}
          </select>
        </div>
        <div className="form-grid form-grid-2">
          <div className="form-group"><label className="form-label">Quantity</label><input className="form-input" type="number" min={1} value={qty} onChange={e => setQty(e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Status</label>
            <select className="form-select" value={status} onChange={e => setStatus(e.target.value)}>
              <option value="dispatched">Dispatched</option><option value="delivered">Delivered</option><option value="pending">Pending (no stock change)</option>
            </select>
          </div>
        </div>
        <div className="form-group"><label className="form-label">Tracking number (optional)</label><input className="form-input" value={tracking} onChange={e => setTracking(e.target.value)} /></div>
      </div>
      <div className="drawer-foot">
        <button className="btn btn-ghost" onClick={onClose} disabled={busy}>Cancel</button>
        <button className="btn btn-primary" disabled={busy || !productId} onClick={() => onConfirm({ product_id: productId, quantity: Number(qty), tracking_number: tracking.trim() || undefined, status })}>
          {busy ? 'Saving…' : 'Save Replacement'}
        </button>
      </div>
    </ModalShell>
  )
}

/* ════════════════ DETAIL DRAWER ════════════════ */

function ReturnDrawer({ returnId, onClose, onChanged }: { returnId: string; onClose: () => void; onChanged: () => void }) {
  const { data, loading, error, refetch } = useAdminFetch<AdminReturnDetail>(() => fetchAdminReturn(returnId), [returnId])
  const [busy, setBusy] = useState(false)
  const [actErr, setActErr] = useState<string | null>(null)
  const [modal, setModal] = useState<null | 'reject' | 'receive' | 'refund' | 'replacement'>(null)
  const [notesDraft, setNotesDraft] = useState<string | null>(null)

  async function run(fn: () => Promise<AdminReturnDetail>) {
    setBusy(true); setActErr(null)
    try { await fn(); await refetch(); onChanged(); setModal(null) }
    catch (e: any) { setActErr(e?.message || 'Action failed') }
    finally { setBusy(false) }
  }

  const d = data
  const suggestedRefund = useMemo(() => (d?.items ?? []).reduce((s, it) => s + it.item_price * it.quantity, 0), [d])

  return (
    <div className="drawer-overlay" onClick={() => !busy && onClose()}>
      <div className="drawer" style={{ width: 620, maxWidth: '96vw' }} onClick={e => e.stopPropagation()}>
        <div className="drawer-head">
          <div className="drawer-title">Return {d ? `#${d.order?.order_number ?? d.id.slice(0, 8).toUpperCase()}` : ''}</div>
          <button className="drawer-close" onClick={() => !busy && onClose()} aria-label="Close">✕</button>
        </div>

        <div className="drawer-body">
          {loading ? (
            <>{[1, 2, 3].map(i => <div key={i} className="ll-skeleton" style={{ height: 40, marginBottom: 10 }} />)}</>
          ) : error ? (
            <div className="ll-error">⚠️ {error} <button className="btn btn-outline btn-sm" onClick={refetch}>Retry</button></div>
          ) : d ? (
            <>
              {/* Status + meta */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
                <span className={`pill ${RET_STATUS_PILL[d.status] ?? 'pill-grey'}`}>{RET_STATUS_LABEL[d.status] ?? d.status}</span>
                <span className="tag tag-regular">{RET_TYPE_LABEL[d.request_type] ?? d.request_type}</span>
                <span style={{ fontSize: '.78rem', color: 'var(--muted)' }}>{RET_REASON_LABEL[d.reason] ?? d.reason}</span>
              </div>

              {actErr && <div className="ll-error" style={{ marginBottom: 12 }}>⚠️ {actErr}</div>}

              {/* Customer + order */}
              <div className="form-grid form-grid-2" style={{ marginBottom: 14 }}>
                <div className="card" style={{ padding: 12 }}>
                  <div className="form-label">Customer</div>
                  <div style={{ fontWeight: 800, fontSize: '.84rem' }}>{d.customer?.name || '—'}</div>
                  <div style={{ fontSize: '.74rem', color: 'var(--muted)' }}>{d.customer?.email}</div>
                  <div style={{ fontSize: '.74rem', color: 'var(--muted)' }}>{d.customer?.phone}</div>
                </div>
                <div className="card" style={{ padding: 12 }}>
                  <div className="form-label">Order</div>
                  <div style={{ fontWeight: 800, fontSize: '.84rem' }}>#{d.order?.order_number}</div>
                  <div style={{ fontSize: '.74rem', color: 'var(--muted)' }}>Total {inr(d.order?.total_amount)}</div>
                  <div style={{ fontSize: '.74rem', color: 'var(--muted)' }}>Delivered {fmt(d.order?.delivered_at)}</div>
                </div>
              </div>

              {d.description && <div className="card" style={{ padding: 12, marginBottom: 14, fontSize: '.82rem' }}>{d.description}</div>}
              {d.rejection_reason && <div className="ll-error" style={{ marginBottom: 14 }}>Rejected: {d.rejection_reason}</div>}

              {/* Items */}
              <div className="form-label" style={{ marginBottom: 6 }}>Items</div>
              <div className="table-wrap" style={{ marginBottom: 14 }}>
                <table>
                  <thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Condition</th><th>Restocked</th></tr></thead>
                  <tbody>
                    {d.items.map(it => (
                      <tr key={it.id}>
                        <td style={{ fontWeight: 700 }}>{it.product_name || '—'}{it.current_stock != null && <div className="td-muted">stock: {it.current_stock}</div>}</td>
                        <td>{it.quantity}</td>
                        <td>{inr(it.item_price)}</td>
                        <td style={{ textTransform: 'capitalize' }}>{it.condition_status}</td>
                        <td>{it.restock_quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Proofs */}
              {d.proofs.length > 0 && (
                <>
                  <div className="form-label" style={{ marginBottom: 6 }}>Customer proof</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                    {d.proofs.map(p => (
                      <a key={p.id} href={p.file_url} target="_blank" rel="noopener" style={{ width: 76, height: 76, borderRadius: 'var(--r-sm)', overflow: 'hidden', border: '1.5px solid var(--border)' }}>
                        <img src={p.file_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
                      </a>
                    ))}
                  </div>
                </>
              )}

              {/* Refund / replacement summaries */}
              {d.refund && (
                <div className="card" style={{ padding: 12, marginBottom: 14 }}>
                  <div className="form-label">Refund</div>
                  <div style={{ fontSize: '.82rem' }}>{inr(d.refund.amount)} · <span style={{ textTransform: 'capitalize' }}>{d.refund.status}</span> · <span style={{ textTransform: 'capitalize' }}>{d.refund.method}</span>{d.refund.transaction_reference ? ` · ${d.refund.transaction_reference}` : ''}</div>
                </div>
              )}
              {d.replacement && (
                <div className="card" style={{ padding: 12, marginBottom: 14 }}>
                  <div className="form-label">Replacement</div>
                  <div style={{ fontSize: '.82rem' }}>Qty {d.replacement.quantity} · <span style={{ textTransform: 'capitalize' }}>{d.replacement.status}</span>{d.replacement.tracking_number ? ` · ${d.replacement.tracking_number}` : ''}</div>
                </div>
              )}

              {/* Admin notes */}
              <div className="form-group">
                <label className="form-label">Internal notes</label>
                <textarea className="form-textarea" rows={2}
                  value={notesDraft ?? d.admin_notes ?? ''}
                  onChange={e => setNotesDraft(e.target.value)} />
                {notesDraft !== null && notesDraft !== (d.admin_notes ?? '') && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
                    <button className="btn btn-outline btn-sm" disabled={busy} onClick={() => run(() => setReturnNotes(d.id, notesDraft))}>Save notes</button>
                  </div>
                )}
              </div>

              {/* Timeline */}
              <div className="form-label" style={{ margin: '14px 0 8px' }}>Timeline</div>
              <div className="ret-timeline">
                {d.status_history.map((h, i) => (
                  <div key={h.id} className="ret-tl-item">
                    <div className="ret-tl-dot-wrap">
                      <span className="ret-tl-dot" />
                      {i < d.status_history.length - 1 && <span className="ret-tl-line" />}
                    </div>
                    <div className="ret-tl-body">
                      <div className="ret-tl-status">{RET_STATUS_LABEL[h.new_status] ?? h.new_status}</div>
                      {h.note && <div className="ret-tl-note">{h.note}</div>}
                      <div className="ret-tl-date">{fmt(h.created_at)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </div>

        {/* Action footer — buttons depend on current status */}
        {d && (
          <div className="drawer-foot" style={{ flexWrap: 'wrap', justifyContent: 'flex-start', gap: 8 }}>
            {(d.status === 'requested' || d.status === 'under_review') && (
              <>
                <button className="btn btn-primary" disabled={busy} onClick={() => run(() => approveReturn(d.id))}>✓ Approve</button>
                <button className="btn btn-danger" disabled={busy} onClick={() => setModal('reject')}>✕ Reject</button>
              </>
            )}
            {(GENERIC_NEXT[d.status] ?? []).map(next => (
              <button key={next} className="btn btn-outline" disabled={busy} onClick={() => run(() => setReturnStatus(d.id, next))}>
                → {RET_STATUS_LABEL[next] ?? next}
              </button>
            ))}
            {['approved', 'pickup_scheduled', 'picked_up'].includes(d.status) && (
              <button className="btn btn-outline" disabled={busy} onClick={() => setModal('receive')}>📦 Mark Received</button>
            )}
            {['received', 'approved'].includes(d.status) && d.request_type === 'refund' && (
              <button className="btn btn-primary" disabled={busy} onClick={() => setModal('refund')}>💸 Refund</button>
            )}
            {['received', 'approved'].includes(d.status) && d.request_type === 'replacement' && (
              <button className="btn btn-primary" disabled={busy} onClick={() => setModal('replacement')}>🔁 Send Replacement</button>
            )}
            <button className="btn btn-ghost" style={{ marginLeft: 'auto' }} disabled={busy} onClick={onClose}>Close</button>
          </div>
        )}

        {/* Modals */}
        {modal === 'reject' && d && <RejectModal busy={busy} onClose={() => setModal(null)} onConfirm={(reason, notes) => run(() => rejectReturn(d.id, reason, notes || undefined))} />}
        {modal === 'receive' && d && <ReceiveModal busy={busy} items={d.items} onClose={() => setModal(null)} onConfirm={(payload, note) => run(() => receiveReturn(d.id, payload, note || undefined))} />}
        {modal === 'refund' && d && <RefundModal busy={busy} suggested={suggestedRefund} gatewayPaymentId={d.order?.razorpay_payment_id} onClose={() => setModal(null)} onConfirm={(body) => run(() => refundReturn(d.id, body))} />}
        {modal === 'replacement' && d && <ReplacementModal busy={busy} items={d.items} onClose={() => setModal(null)} onConfirm={(body) => run(() => replacementReturn(d.id, body))} />}
      </div>
    </div>
  )
}

/* ════════════════ LIST PAGE ════════════════ */

export default function ReturnsPage() {
  const [statusFilter, setStatusFilter] = useState('all')
  const [reasonFilter, setReasonFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage] = useState(0)
  const [openId, setOpenId] = useState<string | null>(null)
  const LIMIT = 20

  const { data, loading, error, refetch } = useAdminFetch(
    () => fetchAdminReturns({
      skip: page * LIMIT, limit: LIMIT,
      status: statusFilter === 'all' ? undefined : statusFilter,
      reason: reasonFilter === 'all' ? undefined : reasonFilter,
      search: search || undefined,
    }),
    [statusFilter, reasonFilter, search, page],
  )

  const rows: AdminReturnSummary[] = data?.data ?? []
  const total = data?.totalCount ?? 0
  const totalPages = Math.max(1, Math.ceil(total / LIMIT))

  return (
    <div>
      <div className="page-header">
        <div className="ph-left">
          <div className="ph-title">Returns</div>
          <div className="ph-sub">{total} return request{total !== 1 ? 's' : ''}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: 14, marginBottom: 18 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <select className="form-select" style={{ maxWidth: 200 }} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(0) }}>
            {STATUS_FILTERS.map(s => <option key={s} value={s}>{s === 'all' ? 'All statuses' : (RET_STATUS_LABEL[s] ?? s)}</option>)}
          </select>
          <select className="form-select" style={{ maxWidth: 180 }} value={reasonFilter} onChange={e => { setReasonFilter(e.target.value); setPage(0) }}>
            {REASON_FILTERS.map(r => <option key={r} value={r}>{r === 'all' ? 'All reasons' : (RET_REASON_LABEL[r] ?? r)}</option>)}
          </select>
          <div className="tb-search" style={{ width: 260 }}>
            <input type="text" placeholder="Order id, customer, product…" value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { setSearch(searchInput.trim()); setPage(0) } }} />
            {searchInput && <button className="tb-search-clear" onClick={() => { setSearchInput(''); setSearch(''); setPage(0) }} aria-label="Clear">×</button>}
          </div>
          <button className="btn btn-outline btn-sm" onClick={() => { setSearch(searchInput.trim()); setPage(0) }}>Search</button>
        </div>
      </div>

      {/* List */}
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Return</th><th>Customer</th><th>Reason</th><th>Type</th><th>Items</th><th>Refund</th><th>Status</th><th>Created</th></tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 8 }).map((_, j) => <td key={j}><div className="ll-skeleton" style={{ height: 14 }} /></td>)}</tr>
                ))
              ) : error ? (
                <tr><td colSpan={8}><div className="ll-error">⚠️ {error} <button className="btn btn-outline btn-sm" onClick={refetch}>Retry</button></div></td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={8}><div className="ll-empty"><div className="ll-empty-icon">📦</div>No returns found</div></td></tr>
              ) : (
                rows.map(r => (
                  <tr key={r.id} className="is-clickable" onClick={() => setOpenId(r.id)}>
                    <td className="td-id">#{r.order_number}</td>
                    <td>{r.customer_name || '—'}<div className="td-muted">{r.customer_email}</div></td>
                    <td>{RET_REASON_LABEL[r.reason] ?? r.reason}</td>
                    <td>{RET_TYPE_LABEL[r.request_type] ?? r.request_type}</td>
                    <td>{r.item_count} ({r.total_units})</td>
                    <td>{r.total_refund_amount != null ? inr(r.total_refund_amount) : '—'}</td>
                    <td><span className={`pill ${RET_STATUS_PILL[r.status] ?? 'pill-grey'}`}>{RET_STATUS_LABEL[r.status] ?? r.status}</span></td>
                    <td className="td-muted">{fmt(r.created_at)}</td>
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

      {openId && <ReturnDrawer returnId={openId} onClose={() => setOpenId(null)} onChanged={refetch} />}
    </div>
  )
}