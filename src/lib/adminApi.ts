/**
 * adminApi.ts
 * All admin API calls. Uses fetch with JWT from NextAuth session.
 * Backend: FastAPI at BACKEND_URL (proxied via Next.js middleware /api/*)
 */

import { getSession } from 'next-auth/react'

// ── Types ─────────────────────────────────────────────────────────

export interface ApiProduct {
  id: string
  name: string
  category: string | null
  category_id: string | null
  sub_category_slug: string | null
  sub_category_name: string | null
  description: string | null
  details: string[]
  original_price: number
  amount_discount: number
  percentage_discount: number
  count: number
  product_image: { url: string; public_id: string }[]
  brand: string | null
  age_range: string | null
  is_new: boolean
  is_featured: boolean
  is_active: boolean
  offer_expiration_date: string | null
  created_at: string | null
  variant_group_id?: string | null
  color?:            string | null
  color_hex?:        string | null
}

export interface ApiProductListResponse {
  data: ApiProduct[]
  totalCount: number
  page: number
  limit: number
}

export interface ApiCategory {
  id: string
  name: string
  slug: string
  parent_id: string | null
  emoji: string | null
  description: string | null
  sort_order: number
  is_active: boolean
  children: ApiCategory[]
}

// ── Order item — includes color variant fields ─────────────────────
export interface ApiOrderItem {
  product_id: string
  name:       string
  qty:        number
  price:      number
  // Color variant — saved at checkout so owner knows which color was ordered
  color?:     string | null   // e.g. "Pink"
  color_hex?: string | null   // e.g. "#F4A7B9"
  image?:     string | null   // color-specific product image URL
}

export interface ApiOrder {
  id: string
  order_number: string
  user_id: string
  customer_name: string
  customer_email: string
  customer_phone: string
  city: string
  state?: string
  pincode?: string
  address: string
  notes?: string
  items: ApiOrderItem[]   // ← now uses ApiOrderItem with color fields
  total_amount: number
  payment_method: string
  payment_status: string
  status: string
  created_at: string
  updated_at: string
  // Raw backend fields (present before normalisation)
  order_items?: {
    product_id: string
    name?: string
    qty?: number
    quantity?: number
    price?: number
    color?:     string | null
    color_hex?: string | null
    image?:     string | null
  }[]
  order_date?:       string
  shipping_address?: string
  order_no?:         string
}

export interface ApiOrderListResponse {
  data: ApiOrder[]
  totalCount: number
  page: number
  limit: number
}

export interface ApiCustomer {
  id: string
  name: string
  email: string
  phone: string
  city: string
  total_orders: number
  total_spent: number
  created_at: string
  is_active: boolean
}

export interface ApiCustomerListResponse {
  data: ApiCustomer[]
  totalCount: number
  page: number
  limit: number
}

export interface ApiDashboardStats {
  revenue_this_month: number
  orders_this_month: number
  total_customers: number
  return_rate: number
  revenue_trend: number
  orders_trend: number
  customers_trend: number
  order_status_counts: {
    delivered: number
    processing: number
    pending: number
    cancelled: number
  }
  recent_orders: ApiOrder[]
  top_products: { id: string; name: string; category: string; price: number; sold: number }[]
  revenue_chart: { label: string; revenue: number; orders: number }[]
}

export interface ApiCoupon {
  id: string
  code: string
  discount_type: 'percentage' | 'flat'
  discount_value: number
  min_order: number
  max_uses: number
  used_count: number
  is_active: boolean
  expires_at: string | null
  created_at: string
}

export interface ApiReview {
  id: string
  product_id: string
  product_name: string
  user_id: string
  customer_name: string
  rating: number
  comment: string
  is_approved: boolean
  created_at: string
}

export interface ApiBlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  tag: string
  status: 'published' | 'draft'
  views: number
  comments: number
  likes: number
  created_at: string
  updated_at: string
}

// ── Core fetcher ──────────────────────────────────────────────────

async function adminFetch<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const session = await getSession()
  const token = (session as any)?.accessToken ?? ''

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
    throw new Error(`API ${res.status}: ${body || res.statusText}`)
  }
  if (res.status === 204) return {} as T
  return res.json()
}

