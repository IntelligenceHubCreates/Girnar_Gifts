'use client'

import { useState } from 'react'
import FilterTabs from '../ui/FilterTabs'
import { useAdminFetch } from '@/hooks/useAdminFetch'
import {
  fetchAdminCustomers, deleteCustomer,
  fetchCategories, createCategory, updateCategory, deleteCategory,
  fetchCoupons, createCoupon, updateCoupon, deleteCoupon,
  fetchAdminReviews, approveReview, deleteReview,
  type ApiCustomer, type ApiCategory, type ApiCoupon, type ApiReview,
} from '@/lib/adminApi'

const AVATAR_BG = ['var(--coral-light)', 'var(--sky-light)', 'var(--lilac-light)', 'var(--sun-light)', 'var(--peach-light)', 'var(--mint-light)']
const EMOJI     = ['👩', '👨', '👩‍💼', '🧑', '👩', '🧔']

// ─── CUSTOMERS ───────────────────────────────────────────────────

export function CustomersPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [segment, setSegment] = useState('')
  const LIMIT = 15

  const { data, loading, error, refetch } = useAdminFetch(
    () => fetchAdminCustomers({ skip: page * LIMIT, limit: LIMIT, search: search || undefined, segment: segment || undefined }),
    [page, search, segment]
  )

  const customers = data?.data ?? []
  const totalCount = data?.totalCount ?? 0
  const totalPages = Math.ceil(totalCount / LIMIT)

  function segmentTag(c: ApiCustomer) {
    if (c.total_orders >= 10) return { cls: 'tag-vip', label: '⭐ VIP' }
    if (c.total_orders === 0) return { cls: 'tag-new', label: 'New' }
    return { cls: 'tag-regular', label: 'Regular' }
  }

  return (
    <div>
      <div className="page-header">
        <div className="ph-left">
          <div className="ph-title">Customers</div>
          <div className="ph-sub">{loading ? 'Loading…' : `${totalCount.toLocaleString()} registered customers`}</div>
        </div>
        <div className="ph-actions">
          <button className="btn btn-outline">📥 Export</button>
          <button className="btn btn-ghost btn-sm" onClick={refetch}>↻</button>
        </div>
      </div>
      <div className="card">
        <div className="card-head">
          <FilterTabs tabs={['All', '⭐ VIP', 'Regular', 'New']} active={segment || 'All'}
            onChange={(t) => { setSegment(t === 'All' ? '' : t); setPage(0) }} />
          <div className="tb-search" style={{ width: 200 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: 'var(--muted)', flexShrink: 0 }}>
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input type="text" placeholder="Search customers…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0) }} />
          </div>
        </div>

        {error && <div style={{ padding: 16, color: 'var(--coral)' }}>⚠️ {error}</div>}

        <div className="table-wrap">
          <table>
            <thead><tr><th>Customer</th><th>Email</th><th>City</th><th>Orders</th><th>Total Spent</th><th>Joined</th><th>Segment</th><th>Actions</th></tr></thead>
            <tbody>
              {loading
                ? Array.from({ length: 8 }).map((_, i) => <tr key={i}>{Array.from({ length: 8 }).map((_, j) => <td key={j}><div style={{ height: 12, background: 'var(--soft-2)', borderRadius: 4 }} /></td>)}</tr>)
                : customers.map((c, idx) => {
                    const seg = segmentTag(c)
                    return (
                      <tr key={c.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                            <div className="rc-av" style={{ background: AVATAR_BG[idx % AVATAR_BG.length] }}>{EMOJI[idx % EMOJI.length]}</div>
                            <div>
                              <div style={{ fontWeight: 800 }}>{c.name}</div>
                              <div className="td-muted">{c.phone}</div>
                            </div>
                          </div>
                        </td>
                        <td className="td-muted">{c.email}</td>
                        <td>{c.city}</td>
                        <td style={{ fontWeight: 800 }}>{c.total_orders}</td>
                        <td style={{ fontWeight: 900, color: 'var(--coral)' }}>₹{c.total_spent.toLocaleString()}</td>
                        <td className="td-muted">{new Date(c.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                        <td><span className={`tag ${seg.cls}`}>{seg.label}</span></td>
                        <td>
                          <div style={{ display: 'flex', gap: 5 }}>
                            <button className="btn btn-ghost btn-xs btn-icon">👁</button>
                            <button className="btn btn-danger btn-xs btn-icon" onClick={async () => {
                              if (confirm(`Delete customer "${c.name}"?`)) {
                                try { await deleteCustomer(c.id); refetch() } catch (err: any) { alert(err.message) }
                              }
                            }}>🗑</button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
            </tbody>
          </table>
        </div>
        <div className="card-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '.75rem', fontWeight: 700, color: 'var(--muted)' }}>Showing {customers.length} of {totalCount}</span>
          <div style={{ display: 'flex', gap: 4 }}>
            <button className="btn btn-ghost btn-sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>← Prev</button>
            {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => (
              <button key={i} className={`btn btn-sm ${page === i ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setPage(i)}>{i + 1}</button>
            ))}
            <button className="btn btn-ghost btn-sm" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>Next →</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── CATEGORIES ──────────────────────────────────────────────────

function CategoryForm({ category, onClose, onSaved, allCats }: {
  category?: ApiCategory | null; onClose: () => void; onSaved: () => void; allCats: ApiCategory[]
}) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isEdit = !!category

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true); setError(null)
    const fd = e.currentTarget
    const data = {
      name:        (fd.elements.namedItem('name') as HTMLInputElement).value,
      slug:        (fd.elements.namedItem('slug') as HTMLInputElement).value,
      emoji:       (fd.elements.namedItem('emoji') as HTMLInputElement).value || undefined,
      description: (fd.elements.namedItem('desc') as HTMLInputElement).value || undefined,
      parent_id:   (fd.elements.namedItem('parent') as HTMLSelectElement).value || undefined,
      sort_order:  parseInt((fd.elements.namedItem('sort') as HTMLInputElement).value) || 0,
    }
    try {
      if (isEdit) await updateCategory(category!.id, data)
      else        await createCategory(data)
      onSaved(); onClose()
    } catch (err: any) { setError(err.message) } finally { setSaving(false) }
  }

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-head">
          <div className="drawer-title">{isEdit ? '✏️ Edit Category' : '➕ Add Category'}</div>
          <button className="drawer-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="drawer-body">
            {error && <div style={{ background: '#FFF0F0', border: '1px solid var(--coral)', borderRadius: 8, padding: '10px 14px', color: 'var(--coral)', fontSize: '.82rem', marginBottom: 16 }}>⚠️ {error}</div>}
            <div className="form-group"><label className="form-label">Category Name *</label><input name="name" className="form-input" required defaultValue={category?.name} placeholder="e.g. Soft Toys" /></div>
            <div className="form-group"><label className="form-label">Slug *</label><input name="slug" className="form-input" required defaultValue={category?.slug} placeholder="e.g. soft-toys" /></div>
            <div className="form-grid form-grid-2">
              <div className="form-group"><label className="form-label">Emoji</label><input name="emoji" className="form-input" defaultValue={category?.emoji ?? ''} placeholder="🧸" /></div>
              <div className="form-group"><label className="form-label">Sort Order</label><input name="sort" type="number" className="form-input" defaultValue={category?.sort_order ?? 0} /></div>
            </div>
            <div className="form-group">
              <label className="form-label">Parent Category</label>
              <select name="parent" className="form-select" defaultValue={category?.parent_id ?? ''}>
                <option value="">— None (root category) —</option>
                {allCats.filter((c) => !c.parent_id).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">Description</label><input name="desc" className="form-input" defaultValue={category?.description ?? ''} placeholder="Short description…" /></div>
          </div>
          <div className="drawer-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? '⏳ Saving…' : isEdit ? '💾 Update' : '➕ Add'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function CategoriesPage() {
  const [editCat, setEditCat] = useState<ApiCategory | null | undefined>(undefined)
  const { data: categories, loading, error, refetch } = useAdminFetch(fetchCategories, [])

  function flatRender(cats: ApiCategory[], depth = 0): React.ReactNode[] {
    return cats.flatMap((c) => [
      <tr key={c.id}>
        <td>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: depth * 20 }}>
            <span style={{ fontSize: 20 }}>{c.emoji ?? '📁'}</span>
            <div>
              <div style={{ fontWeight: 800 }}>{c.name}</div>
              <div className="td-muted">{c.slug}</div>
            </div>
          </div>
        </td>
        <td>{c.parent_id ? '↳ Sub' : '📂 Root'}</td>
        <td>{c.sort_order}</td>
        <td><span className={`pill ${c.is_active ? 'pill-green' : 'pill-red'}`}>{c.is_active ? 'Active' : 'Inactive'}</span></td>
        <td>{c.description ?? '—'}</td>
        <td>
          <div style={{ display: 'flex', gap: 5 }}>
            <button className="btn btn-ghost btn-xs btn-icon" onClick={() => setEditCat(c)}>✏️</button>
            <button className="btn btn-danger btn-xs btn-icon" onClick={async () => {
              if (confirm(`Delete category "${c.name}"?`)) {
                try { await deleteCategory(c.id); refetch() } catch (err: any) { alert(err.message) }
              }
            }}>🗑</button>
          </div>
        </td>
      </tr>,
      ...(c.children?.length ? flatRender(c.children, depth + 1) : []),
    ])
  }

  const allFlat = categories ? categories.flatMap((c) => [c, ...(c.children ?? [])]) : []

  return (
    <div>
      <div className="page-header">
        <div className="ph-left">
          <div className="ph-title">Categories</div>
          <div className="ph-sub">{loading ? 'Loading…' : `${allFlat.length} categories`}</div>
        </div>
        <div className="ph-actions">
          <button className="btn btn-ghost btn-sm" onClick={refetch}>↻</button>
          <button className="btn btn-primary" onClick={() => setEditCat(null)}>➕ Add Category</button>
        </div>
      </div>
      <div className="card">
        {error && <div style={{ padding: 16, color: 'var(--coral)' }}>⚠️ {error}</div>}
        <div className="table-wrap">
          <table>
            <thead><tr><th>Name / Slug</th><th>Type</th><th>Sort</th><th>Status</th><th>Description</th><th>Actions</th></tr></thead>
            <tbody>
              {loading
                ? Array.from({ length: 6 }).map((_, i) => <tr key={i}>{Array.from({ length: 6 }).map((_, j) => <td key={j}><div style={{ height: 12, background: 'var(--soft-2)', borderRadius: 4 }} /></td>)}</tr>)
                : categories ? flatRender(categories) : null}
            </tbody>
          </table>
        </div>
      </div>

      {editCat !== undefined && (
        <CategoryForm category={editCat} allCats={allFlat} onClose={() => setEditCat(undefined)} onSaved={refetch} />
      )}
    </div>
  )
}

// ─── COUPONS ──────────────────────────────────────────────────────

function CouponForm({ coupon, onClose, onSaved }: { coupon?: ApiCoupon | null; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isEdit = !!coupon

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true); setError(null)
    const fd = e.currentTarget
    const data = {
      code:           ((fd.elements.namedItem('code') as HTMLInputElement).value).toUpperCase(),
      discount_type:  (fd.elements.namedItem('type') as HTMLSelectElement).value as 'percentage' | 'flat',
      discount_value: parseFloat((fd.elements.namedItem('value') as HTMLInputElement).value),
      min_order:      parseFloat((fd.elements.namedItem('min') as HTMLInputElement).value) || 0,
      max_uses:       parseInt((fd.elements.namedItem('maxUses') as HTMLInputElement).value) || 100,
      is_active:      (fd.elements.namedItem('active') as HTMLInputElement).checked,
      expires_at:     (fd.elements.namedItem('expires') as HTMLInputElement).value || null,
    }
    try {
      if (isEdit) await updateCoupon(coupon!.id, data)
      else        await createCoupon(data)
      onSaved(); onClose()
    } catch (err: any) { setError(err.message) } finally { setSaving(false) }
  }

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-head">
          <div className="drawer-title">{isEdit ? '✏️ Edit Coupon' : '🏷️ New Coupon'}</div>
          <button className="drawer-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="drawer-body">
            {error && <div style={{ background: '#FFF0F0', border: '1px solid var(--coral)', borderRadius: 8, padding: '10px 14px', color: 'var(--coral)', fontSize: '.82rem', marginBottom: 16 }}>⚠️ {error}</div>}
            <div className="form-group"><label className="form-label">Coupon Code *</label><input name="code" className="form-input" required defaultValue={coupon?.code} placeholder="SAVE20" style={{ textTransform: 'uppercase' }} /></div>
            <div className="form-grid form-grid-2">
              <div className="form-group">
                <label className="form-label">Discount Type *</label>
                <select name="type" className="form-select" defaultValue={coupon?.discount_type ?? 'percentage'}>
                  <option value="percentage">Percentage (%)</option>
                  <option value="flat">Flat Amount (₹)</option>
                </select>
              </div>
              <div className="form-group"><label className="form-label">Discount Value *</label><input name="value" type="number" min={1} className="form-input" required defaultValue={coupon?.discount_value} placeholder="20" /></div>
              <div className="form-group"><label className="form-label">Min Order (₹)</label><input name="min" type="number" min={0} className="form-input" defaultValue={coupon?.min_order ?? 0} placeholder="500" /></div>
              <div className="form-group"><label className="form-label">Max Uses</label><input name="maxUses" type="number" min={1} className="form-input" defaultValue={coupon?.max_uses ?? 100} placeholder="100" /></div>
              <div className="form-group span-2"><label className="form-label">Expiry Date</label><input name="expires" type="date" className="form-input" defaultValue={coupon?.expires_at ? coupon.expires_at.split('T')[0] : ''} /></div>
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input name="active" type="checkbox" defaultChecked={coupon?.is_active ?? true} style={{ width: 16, height: 16 }} />
              <label className="form-label" style={{ margin: 0 }}>Active</label>
            </div>
          </div>
          <div className="drawer-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? '⏳ Saving…' : isEdit ? '💾 Update' : '🏷️ Create'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function CouponsPage() {
  const [editCoupon, setEditCoupon] = useState<ApiCoupon | null | undefined>(undefined)
  const { data: coupons, loading, error, refetch } = useAdminFetch(fetchCoupons, [])

  return (
    <div>
      <div className="page-header">
        <div className="ph-left">
          <div className="ph-title">Coupons</div>
          <div className="ph-sub">{loading ? 'Loading…' : `${(coupons ?? []).length} promo codes`}</div>
        </div>
        <div className="ph-actions">
          <button className="btn btn-ghost btn-sm" onClick={refetch}>↻</button>
          <button className="btn btn-primary" onClick={() => setEditCoupon(null)}>🏷️ New Coupon</button>
        </div>
      </div>

      {error && <div className="card" style={{ padding: 16, color: 'var(--coral)' }}>⚠️ {error}</div>}

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Code</th><th>Type</th><th>Value</th><th>Min Order</th><th>Uses</th><th>Expires</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => <tr key={i}>{Array.from({ length: 8 }).map((_, j) => <td key={j}><div style={{ height: 12, background: 'var(--soft-2)', borderRadius: 4 }} /></td>)}</tr>)
                : (coupons ?? []).map((c) => (
                    <tr key={c.id}>
                      <td><span style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: '.85rem', background: 'var(--soft-2)', padding: '3px 8px', borderRadius: 5 }}>{c.code}</span></td>
                      <td>{c.discount_type === 'percentage' ? '%' : '₹'}</td>
                      <td style={{ fontWeight: 800 }}>{c.discount_type === 'percentage' ? `${c.discount_value}%` : `₹${c.discount_value}`}</td>
                      <td>₹{c.min_order}</td>
                      <td>{c.used_count} / {c.max_uses}</td>
                      <td className="td-muted">{c.expires_at ? new Date(c.expires_at).toLocaleDateString('en-IN') : 'Never'}</td>
                      <td><span className={`pill ${c.is_active ? 'pill-green' : 'pill-red'}`}>{c.is_active ? 'Active' : 'Inactive'}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 5 }}>
                          <button className="btn btn-ghost btn-xs btn-icon" onClick={() => setEditCoupon(c)}>✏️</button>
                          <button className="btn btn-danger btn-xs btn-icon" onClick={async () => {
                            if (confirm(`Delete coupon "${c.code}"?`)) {
                              try { await deleteCoupon(c.id); refetch() } catch (err: any) { alert(err.message) }
                            }
                          }}>🗑</button>
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>

      {editCoupon !== undefined && (
        <CouponForm coupon={editCoupon} onClose={() => setEditCoupon(undefined)} onSaved={refetch} />
      )}
    </div>
  )
}

// ─── REVIEWS ──────────────────────────────────────────────────────

export function ReviewsPage() {
  const [showPending, setShowPending] = useState(false)
  const { data, loading, error, refetch } = useAdminFetch(
    () => fetchAdminReviews({ approved: showPending ? false : undefined }),
    [showPending]
  )
  const reviews = data?.data ?? []

  return (
    <div>
      <div className="page-header">
        <div className="ph-left">
          <div className="ph-title">Reviews</div>
          <div className="ph-sub">{loading ? 'Loading…' : `${data?.totalCount ?? 0} reviews`}</div>
        </div>
        <div className="ph-actions">
          <button className={`btn ${showPending ? 'btn-primary' : 'btn-outline'}`} onClick={() => setShowPending(!showPending)}>
            {showPending ? 'Show All' : '⏳ Pending Only'}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={refetch}>↻</button>
        </div>
      </div>

      {error && <div className="card" style={{ padding: 16, color: 'var(--coral)' }}>⚠️ {error}</div>}

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Customer</th><th>Product</th><th>Rating</th><th>Comment</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {loading
                ? Array.from({ length: 6 }).map((_, i) => <tr key={i}>{Array.from({ length: 7 }).map((_, j) => <td key={j}><div style={{ height: 12, background: 'var(--soft-2)', borderRadius: 4 }} /></td>)}</tr>)
                : reviews.map((r, idx) => (
                    <tr key={r.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="rc-av" style={{ background: AVATAR_BG[idx % AVATAR_BG.length] }}>{EMOJI[idx % EMOJI.length]}</div>
                          <div style={{ fontWeight: 700 }}>{r.customer_name}</div>
                        </div>
                      </td>
                      <td style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.product_name}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 2 }}>
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span key={i} style={{ color: i < r.rating ? '#F59E0B' : 'var(--border)' }}>★</span>
                          ))}
                        </div>
                      </td>
                      <td style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.comment}>{r.comment}</td>
                      <td className="td-muted">{new Date(r.created_at).toLocaleDateString('en-IN')}</td>
                      <td><span className={`pill ${r.is_approved ? 'pill-green' : 'pill-yellow'}`}>{r.is_approved ? 'Approved' : 'Pending'}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 5 }}>
                          {!r.is_approved && (
                            <button className="btn btn-ghost btn-xs" onClick={async () => {
                              try { await approveReview(r.id); refetch() } catch (err: any) { alert(err.message) }
                            }}>✅ Approve</button>
                          )}
                          <button className="btn btn-danger btn-xs btn-icon" onClick={async () => {
                            if (confirm('Delete this review?')) {
                              try { await deleteReview(r.id); refetch() } catch (err: any) { alert(err.message) }
                            }
                          }}>🗑</button>
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
