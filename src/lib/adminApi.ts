/**
 * adminApi.ts — merged production API layer
 *
 * Merged from:
 * - Old version: handles Dashboard, Orders (with normalizeOrder), Products,
 *   Blog, Analytics, Settings, Variants. Uses NextAuth getSession() for JWT.
 * - New version: adds Customers, Categories (with buildCategoryTree),
 *   Coupons, Reviews with full type safety.
 *
 * Auth strategy: NextAuth getSession() → Bearer token in Authorization header
 * + credentials: 'include' for cookie fallback (works for both NextAuth
 * and direct cookie-based sessions).
 *
 * Key interfaces kept from old version (RawBackendOrder, normalizeOrder, etc.)
 * New interfaces added: ApiCustomer, ApiCoupon, ApiReview, ApiCategory (tree).
 */

import { getSession } from 'next-auth/react'

// ════════════════════════════════════════════════════════════════
// RAW BACKEND SHAPES  (what the API actually returns)
// ════════════════════════════════════════════════════════════════

export interface RawBackendOrderItem {
  product_id:  string
  quantity:    number        // backend uses "quantity", NOT "qty"
  price:       number
  color:       string | null
  color_hex:   string | null
  image?:      string | null
  id?:         string
  order_id?:   string
  product?: {
    id:              string
    name:            string
    color?:          string | null
    color_hex?:      string | null
    product_image?:  { url: string; public_id?: string }[]
    [key: string]:   any
  }
}

export interface RawBackendOrder {
  id:               string
  user_id:          string
  shipping_address: string | null
  total_amount:     number
  status:           string
  created_at:       string
  updated_at:       string
  order_date?:      string
  order_items:      RawBackendOrderItem[]
}

// ════════════════════════════════════════════════════════════════
// NORMALISED / UI SHAPES
// ════════════════════════════════════════════════════════════════

export interface OrderItem {
  product_id: string
  name:       string
  qty:        number
  price:      number
  color:      string | null
  color_hex:  string | null
  image:      string | null
}

export interface ApiOrder {
  id:             string
  user_id:        string
  total_amount:   number
  status:         string
  created_at:     string
  updated_at:     string
  // Derived / admin fields
  order_number:   string
  customer_name:  string
  customer_email: string
  customer_phone: string
  address:        string
  city:           string
  state:          string
  pincode:        string
  payment_method: string
  payment_status: string
  razorpay_payment_id: string | null   // NEW (Phase 4)
  paid_at:        string | null         // NEW (Phase 4)
  notes:          string
  items:          OrderItem[]
}

export interface ApiOrdersResult {
  orders:     ApiOrder[]
  totalCount: number
}

export interface ApiProduct {
  id:                   string
  name:                 string
  category:             string | null
  category_id:          string | null
  sub_category_slug:    string | null
  sub_category_name:    string | null
  description:          string | null
  details:              string[]
  original_price:       number
  amount_discount:      number
  percentage_discount:  number
  count:                number
  product_image:        { url: string; public_id: string }[]
  brand:                string | null
  age_range:            string | null
  is_new:               boolean
  is_featured:          boolean
  is_active:            boolean
  offer_expiration_date:string | null
  created_at:           string | null
  variant_group_id?:    string | null
  color?:               string | null
  color_hex?:           string | null
}

export interface ApiProductListResponse {
  data:       ApiProduct[]
  totalCount: number
  page:       number
  limit:      number
}

export interface ApiCategory {
  id:          string
  name:        string
  slug:        string
  parent_id:   string | null
  emoji:       string | null
  description: string | null
  sort_order:  number
  is_active:   boolean
  product_count?: number      // NEW (Phase 6 — admin list only)
  children:    ApiCategory[]
}

export interface ApiCustomer {
  id:              string
  name:            string
  email:           string
  phone:           string
  city:            string
  total_orders:    number
  total_spent:     number
  last_order_date: string | null
  segment?:        string
  role:            number
  is_active:       boolean
  created_at:      string
}

export interface ApiCustomerOrder {
  id:           string
  order_number: string
  status:       string
  total_amount: number
  created_at:   string | null
  item_count:   number
}

export interface ApiCustomerAddress {
  id:            string
  full_name:     string
  phone:         string
  address_line1: string
  address_line2: string
  city:          string
  state:         string
  postal_code:   string
  country:       string
  address_type:  string
  is_default:    boolean
}

