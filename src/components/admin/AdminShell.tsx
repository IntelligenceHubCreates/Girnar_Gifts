'use client'

import { useState } from 'react'
import Sidebar from '@/components/admin/layout/Sidebar'
import Topbar from '@/components/admin/layout/Topbar'
import DashboardPage from '@/components/admin/pages/DashboardPage'
import OrdersPage from '@/components/admin/pages/OrdersPage'
import ProductsPage from '@/components/admin/pages/ProductsPage'
import { CustomersPage, CategoriesPage, CouponsPage, ReviewsPage } from '@/components/admin/pages/OtherPages'
import BlogPage from '@/components/admin/pages/BlogPage'
import AnalyticsPage from '@/components/admin/pages/AnalyticsPage'
import SettingsPage from '@/components/admin/pages/SettingsPage'
import type { PageId } from '@/lib/adminData'

const PAGE_COMPONENTS: Record<PageId, React.ComponentType> = {
  dashboard:  DashboardPage,
  orders:     OrdersPage,
  products:   ProductsPage,
  customers:  CustomersPage,
  categories: CategoriesPage,
  coupons:    CouponsPage,
  reviews:    ReviewsPage,
  blog:       BlogPage,
  analytics:  AnalyticsPage,
  settings:   SettingsPage,
}

export default function AdminShell() {
  const [activePage, setActivePage] = useState<PageId>('dashboard')
  const ActivePage = PAGE_COMPONENTS[activePage]

  return (
    <div className="admin-layout">
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      <div className="admin-main">
        <Topbar activePage={activePage} />
        <div className="page-wrap">
          <ActivePage />
        </div>
      </div>
    </div>
  )
}
