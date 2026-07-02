'use client'

import { useState, useCallback } from 'react'
import { useAdminFetch } from '@/hooks/useAdminFetch'
import {
  fetchAdminCustomers, deleteCustomer, fetchCustomerById, setCustomerActive,
  fetchCategories, fetchAdminCategories, createCategory, updateCategory, deleteCategory,
  fetchCoupons, createCoupon, updateCoupon, deleteCoupon,
  fetchAdminReviews, approveReview, deleteReview,
  type ApiCustomer, type ApiCustomerDetail, type ApiCategory, type ApiCoupon, type ApiReview,
} from '@/lib/adminApi'

// ─── Shared UI helpers ────────────────────────────────────────────

/**
 * Returns a safe emoji to display. Real emoji → shown as-is.
 * Empty, mojibake ("??", "?"), or non-emoji junk → null (caller shows default).
 */
function safeEmoji(raw: string | null | undefined): string | null {
  if (!raw) return null
  const v = raw.trim()
  if (!v) return null
  // Reject the mojibake/placeholder patterns: "?", "??", "???", replacement char
  if (/^\?+$/.test(v)) return null
  if (v.includes('\uFFFD')) return null            // � replacement character
  // Accept only if it actually contains an emoji / pictographic glyph
  const hasEmoji = /\p{Extended_Pictographic}/u.test(v)
  return hasEmoji ? v : null
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div style={{
      background: '#fff1f0', border: '1px solid #fca5a5',
      borderRadius: 8, padding: '10px 14px',
      color: '#b91c1c', fontSize: '.82rem',
      fontWeight: 700, marginBottom: 16,
      display: 'flex', alignItems: 'center', gap: 8,
    }}>
      ⚠️ {message}
    </div>
  )
}

function SkeletonRows({ rows, cols }: { rows: number; cols: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i}>
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j} style={{ padding: '12px 16px' }}>
              <div style={{
                height: 12, borderRadius: 6, width: j === 0 ? '70%' : '90%',
                background: 'linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%)',
                backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite',
              }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

function Toast({ msg, type, onDone }: { msg: string; type: 'success' | 'error'; onDone: () => void }) {
  useState(() => { setTimeout(onDone, 3000) })
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
      {type === 'success' ? '✓' : '✕'} {msg}
    </div>
  )
}

const PAGE_STYLES = `
  @keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }
  @keyframes slideUp { from { transform: translateY(20px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
  @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
  .admin-table { width: 100%; border-collapse: collapse; font-size: .82rem; }
  .admin-table thead tr { background: #fafafa; }
  .admin-table th { padding: 10px 16px; text-align: left; font-size: .68rem; font-weight: 900; color: #9ca3af; letter-spacing: .06em; border-bottom: 1px solid #f0f0f0; white-space: nowrap; }
  .admin-table tbody tr { border-bottom: 1px solid #fafafa; transition: background .1s; }
  .admin-table tbody tr:hover { background: #fafafa; }
  .admin-table td { padding: 12px 16px; vertical-align: middle; }
  .admin-card { background: #fff; border-radius: 14px; border: 1px solid #f0f0f0; box-shadow: 0 1px 10px rgba(0,0,0,0.04); overflow: hidden; }
  .admin-page-header { display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-bottom: 20px; }
  .admin-ph-title { font-size: 1.35rem; font-weight: 900; color: #111827; line-height: 1.2; }
  .admin-ph-sub { font-size: .78rem; color: #9ca3af; margin-top: 4px; font-weight: 600; }
  .admin-toolbar { padding: 14px 20px; border-bottom: 1px solid #f0f0f0; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; }
  .admin-search { display: flex; align-items: center; gap: 8px; border: 1.5px solid #e5e7eb; border-radius: 8px; padding: 7px 12px; background: #fafafa; min-width: 200px; }
  .admin-search input { border: none; background: transparent; outline: none; font-size: .82rem; font-weight: 600; color: #111; width: 100%; }
  .admin-btn { padding: 8px 16px; border-radius: 8px; border: 1.5px solid #e5e7eb; background: #fff; font-weight: 700; font-size: .82rem; cursor: pointer; color: #374151; transition: all .15s; }
  .admin-btn:hover { border-color: #d1d5db; background: #f9fafb; }
  .admin-btn-primary { background: #1d4ed8; color: #fff; border-color: #1d4ed8; }
  .admin-btn-primary:hover { background: #1e40af; border-color: #1e40af; }
  .admin-btn-danger { border-color: #fca5a5; color: #dc2626; }
  .admin-btn-danger:hover { background: #fff1f0; }
  .admin-btn-sm { padding: 5px 12px; font-size: .75rem; }
  .admin-btn-xs { padding: 4px 10px; font-size: .72rem; border-radius: 6px; }
  .admin-btn-icon { width: 30px; height: 30px; padding: 0; display: inline-flex; align-items: center; justify-content: center; border-radius: 7px; }
  .drawer-overlay { position: fixed; inset: 0; z-index: 1000; background: rgba(0,0,0,0.45); backdrop-filter: blur(3px); display: flex; justify-content: flex-end; }
  .drawer-panel { width: 480px; max-width: 100vw; height: 100%; background: #fff; display: flex; flex-direction: column; box-shadow: -8px 0 40px rgba(0,0,0,0.14); animation: slideIn .22s ease; }
  @keyframes slideIn { from { transform: translateX(100%) } to { transform: translateX(0) } }
  .drawer-head { padding: 18px 24px; border-bottom: 1px solid #f0f0f0; display: flex; align-items: center; justify-content: space-between; background: #fafafa; }
  .drawer-body { flex: 1; overflow-y: auto; padding: 20px 24px; display: flex; flex-direction: column; gap: 16px; }
  .drawer-footer { padding: 14px 24px; border-top: 1px solid #f0f0f0; display: flex; gap: 10px; justify-content: flex-end; background: #fafafa; }
  .form-field { display: flex; flex-direction: column; gap: 5px; }
  .form-label { font-size: .75rem; font-weight: 800; color: #374151; letter-spacing: .02em; }
  .form-input, .form-select { padding: 9px 12px; border-radius: 8px; border: 1.5px solid #e5e7eb; font-size: .85rem; font-weight: 600; color: #111; background: #fff; outline: none; transition: border-color .15s; width: 100%; box-sizing: border-box; }
  .form-input:focus, .form-select:focus { border-color: #1d4ed8; }
  .form-input.error, .form-select.error { border-color: #dc2626; }
  .form-hint { font-size: .7rem; color: #9ca3af; }
  .form-err  { font-size: .7rem; color: #dc2626; font-weight: 700; }
  .form-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .pill-green  { background: #dcfce7; color: #15803d; }
  .pill-yellow { background: #fef9c3; color: #a16207; }
  .pill-red    { background: #fee2e2; color: #b91c1c; }
  .pill-blue   { background: #dbeafe; color: #1d4ed8; }
  .pill-grey   { background: #f3f4f6; color: #374151; }
  .pill-purple { background: #ede9fe; color: #6d28d9; }
  .pill { display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px; border-radius: 20px; font-size: .68rem; font-weight: 800; white-space: nowrap; }
  .status-dot { width: 6px; height: 6px; border-radius: 50%; display: inline-block; }
  .tag-vip     { background: #fef9c3; color: #a16207; }
  .tag-new     { background: #dbeafe; color: #1d4ed8; }
  .tag-regular { background: #f3f4f6; color: #374151; }
  .tag { display: inline-flex; padding: 3px 9px; border-radius: 20px; font-size: .68rem; font-weight: 800; }
  .rc-av { width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
`