/** For multipart/form-data (file uploads) — no Content-Type header so browser sets boundary */
async function adminFormFetch<T>(path: string, form: FormData, method = 'POST'): Promise<T> {
  const session = await getSession()
  const token = (session as any)?.accessToken ?? ''

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

// ── Dashboard ─────────────────────────────────────────────────────

export async function fetchDashboardStats(): Promise<ApiDashboardStats> {
  return adminFetch<ApiDashboardStats>('/api/admin/dashboard')
}

// ── Products ──────────────────────────────────────────────────────

export async function fetchAdminProducts(params: {
  skip?: number
  limit?: number
  category?: string
  search?: string
  in_stock?: boolean
  on_sale?: boolean
} = {}): Promise<ApiProductListResponse> {
  const qs = new URLSearchParams()
  if (params.skip !== undefined) qs.set('skip', String(params.skip))
  if (params.limit !== undefined) qs.set('limit', String(params.limit))
  if (params.category) qs.set('category', params.category)
  if (params.search) qs.set('search', params.search)
  if (params.in_stock) qs.set('in_stock', 'true')
  if (params.on_sale) qs.set('on_sale', 'true')

  const url = `http://localhost:8000/api/product/all?${qs}`
  console.log('[fetchAdminProducts] calling:', url)
  const res = await fetch(url, { cache: 'no-store' })
  const data = await res.json()
  console.log('[fetchAdminProducts] got page:', data.page)
  return data
}

export async function createProduct(form: FormData): Promise<ApiProduct> {
  return adminFormFetch<ApiProduct>('/api/product', form, 'POST')
}

export async function updateProduct(id: string, form: FormData): Promise<ApiProduct> {
  return adminFormFetch<ApiProduct>(`/api/product/${id}`, form, 'PUT')
}

export async function deleteProduct(id: string): Promise<void> {
  await adminFetch(`/api/product/${id}`, { method: 'DELETE' })
}

// ── Categories ────────────────────────────────────────────────────

export async function fetchCategories(): Promise<ApiCategory[]> {
  return adminFetch<ApiCategory[]>('/api/categories')
}

export async function createCategory(data: {
  name: string; slug: string; parent_id?: string
  emoji?: string; description?: string; sort_order?: number
}): Promise<ApiCategory> {
  return adminFetch<ApiCategory>('/api/categories', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateCategory(id: string, data: Partial<ApiCategory>): Promise<ApiCategory> {
  return adminFetch<ApiCategory>(`/api/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteCategory(id: string): Promise<void> {
  await adminFetch(`/api/categories/${id}`, { method: 'DELETE' })
}

// ── Orders ────────────────────────────────────────────────────────

export async function fetchAdminOrders(params: {
  skip?: number
  limit?: number
  status?: string
  search?: string
  sortBy?: string
  sortDir?: 'asc' | 'desc'
} = {}): Promise<ApiOrderListResponse | ApiOrder[]> {
  const qs = new URLSearchParams()
  if (params.skip    !== undefined) qs.set('skip',    String(params.skip))
  if (params.limit   !== undefined) qs.set('limit',   String(params.limit))
  if (params.status)                qs.set('status',  params.status)
  if (params.search)                qs.set('search',  params.search)
  if (params.sortBy)                qs.set('sortBy',  params.sortBy)
  if (params.sortDir)               qs.set('sortDir', params.sortDir)
  return adminFetch<ApiOrderListResponse | ApiOrder[]>(`/api/admin/orders?${qs}`)
}

export async function updateOrderStatus(id: string, status: string): Promise<ApiOrder> {
  return adminFetch<ApiOrder>(`/api/admin/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

export async function deleteOrder(id: string): Promise<void> {
  await adminFetch(`/api/admin/orders/${id}`, { method: 'DELETE' })
}

export async function exportOrdersCSV(params: {
  status?: string
  search?: string
  sortBy?: string
  sortDir?: 'asc' | 'desc'
} = {}): Promise<Blob> {
  const session = await getSession()
  const token = (session as any)?.accessToken ?? ''

  const qs = new URLSearchParams()
  if (params.status)  qs.set('status',  params.status)
  if (params.search)  qs.set('search',  params.search)
  if (params.sortBy)  qs.set('sortBy',  params.sortBy)
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

// ── Customers ─────────────────────────────────────────────────────

export async function fetchAdminCustomers(params: {
  skip?: number; limit?: number; search?: string; segment?: string
} = {}): Promise<ApiCustomerListResponse> {
  const qs = new URLSearchParams()
  if (params.skip !== undefined) qs.set('skip', String(params.skip))
  if (params.limit !== undefined) qs.set('limit', String(params.limit))
  if (params.search) qs.set('search', params.search)
  if (params.segment) qs.set('segment', params.segment)
  return adminFetch<ApiCustomerListResponse>(`/api/admin/customers?${qs}`)
}

export async function deleteCustomer(id: string): Promise<void> {
  await adminFetch(`/api/admin/customers/${id}`, { method: 'DELETE' })
}

// ── Coupons ───────────────────────────────────────────────────────

export async function fetchCoupons(): Promise<ApiCoupon[]> {
  return adminFetch<ApiCoupon[]>('/api/admin/coupons')
}

export async function createCoupon(data: Omit<ApiCoupon, 'id' | 'used_count' | 'created_at'>): Promise<ApiCoupon> {
  return adminFetch<ApiCoupon>('/api/admin/coupons', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateCoupon(id: string, data: Partial<ApiCoupon>): Promise<ApiCoupon> {
  return adminFetch<ApiCoupon>(`/api/admin/coupons/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteCoupon(id: string): Promise<void> {
  await adminFetch(`/api/admin/coupons/${id}`, { method: 'DELETE' })
}

// ── Reviews ───────────────────────────────────────────────────────

export async function fetchAdminReviews(params: {
  skip?: number; limit?: number; approved?: boolean
} = {}): Promise<{ data: ApiReview[]; totalCount: number }> {
  const qs = new URLSearchParams()
  if (params.skip !== undefined) qs.set('skip', String(params.skip))
  if (params.limit !== undefined) qs.set('limit', String(params.limit))
  if (params.approved !== undefined) qs.set('approved', String(params.approved))
  return adminFetch(`/api/admin/reviews?${qs}`)
}

export async function approveReview(id: string): Promise<ApiReview> {
  return adminFetch<ApiReview>(`/api/admin/reviews/${id}/approve`, { method: 'PATCH' })
}

export async function deleteReview(id: string): Promise<void> {
  await adminFetch(`/api/admin/reviews/${id}`, { method: 'DELETE' })
}

// ── Blog ──────────────────────────────────────────────────────────

export async function fetchBlogPosts(): Promise<ApiBlogPost[]> {
  return adminFetch<ApiBlogPost[]>('/api/admin/blog')
}

export async function createBlogPost(
  data: Omit<ApiBlogPost, 'id' | 'views' | 'comments' | 'likes' | 'created_at' | 'updated_at'>
): Promise<ApiBlogPost> {
  return adminFetch<ApiBlogPost>('/api/admin/blog', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateBlogPost(id: string, data: Partial<ApiBlogPost>): Promise<ApiBlogPost> {
  return adminFetch<ApiBlogPost>(`/api/admin/blog/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteBlogPost(id: string): Promise<void> {
  await adminFetch(`/api/admin/blog/${id}`, { method: 'DELETE' })
}

// ── Analytics ─────────────────────────────────────────────────────

export async function fetchAnalytics(period: '7D' | '30D' | '1Y' = '30D'): Promise<{
  kpis: ApiDashboardStats
  traffic: { source: string; visits: number; pct: number }[]
  geo: { city: string; visits: number }[]
  funnel: { step: string; count: number }[]
  chart: { label: string; revenue: number; orders: number; visitors: number }[]
}> {
  return adminFetch(`/api/admin/analytics?period=${period}`)
}

// ── Settings ──────────────────────────────────────────────────────

export async function fetchStoreSettings(): Promise<Record<string, any>> {
  return adminFetch('/api/admin/settings')
}

export async function updateStoreSettings(data: Record<string, any>): Promise<Record<string, any>> {
  return adminFetch('/api/admin/settings', {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

// ── Product Variants ──────────────────────────────────────────────

export async function fetchProductVariants(productId: string): Promise<ApiProduct[]> {
  const res = await adminFetch<{ variants: ApiProduct[] }>(`/api/product/${productId}/variants`)
  return res?.variants ?? []
}

export async function linkColorVariants(variantIds: string[], groupId: string): Promise<void> {
  await adminFetch('/api/product/admin/link-variants', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      variant_ids:      variantIds,
      variant_group_id: groupId,
    }),
  })
}