export interface ApiCustomerDetail {
  id:              string
  name:            string
  email:           string
  phone:           string
  city:            string
  role:            number
  confirmed:       boolean
  is_active:       boolean
  created_at:      string
  profile_image:   string | null
  total_orders:    number
  total_spent:     number
  last_order_date: string | null
  orders:          ApiCustomerOrder[]
  addresses:       ApiCustomerAddress[]
}

export async function fetchCustomerById(id: string): Promise<ApiCustomerDetail> {
  return adminFetch<ApiCustomerDetail>(`/api/admin/customers/${id}`)
}

export async function setCustomerActive(id: string, isActive: boolean): Promise<void> {
  await adminFetch(`/api/admin/customers/${id}`, {
    method: 'PUT',
    body:   JSON.stringify({ is_active: isActive }),
  })
}

export interface ApiCustomerListResponse {
  data:       ApiCustomer[]
  totalCount: number
  page:       number
  limit:      number
}

export interface ApiDashboardStats {
  revenue_this_month:  number
  orders_this_month:   number
  total_customers:     number
  return_rate:         number
  revenue_trend:       number
  orders_trend:        number
  customers_trend:     number
  order_status_counts: {
    pending:    number
    confirmed:  number
    processing: number
    shipped:    number
    delivered:  number
    cancelled:  number
  }
  recent_orders: RawBackendOrder[]
  top_products:  { id: string; name: string; category: string; price: number; sold: number }[]
  revenue_chart: { label: string; revenue: number; orders: number }[]
}

export interface ApiCoupon {
  id:             string
  code:           string
  discount_type:  'percentage' | 'flat'
  discount_value: number
  min_order:      number
  max_uses:       number
  used_count:     number
  is_active:      boolean
  expires_at:     string | null
  created_at:     string
}

export interface ApiReview {
  id:            string
  product_id:    string
  product_name:  string
  user_id:       string
  customer_name: string
  rating:        number
  comment:       string
  is_approved:   boolean
  created_at:    string
}

export interface ApiBlogPost {
  id:         string
  title:      string
  slug:       string
  excerpt:    string
  content:    string
  tag:        string
   image_url?: string | null 
  status:     'published' | 'draft'
  views:      number
  comments:   number
  likes:      number
  created_at: string
  updated_at: string
}

// ════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════

/** Parse ", D1302 klp abhinandan apartment, chennai, Tamil Nadu - 600007" */
function parseShippingAddress(raw: string | null | undefined) {
  const empty = { street: '—', city: '—', state: '—', pincode: '—' }
  if (!raw?.trim()) return empty

  const parts    = raw.split(',').map((p) => p.trim()).filter(Boolean)
  if (parts.length < 2) return { ...empty, street: raw.trim() }

  const last     = parts[parts.length - 1] ?? ''
  const statePin = last.split(' - ')
  const state    = statePin[0]?.trim()  || '—'
  const pincode  = statePin[1]?.trim()  || '—'
  const city     = parts[parts.length - 2]?.trim() || '—'
  const street   = parts.slice(0, -2).join(', ').trim() || '—'

  return { street, city, state, pincode }
}

export function normalizeOrder(raw: any): ApiOrder {
  const addr = parseShippingAddress(raw.shipping_address)

  const items: OrderItem[] = (raw.items ?? raw.order_items ?? []).map((i: any) => ({
    product_id: i.product_id ?? i.id ?? '',
    name:       i.name ?? i.product?.name ?? i.product_name ?? '—',
    qty:        i.qty ?? i.quantity ?? 1,
    price:      i.price ?? 0,
    color:      i.color ?? i.product?.color ?? null,
    color_hex:  i.color_hex ?? i.product?.color_hex ?? null,
    image:      i.image ?? i.product?.product_image?.[0]?.url ?? null,
  }))

  const id     = raw.id ?? ''
  const userId = raw.user_id ? String(raw.user_id) : ''

  return {
    id,
    user_id:        userId,
    order_number:   raw.order_number ?? (id ? id.slice(0, 8).toUpperCase() : '—'),
    // Real name from the Users join; id-hash fallback only when truly absent.
    customer_name:  raw.customer_name || (userId ? `#${userId.slice(0, 8).toUpperCase()}` : '—'),
    customer_email: raw.customer_email || '—',
    customer_phone: raw.customer_phone || '—',
    address:        addr.street,
    city:           addr.city,
    state:          addr.state,
    pincode:        addr.pincode,
    payment_method: raw.payment_method || '',
    payment_status: raw.payment_status || '',
    razorpay_payment_id: raw.razorpay_payment_id ?? null,
    paid_at:        raw.paid_at ?? null,
    notes:          raw.notes ?? '',
    items,
    total_amount:   raw.total_amount ?? raw.total ?? 0,
    status:         raw.status ?? 'pending',
    created_at:     raw.created_at ?? new Date().toISOString(),
    updated_at:     raw.updated_at ?? raw.created_at ?? '',
  }
}

