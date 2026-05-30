// types/api.ts
// Central type definitions for all API responses used across the admin panel.

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AdminUser {
  id: string
  name: string
  email: string
  role: 'admin' | 'manager'
}

// ─── Dashboard / KPIs ─────────────────────────────────────────────────────────

export interface RevenueStats {
  value: number       // raw number in paise (₹1 = 100)
  formatted: string   // e.g. "₹2.34L"
  trend: number       // % change vs last period (positive = up)
}

export interface OrderStats {
  total: number
  trend: number
}

export interface CustomerStats {
  total: number
  trend: number
}

export interface ReturnStats {
  rate: number        // percentage, e.g. 1.8
  trend: number       // negative = improvement
}

export interface DashboardKPIs {
  revenue: RevenueStats
  orders: OrderStats
  customers: CustomerStats
  returns: ReturnStats
}

// ─── Charts ───────────────────────────────────────────────────────────────────

export interface ChartDataPoint {
  label: string       // "Oct", "Nov" etc.
  revenue: number     // normalised 0–100 for bar height, or raw value
  orders: number
}

export interface AnalyticsChartPoint {
  date: string        // ISO date
  revenue: number
  orders: number
  visitors: number
}

export interface OrderStatusItem {
  label: 'Delivered' | 'Processing' | 'Pending' | 'Cancelled'
  count: number
  percentage: number
  color: string
}

export interface OrderStatusData {
  total: number
  breakdown: OrderStatusItem[]
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export type OrderStatus = 'Delivered' | 'Processing' | 'Pending' | 'Cancelled' | 'Returned'

export interface Order {
  id: string          // e.g. "#LL-2841"
  customer_name: string
  customer_city: string
  items_count: number
  amount: number      // in paise
  amount_formatted: string
  payment_method: 'UPI' | 'Card' | 'COD' | 'Netbanking'
  date: string        // ISO
  date_formatted: string
  status: OrderStatus
}

export interface OrdersResponse {
  orders: Order[]
  total: number
  page: number
  per_page: number
  total_pages: number
  month_revenue: string
}

export interface OrderStatusUpdatePayload {
  status: OrderStatus
}

// ─── Products ─────────────────────────────────────────────────────────────────

export type StockStatus = 'In Stock' | 'Low Stock' | 'Out of Stock'

export interface Product {
  id: string
  name: string
  category: string
  price: number       // in paise
  price_formatted: string
  original_price: number
  original_price_formatted: string
  stock_qty: number
  stock_status: StockStatus
  badges: Array<{ label: string; type: 'sale' | 'new' | 'hot' }>
  image_url?: string
  emoji?: string
  gradient?: string
  created_at: string
  updated_at: string
}

export interface ProductsResponse {
  data: Product[]
  totalCount: number
  page: number
  per_page: number
  total_pages: number
}

export interface CreateProductPayload {
  name: string
  category: string
  price: number
  original_price: number
  stock_qty: number
  emoji?: string
  gradient?: string
  badges?: Array<{ label: string; type: 'sale' | 'new' | 'hot' }>
}

export type UpdateProductPayload = Partial<CreateProductPayload>

// ─── Customers ────────────────────────────────────────────────────────────────

export type CustomerSegment = 'vip' | 'regular' | 'new'

export interface Customer {
  id: string
  name: string
  phone: string
  email: string
  city: string
  orders_count: number
  total_spent: number
  total_spent_formatted: string
  joined_at: string
  joined_formatted: string
  segment: CustomerSegment
}

export interface CustomersResponse {
  customers: Customer[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export interface AnalyticsKPI {
  total_revenue: number
  total_revenue_formatted: string
  store_visits: number
  conversion_rate: number
  avg_order_value: number
  avg_order_value_formatted: string
  avg_session_seconds: number
  revenue_trend: number
  visits_trend: number
  conversion_trend: number
  aov_trend: number
  session_trend: number
}

export interface TrafficSource {
  name: string
  visits: number
  percentage: number
}

export interface GeoCity {
  city: string
  visits: number
  percentage: number
}

export interface FunnelStep {
  step: number
  label: string
  count: number
  drop_percentage: number | null
}

export interface AnalyticsData {
  kpis: AnalyticsKPI
  chart: AnalyticsChartPoint[]
  traffic_sources: TrafficSource[]
  geo: GeoCity[]
  funnel: FunnelStep[]
  device_breakdown: { mobile: number; desktop: number; tablet: number }
}

// ─── Top Products ─────────────────────────────────────────────────────────────

export interface TopProduct {
  id: string
  name: string
  category: string
  price_formatted: string
  units_sold: number
  emoji?: string
  gradient?: string
}

// ─── Activity Feed ────────────────────────────────────────────────────────────

export type ActivityType = 'order' | 'review' | 'coupon' | 'customer' | 'blog' | 'product'

export interface ActivityItem {
  id: string
  type: ActivityType
  message: string
  entity_id?: string
  created_at: string
  time_ago: string
}

// ─── Recent Orders (Dashboard) ────────────────────────────────────────────────

export interface RecentOrdersResponse {
  orders: Order[]
}

// ─── Generic API wrapper ──────────────────────────────────────────────────────

export interface ApiError {
  message: string
  code?: string
  status?: number
}
