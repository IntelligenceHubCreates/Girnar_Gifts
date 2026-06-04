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

// ─── Shared helpers ───────────────────────────────────────────────

const AVATAR_BG = [
  'var(--coral-light)', 'var(--sky-light)', 'var(--lilac-light)',
  'var(--sun-light)',   'var(--peach-light)', 'var(--mint-light)',
]
const EMOJI = ['👩', '👨', '👩‍💼', '🧑', '👩', '🧔']

/** Inline error banner */
function ErrorBanner({ message }: { message: string }) {
  return (
    <div style={{
      background: '#FFF0F0',
      border: '1px solid var(--coral)',
      borderRadius: 8,
      padding: '10px 14px',
      color: 'var(--coral)',
      fontSize: '.82rem',
      marginBottom: 16,
    }}>
      ⚠️ {message}
    </div>
  )
}

/** Skeleton rows for table loading state */
function SkeletonRows({ rows, cols }: { rows: number; cols: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i}>
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j}>
              <div style={{ height: 12, background: 'var(--soft-2)', borderRadius: 4, animationName: 'pulse', animationDuration: '1.5s', animationIterationCount: 'infinite' }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

// ─── CUSTOMERS ───────────────────────────────────────────────────

export function CustomersPage() {
  const [search,  setSearch]  = useState('')
  const [page,    setPage]    = useState(0)
  const [segment, setSegment] = useState('')
  const LIMIT = 15

  const { data, loading, error, refetch } = useAdminFetch(
    () => fetchAdminCustomers({ skip: page * LIMIT, limit: LIMIT, search: search || undefined, segment: segment || undefined }),
    [page, search, segment],
  )

  const customers  = data?.data       ?? []
  const totalCount = data?.totalCount ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / LIMIT))

  function segmentTag(c: ApiCustomer) {
    if (c.total_orders >= 10) return { cls: 'tag-vip',     label: '⭐ VIP'  }
    if (c.total_orders === 0) return { cls: 'tag-new',     label: 'New'     }
    return                         { cls: 'tag-regular',   label: 'Regular' }
  }

  // Debounce search so we don't hammer the API on every keystroke
  const [searchInput, setSearchInput] = useState('')
  const searchTimeout = useState<ReturnType<typeof setTimeout> | null>(null)
  function handleSearch(value: string) {
    setSearchInput(value)
    if (searchTimeout[0]) clearTimeout(searchTimeout[0])
    searchTimeout[1](setTimeout(() => {
      setSearch(value)
      setPage(0)
    }, 350))
  }

  async function handleDelete(c: ApiCustomer) {
    if (!confirm(`Permanently delete customer "${c.name}"?\nThis cannot be undone.`)) return
    try {
      await deleteCustomer(c.id)
      refetch()
    } catch (err: any) {
      alert(err.message ?? 'Failed to delete customer')
    }
  }

  const pageNumbers = Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i)

  return (
    <div>
      <div className="page-header">
        <div className="ph-left">
          <div className="ph-title">Customers</div>
          <div className="ph-sub">
            {loading ? 'Loading…' : `${totalCount.toLocaleString()} registered customers`}
          </div>
        </div>
        <div className="ph-actions">
          <button className="btn btn-outline">📥 Export CSV</button>
          <button className="btn btn-ghost btn-sm" onClick={refetch} title="Refresh">↻</button>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <FilterTabs
            tabs={['All', '⭐ VIP', 'Regular', 'New']}
            active={segment || 'All'}
            onChange={(t) => { setSegment(t === 'All' ? '' : t); setPage(0) }}
          />
          <div className="tb-search" style={{ width: 220 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: 'var(--muted)', flexShrink: 0 }}>
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Search name, email, phone…"
              value={searchInput}
              onChange={(e) => handleSearch(e.target.value)}
            />
            {searchInput && (
              <button
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: '0 2px', lineHeight: 1 }}
                onClick={() => { setSearchInput(''); setSearch(''); setPage(0) }}
              >✕</button>
            )}
          </div>
        </div>

        {error && <div style={{ padding: '0 16px 8px' }}><ErrorBanner message={error} /></div>}

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Email</th>
                <th>City</th>
                <th>Orders</th>
                <th>Total Spent</th>
                <th>Joined</th>
                <th>Segment</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows rows={8} cols={8} />
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>
                    {search ? `No customers match "${search}"` : 'No customers found'}
                  </td>
                </tr>
              ) : (
                customers.map((c, idx) => {
                  const seg = segmentTag(c)
                  return (
                    <tr key={c.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                          <div className="rc-av" style={{ background: AVATAR_BG[idx % AVATAR_BG.length] }}>
                            {EMOJI[idx % EMOJI.length]}
                          </div>
                          <div>
                            <div style={{ fontWeight: 800 }}>{c.name || '—'}</div>
                            <div className="td-muted">{c.phone || '—'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="td-muted">{c.email}</td>
                      <td>{c.city || '—'}</td>
                      <td style={{ fontWeight: 800 }}>{c.total_orders}</td>
                      <td style={{ fontWeight: 900, color: 'var(--coral)' }}>
                        ₹{c.total_spent.toLocaleString('en-IN')}
                      </td>
                      <td className="td-muted">
                        {new Date(c.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td><span className={`tag ${seg.cls}`}>{seg.label}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 5 }}>
                          <button className="btn btn-ghost btn-xs btn-icon" title="View details">👁</button>
                          <button
                            className="btn btn-danger btn-xs btn-icon"
                            title="Delete customer"
                            onClick={() => handleDelete(c)}
                          >🗑</button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="card-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '.75rem', fontWeight: 700, color: 'var(--muted)' }}>
            Showing {customers.length} of {totalCount.toLocaleString()}
          </span>
          <div style={{ display: 'flex', gap: 4 }}>
            <button className="btn btn-ghost btn-sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>← Prev</button>
            {pageNumbers.map((i) => (
              <button
                key={i}
                className={`btn btn-sm ${page === i ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setPage(i)}
              >{i + 1}</button>
            ))}
            {totalPages > 7 && page < totalPages - 1 && (
              <span style={{ alignSelf: 'center', color: 'var(--muted)', fontSize: '.8rem' }}>… {totalPages}</span>
            )}
            <button className="btn btn-ghost btn-sm" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>Next →</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── CATEGORIES ──────────────────────────────────────────────────

interface CategoryFormProps {
  category?: ApiCategory | null
  onClose: () => void
  onSaved: () => void
  allCats: ApiCategory[]
}

function CategoryForm({ category, onClose, onSaved, allCats }: CategoryFormProps) {
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState<string | null>(null)
  const isEdit = !!category

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const fd = e.currentTarget
    const getValue = (name: string) => (fd.elements.namedItem(name) as HTMLInputElement | null)?.value ?? ''
    const getSelect= (name: string) => (fd.elements.namedItem(name) as HTMLSelectElement | null)?.value ?? ''

    const payload = {
      name:        getValue('name').trim(),
      slug:        getValue('slug').trim().toLowerCase().replace(/\s+/g, '-'),
      emoji:       getValue('emoji').trim() || undefined,
      description: getValue('desc').trim()  || undefined,
      parent_id:   getSelect('parent')      || undefined,
      sort_order:  parseInt(getValue('sort')) || 0,
    }

    try {
      if (isEdit) await updateCategory(category!.id, payload)
      else        await createCategory(payload)
      onSaved()
      onClose()
    } catch (err: any) {
      setError(err.message ?? 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  // Auto-generate slug from name
  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const slugInput = (e.currentTarget.form?.elements.namedItem('slug') as HTMLInputElement | null)
    if (slugInput && !isEdit) {
      slugInput.value = e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    }
  }

  // Flatten for parent select — exclude current category and its children to prevent circular refs
  const excludeIds = new Set<string>()
  if (isEdit && category) {
    const collectIds = (c: ApiCategory) => {
      excludeIds.add(c.id)
      c.children?.forEach(collectIds)
    }
    collectIds(category)
  }
  const flatRootCats = allCats.filter((c) => !c.parent_id && !excludeIds.has(c.id))

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-head">
          <div className="drawer-title">{isEdit ? '✏️ Edit Category' : '➕ Add Category'}</div>
          <button className="drawer-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="drawer-body">
            {error && <ErrorBanner message={error} />}

            <div className="form-group">
              <label className="form-label">Category Name *</label>
              <input
                name="name"
                className="form-input"
                required
                defaultValue={category?.name}
                placeholder="e.g. Soft Toys"
                onChange={handleNameChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Slug *</label>
              <input
                name="slug"
                className="form-input"
                required
                defaultValue={category?.slug}
                placeholder="e.g. soft-toys"
              />
              <span style={{ fontSize: '.72rem', color: 'var(--muted)', marginTop: 4, display: 'block' }}>
                URL-friendly identifier. Auto-filled from name.
              </span>
            </div>

            <div className="form-grid form-grid-2">
              <div className="form-group">
                <label className="form-label">Emoji</label>
                <input name="emoji" className="form-input" defaultValue={category?.emoji ?? ''} placeholder="🧸" />
              </div>
              <div className="form-group">
                <label className="form-label">Sort Order</label>
                <input name="sort" type="number" className="form-input" defaultValue={category?.sort_order ?? 0} min={0} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Parent Category</label>
              <select name="parent" className="form-select" defaultValue={category?.parent_id ?? ''}>
                <option value="">— None (root category) —</option>
                {flatRootCats.map((c) => (
                  <option key={c.id} value={c.id}>{c.emoji ? `${c.emoji} ` : ''}{c.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <input
                name="desc"
                className="form-input"
                defaultValue={category?.description ?? ''}
                placeholder="Short description…"
              />
            </div>
          </div>

          <div className="drawer-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? '⏳ Saving…' : isEdit ? '💾 Update' : '➕ Add Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function CategoriesPage() {
  const [editCat, setEditCat] = useState<ApiCategory | null | undefined>(undefined)
  const { data: categories, loading, error, refetch } = useAdminFetch(fetchCategories, [])

  // Flatten tree for parent select and counts
  function flattenTree(cats: ApiCategory[]): ApiCategory[] {
    return cats.flatMap((c) => [c, ...flattenTree(c.children ?? [])])
  }
  const allFlat = categories ? flattenTree(categories) : []

  async function handleDelete(c: ApiCategory) {
    const hasChildren = (c.children?.length ?? 0) > 0
    const warning = hasChildren
      ? `"${c.name}" has sub-categories. Deleting it may also remove them.\nAre you sure?`
      : `Delete category "${c.name}"?`
    if (!confirm(warning)) return
    try {
      await deleteCategory(c.id)
      refetch()
    } catch (err: any) {
      alert(err.message ?? 'Failed to delete')
    }
  }

  function renderRows(cats: ApiCategory[], depth = 0): React.ReactNode[] {
    return cats.flatMap((c) => [
      <tr key={c.id}>
        <td>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: depth * 20 }}>
            {depth > 0 && <span style={{ color: 'var(--muted)', fontSize: '.8rem' }}>↳</span>}
            <span style={{ fontSize: 20 }}>{c.emoji ?? '📁'}</span>
            <div>
              <div style={{ fontWeight: 800 }}>{c.name}</div>
              <div className="td-muted">{c.slug}</div>
            </div>
          </div>
        </td>
        <td>{c.parent_id ? '↳ Sub-category' : '📂 Root'}</td>
        <td style={{ fontWeight: 700 }}>{c.sort_order}</td>
        <td>
          <span className={`pill ${c.is_active !== false ? 'pill-green' : 'pill-red'}`}>
            {c.is_active !== false ? 'Active' : 'Inactive'}
          </span>
        </td>
        <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {c.description ?? '—'}
        </td>
        <td>
          <div style={{ display: 'flex', gap: 5 }}>
            <button className="btn btn-ghost btn-xs btn-icon" onClick={() => setEditCat(c)} title="Edit">✏️</button>
            <button className="btn btn-danger btn-xs btn-icon" onClick={() => handleDelete(c)} title="Delete">🗑</button>
          </div>
        </td>
      </tr>,
      ...renderRows(c.children ?? [], depth + 1),
    ])
  }

  return (
    <div>
      <div className="page-header">
        <div className="ph-left">
          <div className="ph-title">Categories</div>
          <div className="ph-sub">
            {loading ? 'Loading…' : `${allFlat.length} categories (${categories?.length ?? 0} root)`}
          </div>
        </div>
        <div className="ph-actions">
          <button className="btn btn-ghost btn-sm" onClick={refetch} title="Refresh">↻</button>
          <button className="btn btn-primary" onClick={() => setEditCat(null)}>➕ Add Category</button>
        </div>
      </div>

      <div className="card">
        {error && <div style={{ padding: '16px 16px 0' }}><ErrorBanner message={error} /></div>}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name / Slug</th>
                <th>Type</th>
                <th>Sort</th>
                <th>Status</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows rows={6} cols={6} />
              ) : !categories || allFlat.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>
                    No categories yet. Add your first one!
                  </td>
                </tr>
              ) : (
                renderRows(categories)
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editCat !== undefined && (
        <CategoryForm
          category={editCat}
          allCats={allFlat}
          onClose={() => setEditCat(undefined)}
          onSaved={refetch}
        />
      )}
    </div>
  )
}

// ─── COUPONS ──────────────────────────────────────────────────────

interface CouponFormProps {
  coupon?: ApiCoupon | null
  onClose: () => void
  onSaved: () => void
}

function CouponForm({ coupon, onClose, onSaved }: CouponFormProps) {
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState<string | null>(null)
  const isEdit = !!coupon

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const fd = e.currentTarget
    const getValue  = (name: string) => (fd.elements.namedItem(name) as HTMLInputElement | null)?.value ?? ''
    const getSelect = (name: string) => (fd.elements.namedItem(name) as HTMLSelectElement | null)?.value ?? ''
    const getCheck  = (name: string) => (fd.elements.namedItem(name) as HTMLInputElement | null)?.checked ?? false

    const discountValue = parseFloat(getValue('value'))
    if (isNaN(discountValue) || discountValue <= 0) {
      setError('Discount value must be a positive number')
      setSaving(false)
      return
    }

    const discountType = getSelect('type') as 'percentage' | 'flat'
    if (discountType === 'percentage' && discountValue > 100) {
      setError('Percentage discount cannot exceed 100%')
      setSaving(false)
      return
    }

    const payload = {
      code:           getValue('code').toUpperCase().trim(),
      discount_type:  discountType,
      discount_value: discountValue,
      min_order:      parseFloat(getValue('min'))     || 0,
      max_uses:       parseInt(getValue('maxUses'))   || 100,
      is_active:      getCheck('active'),
      expires_at:     getValue('expires') || null,
    }

    try {
      if (isEdit) await updateCoupon(coupon!.id, payload)
      else        await createCoupon(payload)
      onSaved()
      onClose()
    } catch (err: any) {
      setError(err.message ?? 'Failed to save coupon')
    } finally {
      setSaving(false)
    }
  }

  const defaultExpiry = coupon?.expires_at ? coupon.expires_at.split('T')[0] : ''

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-head">
          <div className="drawer-title">{isEdit ? '✏️ Edit Coupon' : '🏷️ New Coupon'}</div>
          <button className="drawer-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="drawer-body">
            {error && <ErrorBanner message={error} />}

            <div className="form-group">
              <label className="form-label">Coupon Code *</label>
              <input
                name="code"
                className="form-input"
                required
                defaultValue={coupon?.code}
                placeholder="SAVE20"
                style={{ textTransform: 'uppercase', letterSpacing: 2, fontFamily: 'monospace', fontWeight: 700 }}
                minLength={3}
                maxLength={20}
              />
            </div>

            <div className="form-grid form-grid-2">
              <div className="form-group">
                <label className="form-label">Discount Type *</label>
                <select name="type" className="form-select" defaultValue={coupon?.discount_type ?? 'percentage'}>
                  <option value="percentage">Percentage (%)</option>
                  <option value="flat">Flat Amount (₹)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Discount Value *</label>
                <input
                  name="value"
                  type="number"
                  min={1}
                  step="0.01"
                  className="form-input"
                  required
                  defaultValue={coupon?.discount_value}
                  placeholder="20"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Min Order Amount (₹)</label>
                <input
                  name="min"
                  type="number"
                  min={0}
                  className="form-input"
                  defaultValue={coupon?.min_order ?? 0}
                  placeholder="500"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Max Total Uses</label>
                <input
                  name="maxUses"
                  type="number"
                  min={1}
                  className="form-input"
                  defaultValue={coupon?.max_uses ?? 100}
                  placeholder="100"
                />
              </div>

              <div className="form-group span-2">
                <label className="form-label">Expiry Date (optional)</label>
                <input
                  name="expires"
                  type="date"
                  className="form-input"
                  defaultValue={defaultExpiry}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                name="active"
                type="checkbox"
                defaultChecked={coupon?.is_active ?? true}
                style={{ width: 16, height: 16, cursor: 'pointer' }}
                id="coupon-active"
              />
              <label className="form-label" style={{ margin: 0, cursor: 'pointer' }} htmlFor="coupon-active">
                Active (coupon can be used immediately)
              </label>
            </div>

            {isEdit && coupon && (
              <div style={{ background: 'var(--soft-2)', borderRadius: 8, padding: '10px 14px', fontSize: '.8rem', color: 'var(--muted)' }}>
                Used {coupon.used_count} / {coupon.max_uses} times
              </div>
            )}
          </div>

          <div className="drawer-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? '⏳ Saving…' : isEdit ? '💾 Update Coupon' : '🏷️ Create Coupon'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function CouponsPage() {
  const [editCoupon, setEditCoupon] = useState<ApiCoupon | null | undefined>(undefined)
  const { data: coupons, loading, error, refetch } = useAdminFetch(fetchCoupons, [])

  const activeCoupons   = (coupons ?? []).filter((c) =>  c.is_active)
  const inactiveCoupons = (coupons ?? []).filter((c) => !c.is_active)

  async function handleDelete(c: ApiCoupon) {
    if (!confirm(`Delete coupon "${c.code}"?\nThis will remove it permanently.`)) return
    try {
      await deleteCoupon(c.id)
      refetch()
    } catch (err: any) {
      alert(err.message ?? 'Failed to delete')
    }
  }

  function isExpired(c: ApiCoupon): boolean {
    if (!c.expires_at) return false
    return new Date(c.expires_at) < new Date()
  }

  function usagePct(c: ApiCoupon): number {
    if (!c.max_uses) return 0
    return Math.min(100, Math.round((c.used_count / c.max_uses) * 100))
  }

  return (
    <div>
      <div className="page-header">
        <div className="ph-left">
          <div className="ph-title">Coupons</div>
          <div className="ph-sub">
            {loading ? 'Loading…' : `${(coupons ?? []).length} codes · ${activeCoupons.length} active`}
          </div>
        </div>
        <div className="ph-actions">
          <button className="btn btn-ghost btn-sm" onClick={refetch} title="Refresh">↻</button>
          <button className="btn btn-primary" onClick={() => setEditCoupon(null)}>🏷️ New Coupon</button>
        </div>
      </div>

      {error && <div className="card" style={{ padding: 16 }}><ErrorBanner message={error} /></div>}

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Type</th>
                <th>Value</th>
                <th>Min Order</th>
                <th>Usage</th>
                <th>Expires</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows rows={5} cols={8} />
              ) : (coupons ?? []).length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>
                    No coupons yet. Create your first promo code!
                  </td>
                </tr>
              ) : (
                (coupons ?? []).map((c) => {
                  const expired = isExpired(c)
                  const pct = usagePct(c)
                  return (
                    <tr key={c.id} style={{ opacity: expired ? 0.6 : 1 }}>
                      <td>
                        <span style={{
                          fontFamily: 'monospace',
                          fontWeight: 900,
                          fontSize: '.85rem',
                          background: 'var(--soft-2)',
                          padding: '3px 8px',
                          borderRadius: 5,
                          letterSpacing: 1,
                        }}>
                          {c.code}
                        </span>
                      </td>
                      <td>
                        <span className={`pill ${c.discount_type === 'percentage' ? 'pill-blue' : 'pill-purple'}`}>
                          {c.discount_type === 'percentage' ? '% Off' : '₹ Off'}
                        </span>
                      </td>
                      <td style={{ fontWeight: 800, fontSize: '1rem' }}>
                        {c.discount_type === 'percentage' ? `${c.discount_value}%` : `₹${c.discount_value}`}
                      </td>
                      <td className="td-muted">₹{c.min_order.toLocaleString('en-IN')}</td>
                      <td>
                        <div style={{ minWidth: 90 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.72rem', color: 'var(--muted)', marginBottom: 3 }}>
                            <span>{c.used_count} used</span>
                            <span>{c.max_uses} max</span>
                          </div>
                          <div style={{ height: 4, background: 'var(--soft-2)', borderRadius: 99, overflow: 'hidden' }}>
                            <div style={{
                              width: `${pct}%`,
                              height: '100%',
                              background: pct >= 90 ? 'var(--coral)' : 'var(--primary)',
                              borderRadius: 99,
                              transition: 'width 0.3s',
                            }} />
                          </div>
                        </div>
                      </td>
                      <td className="td-muted">
                        {c.expires_at
                          ? <span style={{ color: expired ? 'var(--coral)' : undefined }}>
                              {expired ? '⚠️ ' : ''}{new Date(c.expires_at).toLocaleDateString('en-IN')}
                            </span>
                          : 'Never'}
                      </td>
                      <td>
                        <span className={`pill ${c.is_active && !expired ? 'pill-green' : 'pill-red'}`}>
                          {expired ? 'Expired' : c.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 5 }}>
                          <button className="btn btn-ghost btn-xs btn-icon" onClick={() => setEditCoupon(c)} title="Edit">✏️</button>
                          <button className="btn btn-danger btn-xs btn-icon" onClick={() => handleDelete(c)} title="Delete">🗑</button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
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
  const [page, setPage] = useState(0)
  const LIMIT = 20

  const { data, loading, error, refetch } = useAdminFetch(
    () => fetchAdminReviews({
      skip:     page * LIMIT,
      limit:    LIMIT,
      approved: showPending ? false : undefined,
    }),
    [showPending, page],
  )

  const reviews    = data?.data       ?? []
  const totalCount = data?.totalCount ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / LIMIT))

  async function handleApprove(r: ApiReview) {
    try {
      await approveReview(r.id)
      refetch()
    } catch (err: any) {
      alert(err.message ?? 'Failed to approve review')
    }
  }

  async function handleDelete(r: ApiReview) {
    if (!confirm('Permanently delete this review?')) return
    try {
      await deleteReview(r.id)
      refetch()
    } catch (err: any) {
      alert(err.message ?? 'Failed to delete review')
    }
  }

  const pendingCount = !showPending ? null : totalCount

  return (
    <div>
      <div className="page-header">
        <div className="ph-left">
          <div className="ph-title">Reviews</div>
          <div className="ph-sub">
            {loading ? 'Loading…' : `${totalCount.toLocaleString()} ${showPending ? 'pending' : 'total'} reviews`}
          </div>
        </div>
        <div className="ph-actions">
          <button
            className={`btn ${showPending ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => { setShowPending(!showPending); setPage(0) }}
          >
            {showPending ? '📋 Show All' : '⏳ Pending Only'}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={refetch} title="Refresh">↻</button>
        </div>
      </div>

      {error && <div className="card" style={{ padding: 16 }}><ErrorBanner message={error} /></div>}

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Product</th>
                <th>Rating</th>
                <th>Comment</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows rows={6} cols={7} />
              ) : reviews.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>
                    {showPending ? '✅ No pending reviews — all caught up!' : 'No reviews yet'}
                  </td>
                </tr>
              ) : (
                reviews.map((r, idx) => (
                  <tr key={r.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="rc-av" style={{ background: AVATAR_BG[idx % AVATAR_BG.length] }}>
                          {EMOJI[idx % EMOJI.length]}
                        </div>
                        <div style={{ fontWeight: 700 }}>{r.customer_name || '—'}</div>
                      </div>
                    </td>
                    <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <span title={r.product_name}>{r.product_name || '—'}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 1 }}>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i} style={{ color: i < r.rating ? '#F59E0B' : 'var(--border)', fontSize: '1rem' }}>★</span>
                        ))}
                        <span style={{ marginLeft: 4, fontSize: '.75rem', color: 'var(--muted)', fontWeight: 700 }}>{r.rating}/5</span>
                      </div>
                    </td>
                    <td style={{ maxWidth: 260 }}>
                      <span
                        title={r.comment}
                        style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                      >
                        {r.comment || <em style={{ color: 'var(--muted)' }}>No comment</em>}
                      </span>
                    </td>
                    <td className="td-muted">
                      {new Date(r.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td>
                      <span className={`pill ${r.is_approved ? 'pill-green' : 'pill-yellow'}`}>
                        {r.is_approved ? '✅ Approved' : '⏳ Pending'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 5 }}>
                        {!r.is_approved && (
                          <button
                            className="btn btn-ghost btn-xs"
                            style={{ color: 'var(--green)', borderColor: 'var(--green)' }}
                            onClick={() => handleApprove(r)}
                            title="Approve this review"
                          >
                            ✅ Approve
                          </button>
                        )}
                        <button
                          className="btn btn-danger btn-xs btn-icon"
                          onClick={() => handleDelete(r)}
                          title="Delete review"
                        >🗑</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="card-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '.75rem', fontWeight: 700, color: 'var(--muted)' }}>
              Showing {reviews.length} of {totalCount.toLocaleString()}
            </span>
            <div style={{ display: 'flex', gap: 4 }}>
              <button className="btn btn-ghost btn-sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>← Prev</button>
              {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => (
                <button
                  key={i}
                  className={`btn btn-sm ${page === i ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setPage(i)}
                >{i + 1}</button>
              ))}
              <button className="btn btn-ghost btn-sm" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}