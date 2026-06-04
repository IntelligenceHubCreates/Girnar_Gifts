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
  // Derived fields (not from backend)
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
  children:    ApiCategory[]
}

export interface ApiCustomer {
  id:           string
  name:         string
  email:        string
  phone:        string
  city:         string
  total_orders: number
  total_spent:  number
  created_at:   string
  is_active:    boolean
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
    delivered:   number
    processing:  number
    pending:     number
    cancelled:   number
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

export function normalizeOrder(raw: RawBackendOrder): ApiOrder {
  const addr     = parseShippingAddress(raw.shipping_address)
  const id       = raw.id ?? ''
  const orderNum = id.slice(0, 8).toUpperCase()

  const items: OrderItem[] = (raw.order_items ?? []).map((i) => ({
    product_id: i.product_id  ?? '',
    name:       i.product?.name ?? (i as any).name ?? '—',
    qty:        i.quantity    ?? 1,
    price:      i.price       ?? 0,
    color:      i.color       ?? i.product?.color     ?? null,
    color_hex:  i.color_hex   ?? i.product?.color_hex ?? null,
    image:      (i as any).image ?? i.product?.product_image?.[0]?.url ?? null,
  }))

  return {
    id,
    user_id:        raw.user_id       ?? '',
    order_number:   orderNum,
    customer_name:  `#${(raw.user_id ?? '').slice(0, 8).toUpperCase()}`,
    customer_email: '—',
    customer_phone: '—',
    address:        addr.street,
    city:           addr.city,
    state:          addr.state,
    pincode:        addr.pincode,
    payment_method: '—',
    payment_status: '—',
    notes:          '',
    items,
    total_amount:   raw.total_amount  ?? 0,
    status:         raw.status        ?? 'pending',
    created_at:     raw.created_at    ?? raw.order_date ?? new Date().toISOString(),
    updated_at:     raw.updated_at    ?? raw.created_at ?? new Date().toISOString(),
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
      message = json?.detail ?? json?.message ?? body
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
  skip?:     number
  limit?:    number
  category?: string
  search?:   string
  in_stock?: boolean
  on_sale?:  boolean
} = {}): Promise<ApiProductListResponse> {
  const qs = new URLSearchParams()
  if (params.skip     !== undefined) qs.set('skip',     String(params.skip))
  if (params.limit    !== undefined) qs.set('limit',    String(params.limit))
  if (params.category)               qs.set('category', params.category)
  if (params.search)                 qs.set('search',   params.search)
  if (params.in_stock)               qs.set('in_stock', 'true')
  if (params.on_sale)                qs.set('on_sale',  'true')

  const url = `http://localhost:8000/api/product/all?${qs}`
  const res = await fetch(url, { cache: 'no-store' })
  return res.json()
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
    const res = await fetch(`http://localhost:8000/api/product/${id}`, { cache: 'no-store' })
    if (!res.ok) return null
    return res.json()
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

export async function deleteCategory(id: string): Promise<void> {
  await adminFetch(`/api/categories/${id}`, { method: 'DELETE' })
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
  skip?:    number
  limit?:   number
  status?:  string
  search?:  string
  sortBy?:  string
  sortDir?: 'asc' | 'desc'
} = {}): Promise<ApiOrdersResult> {
  const qs = new URLSearchParams()
  if (params.skip  !== undefined) qs.set('skip',    String(params.skip))
  if (params.limit !== undefined) qs.set('limit',   String(params.limit))
  if (params.status)              qs.set('status',  params.status)
  if (params.search)              qs.set('search',  params.search)

  const backendSortBy = SORT_FIELD_MAP[params.sortBy ?? 'created_at'] ?? 'created_at'
  qs.set('sortBy',  backendSortBy)
  qs.set('sortDir', params.sortDir ?? 'desc')

  const raw = await adminFetch<
    RawBackendOrder[] | { data: RawBackendOrder[]; totalCount?: number }
  >(`/api/admin/orders?${qs}`)

  const rawList: RawBackendOrder[] = Array.isArray(raw)
    ? raw
    : (raw as any).data ?? (raw as any).orders ?? []

  const totalCount: number = Array.isArray(raw)
    ? rawList.length
    : ((raw as any).totalCount ?? (raw as any).total ?? rawList.length)

  return {
    orders:     rawList.map(normalizeOrder),
    totalCount,
  }
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
  return adminFetch<ApiBlogPost[]>('/api/admin/blog')
}

export async function createBlogPost(
  data: Omit<ApiBlogPost, 'id' | 'views' | 'comments' | 'likes' | 'created_at' | 'updated_at'>,
): Promise<ApiBlogPost> {
  return adminFetch<ApiBlogPost>('/api/admin/blog', {
    method: 'POST', body: JSON.stringify(data),
  })
}

export async function updateBlogPost(id: string, data: Partial<ApiBlogPost>): Promise<ApiBlogPost> {
  return adminFetch<ApiBlogPost>(`/api/admin/blog/${id}`, {
    method: 'PUT', body: JSON.stringify(data),
  })
}

export async function deleteBlogPost(id: string): Promise<void> {
  await adminFetch(`/api/admin/blog/${id}`, { method: 'DELETE' })
}

// ════════════════════════════════════════════════════════════════
// ANALYTICS
// ════════════════════════════════════════════════════════════════

export async function fetchAnalytics(period: '7D' | '30D' | '1Y' = '30D'): Promise<{
  kpis:    ApiDashboardStats
  traffic: { source: string; visits: number; pct: number }[]
  geo:     { city: string; visits: number }[]
  funnel:  { step: string; count: number }[]
  chart:   { label: string; revenue: number; orders: number; visitors: number }[]
}> {
  return adminFetch(`/api/admin/analytics?period=${period}`)
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