/**
 * Build nested category tree from flat API list.
 * Safe even if API already returns children arrays.
 */
function buildCategoryTree(flat: ApiCategory[]): ApiCategory[] {
  const map: Record<string, ApiCategory> = {}
  const roots: ApiCategory[] = []

  flat.forEach((c) => { map[c.id] = { ...c, children: c.children ?? [] } })

  flat.forEach((c) => {
    if (c.parent_id && map[c.parent_id]) {
      map[c.parent_id].children.push(map[c.id])
    } else if (!c.parent_id) {
      roots.push(map[c.id])
    }
  })

  const sortTree = (nodes: ApiCategory[]) => {
    nodes.sort((a, b) => a.sort_order - b.sort_order)
    nodes.forEach((n) => n.children.length && sortTree(n.children))
  }
  sortTree(roots)
  return roots
}

// ════════════════════════════════════════════════════════════════
// CORE FETCHERS
// ════════════════════════════════════════════════════════════════

async function adminFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const session = await getSession()
  const token   = (session as any)?.accessToken ?? ''

  const res = await fetch(path, {
    ...init,
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
    credentials: 'include',
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    let message: string
    try {
      const json = JSON.parse(body)
      message = typeof json?.detail === 'object'
        ? JSON.stringify(json.detail)
        : (json?.detail ?? json?.message ?? body)
    } catch {
      message = body || res.statusText
    }
    throw new Error(`API ${res.status}: ${message}`)
  }

  if (res.status === 204) return {} as T
  return res.json()
}

async function adminFormFetch<T>(path: string, form: FormData, method = 'POST'): Promise<T> {
  const session = await getSession()
  const token   = (session as any)?.accessToken ?? ''

  const res = await fetch(path, {
    method,
    body: form,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: 'include',
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`API ${res.status}: ${body || res.statusText}`)
  }
  if (res.status === 204) return {} as T
  return res.json()
}

// ════════════════════════════════════════════════════════════════
// DASHBOARD
// ════════════════════════════════════════════════════════════════

export async function fetchDashboardStats(): Promise<ApiDashboardStats> {
  return adminFetch<ApiDashboardStats>('/api/admin/dashboard')
}

// ════════════════════════════════════════════════════════════════
// PRODUCTS
// ════════════════════════════════════════════════════════════════

export async function fetchAdminProducts(params: {
  skip?:        number
  limit?:       number
  category?:    string
  search?:      string
  in_stock?:    boolean
  on_sale?:     boolean
  is_new?:      boolean
  is_featured?: boolean
  is_active?:   boolean          // explicit true/false (admin)
  include_inactive?: boolean     // admin: show all incl. inactive
  stock_status?: 'in_stock' | 'low_stock' | 'out_of_stock'
  sort_by?:     'featured' | 'price_asc' | 'price_desc' | 'newest' | 'stock_asc' | 'stock_desc'
} = {}): Promise<ApiProductListResponse> {
  const qs = new URLSearchParams()
  if (params.skip        !== undefined) qs.set('skip',  String(params.skip))
  if (params.limit       !== undefined) qs.set('limit', String(params.limit))
  if (params.category)                  qs.set('category', params.category)
  if (params.search)                    qs.set('search',   params.search)
  if (params.in_stock)                  qs.set('in_stock', 'true')
  if (params.on_sale)                   qs.set('on_sale',  'true')
  if (params.is_new)                    qs.set('is_new',      'true')
  if (params.is_featured)               qs.set('is_featured', 'true')
  if (params.is_active !== undefined)   qs.set('is_active', String(params.is_active))
  if (params.include_inactive)          qs.set('include_inactive', 'true')
  if (params.stock_status)              qs.set('stock_status', params.stock_status)
  if (params.sort_by)                   qs.set('sort_by', params.sort_by)

  // Routed through adminFetch → carries auth + goes through the Next proxy.
  // (Was a hardcoded http://localhost:8000 fetch with no auth — broken in prod.)
  return adminFetch<ApiProductListResponse>(`/api/product/all?${qs}`)
}

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000'

