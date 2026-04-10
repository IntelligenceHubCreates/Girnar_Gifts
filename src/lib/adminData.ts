// ─── Navigation ──────────────────────────────────────────────────────────────
export type PageId =
  | 'dashboard' | 'orders' | 'products' | 'customers'
  | 'categories' | 'coupons' | 'reviews' | 'blog'
  | 'analytics' | 'settings'

export interface NavItem {
  id: PageId
  icon: string
  label: string
  badge?: number
}

export const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: 'Main',
    items: [
      { id: 'dashboard', icon: '📊', label: 'Dashboard' },
      { id: 'orders',    icon: '📦', label: 'Orders',    badge: 14 },
      { id: 'products',  icon: '🧸', label: 'Products' },
      { id: 'customers', icon: '👤', label: 'Customers' },
    ],
  },
  {
    title: 'Store',
    items: [
      { id: 'categories', icon: '🗂️', label: 'Categories' },
      { id: 'coupons',    icon: '🏷️', label: 'Coupons' },
      { id: 'reviews',    icon: '⭐',  label: 'Reviews', badge: 3 },
      { id: 'blog',       icon: '✏️', label: 'Blog' },
    ],
  },
  {
    title: 'System',
    items: [
      { id: 'analytics', icon: '📈', label: 'Analytics' },
      { id: 'settings',  icon: '⚙️', label: 'Settings' },
    ],
  },
]

export const PAGE_META: Record<PageId, { title: string; section: string; sub: string }> = {
  dashboard:  { title: 'Dashboard',  section: 'Overview',     sub: 'Welcome back, Varsha 👋' },
  orders:     { title: 'Orders',     section: 'Management',   sub: '847 total · ₹2.34L this month' },
  products:   { title: 'Products',   section: 'Catalog',      sub: '840 products · 6 categories' },
  customers:  { title: 'Customers',  section: 'Database',     sub: '3,412 registered customers' },
  categories: { title: 'Categories', section: 'Manager',      sub: '6 active categories' },
  coupons:    { title: 'Coupons',    section: 'Discounts',    sub: '12 active promo codes' },
  reviews:    { title: 'Reviews',    section: 'Moderation',   sub: '4.6 avg rating · 1,248 reviews' },
  blog:       { title: 'Blog',       section: 'Manager',      sub: '3 published · 2 drafts · 12.4K total views' },
  analytics:  { title: 'Analytics',  section: 'Reports',      sub: 'Traffic, conversions & sales insights — last 30 days' },
  settings:   { title: 'Settings',   section: 'Configuration', sub: 'Store preferences & integrations' },
}
