// ─── Navigation ───────────────────────────────────────────────────────────────

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
      { id: 'orders',    icon: '📦', label: 'Orders' },
      { id: 'products',  icon: '🧸', label: 'Products' },
      { id: 'customers', icon: '👤', label: 'Customers' },
    ],
  },
  {
    title: 'Store',
    items: [
      { id: 'categories', icon: '🗂️', label: 'Categories' },
      { id: 'coupons',    icon: '🏷️', label: 'Coupons' },
      { id: 'reviews',    icon: '⭐',  label: 'Reviews' },
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
  dashboard:  { title: 'Dashboard',  section: 'Overview',      sub: 'Welcome back, Varsha 👋' },
  orders:     { title: 'Orders',     section: 'Management',    sub: 'All customer orders' },
  products:   { title: 'Products',   section: 'Catalog',       sub: 'Manage your product listing' },
  customers:  { title: 'Customers',  section: 'Database',      sub: 'Registered customer profiles' },
  categories: { title: 'Categories', section: 'Manager',       sub: 'Organise product categories' },
  coupons:    { title: 'Coupons',    section: 'Discounts',     sub: 'Promo codes and discount rules' },
  reviews:    { title: 'Reviews',    section: 'Moderation',    sub: 'Customer ratings and feedback' },
  blog:       { title: 'Blog',       section: 'Manager',       sub: 'Published posts and drafts' },
  analytics:  { title: 'Analytics',  section: 'Reports',       sub: 'Traffic, conversions & sales' },
  settings:   { title: 'Settings',   section: 'Configuration', sub: 'Store preferences & integrations' },
}
