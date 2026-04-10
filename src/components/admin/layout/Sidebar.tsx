'use client'

import { NAV_GROUPS, PageId } from '@/lib/adminData'

interface SidebarProps {
  activePage: PageId
  onNavigate: (id: PageId) => void
}

export default function Sidebar({ activePage, onNavigate }: SidebarProps) {
  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="s-logo">
        <div className="s-logo-icon">🎀</div>
        <div>
          <div className="s-logo-text">Little<em>Loot</em></div>
          <div className="s-logo-sub">Admin Panel</div>
        </div>
      </div>

      {/* Scrollable nav */}
      <div className="sidebar-nav">
        {NAV_GROUPS.map((group) => (
          <div key={group.title}>
            <div className="s-section">{group.title}</div>
            {group.items.map((item) => (
              <div
                key={item.id}
                className={`s-item${activePage === item.id ? ' active' : ''}`}
                onClick={() => onNavigate(item.id)}
              >
                <div className="s-icon">{item.icon}</div>
                {item.label}
                {item.badge && (
                  <span className="s-badge">{item.badge}</span>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="s-footer">
        <div className="s-avatar">V</div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div className="s-user-name">Varsha · IH</div>
          <div className="s-user-role">Store Administrator</div>
        </div>
        <button className="s-logout" title="Logout">↩</button>
      </div>
    </aside>
  )
}
