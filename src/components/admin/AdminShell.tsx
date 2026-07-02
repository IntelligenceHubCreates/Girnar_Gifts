'use client'

import { useState, useEffect } from 'react'
import type { ComponentType } from 'react'
import Sidebar from '@/components/admin/layout/Sidebar'
import Topbar from '@/components/admin/layout/Topbar'
import DashboardPage from '@/components/admin/pages/DashboardPage'
import OrdersPage from '@/components/admin/pages/OrdersPage'
import ProductsPage from '@/components/admin/pages/ProductsPage'
import { CustomersPage, CategoriesPage, CouponsPage, ReviewsPage } from '@/components/admin/pages/OtherPages'
import BlogPage from '@/components/admin/pages/BlogPage'
import AnalyticsPage from '@/components/admin/pages/AnalyticsPage'
import SettingsPage from '@/components/admin/pages/SettingsPage'
import ReturnsPage from '@/components/admin/pages/ReturnsPage'
import ShippingPage from '@/components/admin/pages/ShippingPage'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import type { PageId } from '@/lib/adminData'

// Pages may optionally receive onNavigate (Dashboard uses it; others ignore it).
type AdminPageProps = { onNavigate?: (id: PageId) => void }

const PAGE_COMPONENTS: Record<PageId, ComponentType<AdminPageProps>> = {
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
  returns:    ReturnsPage,
  shipping:   ShippingPage,
}

export default function AdminShell() {
  const [activePage, setActivePage] = useState<PageId>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // ≤1024px => sidebar is an off-canvas drawer. Above => always-visible.
  const isCompact = useMediaQuery('(max-width: 1024px)')

  const ActivePage = PAGE_COMPONENTS[activePage]

  // Navigate + auto-close the drawer (no-op on desktop where it's already false)
  function handleNavigate(id: PageId) {
    setActivePage(id)
    setSidebarOpen(false)
  }

  // Lock body scroll only while the mobile drawer is actually open
  useEffect(() => {
    if (isCompact && sidebarOpen) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = prev }
    }
  }, [isCompact, sidebarOpen])

  // Growing back to desktop while the drawer was open => reset
  useEffect(() => {
    if (!isCompact && sidebarOpen) setSidebarOpen(false)
  }, [isCompact, sidebarOpen])

  // Escape closes the drawer
  useEffect(() => {
    if (!sidebarOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSidebarOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [sidebarOpen])

  return (
    <div className={`admin-layout${sidebarOpen ? ' drawer-open' : ''}`}>
      <Sidebar
        activePage={activePage}
        onNavigate={handleNavigate}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Backdrop — CSS keeps it display:none on desktop */}
      <div
        className={`sidebar-backdrop${sidebarOpen ? ' show' : ''}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      <div className="admin-main">
        <Topbar
          activePage={activePage}
          onMenuClick={() => setSidebarOpen((v) => !v)}
        />
        <div className="page-wrap">
          <ActivePage onNavigate={handleNavigate} />
        </div>
      </div>
    </div>
  )
}