// ─── CUSTOMERS PAGE ───────────────────────────────────────────────

const AVATAR_BG = ['#fff1f0','#fff7e6','#f0f9ff','#f9f0ff','#f0fff4','#fff0f6']
const AVATAR_TEXT = ['#cf1322','#d46b08','#096dd9','#531dab','#237804','#c41d7f']
const EMOJI_LIST = ['👩','👨','👩‍💼','🧑','👩','🧔']


function CustomerStatusPill({ role, isActive }: { role: number; isActive: boolean }) {
  if (!isActive) return <span className="pill pill-red">Deactivated</span>
  return <span className="pill pill-green"><span className="status-dot" style={{ background: '#16a34a' }} />Active</span>
}

function CustomerDrawer({ customerId, onClose, onChanged }: {
  customerId: string
  onClose: () => void
  onChanged: (msg: string) => void
}) {
  const { data, loading, error, refetch } = useAdminFetch(
    (_s) => fetchCustomerById(customerId),
    [customerId],
  )
  const [toggling, setToggling] = useState(false)

  async function toggleActive() {
    if (!data) return
    setToggling(true)
    try {
      await setCustomerActive(data.id, !data.is_active)
      refetch()
      onChanged(`Customer ${!data.is_active ? 'activated' : 'deactivated'}`)
    } catch (e: any) {
      onChanged(e.message ?? 'Update failed')
    } finally {
      setToggling(false)
    }
  }

  const fmtMoney = (n: number) => `₹${n.toLocaleString('en-IN')}`
  const fmtDate  = (s: string | null) => s ? new Date(s).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—'

  const STATUS_COLORS: Record<string, string> = {
    delivered:'#15803d', confirmed:'#1d4ed8', processing:'#6366f1',
    shipped:'#0284c7', pending:'#ca8a04', cancelled:'#dc2626',
  }

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-panel" onClick={e => e.stopPropagation()}>
        <div className="drawer-head">
          <div style={{ fontWeight: 900, fontSize: '1rem' }}>👤 Customer Profile</div>
          <button onClick={onClose} style={{ width:30, height:30, borderRadius:'50%', border:'1.5px solid #e5e7eb', background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#6b7280' }}>×</button>
        </div>

        <div className="drawer-body">
          {loading ? (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {Array.from({length:4}).map((_,i)=>(
                <div key={i} style={{ height:48, borderRadius:8, background:'linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%)', backgroundSize:'200% 100%', animation:'shimmer 1.4s infinite' }} />
              ))}
            </div>
          ) : error ? (
            <div style={{ textAlign:'center', padding:'30px 0' }}>
              <ErrorBanner message={error} />
              <button className="admin-btn" onClick={refetch}>Retry</button>
            </div>
          ) : data ? (
            <>
              {/* Header */}
              <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                <div className="rc-av" style={{ width:54, height:54, background:'#eff6ff', color:'#1d4ed8', fontWeight:900, fontSize:'1.3rem' }}>
                  {(data.name || data.email || '?')[0].toUpperCase()}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:900, fontSize:'1.05rem' }}>{data.name || '—'}</div>
                  <div style={{ fontSize:'.82rem', color:'#6b7280', wordBreak:'break-all' }}>{data.email}</div>
                  <div style={{ display:'flex', gap:6, marginTop:6 }}>
                    <CustomerStatusPill role={data.role} isActive={data.is_active} />
                    {data.confirmed && <span className="pill pill-blue">Verified</span>}
                  </div>
                </div>
              </div>

              {/* KPIs */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
                {[
                  { label:'Total Orders', val: String(data.total_orders) },
                  { label:'Total Spent',  val: fmtMoney(data.total_spent) },
                  { label:'Last Order',   val: fmtDate(data.last_order_date) },
                ].map(k=>(
                  <div key={k.label} style={{ background:'#f9fafb', borderRadius:10, padding:'12px', textAlign:'center', border:'1px solid #f0f0f0' }}>
                    <div style={{ fontWeight:900, fontSize:'1.1rem', color:'#111' }}>{k.val}</div>
                    <div style={{ fontSize:'.68rem', color:'#9ca3af', fontWeight:700, marginTop:2 }}>{k.label}</div>
                  </div>
                ))}
              </div>

              {/* Contact */}
              <div>
                <div style={{ fontSize:'.7rem', fontWeight:900, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:8 }}>Contact</div>
                <div style={{ background:'#f9fafb', borderRadius:8, padding:'10px 14px', fontSize:'.84rem', display:'flex', flexDirection:'column', gap:4 }}>
                  <div><strong>Phone:</strong> {data.phone || '—'}</div>
                  <div><strong>Joined:</strong> {fmtDate(data.created_at)}</div>
                  <div><strong>Account type:</strong> {data.role === 5 ? 'Customer' : `Role ${data.role}`}</div>
                </div>
              </div>

              {/* Addresses */}
              <div>
                <div style={{ fontSize:'.7rem', fontWeight:900, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:8 }}>
                  Saved Addresses ({data.addresses.length})
                </div>
                {data.addresses.length === 0 ? (
                  <div style={{ color:'#9ca3af', fontSize:'.82rem', padding:'10px 0' }}>No saved addresses.</div>
                ) : (
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    {data.addresses.map(a=>(
                      <div key={a.id} style={{ border:'1px solid #f0f0f0', borderRadius:8, padding:'10px 14px', fontSize:'.82rem' }}>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
                          <strong>{a.full_name}</strong>
                          {a.is_default && <span className="pill pill-blue">Default</span>}
                        </div>
                        <div style={{ color:'#6b7280' }}>
                          {[a.address_line1, a.address_line2].filter(Boolean).join(', ')}<br/>
                          {a.city}, {a.state} {a.postal_code}, {a.country}
                        </div>
                        <div style={{ color:'#9ca3af', fontSize:'.74rem', marginTop:2 }}>{a.phone} · {a.address_type}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Order history */}
              <div>
                <div style={{ fontSize:'.7rem', fontWeight:900, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:8 }}>
                  Order History ({data.total_orders}{data.total_orders > data.orders.length ? `, showing ${data.orders.length}` : ''})
                </div>
                {data.orders.length === 0 ? (
                  <div style={{ color:'#9ca3af', fontSize:'.82rem', padding:'10px 0' }}>No orders yet.</div>
                ) : (
                  <div style={{ border:'1px solid #f0f0f0', borderRadius:8, overflow:'hidden' }}>
                    <table className="admin-table" style={{ fontSize:'.78rem' }}>
                      <thead><tr>{['Order','Items','Amount','Date','Status'].map(h=><th key={h}>{h.toUpperCase()}</th>)}</tr></thead>
                      <tbody>
                        {data.orders.map(o=>(
                          <tr key={o.id}>
                            <td style={{ fontFamily:'monospace', fontWeight:800, color:'#1d4ed8' }}>#{o.order_number}</td>
                            <td style={{ color:'#6b7280' }}>{o.item_count}</td>
                            <td style={{ fontWeight:800 }}>{fmtMoney(o.total_amount)}</td>
                            <td style={{ color:'#9ca3af', whiteSpace:'nowrap' }}>{fmtDate(o.created_at)}</td>
                            <td><span style={{ textTransform:'capitalize', fontWeight:700, color: STATUS_COLORS[o.status?.toLowerCase()] ?? '#374151' }}>{o.status}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>

        {data && (
          <div className="drawer-footer">
            <button className="admin-btn admin-btn-danger" disabled={toggling} onClick={toggleActive}>
              {toggling ? '…' : data.is_active ? '🚫 Deactivate Customer' : '✅ Activate Customer'}
            </button>
            <button className="admin-btn" onClick={onClose}>Close</button>
          </div>
        )}
      </div>
    </div>
  )
}


export function CustomersPage() {
  const [search,      setSearch]      = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [page,        setPage]        = useState(0)
  const [segment,     setSegment]     = useState('')
  const [viewId,      setViewId]      = useState<string | null>(null)
  const [toast,       setToast]       = useState<{msg:string;type:'success'|'error'}|null>(null)
  const LIMIT = 15

  const { data, loading, error, refetch } = useAdminFetch(
    (_signal) => fetchAdminCustomers({ skip: page * LIMIT, limit: LIMIT, search: search || undefined, segment: segment || undefined }),
    [page, search, segment],
  )

  const customers  = data?.data       ?? []
  const totalCount = data?.totalCount ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / LIMIT))

  const [timer, setTimer] = useState<ReturnType<typeof setTimeout>|null>(null)
  function handleSearch(value: string) {
    setSearchInput(value)
    if (timer) clearTimeout(timer)
    setTimer(setTimeout(() => { setSearch(value); setPage(0) }, 380))
  }

  function segmentTag(c: ApiCustomer) {
    if (c.total_orders >= 10) return { cls: 'tag-vip',     label: '⭐ VIP'  }
    if (c.total_orders === 0) return { cls: 'tag-new',     label: '🆕 New'  }
    return                         { cls: 'tag-regular',   label: 'Regular' }
  }
  const fmtDate = (s: string | null) => s ? new Date(s).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—'

  async function handleDelete(c: ApiCustomer) {
    if (!confirm(`Permanently delete "${c.name}"? This cannot be undone.`)) return
    try { await deleteCustomer(c.id); refetch(); setToast({ msg: 'Customer deleted', type: 'success' }) }
    catch (err: any) { setToast({ msg: err.message ?? 'Delete failed', type: 'error' }) }
  }

  const SEGMENT_TABS = ['All', '⭐ VIP', 'Regular', '🆕 New']
  const pageWindow = (() => {
    const W = 5, half = 2
    let start = Math.max(0, page - half)
    const end = Math.min(totalPages - 1, start + W - 1)
    start = Math.max(0, end - W + 1)
    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  })()

  return (
    <>
      <style>{PAGE_STYLES}</style>
      <style>{`
        .cust-cards { display: none; }
        @media (max-width: 820px) {
          .cust-table-wrap { display: none; }
          .cust-cards { display: flex; flex-direction: column; gap: 10px; padding: 12px; }
        }
      `}</style>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div className="admin-page-header">
          <div>
            <div className="admin-ph-title">Customers</div>
            <div className="admin-ph-sub">{loading ? 'Loading…' : `${totalCount.toLocaleString()} registered customers`}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="admin-btn" onClick={refetch}>↻ Refresh</button>
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-toolbar">
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {SEGMENT_TABS.map((tab) => {
                const val = tab === 'All' ? '' : (tab.includes('VIP') ? 'vip' : tab.includes('New') ? 'new' : 'regular')
                const active = segment === val
                return (
                  <button key={tab} onClick={() => { setSegment(val); setPage(0) }}
                    style={{ padding:'5px 14px', borderRadius:20, fontSize:'.78rem', fontWeight:700, cursor:'pointer', border:'1.5px solid transparent', background: active ? '#1d4ed8' : 'transparent', color: active ? '#fff' : '#6b7280' }}>
                    {tab}
                  </button>
                )
              })}
            </div>
            <div className="admin-search">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input placeholder="Search name, email, phone…" value={searchInput} onChange={(e) => handleSearch(e.target.value)} />
              {searchInput && <button onClick={() => { setSearchInput(''); setSearch(''); setPage(0) }} style={{ border:'none', background:'none', cursor:'pointer', color:'#9ca3af', fontSize:15, padding:0 }}>×</button>}
            </div>
          </div>

          {error && <div style={{ padding: '0 20px 4px' }}><ErrorBanner message={error} /></div>}

          {/* Table (desktop) */}
          <div className="cust-table-wrap" style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>{['Customer','Email','Orders','Total Spent','Last Order','Joined','Segment','Status','Actions'].map(h => <th key={h}>{h.toUpperCase()}</th>)}</tr>
              </thead>
              <tbody>
                {loading ? <SkeletonRows rows={8} cols={9} /> :
                 customers.length === 0 ? (
                  <tr><td colSpan={9} style={{ textAlign:'center', padding:'50px 20px', color:'#9ca3af', fontWeight:700 }}>
                    <div style={{ fontSize:36, marginBottom:10 }}>👤</div>
                    {search ? `No customers match "${search}"` : 'No customers found'}
                  </td></tr>
                 ) : customers.map((c, idx) => {
                   const seg = segmentTag(c)
                   const i   = idx % AVATAR_BG.length
                   return (
                     <tr key={c.id} style={c.is_active ? undefined : { opacity: 0.6 }}>
                       <td>
                         <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                           <div className="rc-av" style={{ background:AVATAR_BG[i], color:AVATAR_TEXT[i], fontWeight:900, fontSize:'.75rem' }}>{(c.name||'?')[0].toUpperCase()}</div>
                           <div>
                             <div style={{ fontWeight:800, color:'#111' }}>{c.name || '—'}</div>
                             <div style={{ fontSize:'.72rem', color:'#9ca3af' }}>{c.phone || '—'}</div>
                           </div>
                         </div>
                       </td>
                       <td style={{ color:'#6b7280', fontSize:'.8rem' }}>{c.email}</td>
                       <td style={{ fontWeight:800, color:'#111' }}>{c.total_orders}</td>
                       <td style={{ fontWeight:900, color:'#1d4ed8' }}>₹{c.total_spent.toLocaleString('en-IN')}</td>
                       <td style={{ color:'#9ca3af', fontSize:'.8rem', whiteSpace:'nowrap' }}>{fmtDate(c.last_order_date)}</td>
                       <td style={{ color:'#9ca3af', fontSize:'.8rem', whiteSpace:'nowrap' }}>{fmtDate(c.created_at)}</td>
                       <td><span className={`tag ${seg.cls}`}>{seg.label}</span></td>
                       <td>
                         {c.is_active
                           ? <span className="pill pill-green"><span className="status-dot" style={{ background:'#16a34a' }} />Active</span>
                           : <span className="pill pill-red">Inactive</span>}
                       </td>
                       <td>
                         <div style={{ display:'flex', gap:6 }}>
                           <button className="admin-btn admin-btn-icon admin-btn-xs" title="View profile" onClick={() => setViewId(c.id)}>👁</button>
                           <button className="admin-btn admin-btn-icon admin-btn-xs admin-btn-danger" title="Delete" onClick={() => handleDelete(c)}>🗑</button>
                         </div>
                       </td>
                     </tr>
                   )
                 })}
              </tbody>
            </table>
          </div>

          {/* Cards (mobile) */}
          <div className="cust-cards">
            {loading ? Array.from({length:4}).map((_,i)=>(<div key={i} style={{ height:90, borderRadius:12, background:'linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%)', backgroundSize:'200% 100%', animation:'shimmer 1.4s infinite' }} />))
             : customers.length === 0 ? <div style={{ padding:'40px', textAlign:'center', color:'#9ca3af', fontWeight:700 }}>👤 No customers found</div>
             : customers.map((c, idx) => {
               const seg = segmentTag(c)
               return (
                 <div key={c.id} style={{ border:'1px solid #f0f0f0', borderRadius:12, padding:14, opacity: c.is_active ? 1 : 0.6 }}>
                   <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                     <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                       <div className="rc-av" style={{ background:AVATAR_BG[idx%AVATAR_BG.length], color:AVATAR_TEXT[idx%AVATAR_TEXT.length], fontWeight:900, fontSize:'.75rem' }}>{(c.name||'?')[0].toUpperCase()}</div>
                       <div>
                         <div style={{ fontWeight:800 }}>{c.name || '—'}</div>
                         <div style={{ fontSize:'.72rem', color:'#9ca3af' }}>{c.email}</div>
                       </div>
                     </div>
                     <span className={`tag ${seg.cls}`}>{seg.label}</span>
                   </div>
                   <div style={{ display:'flex', justifyContent:'space-between', fontSize:'.78rem', color:'#6b7280', marginBottom:10 }}>
                     <span>{c.total_orders} orders · {fmtDate(c.last_order_date)}</span>
                     <span style={{ fontWeight:900, color:'#111' }}>₹{c.total_spent.toLocaleString('en-IN')}</span>
                   </div>
                   <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                     {c.is_active ? <span className="pill pill-green">Active</span> : <span className="pill pill-red">Inactive</span>}
                     <div style={{ display:'flex', gap:6 }}>
                       <button className="admin-btn admin-btn-xs" onClick={() => setViewId(c.id)}>View</button>
                       <button className="admin-btn admin-btn-icon admin-btn-xs admin-btn-danger" onClick={() => handleDelete(c)}>🗑</button>
                     </div>
                   </div>
                 </div>
               )
             })}
          </div>

          {!loading && customers.length > 0 && (
            <div style={{ padding: '12px 20px', borderTop: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <span style={{ fontSize: '.75rem', fontWeight: 700, color: '#9ca3af' }}>
                Showing {page * LIMIT + 1}–{Math.min((page + 1) * LIMIT, totalCount)} of {totalCount.toLocaleString()}
              </span>
              <div style={{ display: 'flex', gap: 4 }}>
                <button className="admin-btn admin-btn-sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>‹ Prev</button>
                {pageWindow.map(p => (
                  <button key={p} className="admin-btn admin-btn-sm" onClick={() => setPage(p)}
                    style={{ background: page === p ? '#1d4ed8' : undefined, color: page === p ? '#fff' : undefined, borderColor: page === p ? '#1d4ed8' : undefined }}>{p + 1}</button>
                ))}
                <button className="admin-btn admin-btn-sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next ›</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {viewId && <CustomerDrawer customerId={viewId} onClose={() => setViewId(null)} onChanged={(msg) => { setToast({ msg, type: 'success' }); refetch() }} />}
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </>
  )
}

// ─── CATEGORIES PAGE ──────────────────────────────────────────────

interface CatFormState {
  name: string; slug: string; emoji: string
  description: string; parent_id: string; sort_order: string
  is_active: boolean
}

function CategoryDrawer({
  category, allCats, onClose, onSaved,
}: {
  category: ApiCategory | null
  allCats:  ApiCategory[]
  onClose:  () => void
  onSaved:  (msg: string) => void
}) {
  const isEdit = !!category
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState<string | null>(null)
  const [form,   setForm]   = useState<CatFormState>({
    name:        category?.name        ?? '',
    slug:        category?.slug        ?? '',
    emoji:       category?.emoji       ?? '',
    description: category?.description ?? '',
    parent_id:   category?.parent_id   ?? '',
    sort_order:  String(category?.sort_order ?? 0),
    is_active:   category?.is_active   ?? true,
  })
  const [errors, setErrors] = useState<Partial<CatFormState>>({})

  // Auto-slug from name when creating
  function handleName(val: string) {
    setForm(f => ({
      ...f,
      name: val,
      slug: isEdit ? f.slug : val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    }))
  }

  function validate() {
    const e: Partial<CatFormState> = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (!form.slug.trim()) e.slug = 'Slug is required'
    if (!/^[a-z0-9-]+$/.test(form.slug)) e.slug = 'Only lowercase letters, numbers, hyphens'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit() {
    if (!validate()) return
    setSaving(true); setError(null)
    const payload = {
      name:        form.name.trim(),
      slug:        form.slug.trim(),
      emoji:       form.emoji.trim() || undefined,
      description: form.description.trim() || undefined,
      parent_id:   form.parent_id || undefined,
      sort_order:  parseInt(form.sort_order) || 0,
      is_active:   form.is_active,
    }
    try {
      if (isEdit) await updateCategory(category!.id, payload)
      else        await createCategory(payload)
      onSaved(isEdit ? 'Category updated' : 'Category created')
      onClose()
    } catch (err: any) {
      setError(err.message ?? 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  // Exclude self + children from parent select
  const excludeIds = new Set<string>()
  if (isEdit && category) {
    const collect = (c: ApiCategory) => { excludeIds.add(c.id); c.children?.forEach(collect) }
    collect(category)
  }
  const parentOptions = allCats.filter(c => !c.parent_id && !excludeIds.has(c.id))

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-panel" onClick={e => e.stopPropagation()}>
        <div className="drawer-head">
          <div style={{ fontWeight: 900, fontSize: '1rem' }}>
            {isEdit ? '✏️ Edit Category' : '➕ New Category'}
          </div>
          <button onClick={onClose} style={{ width:30, height:30, borderRadius:'50%', border:'1.5px solid #e5e7eb', background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#6b7280' }}>×</button>
        </div>

        <div className="drawer-body">
          {error && <ErrorBanner message={error} />}

          <div className="form-field">
            <label className="form-label">Category Name *</label>
            <input className={`form-input ${errors.name ? 'error' : ''}`}
              value={form.name} onChange={e => handleName(e.target.value)}
              placeholder="e.g. Soft Toys" />
            {errors.name && <span className="form-err">{errors.name}</span>}
          </div>

          <div className="form-field">
            <label className="form-label">Slug *</label>
            <input className={`form-input ${errors.slug ? 'error' : ''}`}
              value={form.slug}
              onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
              placeholder="soft-toys" />
            <span className="form-hint">URL-friendly. Only lowercase, numbers, hyphens.</span>
            {errors.slug && <span className="form-err">{errors.slug}</span>}
          </div>

          <div className="form-grid-2">
            <div className="form-field">
              <label className="form-label">Emoji</label>
              <input className="form-input" value={form.emoji}
                onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))}
                placeholder="🧸" style={{ fontSize: '1.2rem' }} />
            </div>
            <div className="form-field">
              <label className="form-label">Sort Order</label>
              <input className="form-input" type="number" min={0}
                value={form.sort_order}
                onChange={e => setForm(f => ({ ...f, sort_order: e.target.value }))} />
            </div>
          </div>

          <div className="form-field">
            <label className="form-label">Parent Category</label>
            <select className="form-select" value={form.parent_id}
              onChange={e => setForm(f => ({ ...f, parent_id: e.target.value }))}>
              <option value="">— None (root category) —</option>
              {parentOptions.map(c => (
                <option key={c.id} value={c.id}>
                  {safeEmoji(c.emoji) ? `${safeEmoji(c.emoji)} ` : ''}{c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label className="form-label">Description</label>
            <input className="form-input" value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Short description…" />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
              style={{
                width: 42, height: 24, borderRadius: 12, cursor: 'pointer',
                background: form.is_active ? '#1d4ed8' : '#d1d5db',
                position: 'relative', transition: 'background .2s',
              }}
            >
              <div style={{
                width: 18, height: 18, borderRadius: '50%', background: '#fff',
                position: 'absolute', top: 3,
                left: form.is_active ? 21 : 3,
                transition: 'left .2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }} />
            </div>
            <label className="form-label" style={{ margin: 0, cursor: 'pointer' }}
              onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}>
              {form.is_active ? 'Active — visible to customers' : 'Inactive — hidden from store'}
            </label>
          </div>
        </div>

        <div className="drawer-footer">
          <button className="admin-btn" onClick={onClose}>Cancel</button>
          <button className="admin-btn admin-btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? '⏳ Saving…' : isEdit ? '💾 Update' : '➕ Add Category'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function CategoriesPage() {
  const [editCat,  setEditCat]  = useState<ApiCategory | null | undefined>(undefined)
  const [search,   setSearch]   = useState('')
  const [toast,    setToast]    = useState<{msg:string;type:'success'|'error'}|null>(null)

  // Admin list: ALL categories (incl. inactive) + product_count.
  const { data: categories, loading, error, refetch } = useAdminFetch(
    (_signal) => fetchAdminCategories(),
    [],
  )

  function flattenTree(cats: ApiCategory[]): ApiCategory[] {
    return cats.flatMap(c => [c, ...flattenTree(c.children ?? [])])
  }
  const allFlat = categories ? flattenTree(categories) : []

  const filtered = search
    ? allFlat.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.slug.toLowerCase().includes(search.toLowerCase())
      )
    : null

  async function handleDelete(c: ApiCategory) {
    const productCount = c.product_count ?? 0
    const childCount   = c.children?.length ?? 0

    // Pre-empt the block client-side for products (matches backend policy b)
    if (productCount > 0) {
      setToast({ msg: `Can't delete "${c.name}" — ${productCount} product(s) use it. Reassign them first.`, type: 'error' })
      return
    }

    const needsForce = childCount > 0
    const msg = needsForce
      ? `"${c.name}" has ${childCount} sub-categor${childCount === 1 ? 'y' : 'ies'}. Delete it and move them up one level?`
      : `Delete "${c.name}"? This cannot be undone.`
    if (!confirm(msg)) return

    try {
      await deleteCategory(c.id, needsForce)   // force=true only when it has children
      refetch()
      setToast({ msg: 'Category deleted', type: 'success' })
    } catch (err: any) {
      // Structured 409 from the backend (e.g. products added since last refetch)
      const info = err?.blockedInfo
      if (info?.reason === 'has_products') {
        setToast({ msg: `Can't delete — ${info.product_count} product(s) use this category.`, type: 'error' })
      } else if (info?.reason === 'has_children') {
        // Retry with force after explicit confirm
        if (confirm(`This category has ${info.child_count} sub-categories. Delete and move them up?`)) {
          try {
            await deleteCategory(c.id, true)
            refetch()
            setToast({ msg: 'Category deleted', type: 'success' })
            return
          } catch (e2: any) {
            setToast({ msg: e2.message ?? 'Delete failed', type: 'error' })
            return
          }
        }
      } else {
        setToast({ msg: err.message ?? 'Delete failed', type: 'error' })
      }
    }
  }

  async function handleToggleActive(c: ApiCategory) {
    try {
      await updateCategory(c.id, { is_active: !c.is_active })
      refetch()
      setToast({ msg: `Category ${!c.is_active ? 'activated' : 'deactivated'}`, type: 'success' })
    } catch (err: any) {
      setToast({ msg: err.message ?? 'Update failed', type: 'error' })
    }
  }

  function renderRows(cats: ApiCategory[], depth = 0): React.ReactNode[] {
    return cats.flatMap(c => [
      <tr key={c.id} style={c.is_active ? undefined : { background: '#fcfcfc' }}>
        <td>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: depth * 22 }}>
            {depth > 0 && <span style={{ color: '#d1d5db', fontSize: '.85rem', flexShrink: 0 }}>↳</span>}
            <div style={{
              width: 38, height: 38, borderRadius: 10, flexShrink: 0,
              background: c.is_active ? '#eff6ff' : '#f9fafb',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
              opacity: c.is_active ? 1 : 0.5,
            }}>
              {safeEmoji(c.emoji) ?? '📁'}
            </div>
            <div>
              <div style={{ fontWeight: 800, color: c.is_active ? '#111' : '#9ca3af' }}>{c.name}</div>
              <div style={{ fontSize: '.7rem', color: '#9ca3af', fontFamily: 'monospace' }}>{c.slug}</div>
            </div>
          </div>
        </td>
        <td>
          <span style={{ fontSize: '.72rem', fontWeight: 700, color: '#9ca3af' }}>
            {c.parent_id ? '↳ Sub' : '📂 Root'}
          </span>
        </td>
        <td>
          <span style={{
            fontSize: '.72rem', fontWeight: 800, padding: '3px 10px', borderRadius: 20,
            background: (c.product_count ?? 0) > 0 ? '#eff6ff' : '#f3f4f6',
            color: (c.product_count ?? 0) > 0 ? '#1d4ed8' : '#9ca3af',
          }}>
            {c.product_count ?? 0} product{(c.product_count ?? 0) !== 1 ? 's' : ''}
          </span>
        </td>
        <td style={{ color: '#6b7280', fontWeight: 700 }}>{c.sort_order}</td>
        <td>
          <div
            onClick={() => handleToggleActive(c)}
            style={{
              width: 38, height: 22, borderRadius: 11, cursor: 'pointer',
              background: c.is_active ? '#1d4ed8' : '#d1d5db',
              position: 'relative', transition: 'background .2s', display: 'inline-block',
            }}
            title={c.is_active ? 'Click to deactivate' : 'Click to activate'}
          >
            <div style={{
              width: 16, height: 16, borderRadius: '50%', background: '#fff',
              position: 'absolute', top: 3, left: c.is_active ? 19 : 3,
              transition: 'left .2s', boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
            }} />
          </div>
        </td>
        <td>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="admin-btn admin-btn-icon admin-btn-xs" title="Edit" onClick={() => setEditCat(c)}>✏️</button>
            <button className="admin-btn admin-btn-icon admin-btn-xs admin-btn-danger" title="Delete" onClick={() => handleDelete(c)}>🗑</button>
          </div>
        </td>
      </tr>,
      ...(filtered ? [] : renderRows(c.children ?? [], depth + 1)),
    ])
  }

  const rowsToRender = filtered
    ? filtered.map(c => renderRows([{ ...c, children: [] }], 0)).flat()
    : categories ? renderRows(categories) : []

  return (
    <>
      <style>{PAGE_STYLES}</style>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        <div className="admin-page-header">
          <div>
            <div className="admin-ph-title">Categories</div>
            <div className="admin-ph-sub">
              {loading ? 'Loading…' : `${allFlat.length} total · ${categories?.length ?? 0} root`}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="admin-btn" onClick={refetch}>↻ Refresh</button>
            <button className="admin-btn admin-btn-primary" onClick={() => setEditCat(null)}>➕ Add Category</button>
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-toolbar">
            <div className="admin-search" style={{ minWidth: 240 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input placeholder="Search categories…" value={search}
                onChange={e => setSearch(e.target.value)} />
              {search && (
                <button onClick={() => setSearch('')} style={{ border:'none', background:'none', cursor:'pointer', color:'#9ca3af', fontSize:15, padding:0 }}>×</button>
              )}
            </div>
            <span style={{ fontSize: '.78rem', color: '#9ca3af', fontWeight: 600 }}>
              {search ? `${filtered?.length ?? 0} results` : `${allFlat.length} categories`}
            </span>
          </div>

          {error && <div style={{ padding: '0 20px 4px' }}><ErrorBanner message={error} /></div>}

          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  {['Name / Slug', 'Type', 'Products', 'Sort', 'Active', 'Actions'].map(h => (
                    <th key={h}>{h.toUpperCase()}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? <SkeletonRows rows={6} cols={6} /> :
                 rowsToRender.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '50px 20px', color: '#9ca3af', fontWeight: 700 }}>
                    <div style={{ fontSize: 36, marginBottom: 10 }}>📂</div>
                    {search ? `No categories match "${search}"` : 'No categories yet. Add your first one!'}
                  </td></tr>
                 ) : rowsToRender}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {editCat !== undefined && (
        <CategoryDrawer
          category={editCat}
          allCats={allFlat}
          onClose={() => setEditCat(undefined)}
          onSaved={(msg) => { setToast({ msg, type: 'success' }); refetch() }}
        />
      )}
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </>
  )
}

// ─── COUPONS PAGE ─────────────────────────────────────────────────

interface CouponFormState {
  code: string; type: 'percentage'|'flat'; value: string
  min: string; maxUses: string; expires: string; is_active: boolean
}

function CouponDrawer({ coupon, onClose, onSaved }: {
  coupon: ApiCoupon | null; onClose: () => void; onSaved: (msg: string) => void
}) {
  const isEdit = !!coupon
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState<string | null>(null)
  const [form,   setForm]   = useState<CouponFormState>({
    code:      coupon?.code           ?? '',
    type:      coupon?.discount_type  ?? 'percentage',
    value:     String(coupon?.discount_value ?? ''),
    min:       String(coupon?.min_order ?? 0),
    maxUses:   String(coupon?.max_uses  ?? 100),
    expires:   coupon?.expires_at ? coupon.expires_at.split('T')[0] : '',
    is_active: coupon?.is_active ?? true,
  })
  const [errors, setErrors] = useState<Partial<Record<keyof CouponFormState, string>>>({})

  function validate() {
    const e: typeof errors = {}
    if (!form.code.trim())                                     e.code  = 'Required'
    if (form.code.length < 3)                                  e.code  = 'Min 3 characters'
    const v = parseFloat(form.value)
    if (isNaN(v) || v <= 0)                                    e.value = 'Must be a positive number'
    if (form.type === 'percentage' && v > 100)                 e.value = 'Cannot exceed 100%'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit() {
    if (!validate()) return
    setSaving(true); setError(null)
    const payload = {
      code:           form.code.toUpperCase().trim(),
      discount_type:  form.type,
      discount_value: parseFloat(form.value),
      min_order:      parseFloat(form.min)    || 0,
      max_uses:       parseInt(form.maxUses)  || 100,
      is_active:      form.is_active,
      expires_at:     form.expires || null,
    }
    try {
      if (isEdit) await updateCoupon(coupon!.id, payload)
      else        await createCoupon(payload)
      onSaved(isEdit ? 'Coupon updated' : 'Coupon created')
      onClose()
    } catch (err: any) {
      setError(err.message ?? 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-panel" onClick={e => e.stopPropagation()}>
        <div className="drawer-head">
          <div style={{ fontWeight: 900, fontSize: '1rem' }}>{isEdit ? '✏️ Edit Coupon' : '🏷️ New Coupon'}</div>
          <button onClick={onClose} style={{ width:30, height:30, borderRadius:'50%', border:'1.5px solid #e5e7eb', background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#6b7280' }}>×</button>
        </div>
        <div className="drawer-body">
          {error && <ErrorBanner message={error} />}

          <div className="form-field">
            <label className="form-label">Coupon Code *</label>
            <input className={`form-input ${errors.code ? 'error' : ''}`}
              value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
              placeholder="SAVE20" style={{ textTransform:'uppercase', letterSpacing:2, fontFamily:'monospace', fontWeight:700 }}
              maxLength={20} />
            {errors.code && <span className="form-err">{errors.code}</span>}
          </div>

          <div className="form-grid-2">
            <div className="form-field">
              <label className="form-label">Discount Type *</label>
              <select className="form-select" value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value as any }))}>
                <option value="percentage">Percentage (%)</option>
                <option value="flat">Flat Amount (₹)</option>
              </select>
            </div>
            <div className="form-field">
              <label className="form-label">Value *</label>
              <input className={`form-input ${errors.value ? 'error' : ''}`} type="number" min={1} step="0.01"
                value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                placeholder={form.type === 'percentage' ? '20' : '100'} />
              {errors.value && <span className="form-err">{errors.value}</span>}
            </div>
            <div className="form-field">
              <label className="form-label">Min Order (₹)</label>
              <input className="form-input" type="number" min={0}
                value={form.min} onChange={e => setForm(f => ({ ...f, min: e.target.value }))} placeholder="499" />
            </div>
            <div className="form-field">
              <label className="form-label">Max Uses</label>
              <input className="form-input" type="number" min={1}
                value={form.maxUses} onChange={e => setForm(f => ({ ...f, maxUses: e.target.value }))} placeholder="100" />
            </div>
            <div className="form-field" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Expiry Date (optional)</label>
              <input className="form-input" type="date"
                value={form.expires} min={new Date().toISOString().split('T')[0]}
                onChange={e => setForm(f => ({ ...f, expires: e.target.value }))} />
            </div>
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
              style={{ width:42, height:24, borderRadius:12, cursor:'pointer', background:form.is_active?'#1d4ed8':'#d1d5db', position:'relative', transition:'background .2s', display:'inline-block' }}>
              <div style={{ width:18, height:18, borderRadius:'50%', background:'#fff', position:'absolute', top:3, left:form.is_active?21:3, transition:'left .2s', boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }} />
            </div>
            <span className="form-label" style={{ margin:0, cursor:'pointer' }} onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}>
              {form.is_active ? 'Active — usable right now' : 'Inactive — disabled'}
            </span>
          </div>

          {isEdit && coupon && (
            <div style={{ background:'#f9fafb', borderRadius:8, padding:'10px 14px', fontSize:'.8rem', color:'#6b7280' }}>
              Used <strong>{coupon.used_count}</strong> / {coupon.max_uses} times
            </div>
          )}
        </div>
        <div className="drawer-footer">
          <button className="admin-btn" onClick={onClose}>Cancel</button>
          <button className="admin-btn admin-btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? '⏳ Saving…' : isEdit ? '💾 Update' : '🏷️ Create Coupon'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function CouponsPage() {
  const [editCoupon, setEditCoupon] = useState<ApiCoupon | null | undefined>(undefined)
  const [toast,      setToast]      = useState<{msg:string;type:'success'|'error'}|null>(null)

  const { data: coupons, loading, error, refetch } = useAdminFetch(
    (_signal) => fetchCoupons(),
    [],
  )

  const list          = coupons ?? []
  const activeCount   = list.filter(c => c.is_active && (!c.expires_at || new Date(c.expires_at) > new Date())).length

  function isExpired(c: ApiCoupon) { return !!c.expires_at && new Date(c.expires_at) < new Date() }

  async function handleDelete(c: ApiCoupon) {
    if (!confirm(`Delete coupon "${c.code}"?`)) return
    try {
      await deleteCoupon(c.id)
      refetch()
      setToast({ msg: 'Coupon deleted', type: 'success' })
    } catch (err: any) {
      setToast({ msg: err.message ?? 'Delete failed', type: 'error' })
    }
  }

  async function handleToggle(c: ApiCoupon) {
    try {
      await updateCoupon(c.id, { is_active: !c.is_active })
      refetch()
      setToast({ msg: `Coupon ${!c.is_active ? 'activated' : 'deactivated'}`, type: 'success' })
    } catch (err: any) {
      setToast({ msg: err.message ?? 'Update failed', type: 'error' })
    }
  }

  return (
    <>
      <style>{PAGE_STYLES}</style>
      <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
        <div className="admin-page-header">
          <div>
            <div className="admin-ph-title">Coupons</div>
            <div className="admin-ph-sub">
              {loading ? 'Loading…' : `${list.length} codes · ${activeCount} active`}
            </div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button className="admin-btn" onClick={refetch}>↻ Refresh</button>
            <button className="admin-btn admin-btn-primary" onClick={() => setEditCoupon(null)}>🏷️ New Coupon</button>
          </div>
        </div>

        <div className="admin-card">
          {error && <div style={{ padding:'16px 20px 0' }}><ErrorBanner message={error} /></div>}
          <div style={{ overflowX:'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>{['Code','Type','Value','Min Order','Usage','Expires','Status','Actions'].map(h=><th key={h}>{h.toUpperCase()}</th>)}</tr>
              </thead>
              <tbody>
                {loading ? <SkeletonRows rows={5} cols={8} /> :
                 list.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign:'center', padding:'50px 20px', color:'#9ca3af', fontWeight:700 }}>
                    <div style={{ fontSize:36, marginBottom:10 }}>🏷️</div>
                    No coupons yet. Create your first promo code!
                  </td></tr>
                 ) : list.map(c => {
                   const expired = isExpired(c)
                   const pct = c.max_uses ? Math.min(100, Math.round(c.used_count / c.max_uses * 100)) : 0
                   return (
                     <tr key={c.id} style={{ opacity: expired ? 0.65 : 1 }}>
                       <td>
                         <span style={{ fontFamily:'monospace', fontWeight:900, fontSize:'.88rem', background:'#f3f4f6', padding:'3px 9px', borderRadius:5, letterSpacing:1 }}>
                           {c.code}
                         </span>
                       </td>
                       <td>
                         <span className={`pill ${c.discount_type === 'percentage' ? 'pill-blue' : 'pill-purple'}`}>
                           {c.discount_type === 'percentage' ? '% Off' : '₹ Off'}
                         </span>
                       </td>
                       <td style={{ fontWeight:900, fontSize:'1rem' }}>
                         {c.discount_type === 'percentage' ? `${c.discount_value}%` : `₹${c.discount_value}`}
                       </td>
                       <td style={{ color:'#6b7280' }}>₹{c.min_order.toLocaleString('en-IN')}</td>
                       <td style={{ minWidth:100 }}>
                         <div style={{ fontSize:'.7rem', color:'#9ca3af', display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                           <span>{c.used_count} used</span><span>{c.max_uses} max</span>
                         </div>
                         <div style={{ height:5, background:'#f3f4f6', borderRadius:99, overflow:'hidden' }}>
                           <div style={{ width:`${pct}%`, height:'100%', background: pct>=90?'#dc2626':'#1d4ed8', borderRadius:99, transition:'width .3s' }} />
                         </div>
                       </td>
                       <td style={{ whiteSpace:'nowrap', color: expired?'#b91c1c':'#6b7280', fontSize:'.8rem' }}>
                         {c.expires_at ? `${expired?'⚠️ ':''}${new Date(c.expires_at).toLocaleDateString('en-IN')}` : 'Never'}
                       </td>
                       <td>
                         <div onClick={() => handleToggle(c)}
                           style={{ width:38, height:22, borderRadius:11, cursor:'pointer', background:c.is_active&&!expired?'#1d4ed8':'#d1d5db', position:'relative', transition:'background .2s', display:'inline-block' }}
                           title={c.is_active ? 'Deactivate' : 'Activate'}>
                           <div style={{ width:16, height:16, borderRadius:'50%', background:'#fff', position:'absolute', top:3, left:c.is_active&&!expired?19:3, transition:'left .2s', boxShadow:'0 1px 2px rgba(0,0,0,0.2)' }} />
                         </div>
                       </td>
                       <td>
                         <div style={{ display:'flex', gap:6 }}>
                           <button className="admin-btn admin-btn-icon admin-btn-xs" onClick={() => setEditCoupon(c)} title="Edit">✏️</button>
                           <button className="admin-btn admin-btn-icon admin-btn-xs admin-btn-danger" onClick={() => handleDelete(c)} title="Delete">🗑</button>
                         </div>
                       </td>
                     </tr>
                   )
                 })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {editCoupon !== undefined && (
        <CouponDrawer coupon={editCoupon} onClose={() => setEditCoupon(undefined)}
          onSaved={msg => { setToast({ msg, type:'success' }); refetch() }} />
      )}
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </>
  )
}

// ─── REVIEWS PAGE ─────────────────────────────────────────────────

export function ReviewsPage() {
  const [showPending, setShowPending] = useState(false)
  const [page,        setPage]        = useState(0)
  const [toast,       setToast]       = useState<{msg:string;type:'success'|'error'}|null>(null)
  const LIMIT = 20

  const { data, loading, error, refetch } = useAdminFetch(
    (_signal) => fetchAdminReviews({ skip: page * LIMIT, limit: LIMIT, approved: showPending ? false : undefined }),
    [showPending, page],
  )

  const reviews    = data?.data       ?? []
  const totalCount = data?.totalCount ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / LIMIT))

  async function handleApprove(r: ApiReview) {
    try {
      await approveReview(r.id)
      refetch()
      setToast({ msg: 'Review approved', type: 'success' })
    } catch (err: any) {
      setToast({ msg: err.message ?? 'Failed', type: 'error' })
    }
  }

  async function handleDelete(r: ApiReview) {
    if (!confirm('Permanently delete this review?')) return
    try {
      await deleteReview(r.id)
      refetch()
      setToast({ msg: 'Review deleted', type: 'success' })
    } catch (err: any) {
      setToast({ msg: err.message ?? 'Failed', type: 'error' })
    }
  }

  return (
    <>
      <style>{PAGE_STYLES}</style>
      <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
        <div className="admin-page-header">
          <div>
            <div className="admin-ph-title">Reviews</div>
            <div className="admin-ph-sub">
              {loading ? 'Loading…' : `${totalCount.toLocaleString()} ${showPending ? 'pending' : 'total'} reviews`}
            </div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button className={`admin-btn ${showPending ? 'admin-btn-primary' : ''}`}
              onClick={() => { setShowPending(!showPending); setPage(0) }}>
              {showPending ? '📋 Show All' : '⏳ Pending Only'}
            </button>
            <button className="admin-btn" onClick={refetch}>↻ Refresh</button>
          </div>
        </div>

        <div className="admin-card">
          {error && <div style={{ padding:'16px 20px 0' }}><ErrorBanner message={error} /></div>}
          <div style={{ overflowX:'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>{['Customer','Product','Rating','Comment','Date','Status','Actions'].map(h=><th key={h}>{h.toUpperCase()}</th>)}</tr>
              </thead>
              <tbody>
                {loading ? <SkeletonRows rows={6} cols={7} /> :
                 reviews.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign:'center', padding:'50px 20px', color:'#9ca3af', fontWeight:700 }}>
                    <div style={{ fontSize:36, marginBottom:10 }}>⭐</div>
                    {showPending ? '✅ All caught up — no pending reviews!' : 'No reviews yet'}
                  </td></tr>
                 ) : reviews.map((r, idx) => (
                  <tr key={r.id}>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <div className="rc-av" style={{ background:AVATAR_BG[idx%AVATAR_BG.length], color:AVATAR_TEXT[idx%AVATAR_TEXT.length], fontWeight:900, fontSize:'.75rem' }}>
                          {(r.customer_name||'?')[0].toUpperCase()}
                        </div>
                        <span style={{ fontWeight:700 }}>{r.customer_name||'—'}</span>
                      </div>
                    </td>
                    <td style={{ maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:'#374151' }} title={r.product_name}>
                      {r.product_name||'—'}
                    </td>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:3 }}>
                        {Array.from({length:5}).map((_,i)=>(
                          <span key={i} style={{ color:i<r.rating?'#f59e0b':'#e5e7eb', fontSize:'1rem' }}>★</span>
                        ))}
                        <span style={{ fontSize:'.72rem', color:'#9ca3af', marginLeft:3, fontWeight:700 }}>{r.rating}/5</span>
                      </div>
                    </td>
                    <td style={{ maxWidth:240 }}>
                      <span style={{ display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden', color:'#374151' } as any}>
                        {r.comment || <em style={{ color:'#9ca3af' }}>No comment</em>}
                      </span>
                    </td>
                    <td style={{ color:'#9ca3af', fontSize:'.8rem', whiteSpace:'nowrap' }}>
                      {new Date(r.created_at).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}
                    </td>
                    <td>
                      <span className={`pill ${r.is_approved ? 'pill-green' : 'pill-yellow'}`}>
                        <span className="status-dot" style={{ background: r.is_approved ? '#16a34a' : '#ca8a04' }} />
                        {r.is_approved ? 'Approved' : 'Pending'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display:'flex', gap:6 }}>
                        {!r.is_approved && (
                          <button className="admin-btn admin-btn-xs" style={{ color:'#15803d', borderColor:'#86efac' }}
                            onClick={() => handleApprove(r)}>✅ Approve</button>
                        )}
                        <button className="admin-btn admin-btn-icon admin-btn-xs admin-btn-danger"
                          onClick={() => handleDelete(r)} title="Delete">🗑</button>
                      </div>
                    </td>
                  </tr>
                 ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div style={{ padding:'12px 20px', borderTop:'1px solid #f0f0f0', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
              <span style={{ fontSize:'.75rem', fontWeight:700, color:'#9ca3af' }}>
                Showing {reviews.length} of {totalCount.toLocaleString()}
              </span>
              <div style={{ display:'flex', gap:4 }}>
                <button className="admin-btn admin-btn-sm" disabled={page===0} onClick={()=>setPage(p=>p-1)}>‹ Prev</button>
                {Array.from({length:Math.min(totalPages,5)}).map((_,i)=>(
                  <button key={i} className="admin-btn admin-btn-sm" onClick={()=>setPage(i)}
                    style={{ background:page===i?'#1d4ed8':undefined, color:page===i?'#fff':undefined, borderColor:page===i?'#1d4ed8':undefined }}>
                    {i+1}
                  </button>
                ))}
                <button className="admin-btn admin-btn-sm" disabled={page>=totalPages-1} onClick={()=>setPage(p=>p+1)}>Next ›</button>
              </div>
            </div>
          )}
        </div>
      </div>
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </>
  )
}