export async function createProduct(form: FormData): Promise<ApiProduct> {
  return adminFormFetch<ApiProduct>('/api/product', form, 'POST')
}

export async function updateProduct(id: string, form: FormData): Promise<ApiProduct> {
  return adminFormFetch<ApiProduct>(`/api/product/${id}`, form, 'PUT')
}

export async function deleteProduct(id: string): Promise<void> {
  await adminFetch(`${BACKEND}/api/product/${id}`, { method: 'DELETE' })
}

export async function fetchProductById(id: string): Promise<ApiProduct | null> {
  try {
    return await adminFetch<ApiProduct>(`/api/product/${id}`)
  } catch {
    return null
  }
}

export async function fetchProductVariants(productId: string): Promise<ApiProduct[]> {
  const res = await adminFetch<{ variants: ApiProduct[] }>(`/api/product/${productId}/variants`)
  return res?.variants ?? []
}

export async function linkColorVariants(variantIds: string[], groupId: string): Promise<void> {
  await adminFetch('/api/product/admin/link-variants', {
    method: 'POST',
    body:   JSON.stringify({ variant_ids: variantIds, variant_group_id: groupId }),
  })
}

// ════════════════════════════════════════════════════════════════
// CATEGORIES
// ════════════════════════════════════════════════════════════════

export async function fetchCategories(): Promise<ApiCategory[]> {
  const flat = await adminFetch<ApiCategory[]>('/api/categories')
  return buildCategoryTree(flat)
}

/**
 * Admin category list: ALL categories (incl. inactive) with product_count.
 * Returns a flat array; the page rebuilds the tree via buildCategoryTree.
 * (The public fetchCategories() stays active-only roots for the storefront.)
 */
export async function fetchAdminCategories(): Promise<ApiCategory[]> {
  const res = await adminFetch<{ data: ApiCategory[]; totalCount: number }>(
    '/api/categories/admin/list?include_inactive=true',
  )
  return buildCategoryTree(res.data ?? [])
}


export async function createCategory(data: {
  name:         string
  slug:         string
  parent_id?:   string
  emoji?:       string
  description?: string
  sort_order?:  number
}): Promise<ApiCategory> {
  return adminFetch<ApiCategory>('/api/categories', {
    method: 'POST', body: JSON.stringify(data),
  })
}

export async function updateCategory(id: string, data: Partial<ApiCategory>): Promise<ApiCategory> {
  return adminFetch<ApiCategory>(`/api/categories/${id}`, {
    method: 'PUT', body: JSON.stringify(data),
  })
}

export interface CategoryDeleteBlocked {
  blocked: true
  reason: 'has_products' | 'has_children'
  message: string
  product_count: number
  child_count: number
}

/**
 * Delete a category. Resolves on success.
 * Throws a CategoryDeleteBlocked-shaped error (via .blockedInfo) on 409 so the
 * UI can show "reassign N products first" or confirm re-parenting children.
 */
export async function deleteCategory(id: string, force = false): Promise<void> {
  try {
    await adminFetch(`/api/categories/${id}?force=${force}`, { method: 'DELETE' })
  } catch (err: any) {
    // adminFetch throws `API 409: <detail>`. The detail is our structured object,
    // JSON-stringified inside the message. Parse it back out for the UI.
    const m = String(err?.message ?? '')
    if (m.startsWith('API 409')) {
      const jsonStart = m.indexOf('{')
      if (jsonStart >= 0) {
        try {
          const info = JSON.parse(m.slice(jsonStart))
          const e: any = new Error(info.message ?? 'Cannot delete category')
          e.blockedInfo = { blocked: true, ...info } as CategoryDeleteBlocked
          throw e
        } catch { /* fall through to rethrow original */ }
      }
    }
    throw err
  }
}

// ════════════════════════════════════════════════════════════════
// ORDERS
// ════════════════════════════════════════════════════════════════

// Frontend sort field → actual backend DB column
const SORT_FIELD_MAP: Record<string, string> = {
  order_number:   'created_at',
  customer_name:  'created_at',
  total_amount:   'total_amount',
  payment_method: 'created_at',
  created_at:     'created_at',
  status:         'status',
}

