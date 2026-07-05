'use client'

import { signOut } from 'next-auth/react'
import { NAV_GROUPS, PageId } from '@/lib/adminData'
import { brand } from '@/config/brand'

interface SidebarProps {
  activePage: PageId
  onNavigate: (id: PageId) => void
  /** drawer open state (mobile/tablet) */
  open?: boolean
  /** close the drawer */
  onClose?: () => void
  /** optional live badge counts from the parent */
  badges?: Partial<Record<PageId, number>>
}

export default function Sidebar({ activePage, onNavigate, open = false, onClose, badges }: SidebarProps) {
  return (
    <aside className={`sidebar${open ? ' is-open' : ''}`} aria-label="Admin navigation">
      {/* Logo */}
      <div className="s-logo">
        <div className="s-logo-icon">🎀</div>
        <div className="s-logo-text-wrap">
          <div className="s-logo-text">Little<em>Loot</em></div>
          <div className="s-logo-sub">Admin Panel</div>
        </div>
        {/* Drawer-only close (hidden on desktop via CSS) */}
        <button className="s-drawer-close" type="button" onClick={onClose} aria-label="Close menu">✕</button>
      </div>

      {/* Scrollable nav */}
      <nav className="sidebar-nav">
        {NAV_GROUPS.map((group) => (
          <div key={group.title} className="s-group">
            <div className="s-section">{group.title}</div>
            {group.items.map((item) => {
              const badge = badges?.[item.id] ?? item.badge
              const isActive = activePage === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`s-item${isActive ? ' active' : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => onNavigate(item.id)}
                >
                  <span className="s-icon">{item.icon}</span>
                  <span className="s-label">{item.label}</span>
                  {badge ? <span className="s-badge">{badge}</span> : null}
                </button>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="s-footer">
        <div className="s-avatar">{brand.shortName[0]}</div>
        <div className="s-footer-info">
          <div className="s-user-name">{brand.name}</div>
          <div className="s-user-role">Store Administrator</div>
        </div>
        <button
          className="s-logout"
          type="button"
          title="Logout"
          onClick={() => signOut({ callbackUrl: '/login' })}
        >↩</button>
      </div>
    </aside>
  )
}