export async function fetchAdminOrders(params: {
  skip?:     number
  limit?:    number
  status?:   string
  search?:   string
  dateFrom?: string
  dateTo?:   string
  sortBy?:   string           // 'created_at' | 'total_amount'
  sortDir?:  'asc' | 'desc'
} = {}): Promise<ApiOrdersResult> {
  const qs = new URLSearchParams()
  if (params.skip  !== undefined) qs.set('skip',  String(params.skip))
  if (params.limit !== undefined) qs.set('limit', String(params.limit))
  if (params.status && params.status !== 'All') qs.set('status', params.status)
  if (params.search)   qs.set('search',    params.search)
  if (params.dateFrom) qs.set('date_from', params.dateFrom)
  if (params.dateTo)   qs.set('date_to',   params.dateTo)
  qs.set('sortBy',  params.sortBy === 'total_amount' ? 'total_amount' : 'created_at')
  qs.set('sortDir', params.sortDir ?? 'desc')

  const raw = await adminFetch<any>(`/api/admin/orders?${qs}`)
  const list: any[] = Array.isArray(raw) ? raw : (raw?.data ?? raw?.orders ?? [])
  const totalCount: number = Array.isArray(raw)
    ? list.length
    : (raw?.totalCount ?? raw?.total ?? list.length)

  return { orders: list.map(normalizeOrder), totalCount }
}
// BUG FIX: backend returns 405 for PATCH /orders/{id}/status — use PUT instead
export async function updateOrderStatus(id: string, status: string): Promise<void> {
  await adminFetch(`/api/admin/orders/${id}`, {
    method: 'PUT',
    body:   JSON.stringify({ status }),
  })
}

export async function deleteOrder(id: string): Promise<void> {
  await adminFetch(`/api/admin/orders/${id}`, { method: 'DELETE' })
}

export async function exportOrdersCSV(params: {
  status?:  string
  search?:  string
  sortBy?:  string
  sortDir?: 'asc' | 'desc'
} = {}): Promise<Blob> {
  const session = await getSession()
  const token   = (session as any)?.accessToken ?? ''

  const qs = new URLSearchParams()
  if (params.status)  qs.set('status',  params.status)
  if (params.search)  qs.set('search',  params.search)
  if (params.sortBy)  qs.set('sortBy',  SORT_FIELD_MAP[params.sortBy] ?? params.sortBy)
  if (params.sortDir) qs.set('sortDir', params.sortDir)

  const res = await fetch(`/api/admin/orders/export?${qs}`, {
    cache: 'no-store',
    headers: {
      Accept: 'text/csv',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Export failed ${res.status}: ${body || res.statusText}`)
  }
  return res.blob()
}

// ════════════════════════════════════════════════════════════════
// CUSTOMERS
// ════════════════════════════════════════════════════════════════

export async function fetchAdminCustomers(params: {
  skip?:    number
  limit?:   number
  search?:  string
  segment?: string
} = {}): Promise<ApiCustomerListResponse> {
  const qs = new URLSearchParams()
  if (params.skip    !== undefined) qs.set('skip',    String(params.skip))
  if (params.limit   !== undefined) qs.set('limit',   String(params.limit))
  if (params.search)                qs.set('search',  params.search)
  if (params.segment && params.segment !== 'All') {
    // Map UI label → backend value
    const segMap: Record<string, string> = {
      '⭐ VIP': 'vip',
      'Regular': 'regular',
      'New':     'new',
    }
    qs.set('segment', segMap[params.segment] ?? params.segment)
  }
  return adminFetch<ApiCustomerListResponse>(`/api/admin/customers?${qs}`)
}

export async function deleteCustomer(id: string): Promise<void> {
  await adminFetch(`/api/admin/customers/${id}`, { method: 'DELETE' })
}

// ════════════════════════════════════════════════════════════════
// COUPONS
// ════════════════════════════════════════════════════════════════

export async function fetchCoupons(): Promise<ApiCoupon[]> {
  return adminFetch<ApiCoupon[]>('/api/admin/coupons')
}

export async function createCoupon(
  data: Omit<ApiCoupon, 'id' | 'used_count' | 'created_at'>,
): Promise<ApiCoupon> {
  return adminFetch<ApiCoupon>('/api/admin/coupons', {
    method: 'POST', body: JSON.stringify(data),
  })
}

export async function updateCoupon(id: string, data: Partial<ApiCoupon>): Promise<ApiCoupon> {
  return adminFetch<ApiCoupon>(`/api/admin/coupons/${id}`, {
    method: 'PUT', body: JSON.stringify(data),
  })
}

export async function deleteCoupon(id: string): Promise<void> {
  await adminFetch(`/api/admin/coupons/${id}`, { method: 'DELETE' })
}

// ════════════════════════════════════════════════════════════════
// REVIEWS
// ════════════════════════════════════════════════════════════════

export async function fetchAdminReviews(params: {
  skip?:     number
  limit?:    number
  approved?: boolean
} = {}): Promise<{ data: ApiReview[]; totalCount: number }> {
  const qs = new URLSearchParams()
  if (params.skip     !== undefined) qs.set('skip',     String(params.skip))
  if (params.limit    !== undefined) qs.set('limit',    String(params.limit))
  if (params.approved !== undefined) qs.set('approved', String(params.approved))
  return adminFetch(`/api/admin/reviews?${qs}`)
}

export async function approveReview(id: string): Promise<ApiReview> {
  return adminFetch<ApiReview>(`/api/admin/reviews/${id}/approve`, { method: 'PATCH' })
}

export async function deleteReview(id: string): Promise<void> {
  await adminFetch(`/api/admin/reviews/${id}`, { method: 'DELETE' })
}

// ════════════════════════════════════════════════════════════════
// BLOG
// ════════════════════════════════════════════════════════════════

export async function fetchBlogPosts(): Promise<ApiBlogPost[]> {
  const res = await adminFetch<{ data: ApiBlogPost[]; totalCount: number }>('/api/admin/blog?limit=100')
  return res.data ?? []
}

export async function createBlogPost(data: Partial<ApiBlogPost>): Promise<ApiBlogPost> {
  return adminFetch<ApiBlogPost>('/api/admin/blog', {
    method: 'POST',
    body:   JSON.stringify(data),
  })
}

export async function updateBlogPost(id: string, data: Partial<ApiBlogPost>): Promise<ApiBlogPost> {
  return adminFetch<ApiBlogPost>(`/api/admin/blog/${id}`, {
    method: 'PUT',
    body:   JSON.stringify(data),
  })
}

export async function deleteBlogPost(id: string): Promise<void> {
  await adminFetch(`/api/admin/blog/${id}`, { method: 'DELETE' })
}

// ════════════════════════════════════════════════════════════════
// ANALYTICS
// ════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════
// ANALYTICS  (Phase 11 — real-data endpoints)
// ════════════════════════════════════════════════════════════════

export type AnalyticsRange = 'today' | '7d' | '30d' | '6m' | '1y' | 'custom'

export interface AnalyticsOverview {
  total_revenue:       number
  revenue_this_month:  number
  revenue_trend:       number
  total_orders:        number
  orders_this_month:   number
  orders_trend:        number
  avg_order_value:     number
  total_customers:     number
  new_customers_month: number
  returning_customers: number
  cancelled_rate:      number
  best_seller:         { id: string; name: string; units: number } | null
  low_stock_count:     number
  out_of_stock_count:  number
}

export interface AnalyticsRevenue {
  range:           string
  bucket:          'day' | 'week' | 'month'
  series:          { label: string; revenue: number; orders: number; aov: number }[]
  total_revenue:   number
  total_orders:    number
  avg_order_value: number
  revenue_trend:   number
  orders_trend:    number
  prev_revenue:    number
  prev_orders:     number
}

export interface AnalyticsProducts {
  range:          string
  top_products:   { id: string; name: string; category: string; units: number; revenue: number }[]
  slow_products:  { id: string; name: string; category: string; units: number }[]
  low_stock:      { id: string; name: string; count: number; category: string }[]
  out_of_stock:   { id: string; name: string; category: string }[]
  category_sales: { category: string; units: number; revenue: number }[]
}

export interface AnalyticsOrders {
  range: string
  status_counts: {
    pending: number; processing: number; confirmed: number
    shipped: number; delivered: number; cancelled: number
  }
  other_statuses:    Record<string, number>
  trend:             { label: string; orders: number }[]
  payment_breakdown: { status: string; count: number }[]
  payment_available: boolean
}

export interface AnalyticsCustomers {
  range:           string
  new_in_window:   number
  new_trend:       { label: string; customers: number }[]
  order_frequency: { one: number; two: number; three_plus: number; repeat: number }
  top_customers:   { id: string; name: string; email: string; spent: number; orders: number }[]
  city_breakdown:  { city: string; customers: number }[]
  city_coverage:   number
}

function rangeQS(range: AnalyticsRange, start?: string, end?: string): string {
  const qs = new URLSearchParams({ range })
  if (range === 'custom' && start && end) { qs.set('start', start); qs.set('end', end) }
  return qs.toString()
}

export async function fetchAnalyticsOverview(): Promise<AnalyticsOverview> {
  return adminFetch<AnalyticsOverview>('/api/admin/analytics/overview')
}
export async function fetchAnalyticsRevenue(range: AnalyticsRange = '30d', start?: string, end?: string): Promise<AnalyticsRevenue> {
  return adminFetch<AnalyticsRevenue>(`/api/admin/analytics/revenue?${rangeQS(range, start, end)}`)
}
export async function fetchAnalyticsProducts(range: AnalyticsRange = '30d', start?: string, end?: string): Promise<AnalyticsProducts> {
  return adminFetch<AnalyticsProducts>(`/api/admin/analytics/products?${rangeQS(range, start, end)}`)
}
export async function fetchAnalyticsOrders(range: AnalyticsRange = '30d', start?: string, end?: string): Promise<AnalyticsOrders> {
  return adminFetch<AnalyticsOrders>(`/api/admin/analytics/orders?${rangeQS(range, start, end)}`)
}
export async function fetchAnalyticsCustomers(range: AnalyticsRange = '30d', start?: string, end?: string): Promise<AnalyticsCustomers> {
  return adminFetch<AnalyticsCustomers>(`/api/admin/analytics/customers?${rangeQS(range, start, end)}`)
}

// ════════════════════════════════════════════════════════════════
// SETTINGS
// ════════════════════════════════════════════════════════════════

export async function fetchStoreSettings(): Promise<Record<string, unknown>> {
  return adminFetch('/api/admin/settings')
}

export async function updateStoreSettings(
  data: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  return adminFetch('/api/admin/settings', {
    method: 'PUT', body: JSON.stringify(data),
  })
}

// ════════════════════════════════════════════════════════════════
// ADMIN PROFILE  (Phase 12)
// ════════════════════════════════════════════════════════════════

export interface AdminProfile {
  id:              string
  name:            string | null
  email:           string | null
  phone:           string | null
  profile_picture: string | null
  role?:           number | null
}

export async function fetchProfile(): Promise<AdminProfile> {
  return adminFetch<AdminProfile>('/api/user/profile')
}

export async function updateProfile(data: { name?: string; phone?: string }): Promise<AdminProfile> {
  return adminFetch<AdminProfile>('/api/user/profile', {
    method: 'PUT',
    body:   JSON.stringify(data),
  })
}

export async function uploadAvatar(file: File): Promise<{ url: string; profile_picture?: string }> {
  const fd = new FormData()
  fd.append('file', file)
  return adminFormFetch<{ url: string; profile_picture?: string }>('/api/user/avatar', fd, 'POST')
}

export async function changePassword(oldPassword: string, newPassword: string): Promise<{ message: string }> {
  return adminFetch<{ message: string }>('/api/user/change-password', {
    method: 'POST',
    body:   JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
  })
}

// ── Store settings extras ──
export interface IntegrationsStatus {
  razorpay:   boolean
  cloudinary: boolean
}

export async function fetchIntegrationsStatus(): Promise<IntegrationsStatus> {
  return adminFetch<IntegrationsStatus>('/api/admin/settings/integrations-status')
}

export async function uploadStoreLogo(file: File): Promise<{ url: string }> {
  const fd = new FormData()
  fd.append('file', file)
  return adminFormFetch<{ url: string }>('/api/admin/settings/upload-logo', fd, 'POST')
}

// ════════════════════════════════════════════════════════════════
// LOW STOCK  (Phase 3 — item 11)
// ════════════════════════════════════════════════════════════════

export interface ApiLowStockItem {
  id:       string
  name:     string
  count:    number
  category: string | null
}

/**
 * Products at or below `threshold` units (active products only).
 * Backed by GET /api/admin/low-stock — see app/admin/routers.py.
 */
export async function fetchLowStock(threshold = 10): Promise<ApiLowStockItem[]> {
  return adminFetch<ApiLowStockItem[]>(`/api/admin/low-stock?threshold=${threshold}`)
}